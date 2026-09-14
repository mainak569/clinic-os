/**
 * Safety gate for `npm run db:reset`.
 *
 * `db:reset` runs `prisma migrate reset --force`, which drops and recreates
 * the entire database with no confirmation of its own. There is nothing
 * elsewhere in the repo stopping that from running against the real Supabase
 * database if `DATABASE_URL` happens to point there — for example a
 * `.env.local` left over from testing something against production, or a
 * misconfigured CI job.
 *
 * This script runs first (see the `db:reset` script in package.json) and
 * refuses unless `DATABASE_URL` looks like a local database, or the caller
 * explicitly opts in. It does not gate `db:seed` on its own: seeding a fresh
 * Supabase database once is part of the documented setup flow (README), and
 * seeding is naturally re-run-safe — a second run fails on the unique email
 * constraint rather than silently duplicating or wiping anything.
 */

const url = process.env.DATABASE_URL || "";
const looksLocal = /(^|@)(localhost|127\.0\.0\.1|\[?::1\]?)(:|\/|$)/.test(url);
const override = process.env.ALLOW_DESTRUCTIVE_DB_OP === "true";

if (!url) {
  console.error("DATABASE_URL is not set. Refusing to run db:reset.");
  process.exit(1);
}

if (!looksLocal && !override) {
  const host = url.match(/@([^/?]+)/)?.[1] ?? "(unable to parse host)";
  console.error(
    `\n🛑 db:reset would run "prisma migrate reset --force" against:\n\n` +
      `   ${host}\n\n` +
      `That drops and recreates the ENTIRE database. This doesn't look like a local\n` +
      `database (localhost/127.0.0.1), so this is refusing to run automatically.\n\n` +
      `If this is really what you want (e.g. resetting a disposable dev/staging\n` +
      `database on Supabase), re-run with:\n\n` +
      `   ALLOW_DESTRUCTIVE_DB_OP=true npm run db:reset\n`
  );
  process.exit(1);
}

console.log(
  looksLocal
    ? "✓ DATABASE_URL looks local — proceeding."
    : "✓ ALLOW_DESTRUCTIVE_DB_OP=true — proceeding."
);
