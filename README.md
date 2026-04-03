# AI Showcase Skills


## Observacao: 
### Copilot
- Skills com Github-Copilot sao adicionados em `.github/skills` com uma pasta com o nome da skill. Ex `.github/skills/create-makefile/SKILL.md`. Para executar `/create-makefile`
- Skills padroes podem ser copiadas para `~/.copilot/skills`, como no `put-or-update-skills-copilot.sh`
### GPT Codex
- Skills com GPT-Codex sao adicionados no root em `skills` com uma pasta com o nome da skill. Ex `skills/create-makefile/SKILL.md`. Para executar `$create-makefile`

### Claude Code
- Skills com Claude-Code ... `in_progress...`


Projeto de referência para demonstrar como usar **GitHub Copilot Customization** (Instructions, Skills, Templates) em um monorepo Kotlin Spring Boot com CQRS + Clean Architecture.

---

## Skills Disponíveis

| Skill | Descrição breve |
|---|---|
| `scaffold-kotlin-monorepo` | Cria um monorepo Kotlin Spring Boot (api + core) com estrutura CQRS/Clean Architecture, Gradle, Application e instruções base. |
| `setup-test-integration` | Configura base reutilizável de testes de integração com Testcontainers Oracle, Flyway no core e targets de teste no Makefile. |

---

## Quick Start — Novo Projeto

### 1. Copie os arquivos para o novo projeto

```sh
# Copia instructions + skill para o novo projeto
cp -r .github/ /caminho/do/novo-projeto/.github/
```

### 2. No VS Code, execute a skill

Abra o **novo projeto** no VS Code e no chat do Copilot digite:

```
/scaffold-kotlin-monorepo
```
