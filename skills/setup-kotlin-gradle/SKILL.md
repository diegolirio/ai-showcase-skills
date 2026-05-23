---
name: setup-kotlin-gradle
description: >
  Scaffolds a new Kotlin + Spring Boot 3.x multi-module project using Gradle
  Kotlin DSL. Generates the base layout (buildingBlocks + core + presenter-api /
  presenter-consumer / presenter-job), root build, settings, base contracts
  (Entity, Id, Command, Query, BusinessRule, Result types), PostgreSQL + Flyway
  configuration, docker-compose and Makefile. Use this skill whenever the user
  asks to "criar projeto kotlin", "novo projeto spring boot kotlin", "scaffold
  kotlin gradle", "iniciar projeto kotlin", "bootstrap kotlin spring", or any
  fresh Kotlin/Spring multi-module project. For generating REST endpoints,
  routes, handlers, commands, queries or JPA entities inside an existing
  project, use `setup-kotlin-crud` (recommended) or `crud-kotlin` (full DDD) instead.
---

# setup-kotlin-gradle

Cria a estrutura base de um projeto Kotlin + Spring Boot 3.x em monorepo
Gradle (Kotlin DSL) multi-módulo. Gera apenas o esqueleto do projeto —
endpoints, CRUDs e features são gerados pelas skills `setup-kotlin-crud` ou `crud-kotlin`.

> Esta skill é o split da antiga `kotlin-spring` (parte de criação de projeto).
> Para endpoints REST: prefira `setup-kotlin-crud` (MVP/CRUD); use `crud-kotlin` para DDD completo.

---

## Passo 1 — Perguntas obrigatórias

Antes de gerar qualquer arquivo, perguntar:

```
1. Nome do projeto (ex: my-service)
   → usado como rootProject.name no settings.gradle.kts e no docker-compose

2. Pacote base (ex: br.com.mycompany.myservice)
   → usado em todos os packages Kotlin

3. Quais módulos incluir?
   → buildingBlocks e core são obrigatórios
   → presenter-api      (REST HTTP)
   → presenter-consumer (mensageria)
   → presenter-job      (jobs agendados)

4. Nomes dos módulos (opcional — aceitar defaults se não informado)
```

### Defaults dos nomes de módulo

| Módulo            | Nome default        | Descrição                          |
|-------------------|---------------------|------------------------------------|
| Contratos         | `buildingBlocks`    | Interfaces e abstrações            |
| Domínio + Infra   | `core`              | Domain, Application, Infrastructure|
| REST              | `presenter-api`     | Endpoints HTTP                     |
| Mensageria        | `presenter-consumer`| Consumers de mensagens             |
| Jobs              | `presenter-job`     | Jobs agendados                     |

O usuário pode renomear qualquer módulo (ex: `presenter-api` → `api`,
`core` → `domain`). Ao renomear, aplicar o nome customizado em **todos** os
arquivos gerados: `settings.gradle.kts`, `build.gradle.kts`, imports, `include()`.

---

## Passo 2 — Confirmar antes de gerar

Após coletar as respostas, apresentar resumo e pedir confirmação:

```
Vou criar o projeto com:
  Nome:    my-service
  Pacote:  br.com.mycompany.myservice
  Módulos: buildingBlocks, core, presenter-api

Estrutura:
  my-service/
  ├── buildingBlocks/
  ├── core/
  ├── presenter-api/
  ├── docker-compose.yml
  ├── Makefile
  └── settings.gradle.kts

Pode prosseguir?
```

---

## Estrutura final do projeto

```
{project-name}/
├── buildingBlocks/     ← Interfaces e classes base (sem Spring)
├── core/               ← Domain + Application + Infrastructure
├── presenter-api/      ← REST HTTP (opcional)
├── presenter-consumer/ ← Mensageria (opcional)
├── presenter-job/      ← Jobs agendados (opcional)
├── docker-compose.yml
├── Makefile
├── settings.gradle.kts
└── build.gradle.kts
```

**Direção de dependência:** `presenter-*` → `core` → `buildingBlocks`.
Presenters dependem de core. Core depende de buildingBlocks. Nunca o inverso.

---

## Passo 3 — Gerar arquivos

### 3.1 `build.gradle.kts` (raiz)

