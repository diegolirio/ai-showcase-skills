---
name: scaffold-monorepo-multimodulos-kotlin-speckit
description: >-
  Scaffolds or extends a Gradle Kotlin DSL monorepo with Kotlin, Java toolchain,
  Spring Boot apps ({group}-api) and Kotlin libraries ({group}-core), plus optional
  nested shared libraries (shared-libs/{lib}), AND sets up a Spec-Driven Development
  layout (speckit) under specs/. Use when the user asks to create a monorepo with
  specs, add a domain module with speckit, or mentions spec-driven development,
  speckit, constitution, feature spec/plan/tasks alongside multimodule Kotlin /
  Spring Boot / Gradle version catalog.
---

# Scaffold monorepo multimódulos (Kotlin) + Speckit

Extensão da skill [`scaffold-monorepo-multimodulos-kotlin`](../scaffold-monorepo-multimodulos-kotlin/SKILL.md):
mesma estrutura Gradle/Kotlin/Spring Boot **mais** a estrutura de
**Spec-Driven Development** em `specs/`.

## Variáveis (substituir a partir do pedido)

| Placeholder | Descrição | Exemplo |
|-------------|-----------|---------|
| `{MONOREPO}` | `rootProject.name` / pasta do repo | `healthy` |
| `{GROUP}` | Slug do domínio (minúsculas, um segmento) | `running` |
| `{GROUP_API}` | App Spring Boot | `{GROUP}-api` → `running-api` |
| `{GROUP_CORE}` | Biblioteca Kotlin | `{GROUP}-core` → `running-core` |
| `{BASE_PKG}` | Pacote base | `com.{empresa}.{GROUP}` (ou `group` Gradle existente, ex.: `com.healthy`) |
| `{LIB}` | Biblioteca compartilhada | `auth`, `events` |
| `{NNN}` | Número da feature, 3 dígitos | `001` |
| `{SLUG}` | Slug kebab-case da feature | `consultar-alimentos` |

Regra fixa: **`{GROUP}-api`**, **`{GROUP}-core`**, **`shared-libs/{LIB}`**.

## Estrutura Gradle (inalterada)

```text
{MONOREPO}/
├── {GROUP}/
│   ├── {GROUP}-api/            # Spring Boot
│   └── {GROUP}-core/           # Kotlin JVM library
└── shared-libs/
    └── {LIB}/                  # Kotlin JVM library (sem Spring Boot)
```

`settings.gradle.kts`:
```
include("{GROUP}:{GROUP}-api", "{GROUP}:{GROUP}-core", "shared-libs:{LIB}")
```

Convenções técnicas e versões (Kotlin 2.3.x, Spring Boot 4.x, Java 25) seguem
[reference.md](reference.md).

## Estrutura Speckit (`specs/`)

Criar na raiz do monorepo:

```text
specs/
├── README.md                   # como usar speckit + mapeamento spec → módulos
├── constitution.md             # princípios globais do monorepo
├── _templates/
│   ├── feature-spec.md
│   ├── feature-plan.md
│   └── feature-tasks.md
├── {GROUP}/                    # uma pasta por domínio
│   └── README.md               # contexto do domínio + índice de features
└── shared-libs/
    ├── README.md
    └── {LIB}/README.md         # uma subpasta por lib compartilhada
```

**Conteúdo compartilhado** (real): `README.md`, `constitution.md`, `_templates/*`.
**Por módulo** (genérico): apenas um `README.md` com módulos Gradle, pacotes,
porta local, schema "dono" e **placeholder** de “Índice de features”.

## Features (uma pasta por feature)

Cada nova feature vive em:

```text
specs/{GROUP}/{NNN}-{SLUG}/
├── spec.md     # o "o quê"  (negócio, contratos, critérios de aceitação)
├── plan.md     # o "como"   (módulos, libs, DB, testes, rollout)
└── tasks.md    # checklist executável pelo agente
```

Para libs compartilhadas: `specs/shared-libs/{LIB}/{NNN}-{SLUG}/`.
Para features transversais sem dono natural: `specs/_cross/{NNN}-{SLUG}/`.

Criar copiando os templates:
```
cp -r specs/_templates specs/{GROUP}/{NNN}-{SLUG}
# renomear feature-spec.md → spec.md, etc.
```

## Mapeamento spec → código

Incluir sempre no topo da `spec.md`:

```markdown
## Escopo técnico
- Projetos Gradle: `:{GROUP}:{GROUP}-api`, `:{GROUP}:{GROUP}-core`
- Pacotes: `{BASE_PKG}.api.{feature}`, `{BASE_PKG}.core.{feature}`
- Shared libs usadas: `:shared-libs:{LIB?}`
```

`plan.md` declara **impactos cruzados** (ex.: publicar evento em
`:shared-libs:events`) sem mover a feature de domínio.

## Constitution (conteúdo mínimo)

Arquivo `specs/constitution.md` com seções:

1. **Arquitetura** — `*-api` / `*-core`, regras de dependência, `shared-libs/`.
2. **Linguagem e plataforma** — Kotlin, JVM target, Spring Boot, Jakarta EE.
3. **Convenções de código** — pacotes, DTOs, exceções de domínio.
4. **Runtime** — `spring.application.name`, portas locais, env vars.
5. **Persistência** — schema per service, migrations, nenhum acesso cruzado.
6. **Testes** — JUnit Platform, slice tests, critérios de aceitação com teste.
7. **Observabilidade** — logs, métricas, traces.
8. **Speckit** — toda mudança de comportamento começa em `specs/`.
9. **Processo** — PR referencia a pasta da feature; spec atualizada antes/junto do código.

## Fluxo do agente

1. Rodar/estender a skill base `scaffold-monorepo-multimodulos-kotlin`
   (Gradle, Kotlin, Spring Boot, `*-api`/`*-core`, `shared-libs/`).
2. Se `specs/` **não existir**:
   - Criar `specs/README.md`, `specs/constitution.md`, `specs/_templates/*`.
   - Criar `specs/{GROUP}/README.md` para cada domínio existente.
   - Criar `specs/shared-libs/README.md` + `specs/shared-libs/{LIB}/README.md`
     para cada lib compartilhada.
3. Se `specs/` **já existir**:
   - Não sobrescrever constitution nem templates.
   - Adicionar apenas `specs/{GROUP_NOVO}/README.md` (ou
     `specs/shared-libs/{LIB_NOVA}/README.md`) quando um novo módulo é criado.
4. **Não** criar `spec.md`/`plan.md`/`tasks.md` automaticamente: features são
   escritas a partir de um pedido de usuário, usando `_templates/`.
5. Ao adicionar um módulo Gradle novo, **sempre** criar a pasta `specs/` correspondente.

## Exemplo de pedido

**Input:** criar domínio `running` com API e core, com speckit.

**Resultado:**
- Pastas Gradle `running/running-api`, `running/running-core`; includes e
  dependências conforme skill base.
- Pasta `specs/running/README.md` apontando para `:running:running-api` e
  `:running:running-core` (sem features).
- Se `specs/constitution.md` / `specs/_templates/` ainda não existirem, criar.

## Referência

Matriz de versões, paths Gradle e detalhes de IDE: [reference.md](reference.md).
