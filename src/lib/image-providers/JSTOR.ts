import type { Image } from '../../types'
import { licenseUrl } from '../licenses'

export function getImages(entity:any, refresh: boolean = false, limit: number = -1) {
  return new JSTOR(entity, refresh, limit)
}

export class JSTOR {

  _providerId: string = 'jstor'
  _providerName: string = 'JSTOR'
  _searchEndpoint = '/api/search/jstor/basic'
  _pager:string = ''

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
  total:number = 0

  constructor(entity:any, refresh: boolean = false, limit: number = -1) {
    this._entity = entity
    this._cacheKey = `${this._providerId}-${this._entity.id}`
    this._refresh = refresh
    this._limit = limit
    console.log(`${this._providerId}: qid=${this._entity.id} refresh=${this._refresh} limit=${this._limit}`)
  }

  reset() {
    this._end = 0
  }

  async next(): Promise<Image[]> {
    if (this._end < 0) {
      this._end = 0
      await this.doQuery()
    }
    let start = this._end
    this._end = Math.min(this._end + 50, this._filteredAndSorted?.length || 0)
    let images = this._filteredAndSorted?.slice(start, this._end)
    console.log(`${this._providerId}.next end=${this._end} images=${this._filteredAndSorted.length} returned=${images.length}`)
    return images
  }

  async doQuery() {
  
    if (!this._refresh) {
      let cachedResults = await fetch(`/api/cache/${this._cacheKey}`)
      if (cachedResults.ok) {
        this._images = await cachedResults.json()
        // console.log(`fromCache=${this._images.length}`)
        this.filterAndSort()
        console.log(`${this._providerId}.doQuery: qid=${this._qid} images=${this._images.length} from_cache=true`)
        return
      }
    }
  
    let label = this._entity.label.indexOf(' ') > 0 ? `"${this._entity.label}"^2` : `${this._entity.label}^2`
    let aliases = this._entity.aliases.map((alias:string) => alias.indexOf(' ') > 0 ? `"${alias}"^1` : `${alias}^1`)
    
    let query = label
    for (let i = 0; i < aliases.length; i++) {
      let nextTerm = ` OR ${aliases[i]}`
      if ((query.length + nextTerm.length) <= 250) query += nextTerm
      else break
    }

    let searchArgs: any = {
      query,
      limit: 20,
      tokens: ['16124', '24905214', '25794673', '24905191', '25794673', '24905216'],
      filter_queries: [
        // 'ps_subject:*',
        'cc_reuse_license:*'
      ],
      content_set_flags: ['contributed_images'],
    }
    if (this._pager) searchArgs.page_mark = this._pager
    // if (exclude.length > 0 && Array.isArray(exclude)) searchArgs.filter_queries.push(`-doi:(${ exclude.join(' OR ')})`)

    let results: any = {total:0, items:[]}
    let resp: any = await fetch(this._searchEndpoint, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', Accept: 'application/json'},
      body: JSON.stringify(searchArgs)
    })
    if (resp.ok) {
      resp = await resp.json()
      if (resp.paging && resp.paging.next) this._pager = resp.paging.next
      results = {total: resp.total || 0, items: resp.results}
      let updated: any = [...this._images || [], ...results.items.map((item: any) => this._transformItem(item))]
      this._images = updated
      this.total = results.total
    }
  
    this.filterAndSort()
    if (this._images?.length) this._cacheResults()
    console.log(`${this._providerId}.doQuery: qid=${this._qid} images=${this._images.length} from_cache=false`)

  }

  _transformItem(item: any): any {
    let doc: any = {
      id: item.doi, 
      provider: 'JSTOR',
      logo: 'https://about.jstor.org/wp-content/themes/aboutjstor2017/static/JSTOR_Logo2017_90.png',
    }
    doc.url = `https://www.jstor.org/stable/${item.doi.indexOf('10.2307') === 0 ? item.doi.slice(8) : item.doi}`
    if (item.item_title) doc.label = item.item_title
    if (item.ps_desc) doc.description = item.ps_desc.join(' ')
    if (item.ps_source) doc.attribution = item.ps_source.join(' ')
    if (item.primary_agents?.length > 0) doc.creator = item.primary_agents.join('; ')
    let ccLicense = item.cc_reuse_license[0]?.toLowerCase() || ''
    if (ccLicense.indexOf('public domain mark') >= 0) doc.license = 'https://creativecommons.org/publicdomain/mark/1.0'
    else if (ccLicense.indexOf('creative commons: free reuse (cc0)') >= 0) doc.license = 'https://creativecommons.org/publicdomain/zero/1.0'
    else if (ccLicense.indexOf('creative commons: attribution-noncommercial-noderivs') >= 0) doc.license = 'CC BY-NC-ND'
    else if (ccLicense.indexOf('creative commons: attribution-noncommercial-sharealike') >= 0) doc.license = 'CC BY-NC-SA'
    else if (ccLicense.indexOf('creative commons: attribution-noncommercial') >= 0) doc.license = 'CC BY-NC'
    else if (ccLicense.indexOf('creative commons: attribution-noderivs') >= 0) doc.license = 'CC BY-ND'
    else if (ccLicense.indexOf('creative commons: attribution-sharealike') >= 0) doc.license = 'https://creativecommons.org/licenses/by-sa/4.0'
    else if (ccLicense.indexOf('creative commons: attribution') >= 0) doc.license = 'https://creativecommons.org/licenses/by/4.0'
    else doc.license = item.cc_reuse_license[0]
    doc.thumbnail = `https://www.jstor.org/api/cached/thumbnails/202003101501/byitem/${item.id}/0`
    return doc
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
    console.log(`${this._providerId}.filterAndSort: sortby=${this._sortBy} images=${this.total}`)
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