import type { Article } from '../../types'
import { ArticleProviderBase } from './ArticleProvider'
import * as jsonld from 'jsonld'

export class Wikidata extends ArticleProviderBase {

  id: string = 'wikidata-articles'
  name: string = 'Wikidata'
  logo: string = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Commons-logo.svg/178px-Commons-logo.svg.png'
  
  _fetching: boolean = false

  _index: any[] = []
  _details: any[] = []

  IDS_SPARQL = `
    SELECT DISTINCT ?item ?mainSubject ?mainSubjectLabel ?pubdate WHERE {
        VALUES (?about) { (wd:{{qid}}) }
        # main subject: P921
        # instance of: P31
        # scholarly article: Q13442814
        ?item wdt:P921 ?about ;
              wdt:P31 wd:Q13442814 ;
              wdt:P921 ?mainSubject .
        OPTIONAL { ?item wdt:P577 ?pubdate . }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
      }
      # ORDER BY DESC(?pubdate)`

  ITEMS_SPARQL = `
    CONSTRUCT {
    ?item a schema:Thing ;
            rdfs:label ?item_label ;
            wdt:P1476  ?title ;
            wdt:P478   ?volume ;
            wdt:P433   ?issue ;
            wdt:P304   ?pages ;
            wdt:P577   ?pubdate ;
            wdt:P356   ?DOI ;
            wdt:P1433  ?pi ;
            wdt:P31    ?ins ;
            wdt:P50    ?an ;
            wdt:P2093  ?ans ;
            wdt:P921   ?ms .
        
    ?ans wdt:P2093  ?author_name ;
         pq:P1545   ?ans_seq .
    ?an  wdt:P50    ?author ;
         rdfs:label ?author_label ;
         pq:P1545   ?au_seq .
    ?ms  wdt:P921   ?main_subject ;
         rdfs:label ?main_subject_label .
    ?pi  wdt:P1433  ?published_in ;
         rdfs:label ?published_in_label .
    ?ins wdt:P31    ?instance_of ;
         rdfs:label ?instance_of_label .

  } WHERE {

    VALUES (?item) { ({{qids}}) }

    OPTIONAL {
      ?item rdfs:label ?item_label .
      FILTER (LANG(?item_label) = "en") .
    }
    OPTIONAL { ?item wdt:P1476 ?title . }
    OPTIONAL { ?item wdt:P478 ?volume . }
    OPTIONAL { ?item wdt:P433 ?issue . }
    OPTIONAL { ?item wdt:P304 ?pages . }
    OPTIONAL { ?item wdt:P577 ?pubdate . }
    OPTIONAL { ?item wdt:P356 ?DOI . }

    # main_subject
    OPTIONAL {
        ?item p:P921 ?ms .
        ?ms   ps:P921 ?main_subject .
        ?main_subject rdfs:label ?main_subject_label .
        FILTER (LANG(?main_subject_label) = "en") .
    }

    # instance of
    OPTIONAL {
        ?item p:P31 ?ins .
        ?ins  ps:P31 ?instance_of .
        ?instance_of rdfs:label ?instance_of_label .
        FILTER (LANG(?instance_of_label) = "en") .
    }

    # publication
    OPTIONAL {
        ?item p:P1433 ?pi .
        ?pi   ps:P1433 ?published_in .
        ?published_in rdfs:label ?published_in_label .
        FILTER (LANG(?published_in_label) = "en") .    
    }

    # author name string
    OPTIONAL {
        ?item p:P2093 ?ans .
        ?ans  ps:P2093 ?author_name .
        OPTIONAL {
            ?ans pq:P1545 ?ans_seq .
        }
    }

    # author
    OPTIONAL {
        ?item   p:P50 ?an .
        ?an     ps:P50 ?author .
        ?author rdfs:label ?author_label .
        FILTER (LANG(?author_label) = "en") .    
        OPTIONAL {
            ?an pq:P1545 ?au_seq .
        }
    }

  }`

