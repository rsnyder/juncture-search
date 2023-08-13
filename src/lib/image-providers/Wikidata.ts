import type { Image, Depicted } from '../../types'
import { licenseUrl } from '../licenses'
import { mwImage } from '../../../functions/mw-utils'
import { toRaw } from 'vue'

export function getImages(entity:any, refresh: boolean = false, limit: number = -1) {
  return new Wikidata(entity, refresh, limit)
}

export class Wikidata {

  id: string = 'wikidata'
  total:number = 0
  
  _depicts: any = {}

  _providerName: string = 'Wikidata'

  _qid: string = ''
  _cacheKey: string = ''
  _refresh: boolean = false
  _end = -1
  _limit = -1

  _images: Image[] = []
  _filteredAndSorted: Image[] = []
  
  _sortBy = 'score'
  _filters: any = []
  _imageExtensions = new Set('jpg jpeg png gif svg tif tiff'.split(' '))

  _sparql_template = `
    SELECT ?item ?label ?description ?copyright ?depicts ?depictsLabel ?rank ?creator ?creatorLabel ?iiif ?url WHERE {
      {
        ?item (wdt:P170 | wdt:P180) wd:{{qid}};
              rdfs:label ?label;
              schema:description ?description ;
              wdt:P18 ?url .
        FILTER (lang(?label) = "en")
        FILTER (lang(?description) = "en")
        OPTIONAL { ?item wdt:P6216 ?copyright . }
        OPTIONAL { 
          ?item p:P180 [ ps:P180 ?depicts; wikibase:rank ?rank ] . 
          ?depicts rdfs:label ?depictsLabel .
          FILTER (lang(?depictsLabel) = "en")
        }
        OPTIONAL { 
          ?item p:P170 [ ps:P170 ?creator ] . 
          ?creator rdfs:label ?creatorLabel .
          FILTER (lang(?creatorLabel) = "en")
        }
        OPTIONAL { ?item wdt:P6108 ?iiif . }
      } UNION {
        BIND(wd:{{qid}} as ?item)
        BIND(wd:{{qid}} as ?depicts)
        ?item wdt:P18 ?url .
        ?depicts rdfs:label ?depictsLabel .
        FILTER (lang(?depictsLabel) = "en")
      }
    }
  `
  constructor(entity:any, refresh: boolean = false, limit: number = -1) {
    this._qid = entity.id
    this._cacheKey = `${this.id}-${this._qid}`
    this._refresh = refresh
    this._limit = limit
    console.log(`${this.id}: qid=${this._qid} refresh=${this._refresh} limit=${this._limit}`)
  }

  reset() {
    this._end = this._end > 0 ? 0 : this._end
  }

  async next(): Promise<Image[]> {
    if (this._end < 0) {
      this._end = 0
      await this._doQuery()
    }
    let start = this._end
    this._end = Math.min(this._end + 50, this._filteredAndSorted?.length || 0)
    let images = this._filteredAndSorted?.slice(start, this._end)
    // console.log(`${this.id}.next end=${this._end} images=${this._filteredAndSorted.length} returned=${images.length}`)
    return images
  }

  async getDepicts() {
    if (this._end < 0) {
      this._end = 0
      await this._doQuery()
    }
    this._images.forEach((img:Image) => {
      (img.depicts || []).forEach(d => {
        if (this._depicts[d.id] )this._depicts[d.id]++
        else this._depicts[d.id] = 1
      })
    })
    return this._depicts
  }
  
  imageSelected(image: Image) {
    console.log(`${this.id}.selected: ${image.id}`)
  }

