---
name: setup-hostinger-mcp
description: >
  Configures the Hostinger MCP server using a Personal API Token.
  Use when the user says "setup hostinger mcp", "add hostinger mcp", "configurar hostinger mcp",
  "adicionar hostinger ao mcp", or wants Claude Code to manage VPS, sites, domains, and DNS
  via Hostinger API directly from the IDE.
argument-hint: "No arguments required — the skill will prompt for scope, storage mode, and API token."
---

# Skill: setup-hostinger-mcp

Configures the Hostinger MCP integration via `npx hostinger-api-mcp@latest` (stdio transport).

---

## Instructions

### Step 1 — Perguntar escopo

Pergunte ao usuário onde o MCP deve ser registrado:

- **Global** → `~/.claude/mcp.json` (disponível em todos os projetos)
- **Local** → `./.mcp.json` (apenas no projeto atual)

Armazene a escolha como `SCOPE` (`global` ou `local`) e defina `MCP_FILE` como:
- `global` → `~/.claude/mcp.json`
- `local` → `./.mcp.json`

### Step 2 — Perguntar modo de armazenamento do token

Pergunte ao usuário como deseja armazenar o token:

- **Env var** *(recomendado)* → exporta `HOSTINGER_API_TOKEN` no `~/.zshrc` e `~/.bashrc`; o `.mcp.json` referencia `${HOSTINGER_API_TOKEN}`. Mais seguro: token não fica hardcoded no arquivo.
- **Direto no arquivo** → escreve o valor do token diretamente no campo `API_TOKEN` do `.mcp.json`. Mais simples, mas requer `.gitignore` se for local.

Armazene a escolha como `STORAGE` (`envvar` ou `direct`).

### Step 3 — Coletar o token da API

**API Token:**
Pergunte o Personal API Token da Hostinger. Inclua o link para gerar um novo:

> Ainda não tem um? Gere aqui:
> https://hpanel.hostinger.com/api

Armazene como `HOSTINGER_API_TOKEN_VALUE`.

**IMPORTANTE:** Nunca exibir o token na resposta final.

### Step 4 — Criar ou atualizar o MCP_FILE

Verifique se o arquivo existe:

```bash
ls MCP_FILE 2>/dev/null && echo "exists" || echo "not found"
```

**Se não existir:** crie com o conteúdo abaixo.
**Se já existir:** faça merge apenas da entrada `hostinger-mcp` usando Python, preservando todos os outros servidores.

#### Conteúdo do arquivo — modo `envvar`

```json
{
  "mcpServers": {
    "hostinger-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["hostinger-api-mcp@latest"],
      "env": {
        "API_TOKEN": "${HOSTINGER_API_TOKEN}"
      }
    }
  }
}
```

#### Conteúdo do arquivo — modo `direct`

```json
{
  "mcpServers": {
    "hostinger-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["hostinger-api-mcp@latest"],
      "env": {
        "API_TOKEN": "HOSTINGER_API_TOKEN_VALUE"
      }
    }
  }
}
```

#### Script de merge (quando arquivo já existir)

```bash
python3 - << 'PYEOF'
import json

MCP_FILE = "PLACEHOLDER_MCP_FILE"
API_TOKEN_VALUE = "PLACEHOLDER_API_TOKEN_VALUE"

with open(MCP_FILE, 'r') as f:
    config = json.load(f)

# Suporte a ambos os formatos: mcpServers (global ~/.claude/mcp.json) e servers (local .mcp.json)
key = "mcpServers" if "mcpServers" in config else "servers"
if key not in config:
    config[key] = {}

config[key]['hostinger-mcp'] = {
    "type": "stdio",
    "command": "npx",
    "args": ["hostinger-api-mcp@latest"],
    "env": {
        "API_TOKEN": API_TOKEN_VALUE
    }
}

with open(MCP_FILE, 'w') as f:
    json.dump(config, f, indent=2)

print("hostinger-mcp merged. Servers:", list(config[key].keys()))
PYEOF
```

Substitua `PLACEHOLDER_MCP_FILE` e `PLACEHOLDER_API_TOKEN_VALUE` pelos valores reais antes de executar.

**Nota sobre formato de chave:**
- `~/.claude/mcp.json` usa `"mcpServers"`
- `./.mcp.json` (projeto) pode usar `"mcpServers"` ou `"servers"` — prefira `"mcpServers"` ao criar do zero

### Step 5 — Registrar env var (apenas modo `envvar`)

Execute para registrar a variável em ambos os shells:

```bash
echo "export HOSTINGER_API_TOKEN='HOSTINGER_API_TOKEN_VALUE'" >> ~/.zshrc
echo "export HOSTINGER_API_TOKEN='HOSTINGER_API_TOKEN_VALUE'" >> ~/.bashrc
source ~/.zshrc 2>/dev/null || true
```

### Step 6 — Proteção do arquivo (apenas escopo `local` + modo `direct`)

```bash
grep -q "\.mcp\.json" .gitignore 2>/dev/null || echo ".mcp.json" >> .gitignore
```

Se o escopo for `global`, não há necessidade de `.gitignore`.
Se o modo for `envvar`, o arquivo não contém segredos — `.gitignore` é opcional.

### Step 7 — Validar JSON

```bash
cat MCP_FILE | python3 -m json.tool > /dev/null && echo "JSON valid"
```

Se inválido, exibir o erro e parar.

### Step 8 — Mensagem final (única saída para o usuário)

**Modo `envvar`:**

```
.mcp.json configurado em MCP_FILE

Recarregue o terminal para ativar a variável de ambiente:

  source ~/.zshrc

Depois reinicie o Claude Code para ativar o servidor Hostinger.
```

**Modo `direct` + escopo `local`:**

```
.mcp.json configurado em ./.mcp.json
.mcp.json adicionado ao .gitignore para proteger suas credenciais.

Reinicie o Claude Code para ativar o servidor Hostinger.
```

---

## Guardrails

- Nunca exibir o token na resposta final
- Fazer merge se o arquivo já existir — nunca sobrescrever
- Se escopo global e arquivo não existir, criar `~/.claude/` se necessário antes de criar o arquivo
- Modo `envvar` é sempre preferível por não expor segredos no arquivo
- O campo correto para o token é `env.API_TOKEN` (não `env.HOSTINGER_API_TOKEN`)

---

## Referência rápida

| Escopo | Arquivo |
|---|---|
| Global | `~/.claude/mcp.json` |
| Local | `./.mcp.json` |

| Modo | Valor em `API_TOKEN` | Segredo em |
|---|---|---|
| envvar | `${HOSTINGER_API_TOKEN}` | `~/.zshrc` / `~/.bashrc` |
| direct | `<token literal>` | `.mcp.json` (→ `.gitignore`) |

## Exemplos de uso natural

- "setup hostinger mcp"
- "configurar hostinger mcp"
- "quero gerenciar meu VPS da Hostinger pelo Claude"
- "adicionar hostinger ao mcp"
- "conectar Claude ao painel da Hostinger"
