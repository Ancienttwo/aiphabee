import { describe, expect, it } from "vitest";
import {
  CHART_IMAGE_MAX_BYTES,
  CHART_IMAGE_RETENTION_POLICY,
  ChartImageUploadError,
  createStoredChartImageFetchImage,
  removeChartImage,
  uploadChartImage,
  type ChartImageMetadataStore,
  type ChartImageObjectStore,
  type ChartImageRecord
} from "./image-store";

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
const HASH = `sha256:${"a".repeat(64)}`;

const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer =>
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

const makeStores = () => {
  const records = new Map<string, ChartImageRecord>();
  const objects = new Map<string, { bytes: Uint8Array; contentType: string }>();
  const removedKeys: string[] = [];

  const metadataStore: ChartImageMetadataStore = {
    findActiveById: async ({ id, tenant_id }) =>
      [...records.values()].find(
        (record) => record.id === id && record.tenant_id === tenant_id && record.deleted_at === null
      ) ?? null,
    findActiveByKey: async ({ r2_key, tenant_id }) =>
      records.get(`${tenant_id}:${r2_key}`)?.deleted_at === null
        ? (records.get(`${tenant_id}:${r2_key}`) ?? null)
        : null,
    insert: async (record) => {
      records.set(`${record.tenant_id}:${record.r2_key}`, record);
    },
    markRemoved: async ({ id, removed_at, tenant_id }) => {
      const record =
        [...records.values()].find(
          (candidate) => candidate.id === id && candidate.tenant_id === tenant_id
        ) ?? null;
      if (record === null || record.deleted_at !== null) {
        return null;
      }
      const next = { ...record, deleted_at: removed_at };
      records.set(`${record.tenant_id}:${record.r2_key}`, next);
      return next;
    }
  };

  const objectStore: ChartImageObjectStore = {
    get: async (key) => {
      const object = objects.get(key);
      return object
        ? {
            arrayBuffer: async () => toArrayBuffer(object.bytes),
            mediaType: object.contentType
          }
        : null;
    },
    put: async (key, bytes, options) => {
      objects.set(key, { bytes, contentType: options.contentType });
    },
    remove: async (key) => {
      removedKeys.push(key);
      objects.delete(key);
    }
  };

  return { metadataStore, objects, objectStore, records, removedKeys };
};