```kotlin
plugins {
    kotlin("jvm") version "2.0.0"
    kotlin("plugin.spring") version "2.0.0"
    id("org.springframework.boot") version "3.4.4" apply false
    id("io.spring.dependency-management") version "1.1.5"
}

allprojects {
    group = "{base-package}"
    version = "0.0.1-SNAPSHOT"
}

subprojects {
    apply(plugin = "kotlin")
    apply(plugin = "kotlin-spring")
    apply(plugin = "io.spring.dependency-management")

    repositories { mavenCentral() }

    java {
        toolchain { languageVersion.set(JavaLanguageVersion.of(21)) }
    }

    tasks.withType<Test> {
        useJUnitPlatform {
            val includeTags = project.findProperty("includeTags") as String?
            val excludeTags = project.findProperty("excludeTags") as String?
            if (includeTags != null) includeTags(*includeTags.split(",").toTypedArray())
            if (excludeTags != null) excludeTags(*excludeTags.split(",").toTypedArray())
        }
    }
}
```

### 3.2 `settings.gradle.kts`

```kotlin
rootProject.name = "{project-name}"

include("buildingBlocks", "core")
// incluir apenas os presenters escolhidos pelo usuário:
include("presenter-api")
// include("presenter-consumer")
// include("presenter-job")
```

---

## Módulo: buildingBlocks

**Sem Spring, sem regra de negócio.** Apenas interfaces e classes base
compartilhadas por todo o projeto.

### `buildingBlocks/build.gradle.kts`

```kotlin
dependencies {
    implementation(kotlin("stdlib"))
}
```

### Application contracts (`<package>/application/`)

```kotlin
interface Command {
    val id: UUID
    val metadata: MutableMap<String, String?>
}

abstract class CommandBase(
    override val metadata: MutableMap<String, String?> = mutableMapOf(),
) : Command {
    final override var id: UUID = UUID.randomUUID()
        private set
}

interface CommandHandler<in TCommand : Command> {
    fun handle(command: TCommand)
}

interface ResultCommand<out Result> {
    val metadata: MutableMap<String, String?>
}

interface ResultCommandHandler<in TCommand : ResultCommand<TResult>, TResult> {
    fun handle(command: TCommand): TResult
}

interface Query<out TResult> { val id: UUID }

abstract class QueryBase<TResult> : Query<TResult> {
    final override var id: UUID = UUID.randomUUID()
        private set
}

interface QueryHandler<in TQuery : Query<TResult>, TResult> {
    fun handle(query: TQuery): TResult
}
```

### Domain contracts (`<package>/domain/`)

```kotlin
abstract class Entity {
    companion object {
        private val ruleChecker = RuleChecker()

        @JvmStatic
        protected fun checkAllRules(vararg rules: BusinessRule) {
            ruleChecker.checkAllRules(*rules)
        }
    }
}

abstract class Id protected constructor(id: UUID = UUID.randomUUID()) {
    val value: UUID = id
    override fun equals(other: Any?) = other is Id && value == other.value
    override fun hashCode() = value.hashCode()
}

abstract class BusinessRule(val message: String, val id: String) {
    abstract fun isBroken(): Boolean
}

class RuleChecker {
    fun checkAllRules(vararg rules: BusinessRule) {
        val broken = rules.filter { it.isBroken() }
        if (broken.isNotEmpty()) throw BusinessRulesBrokenException(broken)
    }
}

class BusinessRulesBrokenException(val brokenRules: List<BusinessRule>) : Exception() {
    override val message = brokenRules.joinToString { "${it.id}: ${it.message}" }
}

interface Event { val correlationId: UUID }
```

### Presenter error DTOs (`<package>/presenter/exception/`)

Usadas pelos `GlobalExceptionHandler` dos presenters:

```kotlin
data class ListErrorMessage(
    val error: String,
    val details: MutableList<ErrorMessage> = mutableListOf(),
) {
    fun addError(code: String, message: String): ListErrorMessage {
        details.add(ErrorMessage(code, message)); return this
    }
}

data class ErrorMessage(val code: String, val message: String)
```

---

## Módulo: core

