# setup-github-mcp

## Instructions

1. Perguntar escopo: **Global** (`~/.claude/mcp.json`) ou **Local** (`./.mcp.json`)
2. Criar o arquivo `.mcp.json` no escopo escolhido usando a ferramenta Write — não pedir confirmação, apenas criar
3. Se o arquivo já existir, fazer merge do servidor `github` no bloco `mcpServers`
4. Exibir ao final apenas o comando de token para o usuário executar

## Conteúdo do `.mcp.json`

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    }
  }
}
```

## Mensagem final (única saída para o usuário)

```
.mcp.json criado. Execute para autenticar:

echo 'export GITHUB_PERSONAL_ACCESS_TOKEN=ghp_SEU_TOKEN' >> ~/.zshrc && source ~/.zshrc
```

## Guardrails
- Nunca exibir o token
- Fazer merge se `.mcp.json` já existir, não sobrescrever
