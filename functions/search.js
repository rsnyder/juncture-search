import axios from "axios";

const labsSearchEndpoint = "https://www.jstor.org/api/labs-search-service";

export async function handler(event, context, callback) {
  let pathElems = event.path
    .split("/")
    .filter((pathElem) => pathElem)
    .slice(2, 6);
  let endpoint = `${labsSearchEndpoint}/${pathElems.join("/")}/`;
  let resp;
  if (event.httpMethod === "POST") {
    resp = await axios.post(endpoint, event.body, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${process.env.LABS_API_TOKEN}`,
      },
    });
  } else if (event.httpMethod === "PUT") {
    resp = await axios.put(endpoint, event.body, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${process.env.LABS_API_TOKEN}`,
      },
    });
  }
  if (resp.status === 200) {
    return {
      statusCode: resp.status,
      body: JSON.stringify(resp.data),
      headers: { "Content-Type": "application/json" },
    };
  } else return { statusCode: resp.status, body: resp.statusText };
}
