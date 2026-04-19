# AI Showcase Skills

## Criando uma startup o mais rapido possivel com QUALIDADE elevada  usando IA

## Observacao: 
Para executar as skills:

- Skills com Github-Copilot sao adicionados em `.github/skills` com uma pasta com o nome da skill. Ex `.github/skills/create-makefile/SKILL.md`. Para executar `/create-makefile`
- Skills padroes podem ser copiadas para `~/.copilot/skills`, como no `put-or-update-copilot-skills.sh`
### GPT Codex
- Skills com GPT-Codex sao adicionados no root em `skills` com uma pasta com o nome da skill. Ex `skills/create-makefile/SKILL.md`. Para executar `$create-makefile`

### Claude Code
- Skills com Claude-Code ... `in_progress...`

---

## Skills Disponíveis `Principais para um comeco rapido`

| Skill | Base | Descrição breve |
|---|---|
| `scaffold-monorepo-multimodulos-kotlin-speckit` | YES | Cria um ecosistema multi monorepo Kotlin Spring Boot com framework SDD speckit.|
| `scaffold-monorepo-multimodulos-kotlin` | YES | Cria um ecosistema multi monorepo Kotlin Spring Boot.|

---

## Quick Start 

### 1. Copie os arquivos para o novo projeto

```sh
sh put-or-update-global-skills.sh
```

### 2. No VSCode, Cursor, Claude-Cli, execute a skill
Criando o monorepo backend kotlin
```
/scaffold-monorepo-multimodulos-kotlin-speckit
```
Adicionando frontend nextjs (web e mobile)
```
/scaffold-monorepo-multimodulos-add-nextjs
```
