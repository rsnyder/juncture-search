import type { Image } from '../../types'
import { licenseUrl } from '../licenses'
import { mwImage } from '../../../functions/mw-utils'
import { toRaw } from 'vue'

export function getImages(entity:any, refresh: boolean = false, limit: number = -1) {
  return new WikimediaCommons(entity, refresh, limit)
}

export class WikimediaCommons {

  id: string = 'commons'
  total:number = 0
  
  _depicts: any = {}

  _providerName: string = 'Wikimedia Commons'

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

  constructor(entity:any, refresh: boolean = false, limit: number = -1) {
    this._qid = entity.id
    this._cacheKey = `${this.id}-${this._qid}`
    this._refresh = refresh
    this._limit = limit
    console.log(`${this.id}: qid=${this._qid} refresh=${this._refresh} limit=${this._limit}`)
  }

  reset() {
    this._end = 0
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
        if (this._depicts[d.id])this._depicts[d.id]++
        else this._depicts[d.id] = 1
      })
    })
    return this._depicts
  }

  imageSelected(image: Image) {
    console.log(`${this.id}.selected: ${image.id}`)
  }

  async _doQuery() {
    // console.log(`${this.id}.doQuery: qid=${this._qid} refresh=${this._refresh}`)
  
    if (!this._refresh) {
      let cachedResults = await fetch(`/api/cache/${this._cacheKey}`)
      if (cachedResults.ok) {
        this._images = await cachedResults.json()
        console.log(`${this.id}.doQuery: qid=${this._qid} images=${this._images.length} from_cache=true`)
        this._filterAndSort()
        return
      }
    }
  
    let srlimit = 500
    let sroffset = 0

    let pageIds:string[] = []
    let extensions = new Set('jpg jpeg png gif svg tif tiff'.split(' '))

    while (sroffset != undefined) {
      let url = `https://commons.wikimedia.org/w/api.php?origin=*&action=query&list=search&srsearch=haswbstatement:P180=${this._qid}|P170=${this._qid}&srnamespace=6&format=json&srlimit=${srlimit}&sroffset=${sroffset}`
      let resp: any = await fetch(url)
      if (resp.ok) {
        resp = await resp.json()
        sroffset = resp.continue?.sroffset
        pageIds = [...pageIds, ...Object.values(resp.query.search).filter((item:any) => extensions.has(item.title.split('.').pop().toLowerCase())).map((item:any) => item.pageid)]
      }
    }

    let images:Image[] = []

    for (let i = 0; i < pageIds.length; i += 50) {
      let batch = pageIds.slice(i, i + 50).join('|')
      
      let url = `https://commons.wikimedia.org/w/api.php?origin=*&format=json&action=query&pageids=${batch}&prop=imageinfo&iiprop=extmetadata|size|mime`
      let resp:any = await fetch(url)
      if (resp.ok) {
        let _resp = await resp.json()
        Object.values(_resp.query.pages).forEach((page:any) => {
          // console.log(page)
          let imgInfo = page.imageinfo[0]
          let emd = imgInfo.extmetadata
          let file = page.title.replace('File:', '')
          let image:any = {
            api: this.id,
            id: page.pageid, 
            pageid: page.pageid,
            source: `https://commons.wikimedia.org/wiki/File:${file.replace(/ /g, '_').replace(/\?/g,'%3F')}`,
            provider: 'Wikimedia Commons',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Commons-logo.svg/178px-Commons-logo.svg.png',
            file,
            url: mwImage(file),
            thumbnail: mwImage(file, 400),
            width: imgInfo.width,
            height: imgInfo.height,
            format: imgInfo.mime.split('/').pop().toUpperCase(),
            aspect_ratio: Number((imgInfo.width/imgInfo.height).toFixed(2)),
            depicts: [{id: this._qid }],
          }

          if (emd.ImageDescription) image.description = emd.ImageDescription.value
          image.license = emd.LicenseUrl?.value.replace(/http:/, 'https:').replace(/\/$/, '') || (emd.License ? licenseUrl(emd.License?.value) : '')
          if (emd.Attribution) {
            image.attribution = emd.Attribution.value
          } else if (emd.Artist) {
            image.attribution = `<em>${image.file}</em> from <a href="${image.url}" target="_blank">Wikimedia Commons</a> by ${emd.Artist.value}, ${emd.LicenseShortName?.value}`
          }
          images.push(image as Image)
        })
      }
      this.total = images.length

      this._images = images
    }
  
    this._filterAndSort()
    if (this._images?.length) this._cacheResults() 
    // console.log(`${this.id}.doQuery: qid=${this._qid} images=${this._images.length} from_cache=false`)

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
    // console.log(`${this.id}.filterAndSort: sortby=${this._sortBy} images=${this.total}`)
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