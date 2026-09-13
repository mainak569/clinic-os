# AI Prompt Log

A chronological record of the prompts I sent to an AI coding assistant (Claude Code, run in the repository with terminal and browser access) while hardening ClinicOS, and what I did with each answer.

I used the assistant the way I would use a fast pair programmer: for broad audits, mechanical multi-file edits and first drafts of documentation. Product direction, scope and anything claimed about the app stayed with me, and every change was checked against the test suite, the live database or the running app before I kept it.

Prompts are quoted as sent, shortened with "…" where long.

---

## 1. UI redesign (12 Sep, 17:01)

**Task:** See whether a full visual redesign would lift the product.

**Prompt:**
> Use your frontend-design skill and your own best judgment to redesign and elevate the entire Clinic Management website UI. Goal: Make it a premium, modern SaaS healthcare product. … Create two polished themes: Dark mode and Light mode with a seamless toggle. … Maintain existing functionality and improve only where needed.

**AI output:** A new design system across roughly 40 files: dark and light themes with a toggle, restyled cards, tables, forms and dashboards. The build passed and all 99 tests at the time passed.

**Decision: rejected.** The result was polished but generic, and it replaced the purple glassmorphism identity of my home page. I asked for a full rollback:

> roll back to my previos project as it was, i like that more

A plain `git checkout` would have wiped four files holding my uncommitted work (`app/dashboard/page.tsx`, `login-form.tsx`, `analytics-charts.tsx`, `bulk-availability-form.tsx`), so those were restored from pre-session copies and untracked files from saved originals. The restored working tree was checked against the 23 files I had modified before the session.

**My review:** Polish wasn't the goal; identity was. A generic premium look wasn't worth losing the design my home page already had, so I rejected the redesign outright rather than cherry-picking parts of it.

---

## 2. Consistent UI across routes (12 Sep, 17:56)

**Task:** Carry the home page's design into every other route rather than inventing a new one.

**Prompt:**
> currently what ever my home page, is i like it, but not the other routes page, make the ui ux consistent like home page, fix all the ui related bugs, fix the login page, and dash board and other routes

**AI output:** An audit listing the problems, then fixes:
- `/dashboard/appointments`, `/patients` and `/schedule` had no header, navigation or background, so a shared `app/dashboard/layout.tsx` was added;
- inputs, selects, textareas and dialogs used mismatched radii and surfaces, so they were brought into the glass style;
- the login page used a different gradient from the home page;
- the dashboard tiles showed invented figures (`totalAppointments * 0.05` for "Appointments Today"), so they were replaced with the existing `getDashboardStats()` data.

**Decision: accepted.** One follow-up: status badge colours built from a lookup in `lib/` were purged by Tailwind because `lib/` wasn't in the content paths. `lib/` was added to `tailwind.config.js`, and the build was checked to ship all six status colours.

**My review:** After rejecting the redesign, I narrowed the brief: extend the design that already works instead of replacing it. That turned an open-ended restyle into a bounded consistency fix, and the invented dashboard numbers came out of it too.

---

## 3. Test output noise (12 Sep, 18:37)

**Task:** `npm test` passed but its output was unreadable.

**Prompt:**
> fix the npm test issue

**AI output:** Two root causes:
- 20 debug `console.log` calls left in the availability service, which also would have shipped to production;
- a broken Prisma mock that made the appointment-history write fail silently and log an error on every run.

**Decision: accepted.** The mock was fixed rather than silenced, because silencing it would have hidden that the history path never ran. A test now proves the history write actually executes. One test deliberately triggers a legitimate warning; that warning is now asserted on rather than suppressed. Output went from 4,116 lines to 18.

**My review:** Green isn't the same as healthy. A suite that prints thousands of lines on every run hides the one line that matters, so I treated the noise as a defect even though every test passed. That is how the silent history-write failure surfaced.

---

## 4. Database / backend / frontend consistency audit (12 Sep, 19:15 – 21:44)

**Task:** Find every place where the schema, validation, services, actions, API routes and forms disagreed, and fix them with live verification.

**Prompt:**
> What are the inconsistencies in my database backend and my frontend backend at the moment, like adding an appointment, a patient, a provider, and whatever XYZ inconsistencies are there? … Fix all the inconsistencies and make them workable and make the database consistent. … You can do `npm run dev` and check all the factors on `localhost` and there is the Claude extension in my browser.

Followed by "continue fixing" when the session ran out of memory partway.

