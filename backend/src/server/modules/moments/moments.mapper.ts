import type {
  LatestMomentRecord,
  MomentDetailRecord,
} from "@/server/modules/moments/moments.repository";
import type {
  LatestMomentItemDto,
  LatestMomentsResultDto,
  MomentImageDto,
  MomentItemDto,
  MomentListResultDto,
  MomentRecipeVersionDto,
} from "@/server/modules/moments/moments.types";

function toDateString(value: Date) {
  return value.toISOString().slice(0, 10);
}

function mapMomentImageDto(
  record: MomentDetailRecord["images"][number],
): MomentImageDto {
  return {
    id: record.id,
    assetId: record.mediaAssetId,
    assetUrl: record.mediaAsset.assetUrl,
    width: record.mediaAsset.width ?? null,
    height: record.mediaAsset.height ?? null,
    sortOrder: record.sortOrder,
  };
}

function mapMomentRecipeVersionDto(
  record: MomentDetailRecord["recipeVersion"],
): MomentRecipeVersionDto | null {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    versionNumber: record.versionNumber,
    versionName: record.versionName,
  };
}

export function mapMomentItemDto(record: MomentDetailRecord): MomentItemDto {
  return {
    id: record.id,
    recipeId: record.recipeId,
    occurredOn: toDateString(record.occurredOn),
    content: record.content,
    participantsText: record.participantsText,
    tasteRating: record.tasteRating,
    difficultyRating: record.difficultyRating,
    isCoverCandidate: record.isCoverCandidate,
    images: record.images.map(mapMomentImageDto),
    recipeVersion: mapMomentRecipeVersionDto(record.recipeVersion),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function mapMomentListDto(input: {
  records: MomentDetailRecord[];
  page: number;
  pageSize: number;
  total: number;
}): MomentListResultDto {
  return {
    items: input.records.map(mapMomentItemDto),
    page: input.page,
    pageSize: input.pageSize,
    total: input.total,
    hasMore: input.page * input.pageSize < input.total,
  };
}

function buildPreviewText(record: LatestMomentRecord) {
  const content = record.content?.trim();

  if (content) {
    return content.length > 60 ? `${content.slice(0, 60)}...` : content;
  }

  const participantsText = record.participantsText?.trim();

  if (participantsText) {
    return `参与人：${participantsText}`;
  }

  return `${record.recipe.name}的新记录`;
}

export function mapLatestMomentItemDto(record: LatestMomentRecord): LatestMomentItemDto {
  return {
    momentId: record.id,
    recipeId: record.recipeId,
    recipeName: record.recipe.name,
    coverImageUrl: record.images[0]?.mediaAsset.assetUrl ?? record.recipe.coverImage?.assetUrl ?? null,
    occurredOn: toDateString(record.occurredOn),
    previewText: buildPreviewText(record),
  };
}

export function mapLatestMomentsDto(records: LatestMomentRecord[]): LatestMomentsResultDto {
  return {
    items: records.map(mapLatestMomentItemDto),
  };
}
