import type { Image } from '../../types'
import { licenseUrl } from '../licenses'

export function getImages(entity:any, refresh: boolean = false, limit: number = -1) {
  return new Flickr(entity, refresh, limit)
}

export class Flickr {

  id: string = 'flickr'
  total:number = 0
  
  _depicts: any = {}

  _providerName: string = 'Flickr'
  _searchEndpoint = '/api/openverse'
  _priorPage = 0

  _entity: any
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
  _fetching = false

  constructor(entity:any, refresh: boolean = false, limit: number = -1) {
    this._entity = entity
    this._cacheKey = `${this.id}-${this._entity.id}`
    this._refresh = refresh
    this._limit = limit
    console.log(`${this.id}: qid=${this._entity.id} refresh=${this._refresh} limit=${this._limit}`)
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
        this.filterAndSort()
        console.log(`${this.id}.doQuery: qid=${this._qid} images=${this._images.length} from_cache=true`)
        return
      }
    }
  
    let args = {
      q: `"${this._entity.label}"`,
      page_size: 20,
      page: this._priorPage + 1,
      license_type: 'all-cc',
      source: 'flickr'
    }
    let qargs = Object.keys(args).map(k => `${k}=${args[k]}`).join('&')
  
    let resp:any = await fetch(`${this._searchEndpoint}/?${qargs}`)
    if (resp.ok) {
      resp = await resp.json()
      this._priorPage = resp.page
      this._images = [...this._images, ...resp.results.map((item: any) => this._transformItem(item))]
      this.total = resp.result_count
    }
  
    this.filterAndSort()
    if (this._images?.length) this._cacheResults()
    console.log(`${this.id}.doQuery: qid=${this._qid} images=${this._images.length} from_cache=false`)

  }

  _transformItem(item: any): any {
    return {
      api: this.id,
      aspect_ratio: Number((item.width/item.height).toFixed(4)),
      attribution: item.attribution,
      creator: item.creator_url,
      details: item,
      id: item.id,
      label: item.title,
      license: licenseUrl(item.license),
      logo: 'https://combo.staticflickr.com/pw/favicon.ico',
      provider: 'Flickr',
      source: item.foreign_landing_url,
      thumbnail: item.thumbnail,
      url: item.url,
    }
  }

  filterAndSort(sortBy: string = this._sortBy, filters: any = this._filters) {
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