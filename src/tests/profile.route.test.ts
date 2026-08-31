import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../server.js";

describe("GET /api/profile", () => {
  let app: FastifyInstance;

  beforeAll(() => {
    app = buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns 200 and a normalized profile for a valid, known profile URL", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/profile?url=https://www.linkedin.com/in/rushabh-sagara-8b0b16160/",
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.name).toBe("Rushabh Sagara");
    expect(body.vanityName).toBe("rushabh-sagara-8b0b16160");
    expect(body.meta.source).toBe("mock");
  });

  it("returns 400 for a malformed URL", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/profile?url=not-a-url",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe("invalid_url");
  });

  it("returns 400 when url query param is missing", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/profile",
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 404 for a valid LinkedIn URL with no matching mock profile", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/profile?url=https://www.linkedin.com/in/someone-not-in-fixtures-999/",
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error).toBe("profile_not_found");
  });

  it("health check returns ok", async () => {
    const response = await app.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });
});
