import fetch from "node-fetch";

export async function handler(event, context, callback) {
  let path = event.path.split("/").filter((pe) => pe);
  const photoid = path.pop();
  const method = path.pop(); // getExif, getInfo, getSizes, getFavorites, getComments, getSizes, getExif, getFavorites, getComments, getNotInSet, getPerms, getGeoPerms, getAllContexts, getRecentContexts, getPublicList, getList, getListPhotos, getPopular, getRelated, getSearch, getPhotosOf, getPeoplePhotos, getPhotos, getContactsPhotos, getPhotosetPhotos, getGalleriesPhotos, getGroupsPhotos, getNotInSet, getRecent, getContactsPublicPhotos, getContacts, getPhotosOf, getPeople, getPhotos, getPhotosets, getGalleries, getGroups, getPublicGroups, getTopics, getReplies, getTopics, getReplies, getMethod

  let url = `https://www.flickr.com/services/rest/?method=flickr.photos.${method}&api_key=${process.env.FLICKR_API_KEY}&photo_id=${photoid}&format=json&nojsoncallback=1`;
  let resp = await fetch(url).catch((err) => {
    console.log(err);
  });
  if (resp.ok) {
    resp = await resp.json();
    return { statusCode: 200, body: JSON.stringify(resp) };
  }
}
