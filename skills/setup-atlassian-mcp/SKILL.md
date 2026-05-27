---
name: setup-atlassian-mcp
description: >
  Configures the Atlassian MCP server (Rovo) using Personal API Token (Basic auth).
  Use when the user says "setup atlassian mcp", "add atlassian mcp", "configurar atlassian mcp",
  "adicionar atlassian ao mcp", or wants Claude Code to interact with Jira/Confluence via Atlassian Rovo.
argument-hint: "No arguments required — the skill will prompt for scope, storage mode, email, and API token."
---

# Skill: setup-atlassian-mcp

Configures the Atlassian MCP integration (Rovo) via the Remote MCP server at `https://mcp.atlassian.com/v1/mcp`.

---

## Instructions

### Step 0 — Detectar credenciais já configuradas

Antes de qualquer pergunta, verifique se `ATLASSIAN_MCP_CREDENTIALS` já está definida no shell do usuário:

```bash
grep -h "ATLASSIAN_MCP_CREDENTIALS" ~/.zshrc ~/.bashrc 2>/dev/null | head -1
```

- **Se encontrar a variável:** defina `CREDENTIALS_ALREADY_SET=true` e `STORAGE=envvar`. Informe o usuário com uma única linha:
  > `ATLASSIAN_MCP_CREDENTIALS` já encontrada no shell — pulando coleta de e-mail e token.
  
  Pule diretamente para o **Step 1** (apenas pergunte o escopo) e depois vá para o **Step 5**.

- **Se não encontrar:** defina `CREDENTIALS_ALREADY_SET=false` e continue com os steps na ordem normal.

### Step 1 — Perguntar escopo

Pergunte ao usuário onde o MCP deve ser registrado:

- **Global** → `~/.claude/mcp.json` (disponível em todos os projetos)
- **Local** → `./.mcp.json` (apenas no projeto atual)

Armazene a escolha como `SCOPE` (`global` ou `local`) e defina `MCP_FILE` como:
- `global` → `~/.claude/mcp.json`
- `local` → `./.mcp.json`

### Step 2 — Perguntar modo de armazenamento do token *(pular se `CREDENTIALS_ALREADY_SET=true`)*

Pergunte ao usuário como deseja armazenar as credenciais:

- **Env var** *(recomendado)* → exporta `ATLASSIAN_MCP_CREDENTIALS` no `~/.zshrc` e `~/.bashrc`; o `.mcp.json` referencia `${ATLASSIAN_MCP_CREDENTIALS}`. Mais seguro: token não fica hardcoded no arquivo.
- **Direto no arquivo** → escreve o valor base64 diretamente no `.mcp.json`. Mais simples, mas requer `.gitignore` se for local.

Armazene a escolha como `STORAGE` (`envvar` ou `direct`).

### Step 3 — Coletar credenciais *(pular se `CREDENTIALS_ALREADY_SET=true`)*

**Pergunta 1 — E-mail:**
Pergunte o e-mail da conta Atlassian. Armazene como `ATLASSIAN_EMAIL`.

**Pergunta 2 — API Token:**
Pergunte o Personal API Token. Inclua o link para criar um com configurações máximas:

> Ainda não tem um? Crie aqui (validade máxima + todos os escopos):
> https://id.atlassian.com/manage-profile/security/api-tokens?autofillToken&expiryDays=max&appId=mcp&selectedScopes=all

Armazene como `ATLASSIAN_API_TOKEN`.

**IMPORTANTE:** Nunca exibir o token ou o base64 na resposta final.

### Step 4 — Gerar o base64 *(pular se `CREDENTIALS_ALREADY_SET=true`)*

```bash
echo -n "ATLASSIAN_EMAIL:ATLASSIAN_API_TOKEN" | base64 | tr -d '\n'
```

Armazene o resultado como `BASE64_CREDENTIAL`.

### Step 5 — Criar ou atualizar o MCP_FILE

Verifique se o arquivo existe:

```bash
ls MCP_FILE 2>/dev/null && echo "exists" || echo "not found"
```

**Se não existir:** crie com o conteúdo abaixo.
**Se já existir:** faça merge apenas da entrada `atlassian-rovo-mcp` usando Python, preservando todos os outros servidores.

#### Conteúdo do `.mcp.json` — modo `envvar`

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

#### Conteúdo do `.mcp.json` — modo `direct`

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

#### Script de merge (quando arquivo já existir)

```bash
python3 - << 'PYEOF'
import json

MCP_FILE = "PLACEHOLDER_MCP_FILE"
HEADER_VALUE = "PLACEHOLDER_HEADER_VALUE"

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

Substitua `PLACEHOLDER_MCP_FILE` e `PLACEHOLDER_HEADER_VALUE` pelos valores reais antes de executar.

### Step 6 — Registrar env var (apenas modo `envvar` e `CREDENTIALS_ALREADY_SET=false`)

Execute para registrar a variável em ambos os shells:

```bash
echo "export ATLASSIAN_MCP_CREDENTIALS='Basic BASE64_CREDENTIAL'" >> ~/.zshrc
echo "export ATLASSIAN_MCP_CREDENTIALS='Basic BASE64_CREDENTIAL'" >> ~/.bashrc
source ~/.zshrc 2>/dev/null || true
```

### Step 7 — Proteção do arquivo (apenas escopo `local` + modo `direct`)

```bash
grep -q "\.mcp\.json" .gitignore 2>/dev/null || echo ".mcp.json" >> .gitignore
```

Se o escopo for `global`, não há necessidade de `.gitignore`.
Se o modo for `envvar`, o arquivo não contém segredos — `.gitignore` é opcional.

### Step 8 — Validar JSON

```bash
cat MCP_FILE | python3 -m json.tool > /dev/null && echo "JSON valid"
```

Se inválido, exibir o erro e parar.

### Step 9 — Mensagem final (única saída para o usuário)

Exibir apenas:

```
.mcp.json configurado em MCP_FILE

Execute para autenticar (recarregue o terminal após):

  source ~/.zshrc
```

Se modo `direct` + escopo `local`:

```
.mcp.json configurado em ./.mcp.json
.mcp.json adicionado ao .gitignore para proteger suas credenciais.

Reinicie o Claude Code para ativar o servidor Atlassian.
```

---

## Guardrails

- Nunca exibir o token, o e-mail ou o base64 na resposta final
- Fazer merge se o arquivo já existir — nunca sobrescrever
- Se escopo global e arquivo não existir, criar `~/.claude/` se necessário antes de criar o arquivo
- Modo `envvar` é sempre preferível por não expor segredos no arquivo

---

## Referência rápida

| Escopo | Arquivo |
|---|---|
| Global | `~/.claude/mcp.json` |
| Local | `./.mcp.json` |

| Modo | Header no JSON | Segredo em |
|---|---|---|
| envvar | `${ATLASSIAN_MCP_CREDENTIALS}` | `~/.zshrc` / `~/.bashrc` |
| direct | `Basic <base64>` | `.mcp.json` (→ `.gitignore`) |
