import fetch from 'node-fetch'

console.log(process.env.OPENVERSE_CLIENT_ID, process.env.OPENVERSE_CLIENT_SECRET)
let access_token
async function get_access_token() {
  let resp = await fetch('https://api.openverse.engineering/v1/auth_tokens/token/', {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json'},
      body: [
        `client_id=${process.env.OPENVERSE_CLIENT_ID}`,
        `client_secret=${process.env.OPENVERSE_CLIENT_SECRET}`,
        'grant_type=client_credentials'
      ].join('&')
    })
  if (resp.ok) {
    resp = await resp.json()
    return resp.access_token
  }
}

export async function handler(event, context, callback) {
  if (!access_token) access_token = await get_access_token()

  let args = event.queryStringParameters || {}
  let qargs = Object.keys(args).map(k => `${k}=${args[k]}`).join('&')

  let resp = await fetch(`https://api.openverse.engineering/v1/images/?${qargs}`, {
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  })
  .catch(err => {
    console.log(err)
  })
  console.log(resp.status, resp.statusText)
  if (resp.ok) {
    resp = await resp.json()
    return { statusCode: 200, body: JSON.stringify(resp)}
  }
}