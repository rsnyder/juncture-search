import type { Image } from '../../types'

export class Tagged {

  _qid: string = ''
  _cacheKey: string = ''
  _refresh: boolean = false
  _end = -1
  _images: Image[] = []
  _filteredAndSorted: Image[] = []
  
  // _sourcesToInclude = ['wikidata', 'commons', 'atlas']
  _sourcesToInclude = ['wikidata', 'commons']
  _sortBy = 'score'
  _filters: any = []

  total:number = 0

  constructor(qid: string, refresh: boolean = false) {
    this._qid = qid
    this._cacheKey = `tagged-${qid}`
    this._refresh = refresh
    console.log(`Tagged: qid=${qid} refresh=${refresh}`)
  }

  async next() {
    if (this._end < 0) {
      this._end = 0
      await this.doQuery()
    }
    let start = this._end
    this._end = Math.min(this._end + 50, this._filteredAndSorted?.length || 0)
    let images = this._filteredAndSorted?.slice(start, this._end)
    console.log(`Tagged.next end=${this._end} images=${this._filteredAndSorted.length} returned=${images.length}`)
    return images
  }

  async doQuery() {
    console.log(`Tagged.doQuery: qid=${this._qid} refresh=${this._refresh}`)
    this._images = []
  
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
  
    // console.log(`tagged.doQuery: qid=${qid.value} commonsCategory=${commonsCategory.value} isActive=${isActive.value}`)
    let promises: Promise<any>[] = []
    if (this._sourcesToInclude.includes('commons')) promises.push(fetch(`/api/commons/${this._qid}`))
    if (this._sourcesToInclude.includes('wikidata')) promises.push(fetch(`/api/wikidata/${this._qid}`))
    if (this._sourcesToInclude.includes('atlas')) promises.push(fetch(`/api/atlas/${this._qid}`).catch(e => console.log(e)))
  
    let responses = await Promise.all(promises).catch(e => console.log(e))
    let idx = 0
    const commonsData = this._sourcesToInclude.includes('commons') ? await responses[idx++].json() : []
    const wikidataData = this._sourcesToInclude.includes('wikidata') ? await responses[idx++].json() : []
    const atlasData = this._sourcesToInclude.includes('atlas') ? await responses[idx++].json() : []
      
    let all: any =
      this._scoreImages([...atlasData, ...commonsData, ...wikidataData])
        .sort((a: any, b: any) => b.score - a.score)
      
    // remove duplicates
    let ids = new Set()
    this._images = all
      .filter(img => {
        if (ids.has(img.id)) return false
        ids.add(img.id)
        return true
      })
    console.log(`commons=${commonsData.length} wikidata=${wikidataData.length} atlas=${atlasData.length} aggregated=${this._images.length}`)

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
    console.log(`Tagged.filterAndSort: sortby=${this._sortBy} images=${this.total}`)
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
      if (img.depicts) {
        let depicted: any = Object.values(img.depicts).find((d: any) => d.id === this._qid)
        if (depicted?.dro) img.score += 5
        else if (depicted?.prominent) img.score += 2
        else if (depicted) img.score += 1
      }
      if (img.imageQualityAssessment === 'featured') img.score += 3
      else if (img.imageQualityAssessment === 'quality') img.score += 2
      else if (img.imageQualityAssessment === 'valued') img.score += 1
      return img
    })
  }

}
