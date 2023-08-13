import type { Image } from '../../types'
import { licenses, licenseUrl } from '../licenses'
import { mwImage } from '../../../functions/mw-utils'

export function getImages(entity:any, refresh: boolean = false, limit: number = -1) {
  return new CommonsCategoryImages(entity, refresh, limit)
}

export class CommonsCategoryImages {

  id: string = 'commons-category'
  total:number = 0
  
  _depicts: any = {}

  _providerName: string = 'Commons Category'

  _commonsCategory: string = ''
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
    this._commonsCategory = entity.claims.P373[0].mainsnak.datavalue.value.replace(/ /g,'_')
    this._cacheKey = `cc-${this._commonsCategory}`
    this._refresh = refresh
    this._limit = limit
    console.log(`${this.id}: category=${this._commonsCategory} refresh=${this._refresh} limit=${this._limit}`) 
  }
  
  reset() {
    this._end = this._end > 0 ? 0 : this._end
  }

  async next() {
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
    return this._depicts
  }

  imageSelected(image: Image) {
    console.log(`${this.id}.selected: ${image.id}`)
  }

  async _getSubcategories(category: string, maxDepth:number = 1, depth: number = 1, subcats: string[] = []) {
    let url = `https://commons.wikimedia.org/w/api.php?origin=*&action=query&format=json&list=categorymembers&cmtitle=Category:${category.replace(/ /g,'_')}&cmtype=subcat&cmlimit=500`
    let resp:any = await fetch(url)
    if (resp.ok) {
      resp = await resp.json()
      let subcategories = resp.query.categorymembers.map((cat:any) => cat.title.replace('Category:', ''))
      subcategories.forEach((cat:string) => subcats.push(cat))
      if (depth < maxDepth) {
        await Promise.all(subcategories.map(async (cat:string) => this._getSubcategories(cat, maxDepth, depth + 1, subcats)))
        if (depth + 1 == maxDepth) return subcats
      }
    }
    return subcats
  }

  async _getCategoryImageIds(category:string, limit:number = 100) {
    let pageIds:string[] = []
    let extensions = new Set('jpg jpeg png gif svg tif tiff'.split(' '))
    let continueToken = ''

    while (continueToken != undefined && pageIds.length < limit) {
      let url = `https://commons.wikimedia.org/w/api.php?origin=*&action=query&generator=categorymembers&gcmlimit=500&gcmtitle=Category:${category.replace(/ /g,'_')}&format=json&gcmnamespace=6&gcmtype=file&prop=imageinfo&iiprop=url&gcmcontinue=${continueToken}`
      let resp: any = await fetch(url)
      if (resp.ok) {
        resp = await resp.json()
        continueToken = resp.continue?.gcmcontinue
        if (resp.query) pageIds = [...pageIds, ...Object.values(resp.query.pages).filter((page:any) => extensions.has(page.title.split('.').pop().toLowerCase())).map((page:any) => page.pageid)]
      }
    }
    return pageIds.slice(0, limit)
  }

  async _getImagesMetadata(pageIds: string[]) {
    let images:Image[] = []

    const batchSize = 50
    for (let i = 0; i < pageIds.length; i += batchSize) {
      let batch = pageIds.slice(i, i + batchSize).join('|')
      let url = `https://commons.wikimedia.org/w/api.php?origin=*&format=json&action=query&pageids=${batch}&prop=imageinfo&iiprop=extmetadata|size|mime`
      let resp:any = await fetch(url)
      if (resp.ok) {
        let _resp = await resp.json()
        images = Object.values(_resp.query.pages)
          .filter((page:any) => { // filter out results with unrecognized licenses
            let emd = page.imageinfo[0].extmetadata
            let license = emd.LicenseUrl?.value.replace(/http:/, 'https:').replace(/\/$/, '') || (emd.License ? licenseUrl(emd.License?.value) : '')
            return licenses[license]
          })
          .map((page:any) => this._transformImage(page))
      }
    }
    return images
  }

  async _getImagesMetadataParallel(pageIds: string[]) {
    let images:Image[] = []

    const batchSize = 50
    let promises:any[] = []
    for (let i = 0; i < pageIds.length; i += batchSize) {
      let batch = pageIds.slice(i, i + batchSize).join('|')
      promises.push(fetch(`https://commons.wikimedia.org/w/api.php?origin=*&format=json&action=query&pageids=${batch}&prop=imageinfo&iiprop=extmetadata|size|mime`)
        .then(resp => resp.json())
        .then(resp => Object.values(resp.query.pages))
        .then(pages => {
          images = [...images, ...pages.filter((page:any) => { // filter out results with unrecognized licenses
            let emd = page.imageinfo[0].extmetadata
            let license = emd.LicenseUrl?.value.replace(/http:/, 'https:').replace(/\/$/, '') || (emd.License ? licenseUrl(emd.License?.value) : '')
            return licenses[license]
          })
          .map((page:any) => this._transformImage(page))]
        })
      )
    }
    await Promise.all(promises)
    // console.log(`getImagesMetadataParallel: processed ${images.length} images in ${promises.length} batches`)
    return images
  }

  _transformImage(ccPage: any): Image {
    let imgInfo = ccPage.imageinfo[0]
    let emd = imgInfo.extmetadata
    let file = ccPage.title.replace('File:', '')
    let image:any = {
      api: this.id,
      id: ccPage.pageid, 
      pageid: ccPage.pageid,
      source: `https://commons.wikimedia.org/wiki/File:${file.replace(/ /g, '_').replace(/\?/g,'%3F')}`,
      provider: 'Wikimedia Commons',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Commons-logo.svg/178px-Commons-logo.svg.png',
      file,
      url: mwImage(file),
      thumbnail: mwImage(file, 400),
      width: imgInfo.width,
      height: imgInfo.height,
      format: imgInfo.mime.split('/').pop().toUpperCase(),
      aspect_ratio: Number((imgInfo.width/imgInfo.height).toFixed(2))
    }
    if (emd.ImageDescription) image.description = emd.ImageDescription.value
    image.license = emd.LicenseUrl?.value.replace(/http:/, 'https:').replace(/\/$/, '') || (emd.License ? licenseUrl(emd.License?.value) : '')
    if (emd.Attribution) {
      image.attribution = emd.Attribution.value
    } else if (emd.Artist) {
      image.attribution = `<em>${image.file}</em> from <a href="${image.url}" target="_blank">Wikimedia Commons</a> by ${emd.Artist.value}, ${emd.LicenseShortName.value}`
    }
    return image
  }

  async _doQuery() {
    // console.log(`${this.id}.doQuery: category=${this._commonsCategory} refresh=${this._refresh}`)
  
    if (!this._refresh) {
      let cachedResults = await fetch(`/api/cache/${this._cacheKey}`)
      if (cachedResults.ok) {
        this._images = await cachedResults.json()
        this._filterAndSort()
        console.log(`${this.id}.doQuery: category=${this._commonsCategory} images=${this._images.length} from_cache=true`)
        return
      }
    }
  
    let categories = [this._commonsCategory, ...(await this._getSubcategories(this._commonsCategory))]
    let pageIds:string[] = []
    await Promise.all(categories.map((cat:string) => this._getCategoryImageIds(cat).then((ids:string[]) => pageIds = [...pageIds, ...ids])))

    let images = await this._getImagesMetadataParallel(pageIds)

    this.total = images.length
    this._images = images
    console.log(`${this.id}.doQuery: category=${this._commonsCategory} images=${this._images.length} from_cache=false`)
  
    this._filterAndSort()
    if (this._images?.length) this._cacheResults()
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

}