describe("chart image store contracts", () => {
  it("uploads a tenant-scoped chart image to object storage and records metadata only", async () => {
    const { metadataStore, objects, objectStore, records } = makeStores();

    const result = await uploadChartImage({
      bytes: PNG_BYTES,
      contentType: "image/png",
      generateId: () => "img-1",
      hashBytes: async () => HASH,
      metadataStore,
      nowIso: () => "2026-07-03T00:00:00.000Z",
      objectStore,
      tenant_id: "tenant-a",
      user_id: "user-a"
    });

    expect(result.image_ref).toBe("charts/tenant-a/img-1");
    expect(objects.has("charts/tenant-a/img-1")).toBe(true);
    expect(records.get("tenant-a:charts/tenant-a/img-1")).toMatchObject({
      byte_size: PNG_BYTES.byteLength,
      content_hash_sha256: HASH,
      content_type: "image/png",
      deleted_at: null,
      retention_policy: CHART_IMAGE_RETENTION_POLICY,
      tenant_id: "tenant-a",
      user_id: "user-a"
    });
  });

  it("rejects unsupported content types before writing object storage", async () => {
    const { metadataStore, objects, objectStore } = makeStores();

    await expect(
      uploadChartImage({
        bytes: PNG_BYTES,
        contentType: "image/gif",
        generateId: () => "img-1",
        hashBytes: async () => HASH,
        metadataStore,
        nowIso: () => "2026-07-03T00:00:00.000Z",
        objectStore,
        tenant_id: "tenant-a",
        user_id: "user-a"
      })
    ).rejects.toMatchObject({ code: "invalid_content_type" } satisfies Partial<ChartImageUploadError>);

    expect(objects.size).toBe(0);
  });

  it("rejects byte payloads above the max size before writing object storage", async () => {
    const { metadataStore, objects, objectStore } = makeStores();

    await expect(
      uploadChartImage({
        bytes: new Uint8Array(CHART_IMAGE_MAX_BYTES + 1),
        contentType: "image/png",
        generateId: () => "img-1",
        hashBytes: async () => HASH,
        metadataStore,
        nowIso: () => "2026-07-03T00:00:00.000Z",
        objectStore,
        tenant_id: "tenant-a",
        user_id: "user-a"
      })
    ).rejects.toMatchObject({ code: "image_too_large" } satisfies Partial<ChartImageUploadError>);

    expect(objects.size).toBe(0);
  });

  it("removes the object when metadata insert fails after upload", async () => {
    const { metadataStore, objects, objectStore, removedKeys } = makeStores();
    metadataStore.insert = async () => {
      throw new Error("metadata unavailable");
    };

    await expect(
      uploadChartImage({
        bytes: PNG_BYTES,
        contentType: "image/png",
        generateId: () => "img-1",
        hashBytes: async () => HASH,
        metadataStore,
        nowIso: () => "2026-07-03T00:00:00.000Z",
        objectStore,
        tenant_id: "tenant-a",
        user_id: "user-a"
      })
    ).rejects.toThrow("metadata unavailable");

    expect(objects.has("charts/tenant-a/img-1")).toBe(false);
    expect(removedKeys).toEqual(["charts/tenant-a/img-1"]);
  });

  it("resolves bytes only after the tenant-owned active metadata row matches the imageRef", async () => {
    const { metadataStore, objectStore } = makeStores();
    await uploadChartImage({
      bytes: PNG_BYTES,
      contentType: "image/png",
      generateId: () => "img-1",
      hashBytes: async () => HASH,
      metadataStore,
      nowIso: () => "2026-07-03T00:00:00.000Z",
      objectStore,
      tenant_id: "tenant-a",
      user_id: "user-a"
    });

    const fetchImage = createStoredChartImageFetchImage({ metadataStore, objectStore });

    await expect(fetchImage("charts/tenant-a/img-1", { tenant_id: "tenant-a" })).resolves.toEqual({
      bytes: PNG_BYTES,
      mediaType: "image/png"
    });
    await expect(fetchImage("charts/tenant-a/img-1", { tenant_id: "tenant-b" })).resolves.toBeNull();
    await expect(fetchImage("charts/tenant-b/img-1", { tenant_id: "tenant-a" })).resolves.toBeNull();
  });

  it("falls back to the metadata content type when R2 returns a non-canonical media type", async () => {
    const { metadataStore, objectStore, objects } = makeStores();
    await uploadChartImage({
      bytes: PNG_BYTES,
      contentType: "image/png",
      generateId: () => "img-1",
      hashBytes: async () => HASH,
      metadataStore,
      nowIso: () => "2026-07-03T00:00:00.000Z",
      objectStore,
      tenant_id: "tenant-a",
      user_id: "user-a"
    });
    objects.set("charts/tenant-a/img-1", {
      bytes: PNG_BYTES,
      contentType: "image/png; charset=utf-8"
    });

    const fetchImage = createStoredChartImageFetchImage({ metadataStore, objectStore });

    await expect(fetchImage("charts/tenant-a/img-1", { tenant_id: "tenant-a" })).resolves.toEqual({
      bytes: PNG_BYTES,
      mediaType: "image/png"
    });
  });

  it("removes the object and makes later fetches resolve as absent", async () => {
    const { metadataStore, objectStore, removedKeys } = makeStores();
    await uploadChartImage({
      bytes: PNG_BYTES,
      contentType: "image/png",
      generateId: () => "img-1",
      hashBytes: async () => HASH,
      metadataStore,
      nowIso: () => "2026-07-03T00:00:00.000Z",
      objectStore,
      tenant_id: "tenant-a",
      user_id: "user-a"
    });

    const result = await removeChartImage({
      id: "img-1",
      metadataStore,
      nowIso: () => "2026-07-03T00:05:00.000Z",
      objectStore,
      tenant_id: "tenant-a"
    });
    const fetchImage = createStoredChartImageFetchImage({ metadataStore, objectStore });

    expect(result).toMatchObject({
      image_ref: "charts/tenant-a/img-1",
      status: "removed"
    });
    expect(removedKeys).toEqual(["charts/tenant-a/img-1"]);
    await expect(fetchImage("charts/tenant-a/img-1", { tenant_id: "tenant-a" })).resolves.toBeNull();
  });

  it("keeps metadata active when object removal fails so deletion can be retried", async () => {
    const { metadataStore, objectStore, objects, removedKeys } = makeStores();
    await uploadChartImage({
      bytes: PNG_BYTES,
      contentType: "image/png",
      generateId: () => "img-1",
      hashBytes: async () => HASH,
      metadataStore,
      nowIso: () => "2026-07-03T00:00:00.000Z",
      objectStore,
      tenant_id: "tenant-a",
      user_id: "user-a"
    });
    const originalRemove = objectStore.remove;
    objectStore.remove = async () => {
      throw new Error("r2 unavailable");
    };

    await expect(
      removeChartImage({
        id: "img-1",
        metadataStore,
        nowIso: () => "2026-07-03T00:05:00.000Z",
        objectStore,
        tenant_id: "tenant-a"
      })
    ).rejects.toThrow("r2 unavailable");

    expect(objects.has("charts/tenant-a/img-1")).toBe(true);
    expect(removedKeys).toEqual([]);
    await expect(
      metadataStore.findActiveById({ id: "img-1", tenant_id: "tenant-a" })
    ).resolves.toMatchObject({
      deleted_at: null,
      id: "img-1"
    });

    objectStore.remove = originalRemove;
    await expect(
      removeChartImage({
        id: "img-1",
        metadataStore,
        nowIso: () => "2026-07-03T00:06:00.000Z",
        objectStore,
        tenant_id: "tenant-a"
      })
    ).resolves.toMatchObject({
      image_ref: "charts/tenant-a/img-1",
      status: "removed"
    });
    expect(objects.has("charts/tenant-a/img-1")).toBe(false);
  });
});
