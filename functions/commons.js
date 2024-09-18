import { fetch, CookieJar } from "node-fetch-cookies";
import { mwImage, commonsImageQualityAssessment } from "./mw-utils";
import { licenseUrl } from "../src/lib/licenses";

const cookieJar = new CookieJar();

function wcqsSessionToken() {
  return cookieJar.cookies
    .get("commons-query.wikimedia.org")
    ?.get("wcqsSession").value;
}

async function initSession() {
  // console.log('Initializing Wikimedia Commons Query Service session')
  await fetch(cookieJar, "https://commons-query.wikimedia.org", {
    credentials: "include",
    headers: { Cookie: `wcqsOauth=${process.env.WCQS_OAUTH_TOKEN};` },
  });
}

const SPARQL = `
  SELECT DISTINCT ?image ?label ?description ?url ?license ?coords ?depicts ?rank ?dro ?quality ?width ?height ?mime WHERE { 
    ?image wdt:P180 wd:{{qid}}; 
           schema:url ?url .
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
  LIMIT 10000`;

export async function handler(event) {
  if (!wcqsSessionToken()) await initSession();

  let q = "SELECT * WHERE { sdc:M41508642 ?p ?o . }";
  let r = await fetch(
    cookieJar,
    `https://commons-query.wikimedia.org/sparql?query=${encodeURIComponent(q)}`,
    {
      headers: {
        Accept: "text/plain",
        "User-Agent": "Juncture Image Search",
      },
    },
  );
  r = await r.text();

  const qid = event.path
    .split("/")
    .filter((pe) => pe)
    .pop();
  let query = SPARQL.replace(/{{qid}}/g, qid).trim();
  // console.log(query)
  resp = await fetch(
    cookieJar,
    `https://commons-query.wikimedia.org/sparql?query=${encodeURIComponent(
      query,
    )}`,
    {
      headers: {
        Accept: "application/sparql-results+json",
        "User-Agent": "Juncture Image Search",
      },
    },
  );

  if (!resp.ok) return { statusCode: resp.status, body: resp.statusText };

  let _resp = await resp.json();

  let data = {};
  _resp.results.bindings.map((b) => {
    try {
      let id = b.image.value.split("/").pop();
      let file = decodeURIComponent(b.url.value.split("/").pop());
      let width = parseInt(b.width.value);
      let height = parseInt(b.height.value);
      let aspect_ratio = Number((width / height).toFixed(2));
      if (!data[id])
        data[id] = {
          api: "commons",
          id,
          pageid: Number(id.slice(1)),
          file,
          source: `https://commons.wikimedia.org/wiki/File:${file
            .replace(/ /g, "_")
            .replace(/\?/g, "%3F")}`,
          provider: "Wikimedia Commons",
          logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Commons-logo.svg/178px-Commons-logo.svg.png",
          url: mwImage(file),
          thumbnail: mwImage(
            file,
            aspect_ratio >= 1 ? 400 : Number(400 * aspect_ratio).toFixed(0),
          ),
          iiif: `https://iiif.mdpress.io/wc:${file.replace(
            /\s/g,
            "_",
          )}/manifest.json`,
          width,
          height,
          aspect_ratio,
          format: b.mime.value,
          size: parseInt(b.width.value) * parseInt(b.height.value),
          depicts: [],
          raw: b,
        };

      data[id].license = licenseUrl(b.license?.value || "PD");

      if (b.coords?.value)
        data[id].coords = b.coords.value
          .replace(/Point\(/, "")
          .replace(/\)/, "")
          .split(" ")
          .map((c) => Number(c).toFixed(4));
      if (b.label?.value) data[id].title = b.label.value;
      if (b.description?.value) data[id].description = b.description.value;
      if (b.quality?.value)
        data[id].imageQualityAssessment =
          commonsImageQualityAssessment[b.quality.value.split("/").pop()];

      let depictsId = b.depicts?.value?.split("/").pop();
      let depicted = data[id].depicts.find((d) => d.id === depictsId);
      if (!depicted) {
        depicted = { id: depictsId };
        data[id].depicts.push(depicted);
      }
      if (b.rank?.value.split("#").pop().replace("Rank", "") === "Preferred")
        depicted.prominent = true;
      if (b.dro?.value.split("/").pop() === depicted.id) depicted.dro = true;
    } catch (e) {
      console.trace(e);
      console.log(b);
    }
  });

  // console.log("commons", resp.status, Object.keys(data).length);

  return { statusCode: 200, body: JSON.stringify(Object.values(data)) };
}
