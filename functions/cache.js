const { Storage } = require('@google-cloud/storage')

const BUCKET_NAME = 'juncture-search'

const client_email = process.env.GCP_CLIENT_EMAIL
const private_key = process.env.GCP_PRIVATE_KEY.split('\\n').join('\n')

export async function handler(event) {

  try {
    const qid = event.path.split('/').filter(pe => pe).pop()

    if (event.httpMethod === 'GET') {
      
      try {
        const storage = new Storage({projectId: 'visual-essays', credentials: { client_email, private_key } })
        const contents = await storage.bucket(BUCKET_NAME).file(`${qid}.json`).download()
        return { statusCode: 200, body: JSON.parse(contents) }
      } catch(e) {
        // console.log(e);
        return { statusCode: 404, body: e.toString() }
      }
    
    } else if (event.httpMethod === 'PUT') {
      
      try {
        const storage = new Storage({projectId: 'visual-essays', credentials: { client_email, private_key } })
        await storage.bucket(BUCKET_NAME).file(`${qid}.json`).save(JSON.stringify(event.body))
        return { statusCode: 201 }
      } catch(e) {
        console.log(e);
        return { statusCode: 500 }
      }

    } else {
      return { statusCode: 405, body: 'Method Not Allowed' }
    }

  } catch (e) { 
    console.log(e)
    return { statusCode: 500, body: e.toString() }
  }
}