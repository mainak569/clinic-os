-- Readable password for demo accounts listed on the public login page.
-- NULL (the default for every existing user) means the account isn't listed.
-- Additive only: no existing rows or columns are changed.
ALTER TABLE "users" ADD COLUMN "demo_password" TEXT;
