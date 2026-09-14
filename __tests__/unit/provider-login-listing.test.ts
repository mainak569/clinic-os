/**
 * Unit Tests: Provider limit and login-page demo accounts
 *
 * The clinic can have at most MAX_ACTIVE_PROVIDERS active providers. Accounts
 * front desk marks "Show on login page" keep a readable password, which has to
 * follow every password change and must never reach the providers list.
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";

const mockTxProviderCount = jest.fn() as jest.MockedFunction<any>;
const mockTxProviderCreate = jest.fn() as jest.MockedFunction<any>;
const mockTxProviderUpdate = jest.fn() as jest.MockedFunction<any>;
const mockTxUserCreate = jest.fn() as jest.MockedFunction<any>;
const mockTxUserUpdate = jest.fn() as jest.MockedFunction<any>;
const mockProviderFindMany = jest.fn() as jest.MockedFunction<any>;
const mockProviderFindUnique = jest.fn() as jest.MockedFunction<any>;
const mockUserFindUnique = jest.fn() as jest.MockedFunction<any>;
const mockUserFindMany = jest.fn() as jest.MockedFunction<any>;
const mockAppointmentCount = jest.fn() as jest.MockedFunction<any>;

const mockTx = {
  provider: {
    count: mockTxProviderCount,
    create: mockTxProviderCreate,
    update: mockTxProviderUpdate,
  },
  user: { create: mockTxUserCreate, update: mockTxUserUpdate },
};

jest.mock("@/lib/prisma", () => ({
  prisma: {
    provider: {
      findMany: mockProviderFindMany,
      findUnique: mockProviderFindUnique,
    },
    user: { findUnique: mockUserFindUnique, findMany: mockUserFindMany },
    appointment: { count: mockAppointmentCount },
    $transaction: (fn: (tx: unknown) => unknown) => fn(mockTx),
  },
}));

const mockRequireAuth = jest.fn() as jest.MockedFunction<any>;
const mockCanAccessProviderData = jest.fn() as jest.MockedFunction<any>;
jest.mock("@/lib/auth-helpers", () => ({
  requireAuth: mockRequireAuth,
  requireRole: jest.fn(),
  canAccessProviderData: mockCanAccessProviderData,
}));
jest.mock("@/lib/services/audit.service", () => ({
  auditService: { log: jest.fn() },
}));
jest.mock("@/lib/revalidate", () => ({ revalidateDashboard: jest.fn() }));
jest.mock("next/headers", () => ({ headers: async () => new Headers() }));

import { providerService } from "@/lib/services/provider.service";
import { getLoginDemoAccounts } from "@/lib/services/demo-accounts.service";
import { updateProvider } from "@/app/actions/provider.actions";
import { MAX_ACTIVE_PROVIDERS } from "@/lib/validations/provider";

const profile = {
  specialization: "",
  licenseNumber: "",
  phone: "",
  officeLocation: "",
  bio: "",
  appointmentLength: 30,
  bufferTime: 15,
};

const newProvider = (extra: object = {}): any => ({
  title: "Dr.",
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@clinicos.com",
  password: "Secret123!",
  profile,
  ...extra,
});

const editInput = (extra: object = {}): any => ({
  id: "p1",
  title: "Dr.",
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@clinicos.com",
  password: "",
  profile,
  ...extra,
});

const existingWithDemoPassword = (demoPassword: string | null) => ({
  id: "p1",
  userId: "u1",
  user: { id: "u1", email: "ada@clinicos.com", demoPassword },
});

const lastUserUpdateData = () =>
  (
    mockTxUserUpdate.mock.calls[
      mockTxUserUpdate.mock.calls.length - 1
    ][0] as any
  ).data;

describe("Provider limit and login-page listing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserFindUnique.mockResolvedValue(null);
    mockTxProviderCount.mockResolvedValue(2);
    mockTxUserCreate.mockResolvedValue({ id: "u1" });
    mockTxProviderCreate.mockResolvedValue({ id: "p1" });
    mockTxProviderUpdate.mockResolvedValue({ id: "p1", isActive: true });
    mockTxUserUpdate.mockResolvedValue({});
    mockAppointmentCount.mockResolvedValue(0);
  });

  describe("active provider limit", () => {
    it("refuses to add a provider once the clinic is at the limit", async () => {
      mockTxProviderCount.mockResolvedValue(MAX_ACTIVE_PROVIDERS);

      await expect(
        providerService.createProvider(newProvider())
      ).rejects.toThrow(`at most ${MAX_ACTIVE_PROVIDERS} active providers`);
      expect(mockTxUserCreate).not.toHaveBeenCalled();
    });

    it("adds a provider below the limit, counting only active providers", async () => {
      await providerService.createProvider(newProvider());

      expect(mockTxProviderCount).toHaveBeenCalledWith({
        where: { isActive: true },
      });
      expect(mockTxProviderCreate).toHaveBeenCalled();
    });

    it("refuses to reactivate a provider at the limit", async () => {
      mockProviderFindUnique.mockResolvedValue({
        userId: "u1",
        isActive: false,
      });
      mockTxProviderCount.mockResolvedValue(MAX_ACTIVE_PROVIDERS);

      await expect(
        providerService.setProviderActive("p1", true)
      ).rejects.toThrow("active providers");
      expect(mockTxUserUpdate).not.toHaveBeenCalled();
    });

    it("doesn't count a provider who is already active", async () => {
      mockProviderFindUnique.mockResolvedValue({
        userId: "u1",
        isActive: true,
      });
      mockTxProviderCount.mockResolvedValue(MAX_ACTIVE_PROVIDERS);

      await providerService.setProviderActive("p1", true);

      expect(mockTxProviderCount).not.toHaveBeenCalled();
    });
  });

  describe("demo password", () => {
    it("is stored only when the account is marked for the login page", async () => {
      await providerService.createProvider(newProvider({ showOnLogin: true }));
      await providerService.createProvider(newProvider());

      expect((mockTxUserCreate.mock.calls[0][0] as any).data.demoPassword).toBe(
        "Secret123!"
      );
      expect(
        (mockTxUserCreate.mock.calls[1][0] as any).data.demoPassword
      ).toBeNull();
    });

    it("follows a password change on a listed account", async () => {
      mockProviderFindUnique.mockResolvedValue(
        existingWithDemoPassword("OldPass123!")
      );

      await providerService.updateProvider(
        editInput({ password: "NewPass123!" })
      );

      expect(lastUserUpdateData().demoPassword).toBe("NewPass123!");
    });

    it("stays the same when the password field is left blank", async () => {
      mockProviderFindUnique.mockResolvedValue(
        existingWithDemoPassword("OldPass123!")
      );

      await providerService.updateProvider(editInput());

      expect(lastUserUpdateData().demoPassword).toBe("OldPass123!");
    });

    it("isn't added just because an unlisted account's password changed", async () => {
      mockProviderFindUnique.mockResolvedValue(existingWithDemoPassword(null));

      await providerService.updateProvider(
        editInput({ password: "NewPass123!" })
      );

      expect(lastUserUpdateData().demoPassword).toBeNull();
    });

    it("is removed when the account is unticked", async () => {
      mockProviderFindUnique.mockResolvedValue(
        existingWithDemoPassword("OldPass123!")
      );

      await providerService.updateProvider(editInput({ showOnLogin: false }));

      expect(lastUserUpdateData().demoPassword).toBeNull();
    });

    it("needs a new password to list an account whose password can't be read back", async () => {
      mockProviderFindUnique.mockResolvedValue(existingWithDemoPassword(null));

      await expect(
        providerService.updateProvider(editInput({ showOnLogin: true }))
      ).rejects.toThrow("Enter a new password");
      expect(mockTxUserUpdate).not.toHaveBeenCalled();
    });

    it("never appears in the providers list", async () => {
      mockProviderFindMany.mockResolvedValue([
        { id: "p1", user: { email: "a@x.com", demoPassword: "Secret123!" } },
        { id: "p2", user: { email: "b@x.com", demoPassword: null } },
      ]);

      const providers = await providerService.listProviders();

      expect(JSON.stringify(providers)).not.toContain("Secret123!");
      expect(providers.map((p: any) => p.user.showOnLogin)).toEqual([
        true,
        false,
      ]);
    });
  });

  describe("getLoginDemoAccounts", () => {
    it("lists active demo accounts only, providers before front desk", async () => {
      mockUserFindMany.mockResolvedValue([
        {
          email: "frontdesk@clinicos.com",
          role: "FRONT_DESK",
          demoPassword: "FrontDesk123!",
          provider: null,
        },
        {
          email: "dr.smith@clinicos.com",
          role: "PROVIDER",
          demoPassword: "DrSmith123!",
          provider: { title: "Dr.", firstName: "Sarah", lastName: "Smith" },
        },
      ]);

      const accounts = await getLoginDemoAccounts();

      const where = (mockUserFindMany.mock.calls[0][0] as any).where;
      expect(where.demoPassword).toEqual({ not: null });
      expect(where.isActive).toBe(true);
      expect(where.OR).toContainEqual({
        provider: { is: { isActive: true } },
      });
      expect(accounts).toEqual([
        {
          label: "Dr. Sarah Smith",
          email: "dr.smith@clinicos.com",
          password: "DrSmith123!",
        },
        {
          label: "Front Desk",
          email: "frontdesk@clinicos.com",
          password: "FrontDesk123!",
        },
      ]);
    });
  });

  describe("updateProvider action", () => {
    const run = async (role: "PROVIDER" | "FRONT_DESK") => {
      mockRequireAuth.mockResolvedValue({
        user: { id: "u1", role, providerId: role === "PROVIDER" ? "p1" : null },
      });
      mockCanAccessProviderData.mockResolvedValue(true);
      const spy = jest.spyOn(providerService, "updateProvider") as any;
      spy.mockResolvedValue({ id: "p1" });

      const result = await updateProvider(editInput({ showOnLogin: true }));
      const passed = spy.mock.calls[0][0];
      spy.mockRestore();
      return { result, passed };
    };

    it("doesn't let a provider change whether they're listed", async () => {
      const { result, passed } = await run("PROVIDER");

      expect(result.success).toBe(true);
      expect(passed.showOnLogin).toBeUndefined();
    });

    it("lets front desk change it", async () => {
      const { result, passed } = await run("FRONT_DESK");

      expect(result.success).toBe(true);
      expect(passed.showOnLogin).toBe(true);
    });
  });
});