**AI output:** The findings in SUBMISSION.md's "Backend / Frontend / Database Consistency Pass" table, including:
- **Availability timezone encoding.** Slot times were stored in two encodings and read in the server's timezone, so Dr. Johnson's 8 AM–12 PM hours displayed as 1:30–5:30 PM. This was replaced by a fixed 1970-01-01 wall-clock encoding, a `CLINIC_TIMEZONE` setting and a dry-run-by-default migration script (`scripts/migrate-slot-times.ts`).
- **Duration-aware conflict check.** A 15-minute booking at 10:30 was accepted inside a 60-minute visit at 10:00. The overlap check now uses each existing visit's own duration.
- **Booking race.** Two simultaneous requests could both book the same slot. Check-and-insert now runs under a per-provider Postgres advisory lock.
- **Retries on rejected writes.** Failed saves were retried automatically up to three times, including saves the server had rejected for validation or business rules. Rejections are now never retried.
- Also: past bookings, archived patients and inactive providers accepted; `POST /api/appointments` bypassing the service layer; missing audit entries; patient restore on re-registration; the provider patient list filtered after pagination; no provider management; unbounded visit-note vitals.

**Verification before accepting:**
- The migration script was run as a dry run against the live Supabase database and its plan checked before `--apply`.
- The advisory lock was tested through the pgbouncer pooler with two concurrent bookings; exactly one succeeded.
- Booking rules, patient restore, provider create/deactivate and visit-note serialization were exercised against the live database with throwaway scripts, then cleaned up.
- The schedule page was checked in the browser to show correct hours.

**Corrections along the way:** the new slot encoding broke the reschedule and no-show integration tests, because their fixtures still used the old dates and booked slots in the past. The fixtures were fixed rather than the rule relaxed. The integration test clinic timezone is set to the machine's own timezone, so the suite passes both locally and on a UTC CI runner.

**Decision: accepted** (commit `e5fa2aa`).

**My review:** I asked for the fixes to be proven on the running app and the real database, not just in unit tests. Timezone shifts, pooler behaviour under concurrent writes and migrations of existing rows are exactly the failures mocks don't reproduce.

---

## 5. Documentation pass and model count (12 Sep, 22:02)

**Task:** Bring README, SUBMISSION and `docs/` in line with the code after the audit.

**Prompts:**
> now update submissions.md and reame.md as per need, and the .md files in /docs

Sent while that was running:
> In docs/architecture.md and docs/schema.md, the overview says 9 models but the schema actually has 11. Read prisma/schema.prisma, then update both files to say 11 and list every model, including ProviderProfile and AppointmentHistory. Keep schema.md's section numbering consistent with the list.

**AI output:** Updated docs, an 11-model list checked against `prisma/schema.prisma`, and SUBMISSION's model list reordered to match `schema.md`'s section numbering.

**Decision: accepted after review.** The pass left several stale or contradictory statements, which I corrected in entries 6–8.

**My review:** I didn't treat "docs updated" as done. I checked the updated docs against the code and against each other, and sent the model-count correction while the pass was still running rather than waiting for it to finish.

---

## 6. Test counts (13 Sep, 04:36)

**Task:** Fix the test counts in the plan.

**Prompt:**
> docs/plan.md says 48 tests and Session 8 lists 13/12/11/12. The suite is now 115 (60 unit + 55 integration). Run `npm test`, then correct Session 8's breakdown and the "Comprehensive tests" line in Success Metrics to match the real counts per test file.

**AI output:** The documentation pass had updated the headline total but left Session 8's per-file breakdown at the old numbers. The breakdown now comes from an actual `npm test` run: 9 files, 115 tests.

**Decision: accepted.**

**My review:** I asked for the counts to come from running the suite, not from editing numbers to add up. A headline total that doesn't match its own breakdown is the kind of detail a reviewer notices first.

---

## 7. Canonical time estimate (13 Sep, 04:38)

**Task:** Resolve two different totals for time spent.

**Prompt:**
> docs/plan.md totals ~56 hours; SUBMISSION.md says ~40-44. Pick 40-44 as canonical. Rescale plan.md's per-session durations so they sum to that total, keeping the relative weighting sensible, and update "Total Time".

**AI output:** The assistant had noticed the conflict in the documentation pass but left it for me to decide. After my call, it scaled each session by the same factor and rounded so the sessions summed to 44. It flagged that two "Actual" figures in Estimates vs. Actuals (Analytics 5h, Audit Logging 6h) were now longer than their sessions.

**Decision: accepted, with the follow-up.** Those two figures were then rescaled the same way (4h and 5h). I also had the "12 more hours" and "least happy with" sections in `plan.md` replaced with pointers to SUBMISSION.md, so the two answers can't drift apart again.

