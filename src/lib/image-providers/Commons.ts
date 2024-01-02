import type { Image } from "../../types";
import { licenseUrl } from "../licenses";
import { mwImage } from "../../../functions/mw-utils";
import { ImageProvider } from "./ImageProvider";

export class WikimediaCommons extends ImageProvider {
  id: string = "commons";
  name: string = "Wikimedia Commons";
  static logo: string =
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Commons-logo.svg/178px-Commons-logo.svg.png";

  constructor(entity: any, refresh: boolean = false, limit: number = -1) {
    super(entity, refresh, limit);
  }

  async getDepicts(filter: string[] = []) {
    if (this._cursor < 0) {
      this._cursor = 0;
      await this._doQuery();
    }
    if (!this._depicts[this._qid]) this._depicts[this._qid] = 0;
    this._images.forEach((img: Image) => {
      if (!img.depicts || !img.depicts.length)
        img.depicts = [{ id: this._qid }];
      img.depicts?.forEach((d) => {
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

  async imageSelected(image: Image): Promise<string[]> {
    return fetch(
      `https://commons.wikimedia.org/wiki/Special:EntityData/M${image.pageid}.json`,
    )
      .then((resp) => resp.json())
      .then((resp) => {
        let entity = resp.entities[`M${image.pageid}`];
        let depicts =
          entity.statements.P180?.map(
            (item: any) => item.mainsnak.datavalue.value.id,
          ) || [];
        image.depicts = depicts.map((qid: string) => ({ id: qid }));
        if (entity.statements.P1259) {
          image.coords = `${entity.statements.P1259[0].mainsnak.datavalue.value.latitude},${entity.statements.P1259[0].mainsnak.datavalue.value.longitude}`;
        }
        return depicts;
      })
      .catch((err) => console.error(err));
  }

  async _doQuery() {
    this._hasMore = false;
    let cacheKey = `${this.id}-${this._qid}`;

    if (!this._refresh) {
      let cachedResults = await fetch(`/api/cache/${cacheKey}`);
      if (cachedResults.ok) {
        this._images = await cachedResults.json();
        // console.log(`${this.id}.doQuery: qid=${this._qid} images=${this._images.length} from_cache=true`)
        this._filterAndSort();
        return;
      }
    }

    let [sparqlResponse, apiResponse] = await Promise.all([
      this._doQuerySparql(),
      this._doQueryApi(200),
    ]);
    let sparalImageIds = sparqlResponse.map((img: Image) => img.id);
    let images = [
      ...sparqlResponse,
      ...apiResponse.filter((img: Image) => !sparalImageIds.includes(img.id)),
    ];
    this._images = images;

    // console.log(`${this.id}.doQuery: qid=${this._qid} images=${this._images.length} fromSparql=${sparqlResponse.length} fromApi=${apiResponse.length}}`)
    this._filterAndSort();
    if (this._images?.length) this._cacheResults();
  }

  async _doQuerySparql() {
    let resp: any = await fetch(`/api/commons/${this._qid}`);
    if (resp.ok) return await resp.json();
    else return [];
  }

  async _doQueryApi(limit: number = -1) {
    let srlimit = limit > 0 ? (limit < 500 ? limit : 500) : 500;
    let sroffset = 0;

    let pageIds: string[] = [];
    let extensions = new Set("jpg jpeg png gif svg tif tiff".split(" "));

    while (sroffset != undefined) {
      let url = `https://commons.wikimedia.org/w/api.php?origin=*&action=query&list=search&srsearch=haswbstatement:P180=${this._qid}|P170=${this._qid}&srnamespace=6&format=json&srlimit=${srlimit}&sroffset=${sroffset}`;
      let resp: any = await fetch(url);
      if (resp.ok) {
        resp = await resp.json();
        sroffset = resp.continue?.sroffset;
        pageIds = [
          ...pageIds,
          ...Object.values(resp.query.search)
            .filter((item: any) =>
              extensions.has(item.title.split(".").pop().toLowerCase()),
            )
            .map((item: any) => item.pageid),
        ];
        if (limit > 0 && pageIds.length >= limit) break;
      }
    }

    let images: Image[] = [];

    for (let i = 0; i < pageIds.length; i += 50) {
      let batch = pageIds.slice(i, i + 50).join("|");

      let url = `https://commons.wikimedia.org/w/api.php?origin=*&format=json&action=query&pageids=${batch}&prop=imageinfo&iiprop=extmetadata|size|mime`;
      let resp: any = await fetch(url);
      if (resp.ok) {
        let _resp = await resp.json();
        Object.values(_resp.query.pages).forEach((page: any) => {
          let imgInfo = page.imageinfo[0];
          let emd = imgInfo.extmetadata;
          let file = page.title.replace("File:", "");
          let image: any = {
            api: this.id,
            id: `M${page.pageid}`,
            pageid: page.pageid,
            source: `https://commons.wikimedia.org/wiki/File:${file
              .replace(/ /g, "_")
              .replace(/\?/g, "%3F")}`,
            provider: this.name,
            logo: WikimediaCommons.logo,
            file,
            url: mwImage(file),
            thumbnail: mwImage(file, 400),
            width: imgInfo.width,
            height: imgInfo.height,
            format: imgInfo.mime.split("/").pop().toUpperCase(),
            aspect_ratio: Number((imgInfo.width / imgInfo.height).toFixed(2)),
            depicts: [{ id: this._qid }],
          };

          if (emd.ImageDescription)
            image.description = emd.ImageDescription.value;
          image.license =
            emd.LicenseUrl?.value
              .replace(/http:/, "https:")
              .replace(/\/$/, "") ||
            (emd.License ? licenseUrl(emd.License?.value) : "");
          if (emd.Attribution) {
            image.attribution = emd.Attribution.value;
          } else if (emd.Artist) {
            image.attribution = `<em>${image.file}</em> from <a href="${image.url}" target="_blank">Wikimedia Commons</a> by ${emd.Artist.value}, ${emd.LicenseShortName?.value}`;
          }
          images.push(image as Image);
        });
      }
    }
    return images;
  }
}