  _context = {
    wd: 'http://www.wikidata.org/entity/',
    wdt: 'http://www.wikidata.org/prop/direct/',
    p: 'http://www.wikidata.org/prop/',
    pq: 'http://www.wikidata.org/prop/qualifier/',
    ps: 'http://www.wikidata.org/prop/statement/',
    wds: 'http://www.wikidata.org/entity/statement/',
    wdv: 'http://www.wikidata.org/value/',
    rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
    schema: 'http://schema.org/',
    skos: 'http://www.w3.org/2004/02/skos/core#',
    xsd: 'http://www.w3.org/2001/XMLSchema#',
    Entity: 'schema:Thing',
    label: {
      '@id': 'rdfs:label',
      '@language': 'en'
    },
    aliases: {
      '@id': 'skos:altLabel',
      '@language': 'en'
    },
    depicts: {
      '@id': 'wdt:P180'
    },
    country: {
      '@id': 'wdt:P17',
      '@type': '@id'
    },
    description: {
      '@id': 'schema:description',
      '@language': 'en'
    },
    author: {
      '@id': 'wdt:P50',
      // '@container': '@set'
    },
    author_name_string: 'wdt:P2093',
    'cites work': 'wdt:P2860',
    creator: {
      '@id': 'wdt:P170',
      '@type': '@id'
    },
    DOI: 'wdt:P356',
    image: {
      '@id': 'wdt:P18',
      '@type': '@id'
    },
    inception: {
      '@id': 'wdt:P571',
      '@type': 'xsd:dateTime'
    },
    'instance of': {
      '@id': 'wdt:P31',
      // '@container': '@set'
    },
    issue: 'wdt:P433',
    'language of work or name': 'wdt:P407',
    main_subjects: {
      '@id': 'wdt:P921',
      // '@container': '@set'
    },
    ordinal: 'pq:P1545',
    pages: 'wdt:P304',
    publication_date: {
      '@id': 'wdt:P577',
      '@type': 'xsd:dateTime'
    },
    publication: 'wdt:P1433',
    title: {
      '@id': 'wdt:P1476'
    },
    'subject item of this property': {
      '@id': 'wdt:P1629'
    },
    'total items': {
      '@id': 'schema:numberOfItems',
      '@type': 'xsd:integer'
    },
    'Unicode character': {
      '@id': 'wdt:P487'
    },
    volume: 'wdt:P478'
  }

  constructor(entity:any, refresh: boolean = false, limit: number = -1) {
    super(entity, refresh, limit)
  }

  hasMore() {
    return this._cursor < this._articles.length || this._hasMore
  }

  async next(howMany:number = 50): Promise<Article[]> {
    if (this._cursor < 0) {
      this._cursor = 0
      await this._getIndex()
    }
    if (this._details.length < this._index.length) {
      let qids = this._index.slice(this._details.length, this._details.length+howMany).map(item => item.id)
      await this._getDetails(qids)
    }
    let next = this._details.slice(this._cursor, this._cursor + howMany)
    this._cursor += next.length
    return next
  }

  async getMainSubjects() {
    if (this._cursor < 0) {
      await this._doQuery()
      this._cursor = 0
    }
    this._articles.forEach((doc:Article) => {
      (doc.main_subjects || []).forEach(ms => {
        if (this._mainSubjects[ms.id]) this._mainSubjects[ms.id]++
        else this._mainSubjects[ms.id] = 1
      })
    })
    return this._mainSubjects
  }

  async _doQuery() {
    if (this._fetching) return
    this._fetching = true

    if (this._index.length === 0) {
      await this._getIndex()
    }

    /*
    this._hasMore = false
    if (!this._refresh) {
      let cacheKey = `${this.id}-${this._qid}`
      let cachedResults = await fetch(`/api/cache/${cacheKey}`)
      if (cachedResults.ok) {
        this._articles = await cachedResults.json()
        this._filterAndSort()
        this._fetching = false
      }
    }
    */

    if (this._details.length < this._index.length) {

    }
  
    this._details = this._index.slice(0, 100).map(id => ({ id }))

  }