Contém Domain, Application e Infrastructure. Endpoints/handlers reais são
gerados depois com `crud-kotlin`. Aqui geramos só a estrutura de pastas vazias
e o `build.gradle.kts`.

### Layout de pastas

```
core/src/main/kotlin/<package>/
├── application/
├── domain/
└── infrastructure/

core/src/main/resources/
└── db/migration/        ← migrations Flyway (V1, V2, ...)

core/src/test/kotlin/<package>/
└── TestCoreApplication.kt
```

### `core/build.gradle.kts`

```kotlin
dependencies {
    implementation(project(":buildingBlocks"))
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.flywaydb:flyway-database-postgresql")
    runtimeOnly("org.postgresql:postgresql")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
    testImplementation("io.mockk:mockk:1.13.10")
    testImplementation("io.kotest:kotest-assertions-core:5.8.1")
    testImplementation("org.testcontainers:postgresql:1.19.7")
    testImplementation("org.testcontainers:junit-jupiter:1.19.7")
}
```

### `TestCoreApplication.kt` (necessária pois `core` não tem `@SpringBootApplication` em main)

```kotlin
@SpringBootApplication
class TestCoreApplication
```

---

## Módulo: presenter-api (gerar apenas se selecionado)

### Layout

```
presenter-api/src/main/kotlin/<package>/
├── PresenterApiApplication.kt
└── presenter/
    └── exception/
        └── GlobalExceptionHandler.kt

presenter-api/src/main/resources/
└── application.yml
```

### `presenter-api/build.gradle.kts`

```kotlin
plugins {
    id("org.springframework.boot")
}

dependencies {
    implementation(project(":buildingBlocks"))
    implementation(project(":core"))

    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.6")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
    testImplementation("io.mockk:mockk:1.13.10")
    testImplementation("com.ninja-squad:springmockk:4.0.2")
    testImplementation("io.kotest:kotest-assertions-core:5.8.1")
}
```

### `PresenterApiApplication.kt`

```kotlin
@SpringBootApplication(scanBasePackages = ["{base-package}"])
@EnableJpaRepositories(basePackages = ["{base-package}.infrastructure"])
@EntityScan(basePackages = ["{base-package}.infrastructure"])
class PresenterApiApplication

fun main(args: Array<String>) {
    runApplication<PresenterApiApplication>(*args)
}
```

### `GlobalExceptionHandler.kt`

```kotlin
@RestControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(BusinessRulesBrokenException::class)
    fun handleBusinessRules(ex: BusinessRulesBrokenException): ResponseEntity<ListErrorMessage> {
        val body = ListErrorMessage(error = "Business rule violation")
        ex.brokenRules.forEach { body.addError(it.id, it.message) }
        return ResponseEntity.unprocessableEntity().body(body)
    }

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidation(ex: MethodArgumentNotValidException): ResponseEntity<ListErrorMessage> {
        val body = ListErrorMessage(error = "Validation failed")
        ex.bindingResult.fieldErrors.forEach {
            body.addError(it.field, it.defaultMessage ?: "invalid")
        }
        return ResponseEntity.badRequest().body(body)
    }

    @ExceptionHandler(NoSuchElementException::class)
    fun handleNotFound(ex: NoSuchElementException): ResponseEntity<ListErrorMessage> =
        ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ListErrorMessage(error = ex.message ?: "Not found"))

    @ExceptionHandler(Exception::class)
    fun handleGeneric(ex: Exception): ResponseEntity<ListErrorMessage> =
        ResponseEntity.internalServerError()
            .body(ListErrorMessage(error = "Internal server error"))
}
```

Mapeamento HTTP usado por toda a aplicação:

| Exception                         | Status                       |
|-----------------------------------|------------------------------|
| `BusinessRulesBrokenException`    | `422 Unprocessable Entity`   |
| `MethodArgumentNotValidException` | `400 Bad Request`            |
| `NoSuchElementException`          | `404 Not Found`              |
| Outras                            | `500 Internal Server Error`  |

### `application.yml`

```yaml
spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:service}
    username: ${DB_USER:postgres}
    password: ${DB_PASSWORD:postgres}
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate.dialect: org.hibernate.dialect.PostgreSQLDialect
  flyway:
    enabled: true
    locations: classpath:db/migration

server:
  port: ${SERVER_PORT:8080}

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      show-details: always

springdoc:
  swagger-ui:
    path: /swagger-ui.html
  api-docs:
    path: /v3/api-docs
```

