import { defineStore } from 'pinia'
import { toRaw } from 'vue'
import { findQids, langLabels } from '../utils'
import { Md5 } from 'ts-md5'
import { sha256 } from 'js-sha256'

function tokenIsValid(expiration:number) {
  let isExpired = expiration <= Date.now()
  return !isExpired
}

type Entity = {
  id: string,
  label: string
  description: string
  aliases: string[],
  claims: any,
  summaryText: any,
  sitelinks: any
}

export const useEntitiesStore = defineStore('entities', {
  
  state: () => ({
    active: '',
    allLabels: {},
    articlesMap: {},
    entity: <Entity>{},
    entityData: {},
    fetching: false,
    imagesMap: {},
    isLoggedIn: false,
    labels: {},
    labelsFetching: false,
    language: 'en',
    urlformatters: {},
    urlformattersFetching: false,
    qid: '',
    user: <any|null>null,
    userid: null
  }),

  getters: {
    entities(state) {
      return state.entityData
    },

    isFetching(state) {
      return state.fetching
    }
  },

  actions: {
    
    addEntities(entities:any[]) {
      let before = Object.keys(this.entityData).length
      this.entityData = {...this.entityData, ...Object.fromEntries(entities.map(ent => [ent.id, ent]))}
      let after = Object.keys(this.entityData).length
      // console.log(`addEntities: ${before} -> ${after}`)
    },

    setUser(user:any) {
      this.user = user
      this.isLoggedIn = user !== null && (user.provider === 'github' || tokenIsValid(user.tokenExpiration))
      this.userid = user !== null 
        ? sha256(user.email.toLowerCase().trim())
        : null
    },

    async fetch(eid:any, addSummaryText:boolean = false) {
      if (!eid) return
      // console.log(`entities.fetch: eid=${eid} exists=${this.entityData[eid] !== undefined}`)
      if (eid && !this.entityData[eid]) {
        this.fetching = true
        let url = eid[0] === 'M'
          ? `https://commons.wikimedia.org/wiki/Special:EntityData/${eid}.json`
          : `https://www.wikidata.org/wiki/Special:EntityData/${eid}.json`
        const response = await fetch(url)
        try {
          const result = await response.json()
          Object.values(result.entities).forEach((entity:any) => {
            if (entity.statements) {
              entity.claims = entity.statements
              delete entity.statements
            }
            entity.summaryText = {}
            if (entity.claims.P18) {
              entity.image = entity.claims.P18[0].mainsnak.datavalue.value
              entity.thumbnail = this.mwImage(entity.image)
            }
          })
          this.entityData = {...this.entityData, ...result.entities}
          let labelUpdates = {}
          findQids(result.entities[eid].claims).forEach(eid => { 
            if (!this.allLabels[eid]) labelUpdates[eid] = {}
            if (eid[0] === 'P' && !this.urlformatters[eid]) this.urlformatters[eid] = undefined
          })
          if (Object.keys(labelUpdates).length > 0) {
            this.allLabels = {...this.allLabels, ...labelUpdates}
            this.updateLabels()
          }
          this.updateUrlformatters()
        } catch (err) {
          console.error('Error loading entities:', err)
        }
        this.fetching = false
      }
      // return this.entityData[eid]
      let entity = this.entityData[eid]
      return this.setEntityForLanguage(entity, this.language, addSummaryText)
    },
    
    setQid(qid:any) {
      if (qid !== this.qid) {
        this.qid = qid
        if (this.entityData[qid]) {
          this.updateLabels()
        } else if (qid) {
          this.fetch(qid)
        }
      }
    },

    setLanguage(lang:any) {
      if (lang !== this.language) {
        this.language = lang
        // console.log(`language=${this.language}`)
        // this.entity = this.setEntityForLanguage(this.qid, this.language, this.entityData)
        this.updateLabels(this.language)
      }
    },

    setActive(active:string) {
      if (active !== this.active) this.active = active
    },

    async updateLabels(qids:string[] = []) {
      // console.log(`updateLabels: qids=${qids.length}`)
      let before = Object.keys(this.allLabels).length
      for (let qid of qids) {
        if (!this.allLabels[qid]) this.allLabels[qid] = {}
      }
      // console.log(`updateLabels: ${before} -> ${Object.keys(this.allLabels).length}`)
      if (!this.labelsFetching) {
        let toUpdate = Object.keys(this.allLabels).filter(qid => this.allLabels[qid][this.language] === undefined)
        // console.log(`updateLabels: toUpdate=${toUpdate.length} language=${this.language}`)
        if (toUpdate.length > 0) {
          this.labelsFetching = true
          let values = toUpdate.map(qid => `(<http://www.wikidata.org/entity/${qid}>)`).join(' ')
          let query = `SELECT ?item ?label WHERE { VALUES (?item) { ${values} } ?item rdfs:label ?label . FILTER (LANG(?label) = "${this.language}" || LANG(?label) = "en") .}`
          let resp:any = await fetch('https://query.wikidata.org/sparql', {
            method: 'POST',
            body: new URLSearchParams({query}), 
            headers: { Accept: 'application/sparql-results+json', 'Content-type': 'application/x-www-form-urlencoded' }
          })

          if (resp.ok) {
            let sparqlResp = await resp.json()
            let labels = {...this.allLabels}
            sparqlResp.results.bindings.forEach((rec: any) => {
              let qid = rec.item.value.split('/').pop()
              let label = rec.label.value
              let lang = rec.label['xml:lang']
              labels[qid][lang] = label
            })
            this.allLabels = labels
          }
          this.labelsFetching = false
        }
        this.labels = langLabels(this.allLabels, this.language)
      }
    },

    async updateUrlformatters() {
      if (!this.urlformattersFetching) {
        let qids = Object.keys(this.urlformatters).filter((pid: string) => this.urlformatters[pid] === undefined)
        // console.log(`updateUrlformatters: qids=${qids.length}`)
        if (qids.length > 0) {
          this.urlformattersFetching = true
          let values = qids.map(pid => `(<http://www.wikidata.org/entity/${pid}>)`).join(' ')
          let query = `SELECT ?prop ?url WHERE { VALUES (?prop) { ${values} } ?prop wdt:P1630 ?url . }`
          let resp = await fetch('https://query.wikidata.org/sparql', {
            method: 'POST', body: `query=${encodeURIComponent(query)}`, 
            headers: { Accept: 'application/sparql-results+json', 'Content-Type': 'application/x-www-form-urlencoded' }
          })
          let sparqlResp = await resp.json()
          let urlformatters = {...this.urlformatters}
          let updates = Object.fromEntries(sparqlResp.results.bindings.map((rec: any) => [rec.prop.value.split('/').pop(), rec.url.value]))
          if (Object.keys(updates).length > 0) this.urlformatters = {...this.urlformatters, ...updates}
          Object.keys(urlformatters).forEach(pid => urlformatters[pid] = urlformatters[pid] || updates[pid] || null)
          this.urlformatters = urlformatters
        }
        this.urlformattersFetching = false
      }
    },

    async setEntityForLanguage(entity:any, language:string='', addSummaryText:boolean=false) {
      language = language || this.language
      let revised:any = { id: entity.id }
      if (entity.labels && Object.keys(entity.labels).length > 0) revised.label = entity.labels[language]?.value || entity.labels.en?.value || entity.labels[Object.keys(entity.labels)[0]].value
      if (entity.descriptions && Object.keys(entity.descriptions).length > 0) revised.description = entity.descriptions[language]?.value || entity.descriptions.en?.value || entity.descriptions[Object.keys(entity.descriptions)[0]].value
      if (entity.aliases && Object.keys(entity.aliases).length > 0) revised.aliases = (entity.aliases[language] || entity.aliases.en || entity.aliases[Object.keys(entity.aliases)[0]]).map((a:any) => a.value)
      if (entity.claims) revised.claims = entity.claims
      if (entity.image) revised.image = entity.image
      if (entity.thumbnail) revised.thumbnail = entity.thumbnail

      if (entity.sitelinks && entity.sitelinks[`${language}wiki`]) {
        revised.sitelinks = entity.sitelinks[`${language}wiki`]
        if (addSummaryText) {
          if (entity.summaryText[language]) {
            revised.summaryText = entity.summaryText[language]
          } else {
            let page: number = entity.sitelinks[`${language}wiki`].url.replace(/\/w\//, '/wiki').split('/wiki/').pop()
            let resp:any = await fetch(`https://${language}.wikipedia.org/api/rest_v1/page/summary/${page}`)
            if (resp.ok) {
              resp = await resp.json()
            }
            entity.summaryText[language] = resp['extract_html'] || resp['extract']
            revised.summaryText = entity.summaryText[language]
          }
        }
      }
      return revised
    },

    mwImage(mwImg:any, width:number=300) {
      // Converts Wikimedia commons image URL to a thumbnail link
      if (Array.isArray(mwImg)) mwImg = mwImg[0]
      mwImg = mwImg.split('/').pop()
      mwImg = decodeURIComponent(mwImg).replace(/ /g,'_')
      const _md5 = Md5.hashStr(mwImg)
      const extension = mwImg.split('.').pop()
      let url = `https://upload.wikimedia.org/wikipedia/commons${width ? '/thumb' : ''}`
      url += `/${_md5.slice(0,1)}/${_md5.slice(0,2)}/${mwImg}`
      if (width) {
        url += `/${width}px-${mwImg}`
        if (extension === 'svg') {
          url += '.png'
        } else if (extension === 'tif' || extension === 'tiff') {
          url += '.jpg'
        }
      }
      return url
    }

  }
})
