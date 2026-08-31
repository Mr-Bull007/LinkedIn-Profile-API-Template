import Fastify, { type FastifyError } from "fastify";
import { MockProfileSource } from "./services/mockProfileSource.js";
import { registerProfileRoutes } from "./routes/profile.js";
import { pathToFileURL } from "node:url";

export function buildApp() {
    const app = Fastify({
      logger: true,
    });

app.get("/health", async () => {
    return {status: "ok"};
});

app.get("/", async () => ({
    name: "TROSS LinkedIn Profile API",
    endpoints: {
      "GET /api/profile?url=<linkedin-profile-url>": "Returns a normalized profile as JSON.",
      "GET /api/profile/_available": "Lists vanity names available in the mock dataset (dev/demo only).",
      "GET /health": "Health check.",
    },
  }));

  const profileSource = new MockProfileSource();
  registerProfileRoutes(app, profileSource);

  app.setErrorHandler((error: FastifyError, _request, reply) => {
    // Fastify's built-in schema validation (e.g. missing/invalid query params)
    // surfaces here as a FST_ERR_VALIDATION error rather than throwing one of
    // our own error classes, so it needs its own branch.
    if (error.code === "FST_ERR_VALIDATION") {
      return reply.status(400).send({
        error: "invalid_request",
        message: error.message,
      });
    }

    app.log.error(error);
    reply.status(500).send({
      error: "internal_error",
      message: "Something went wrong processing your request.",
    });
  });

  return app;
}

async function start() {
  const app = buildApp();
  const port = Number(process.env.PORT) || 3000;
  const host = "0.0.0.0";

  try {
    await app.listen({ port, host });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Only auto-start when run directly (not when imported by tests).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    start();
  }
