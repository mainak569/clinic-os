import { prisma } from "@/lib/prisma";

/**
 * Demo accounts listed on the public login page.
 *
 * Front desk marks an account "Show on login page", which keeps a readable
 * copy of its password in User.demoPassword; that copy follows every password
 * change. Deactivated accounts are left out.
 */

export interface DemoAccount {
  label: string;
  email: string;
  password: string;
}

export async function getLoginDemoAccounts(): Promise<DemoAccount[]> {
  const users = await prisma.user.findMany({
    where: {
      demoPassword: { not: null },
      isActive: true,
      OR: [{ role: "FRONT_DESK" }, { provider: { is: { isActive: true } } }],
    },
    select: {
      email: true,
      role: true,
      demoPassword: true,
      provider: { select: { title: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Providers first, then front desk, each in the order they were added.
  return users
    .sort(
      (a, b) =>
        Number(a.role === "FRONT_DESK") - Number(b.role === "FRONT_DESK")
    )
    .map((user) => ({
      label: user.provider
        ? [user.provider.title, user.provider.firstName, user.provider.lastName]
            .filter(Boolean)
            .join(" ")
        : "Front Desk",
      email: user.email,
      password: user.demoPassword as string,
    }));
}
