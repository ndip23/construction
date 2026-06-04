# BuildHub — Security Review & Superadmin Delivery

**Date:** 2026-06-04
**Scope:** `apps/api` (Express + Mongoose, JWT, multi-tenant) and `apps/web` (React + Vite)
**Status:** Critical + High findings **fixed**; superadmin account + monitoring dashboard **built and verified**.

---

## 1. Security findings

Severity legend: 🔴 Critical · 🟠 High · 🟡 Medium · ⚪ Low

| # | Sev | Finding | Status |
|---|-----|---------|--------|
| C1 | 🔴 | **Anyone could self-register as `admin`** — `/auth/register` trusted a client-supplied `role`, so a stranger got full platform control (see all companies/emails, verify/reject, edit global settings). | ✅ Fixed |
| H1 | 🟠 | **Self-verify + wallet tampering** — `updateCompany` wrote raw `req.body`, letting an owner set their own `status:'verified'` or `walletBalance`. | ✅ Fixed |
| H2 | 🟠 | **Cross-tenant message injection** — `sendMessage` didn't check the caller was a conversation participant (IDOR). | ✅ Fixed |
| H3 | 🟠 | **No rate limiting on auth** — password and the 4-digit worker PIN (10k combos) were brute-forceable. | ✅ Fixed |
| H4 | 🟠 | **Forged attendance** — clock-in/out trusted any `workerId` without checking company ownership. | ✅ Fixed |
| M1 | 🟡 | **JWT secret not fail-closed** — server would boot with a missing/weak `JWT_SECRET`. | ✅ Fixed (boot assertion) |
| M2 | 🟡 | **Wallet webhook** accepts unsigned events when `NODE_ENV` ≠ `production`. | ⚠️ Deploy config — ensure `NODE_ENV=production` |
| M3 | 🟡 | **Unescaped HTML in receipt emails** — client-supplied fields interpolated into email HTML. | ⏳ Recommended next |
| M4 | 🟡 | **Public inquiry endpoint** is spammable (no captcha/throttle). | ⏳ Recommended next |

### What was fixed (commit `9e53435`)
- Registration can now **only** create a tenant `owner` — `role` is never read from the request body.
- `updateCompanyBySlug` whitelists editable fields (no more mass-assignment).
- `sendMessage` verifies conversation membership.
- Attendance validates the worker belongs to the caller's company.
- All auth endpoints (login / register / password reset / **worker PIN login**) are rate-limited to 10 attempts / 15 min per IP+identifier.
- Server refuses to boot if `JWT_SECRET` is missing or < 16 chars.

### Verified clean (no action needed)
Passwords + worker PIN are bcrypt-hashed (cost 12, `select:false`); most controllers already scope by `companyId`; no hardcoded secrets; `.env` is gitignored; no SQL/NoSQL injection sinks; no `eval` / `dangerouslySetInnerHTML`.

### Still recommended (not yet done)
- Escape user-supplied fields in receipt emails (M3).
- Add a captcha/throttle to public inquiry + tender-post endpoints (M4).
- Confirm `NODE_ENV=production` on the deployed API (M2).
- Worker tokens last 30 days with no revocation — consider shortening + a token version for logout-all.

---

## 2. Superadmin (platform owner)

A dedicated **`superadmin`** role sits above the existing `admin`. It is **seed-only** — it can never be created through the public site.

### Creating the account
1. Add to `apps/api/.env`:
   ```
   SUPERADMIN_EMAIL=you@buildhub.com
   SUPERADMIN_PASSWORD=a-long-strong-password   # ≥ 10 chars
   SUPERADMIN_NAME=Platform Owner               # optional
   ```
2. Run:
   ```
   cd apps/api && yarn seed:superadmin
   ```
3. Log in at `/login` with that email + password → you land on `/superadmin`.

(Re-running the script is safe — it resets the password/role on an existing account with that email.)

### Dashboard pages (to monitor the site)
| Page | Route | What it does |
|------|-------|--------------|
| **Overview** | `/superadmin` | Live KPIs: companies (total/verified/pending/suspended), users, workers, open tenders, projects, marketplace GMV, total wallet float, system health |
| **Companies** | `/superadmin/companies` | Search/filter all companies; **suspend/reinstate** (with reason), change **plan**, manually **adjust wallet** (credit/debit) |
| **Users** | `/superadmin/users` | List all users across companies; **change role** (admin/owner/staff) — superadmins are locked |
| **Finance** | `/superadmin/finance` | Paid/Pending/Overdue invoice totals + recent invoices platform-wide |
| **Audit Log** | `/superadmin/audit` | Immutable trail of every privileged action (who, what, target, before→after, reason, time, IP) |

Every privileged write (suspend, plan change, wallet adjustment, role change) is recorded to the audit log automatically.

### Verified end-to-end
Login → all 5 endpoints `200`; owner token blocked with `403`; suspend wrote a correct audit entry and reinstated cleanly; registering with `role:admin` now yields `owner`. (Test accounts were created against the live DB and then deleted.)
