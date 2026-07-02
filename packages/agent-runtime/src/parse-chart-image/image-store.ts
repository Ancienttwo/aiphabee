import type { FetchedChartImage } from "./types";

export const CHART_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const CHART_IMAGE_RETENTION_POLICY = "user_managed";
export const CHART_IMAGE_CONTENT_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

export type ChartImageContentType = (typeof CHART_IMAGE_CONTENT_TYPES)[number];

export type ChartImageRemovalStatus = "removed" | "not_found";

export interface ChartImageRecord {
  byte_size: number;
  content_hash_sha256: string;
  content_type: ChartImageContentType;
  created_at: string;
  deleted_at: string | null;
  id: string;
  r2_key: string;
  retention_policy: typeof CHART_IMAGE_RETENTION_POLICY;
  tenant_id: string;
  user_id: string;
}

export interface ChartImageMetadataStore {
  findActiveById(input: { id: string; tenant_id: string }): Promise<ChartImageRecord | null>;
  findActiveByKey(input: { r2_key: string; tenant_id: string }): Promise<ChartImageRecord | null>;
  insert(record: ChartImageRecord): Promise<void>;
  markRemoved(input: { id: string; removed_at: string; tenant_id: string }): Promise<ChartImageRecord | null>;
}

export interface ChartImageObject {
  arrayBuffer(): Promise<ArrayBuffer>;
  mediaType?: string | null;
}

export interface ChartImageObjectStore {
  get(key: string): Promise<ChartImageObject | null>;
  put(key: string, bytes: Uint8Array, options: { contentType: ChartImageContentType }): Promise<void>;
  remove(key: string): Promise<void>;
}

export interface UploadChartImageInput {
  bytes: Uint8Array;
  contentType: string;
  generateId: () => string;
  hashBytes: (bytes: Uint8Array) => Promise<string>;
  metadataStore: ChartImageMetadataStore;
  nowIso: () => string;
  objectStore: ChartImageObjectStore;
  tenant_id: string;
  user_id: string;
}

export interface UploadChartImageResult {
  image_ref: string;
  record: ChartImageRecord;
}

export interface RemoveChartImageInput {
  id: string;
  metadataStore: ChartImageMetadataStore;
  nowIso: () => string;
  objectStore: ChartImageObjectStore;
  tenant_id: string;
}

export interface RemoveChartImageResult {
  image_ref: string | null;
  record: ChartImageRecord | null;
  status: ChartImageRemovalStatus;
}

export type ChartImageUploadErrorCode =
  | "empty_image"
  | "image_too_large"
  | "invalid_content_type"
  | "invalid_identity_segment"
  | "invalid_image_id";

export class ChartImageUploadError extends Error {
  readonly code: ChartImageUploadErrorCode;

  constructor(code: ChartImageUploadErrorCode, message: string) {
    super(message);
    this.name = "ChartImageUploadError";
    this.code = code;
  }
}

const SAFE_SEGMENT = /^[A-Za-z0-9._-]{1,128}$/u;

export function normalizeChartImageContentType(value: string): ChartImageContentType | null {
  const normalized = value.trim().toLowerCase();
  return CHART_IMAGE_CONTENT_TYPES.includes(normalized as ChartImageContentType)
    ? (normalized as ChartImageContentType)
    : null;
}

export function isSafeChartImageSegment(value: string): boolean {
  return SAFE_SEGMENT.test(value) && value !== "." && value !== "..";
}

export function chartImageR2Key(input: { id: string; tenant_id: string }): string {
  if (!isSafeChartImageSegment(input.tenant_id)) {
    throw new ChartImageUploadError(
      "invalid_identity_segment",
      "tenant_id must be a safe object-key segment"
    );
  }
  if (!isSafeChartImageSegment(input.id)) {
    throw new ChartImageUploadError("invalid_image_id", "image id must be a safe object-key segment");
  }

  return `charts/${input.tenant_id}/${input.id}`;
}

export async function uploadChartImage(
  input: UploadChartImageInput
): Promise<UploadChartImageResult> {
  const contentType = normalizeChartImageContentType(input.contentType);
  if (contentType === null) {
    throw new ChartImageUploadError("invalid_content_type", "unsupported chart image content type");
  }

  if (input.bytes.byteLength <= 0) {
    throw new ChartImageUploadError("empty_image", "chart image bytes are empty");
  }

  if (input.bytes.byteLength > CHART_IMAGE_MAX_BYTES) {
    throw new ChartImageUploadError("image_too_large", "chart image exceeds max byte size");
  }

  if (!isSafeChartImageSegment(input.tenant_id) || !isSafeChartImageSegment(input.user_id)) {
    throw new ChartImageUploadError(
      "invalid_identity_segment",
      "tenant_id and user_id must be safe object-key segments"
    );
  }

  const id = input.generateId();
  const r2Key = chartImageR2Key({ id, tenant_id: input.tenant_id });
  const record: ChartImageRecord = {
    byte_size: input.bytes.byteLength,
    content_hash_sha256: await input.hashBytes(input.bytes),
    content_type: contentType,
    created_at: input.nowIso(),
    deleted_at: null,
    id,
    r2_key: r2Key,
    retention_policy: CHART_IMAGE_RETENTION_POLICY,
    tenant_id: input.tenant_id,
    user_id: input.user_id
  };

  await input.objectStore.put(r2Key, input.bytes, { contentType });
  try {
    await input.metadataStore.insert(record);
  } catch (error) {
    await input.objectStore.remove(r2Key).catch(() => undefined);
    throw error;
  }

  return { image_ref: r2Key, record };
}

export async function removeChartImage(
  input: RemoveChartImageInput
): Promise<RemoveChartImageResult> {
  const record = await input.metadataStore.findActiveById({
    id: input.id,
    tenant_id: input.tenant_id
  });
  if (record === null) {
    return { image_ref: null, record: null, status: "not_found" };
  }

  await input.objectStore.remove(record.r2_key);
  const removedAt = input.nowIso();
  const removedRecord =
    (await input.metadataStore.markRemoved({
      id: input.id,
      removed_at: removedAt,
      tenant_id: input.tenant_id
    })) ?? { ...record, deleted_at: removedAt };

  return { image_ref: record.r2_key, record: removedRecord, status: "removed" };
}

export function createStoredChartImageFetchImage(input: {
  metadataStore: ChartImageMetadataStore;
  objectStore: ChartImageObjectStore;
}): (imageRef: string, context: { tenant_id: string }) => Promise<FetchedChartImage | null> {
  return async (imageRef, context) => {
    if (!imageRef.startsWith(`charts/${context.tenant_id}/`)) {
      return null;
    }

    const record = await input.metadataStore.findActiveByKey({
      r2_key: imageRef,
      tenant_id: context.tenant_id
    });
    if (record === null) {
      return null;
    }

    const object = await input.objectStore.get(record.r2_key);
    if (object === null) {
      return null;
    }

    const buffer = await object.arrayBuffer();
    const mediaType =
      (typeof object.mediaType === "string"
        ? normalizeChartImageContentType(object.mediaType)
        : null) ?? record.content_type;

    return {
      bytes: new Uint8Array(buffer),
      mediaType
    };
  };
}
