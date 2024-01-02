import type { Image } from "../../types";

export class ImageProvider {
  id: string = "image-provider";
  name: string = "Image Provider";
  logo: string = "";

  _commonsCategory: string = "";
  _depicts: any = {};
  _entity: any;
  _qid: string = "";
  _refresh: boolean = false;
  _cursor = -1;
  _hasMore: boolean = true;
  _limit = -1;

  _images: Image[] = [];
  _filteredAndSorted: Image[] = [];
  _imageExtensions = new Set("jpg jpeg png gif svg tif tiff".split(" "));

  _sortBy = "score";
  _filters: any = [];

  constructor(entity: any, refresh: boolean = false, limit: number = -1) {
    this._entity = entity;
    this._qid = entity.id;
    this._commonsCategory =
      entity.claims.P373?.[0].mainsnak.datavalue.value.replace(/ /g, "_");
    this._refresh = refresh;
    this._limit = limit;
  }

  reset() {
    console.log(`${this.id}.reset`);
    this._cursor = this._cursor > 0 ? 0 : this._cursor;
  }

  hasMore() {
    return this._cursor < this._images.length || this._hasMore;
  }

  async next(howMany: number = 50): Promise<Image[]> {
    if (this._cursor < 0) {
      this._cursor = 0;
      await this._doQuery();
    } else if (
      this._hasMore &&
      this._cursor + howMany * 2 > this._images.length
    ) {
      this._doQuery();
    }
    let next = this._filteredAndSorted.slice(
      this._cursor,
      this._cursor + howMany,
    );
    console.log(
      `${this.id}.next: qid=${this._qid} cursor=${
        this._cursor
      } howMany=${howMany} images=${this._images.length} from_cache=${!this
        ._hasMore} next=${next.length}`,
    );
    this._cursor += next.length;
    return next;
  }

  async getDepicts(filter: string[] = []) {
    let depictsFilter = new Set(filter);
    return Object.fromEntries(
      Object.entries(this._depicts).filter(
        ([qid, count]) => depictsFilter.size === 0 || depictsFilter.has(qid),
      ),
    );
  }

  async imageSelected(image: Image): Promise<string[]> {
    return [];
  }

  async _doQuery() {
    if (!this._refresh) {
      let cacheKey = `${this.id}-${this._qid}`;
      let cachedResults = await fetch(`/api/cache/${cacheKey}`);
      if (cachedResults.ok) {
        this._images = await cachedResults.json();
        this._filterAndSort();
        return;
      }
    }

    this._images = [];
    this._filterAndSort();

    if (this._images?.length) this._cacheResults();
  }

  _filterAndSort(sortBy: string = this._sortBy, filters: any = this._filters) {
    this._sortBy = sortBy;
    this._filters = filters;
    this._cursor = 0;
    if (this._sortBy === "score")
      this._filteredAndSorted = [
        ...this._images.sort((a: any, b: any) => b.score - a.score),
      ];
    else if (this._sortBy === "size")
      this._filteredAndSorted = [
        ...this._filteredAndSorted.sort((a: any, b: any) => b.size - a.size),
      ];
    if (this._limit >= 0)
      this._filteredAndSorted = this._filteredAndSorted.slice(0, this._limit);
    return this;
  }

  _cacheResults() {
    let cacheKey = `${this.id}-${this._qid}`;
    fetch(`/api/cache/${cacheKey}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(this._images),
    });
  }

  _scoreImages(images) {
    return images.map((img) => {
      img.score = 0;
      if (img.imageQualityAssessment === "featured") img.score += 3;
      else if (img.imageQualityAssessment === "quality") img.score += 2;
      else if (img.imageQualityAssessment === "valued") img.score += 1;
      return img;
    });
  }
}
