import { Openverse } from "./Openverse";
import type { Image } from "../../types";

export class Flickr extends Openverse {
  id: string = "flickr";
  name: string = "Flickr";
  static logo: string = "https://combo.staticflickr.com/pw/favicon.ico";
  logo: string = Flickr.logo;

  _source: string = "flickr";

  constructor(entity: any, refresh: boolean = false, limit: number = -1) {
    super(entity, refresh, limit);
  }

  async imageSelected(image: Image): Promise<string[]> {
    let flickrId = image.source?.split("/").pop() || "";

    return fetch(`/api/flickr/getInfo/${flickrId}`)
      .then((response) => response.json())
      .then((data) => data.photo)
      .then((photo) => {
        if (photo.description) {
          image.description = photo.description._content;
        }
        return fetch(`/api/flickr/getSizes/${flickrId}`);
      })
      .then((response) => response.json())
      .then((data) => data.sizes)
      .then((sizes) => {
        let original = sizes.size.find((s: any) => s.label === "Original");
        if (original) {
          image.url = original.source;
          image.width = original.width;
          image.height = original.height;
        }
        return [];
      });
  }
}
