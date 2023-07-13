import {fetch, CookieJar} from 'node-fetch-cookies'
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
  SELECT ?image ?item ?label ?createdBy ?depicts ?description ?url ?iiif ?mime ?width ?height ?dro ?quality ?rank ?copyright ?license WITH {
    SELECT * {
      SERVICE <https://query.wikidata.org/sparql> {
        ?item (wdt:P170 | wdt:P180) wd:{{qid}};
               rdfs:label ?label;
               schema:description ?description .
        FILTER (lang(?label) = "en")
        FILTER (lang(?description) = "en")
        OPTIONAL { ?item wdt:P6216 ?copyright . }
        OPTIONAL { ?item p:P180 [ps:P180 ?depicts ; wikibase:rank ?rank] . }
        OPTIONAL { ?item wdt:P170 ?createdBy . }
        OPTIONAL { ?item wdt:P6108 ?iiif . }
      }
    } 
  } AS %items WHERE {
    INCLUDE %items. 
    ?image (wdt:P170 | wdt:P180) ?item;
          schema:url ?url;
          (schema:encodingFormat | wdt:P1163 ) ?mime.
    FILTER(?mime IN ('image/jpeg', 'image/png')) .

    OPTIONAL { ?image (schema:width | wdt:P2049) ?width . }
    OPTIONAL { ?image (schema:height | wdt:P2048) ?height . }
    OPTIONAL { ?image wdt:P6243 ?dro . }
    OPTIONAL { ?image wdt:P6731 ?quality . }
    OPTIONAL { ?image wdt:P275 ?license . }
  }`

export async function handler(event) {

  if (!wcqsSessionToken()) await initSession()

  const qid = event.path.split('/').filter(pe => pe).pop()
  let query = SPARQL.replace(/{{qid}}/g, qid).trim()
  // console.log(query)
  let resp = await fetch(cookieJar, `https://commons-query.wikimedia.org/sparql?query=${encodeURIComponent(query)}`, {
    headers: { Accept: 'application/sparql-results+json'}
  })
  let statusCode = resp.status
  console.log(`/api/wikidata: qid=${qid} status=${statusCode}`)
  if (!resp.ok) return { statusCode: resp.status, body: resp.statusText }

  resp = await resp.json()
  let data = {}
  resp.results.bindings.map(b => {
    try {
      // console.log(b)
      let id = b.image.value.split('/').pop()
      let file = decodeURIComponent(b.url.value.split('/').pop())
      let width = parseInt(b.width.value)
      let height = parseInt(b.height.value)
      let aspect_ratio = Number((width/height).toFixed(2))
      if (!data[id]) data[id] = {
        api: 'wikidata',
        id,
        source: `https://commons.wikimedia.org/wiki/File:${file.replace(/ /g, '_').replace(/\?/g,'%3F')}`,
        provider: 'Wikimedia Commons',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Commons-logo.svg/178px-Commons-logo.svg.png',
        url: mwImage(file),
        thumbnail: mwImage(file, aspect_ratio >= 1 ? 400 : Number(400 * aspect_ratio).toFixed(0)),
        iiif: b.iiif?.value || `https://iiif.juncture-digital.org/wc:${file.replace(/\s/g,'_')}/manifest.json`,
        width,
        height,
        aspect_ratio,
        format: b.mime.value,
        file,
        depicts: {},
      }
      let isPublicDomain = b.copyright?.value.split('/').pop() === 'Q19652'
      let license = licenseUrl(b.license?.value || (isPublicDomain ? 'PD' : 'unknown'))
      data[id].license = license

      if (b.label?.value) data[id].title = b.label.value
      if (b.description?.value) data[id].description = b.description.value
      if (b.createdBy) data[id].createdBy = b.createdBy.value.split('/').pop()
      if (b.quality?.value) data[id].imageQualityAssessment = commonsImageQualityAssessment[b.quality.value.split('/').pop()]

      let depicted = b.depicts?.value.split('/').pop()
      if (depicted) {
        data[id].depicts[depicted] = { id: depicted }
        if (b.rank?.value.split('#').pop().replace('Rank', '') === 'Preferred') data[id].depicts[depicted].prominent = true
        if (b.dro?.value.split('/').pop() === depicted) data[id].depicts[depicted].dro = true
      }

    } catch (e) {
      console.log('wikidata error')
      console.trace(e)
      console.log(b)
    }
  })

  return { statusCode: 200, body: JSON.stringify(Object.values(data))}
}