**My review:** Which number is true is my call, not the tool's, and the assistant rightly left it to me. I also specified how to rescale (keep the relative weighting) and removed the duplicated sections, so the inconsistency couldn't come back.

---

## 8. Positioning and stale architecture docs (13 Sep, 04:40 – 04:43)

**Task:** Remove claims that contradicted the project's prototype status, and stale technical facts.

**Prompts:**
> The end of docs/plan.md says the system is "ready for real-world use" and "suitable for small to medium clinics". That contradicts the prototype / not-for-real-patient-data positioning in README.md and SUBMISSION.md. Rewrite the Overall Assessment section to match that positioning.

> docs/architecture.md is out of date. Fix: Next.js version (check package.json, not 15.0.3); the cron line (it runs daily on Vercel Hobby, not every 15 minutes); "9 models" in the Database Schema section; and the directory tree, which is missing the patients, providers and schedule dashboard routes and several lib files. Verify each against the actual repo before editing.

> README.md links to docs/schema.md#5-availabilityslot for the wall-clock time encoding, but that section still says "startTime and endTime store time only, the date portion is ignored", which is the old behaviour. Read lib/clinic-time.ts and scripts/migrate-slot-times.ts, then rewrite section 5 …

**AI output:**
- The Overall Assessment was rewritten as "not production-ready".
- In `architecture.md`, three of my four items were already correct; the directory tree was rebuilt and every path in it checked against the repo.
- In `schema.md`, the column table still described `startTime`/`endTime` as "time only". Section 5 was rewritten to document the encoding, how `CLINIC_TIMEZONE` is applied, and the migration script. It includes a warning, taken from the migration code, that running the script with the wrong timezone shifts UI-created slots.

**Decision: accepted.**

**My review:** Each prompt named the exact problem and the source of truth to check it against (`package.json`, `vercel.json`, `lib/clinic-time.ts`, the repo tree). Because I asked for verification before editing, three of the four architecture items turned out to be already fixed and weren't rewritten needlessly. Aligning the assessment with the prototype positioning mattered more than any technical fix: a health app shouldn't overstate its readiness.

---

## 9. Provider access to analytics (13 Sep, 04:47)

**Task:** Check a documented permission against the code instead of trusting the table.

**Prompt:**
> docs/architecture.md's authorization table says PROVIDER has no access to Analytics. Check what a PROVIDER role actually sees on /dashboard in the code. If they see analytics, correct the table; if not, leave it and tell me.

**AI output:** Providers do see analytics. An earlier AI edit had changed the table to "Own data", which was also wrong. The status breakdown and the no-show trend ran clinic-wide queries, so a provider's dashboard showed every other provider's appointments. Several standalone analytics actions also returned clinic-wide data to any signed-in user.

**Decision: I had it fixed, not just documented:**
> Fix, u always have full approval

Every analytics query now takes the provider's ID. The cross-provider chart is front-desk only, and a provider account with no linked provider is refused rather than falling back to clinic data. 12 unit tests assert the provider filter reaches the database query. I checked both roles in the browser: Dr. Smith's dashboard showed only their own figures and no provider chart, and the front desk saw the whole clinic.

**My review:** I didn't let the table be edited to match an assumption. I made the code the judge, with an explicit "if not, leave it and tell me" branch, so the answer couldn't be bent toward what I expected. A one-line doc question turned into a privacy fix, and I made sure it ended with tests rather than just a corrected table.

---

## 10. Compliance claims (13 Sep, 05:07)

**Task:** Verify a claim the assistant made about the docs.

**Context:** The assistant reported that no docs still said the app was HIPAA-compliant or certified for real patient data. Its search had been narrow, so I didn't take that on trust.

**Prompt:**
> No docs still say the app is HIPAA-compliant or certified for real patient data. real, if not then remove it

**AI output:** A broader search found the docs were accurate in substance, with two phrasings that could be misread. The app itself was not: the landing page, metadata and marketing sections called the product HIPAA-compliant, and the hero carried a "SOC 2 Certified" badge.

**Decision: accepted.** All of it was changed to "HIPAA-oriented" wording describing what is actually built, and the SOC 2 badge became "Full Audit Trail". The two doc phrasings were reworded. Other unverifiable marketing figures ("Trusted by 500+", "99.9% Uptime") were flagged, and removed in the final review.

**My review:** An AI's summary of its own work is a claim, not evidence. I asked for it to be proven, and for the text to be removed if it wasn't true. Compliance wording on a healthcare product is a legal statement, not marketing copy.
