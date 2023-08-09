import { fetch, CookieJar } from 'node-fetch-cookies'
import { mwImage, commonsImageQualityAssessment } from './mw-utils'
import { licenseUrl } from '../src/lib/licenses'

const cookieJar = new CookieJar()

function wcqsSessionToken() {
  return cookieJar.cookies.get('commons-query.wikimedia.org')?.get('wcqsSession').value
}

async function initSession() {
  // console.log('Initializing Wikimedia Commons Query Service session')
  await fetch(cookieJar, 'https://commons-query.wikimedia.org', {
    credentials: 'include',
    headers: {
      Cookie: `wcqsOauth=${process.env.WCQS_OAUTH_TOKEN};`,
      'User-Agent': 'Juncture Image Search'
    }
  })
}

const SPARQL = `
  SELECT DISTINCT ?image ?label ?description ?url ?license ?coords ?depicts ?rank ?dro ?quality ?width ?height ?mime WHERE { 
    VALUES (?image) { {{ENTITY-IDS}} }
    ?image schema:url ?url .
    OPTIONAL { ?image rdfs:label ?label. }
    OPTIONAL { ?image schema:description ?description. }
    OPTIONAL { ?image wdt:P275 ?license . }
    OPTIONAL { ?image (wdt:P1259 | wdt:P625) ?coords . }
    OPTIONAL { ?image p:P180 [ps:P180 ?depicts; wikibase:rank ?rank] .}
    ?image (schema:encodingFormat | wdt:P1163) ?mime .
    FILTER(?mime IN ('image/jpeg', 'image/png')) .
    OPTIONAL { ?image (schema:width | wdt:P2049) ?width . }
    OPTIONAL { ?image (schema:height | wdt:P2048) ?height . }
    OPTIONAL { ?image wdt:P6243 ?dro . }
    OPTIONAL { ?image wdt:P6731 ?quality . }
  }
  LIMIT 2000`


export async function handler(event) {
  
  if (!wcqsSessionToken()) await initSession()

  const category = event.path.split('/').filter(pe => pe).pop()

  let categoryImagesContinue = ''
  let pageids = []
  while (categoryImagesContinue !== undefined) {
    let resp = await fetch(cookieJar, 
      `https://commons.wikimedia.org/w/api.php?origin=*&action=query&generator=categorymembers&gcmlimit=500&gcmtitle=Category:${category.replace(/ /,'_')}&format=json&gcmnamespace=6&gcmtype=file&prop=imageinfo&iiprop=url&gcmcontinue=${categoryImagesContinue}`, {
        headers: { 'User-Agent': 'Juncture Image Search' }
      })
    let statusCode = resp.status
    console.log(`/api/commons-categories: category=${category} status=${statusCode}`)
    if (!resp.ok) return { statusCode: resp.status, body: resp.statusText }

    resp = await resp.json()
    categoryImagesContinue = resp.continue?.gcmcontinue
    
    let batchPageids = Object.keys(resp.query.pages)
    pageids = [...pageids, ...batchPageids] 
  }

  let entityIds = pageids.map(pageid => `(sdc:M${pageid})`).join(' ')
  let query = SPARQL.replace(/\{\{ENTITY-IDS\}\}/, entityIds)
  // console.log(query)

  let resp = await fetch(cookieJar, 'https://commons-query.wikimedia.org/sparql', {
    method: 'POST', body: `query=${encodeURIComponent(query)}`, 
    headers: { 
      Accept: 'application/sparql-results+json', 
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Juncture Image Search'
    }
  })
  let statusCode = resp.status
  if (!resp.ok) return { statusCode: resp.status, body: resp.statusText }

  resp = await resp.json()
  let data = {}
  resp.results.bindings.map(b => {
    try {

      let id = b.image.value.split('/').pop()
      let file = decodeURIComponent(b.url.value.split('/').pop())
      let width = parseInt(b.width.value)
      let height = parseInt(b.height.value)
      let aspect_ratio = Number((width/height).toFixed(2))
      if (!data[id]) data[id] = {
        api: 'commons-categories',
        id,
        pageid: id.slice(1),
        source: `https://commons.wikimedia.org/wiki/File:${file.replace(/ /g, '_').replace(/\?/g,'%3F')}`,
        provider: 'Wikimedia Commons',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Commons-logo.svg/178px-Commons-logo.svg.png',
        url: mwImage(file),
        thumbnail: mwImage(file, aspect_ratio >= 1 ? 400 : Number(400 * aspect_ratio).toFixed(0)),
        iiif: `https://iiif.juncture-digital.org/wc:${file.replace(/\s/g,'_')}/manifest.json`,
        width,
        height,
        aspect_ratio,
        format: b.mime.value,
        file,
        depicts: {},
        raw: b
      }

      data[id].license = licenseUrl(b.license?.value ||'PD')

      if (b.coords?.value) data[id].coords = b.coords.value.replace(/Point\(/, '').replace(/\)/, '').split(' ').map(c => Number(c).toFixed(4))
      if (b.label?.value) data[id].title = b.label.value
      if (b.description?.value) data[id].description = b.description.value
      if (b.quality?.value) data[id].imageQualityAssessment = commonsImageQualityAssessment[b.quality.value.split('/').pop()]

      let depicted = b.depicts?.value.split('/').pop()
      if (depicted) {
        data[id].depicts[depicted] = { id: depicted }
        if (b.rank?.value.split('#').pop().replace('Rank', '') === 'Preferred') data[id].depicts[depicted].prominent = true
        if (b.dro?.value.split('/').pop() === depicted) data[id].depicts[depicted].dro = true
      }
    } catch (e) {
      console.trace(e)
      console.log(b)
    }
  })
  
  return { statusCode: 200, body: JSON.stringify(Object.values(data))}

}
