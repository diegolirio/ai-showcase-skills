---
name: scaffold-monorepo-multimodulos-kotlin
description: >-
  Scaffolds or extends a Gradle Kotlin DSL monorepo with Kotlin, Java toolchain,
  Spring Boot apps ({group}-api) and Kotlin libraries ({group}-core), plus an
  optional root-level shared-libs module. Use when the user asks to create a
  monorepo, add a domain module (e.g. running/running-api, running-core), or
  mentions multimodule Kotlin, Spring Boot, Gradle version catalog, modulo-raiz,
  modulo-app-spring boot, or modulo-library.
---

# Scaffold monorepo multimodulos (Kotlin)

## Variaveis (substituir a partir do pedido)

| Placeholder | Descricao | Exemplo |
|-------------|-----------|---------|
| `{MONOREPO}` | `rootProject.name` / pasta do repo | `healthy` |
| `{GROUP}` | Slug do dominio (minusculas, um segmento) | `running` |
| `{GROUP_API}` | App Spring Boot | `{GROUP}-api` -> `running-api` |
| `{GROUP_CORE}` | Biblioteca Kotlin | `{GROUP}-core` -> `running-core` |
| `{BASE_PKG}` | Pacote base do dominio | `com.{empresa}.{GROUP}` (ou `group` Gradle existente, ex.: `com.healthy`) |
| `{BASE_PKG_ROOT}` | Pacote base da raiz, para `shared-libs` | `com.{empresa}` |

Regra fixa de nomes: **`{GROUP}-api`** e **`{GROUP}-core`** (kebab-case nos paths Gradle).

## Arvore por dominio (padrao principal)

```text
{MONOREPO}/
└── {GROUP}/
    ├── {GROUP}-api/       # Spring Boot - depende de :{GROUP}:{GROUP}-core
    └── {GROUP}-core/      # Kotlin JVM library
```

`settings.gradle.kts`: `include("{GROUP}:{GROUP}-api", "{GROUP}:{GROUP}-core")`.

## Modulo raiz - shared-libs

Para codigo compartilhado entre dominios, usar sempre o modulo raiz **`shared-libs/`** no mesmo nivel dos dominios, nunca dentro de um dominio interno:

```text
{MONOREPO}/
├── {GROUP}/
│   ├── {GROUP}-api/
│   └── {GROUP}-core/
└── shared-libs/           # Kotlin JVM library (sem Spring Boot)
```

`include("shared-libs")`. Caminho fisico: `shared-libs/`.

Observacoes:
- **Sem** plugin Spring Boot; apenas `kotlin("jvm")`.
- Pacote base sugerido: `{BASE_PKG_ROOT}.sharedlibs`.
- `*-api` de outros dominios consomem via `implementation(project(":shared-libs"))`.
- `shared-libs` e root-only: nunca criar dentro de `properties/` ou de qualquer outro dominio.

## Convencoes tecnicas

- **Build:** Gradle **Kotlin DSL** (`settings.gradle.kts`, `build.gradle.kts`), **version catalog** `gradle/libs.versions.toml`.
- **Plugins raiz:** `kotlin-jvm`, `kotlin-spring`, `spring-boot`, `dependency-management` com `apply false`; **Foojay** em `settings` se o projeto ja usar (`org.gradle.toolchains.foojay-resolver-convention`).
- **`*-api`:** `kotlin("jvm")`, `kotlin("plugin.spring")`, `org.springframework.boot`, `io.spring.dependency-management`; `implementation(project(":{GROUP}:{GROUP}-core"))`, `spring-boot-starter-web`; testes com `spring-boot-starter-test` + JUnit Platform se o repo ja padronizar assim.
- **`*-core`:** so `org.jetbrains.kotlin.jvm`.
- **`shared-libs`:** so `org.jetbrains.kotlin.jvm`, sem Spring Boot.
- **Pacotes:** `{BASE_PKG}.api` na app (`*Application`, controllers), `{BASE_PKG}.core` na library; `application.yml` com `spring.application.name: {GROUP}-api`.
- **Java / Kotlin:** alinhar **Java toolchain**, **Kotlin `jvmToolchain`**, e **`KotlinCompile` `jvmTarget`** ao mesmo nivel (ex.: 25). **Kotlin que gera bytecode JVM 25** requer versao compativel do compilador (ver [reference.md](reference.md)).
- **Portas:** varias APIs locais -> portas distintas por `server.port` em cada `application.yml`.

## Fluxo do agente

1. Extrair `{MONOREPO}`, `{GROUP}` e `{BASE_PKG}` (ou derivar de `subprojects { group = "..." }` existente).
2. Se o repositorio **ja existir**, copiar padroes do `settings.gradle.kts`, catalog e `build.gradle.kts` raiz; so **adicionar** `include` e modulos novos.
3. Se for **greenfield**, criar estrutura minima: wrapper Gradle, catalog, raiz, modulos, classes placeholder e `build` passando.
4. `shared-libs` deve ser criado somente no root do monorepo, nunca dentro de um dominio interno.

## Exemplo de pedido

**Input:** criar dominio `running` com API e core.

**Resultado:** pastas `running/running-api`, `running/running-core`; projetos `:running:running-api`, `:running:running-core`; dependencia da API no core.

## Referencia

Versoes, matriz Boot/Java/Kotlin e detalhes extras: [reference.md](reference.md).
