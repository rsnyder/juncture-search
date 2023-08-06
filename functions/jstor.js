import fetch from 'node-fetch'

async function getMetadata(id) {
  let url = `https://www.jstor.org/api/labs-search-service/metadata/${id}`
  let resp = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.JSTOR_API_KEY}`}
  })
  if (resp.ok) return resp.json()
}

async function getImageInfo(iiifFragment) {
  let infoJsonUrl = `https://www.jstor.org/iiif/${iiifFragment}/info.json`
  console.log(infoJsonUrl)
  return fetch(infoJsonUrl, {
    headers: { Cookie: `UUID=e4ec7105-fd1a-4737-a207-0f678a22521b;` }
  })
}

export async function handler(event, context, callback) {
  let pathElems = event.path.split('/').filter(pathElem => pathElem).slice(2,6)
  let id = pathElems.slice(-2).join('/')
  console.log((id))
  let resp = await getMetadata(id)
    .then(metadata => {
      let iiifFragment = metadata.iiifUrls[0].split('/iiif/')[1]
      return getImageInfo(iiifFragment)
    })
  if (resp.ok) {
    return {
      statusCode: resp.status, 
      body: JSON.stringify(await resp.json()),
      headers: {'Content-Type': 'application/json'}
    }
  } else
    return { statusCode: resp.status, body: resp.statusText }
}
