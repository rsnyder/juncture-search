import fetch from 'node-fetch'
import * as jsonld from 'jsonld'

const SPARQL = {
  ids: `
    SELECT DISTINCT ?item ?DOI ?pubdate WHERE {
      VALUES (?about) { (wd:{{qid}}) }
      # main subject: P921
      # instance of: P31
      # scholarly article: Q13442814
      ?item wdt:P921 ?about ;
            wdt:P31 wd:Q13442814 ;
            wdt:P356 ?DOI .
      OPTIONAL { ?item wdt:P577 ?pubdate . }
    }
    ORDER BY DESC(?pubdate)`,

  items: `
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

    # main subject
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

    # published in
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
}

const context = {
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
    '@container': '@set'
  },
  'author name string': 'wdt:P2093',
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
    '@container': '@set'
  },
  issue: 'wdt:P433',
  'language of work or name': 'wdt:P407',
  'main subject': {
    '@id': 'wdt:P921',
    '@container': '@set'
  },
  ordinal: 'pq:P1545',
  pages: 'wdt:P304',
  'publication date': {
    '@id': 'wdt:P577',
    '@type': 'xsd:dateTime'
  },
  'published in': 'wdt:P1433',
  'title': {
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


export async function handler(event) {
  let pathElems = event.path.split('/').filter(pe => pe)
  const type = pathElems.pop().toLowerCase()
  let args = event.queryStringParameters || {}
  let qids = args.qids ? args.qids.split(',') : []

  let query = type === 'ids'
    ? SPARQL.ids.replace(/{{qid}}/g, qids[0]).trim()
    : SPARQL.items.replace(/{{qids}}/g, qids.map(q => `wd:${q}`).join(') (')).trim()
  console.log(query)

  let headers = type === 'ids'
    ? { Accept: 'application/sparql-results+json'}
    : { Accept: 'application/ld+json', 'Content-type': 'application/x-www-form-urlencoded' }

  let resp = await fetch(`https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}`, { headers })
  if (!resp.ok) return { statusCode: resp.status, body: resp.statusText }

  resp = await resp.json()

  if (type === 'ids') {
    let ids = resp.results.bindings.map(b => b.item.value.split('/').pop())
    return { statusCode: 200, body: JSON.stringify(Object.values(ids))}
  } else {
    let jld = await jsonld.frame(resp, {'@context': context, '@type': 'Entity'})
    return { statusCode: 200, body: JSON.stringify(jld)}
  }
}