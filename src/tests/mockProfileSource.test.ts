import { describe, expect, it } from "vitest";
import { MockProfileSource } from "../services/mockProfileSource.js";
import { ProfileNotFoundError } from "../services/profileSource.js";

describe("MockProfileSource", () => {
  it("returns a normalized profile for a known vanity name", async () => {
    const source = new MockProfileSource();
    const profile = await source.getProfile("rushabh-sagara-8b0b16160");

    expect(profile.name).toBe("Rushabh Sagara");
    expect(profile.vanityName).toBe("rushabh-sagara-8b0b16160");
    expect(profile.profileUrl).toBe("https://www.linkedin.com/in/rushabh-sagara-8b0b16160/");
    expect(profile.meta.source).toBe("mock");
    expect(Array.isArray(profile.experience)).toBe(true);
    expect(Array.isArray(profile.education)).toBe(true);
    expect(Array.isArray(profile.skills)).toBe(true);
  });

  it("throws ProfileNotFoundError for an unknown vanity name", async () => {
    const source = new MockProfileSource();
    await expect(source.getProfile("does-not-exist-12345")).rejects.toThrow(
      ProfileNotFoundError
    );
  });

  it("lists available vanity names", async () => {
    const source = new MockProfileSource();
    const names = await source.listAvailableVanityNames();
    expect(names).toContain("rushabh-sagara-8b0b16160");
    expect(names).toContain("jane-doe-example");
  });
});
