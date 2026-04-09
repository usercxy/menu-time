import type { Category, Tag } from "@prisma/client";

import type { CategoryDto, TagDto } from "@/server/modules/taxonomy/taxonomy.types";

type CategoryRecord = Pick<Category, "id" | "name" | "sortOrder" | "color">;
type TagRecord = Pick<Tag, "id" | "name" | "sortOrder">;

export function mapCategoryDto(record: CategoryRecord): CategoryDto {
  return {
    id: record.id,
    name: record.name,
    sortOrder: record.sortOrder,
    color: record.color,
  };
}

export function mapCategoryListDto(records: CategoryRecord[]) {
  return records.map(mapCategoryDto);
}

export function mapTagDto(record: TagRecord): TagDto {
  return {
    id: record.id,
    name: record.name,
    sortOrder: record.sortOrder,
  };
}

export function mapTagListDto(records: TagRecord[]) {
  return records.map(mapTagDto);
}
