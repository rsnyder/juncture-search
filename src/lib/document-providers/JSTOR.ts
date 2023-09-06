import { ArticleProviderBase } from './ArticleProvider'
import type { Article } from '../../types'

export class JSTOR extends ArticleProviderBase {

  id: string = 'jstor-articles'
  name: string = 'JSTOR'
  logo: string = 'https://about.jstor.org/wp-content/themes/aboutjstor2017/static/JSTOR_Logo2017_90.png'
  
  _searchEndpoint = '/api/search/jstor/basic'
  _pager:string = ''

  _pageSize = 100

  constructor(entity:any, refresh: boolean = false, limit: number = -1) {
    super(entity, refresh, limit)
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
      filter_queries: [
        '-ti:("Front Matter" OR "Back Matter" OR EDITORIAL OR "Volume Information" OR "INDEX TO ADVERTISERS")'
      ],
      tokens: '16124 24905214 25794673 24905191 25794673 24905216'.split(' '),
      content_set_flags: 'search_article search_chapter pamphlet review research_report mp_research_report_part'.split(' '),
      additional_fields: 'articleType authors contentType doi issue issueFormatted isOpenAccess itemType jcode journal languages no pageCount pages pageRange pageRangeFormatted pubdate pubdateFormatted publisher semanticTerms srcHtml srcHtml1 srcHtml2 title topics_fingerprint vo volume volumeFormatted'.split(' ')
    }

    let resp: any = await fetch(this._searchEndpoint, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', Accept: 'application/json'},
      body: JSON.stringify(searchArgs)
    })
    if (resp.ok) {
      resp = await resp.json()
      if (resp.results.length < this._pageSize) this._hasMore = false
      if (resp.paging && resp.paging.next) this._pager = resp.paging.next
      this._articles = [
        ...this._articles,
        ...resp.results
          .map((item: any) => {
            if (item.additional_fields) {
              item = {...item, ...item.additional_fields}
              delete item.additional_fields
            }
            return item
          })
          .map((item: any) => this._transformItem(item))
        ]
    } else {
      this._hasMore = false
    }
  
    this._filterAndSort()
    if (this._articles?.length) this._cacheResults()
    // console.log(`${this.id}.doQuery: qid=${this._qid} images=${this._images.length} hasMore=${this._hasMore}`)
  }

  _transformItem(item: any): any {
    // console.log(item)
    let article: Article = {
      api: this.id,
      doi: item.doi,
      id: item.id,
      url: `https://www.jstor.org/stable/${item.doi.replace(/10\.2307\//, '')}`,
    }
    if (item.author && item.author.length) article.authors = item.author.map(au => ({label: au}))
    if (item.citation_line) article.citation_line = item.citation_line
    if (item.journal && item.journal.length) article.publications = item.journal.map((journal: any) => ({label: journal}))
    if (item.no && item.no.length) article.issue = item.no.join('; ')
    if (item.pages) article.pages = item.pages
    if (item.pubdate) article.publication_date = new Date(item.pubdate)
    if (item.title && item.title.length) article.title = item.title.join('; ')
    if (item.vo && item.vo.length) article.volume = item.vo.join('; ')
    // console.log(article)
    return article
  }
}