  async _doQuery() {
  
    if (!this._refresh) {
      let cachedResults = await fetch(`/api/cache/${this._cacheKey}`)
      if (cachedResults.ok) {
        this._images = await cachedResults.json()
        this._filterAndSort()
        console.log(`${this.id}.doQuery: qid=${this._qid} images=${this._images.length} from_cache=true`)
        return
      }
    }
  
    let query = this._sparql_template.replace(/{{qid}}/g, this._qid).trim()
    let resp = await fetch(`https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}`, {
      headers: { Accept: 'application/sparql-results+json'}
    })
    if (resp.ok) {
      let _resp = await resp.json()
      let data = {}
      _resp.results.bindings.map(b => {
        try {
          let id = b.item.value.split('/').pop()
          let file = decodeURIComponent(b.url.value.split('/').pop())
          if (!data[id]) data[id] = {
            api: 'wikidata',
            id,
            file,
            source: `https://commons.wikimedia.org/wiki/File:${file.replace(/ /g, '_').replace(/\?/g,'%3F')}`,
            provider: 'Wikimedia Commons',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Commons-logo.svg/178px-Commons-logo.svg.png',
            url: mwImage(file),
            thumbnail: mwImage(file, 400),
            iiif: b.iiif?.value || `https://iiif.juncture-digital.org/wc:${file.replace(/\s/g,'_')}/manifest.json`,
            depicts: [],
          }
          let isPublicDomain = b.copyright?.value.split('/').pop() === 'Q19652'
          let license = licenseUrl(b.license?.value.replace(/http:/, 'https:').replace(/\/$/, '') || (isPublicDomain ? 'PD' : 'unknown'))
          data[id].license = license
    
          if (b.label?.value) data[id].title = b.label.value
          if (b.description?.value) data[id].description = b.description.value
          if (b.creator) data[id].creator = { id: b.creator.value.split('/').pop(), label: b.creatorLabel?.value }
    
          let depictedId = b.depicts?.value.split('/').pop()
          if (depictedId) {
            let depicted:Depicted = { id: depictedId, label: b.depictsLabel?.value || depictedId}
            if (b.rank?.value.split('#').pop().replace('Rank', '') === 'Preferred') depicted.prominent = true
            if (b.dro?.value.split('/').pop() === depicted) depicted.dro = true
            data[id].depicts.push(depicted)
          }
    
        } catch (e) {
          console.trace(e)
          console.log(b)
        }
      })
      let images = this._scoreImages(
        Object.values(data).filter((item:any) => this._imageExtensions.has(item.url.split('.').pop().toLowerCase()))
      )
      images = images.filter(i => i.license !== 'UNKNOWN')
      await this._getImageInfo(images)
      this.total = images.length
      this._images = images
      console.log(`${this.id}.doQuery: qid=${this._qid} images=${this._images.length} from_cache=false`)
    }
  
    this._filterAndSort()
    if (this._images?.length) this._cacheResults()
    // console.log(`${this._providerId}.doQuery: qid=${this._qid} images=${this._images.length} from_cache=false`)

  }

  async _getImageInfo(images:Image[]) {
    let infoNeeded = images.filter(i => !i.width)
    for (let i=0; i < infoNeeded.length; i += 50) {
      let titles = infoNeeded.slice(i, i + 50).map(i => `File:${i.file?.replace(/ /g, '_').replace(/\?/g,'%3F')}`).join('|')
      let url = `https://commons.wikimedia.org/w/api.php?origin=*&format=json&action=query&titles=${titles}&prop=imageinfo&iiprop=extmetadata|size|mime`
      let resp:any = await fetch(url)
      if (resp.ok) {
        let _resp = await resp.json()
        Object.values(_resp.query.pages).forEach((page:any) => {
          let image = images.find(i => i.file === page.title.replace('File:', ''))
          if (image) {
            image.width = page.imageinfo[0].width
            image.height = page.imageinfo[0].height
            image.aspect_ratio = Number((page.imageinfo[0].width/page.imageinfo[0].height).toFixed(2))
            image.format = page.imageinfo[0].mime
            image.license = page.imageinfo[0].extmetadata.LicenseUrl?.value.replace(/http:/, 'https:').replace(/\/$/, '') || licenseUrl(page.imageinfo[0].extmetadata.License?.value)
          }
        })
      }
    }
    return images
  }

  _filterAndSort(sortBy: string = this._sortBy, filters: any = this._filters) {
    this._sortBy = sortBy
    this._filters = filters
    this._end = 0
    if (this._sortBy === 'score')
      this._filteredAndSorted = [...this._images.sort((a: any, b: any) => b.score - a.score)]
    else if (this._sortBy === 'size')
      this._filteredAndSorted = [...this._filteredAndSorted.sort((a: any, b: any) => b.size - a.size)]
    if (this._limit >= 0) this._filteredAndSorted = this._filteredAndSorted.slice(0, this._limit)
    this.total = this._filteredAndSorted.length
    // console.log(`${this._providerId}.filterAndSort: sortby=${this._sortBy} images=${this.total}`)
    return this
  }

  _cacheResults() {
    fetch(`/api/cache/${this._cacheKey}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this._images)
    })
  }

  _scoreImages(images) {
    return images.map(img => {
      img.score = 0
      if (img.imageQualityAssessment === 'featured') img.score += 3
      else if (img.imageQualityAssessment === 'quality') img.score += 2
      else if (img.imageQualityAssessment === 'valued') img.score += 1
      return img
    })
  }

}