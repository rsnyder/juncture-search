import type { Article, MainSubject, MainSubjectsCount } from '../../types'
import type { ArticleProvider } from '../../types'

export class ArticleProviderBase implements ArticleProvider {

  id: string = 'article-provider'
  name: string = 'Article Provider'
  logo: string = ''

  _articles: Article[] = []
  _filteredAndSorted: Article[] = []

  _entity: any
  _qid: string = ''
  _refresh: boolean = false
  _cursor = -1
  _hasMore: boolean = true
  _limit = -1
  _mainSubjects: MainSubjectsCount = {}

  _sortBy = 'score'
  _filters: any = []

  constructor(entity:any, refresh: boolean = false, limit: number = -1) {
    this._entity = entity
    this._qid = entity.id
    this._refresh = refresh
    this._limit = limit
  }

  reset() {
    this._cursor = this._cursor > 0 ? 0 : this._cursor
  }

  hasMore() {
    return this._cursor < this._articles.length || this._hasMore
  }

  async next(howMany:number = 50): Promise<Article[]> {
    if (this._cursor < 0) {
      this._cursor = 0
      await this._doQuery()
    } else if (this._hasMore && (this._cursor + howMany * 2) > this._articles.length) {
      this._doQuery()
    }
    let next = this._filteredAndSorted.slice(this._cursor, this._cursor + howMany)
    this._cursor += next.length
    return next
  }

  async getMainSubjects() {
    return this._mainSubjects
  }

  async articleSelected(image: Article) {
  }

  async _doQuery() {
  
    if (!this._refresh) {
      let cacheKey = `${this.id}-${this._qid}`
      let cachedResults = await fetch(`/api/cache/${cacheKey}`)
      if (cachedResults.ok) {
        this._articles = await cachedResults.json()
        this._filterAndSort()
        return
      }
    }
  
    this._articles = []
    this._filterAndSort()

    if (this._articles?.length) this._cacheResults()

  }

  _filterAndSort(sortBy: string = this._sortBy, filters: any = this._filters) {
    this._sortBy = sortBy
    this._filters = filters
    this._cursor = 0
    this._filteredAndSorted = this._articles
    if (this._limit >= 0) this._filteredAndSorted = this._filteredAndSorted.slice(0, this._limit)
    return this
  }

  _cacheResults() {
    let cacheKey = `${this.id}-${this._qid}`
    fetch(`/api/cache/${cacheKey}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this._articles)
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