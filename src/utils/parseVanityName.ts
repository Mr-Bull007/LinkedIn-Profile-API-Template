/**
 * Extracts the "vanity name" (public identifier) from a LinkedIn profile URL.
 *
 * Accepts forms like:
 *   https://www.linkedin.com/in/name-surname-916111119/
 *   https://linkedin.com/in/name-surname-916111119
 *   linkedin.com/in/name-surname-916111119/
 *   www.linkedin.com/in/name-surname-916111119?query=params
 */
export class InvalidLinkedInUrlError extends Error {
    constructor(input: string) {
      super(`"${input}" is not a valid LinkedIn profile URL (expected .../in/<vanity-name>).`);
      this.name = "InvalidLinkedInUrlError";
    }
  }
  
export function parseVanityName(rawInput: string): string {
if (!rawInput || typeof rawInput !== "string") {
    throw new InvalidLinkedInUrlError(String(rawInput));
}

const trimmed = rawInput.trim();

// Allow input with or without protocol by prepending one for URL parsing.
const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

let url: URL;
try {
    url = new URL(withProtocol);
} catch {
    throw new InvalidLinkedInUrlError(rawInput);
}

const host = url.hostname.toLowerCase();
const isLinkedInHost = host === "linkedin.com" || host.endsWith(".linkedin.com");
if (!isLinkedInHost) {
    throw new InvalidLinkedInUrlError(rawInput);
}

const match = url.pathname.match(/\/in\/([^/]+)\/?/i);
if (!match || !match[1]) {
    throw new InvalidLinkedInUrlError(rawInput);
}

return decodeURIComponent(match[1]);
}