  async _getIndex() {
    let query = this.IDS_SPARQL.replace(/{{qid}}/g, this._qid).trim()
    let resp = await fetch(`https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}`, {
      headers: { Accept: 'application/sparql-results+json'}
    })
    if (resp.ok) {
      let _resp = await resp.json()
      let data = {}
      _resp.results.bindings.map(b => {
        let id = b.item.value.split('/').pop()
        if (!data[id]) data[id] = { id, mainSubject: [], pubdate: b.pubdate?.value }
        if (b.mainSubject) data[id].mainSubject.push( {id: b.mainSubject.value.split('/').pop(), label: b.mainSubjectLabel.value })
      })
      this._index = Object.values(data)
    }
  }

  async _getDetails(qids:string[]) {
    let query = this.ITEMS_SPARQL.replace(/{{qids}}/g, qids.map(q => `wd:${q}`).join(') (')).trim()

    await fetch(`https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}`, {
      headers: {
        Accept: 'application/ld+json',
        'Content-type': 'application/x-www-form-urlencoded'
      }
    })
    .then(resp => resp.json())
    .then(jld => jsonld.frame(jld, {'@context': this._context, '@type': 'Entity'}))
    .then(jld => {
      if (jld['@graph']) return jld
      let normalized: any = { '@context': jld['@context'], '@graph': [{}] }
      Object.keys(jsonld).filter(key => key !== '@context').forEach(key => normalized['@graph'][0][key] = jld[key])
      return normalized
    })
    .then(jld => jld['@graph'])
    .then(entities => {
      this._details = [
        ...this._details, 
        ...entities.map((entity: any) => this._transformEntity(entity))
      ]
    })
  
  }

  _transformEntity(e:any): Article {
    // console.log(e)
    let article: Article = {
      api: this.id,
      id: e['@id'].replace(/wd:/, ''),
      doi: e.DOI,
      url: `https://doi.org/${e.DOI}`
    }
    if (e.issue) article.issue = e.issue
    if (e.main_subjects) article.main_subjects = Array.isArray(e.main_subjects)
      ? e.main_subjects.map(ms => ({ id: ms.main_subjects['@id'].replace(/wd:/, ''), label: ms.label }))
      : [{ id: e.main_subjects.main_subjects['@id'].replace(/wd:/, ''), label: e.main_subjects.label }]
    if (e.pages) article.volume = e.pages
    if (e.publication) article.publications = Array.isArray(e.publication)
      ? e.publication.map(p => ({ id: p.publication['@id'].replace(/wd:/, ''), label: p.label }))
      : [{ id: e.publication.publication['@id'].replace(/wd:/, ''), label: e.publication.label }]
    if (e.publication_date) article.publication_date = new Date(e.publication_date)
    if (e.title || e.label) article.title = e.title?.['@value'] || e.label
    if (e.volume) article.volume = e.volume

    article.authors = [
      ...e.author_name_string
        ? Array.isArray(e.author_name_string)
          ? e.author_name_string.map(ans => ({ label: ans.author_name_string, seq: ans.ordinal }))
          : [{ label: e.author_name_string, seq: e.author_name_string.ordinal }]
        : [],
      ...e.author
        ? Array.isArray(e.author)
          ? e.author.map(a => ({ id: a.author['@id'].replace(/wd:/, ''), label: a.label, seq: a.ordinal }))
          : [{ id: e.author.author['@id'].replace(/wd:/, ''), label: e.author.label, seq: e.author.ordinal }]
        : []
    ].sort((a, b) => a.seq - b.seq).map(a => delete a.seq && a)
    
    // console.log(article)
    return article
  }

}