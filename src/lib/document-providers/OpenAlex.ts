import { ArticleProviderBase } from './ArticleProvider'
import type { Article } from '../../types'

export class OpenAlex extends ArticleProviderBase {

  id: string = 'openalex'
  name: string = 'OpenAlex'
  logo: string = 'https://www.gitbook.com/cdn-cgi/image/width=24,dpr=2,height=24,fit=contain,format=auto/https%3A%2F%2F2520693015-files.gitbook.io%2F~%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FpHVuV3Ib5KXeBKft4Kcl%252Ficon%252FogQFSOcLuYxWvYBhmDaU%252Fopenalex%2520logo%2520twitter.jpg%3Falt%3Dmedia%26token%3D5136a792-47d6-4d18-96eb-2012b55844d0'
  
  _searchEndpoint = 'https://api.openalex.org'

  _pageSize = 100

  constructor(entity:any, refresh: boolean = false, limit: number = -1) {
    super(entity, refresh, limit)
  }

  async _doQuery() {

    let searchArgs: any = {
      filter: `concepts.wikidata:https://www.wikidata.org/wiki/${this._entity.id}`,
      per_page: this._pageSize,
      page: this._articles.length / this._pageSize + 1,
    }
    let qargs = Object.keys(searchArgs).map(k => `${k}=${searchArgs[k]}`).join('&')

    let resp: any = await fetch(`${this._searchEndpoint}/works?${qargs}`)
    if (resp.ok) {
      resp = await resp.json()
      console.log(resp)
      this._hasMore = resp.meta.count > resp.meta.page * this._pageSize
      this._articles = [
        ...this._articles,
        ...resp.results.map((item: any) => this._transformItem(item))
        ]
    } else {
      this._hasMore = false
    }
  
    this._filterAndSort()
    if (this._articles?.length) this._cacheResults()
    // console.log(`${this.id}.doQuery: qid=${this._qid} images=${this._images.length} hasMore=${this._hasMore}`)
  }

  _transformItem(item: any): any {
    console.log(item)
    let article: Article = {
      api: this.id,
      doi: item.doi.split('/').slice(3).join('/'),
      id: item.id,
      logo: this.logo,
      provider: this.name,
      url: item.doi
    }
    if (item.display_name) article.title = item.display_name
    else if (item.title) article.title = item.title
    if (item.authorships) {
      article.authors = item.authorships.map((a: any) => ({
        label: a.author.display_name
      }))
    }
    if (item.publication_date) article.publication_date = new Date(item.publication_date)
    if (item.volume?.issue) article.volume = item.biblio.volume
    if (item.biblio?.issue) article.issue = item.biblio.issue
    if (item.biblio?.first_page) {
      article.pages = item.biblio.first_page
      if (item.biblio.last_page) article.pages += `-${item.biblio.last_page}`
    }
    if (item.primary_location?.source) article.publications = [{label: item.primary_location.source.display_name}]
    if (item.concepts) article.main_subjects = item.concepts.map(c => ({ id: c.wikidata.split('/').pop(), label: c.display_name }))

    /*
    if (item.citation_line) article.citation_line = item.citation_line
    */
    console.log(article)
    return article
  }
}