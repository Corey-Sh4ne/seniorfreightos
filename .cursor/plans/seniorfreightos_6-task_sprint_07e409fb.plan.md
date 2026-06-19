---
name: SeniorFreightOS 6-Task Sprint
overview: "Fix 6 sequential issues in SeniorFreightOS: root redirect, test data cleanup, Advance Status normalization bug, Pricing Quote tab role detection, client portal scoping, and migration 004 tracking."
todos:
  - id: task1-redirect
    content: Replace src/app/page.js with redirect('/dashboard') and commit
    status: pending
  - id: task2-delete-tests
    content: Create src/db/seeds/deleteTestProjects.js, run it, and commit
    status: pending
  - id: task3-advance-status
    content: Add PIPELINE_TO_DB/toDbStatus to statusConfig.js, add delivered mapping, fix projectActions.js server action normalization, and commit
    status: pending
  - id: task4-pricing-tab
    content: Replace JWT cookie role detection with clerkClient.users.getUser() in projects/[id]/page.jsx and commit
    status: pending
  - id: task5-portal-scoping
    content: Update getPortalProjects.js, portal/page.jsx, and portal/[id]/page.jsx for clientName scoping and commit
    status: pending
  - id: task6-migration
    content: Run migration 004 SQL in Supabase dashboard, add tracking comment to file, and commit
    status: pending
isProject: false
---

# SeniorFreightOS 6-Task Sprint

## Task 1 — Fix root URL redirect

**File:** [`src/app/page.js`](src/app/page.js)

Replace the default Next.js boilerplate with a simple server-side redirect. The App Router `redirect()` from `next/navigation` fires before any render.

```js
import { redirect } from 'next/navigation';
export default function Home() {
  redirect('/dashboard');
}
```

Commit: `fix: redirect root URL to dashboard`

---

## Task 2 — Delete test projects

**File to create:** [`src/db/seeds/deleteTestProjects.js`](src/db/seeds/deleteTestProjects.js)

Seeds dir already exists (`defaultRateCard.js`, `demoData.js`). New script uses `query()` from `src/db/index.js` to delete by `code`. Shipments and install_tasks cascade automatically per the FK constraint in migration 003.

```js
const { query } = require('../../db/index');
async function run() {
  const { rowCount } = await query(
    `DELETE FROM projects WHERE code = ANY($1)`,
    [['FTE-2026-001', 'FTE-2026-002']],
  );
  console.log(`Deleted ${rowCount} project(s).`);
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
```

Run with: `node -e "require('dotenv').config(); require('./src/db/seeds/deleteTestProjects.js')"`

Commit: `chore: remove test projects from DB`

---

## Task 3 — Fix Advance Status server action

**Findings:** The client-side check in `ProjectDetailClient.jsx` line 41 already applies `toPipelineStatus()` correctly — that side is working. The bug is entirely in the **server action**.

**Bug in [`src/app/projects/[id]/_actions/projectActions.js`](src/app/projects/[id]/_actions/projectActions.js) lines 17–20:**
```js
const current = rows[0].status;            // DB value e.g. 'installing'
const nextOptions = VALID_TRANSITIONS[current] ?? [];  // keyed by pipeline label — always []
```

**Fix:** Import `toPipelineStatus` from `statusConfig.js` and add a `PIPELINE_TO_DB` reverse map. The `advanceStatus` action will:
1. Normalize DB status → pipeline label via `toPipelineStatus()`
2. Look up `VALID_TRANSITIONS[pipelineLabel]` → get next pipeline label
3. Convert next pipeline label → DB value via `PIPELINE_TO_DB` before the UPDATE

**Also needed:** `statusConfig.js` is missing `delivered: 'Delivered'` in `DB_TO_PIPELINE`. Add it (no other files change).

**Files changed:**
- [`src/app/portal/_components/statusConfig.js`](src/app/portal/_components/statusConfig.js) — add `delivered: 'Delivered'` and export `PIPELINE_TO_DB` + `toDbStatus()`
- [`src/app/projects/[id]/_actions/projectActions.js`](src/app/projects/[id]/_actions/projectActions.js) — import `toPipelineStatus` + `toDbStatus`, normalize both directions

Commit: `fix: Advance Status button and action pipeline normalization`

---

## Task 4 — Fix Pricing Quote tab for admin

**Bug in [`src/app/projects/[id]/page.jsx`](src/app/projects/[id]/page.jsx) lines 24–33:** Role is read from a custom `token` JWT cookie using `JWT_SECRET`. This doesn't match Clerk's auth model — the cookie may not exist, making `isAdmin` always false.

**Fix:** Replace `getUserRole()` with a Clerk API call. Remove `jwt` import.

```js
import { auth, clerkClient } from '@clerk/nextjs/server';

// Inside the page component:
const { userId } = await auth();
if (!userId) redirect('/sign-in');
const client = await clerkClient();
const user = await client.users.getUser(userId);
const role = user.publicMetadata?.role ?? null;
const isAdmin = role === 'admin';
```

**Files changed:**
- [`src/app/projects/[id]/page.jsx`](src/app/projects/[id]/page.jsx) — swap JWT cookie logic for Clerk API call; remove `jwt` import, add `redirect` import

Commit: `fix: show Pricing Quote tab for admin role`

---

## Task 5 — Re-implement clientName scoping on portal

**Current state:** `getPortalProjects()` returns all projects (no WHERE clause). Both portal pages call `auth()` but never check `publicMetadata`.

**`getPortalProjects.js` change:** Accept optional `clientName` param:
- If provided → `WHERE client_name = $1`
- If not → no WHERE (admin path)

Also add `client_name` to the SELECT so the returned object includes it for downstream use.

**`portal/page.jsx` change:**
```js
const client = await clerkClient();
const user = await client.users.getUser(userId);
const { role, clientName } = user.publicMetadata ?? {};

if (!clientName && role !== 'admin') {
  // render "not linked to a client organization" message
}
const projects = await getPortalProjects(clientName ?? null);
```

**`portal/[id]/page.jsx` change:** After fetching the project, verify scoping:
```js
if (clientName && project.clientName !== clientName) notFound();
```

**Files changed:**
- [`src/app/portal/_data/getPortalProjects.js`](src/app/portal/_data/getPortalProjects.js) — add optional `clientName` param + conditional WHERE
- [`src/app/portal/page.jsx`](src/app/portal/page.jsx) — read Clerk metadata, branch on role/clientName
- [`src/app/portal/[id]/page.jsx`](src/app/portal/[id]/page.jsx) — add clientName ownership check

Commit: `fix: restore clientName scoping on client portal`

---

## Task 6 — Run migration 004 and document it

Migration 004 SQL (4 lines, already written in [`src/db/migrations/004_add_rate_card_install_tasks.sql`](src/db/migrations/004_add_rate_card_install_tasks.sql)):
```sql
ALTER TABLE rate_cards
  ADD COLUMN IF NOT EXISTS install_task_rates JSONB NOT NULL DEFAULT '{}';
```

This must be run manually via the Supabase dashboard SQL editor (no programmatic DB access in-repo). After running it, we commit a tracking comment to the migration file confirming it was applied.

Commit: `chore: mark migration 004 as run`
