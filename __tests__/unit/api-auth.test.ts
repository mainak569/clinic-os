/**
 * Unit Tests: API route authentication
 *
 * Middleware doesn't cover /api, and the routes used requireAuth, whose
 * redirect() throws inside the route's try/catch. A request with no session
 * got a 500 from GET routes and a 409 "NEXT_REDIRECT" from POST/PATCH.
 * Every route must answer 401 without touching the database.
 */

import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";

const mockAuth = jest.fn() as jest.MockedFunction<any>;
jest.mock("@/auth", () => ({
  auth: mockAuth,
}));

const dbCall = jest.fn() as jest.MockedFunction<any>;
jest.mock("@/lib/prisma", () => ({
  prisma: new Proxy(
    {},
    { get: () => new Proxy({}, { get: () => dbCall }) }
  ),
}));
jest.mock("@/prisma.config", () => ({
  prisma: {},
}));
jest.mock("next/headers", () => ({
  headers: async () => new Map(),
}));

import { getApiSession } from "@/lib/auth-helpers";
import * as patientsRoute from "@/app/api/patients/route";
import * as appointmentsRoute from "@/app/api/appointments/route";
import * as providerRoute from "@/app/api/providers/[providerId]/route";
import * as cronRoute from "@/app/api/cron/generate-alerts/route";

const params = { params: Promise.resolve({ providerId: "provider-a" }) };
const jsonRequest = (url: string, method: string, body: unknown) =>
  new Request(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

describe("getApiSession", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when there is no session", async () => {
    mockAuth.mockResolvedValue(null);
    expect(await getApiSession()).toBeNull();
  });

  it("returns null for a session without a user", async () => {
    mockAuth.mockResolvedValue({ expires: "2099-01-01" });
    expect(await getApiSession()).toBeNull();
  });

  it("returns the session when signed in", async () => {
    const session = { user: { id: "u1", role: "FRONT_DESK", providerId: null } };
    mockAuth.mockResolvedValue(session);
    expect(await getApiSession()).toBe(session);
  });
});

describe("API routes without a session", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(null);
  });

  const cases: Array<[string, () => Promise<Response>]> = [
    ["GET /api/patients", () => patientsRoute.GET(new Request("http://localhost/api/patients"))],
    ["GET /api/appointments", () => appointmentsRoute.GET()],
    [
      "POST /api/appointments",
      () => appointmentsRoute.POST(jsonRequest("http://localhost/api/appointments", "POST", {})),
    ],
    [
      "GET /api/providers/[providerId]",
      () => providerRoute.GET(new Request("http://localhost/api/providers/provider-a"), params),
    ],
    [
      "PATCH /api/providers/[providerId]",
      () =>
        providerRoute.PATCH(
          jsonRequest("http://localhost/api/providers/provider-a", "PATCH", { firstName: "X" }),
          params
        ),
    ],
  ];

  it.each(cases)("%s answers 401 without querying the database", async (_name, call) => {
    const response = await call();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
    expect(dbCall).not.toHaveBeenCalled();
  });
});

describe("Cron endpoint authentication", () => {
  const env = process.env as Record<string, string | undefined>;
  const saved = { secret: env.CRON_SECRET, nodeEnv: env.NODE_ENV };

  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterEach(() => {
    if (saved.secret === undefined) delete env.CRON_SECRET;
    else env.CRON_SECRET = saved.secret;
    env.NODE_ENV = saved.nodeEnv;
  });

  const call = (authorization?: string) =>
    cronRoute.GET(
      new Request(
        "http://localhost/api/cron/generate-alerts",
        authorization ? { headers: { authorization } } : undefined
      )
    );

  it("refuses every request in production when CRON_SECRET is unset", async () => {
    delete env.CRON_SECRET;
    env.NODE_ENV = "production";
    // The route logs the misconfiguration; keep the test output clean.
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    expect((await call()).status).toBe(401);
    expect(dbCall).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("refuses a request with the wrong secret", async () => {
    env.CRON_SECRET = "s3cret";

    expect((await call("Bearer wrong")).status).toBe(401);
    expect(dbCall).not.toHaveBeenCalled();
  });

  it("runs for a request with the right secret", async () => {
    env.CRON_SECRET = "s3cret";
    dbCall.mockResolvedValue([]);

    const response = await call("Bearer s3cret");

    expect(response.status).toBe(200);
    expect(dbCall).toHaveBeenCalled();
  });
});
