---
name: setup-cloudflare-mcp
description: Set up Cloudflare MCP server for the active AI agent. Asks global or local install scope, MCP server name, prompts for API Token and Account ID with dashboard links, and exports credentials to ~/.bashrc and ~/.zshrc.
license: MIT
metadata:
  author: analizza-ai
  version: "1.0"
---

Set up the Cloudflare MCP server for the current AI coding agent.

This skill will:
1. Ask install scope (global or local)
2. Ask MCP server name
3. Prompt for API Token and Account ID with links
4. Write MCP config to the correct file
5. Export credentials to `~/.bashrc` and `~/.zshrc`

---

## Steps

### 1. Ask install scope

Use **AskUserQuestion** to ask:

> "Where should the Cloudflare MCP be installed?"

Options:
- **Local — `.mcp.json` in project root** (scoped to this repo only — recommended for project-specific setups)
- **Global — agent settings file** (available in all projects on this machine)

For global, the config file depends on the active agent:

| Agent | Global config path |
|---|---|
| Claude Code | `~/.claude/settings.json` under `mcpServers` |
| Cursor | `~/.cursor/mcp.json` |
| Codex | `~/.codex/settings.json` |
| Gemini | `~/.gemini/settings.json` |

Detect the active agent from context (e.g. if running inside Claude Code, default global path is `~/.claude/settings.json`).

### 2. Ask MCP server name

Use **AskUserQuestion** to ask:

> "What name should the Cloudflare MCP server have in your config?"

Options:
- **cloudflare** (default — broad, works for all Cloudflare products)
- **cloudflare-pages** (descriptive, useful if you only use it for Pages deployments)
- Let the user type a custom name

### 3. Prompt for CLOUDFLARE_API_TOKEN

Check if `CLOUDFLARE_API_TOKEN` is already set in the environment:
```bash
echo $CLOUDFLARE_API_TOKEN
```

If already set, confirm with the user whether to reuse it or replace it.

If not set, use **AskUserQuestion** (open-ended) to ask:

> "Paste your Cloudflare API Token. Don't have one yet?
> → Create it at https://dash.cloudflare.com/profile/api-tokens
>
> Tips:
> • Use the **'Edit Cloudflare Workers'** template — covers Pages, Workers and everything Wrangler needs
> • Or create a custom token with: Account → Cloudflare Pages → Edit + Account → Account → Read
> • The token is shown only once — copy it before closing the page"

### 4. Prompt for CLOUDFLARE_ACCOUNT_ID

Check if `CLOUDFLARE_ACCOUNT_ID` is already set in the environment:
```bash
echo $CLOUDFLARE_ACCOUNT_ID
```

If already set, confirm with the user whether to reuse it or replace it.

If not set, use **AskUserQuestion** (open-ended) to ask:

> "Paste your Cloudflare Account ID. Don't know where to find it?
> → Go to your Cloudflare dashboard: https://dash.cloudflare.com
>   Your Account ID is in the **right sidebar** of any page under 'Account ID'
>   Direct link (replace with your ID once known): https://dash.cloudflare.com/<ACCOUNT_ID>/home
>
> It looks like: 7cb25c5c34734caca6514ee5a3c9936c"

### 5. Write MCP config

**If local scope** — create or update `.mcp.json` at project root:

```json
{
  "mcpServers": {
    "<chosen-name>": {
      "url": "https://mcp.cloudflare.com/mcp",
      "headers": {
        "Authorization": "Bearer ${CLOUDFLARE_API_TOKEN}"
      }
    }
  }
}
```

If `.mcp.json` already exists, merge the new entry into the existing `mcpServers` object — do not overwrite other entries.

**If global scope** — add the same entry under `mcpServers` in the agent's global settings file. If the file doesn't exist, create it with just the `mcpServers` block. If it exists, merge without overwriting existing servers.

### 6. Export credentials to shell profiles

Append to `~/.bashrc` and `~/.zshrc` with a grep guard to avoid duplicates:

```bash
grep -q "CLOUDFLARE_API_TOKEN" ~/.bashrc || echo 'export CLOUDFLARE_API_TOKEN=<token>' >> ~/.bashrc
grep -q "CLOUDFLARE_ACCOUNT_ID" ~/.bashrc || echo 'export CLOUDFLARE_ACCOUNT_ID=<id>' >> ~/.bashrc
grep -q "CLOUDFLARE_API_TOKEN" ~/.zshrc || echo 'export CLOUDFLARE_API_TOKEN=<token>' >> ~/.zshrc
grep -q "CLOUDFLARE_ACCOUNT_ID" ~/.zshrc || echo 'export CLOUDFLARE_ACCOUNT_ID=<id>' >> ~/.zshrc
```

If a value already existed and the user chose to replace it, use `sed` to update the existing line instead of appending.

### 7. Confirm and summarize

Show a completion summary:

```
✓ Cloudflare MCP configured
  Server name : <chosen-name>
  Config file : <path to .mcp.json or global settings>
  Credentials : CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID exported
                to ~/.bashrc and ~/.zshrc

Next steps:
  1. Restart your AI agent / open a new terminal to pick up the env vars
  2. Ask your agent to list Cloudflare Pages projects to confirm the MCP works
```

## Guardrails

- **Never print the full token or account ID back** in plain text — show only the first 8 chars of the token followed by `...` for confirmation
- If `.mcp.json` or the global settings file already has a `cloudflare` (or same-named) entry, warn the user before overwriting
- If `~/.zshrc` does not exist, create it before appending
- The `CLOUDFLARE_ACCOUNT_ID` goes only in shell profiles — NOT in `.mcp.json` (the MCP server derives the account from the token)
