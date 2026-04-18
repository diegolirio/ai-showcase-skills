---
name: scaffold-monorepo-multimodulos-kotlin
description: >-
  Scaffolds or extends a Gradle Kotlin DSL monorepo with Kotlin, Java toolchain,
  Spring Boot apps ({group}-api) and Kotlin libraries ({group}-core), plus optional
  nested groups (e.g. shared-libs/auth). Use when the user asks to create a monorepo,
  add a domain module (e.g. running/running-api, running-core), or mentions
  multimodule Kotlin, Spring Boot, Gradle version catalog, módulo-raiz,
  modulo-app-spring boot, or modulo-library.
---

# Scaffold monorepo multimódulos (Kotlin)

## Variáveis (substituir a partir do pedido)

| Placeholder | Descrição | Exemplo |
|-------------|-----------|---------|
| `{MONOREPO}` | `rootProject.name` / pasta do repo | `healthy` |
| `{GROUP}` | Slug do domínio (minúsculas, um segmento) | `running` |
| `{GROUP_API}` | App Spring Boot | `{GROUP}-api` → `running-api` |
| `{GROUP_CORE}` | Biblioteca Kotlin | `{GROUP}-core` → `running-core` |
| `{BASE_PKG}` | Pacote base | `com.{empresa}.{GROUP}` — se `empresa` não vier, usar o `group` do Gradle do projeto (ex.: `com.healthy`) |

Regra fixa de nomes: **`{GROUP}-api`** e **`{GROUP}-core`** (kebab-case nos paths Gradle).

## Árvore por domínio (padrão principal)

```text
{MONOREPO}/
└── {GROUP}/
    ├── {GROUP}-api/       # Spring Boot — depende de :{GROUP}:{GROUP}-core
    └── {GROUP}-core/      # Kotlin JVM library
```

`settings.gradle.kts`: `include("{GROUP}:{GROUP}-api", "{GROUP}:{GROUP}-core")`.

## Grupos aninhados — bibliotecas compartilhadas (só libraries)

Para libs transversais (reutilizadas por vários domínios), usar a pasta raiz **`shared-libs/`**:

```text
shared-libs/
├── {LIB_A}/               # ex.: auth (Kotlin lib)
└── {LIB_B}/               # ex.: events (Kotlin lib)
```

`include("shared-libs:{LIB_A}", "shared-libs:{LIB_B}")`. Paths físicos: `shared-libs/{LIB_A}/`.

Observações:
- **Sem** plugin Spring Boot; apenas `kotlin("jvm")`.
- Pacote base sugerido: `{BASE_PKG_ROOT}.sharedlibs.{LIB}` (nomes de pacote **não aceitam hífen**, por isso `sharedlibs`).
- `*-api` de outros domínios consomem via `implementation(project(":shared-libs:{LIB}"))`.

## Convenções técnicas

- **Build:** Gradle **Kotlin DSL** (`settings.gradle.kts`, `build.gradle.kts`), **version catalog** `gradle/libs.versions.toml`.
- **Plugins raiz:** `kotlin-jvm`, `kotlin-spring`, `spring-boot`, `dependency-management` com `apply false`; **Foojay** em `settings` se o projeto já usar (`org.gradle.toolchains.foojay-resolver-convention`).
- **`*-api`:** `kotlin("jvm")`, `kotlin("plugin.spring")`, `org.springframework.boot`, `io.spring.dependency-management`; `implementation(project(":{GROUP}:{GROUP}-core"))`, `spring-boot-starter-web`; testes com `spring-boot-starter-test` + JUnit Platform se o repo já padronizar assim.
- **`*-core`:** só `org.jetbrains.kotlin.jvm`.
- **Pacotes:** `{BASE_PKG}.api` na app (`*Application`, controllers), `{BASE_PKG}.core` na library; `application.yml` com `spring.application.name: {GROUP}-api`.
- **Java / Kotlin:** alinhar **Java toolchain**, **Kotlin `jvmToolchain`**, e **`KotlinCompile` `jvmTarget`** ao mesmo nível (ex.: 25). **Kotlin que gera bytecode JVM 25** requer versão compatível do compilador (ver [reference.md](reference.md)).
- **Portas:** várias APIs locais → portas distintas por `server.port` em cada `application.yml`.

## Fluxo do agente

1. Extrair `{MONOREPO}`, `{GROUP}` e `{BASE_PKG}` (ou derivar de `subprojects { group = "..." }` existente).
2. Se o repositório **já existir**, copiar padrões do `settings.gradle.kts`, catalog e `build.gradle.kts` raiz; só **adicionar** `include` e módulos novos.
3. Se for **greenfield**, criar estrutura mínima: wrapper Gradle, catalog, raiz, módulos, classes placeholder e `build` passando.
4. Não aplicar Spring Boot em módulos que forem **apenas library**.

## Exemplo de pedido

**Input:** criar domínio `running` com API e core.

**Resultado:** pastas `running/running-api`, `running/running-core`; projetos `:running:running-api`, `:running:running-core`; dependência da API no core.

## Referência

Versões, matriz Boot/Java/Kotlin e detalhes extras: [reference.md](reference.md).
