---
name: setup-atlassian-mcp
description: >
  Configures the Atlassian MCP server (Rovo) using Personal API Token (Basic auth) in the project's .mcp.json.
  Use this skill when the user says "setup atlassian mcp", "add atlassian mcp", "configurar atlassian mcp",
  "criar setup-atlassian-mcp", "adicionar atlassian ao mcp", or wants Copilot CLI to interact with Jira/Confluence via Atlassian Rovo.
  This skill asks for the user's email and API token, generates the base64 credential, and writes .mcp.json
  in the current working directory.
argument-hint: "No arguments required — the skill will prompt for email and API token."
---

# Skill: setup-atlassian-mcp

Configures the Atlassian MCP integration (Rovo) using **Personal API Token (Basic auth)** by creating or
updating `.mcp.json` in the **current working directory** with the `atlassian-rovo-mcp` server entry.

After setup, Copilot CLI can interact with Jira, Confluence, and other Atlassian products natively via
the Atlassian Remote MCP server at `https://mcp.atlassian.com/v1/mcp`.

---

## What This Skill Does

1. Prompts the user for credentials in **two separate questions**: first the email, then the API token (with a friendly link to create one with max settings pre-filled).
2. Generates the `base64(email:api_token)` credential string.
3. Checks if `.mcp.json` already exists in the current directory.
4. If it does **not** exist: creates `.mcp.json` with the `atlassian-rovo-mcp` entry.
5. If it **does** exist: uses a Python script to safely merge **only** the `atlassian-rovo-mcp` entry into the existing `mcpServers` object — all other servers are preserved.
6. Validates the final JSON.
7. Instructs the user to restart Copilot CLI.

---

## Prerequisites

- An Atlassian account with access to Jira or Confluence.
- A **Personal API Token** created at: https://id.atlassian.com/manage-profile/security/api-tokens
- The email address associated with that Atlassian account.

---

## Procedure

### Step 1 — Collect credentials from the user

Use the `ask_user` tool **twice**, one question at a time:

**Pergunta 1 — E-mail:**
Pergunte o endereço de e-mail da conta Atlassian do usuário (ex.: `seuemail@empresa.com`). Armazene a resposta como `ATLASSIAN_EMAIL`.

**Pergunta 2 — API Token:**
Pergunte pelo Personal API Token. Na pergunta, inclua uma mensagem amigável com o link direto para criar um token com as configurações máximas já pré-preenchidas:

> 🔑 Agora cole seu Atlassian Personal API Token.
> Ainda não tem um? Crie aqui (validade máxima + todos os escopos já pré-configurados):
> https://id.atlassian.com/manage-profile/security/api-tokens?autofillToken&expiryDays=max&appId=mcp&selectedScopes=all

Armazene a resposta como `ATLASSIAN_API_TOKEN`.

### Step 2 — Generate the base64 credential

Run the following command replacing the placeholders with the values collected in Step 1:

```bash
echo -n "ATLASSIAN_EMAIL:ATLASSIAN_API_TOKEN" | base64
```

Store the output as `BASE64_CREDENTIAL`. This is the value that goes into the `Authorization` header.

### Step 3 — Check if .mcp.json exists in the current directory

```bash
ls .mcp.json 2>/dev/null && echo "exists" || echo "not found"
```

### Step 4 — Create or update .mcp.json

**Case A — File does not exist:**

Create `.mcp.json` in the current directory with:

```json
{
  "mcpServers": {
    "atlassian-rovo-mcp": {
      "url": "https://mcp.atlassian.com/v1/mcp",
      "headers": {
        "Authorization": "Basic BASE64_CREDENTIAL"
      }
    }
  }
}
```

Replace `BASE64_CREDENTIAL` with the actual base64 string generated in Step 2.

**Case B — File already exists:**

**IMPORTANT**: When `.mcp.json` already exists, **never recreate or overwrite the file**.
Only inject the `atlassian-rovo-mcp` entry into the existing `mcpServers` object, preserving all other servers.

Use the following Python script to safely merge the entry:

```bash
python3 - << 'PYEOF'
import json

with open('.mcp.json', 'r') as f:
    config = json.load(f)

if 'mcpServers' not in config:
    config['mcpServers'] = {}

config['mcpServers']['atlassian-rovo-mcp'] = {
    "url": "https://mcp.atlassian.com/v1/mcp",
    "headers": {
        "Authorization": "Basic BASE64_CREDENTIAL"
    }
}

with open('.mcp.json', 'w') as f:
    json.dump(config, f, indent=2)

print("✅ atlassian-rovo-mcp merged into .mcp.json")
print("Existing servers preserved:", list(config['mcpServers'].keys()))
PYEOF
```

Replace `BASE64_CREDENTIAL` with the actual base64 string generated in Step 2 **before running the script**.

This approach guarantees:
- All pre-existing MCP servers remain untouched.
- If `atlassian-rovo-mcp` already exists, it is updated (credential rotation).
- The JSON structure and formatting are preserved.

### Step 5 — Add .mcp.json to .gitignore

Check if `.gitignore` exists and if `.mcp.json` is already listed. If not, append it:

```bash
grep -q "\.mcp\.json" .gitignore 2>/dev/null || echo ".mcp.json" >> .gitignore
```

This prevents the API token from being accidentally committed to the repository.

### Step 6 — Validate JSON

```bash
cat .mcp.json | python3 -m json.tool > /dev/null && echo "JSON valid"
```

If invalid, show the file content and error to the user and stop.

### Step 7 — Confirm and instruct

Print a success summary:

```
✅ Atlassian MCP configured at .mcp.json (current project directory)

Authentication: Basic auth (email:api_token base64-encoded)
Endpoint: https://mcp.atlassian.com/v1/mcp

⚠️  .mcp.json was added to .gitignore to protect your API token.

Next steps:
1. Restart Copilot CLI (close and reopen terminal or restart the CLI session).
2. You can now ask Copilot CLI to interact with Jira, Confluence, and other Atlassian products.

Example prompts after restart:
  - "list my open Jira issues"
  - "show the Confluence page for project X"
  - "create a Jira ticket for bug Y"
```

---

## .mcp.json Reference

```json
{
  "mcpServers": {
    "atlassian-rovo-mcp": {
      "url": "https://mcp.atlassian.com/v1/mcp",
      "headers": {
        "Authorization": "Basic <base64(email:api_token)>"
      }
    }
  }
}
```

- `url` — Atlassian Remote MCP server endpoint (fixed, no customization needed).
- `Authorization: Basic` — uses base64-encoded `email:api_token` as per Atlassian's Personal API Token spec.
- The file lives in the **project directory** (not `~/.config/github-copilot/`), scoped per project.

---

## Security Notes

| Concern | Mitigation |
|---|---|
| Token in plaintext | `.mcp.json` is added to `.gitignore` automatically |
| Token rotation | Re-run this skill with a new token to update the credential |
| Shared machines | Use a service account API key (Bearer token) instead of personal tokens |
| Least privilege | Create the API token with only the scopes needed (Jira read, Confluence read, etc.) |

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `401 Unauthorized` | Check email and API token are correct; re-run skill to regenerate base64 |
| `403 Forbidden` | Token may lack required scopes — regenerate at https://id.atlassian.com/manage-profile/security/api-tokens |
| MCP server not responding | Verify network access to `https://mcp.atlassian.com` |
| JSON parse error in .mcp.json | Validate with `cat .mcp.json \| python3 -m json.tool` |
| Token accidentally committed | Revoke the token immediately at Atlassian, create a new one, and re-run this skill |