Swagger UI: `http://localhost:8080/swagger-ui.html` · Actuator: `http://localhost:8080/actuator/health`

---

## Módulo: presenter-consumer (gerar apenas se selecionado)

### `presenter-consumer/build.gradle.kts`

```kotlin
plugins { id("org.springframework.boot") }

dependencies {
    implementation(project(":buildingBlocks"))
    implementation(project(":core"))
    implementation("org.springframework.boot:spring-boot-starter")
    implementation("org.springframework.kafka:spring-kafka")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("io.mockk:mockk:1.13.10")
}
```

Convenções (Consumer/Message, deserialização) ficam na skill `crud-kotlin`
quando for gerar um consumer concreto.

---

## Módulo: presenter-job (gerar apenas se selecionado)

### `presenter-job/build.gradle.kts`

```kotlin
plugins { id("org.springframework.boot") }

dependencies {
    implementation(project(":buildingBlocks"))
    implementation(project(":core"))
    implementation("org.springframework.boot:spring-boot-starter")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("io.mockk:mockk:1.13.10")
}
```

Habilitar agendamento na `Application` deste módulo com `@EnableScheduling`.

---

## docker-compose.yml (raiz)

```yaml
services:
  postgres:
    image: postgres:16
    container_name: ${COMPOSE_PROJECT_NAME:-service}-postgres
    environment:
      POSTGRES_DB: ${DB_NAME:-service}
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## Makefile (raiz)

Sempre usar **tabs** (não espaços) na indentação dos comandos.

```makefile
.PHONY: help build run test test-unit test-integration docker-up docker-down docker-logs

help: ## Mostra os targets disponíveis
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

docker-up: ## Inicia os containers (PostgreSQL)
	docker compose up -d

docker-down: ## Para e remove os containers
	docker compose down

docker-logs: ## Exibe os logs dos containers
	docker compose logs -f

build: ## Compila todos os módulos
	./gradlew build -x test

run: docker-up ## Sobe o banco e executa a aplicação
	./gradlew :presenter-api:bootRun

test: ## Executa todos os testes (unitários + integração)
	./gradlew test

test-unit: ## Executa apenas testes unitários (exclui @Tag("integration"))
	./gradlew test -PexcludeTags=integration

test-integration: docker-up ## Sobe o banco e executa testes de integração
	./gradlew test -PincludeTags=integration
```

---

## db/migration — migration inicial vazia

Criar `core/src/main/resources/db/migration/V1__init.sql` apenas com
comentário:

```sql
-- V1__init.sql
-- Schema inicial vazio. Tabelas serão criadas em migrations futuras
-- conforme novos aggregates forem adicionados via skill `crud-kotlin`.
```

---

## Checklist final

- [ ] `settings.gradle.kts` inclui só os módulos confirmados pelo usuário
- [ ] Pacote base aplicado em todos os arquivos `.kt` gerados
- [ ] `buildingBlocks` contém Entity, Id, BusinessRule, Command/Query, Result types e error DTOs
- [ ] `core` tem pastas `application/`, `domain/`, `infrastructure/` vazias e `db/migration/V1__init.sql`
- [ ] `core` tem `TestCoreApplication` em `src/test`
- [ ] `presenter-api` (se incluído) tem `Application`, `GlobalExceptionHandler` e `application.yml`
- [ ] `docker-compose.yml` e `Makefile` na raiz
- [ ] `ddl-auto: validate` em todos os ambientes
- [ ] `./gradlew build -x test` compila com sucesso

---

## Próximos passos

Para gerar endpoints REST dentro deste projeto:

**Recomendado (MVP, muitos CRUDs, ~5 arquivos por feature):**
```
/setup-kotlin-crud POST /users com esse json: {"name":"Ana","email":"ana@example.com"}
```
Ver `skills/setup-kotlin-crud/README.md` — tokens, review, por que usar skill vs deixar o IDE livre.

**DDD completo (`XRepository` + `RepositoryImpl`):**
```
/crud-kotlin POST /users com esse json: {"name":"Ana","email":"ana@example.com"}
```
