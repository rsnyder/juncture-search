interface Depicted {
  id: string
  prominent?: boolean
  dro?: boolean
}

interface Image {
  api: string
  aspect_ratio: number
  attribution?: string
  coords?: string
  createdBy?: string // QID
  creator?: string
  creator_url?: string
  depicts?: Depicted[]
  description?: string
  detail_url?: string
  file?: string
  foreign_landing_url?: string
  format?: string
  id: string
  iiif: string  // IIIF manifest URL
  imageQualityAssessment?: string
  height?: number
  license: string // URL
  logo?: string   // provider logo
  pageid?: string
  provider?: string  // name of provider
  raw: object
  score?: number
  size?: number
  source?: string
  tags?: string[]
  title?: string
  thumbnail?: string
  url?: string
  width?: number
}

export { Image } 