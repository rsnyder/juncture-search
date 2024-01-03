import type { Image, Depicted } from "../../types";
import { licenseUrl } from "../licenses";
import { mwImage } from "../../../functions/mw-utils";
import { ImageProvider } from "./ImageProvider";

export class Wikidata extends ImageProvider {
  id: string = "wikidata-images";
  name: string = "Wikidata";
  static logo: string =
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Commons-logo.svg/178px-Commons-logo.svg.png";

  _fetching: boolean = false;

  _sparql_template = `
    SELECT ?item ?label ?description ?copyright ?depicts ?depictsLabel ?rank ?creator ?creatorLabel ?iiif ?url WHERE {
      {
        ?item (wdt:P170 | wdt:P180) wd:{{qid}};
              rdfs:label ?label;
              schema:description ?description ;
              wdt:P18 ?url .
        FILTER (lang(?label) = "en")
        FILTER (lang(?description) = "en")
        OPTIONAL { ?item wdt:P6216 ?copyright . }
        OPTIONAL { 
          ?item p:P180 [ ps:P180 ?depicts; wikibase:rank ?rank ] . 
          ?depicts rdfs:label ?depictsLabel .
          FILTER (lang(?depictsLabel) = "en")
        }
        OPTIONAL { 
          ?item p:P170 [ ps:P170 ?creator ] . 
          ?creator rdfs:label ?creatorLabel .
          FILTER (lang(?creatorLabel) = "en")
        }
        OPTIONAL { ?item wdt:P6108 ?iiif . }
      } UNION {
        BIND(wd:{{qid}} as ?item)
        BIND(wd:{{qid}} as ?depicts)
        ?item wdt:P18 ?url .
        ?depicts rdfs:label ?depictsLabel .
        FILTER (lang(?depictsLabel) = "en")
      }
    }
  `;
  constructor(entity: any, refresh: boolean = false, limit: number = -1) {
    super(entity, refresh, limit);
  }

  hasMore() {
    return this._cursor < this._images.length || this._hasMore;
  }

  async getDepicts(filter: string[] = []) {
    if (this._cursor < 0) {
      await this._doQuery();
      this._cursor = 0;
    }
    this._images.forEach((img: Image) => {
      (img.depicts || []).forEach((d) => {
        if (this._depicts[d.id]) this._depicts[d.id]++;
        else this._depicts[d.id] = 1;
      });
    });
    let depictsFilter = new Set(filter);
    return Object.fromEntries(
      Object.entries(this._depicts).filter(
        ([qid, count]) => depictsFilter.size === 0 || depictsFilter.has(qid),
      ),
    );
  }

  async _doQuery() {
    // if (this._fetching) return
    let self = this;
    this._fetching = true;

    this._hasMore = false;
    if (!this._refresh) {
      let cacheKey = `${this.id}-${this._qid}`;
      let cachedResults = await fetch(`/api/cache/${cacheKey}`);
      if (cachedResults.ok) {
        this._images = await cachedResults.json();
        this._filterAndSort();
        this._fetching = false;
      }
    }

    let query = this._sparql_template.replace(/{{qid}}/g, this._qid).trim();
    let resp = await fetch(
      `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}`,
      {
        headers: { Accept: "application/sparql-results+json" },
      },
    );
    if (resp.ok) {
      let _resp = await resp.json();
      let data = {};
      _resp.results.bindings.map((b) => {
        try {
          let id = b.item.value.split("/").pop();
          let file = decodeURIComponent(b.url.value.split("/").pop());
          if (!data[id])
            data[id] = {
              api: this.id,
              id,
              file,
              source: `https://commons.wikimedia.org/wiki/File:${file
                .replace(/ /g, "_")
                .replace(/\?/g, "%3F")}`,
              provider: "Wikimedia Commons",
              logo: Wikidata.logo,
              url: mwImage(file),
              thumbnail: mwImage(file, 400),
              iiif:
                b.iiif?.value ||
                `https://iiif.juncture-digital.org/wc:${file.replace(
                  /\s/g,
                  "_",
                )}/manifest.json`,
              depicts: [],
            };
          let isPublicDomain = b.copyright?.value.split("/").pop() === "Q19652";
          let license = licenseUrl(
            b.license?.value.replace(/http:/, "https:").replace(/\/$/, "") ||
              (isPublicDomain ? "PD" : "unknown"),
          );
          data[id].license = license;

          if (b.label?.value) data[id].title = b.label.value;
          if (b.description?.value) data[id].description = b.description.value;
          if (b.creator)
            data[id].creator = {
              id: b.creator.value.split("/").pop(),
              label: b.creatorLabel?.value,
            };

          let depictedId = b.depicts?.value.split("/").pop();
          let depicted = data[id].depicts.find((d) => d.id === depictedId);
          if (!depicted) {
            depicted = {
              id: depictedId,
              label: b.depictsLabel?.value || depictedId,
            };
            data[id].depicts.push(depicted);
          }
          if (
            b.rank?.value.split("#").pop().replace("Rank", "") === "Preferred"
          )
            depicted.prominent = true;
          if (b.dro?.value.split("/").pop() === depictedId) depicted.dro = true;
        } catch (e) {
          console.trace(e);
          console.log(b);
        }
      });
      let images = this._scoreImages(
        Object.values(data).filter((item: any) =>
          this._imageExtensions.has(item.url.split(".").pop().toLowerCase()),
        ),
      );
      images = images.filter((i) => i.license !== "UNKNOWN");
      await this._getImageInfo(images);
      this._images = images;
      this._fetching = false;
    }

    this._filterAndSort();
    if (this._images?.length) this._cacheResults();
  }

  async _getImageInfo(images: Image[]) {
    let infoNeeded = images.filter((i) => !i.width);
    for (let i = 0; i < infoNeeded.length; i += 50) {
      let titles = infoNeeded
        .slice(i, i + 50)
        .map((i) => `File:${i.file?.replace(/ /g, "_").replace(/\?/g, "%3F")}`)
        .join("|");
      let url = `https://commons.wikimedia.org/w/api.php?origin=*&format=json&action=query&titles=${titles}&prop=imageinfo&iiprop=extmetadata|size|mime`;
      let resp: any = await fetch(url);
      if (resp.ok) {
        let _resp = await resp.json();
        Object.values(_resp.query.pages).forEach((page: any) => {
          let image = images.find(
            (i) => i.file === page.title.replace("File:", ""),
          );
          if (image) {
            image.width = page.imageinfo[0].width;
            image.height = page.imageinfo[0].height;
            image.aspect_ratio = Number(
              (page.imageinfo[0].width / page.imageinfo[0].height).toFixed(2),
            );
            image.format = page.imageinfo[0].mime;
            image.license =
              page.imageinfo[0].extmetadata.LicenseUrl?.value
                .replace(/http:/, "https:")
                .replace(/\/$/, "") ||
              licenseUrl(page.imageinfo[0].extmetadata.License?.value);
          }
        });
      }
    }
    return images;
  }
}
