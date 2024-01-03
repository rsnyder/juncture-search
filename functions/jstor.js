import fetch from "node-fetch";

async function getMetadata(id) {
  let url = `https://www.jstor.org/api/labs-search-service/metadata/${id}`;
  let resp = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.JSTOR_API_KEY}`,
    },
  });
  console.log(url, resp.status, resp.statusText);
  if (resp.ok) return resp.json();
}

async function getImageInfo(iiifFragment) {
  let infoJsonUrl = `https://www.jstor.org/iiif/${iiifFragment}/info.json`;
  return fetch(
    `https://iiif.juncture-digital.org/mediainfo?url=${infoJsonUrl}`,
  );
}

export async function handler(event, context, callback) {
  let pathElems = event.path
    .split("/")
    .filter((pathElem) => pathElem)
    .slice(2, 6);
  let id = pathElems.slice(-2).join("/");
  let resp = await getMetadata(id).then((metadata) => {
    let iiifFragment = metadata.iiifUrls[0].split("/iiif/")[1];
    return getImageInfo(iiifFragment);
  });
  console.log(resp.status, resp.statusText);
  let body = await resp.json();
  if (resp.ok) {
    return {
      statusCode: resp.status,
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    };
  } else return { statusCode: resp.status, body: resp.statusText };
}
