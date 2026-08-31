import { describe, expect, it } from "vitest";
import { InvalidLinkedInUrlError, parseVanityName } from "../utils/parseVanityName.js";

describe("parseVanityName", () => {
  it("extracts vanity name from a full https URL with trailing slash", () => {
    expect(parseVanityName("https://www.linkedin.com/in/name-surname-9111119/")).toBe(
      "name-surname-9111119"
    );
  });

  it("extracts vanity name without trailing slash", () => {
    expect(parseVanityName("https://www.linkedin.com/in/name-surname-9111119")).toBe(
      "name-surname-9111119"
    );
  });

  it("extracts vanity name without protocol", () => {
    expect(parseVanityName("linkedin.com/in/name-surname-9111119")).toBe(
      "name-surname-9111119"
    );
  });

  it("extracts vanity name without www subdomain", () => {
    expect(parseVanityName("https://linkedin.com/in/name-surname-9111119")).toBe(
      "name-surname-9111119"
    );
  });

  it("ignores query params", () => {
    expect(
      parseVanityName("https://www.linkedin.com/in/name-surname-9111119/?originalSubdomain=in")
    ).toBe("name-surname-9111119");
  });

  it("throws InvalidLinkedInUrlError for non-LinkedIn hosts", () => {
    expect(() => parseVanityName("https://example.com/in/someone")).toThrow(
      InvalidLinkedInUrlError
    );
  });

  it("throws InvalidLinkedInUrlError for LinkedIn URLs without /in/ path", () => {
    expect(() => parseVanityName("https://www.linkedin.com/feed/")).toThrow(
      InvalidLinkedInUrlError
    );
  });

  it("throws InvalidLinkedInUrlError for garbage input", () => {
    expect(() => parseVanityName("not a url at all")).toThrow(InvalidLinkedInUrlError);
  });

  it("throws InvalidLinkedInUrlError for empty input", () => {
    expect(() => parseVanityName("")).toThrow(InvalidLinkedInUrlError);
  });
});
