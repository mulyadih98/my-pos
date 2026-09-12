<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# CONTEXT PRESERVATION & SESSION RECOVERY PROTOCOL

If a session is interrupted (due to rate limit, token limit, or network disconnection) or when starting any new session:
1. **Instant Context Recovery:** Immediately run `git status`, `git log -3 --oneline`, and read `.opencode/PROGRESS.md` to determine the exact state of work without wasting tokens re-explaining or re-exploring the codebase.
2. **Task Atomicity:** Break complex features into small, testable chunks. For tasks taking > 2 steps, keep `.opencode/PROGRESS.md` updated with completed items and the immediate next step.
3. **Micro-Commit Rule:** Never pile up multiple unrelated changes. Commit each completed sub-task promptly so no work is lost if a session ends abruptly.

# PROJECT ARCHITECTURE SUMMARY

- **Framework:** Next.js 16.2.4 (App Router) + React 19.2.4 (with React Compiler).
- **Database:** PostgreSQL (Supabase Cloud via IPv4 Pooler or local PostgreSQL).
- **ORM:** Prisma 7.8.0 with `@prisma/adapter-pg`. Client output: `@/generated/prisma`. Schema: `prisma/schema.prisma`.
- **Unique IDs:** Always use `generateId()` from `@/lib/utils` (safe for both HTTP non-secure IP contexts and HTTPS, avoiding `crypto.randomUUID` failures).
- **Thermal Printing:**
  - Fallback Windows Driver: `printReceiptViaIframe()` in `@/lib/thermal-printer` (isolated iframe, pure `#000000`, 0mm margin, no browser URL headers).
  - Direct ESC/POS: `printReceiptDirect()` in `@/lib/direct-printer` via Web Bluetooth.
  - Smart print: `smartPrintReceipt()` automatically prioritizes Direct, falls back to iframe.
- **Store Settings:** `StoreSettings` in `@/types/pengaturan`. Per-device settings stored in `localStorage` via `@/lib/settings-client`, global defaults in table `Pengaturan`.
- **POS Cashier Viewport:** Mobile/Tablet (< 1024px) uses Tab Switcher (`[Produk & Scan]` vs `[Keranjang & Bayar]`) + Floating Bottom Bar. Desktop (>= 1024px) uses 2-column split.

# MANDATORY WORKFLOW: Feature Addition & Bug Fixing

Whenever you are instructed to add a new feature, make modifications, or fix an issue in this project, you MUST strictly follow this 5-step workflow without exception:

1. **Create Branch**: Check out `main`, then create a dedicated branch:
   - For new features: `git checkout -b feat/<feature-name>`
   - For bug fixes: `git checkout -b fix/<bug-name>`
2. **Build / Implement / Fix**:
   - Write the required code cleanly according to project conventions.
   - Run self-verification: `npm run build` to ensure zero compilation or type errors.
3. **Commit**:
   - Stage relevant files (`git add ...`).
   - Create a concise commit: `git commit -m "<feat|fix>: <clear message>"`.
4. **Merge to Main**:
   - Switch back to main: `git checkout main`.
   - Merge the feature/fix branch: `git merge <feat|fix>/<branch-name>`.
   - Clean up the temporary branch: `git branch -d <feat|fix>/<branch-name>`.
5. **Push to GitHub**:
   - Push the updated main branch to remote: `git push origin main`.
