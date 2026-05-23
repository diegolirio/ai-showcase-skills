---
name: setup-atlassian-mcp-local-env
description: >
  Configures the Atlassian MCP server (Rovo) in the current project using Personal API Token
  stored in an environment variable. Always uses local scope (./.mcp.json) and envvar storage —
  no prompts for scope or storage mode. Use when the user says "setup atlassian mcp local",
  "setup atlassian mcp local env", "configurar atlassian mcp local", or wants a project-scoped
  Atlassian MCP with credentials in shell env vars.
argument-hint: "No arguments required — the skill will prompt for email and API token only."
---

# Skill: setup-atlassian-mcp-local-env

Configures the Atlassian MCP integration (Rovo) via the Remote MCP server at `https://mcp.atlassian.com/v1/mcp`.

**Defaults (fixed — do not ask):**
- **Scope:** local → `./.mcp.json`
- **Storage:** envvar → `ATLASSIAN_MCP_CREDENTIALS` in `~/.zshrc` / `~/.bashrc`

---

## Instructions

### Step 1 — Coletar credenciais

**Pergunta 1 — E-mail:**
Pergunte o e-mail da conta Atlassian. Armazene como `ATLASSIAN_EMAIL`.

**Pergunta 2 — API Token:**
Pergunte o Personal API Token. Inclua o link para criar um com configurações máximas:

> Ainda não tem um? Crie aqui (validade máxima + todos os escopos):
> https://id.atlassian.com/manage-profile/security/api-tokens?autofillToken&expiryDays=max&appId=mcp&selectedScopes=all

Armazene como `ATLASSIAN_API_TOKEN`.

**IMPORTANTE:** Nunca exibir o token ou o base64 na resposta final.

### Step 2 — Gerar o base64

```bash
echo -n "ATLASSIAN_EMAIL:ATLASSIAN_API_TOKEN" | base64 | tr -d '\n'
```

Armazene o resultado como `BASE64_CREDENTIAL`.

### Step 3 — Criar ou atualizar `./.mcp.json`

Verifique se o arquivo existe:

```bash
ls ./.mcp.json 2>/dev/null && echo "exists" || echo "not found"
```

**Se não existir:** crie com o conteúdo abaixo.
**Se já existir:** faça merge apenas da entrada `atlassian-rovo-mcp` usando Python, preservando todos os outros servidores.

#### Conteúdo do `./.mcp.json`

```json
{
  "mcpServers": {
    "atlassian-rovo-mcp": {
      "url": "https://mcp.atlassian.com/v1/mcp",
      "headers": {
        "Authorization": "${ATLASSIAN_MCP_CREDENTIALS}"
      }
    }
  }
}
```

#### Script de merge (quando arquivo já existir)

```bash
python3 - << 'PYEOF'
import json

MCP_FILE = "./.mcp.json"
HEADER_VALUE = "${ATLASSIAN_MCP_CREDENTIALS}"

with open(MCP_FILE, 'r') as f:
    config = json.load(f)

if 'mcpServers' not in config:
    config['mcpServers'] = {}

config['mcpServers']['atlassian-rovo-mcp'] = {
    "url": "https://mcp.atlassian.com/v1/mcp",
    "headers": {
        "Authorization": HEADER_VALUE
    }
}

with open(MCP_FILE, 'w') as f:
    json.dump(config, f, indent=2)

print("atlassian-rovo-mcp merged. Servers:", list(config['mcpServers'].keys()))
PYEOF
```

### Step 4 — Registrar env var

Execute para registrar a variável em ambos os shells:

```bash
echo "export ATLASSIAN_MCP_CREDENTIALS='Basic BASE64_CREDENTIAL'" >> ~/.zshrc
echo "export ATLASSIAN_MCP_CREDENTIALS='Basic BASE64_CREDENTIAL'" >> ~/.bashrc
source ~/.zshrc 2>/dev/null || true
```

Substitua `BASE64_CREDENTIAL` pelo valor gerado no Step 2.

### Step 5 — Validar JSON

```bash
cat ./.mcp.json | python3 -m json.tool > /dev/null && echo "JSON valid"
```

Se inválido, exibir o erro e parar.

### Step 6 — Mensagem final (única saída para o usuário)

Exibir apenas:

```
.mcp.json configurado em ./.mcp.json

Execute para autenticar (recarregue o terminal após):

  source ~/.zshrc
```

---

## Guardrails

- Nunca exibir o token, o e-mail ou o base64 na resposta final
- Fazer merge se o arquivo já existir — nunca sobrescrever
- Não perguntar escopo nem modo de armazenamento — sempre local + envvar
- O `.mcp.json` não contém segredos — `.gitignore` não é necessário

---

## Referência rápida

| Item | Valor |
|---|---|
| Arquivo MCP | `./.mcp.json` |
| Env var | `ATLASSIAN_MCP_CREDENTIALS` |
| Header no JSON | `${ATLASSIAN_MCP_CREDENTIALS}` |
| Segredo em | `~/.zshrc` / `~/.bashrc` |
