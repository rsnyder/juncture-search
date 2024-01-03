import type { Image } from "../../types";
import { licenses, licenseUrl } from "../licenses";
import { mwImage } from "../../../functions/mw-utils";
import { ImageProvider } from "./ImageProvider";

export class CommonsCategoryImages extends ImageProvider {
  id: string = "commons-category";
  name: string = "Wikimedia Commons Category";
  static logo: string =
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Commons-logo.svg/178px-Commons-logo.svg.png";

  constructor(entity: any, refresh: boolean = false, limit: number = -1) {
    super(entity, refresh, limit);
  }

  async _doQuery() {
    this._hasMore = false;

    if (!this._refresh) {
      let cacheKey = `${this.id}-${this._qid}`;
      let cachedResults = await fetch(`/api/cache/${cacheKey}`);
      if (cachedResults.ok) {
        this._images = await cachedResults.json();
        this._filterAndSort();
        return;
      }
    }

    let categories = [
      this._commonsCategory,
      ...(await this._getSubcategories(this._commonsCategory)),
    ];
    let pageIds: string[] = [];
    await Promise.all(
      categories.map((cat: string) =>
        this._getCategoryImageIds(cat).then(
          (ids: string[]) => (pageIds = [...pageIds, ...ids]),
        ),
      ),
    );

    let images = await this._getImagesMetadata(pageIds);

    this._images = images;
    this._filterAndSort();

    if (this._images?.length) this._cacheResults();
  }

  async _getSubcategories(
    category: string,
    maxDepth: number = 1,
    depth: number = 1,
    subcats: string[] = [],
  ) {
    if (!category) return subcats;
    let url = `https://commons.wikimedia.org/w/api.php?origin=*&action=query&format=json&list=categorymembers&cmtitle=Category:${category.replace(
      / /g,
      "_",
    )}&cmtype=subcat&cmlimit=500`;
    let resp: any = await fetch(url);
    if (resp.ok) {
      resp = await resp.json();
      let subcategories = resp.query.categorymembers.map((cat: any) =>
        cat.title.replace("Category:", ""),
      );
      subcategories.forEach((cat: string) => subcats.push(cat));
      if (depth < maxDepth) {
        await Promise.all(
          subcategories.map(async (cat: string) =>
            this._getSubcategories(cat, maxDepth, depth + 1, subcats),
          ),
        );
        if (depth + 1 == maxDepth) return subcats;
      }
    }
    return subcats;
  }

  async _getCategoryImageIds(category: string, limit: number = 100) {
    if (!category) return [];
    let pageIds: string[] = [];
    let extensions = new Set("jpg jpeg png gif svg tif tiff".split(" "));
    let continueToken = "";

    while (continueToken != undefined && pageIds.length < limit) {
      let url = `https://commons.wikimedia.org/w/api.php?origin=*&action=query&generator=categorymembers&gcmlimit=500&gcmtitle=Category:${category.replace(
        / /g,
        "_",
      )}&format=json&gcmnamespace=6&gcmtype=file&prop=imageinfo&iiprop=url&gcmcontinue=${continueToken}`;
      let resp: any = await fetch(url);
      if (resp.ok) {
        resp = await resp.json();
        continueToken = resp.continue?.gcmcontinue;
        if (resp.query)
          pageIds = [
            ...pageIds,
            ...Object.values(resp.query.pages)
              .filter((page: any) =>
                extensions.has(page.title.split(".").pop().toLowerCase()),
              )
              .map((page: any) => page.pageid),
          ];
      }
    }
    return pageIds.slice(0, limit);
  }

  async _getImagesMetadata(pageIds: string[]) {
    let images: Image[] = [];

    const batchSize = 50;
    let promises: any[] = [];
    for (let i = 0; i < pageIds.length; i += batchSize) {
      let batch = pageIds.slice(i, i + batchSize).join("|");
      promises.push(
        fetch(
          `https://commons.wikimedia.org/w/api.php?origin=*&format=json&action=query&pageids=${batch}&prop=imageinfo&iiprop=extmetadata|size|mime`,
        )
          .then((resp) => resp.json())
          .then((resp) => Object.values(resp.query.pages))
          .then((pages) => {
            images = [
              ...images,
              ...pages
                .filter((page: any) => {
                  // filter out results with unrecognized licenses
                  let emd = page.imageinfo[0].extmetadata;
                  let license =
                    emd.LicenseUrl?.value
                      .replace(/http:/, "https:")
                      .replace(/\/$/, "") ||
                    (emd.License ? licenseUrl(emd.License?.value) : "");
                  return licenses[license];
                })
                .map((page: any) => this._transformImage(page)),
            ];
          }),
      );
    }
    await Promise.all(promises);
    return images;
  }

  _transformImage(ccPage: any): Image {
    let imgInfo = ccPage.imageinfo[0];
    let emd = imgInfo.extmetadata;
    let file = ccPage.title.replace("File:", "");
    let image: Image = {
      api: this.id,
      id: ccPage.pageid,
      pageid: ccPage.pageid,
      source: `https://commons.wikimedia.org/wiki/File:${file
        .replace(/ /g, "_")
        .replace(/\?/g, "%3F")}`,
      provider: this.name,
      logo: CommonsCategoryImages.logo,
      file,
      license:
        emd.LicenseUrl?.value.replace(/http:/, "https:").replace(/\/$/, "") ||
        (emd.License ? licenseUrl(emd.License?.value) : ""),
      url: mwImage(file),
      thumbnail: mwImage(file, 400),
      width: imgInfo.width,
      height: imgInfo.height,
      format: imgInfo.mime.split("/").pop().toUpperCase(),
      aspect_ratio: Number((imgInfo.width / imgInfo.height).toFixed(2)),
    };
    if (emd.ImageDescription) image.description = emd.ImageDescription.value;
    if (emd.Attribution) image.attribution = emd.Attribution.value;
    else if (emd.Artist)
      image.attribution = `<em>${image.file}</em> from <a href="${image.url}" target="_blank">Wikimedia Commons</a> by ${emd.Artist.value}, ${emd.LicenseShortName.value}`;
    return image;
  }
}
