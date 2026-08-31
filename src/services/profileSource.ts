import type { NormalizedProfile } from "../schema/profile.js";

/**
 * ProfileSource is the boundary between "how the profile data is served" (the API
 * layer) and "how the profile data is obtained" (the retrieval strategy).
 *
 * Why this exists:
 * During the reverse-engineering investigation (see docs/reverse-engineering.md)
 * I found that LinkedIn's initial profile Document response resolves a
 * vanity URL into an internal opaque profile identifier (`ACoAA...`) and
 * associated data, server-side, before any client-side JavaScript runs.
 * A live implementation of this interface could extract that data directly.
 *
 * However, doing so in a publicly hosted, unauthenticated-to-LinkedIn way
 * means directly querying LinkedIn's private/authenticated endpoints outside
 * of a browser session — which conflicts with LinkedIn's User Agreement and
 * carries real account/legal exposure once exposed as a public service
 * (you can see more in README "Approach & Known Limitations").
 *
 * Hence, here we have shipped a `MockProfileSource` that implements the
 * exact same interface and returns data in the exact same normalized shape.
 * Swapping in a live, compliant data source (LinkedIn's official Partner
 * API, or a user-authorized OAuth flow) requires no changes anywhere else
 * in the codebase — only a new class implementing `ProfileSource`.
 */
export interface ProfileSource {
  /**
   * Resolves a LinkedIn vanity name (public identifier, e.g.
   * "name-surname-91611119") to a normalized profile.
   *
   * @throws ProfileNotFoundError if no profile exists for the vanity name.
   */
  getProfile(vanityName: string): Promise<NormalizedProfile>;
}

export class ProfileNotFoundError extends Error {
  constructor(vanityName: string) {
    super(`No profile found for "${vanityName}".`);
    this.name = "ProfileNotFoundError";
  }
}
