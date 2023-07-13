export function findQids(claims:any): string[] {
  let qids: Set<string> = new Set()
  Object.entries(claims).forEach((args: any) => {
    qids.add(args[0])
    args[1].forEach((val: any) => {
      if (val.mainsnak.snaktype === 'value') {
        if (val.mainsnak.datavalue?.type === 'wikibase-entityid') qids.add(val.mainsnak.datavalue.value.id)
        else if (val.mainsnak.datavalue?.type === 'wikibase-property') qids.add(val.mainsnak.datavalue.value.id)
        else if (val.mainsnak.datavalue?.type === 'quantity') qids.add(val.mainsnak.datavalue.value.unit.split('/').pop())
        // else console.log(val.mainsnak.datavalue?.type)
      }
      
      if (val.qualifiers) {
        Object.values(val.qualifiers).forEach((qvals: any) => {
          qvals.forEach((qval: any) => {
            qids.add(qval.property)
            if (qval.snaktype === 'value') {
              if (qval.datavalue?.type === 'wikibase-entityid') qids.add(qval.datavalue.value.id)
              if (qval.datavalue?.type === 'quantity') qids.add(qval.datavalue.value.unit.split('/').pop())
            }
          })
        })
      }
      if (val.references) {
        val.references.forEach((ref: any) => {
          Object.values(ref.snaks).forEach((rs: any) => {
            Object.values(rs).forEach((rval: any) => {
              qids.add(rval.property)
              if (rval.snaktype === 'value') {
                if (rval.datavalue?.type === 'wikibase-entityid') qids.add(rval.datavalue.value.id)
                if (rval.datavalue?.type === 'quantity') qids.add(rval.datavalue.value.unit.split('/').pop())
              }
            })
          })
        })
      }
    })

  })
  return Array.from(qids)
}

export function langLabels(labels:any, language:string) {
  return Object.fromEntries(
    Object.keys(labels)
    .map(eid => [eid, labels[eid][language] || labels[eid]['en'] || '']))
}