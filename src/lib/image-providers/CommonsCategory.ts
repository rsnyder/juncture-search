import type { Image } from '../../types'

export class Tagged {

  _commonsCategory: string = ''
  _cacheKey: string = ''
  _refresh: boolean = false
  _end = -1
  _images: Image[] = []
  _filteredAndSorted: Image[] = []
  
  _sortBy = 'score'
  _filters: any = []
  _imageExtensions = new Set('jpg jpeg png gif svg tif tiff'.split(' '))

  total:number = 0

  constructor(commonsCategory: string, refresh: boolean = false) {
    this._commonsCategory = commonsCategory.replace(/ /g,'_')
    this._cacheKey = `cc-${commonsCategory}`
    this._refresh = refresh
    console.log(`CommonsCategory: category=${this._commonsCategory} refresh=${refresh}`)
  }

  async next() {
    if (this._end < 0) {
      this._end = 0
      await this.doQuery()
    }
    let start = this._end
    this._end = Math.min(this._end + 50, this._filteredAndSorted?.length || 0)
    let images = this._filteredAndSorted?.slice(start, this._end)
    console.log(`CommonsCategory.next end=${this._end} images=${this._filteredAndSorted.length} returned=${images.length}`)
    return images
  }

  async doQuery() {
    console.log(`CommonsCategory.doQuery: category=${this._commonsCategory} refresh=${this._refresh}`)
  
    if (!this._refresh) {
      let cachedResults = await fetch(`/api/cache/${this._cacheKey}`)
      // console.log(`fromCache=${cachedResults.ok}`)
      if (cachedResults.ok) {
        this._images = await cachedResults.json()
        console.log(`fromCache=${this._images.length}`)
        this.filterAndSort()
        return
      }
    }
  
    let resp = await fetch(`/api/commons-categories/${this._commonsCategory}`)
    if (resp.ok) {
      let data = await resp.json()
      this._images = this._scoreImages(
        data.filter((item:any) => this._imageExtensions.has(item.url.split('.').pop().toLowerCase()))
      )
    }
  
    this.filterAndSort()
    if (this._images?.length) this._cacheResults()
  }

  filterAndSort(sortBy: string = this._sortBy, filters: any = this._filters) {
    this._sortBy = sortBy
    this._filters = filters
    this._end = 0
    if (this._sortBy === 'score')
      this._filteredAndSorted = [...this._images.sort((a: any, b: any) => b.score - a.score)]
    else if (this._sortBy === 'size')
      this._filteredAndSorted = [...this._filteredAndSorted.sort((a: any, b: any) => b.size - a.size)]
    this.total = this._filteredAndSorted.length
    console.log(`CommonsCategory.filterAndSort: sortby=${this._sortBy} images=${this.total}`)
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
