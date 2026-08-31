import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NormalizedProfile } from "../schema/profile.js";
import { ProfileNotFoundError, type ProfileSource } from "./profileSource.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, "..", "data", "fixtures");

type FixtureShape = Omit<NormalizedProfile, "profileUrl" | "meta">;

/**
 * MockProfileSource resolves profiles from local JSON fixtures instead of
 * making any request to LinkedIn. See profileSource.ts for why this exists.
 *
 * It implements the exact same `ProfileSource` interface a live,
 * ToS-compliant data source (e.g. LinkedIn's official Partner API) would
 * implement, so the rest of the application (routes, validation, response
 * shaping) is production-representative.
 */
export class MockProfileSource implements ProfileSource {
  private cache = new Map<string, FixtureShape>();

  async getProfile(vanityName: string): Promise<NormalizedProfile> {
    const fixture = await this.loadFixture(vanityName);
    if (!fixture) {
      throw new ProfileNotFoundError(vanityName);
    }

    return {
      ...fixture,
      profileUrl: `https://www.linkedin.com/in/${fixture.vanityName}/`,
      meta: {
        source: "mock",
        fetchedAt: new Date().toISOString(),
      },
    };
  }

  private async loadFixture(vanityName: string): Promise<FixtureShape | null> {
    if (this.cache.has(vanityName)) {
      return this.cache.get(vanityName)!;
    }

    const filePath = path.join(FIXTURES_DIR, `${vanityName}.json`);
    try {
      const raw = await readFile(filePath, "utf-8");
      const parsed = JSON.parse(raw) as FixtureShape;
      this.cache.set(vanityName, parsed);
      return parsed;
    } catch (err: unknown) {
      if (isNodeErrnoException(err) && err.code === "ENOENT") {
        return null;
      }
      throw err;
    }
  }

  /** Lists all vanity names available in the mock dataset. Useful for a demo/index route. */
  async listAvailableVanityNames(): Promise<string[]> {
    const files = await readdir(FIXTURES_DIR);
    return files.filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));
  }
}

function isNodeErrnoException(err: unknown): err is NodeJS.ErrnoException {
  return typeof err === "object" && err !== null && "code" in err;
}
