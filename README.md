# Juncture Search tool (aka Semantic Search tool)

The Plant Humanities Lab release in 2021 was accompanied with a search tool for finding images and journal articles, and presenting data extracted from the Wikidata knowledge graph.  The tool was at an alpha level of completeness and quality but showed much promise.

An updated version of the tool is currently under development.  The in-process version of the tool can seen at [https://search.juncture-digital.org](https://juncture-digital.org).

Improvements in this next version of the tool (will) include:

- Simplified user interface
- On-the-fly generation of IIIF manifests for images
- Support for Juncture drag-and-drop viewer tagging in Juncture editor
- Selecting and saving favorites
- Crowd sourced entity tagging
- Easier addition of new resource providers
- Federated image and document searching with endless-scroll viewing
- More options for filtering and sorting

The Juncture search tool is currently hosted with Netlify.  There are many conveniences with using Netlify (especially during development) but a different long-term deployment and hosting solution would probably makes sense, perhaps using AWS Amplify.  In the current configuration Netlify functions (AWS lambdas) are used as internal API endpoints for connecting with external resource providers, many of which require the use of access credentials.  When needed, external API credentials are stored in Netlify environment variables.

Credentials used by the service include:

- ATLAS - The password needed for the `mongo-user` user associated with the [Atlas hosted MongoDB database](https://cloud.mongodb.com/v2/5f3a4b4213e32d171bc11bc7#/metrics/replicaSet/646cfb73828ea36689e0ac0b/explorer/images/depicts/find) used for associating Wikidata QIDs with images.
- FLICKR_API_KEY
- GCP_CLIENT_EMAIL and GCP_PRIVATE_KEY - used for 
- JSTOR_API_KEY - A JWT for accessing the Labs JSTOR Search API
- OPENVERSE_CLIENT_ID and OPENVERSE_CLIENT_SECRET
- WCQS_OAUTH_TOKEN - Wikimedia Commons OAuth token, needed for querying the Wikimedia Commons Wikibase instance

#### Local development

From the root directory.

```bash
> npm run serve
```

#### Deployment

Netlify build/eployments are automatically triggered when changes are pushed to the `main` branch of the [juncture-digital/search](https://github.com/juncture-digital/search) repository.
