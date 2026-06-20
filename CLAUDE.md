@AGENTS.md

# SeniorFreightOS — Project Context

## What This Is
A custom FF&E logistics order management platform for Olson Resource Group (ORG).
Built as a proof-of-concept demo for potential clients in the senior living space.
Clients include Brookdale Senior Living, Sunrise Senior Living, and Direct Supply.

## Stack
- Framework: Next.js 16.2.9, App Router, src/ directory
- Language: Plain JavaScript ONLY — NO TypeScript, ever
- Styling: Tailwind CSS ONLY — no CSS modules, no styled-components
- Database: PostgreSQL via Supabase (project ID: meiliytmfleauoiuncuh)
- Auth: Clerk (@clerk/nextjs) — development instance
- Hosting: Vercel — auto-deploys on push to main
- Node: v26.0.0, npm 11.12.1
- GitHub: github.com/Corey-Sh4ne/seniorfreightos
- Live URL: seniorfreightos.vercel.app

## Critical Rules
- NEVER use TypeScript
- NEVER write raw SQL outside of src/db/index.js — always use query(sql, params)
- NEVER modify pricingEngine.js or StatusRail.jsx
- NEVER read role or clientName from sessionClaims — always use clerkClient().users.getUser(userId)
- NEVER use localStorage or sessionStorage
- Always add export const dynamic = 'force-dynamic' to server components that query the DB
- Middleware lives in src/proxy.js (Next.js 16 renamed middleware)
- clerkClient is async — always await clerkClient() before .users.getUser()

## Architecture — Three Role-Based Interfaces

### Admin Portal (/dashboard, /projects, /clients, /rate-card)
- Full access to all projects, clients, rate cards
- Sends quotes, schedules delivery, marks invoiced
- "View As" switcher in sidebar to preview other role views

### Order Management System (/ops)
- For dispatcher/warehouse staff
- Stage-based confirmation flow for receiving, consolidating, delivery, install
- Each stage reveals one active section, previous stages collapse to locked summary

### Client Portal (/portal, /portal/[id], /portal/quotes/[id])
- Scoped to clientName from Clerk publicMetadata
- Shows pending quotes above active projects
- Accept/Deny quotes, view project status

## Role System
- Roles stored in Clerk publicMetadata: { role: "admin" | "client_user" | "dispatcher" }
- clientName stored in Clerk publicMetadata for client_user accounts
- Route protection in src/proxy.js:
  * client_user → /portal only
  * dispatcher → /ops only
  * admin → everything

## Status Pipeline

### DB values (stored in Supabase)
prospect → quoted → denied → awarded → receiving → staging →
scheduled → delivered → installing → complete → invoiced

### Pipeline labels (used in UI)
Quote Requested → Quote Sent → Quote Denied → Approved → Receiving →
Consolidating → Out for Delivery → Delivered → Installing → Complete

### Mapping lives in src/app/portal/_components/statusConfig.js
Always use toPipelineStatus() to convert DB values to labels before
passing to StatusRail or VALID_TRANSITIONS

## Database Schema

### projects
id, code (FTE-YYYY-###), client_name, facility_name, facility_address,
contact_name, contact_email, miles_from_hub, storage_days, rush_delivery,
status, rates (jsonb), quoted_price (jsonb), accepted_at, notes,
created_at, updated_at

### shipments
id, project_id (FK), vendor, category, description, qty,
weight_per_unit_lbs, cartons, eta, received

### install_tasks
id, project_id (FK), type, qty, notes, completed

### rate_cards
id, name, rates (jsonb), is_default, created_at, updated_at

### client_rate_assignments
id, client_name, rate_card_id (FK), created_at, updated_at

### clients
id, name (UNIQUE), contact_name, contact_email, contact_phone,
clerk_user_id, rate_card_id (FK), created_at, updated_at

## Key Files
- src/db/index.js — exports query(sql, params) — use for ALL DB calls
- src/proxy.js — Clerk middleware + role-based route protection
- src/app/portal/_components/statusConfig.js — DB→pipeline mapping
- src/utils/pricingEngine.js — PURE FUNCTION, NEVER MODIFY
- src/components/StatusRail.jsx — DO NOT MODIFY
- src/app/dashboard/_components/Sidebar.jsx — shared sidebar with View As switcher
- src/app/dashboard/_lib/viewAsOptions.js — View As cookie logic
- src/app/ops/_actions/opsActions.js — all ops stage transition actions
- src/app/projects/[id]/_actions/projectActions.js — sendQuote, resendQuote
- src/app/portal/[id]/_actions/quoteActions.js — acceptQuote, denyQuote
- src/app/clients/_actions/clientActions.js — createClient, updateClient

## Environment Variables
- DATABASE_URL — Supabase pooler URL (port 6543, NOT 5432)
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- CLERK_SECRET_KEY

## Demo Data (in Supabase)
- FTE-2026-003: Brookdale Senior Living — Brookdale Naperville East
- FTE-2026-004: Sunrise Senior Living — Sunrise of Hinsdale
- FTE-2026-005: Direct Supply — Elmhurst Care Center
- FTE-2026-001, FTE-2026-002: Test projects (to be deleted via delete feature)

## Demo Clerk Accounts
- corey23olson@gmail.com — admin
- admin@seniorfreightos.com — admin
- dispatcher@seniorfreightos.com — dispatcher
- client@brookdale.com — client_user, clientName: "Brookdale Senior Living"

## Migrations Run
- 001_create_projects.sql ✅
- 002_create_shipments.sql ✅
- 003_create_install_tasks.sql ✅
- 004_add_rate_card_install_tasks.sql ❌ skipped (rate_cards table created manually)
- 005_add_delivered_project_status.sql ✅
- 006_add_quote_columns.sql ✅
- 007_rate_card_system.sql ✅
- 008_create_clients.sql ✅

## Remaining Work
1. Fix sendQuote server action — not saving to DB (status stays prospect)
2. Fix Assign Companies modal on Rate Card page
3. Update New Project form to use client dropdown (searchable)
4. Wire rate card assignment from clients table into Pricing Quote tab
5. Add more demo data — multiple projects per client at different stages
6. Clients page — verify linking Clerk accounts works
7. Delete project feature
8. End-to-end demo run and polish

## Working Pattern
- This project is directed by Claude (claude.ai) acting as technical director
- Claude writes prompts and context, developer pastes into Claude Code or Cursor
- Prefer copy-pasteable terminal commands
- Push to main after each working feature: git add . && git commit -m "..." && git push origin main
