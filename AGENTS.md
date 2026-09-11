<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

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
