import { describe, expect, it } from "vitest";
import app from "./index";

const localIpoDatabaseUrl = process.env.AIPHABEE_IPO_TEST_DATABASE_URL;
const itWithLocalDb = localIpoDatabaseUrl === undefined ? it.skip : it;

describe("IPO local Postgres route smoke", () => {
  itWithLocalDb("honors the released data_version gate through the worker route", async () => {
    const response = await app.request(
      "/workbench/ipo/snapshot",
      {
        body: JSON.stringify({ ipo_id: "2649" }),
        headers: {
          "content-type": "application/json",
          "x-request-id": "req-local-ipo-postgres-smoke"
        },
        method: "POST"
      },
      {
        AIPHABEE_HYPERDRIVE: {
          connectionString: localIpoDatabaseUrl
        }
      }
    );
    const body = (await response.json()) as {
      data?: {
        dataVersion: string;
        liveDataAccess: boolean;
        offering: { hkexCode: string };
        status: string;
      };
      data_version: string;
      error?: { code: string };
      ok: boolean;
    };

    if (response.status === 404) {
      expect(body.ok).toBe(false);
      expect(body.error?.code).toBe("NOT_FOUND");
      expect(body.data_version).toBe("ipo-no-released-data-version");
      return;
    }

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      liveDataAccess: true,
      status: "released_serving"
    });
    expect(body.data?.dataVersion).toMatch(/^ipo-mdb-/u);
    expect(body.data?.offering.hkexCode).toBe("2649");
  });
});
