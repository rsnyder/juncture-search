import { ImageProvider } from './ImageProvider'
import { licenseUrl } from '../licenses'

export class Openverse extends ImageProvider {

  id: string = 'openverse'
  name: string = 'Openverse'
  logo: string = 'https://openverse.org/openverse-logo.svg'
  
  _source: string = ''

  _pageSize = 100
  _priorPage = 0
  _searchEndpoint = '/api/openverse'

  constructor(entity:any, refresh: boolean = false, limit: number = -1) {
    super(entity, refresh, limit)
  }

  async _doQuery() {
    let args = {
      q: `"${this._entity.label}"`,
      page_size: this._pageSize,
      page: this._priorPage + 1,
      license_type: 'all-cc'
    }
    if (this._source) args['source'] = this._source
    let qargs = Object.keys(args).map(k => `${k}=${args[k]}`).join('&')

    let resp:any = await fetch(`${this._searchEndpoint}/?${qargs}`)
    if (resp.ok) {
      resp = await resp.json()
      this._priorPage = resp.page
      this._images = [...this._images, ...resp.results.map((item: any) => this._transformItem(item))]
      if (resp.results.length < this._pageSize) this._hasMore = false
    } else {
      this._hasMore = false
    }
  
    this._filterAndSort()
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
      logo: this.logo,
      provider: this.name,
      source: item.foreign_landing_url,
      thumbnail: item.thumbnail,
      url: item.url,
    }
  }


}