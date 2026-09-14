# AI-Assisted Development

An AI coding assistant was used throughout development as a pair programmer for architecture reviews, debugging, multi-file edits, documentation drafts, and implementation assistance. Product direction, scope, and anything claimed about the app stayed a human decision, and every change was checked against the test suite, a real database, or the running app before being kept — not accepted on the assistant's own say-so.

## Where AI output was rejected or corrected

The value of using an AI assistant on this project came as much from catching its mistakes as from its output — a few representative examples:

- **A full visual redesign was rejected outright.** Asked to elevate the landing page's design, the assistant produced a polished but generic result that replaced the site's existing visual identity across roughly 40 files. It passed every test, but polish wasn't the goal — identity was. The change was rolled back in full rather than partially kept, and the brief was narrowed on the next attempt to _extend_ the existing design into the rest of the app instead of replacing it.
- **A documented permission table was wrong, and an earlier AI edit had made it worse.** `docs/architecture.md`'s authorization table claimed providers saw only their own analytics data. Checking the actual code found providers could see the whole clinic's figures — a real cross-provider data leak, not just a stale doc. A prior AI-authored edit had already changed that same table to a different, still-inaccurate answer, which the code was used to disprove rather than trusting the doc at all. The underlying leak was fixed (every analytics query scoped to the signed-in provider) and covered with new tests, not just the table corrected.
- **A source-of-truth conflict was resolved by a human decision, not an edit.** Two documents gave different total time-spent figures. Rather than letting either number get edited to match the other, one was picked as canonical and the discrepancy's root cause (duplicated, drifting sections) was removed so it couldn't recur.
- **A later review process identified and disclosed a false positive from an earlier AI-assisted security review.** During a later documentation-accuracy pass, a finding from an earlier security review ("the background animation has no reduced-motion handling") turned out to be wrong — a narrower search had missed the relevant code. Rather than quietly deleting the incorrect finding, it was left in place and marked as retracted, with the reason and the code reference that disproved it.

## AI Assistant Design Review

### Goal

Design a secure AI assistant for ClinicOS without allowing the model to directly access application data.

### Prompt

> Design an AI assistant architecture for ClinicOS that helps users with clinic operations while respecting authentication and authorization boundaries.

### What I got

The AI suggested:

- authenticated chatbot access
- retrieval-based context
- secure backend tools
- permission-aware responses

### What I corrected

Approaches that gave the model broad data access were rejected.

The final implementation follows:

- authenticated users only, through the existing Auth.js session and role checks
- a per-user rate limit, and guardrails for off-topic, medical-advice and prompt-injection requests
- a short, role-scoped summary of today's schedule as context, with no patient names, contact details or notes
- no tools, and no direct model access to Prisma or Supabase

The assistant answers workflow and schedule questions without being able to read beyond that summary or change records.

## How AI output was validated

Every accepted change was checked against something other than the assistant's own description of what it did:

- **Live verification, not just passing types.** Multi-file audits (database/backend/frontend consistency, security review) were checked by running the app locally, exercising it through the browser or direct HTTP requests against a real database, and confirming behavior — not just that `tsc` and the linter were clean.
- **Concurrency and timezone bugs need a real environment.** The two most serious bugs found (a booking race condition and a timezone-dependent availability bug) only reproduced against a real Postgres database and real concurrent requests; they were verified fixed the same way — two simultaneous booking requests, exactly one succeeds — not asserted by a mock.
- **An isolated test database for anything destructive.** Later audit and deployment-check work ran against a disposable local database, never the production database, except for a narrow, explicitly-scoped final check (read-only schema comparison, then a migration-apply step confirmed to be a no-op before it ran).
- **Documentation changes were fact-checked against the code**, not accepted as accurate because the assistant said so — the analytics permission table above is one example; doc-vs-code and doc-vs-doc contradictions elsewhere (model counts, test counts, stale architecture claims) were resolved the same way, by running the actual command or reading the actual source rather than editing numbers to agree.

## Later passes: security, data integrity, and deployment readiness

A structured pre-submission review followed the same pattern at larger scale: ten specific product guarantees (auth isolation, booking correctness, the appointment status machine, data integrity, and others) were tested with real HTTP requests against a running instance, followed by a security, code-quality and data-integrity pass, then a deployment-readiness check against the actual database. Real, fixed issues included a data-integrity gap where an appointment's status could change without its audit-trail entry (the write and the log entry now commit or fail together), and several smaller correctness fixes. Findings that needed a product or infrastructure decision — not a code fix — were written up rather than resolved unilaterally, including a couple of feature gaps and a rate-limiting improvement that would require a new, platform-specific dependency. The full technical record of that pass, findings, and fixes is captured through the project's documentation and test history.
