export interface CategoryDTO {
  id: string
  name: string
  sortOrder: number
  color?: string
}

export interface TagDTO {
  id: string
  name: string
  sortOrder: number
}

export interface CategoryMutationPayload {
  name: string
  color?: string | null
}

export interface TagMutationPayload {
  name: string
}
