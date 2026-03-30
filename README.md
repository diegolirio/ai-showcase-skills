# AI Showcase Skills

Observacao: 
- Skills com Github-Copilot sao adicionados em `.github/skills` com uma pasta com o nome da skill. Ex `.github/skills/create-makefile/SKILL.md`.
- Skills com GPT-Codex sao adicionados no root em `skills` com uma pasta com o nome da skill. Ex `skills/create-makefile/SKILL.md`.
- Skills com Claude-Code ... `in_progress...`

Projeto de referência para demonstrar como usar **GitHub Copilot Customization** (Instructions, Skills, Templates) em um monorepo Kotlin Spring Boot com CQRS + Clean Architecture.

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

O Copilot vai pedir 3 inputs e criar toda a estrutura automaticamente:

| Input | Exemplo | Descrição |
|-------|---------|-----------|
| `project-name` | `my-awesome-service` | Nome do projeto (kebab-case) |
| `group` | `ia.lirio` | Grupo Gradle |
| `base-package` | `ia.lirio.my.awesome.service` | Pacote base Kotlin |

---

## Estrutura do `.github/`

```
.github/
├── instructions/                        # Regras passivas — aplicadas automaticamente
│   ├── gradle-kotlin-monorepo           # Convenções de build Gradle monorepo
│   ├── spring-boot-api-module           # Padrões do módulo API (controllers, DTOs)
│   ├── core-cqrs-clean-architecture     # CQRS + Clean Arch no módulo core
│   └── kotlin-spring-boot-conventions   # Idiomas Kotlin + Spring Boot
│
└── skills/
    └── scaffold-kotlin-monorepo/        # Workflow ativo — invocado sob demanda
        ├── SKILL.md                     # Procedimento passo a passo
        └── references/                  # Assets da skill
            ├── root-build.gradle.kts.template
            ├── api-build.gradle.kts.template
            ├── core-build.gradle.kts.template
            └── instructions/            # Cópia das instructions para novos projetos
```

---

## Como os primitivos se complementam neste projeto

### Tabela Comparativa

| | **Prompt** (`.prompt.md`) | **Instruction** (`.instructions.md`) | **Skill** (`SKILL.md`) | **Agent** (`.agent.md`) |
|---|---|---|---|---|
| **O que é** | Template de tarefa única e focada | Diretrizes/regras carregadas contextualmente | Workflow multi-etapas com assets bundled (scripts, templates, docs) | Persona customizada com restrição de ferramentas |
| **Quando usar** | Gerar testes, criar READMEs, tarefas pontuais | Padrões de código, convenções de projeto, regras por tipo de arquivo | Processos complexos com scripts e recursos auxiliares | Orquestrar workflows com isolamento de contexto e controle de tools |
| **Local** | `.github/prompts/` | `.github/instructions/` | `.github/skills/<name>/` | `.github/agents/` |
| **Como invocar** | `/` no chat ou `Chat: Run Prompt...` | Automático via `applyTo` ou `description` | `/` no chat (igual a prompts) | Seletor de agente no chat ou como subagent |
| **Pode ter ferramentas** | Sim (opcional) | Não | Não (usa as do agente que o invoca) | Sim — principal diferencial |
| **Assets bundled** | Não | Não | Sim (scripts, templates, referências) | Não |
| **Ativação** | Sob demanda (manual) | Automática (por glob ou relevância) | Sob demanda (manual) | Sob demanda (manual ou subagent) |
| **Escopo típico** | Uma tarefa | Todo o projeto | Um workflow completo | Um papel/persona |

### Como se complementam neste projeto

```
┌─────────────────────────────────────────────────────────────────┐
│                    /scaffold-kotlin-monorepo                    │
│                          (SKILL)                                │
│                                                                 │
│  Cria o projeto completo:                                       │
│  ┌───────────────────┐  ┌──────────────────┐  ┌─────────────┐  │
│  │ build.gradle.kts  │  │ Application.kt   │  │ Diretórios  │  │
│  │ settings.gradle   │  │ Testcontainers   │  │ api + core  │  │
│  │   (templates)     │  │   (inline)       │  │ (mkdir -p)  │  │
│  └───────────────────┘  └──────────────────┘  └─────────────┘  │
│                                                                 │
│  + Copia as INSTRUCTIONS para .github/instructions/             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       INSTRUCTIONS                              │
│               (ativadas automaticamente daqui em diante)        │
│                                                                 │
│  Editando **/build.gradle.kts ?                                 │
│    → gradle-kotlin-monorepo.instructions.md                     │
│                                                                 │
│  Editando **/*-api/src/**/*.kt ?                                │
│    → spring-boot-api-module.instructions.md                     │
│                                                                 │
│  Editando **/*-core/src/**/*.kt ?                               │
│    → core-cqrs-clean-architecture.instructions.md               │
│                                                                 │
│  Editando **/*.kt ?                                             │
│    → kotlin-spring-boot-conventions.instructions.md             │
└─────────────────────────────────────────────────────────────────┘
```

**Resumo:** A **Skill** configura o projeto uma vez. As **Instructions** guiam o Copilot para sempre durante o desenvolvimento.

### Regras de decisão rápida

| Precisa de... | Use |
|---|---|
| Regras que se aplicam **sempre** ao editar código | **Instruction** com `applyTo` |
| Executar um **processo de N passos** com templates | **Skill** |
| Uma **tarefa focada** com input do usuário | **Prompt** |
| Contexto isolado + restrição de ferramentas | **Agent** |

---

## Stack

| Tecnologia | Versão |
|---|---|
| Kotlin | 2.3.10 |
| Spring Boot | 4.0.5 |
| Java (toolchain) | 25 |
| Gradle | 9.4.1 |
| Oracle (Testcontainers) | `gvenzl/oracle-free:latest` |
| Flyway | via `flyway-database-oracle` |

