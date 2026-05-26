---
name: setup-cloudflare-continuous-delivery
description: Set up full Cloudflare Pages continuous delivery pipeline. Configures wrangler.toml, Makefile local deploy, GitHub Actions workflow (branch or tag trigger), GitHub repo secrets via gh CLI, and creates the Pages project if it doesn't exist yet.
license: MIT
metadata:
  author: analizza-ai
  version: "1.0"
---

Set up a complete Cloudflare Pages continuous delivery pipeline for the current project.

This skill will:
1. Collect project name, credentials, and deploy strategy
2. Create `wrangler.toml`
3. Create `Makefile` with `make deploy`
4. Create `.github/workflows/deploy.yml` (branch or tag trigger)
5. Set GitHub repo secrets via `gh` CLI
6. Create the Cloudflare Pages project if it doesn't exist
7. Commit and push everything

---

## Steps

### 1. Collect project info

Use **AskUserQuestion** to ask:

> "What is the Cloudflare Pages project name?"

Default suggestion: derive from the git remote URL (e.g. `analizza-ai/analizza-ai.github.io` → `analizza-ai`).

Run `git remote get-url origin` to detect the current repo slug automatically — pre-fill the suggestion.

### 2. Choose deploy trigger strategy

Use **AskUserQuestion** to ask:

> "How should deployments be triggered?"

Options:
- **Branch push** — deploy on every push to a specific branch (e.g. `master` or `main`)
- **Tag push** — deploy only when a version tag is pushed (e.g. `v*`)
- **Both** — deploy on branch push AND on version tags

If **Branch push** or **Both**: ask which branch (detect current branch via `git branch --show-current`, use as default).

If **Tag push** or **Both**: use pattern `v*` by default (ask to confirm or customise).

### 3. Check credentials

Check if env vars are already set:
```bash
echo $CLOUDFLARE_API_TOKEN
echo $CLOUDFLARE_ACCOUNT_ID
```

**If missing**, pause and tell the user:
```
CLOUDFLARE_API_TOKEN not found.
→ Create one at https://dash.cloudflare.com/profile/api-tokens
  Use the "Edit Cloudflare Workers" template or set:
    Account → Cloudflare Pages → Edit
    Account → Account → Read

CLOUDFLARE_ACCOUNT_ID not found.
→ Find it at https://dash.cloudflare.com/<your-account-id>/home
  (visible in the right sidebar of the Cloudflare dashboard)
```

Ask the user to paste each value. Add them to `~/.bashrc` and `~/.zshrc` with grep guards:
```bash
grep -q "CLOUDFLARE_API_TOKEN" ~/.bashrc || echo 'export CLOUDFLARE_API_TOKEN=<token>' >> ~/.bashrc
grep -q "CLOUDFLARE_ACCOUNT_ID" ~/.bashrc || echo 'export CLOUDFLARE_ACCOUNT_ID=<id>' >> ~/.bashrc
grep -q "CLOUDFLARE_API_TOKEN" ~/.zshrc  || echo 'export CLOUDFLARE_API_TOKEN=<token>' >> ~/.zshrc
grep -q "CLOUDFLARE_ACCOUNT_ID" ~/.zshrc  || echo 'export CLOUDFLARE_ACCOUNT_ID=<id>' >> ~/.zshrc
```

Export them in the current shell too:
```bash
export CLOUDFLARE_API_TOKEN=<token>
export CLOUDFLARE_ACCOUNT_ID=<id>
```

### 4. Create `wrangler.toml`

Write `wrangler.toml` at the repo root:

```toml
name = "<project-name>"
compatibility_date = "<today-YYYY-MM-DD>"
pages_build_output_dir = "."
```

If `wrangler.toml` already exists, read it first and only update the `name` field if it differs.

### 5. Create Cloudflare Pages project

Check if the project already exists:
```bash
CLOUDFLARE_API_TOKEN=<token> CLOUDFLARE_ACCOUNT_ID=<id> \
  npx wrangler pages project list 2>&1
```

If `<project-name>` is NOT in the list, create it:
```bash
CLOUDFLARE_API_TOKEN=<token> CLOUDFLARE_ACCOUNT_ID=<id> \
  npx wrangler pages project create <project-name> --production-branch=<branch>
```

If it already exists, skip and continue.

### 6. Create `Makefile`

Write `Makefile` at the repo root. If it already exists, merge the `deploy` and `help` targets only.

```makefile
.PHONY: help deploy

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

deploy: ## Deploy site to Cloudflare Pages
	npx wrangler pages deploy . --project-name=<project-name> --branch=<branch> --commit-dirty=true
```

