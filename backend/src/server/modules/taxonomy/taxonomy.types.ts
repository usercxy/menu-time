export type HouseholdScopedInput = {
  householdId: string;
};

export type IncludeArchivedInput = {
  includeArchived?: boolean;
};

export type HouseholdScopedEntityInput = HouseholdScopedInput &
  IncludeArchivedInput & {
    id: string;
  };

export type HouseholdScopedNameInput = HouseholdScopedInput & {
  name: string;
  excludeId?: string;
};

export type TaxonomyListInput = HouseholdScopedInput & IncludeArchivedInput;

export type CategoryCreateInput = HouseholdScopedInput & {
  name: string;
  color?: string | null;
  sortOrder?: number;
};

export type CategoryUpdateInput = HouseholdScopedInput & {
  id: string;
  name?: string;
  color?: string | null;
  sortOrder?: number;
};

export type TagCreateInput = HouseholdScopedInput & {
  name: string;
  sortOrder?: number;
};

export type TagUpdateInput = HouseholdScopedInput & {
  id: string;
  name?: string;
  sortOrder?: number;
};

export type CategoryDto = {
  id: string;
  name: string;
  sortOrder: number;
  color: string | null;
};

export type TagDto = {
  id: string;
  name: string;
  sortOrder: number;
};

export type DeleteTaxonomyResultDto = {
  deleted: true;
};

export type TaxonomyReorderItem = {
  id: string;
  sortOrder: number;
};

export type CategoryReorderInput = HouseholdScopedInput & {
  items: TaxonomyReorderItem[];
};

export type TagReorderInput = HouseholdScopedInput & {
  items: TaxonomyReorderItem[];
};

export type CategoryCreatePayload = {
  name: string;
  color?: string | null;
  sortOrder?: number;
};

export type CategoryUpdatePayload = {
  name?: string;
  color?: string | null;
  sortOrder?: number;
};

export type TagCreatePayload = {
  name: string;
  sortOrder?: number;
};

export type TagUpdatePayload = {
  name?: string;
  sortOrder?: number;
};
