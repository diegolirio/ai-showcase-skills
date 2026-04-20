---
name: scaffold-monorepo-multimodulos-kotlin-speckit
description: >-
  Scaffolds or extends a Gradle Kotlin DSL monorepo with Kotlin, Java toolchain,
  Spring Boot apps ({group}-api) and Kotlin libraries ({group}-core), plus an
  optional root-level shared-libs module, AND sets up a Spec-Driven Development
  layout (speckit) under specs/. Use when the user asks to create a monorepo with
  specs, add a domain module with speckit, or mentions spec-driven development,
  speckit, constitution, feature spec/plan/tasks alongside multimodule Kotlin /
  Spring Boot / Gradle version catalog.
---

# Scaffold monorepo multimodulos (Kotlin) + Speckit

Extensao da skill [`scaffold-monorepo-multimodulos-kotlin`](../scaffold-monorepo-multimodulos-kotlin/SKILL.md):
mesma estrutura Gradle/Kotlin/Spring Boot **mais** a estrutura de
**Spec-Driven Development** em `specs/`.

## Variaveis (substituir a partir do pedido)

| Placeholder | Descricao | Exemplo |
|-------------|-----------|---------|
| `{MONOREPO}` | `rootProject.name` / pasta do repo | `healthy` |
| `{GROUP}` | Slug do dominio (minusculas, um segmento) | `running` |
| `{GROUP_API}` | App Spring Boot | `{GROUP}-api` -> `running-api` |
| `{GROUP_CORE}` | Biblioteca Kotlin | `{GROUP}-core` -> `running-core` |
| `{BASE_PKG}` | Pacote base | `com.{empresa}.{GROUP}` (ou `group` Gradle existente, ex.: `com.healthy`) |
| `{BASE_PKG_ROOT}` | Pacote base da raiz, para `shared-libs` | `com.{empresa}` |
| `{NNN}` | Numero da feature, 3 digitos | `001` |
| `{SLUG}` | Slug kebab-case da feature | `consultar-alimentos` |

Regra fixa: **`{GROUP}-api`**, **`{GROUP}-core`**, **`shared-libs`**.

## Estrutura Gradle (inalterada)

```text
{MONOREPO}/
├── {GROUP}/
│   ├── {GROUP}-api/            # Spring Boot
│   └── {GROUP}-core/           # Kotlin JVM library
└── shared-libs/                # Kotlin JVM library (sem Spring Boot)
```

`settings.gradle.kts`:
```
include("{GROUP}:{GROUP}-api", "{GROUP}:{GROUP}-core", "shared-libs")
```

Convenções tecnicas e versoes (Kotlin 2.3.x, Spring Boot 4.x, Java 25) seguem
[reference.md](reference.md).

## Dependencias Recomendadas (Validadas Spring Boot 4.0.5)

Exemplo de `{GROUP}-api/build.gradle.kts` (API REST):

```kotlin
dependencies {
    implementation(project(":{GROUP}:{GROUP}-core"))
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.jetbrains.kotlin:kotlin-reflect")

    testImplementation("org.springframework.boot:spring-boot-starter-actuator-test")
    testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

kotlin {
    jvmToolchain(25)
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict", "-Xannotation-default-target=param-property")
    }
}

tasks.withType<Test>().configureEach {
    useJUnitPlatform()
}
```

> `jackson-module-kotlin` é gerenciado automaticamente pelo Spring Boot BOM em 4.0.5.

## Configuracao Gradle (obrigatoria e explicita)

Arquivos obrigatorios no root do repositorio:

```text
{MONOREPO}/
├── gradlew
├── gradlew.bat
├── gradle/
│   ├── libs.versions.toml
│   └── wrapper/
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── settings.gradle.kts
├── build.gradle.kts
└── gradle.properties
```

Regras obrigatorias do wrapper:
- Sempre executar comandos com `./gradlew`.
- `gradle/wrapper/gradle-wrapper.jar` deve ser commitado no repositorio.
- Se existir regra global `*.jar` no `.gitignore`, adicionar excecao explicita: `!gradle/wrapper/gradle-wrapper.jar`.
- Se o jar estiver ausente, regenerar wrapper a partir de um Gradle funcional e commitar os arquivos gerados.

Troubleshooting rapido (CI):
- Erro `Could not find or load main class org.gradle.wrapper.GradleWrapperMain` indica wrapper incompleto no checkout.
- Validar no repo: `gradle/wrapper/gradle-wrapper.jar` existe e esta versionado.
- Se ausente, regenerar com `gradle wrapper --gradle-version 9.4.1 --distribution-type bin` e commitar `gradlew`, `gradlew.bat`, `gradle/wrapper/gradle-wrapper.jar` e `gradle/wrapper/gradle-wrapper.properties`.

Troubleshooting rapido (Docker + Gradle multi-modulo):
- Erro `Configuring project ':<modulo>' without an existing directory is not allowed` durante `RUN ./gradlew ...` no Docker indica contexto incompleto.
- Em Dockerfile de builder, copiar todos os modulos incluidos no `settings.gradle.kts` (ex.: `shared-libs`, `*-core`, `*-api`, `*-async`) antes de executar Gradle.

Exemplo valido de `gradle/wrapper/gradle-wrapper.properties`:
```properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-9.4.1-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```