### 7. Create `.github/workflows/deploy.yml`

Determine the `on:` trigger based on the chosen strategy:

**Branch push only:**
```yaml
on:
  push:
    branches: [<branch>]
```

**Tag push only:**
```yaml
on:
  push:
    tags: ['v*']
```

**Both:**
```yaml
on:
  push:
    branches: [<branch>]
    tags: ['v*']
```

Write the full workflow file:

```yaml
name: Deploy to Cloudflare Pages

on:
  <trigger from above>

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy . --project-name=<project-name> --branch=<branch> --commit-dirty=true
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

**Note:** Both `with.apiToken/accountId` AND `env.CLOUDFLARE_*` are required — `wrangler-action@v3` alone is insufficient in non-interactive environments.

If `.github/workflows/deploy.yml` already exists, overwrite it (show a warning first).

### 8. Set GitHub repo secrets

Detect the GitHub remote:
```bash
git remote get-url origin
```

Parse `owner/repo` from the URL (handles both `https://github.com/owner/repo.git` and `git@github.com:owner/repo.git`).

Check if `gh` CLI is authenticated:
```bash
gh auth status
```

If authenticated, set secrets silently:
```bash
echo "<token>" | gh secret set CLOUDFLARE_API_TOKEN --repo <owner/repo>
echo "<account-id>" | gh secret set CLOUDFLARE_ACCOUNT_ID --repo <owner/repo>
```

Verify:
```bash
gh secret list --repo <owner/repo>
```

If `gh` is not authenticated, print the manual instructions:
```
Add these secrets manually at:
https://github.com/<owner/repo>/settings/secrets/actions

  CLOUDFLARE_API_TOKEN  = <first 8 chars>...
  CLOUDFLARE_ACCOUNT_ID = <account-id>
```

### 9. Add `.wrangler/` to `.gitignore`

Check if `.gitignore` exists. If it does, append only if `.wrangler/` is not already listed:
```bash
grep -q ".wrangler" .gitignore || echo '.wrangler/' >> .gitignore
```

If `.gitignore` doesn't exist, create it with `.wrangler/` as the first entry.

Remove `.wrangler/` from git tracking if it was previously committed:
```bash
git rm -r --cached .wrangler/ 2>/dev/null || true
```

### 10. Run first local deploy

```bash
CLOUDFLARE_API_TOKEN=<token> CLOUDFLARE_ACCOUNT_ID=<id> \
  npx wrangler pages deploy . --project-name=<project-name> --branch=<branch> --commit-dirty=true
```

Capture the deployment URL from stdout (line matching `Deployment complete! Take a peek over at https://...`).

### 11. Commit and push

Stage all new/modified files:
```bash
git add wrangler.toml Makefile .github/workflows/deploy.yml .gitignore
```

Commit:
```bash
git commit -m "Add Cloudflare Pages continuous delivery pipeline

- wrangler.toml: project config
- Makefile: make deploy target
- .github/workflows/deploy.yml: auto-deploy on <trigger>
- .gitignore: exclude .wrangler/ cache"
```

Push:
```bash
git push
```

### 12. Watch the Actions run

After push, watch the first Actions run:
```bash
until gh run list --repo <owner/repo> --limit 1 --json status,conclusion | jq -e '.[0].status == "completed"' > /dev/null 2>&1; do sleep 5; done
gh run list --repo <owner/repo> --limit 1 --json status,conclusion,displayTitle | jq -r '.[] | "[\(.conclusion)] \(.displayTitle)"'
```

### 13. Summary

Print a completion summary:

```
✓ Cloudflare Pages CD pipeline configured

  Project     : <project-name>
  Trigger     : <branch push / tag push / both>
  Live site   : https://<project-name>.pages.dev
  First deploy: https://<deployment-url>

  Local deploy: make deploy
  CI/CD:        push to <branch> → GitHub Actions → Cloudflare Pages

  Secrets set in: <owner/repo>
    ✓ CLOUDFLARE_API_TOKEN
    ✓ CLOUDFLARE_ACCOUNT_ID
```

## Guardrails

- Never print the full API token — show only first 8 chars followed by `...`
- If `wrangler.toml`, `Makefile`, or `deploy.yml` already exist, read them before writing — merge, don't blindly overwrite
- If the Pages project already exists, skip creation silently
- If `gh` is not available or not authenticated, print manual secret instructions instead of failing
- If credentials are missing from the environment, always pause and ask — never proceed without them
- The `env:` block in the workflow step is mandatory alongside `with.apiToken` — `wrangler-action@v3` requires explicit env vars in non-interactive CI environments
