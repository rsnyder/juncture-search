import md5 from "js-md5";
import { sha256 } from "js-sha256";

export function mwImage(mwImg, width) {
  // Converts Wikimedia commons image URL to a thumbnail link
  mwImg = mwImg.split("File:").pop();
  mwImg = decodeURIComponent(mwImg).replace(/ /g, "_");
  const _md5 = md5(mwImg);
  const extension = mwImg.split(".").pop();
  let url = `https://upload.wikimedia.org/wikipedia/commons${
    width ? "/thumb" : ""
  }`;
  url += `/${_md5.slice(0, 1)}/${_md5.slice(0, 2)}/${mwImg}`;
  if (width) {
    url += `/${width}px-${mwImg}`;
    if (extension === "svg") {
      url += ".png";
    } else if (extension === "tif" || extension === "tiff") {
      url += ".jpg";
    }
  }
  return url.replace(/\?/g, "%3F");
}

export const commonsImageQualityAssessment = {
  Q63348049: "featured",
  Q63348069: "quality",
  Q63348040: "valued",
};

function wikimediaCommonsSource(url) {
  url = decodeURIComponent(url);
  url = url.replace(/Special:FilePath\//, "File:").replace(/ /g, "_");
  let path = url.split("/").slice(3);
  if (url.indexOf("https://upload.wikimedia.org/") === 0)
    url = `https://commons.wikimedia.org/wiki/File:${
      path[2] === "thumb" ? path[5] : path[4]
    }`;
  else if (url.indexOf("wikipedia.org/wiki") > 0)
    url = `https://commons.wikimedia.org/wiki/File:${path
      .pop()
      ?.split(":")
      .pop()}`;
  return url;
}

export function mwUrlHash(url) {
  return sha256(mwImage(wikimediaCommonsSource(url)));
}
