import type { FastifyInstance } from "fastify";
import { InvalidLinkedInUrlError, parseVanityName } from "../utils/parseVanityName.js";
import { ProfileNotFoundError, type ProfileSource } from "../services/profileSource.js";
import { MockProfileSource } from "../services/mockProfileSource.js";

const querySchema = {
  type: "object",
  properties: {
    url: { type: "string", minLength: 1 },
  },
  required: ["url"],
} as const;

export async function registerProfileRoutes(app: FastifyInstance, profileSource: ProfileSource) {
  app.get(
    "/api/profile",
    {
      schema: {
        querystring: querySchema,
      },
    },
    async (request, reply) => {
      const { url } = request.query as { url: string };

      let vanityName: string;
      try {
        vanityName = parseVanityName(url);
      } catch (err) {
        if (err instanceof InvalidLinkedInUrlError) {
          return reply.status(400).send({
            error: "invalid_url",
            message: err.message,
          });
        }
        throw err;
      }

      try {
        const profile = await profileSource.getProfile(vanityName);
        return reply.status(200).send(profile);
      } catch (err) {
        if (err instanceof ProfileNotFoundError) {
          return reply.status(404).send({
            error: "profile_not_found",
            message: err.message,
          });
        }
        throw err;
      }
    }
  );

  // Demo/dev convenience route: lists vanity names available in the mock dataset.
  if (profileSource instanceof MockProfileSource) {
    app.get("/api/profile/_available", async (_request, reply) => {
      const names = await profileSource.listAvailableVanityNames();
      return reply.status(200).send({ availableVanityNames: names });
    });
  }
}