Regra de modulo aninhado (importante para comandos Gradle):
- Correto: `./gradlew :{GROUP}:{GROUP}-api:bootRun`
- Incorreto: `./gradlew {GROUP}-api:bootRun`

## Versoes Recomendadas (Validadas)

| Componente | Versao | Observacao |
|---|---|---|
| **Gradle** | 9.4.1 | Via wrapper (gradlew) |
| **Spring Boot** | 4.0.5 | LTS, Jakarta EE, Tomcat 11.0.20 |
| **Kotlin** | 2.3.0 | Compativel com Spring Boot 4.0.5 |
| **Java Toolchain** | 25 | LTS (JDK 25) |

## Estrutura Speckit (`specs/`)

Criar na raiz do monorepo:

```text
specs/
├── README.md                   # como usar speckit + mapeamento spec -> modulos
├── constitution.md             # principios globais do monorepo
├── _templates/
│   ├── feature-spec.md
│   ├── feature-plan.md
│   └── feature-tasks.md
├── {GROUP}/                    # uma pasta por dominio
│   └── README.md               # contexto do dominio + indice de features
└── shared-libs/                # modulo Gradle backend na raiz, fora dos dominios
    └── README.md               # indice de features do modulo root
```

**Conteudo compartilhado** (real): `README.md`, `constitution.md`, `_templates/*`.
**Por modulo** (generico): apenas um `README.md` com modulos Gradle, pacote base,
porta local, schema "dono" e **placeholder** de "Indice de features".

## Features (uma pasta por feature)

Cada nova feature vive em:

```text
specs/{GROUP}/{NNN}-{SLUG}/
├── spec.md     # o "o que"  (negocio, contratos, criterios de aceitacao)
├── plan.md     # o "como"   (modulos, libs, DB, testes, rollout)
└── tasks.md    # checklist executavel pelo agente
```

Para o modulo root `shared-libs`: `specs/shared-libs/{NNN}-{SLUG}/`.
Para features transversais sem dono natural: `specs/_cross/{NNN}-{SLUG}/`.

Criar copiando os templates:
```
cp -r specs/_templates specs/{GROUP}/{NNN}-{SLUG}
# renomear feature-spec.md -> spec.md, etc.
```

## Mapeamento spec -> codigo

Incluir sempre no topo da `spec.md`:

```markdown
## Escopo tecnico
- Projetos Gradle: `:{GROUP}:{GROUP}-api`, `:{GROUP}:{GROUP}-core`
- Pacotes: `{BASE_PKG}.api.{feature}`, `{BASE_PKG}.core.{feature}`
- Shared libs usadas: `:shared-libs`
```

`plan.md` declara impactos cruzados sem mover a feature de dominio.

## Constitution (conteudo minimo)

Arquivo `specs/constitution.md` com secoes:

1. **Arquitetura** — `*-api` / `*-core`, regras de dependencia, `shared-libs/`.
2. **Linguagem e plataforma** — Kotlin, JVM target, Spring Boot, Jakarta EE.
3. **Convencoes de codigo** — pacotes, DTOs, excecoes de dominio.
4. **Runtime** — `spring.application.name`, portas locais, env vars.
5. **Persistencia** — schema per service, migrations, nenhum acesso cruzado.
6. **Testes** — JUnit Platform, slice tests, criterios de aceitacao com teste.
7. **Observabilidade** — logs, metricas, traces.
8. **Speckit** — toda mudanca de comportamento comeca em `specs/`.
9. **Processo** — PR referencia a pasta da feature; spec atualizada antes/junto do codigo.

## Fluxo do agente

1. Rodar/estender a skill base `scaffold-monorepo-multimodulos-kotlin`
   (Gradle, Kotlin, Spring Boot, `*-api`/`*-core`, `shared-libs/` na raiz).
2. Se `specs/` **nao existir**:
   - Criar `specs/README.md`, `specs/constitution.md`, `specs/_templates/*`.
   - Criar `specs/{GROUP}/README.md` para cada dominio existente.
   - Criar `specs/shared-libs/README.md` para o modulo root shared-libs.
3. Se `specs/` **ja existir**:
   - Nao sobrescrever constitution nem templates.
   - Adicionar apenas `specs/{GROUP_NOVO}/README.md` ou `specs/shared-libs/README.md` quando um novo modulo for criado.
4. **Nao** criar `spec.md`/`plan.md`/`tasks.md` automaticamente: features sao
   escritas a partir de um pedido de usuario, usando `_templates/`.
5. Ao adicionar um modulo Gradle novo, **sempre** criar a pasta `specs/` correspondente.

Regra estrutural fixa: `shared-libs` e um modulo Gradle de primeira classe na raiz do monorepo. Nunca cria-lo dentro de `properties/` ou qualquer outro dominio interno.

## Exemplo de pedido

**Input:** criar dominio `running` com API e core, com speckit.

**Resultado:**
- Pastas Gradle `running/running-api`, `running/running-core`; includes e
  dependencias conforme skill base.
- Pasta `specs/running/README.md` apontando para `:running:running-api` e
  `:running:running-core` (sem features).
- Se `specs/constitution.md` / `specs/_templates/` ainda nao existirem, criar.

## Referencia

Matriz de versoes, paths Gradle e detalhes de IDE: [reference.md](reference.md).
