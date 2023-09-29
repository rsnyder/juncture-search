import { ImageProvider } from './ImageProvider'
import type { Image } from '../../types'

export class JSTOR extends ImageProvider {

  id: string = 'jstor'
  name: string = 'JSTOR'
  static logo: string = 'https://about.jstor.org/wp-content/themes/aboutjstor2017/static/JSTOR_Logo2017_90.png'
  
  _searchEndpoint = '/api/search/jstor/basic'
  _pager:string = ''

  _pageSize = 100

  constructor(entity:any, refresh: boolean = false, limit: number = -1) {
    super(entity, refresh, limit)
  }

  async imageSelected(image: Image): Promise<string[]> {
    console.log(`${this.id}.imageSelected: ${image.id} ${image.label} ${image.width} x ${image.height}`)
    if (image.width && image.height) return []

    // Fetch info.json file to get image dimensions
    return fetch(`/api/jstor/${image.id}`)
      .then((resp:any) => resp.json())
      .then((imageInfo:any) => {
        console.log(imageInfo)
        image.width = imageInfo.width
        image.height = imageInfo.height
        return []
      })
      // .catch(err => console.error(err))

  }

  async _doQuery() {
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
      limit: this._pageSize,
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
      if (resp.results.length < this._pageSize) this._hasMore = false
      if (resp.paging && resp.paging.next) this._pager = resp.paging.next
      results = {total: resp.total || 0, items: resp.results}
      let updated: any = [...this._images || [], ...results.items.map((item: any) => this._transformItem(item))]
      this._images = updated
    } else {
      this._hasMore = false
    }
    console.log(`${this.id}.doQuery: qid=${this._qid} images=${this._images.length} hasMore=${this._hasMore}`)
  
    this._filterAndSort()
    if (this._images?.length) this._cacheResults()
    // console.log(`${this.id}.doQuery: qid=${this._qid} images=${this._images.length} hasMore=${this._hasMore}`)
  }

  _transformItem(item: any): any {
    let doc: any = {
      api: this.id,
      id: item.doi, 
      provider: this.name,
      logo: JSTOR.logo,
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

}