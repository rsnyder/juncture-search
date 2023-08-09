const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = `mongodb+srv://${process.env.ATLAS}/?retryWrites=true&w=majority`
const client = new MongoClient(uri,  {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
})

export async function handler(event, context, callback) {

  const pathElems = event.path.split('/').filter(pe => pe)
  const qid = pathElems.pop()

  try {
    console.log('Connecting to Atlas server')
    await client.connect()
    console.log('Pinging Atlas server')

    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 })
    console.log('Connected successfully to Atlas server')

    const imagesDb = client.db('images')
    const depictsCollection = imagesDb.collection('depicts')
    const cursor = await depictsCollection.find({ depicts: qid })
    const docs = (await cursor.toArray()).map(d => {d.source='atlas'; return d})

    console.log('atlas', Object.keys(docs).length)

    return { statusCode: 200, body: JSON.stringify(docs)}
  } finally {
    await client.close()
  }
}