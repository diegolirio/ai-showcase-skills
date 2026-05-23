---
name: kotlin-spring
description: >
  Use this skill whenever the user is working on a Kotlin + Spring Boot project
  using a multi-module layered architecture (buildingBlocks, core, presenter-api,
  presenter-consumer, presenter-job). Trigger this skill when the user asks to
  create, scaffold, or modify any class, file, or feature — including routes,
  consumers, jobs, DTOs, commands, queries, handlers, domain objects, repositories,
  results, error handling, or tests. Also trigger for naming conventions, module
  responsibilities, Flyway migrations, PostgreSQL config, or any architectural
  question in a Kotlin/Spring context.
---

# Kotlin + Spring Boot — Multi-Module Skill

This skill enforces architecture, naming conventions, and patterns for Kotlin
projects built with Spring Boot 3.x organized as a multi-module Gradle project.

---

## Criação de Projeto — Scaffolding Inicial

Quando o usuário pedir para **criar um projeto**, fazer as seguintes perguntas
antes de gerar qualquer arquivo:

```
1. Nome do projeto (ex: my-service)
   → usado como rootProject.name no settings.gradle.kts e no docker-compose

2. Pacote base (ex: br.com.mycompany.myservice)
   → usado em todos os packages Kotlin

3. Quais módulos incluir?
   → buildingBlocks e core são obrigatórios
   → presenter-api    (REST HTTP)
   → presenter-consumer (mensageria)
   → presenter-job    (jobs agendados)

4. Nomes dos módulos (opcional — aceitar os defaults abaixo se não informado)
```

### Defaults dos nomes de módulo

| Módulo            | Nome default        | Descrição                         |
|-------------------|---------------------|-----------------------------------|
| Contratos         | `buildingBlocks`    | Interfaces e abstrações           |
| Domínio + Infra   | `core`              | Domain, Application, Infrastructure |
| REST              | `presenter-api`     | Endpoints HTTP                    |
| Mensageria        | `presenter-consumer`| Consumers de mensagens            |
| Jobs              | `presenter-job`     | Jobs agendados                    |

O usuário pode renomear qualquer módulo (ex: `presenter-api` → `api`, `core` → `domain`).
Ao renomear, aplicar o nome customizado em **todos** os arquivos gerados:
`settings.gradle.kts`, `build.gradle.kts`, imports, `include()`, etc.

### Resumo antes de gerar

Após coletar as respostas, apresentar resumo e pedir confirmação:

```
Vou criar o projeto com:
  Nome:    my-service
  Pacote:  br.com.mycompany.myservice
  Módulos: buildingBlocks, core, api (presenter-api), job (presenter-job)

Estrutura:
  my-service/
  ├── buildingBlocks/
  ├── core/
  ├── api/
  ├── job/
  ├── docker-compose.yml
  ├── Makefile
  └── settings.gradle.kts

Pode prosseguir?
```

---

## Module Structure

```
root/
├── buildingBlocks/     ← Shared interfaces and abstractions (no Spring)
├── core/               ← Domain + Application + Infrastructure layers
├── presenter-api/      ← REST HTTP endpoints
├── presenter-consumer/ ← Message/event consumers
└── presenter-job/      ← Scheduled jobs
```

**Dependency direction:** `presenter-*` → `core` → `buildingBlocks`  
Presenters depend on core. Core depends on buildingBlocks. Never the reverse.

---

## Module: buildingBlocks

Contains **only interfaces and abstract base classes** — no Spring, no business logic,
no infrastructure. This module is the shared contract for the entire project.

### Application contracts

```kotlin
// Command marker interface
interface Command {
    val id: UUID
    val metadata: MutableMap<String, String?>
}

// Base class for commands — auto-generates UUID on creation
abstract class CommandBase(
    override val metadata: MutableMap<String, String?> = mutableMapOf(),
) : Command {
    final override var id: UUID = UUID.randomUUID()
        private set
}

// Command handler that returns nothing
interface CommandHandler<in TCommand : Command> {
    fun handle(command: TCommand)
}

// Command that produces a return value
interface ResultCommand<out Result> {
    val metadata: MutableMap<String, String?>
}

interface ResultCommandHandler<in TCommand : ResultCommand<TResult>, TResult> {
    fun handle(command: TCommand): TResult
}

// Query
interface Query<out TResult> {
    val id: UUID
}

abstract class QueryBase<TResult> : Query<TResult> {
    final override var id: UUID = UUID.randomUUID()
        private set
}

interface QueryHandler<in TQuery : Query<TResult>, TResult> {
    fun handle(query: TQuery): TResult
}
```

### Domain contracts

```kotlin
// Base entity — provides rule checking via companion object
abstract class Entity {
    companion object {
        private val ruleChecker = RuleChecker()

        @JvmStatic
        protected fun checkAllRules(vararg rules: BusinessRule) {
            ruleChecker.checkAllRules(*rules)
        }
    }
}

// Strongly-typed Long ID value object
abstract class Id protected constructor(id: Long = 0) {
    val value: Long = id
    override fun equals(other: Any?) = other is Id && value == other.value
    override fun hashCode() = value.hashCode()
}

// Business rule abstraction
abstract class BusinessRule(val message: String, val id: String) {
    abstract fun isBroken(): Boolean
}

class RuleChecker {
    fun checkAllRules(vararg rules: BusinessRule) {
        val brokenRules = rules.filter { it.isBroken() }
        if (brokenRules.isNotEmpty()) throw BusinessRulesBrokenException(brokenRules)
    }
}

class BusinessRulesBrokenException(val brokenRules: List<BusinessRule>) : Exception() {
    override val message = brokenRules.joinToString { "${it.id}: ${it.message}" }
}

// Domain event marker
interface Event {
    val correlationId: UUID
}
```

### Utilities

```kotlin
// Datadog tracing helpers (br.com.gruposbf.utils)
fun <T> tracing(operationName: String, serviceName: String, resourceName: String, operation: () -> T): T

fun withTracing(operationName: String, resourceName: String, applicationName: String, handlerBlock: () -> Unit)

// Unicode sanitization for JSON deserialization (br.com.gruposbf.utils.deserializer)
class CleanEscapeUnicode   // strips \uXXXX sequences and control chars
class EscapeUnicodeDeserializer : JsonDeserializer<String>()  // plug into ObjectMapper
```

---

## Module: core

Contains the **Domain**, **Application**, and **Infrastructure** layers.

### Package layout

```
core/src/main/kotlin/<package>/
├── application/
│   └── <feature>/
│       ├── CreateXCommand.kt        ← extends CommandBase
│       ├── CreateXHandler.kt        ← implements ResultCommandHandler / CommandHandler
│       ├── CreateXResult.kt         ← data class, suffix Result
│       ├── GetXQuery.kt             ← extends QueryBase
│       └── GetXHandler.kt           ← implements QueryHandler
├── domain/
│   └── <feature>/
│       ├── X.kt                     ← extends Entity, enforces invariants
│       ├── XId.kt                   ← extends Id
│       ├── XRepository.kt           ← interface only (impl in infrastructure)
│       └── rules/
│           └── XMustBeValidRule.kt  ← extends BusinessRule
└── infrastructure/
    └── <feature>/
        ├── XRepositoryImpl.kt
        ├── XEntity.kt               ← JPA entity, suffix Entity
        └── XJpaRepository.kt        ← Spring Data interface
```

### Domain layer rules

- Extend `Entity` for aggregates and domain objects.
- Extend `Id` for strongly-typed identifiers.
- Extend `BusinessRule` for each invariant; call `checkAllRules()` in factory methods.
- No Spring annotations, no DTOs, no infrastructure imports.

```kotlin
// domain/user/UserId.kt
class UserId(id: Long = 0) : Id(id)

// domain/user/rules/EmailMustBeValidRule.kt
class EmailMustBeValidRule(private val email: String) : BusinessRule(
    id = "USER_001",
    message = "Email '$email' is not valid"
) {
    override fun isBroken() = !email.contains("@")
}

// domain/user/User.kt
class User private constructor(
    val id: UserId,
    val name: String,
    val email: String,
) : Entity() {
    companion object {
        fun create(name: String, email: String): User {
            checkAllRules(EmailMustBeValidRule(email))
            return User(id = UserId(), name = name, email = email)
        }
    }
}
```

### Application layer rules

- Commands extend `CommandBase` (void) or implement `ResultCommand` (returning).
- Queries extend `QueryBase<TResult>`.
- One handler per command/query; annotate with `@Service`.
- Results are `data class` with suffix `Result`.

```kotlin
// application/user/CreateUserCommand.kt
class CreateUserCommand(val name: String, val email: String) : CommandBase()

// application/user/CreateUserHandler.kt
@Service
class CreateUserHandler(
    private val userRepository: UserRepository,
) : ResultCommandHandler<CreateUserCommand, CreateUserResult> {

    override fun handle(command: CreateUserCommand): CreateUserResult {
        val user = User.create(name = command.name, email = command.email)
        userRepository.save(user)
        return CreateUserResult(id = user.id.value, name = user.name)
    }
}

// application/user/CreateUserResult.kt
data class CreateUserResult(val id: Long, val name: String)
```

### Infrastructure layer rules

- JPA entities use suffix `Entity`.
- Separate Spring Data interface (`XJpaRepository`) from domain repo impl (`XRepositoryImpl`).
- Use `@Repository` on impl classes.

```kotlin
// infrastructure/user/UserEntity.kt
@Entity
@Table(name = "users")
class UserEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    @Column(nullable = false) val name: String,
    @Column(nullable = false, unique = true) val email: String,
    @Column(name = "created_at", nullable = false) val createdAt: OffsetDateTime = OffsetDateTime.now(),
)

// infrastructure/user/UserJpaRepository.kt
interface UserJpaRepository : JpaRepository<UserEntity, Long>

// infrastructure/user/UserRepositoryImpl.kt
@Repository
class UserRepositoryImpl(private val jpa: UserJpaRepository) : UserRepository {
    override fun save(user: User) { jpa.save(user.toEntity()) }
}
```

---

## Module: presenter-api

Handles **REST HTTP** endpoints.  
Always declare when asking for help: *"Estou no presenter-api"*

### Rules

- Route classes: suffix `Route` + `@RestController`.
- Input DTOs: suffix `Request`, same package as the Route.
- Response body must be a `Result` from core or `ResponseEntity<Void>`.
- Never return domain objects or Request DTOs from a route.
- Map requests to commands/queries via extension function `toCommand()` / `toQuery()`.

```kotlin
// presenter/user/UserRoute.kt
@RestController
@RequestMapping("/users")
class UserRoute(private val createUserHandler: CreateUserHandler) {

    @PostMapping
    fun create(@RequestBody @Valid request: CreateUserRequest): ResponseEntity<CreateUserResult> {
        val result = createUserHandler.handle(request.toCommand())
        return ResponseEntity.status(HttpStatus.CREATED).body(result)
    }
}

// presenter/user/CreateUserRequest.kt
data class CreateUserRequest(
    @field:NotBlank val name: String,
    @field:Email val email: String,
) {
    fun toCommand() = CreateUserCommand(name = name, email = email)
}
```

### Error handling — presenter-api

```kotlin
// presenter/exception/GlobalExceptionHandler.kt
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

    @ExceptionHandler(Exception::class)
    fun handleGeneric(ex: Exception): ResponseEntity<ListErrorMessage> =
        ResponseEntity.internalServerError().body(ListErrorMessage(error = "Internal server error"))
}
```

Error response DTOs (from buildingBlocks `presenter.exception` package):

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

HTTP status mapping:

| Exception | Status |
|---|---|
| `BusinessRulesBrokenException` | `422 Unprocessable Entity` |
| `MethodArgumentNotValidException` | `400 Bad Request` |
| `NoSuchElementException` / not found | `404 Not Found` |
| Anything else | `500 Internal Server Error` |

---

## Module: presenter-consumer

Handles **message/event consumption** (Kafka, RabbitMQ, SQS, etc.).  
Always declare when asking for help: *"Estou no presenter-consumer"*

### Rules

- Consumer classes: suffix `Consumer`.
- Input message DTOs: suffix `Message`, same package as Consumer.
- Map message → `Command`/`Query` before delegating; no business logic in consumer.
- Handle deserialization errors and dead-letter routing here.
- Apply `EscapeUnicodeDeserializer` on String fields from external producers.

```kotlin
// presenter/user/UserCreatedConsumer.kt
@Component
class UserCreatedConsumer(private val createUserHandler: CreateUserHandler) {

    @KafkaListener(topics = ["\${kafka.topics.user-created}"])
    fun consume(@Payload message: UserCreatedMessage) {
        createUserHandler.handle(message.toCommand())
    }
}

// presenter/user/UserCreatedMessage.kt
data class UserCreatedMessage(
    @JsonDeserialize(using = EscapeUnicodeDeserializer::class)
    val name: String,
    val email: String,
) {
    fun toCommand() = CreateUserCommand(name = name, email = email)
}
```

---

## Module: presenter-job

Handles **scheduled tasks**.  
Always declare when asking for help: *"Estou no presenter-job"*

### Rules

- Job classes: suffix `Job`, annotated with `@Component`.
- Use `@Scheduled` for simple cron, or Quartz `Job` interface for complex scheduling.
- Map execution to a `Command`/`Query` — no business logic in the job itself.
- Instrument with `withTracing()` from buildingBlocks.

```kotlin
// presenter/sync/UserSyncJob.kt
@Component
class UserSyncJob(private val syncUsersHandler: SyncUsersHandler) {

    @Scheduled(cron = "\${jobs.user-sync.cron}")
    fun run() {
        withTracing(
            operationName = "job.user-sync",
            resourceName = "UserSyncJob",
            applicationName = "my-service",
        ) {
            syncUsersHandler.handle(SyncUsersCommand())
        }
    }
}
```

---

## Database Migrations — Flyway + PostgreSQL

### Dependencies (core/build.gradle.kts)

```kotlin
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.flywaydb:flyway-database-postgresql")
    runtimeOnly("org.postgresql:postgresql")
}
```

### Configuration

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

### Migration naming: `V{version}__{snake_case_description}.sql`

```sql
-- V1__create_users_table.sql
CREATE TABLE users (
    id         BIGSERIAL PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- V2__add_users_email_index.sql
CREATE INDEX idx_users_email ON users (email);
```

Rules: never edit applied migrations · use `TIMESTAMPTZ` · one logical change per file ·
`ddl-auto: validate` in all environments · repeatable migrations (`R__`) only for views/functions.

---

## Naming Convention Summary

| Artifact         | Module              | Suffix       | Example                    |
|------------------|---------------------|--------------|----------------------------|
| HTTP endpoint    | presenter-api       | `Route`      | `UserRoute`                |
| HTTP input DTO   | presenter-api       | `Request`    | `CreateUserRequest`        |
| Message handler  | presenter-consumer  | `Consumer`   | `UserCreatedConsumer`      |
| Message DTO      | presenter-consumer  | `Message`    | `UserCreatedMessage`       |
| Scheduled job    | presenter-job       | `Job`        | `UserSyncJob`              |
| Command (void)   | core/application    | `Command`    | `DeleteUserCommand`        |
| Command (result) | core/application    | `Command`    | `CreateUserCommand`        |
| Query            | core/application    | `Query`      | `GetUserQuery`             |
| Handler          | core/application    | `Handler`    | `CreateUserHandler`        |
| Response body    | core/application    | `Result`     | `CreateUserResult`         |
| Domain entity    | core/domain         | *(none)*     | `User`, `Order`            |
| Typed ID         | core/domain         | `Id`         | `UserId`                   |
| Business rule    | core/domain/rules   | `Rule`       | `EmailMustBeValidRule`     |
| JPA entity       | core/infrastructure | `Entity`     | `UserEntity`               |
| Shared contract  | buildingBlocks      | *(none)*     | `CommandHandler`, `Entity` |

---

## Testing

### Test strategy by module

| What to test              | Module              | Tool                              |
|---------------------------|---------------------|-----------------------------------|
| Domain rules and entities | core (unit)         | JUnit 5 + Kotest assertions       |
| Application handlers      | core (unit)         | Mockk                             |
| REST routes               | presenter-api       | `@WebMvcTest` + MockMvc + MockkBean |
| Consumers                 | presenter-consumer  | `@EmbeddedKafka` or Mockk         |
| Jobs                      | presenter-job       | Unit test with Mockk              |
| Full flow + DB            | core (integration)  | Testcontainers + `@SpringBootTest`|

### Unit test — domain rule

```kotlin
class EmailMustBeValidRuleTest {

    @Test
    fun `should be broken when email has no at sign`() {
        assertTrue(EmailMustBeValidRule("invalid-email").isBroken())
    }

    @Test
    fun `should not be broken when email is valid`() {
        assertFalse(EmailMustBeValidRule("user@example.com").isBroken())
    }
}
```

### Unit test — handler with Mockk

```kotlin
class CreateUserHandlerTest {

    private val userRepository = mockk<UserRepository>()
    private val handler = CreateUserHandler(userRepository)

    @Test
    fun `should create user and return result`() {
        every { userRepository.save(any()) } just Runs

        val result = handler.handle(CreateUserCommand(name = "Ana", email = "ana@example.com"))

        result.name shouldBe "Ana"
        verify(exactly = 1) { userRepository.save(any()) }
    }

    @Test
    fun `should throw BusinessRulesBrokenException for invalid email`() {
        shouldThrow<BusinessRulesBrokenException> {
            handler.handle(CreateUserCommand(name = "Ana", email = "bad-email"))
        }
    }
}
```

### Integration test — presenter-api with MockMvc

```kotlin
@WebMvcTest(UserRoute::class)
class UserRouteTest {

    @Autowired lateinit var mockMvc: MockMvc
    @MockkBean lateinit var createUserHandler: CreateUserHandler

    @Test
    fun `POST users should return 201 with result`() {
        every { createUserHandler.handle(any()) } returns CreateUserResult(id = 1L, name = "Ana")

        mockMvc.post("/users") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"Ana","email":"ana@example.com"}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.name") { value("Ana") }
        }
    }

    @Test
    fun `POST users should return 422 on business rule violation`() {
        every { createUserHandler.handle(any()) } throws
            BusinessRulesBrokenException(listOf(EmailMustBeValidRule("bad")))

        mockMvc.post("/users") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"Ana","email":"bad"}"""
        }.andExpect {
            status { isUnprocessableEntity() }
            jsonPath("$.error") { value("Business rule violation") }
        }
    }
}
```

### Integration test — database with Testcontainers

```kotlin
@SpringBootTest
@Testcontainers
class UserRepositoryImplTest {

    companion object {
        @Container
        val postgres = PostgreSQLContainer<Nothing>("postgres:16").apply {
            withDatabaseName("testdb")
            withUsername("test")
            withPassword("test")
        }

        @JvmStatic
        @DynamicPropertySource
        fun properties(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl)
            registry.add("spring.datasource.username", postgres::getUsername)
            registry.add("spring.datasource.password", postgres::getPassword)
        }
    }

    @Autowired lateinit var userRepository: UserRepository

    @Test
    fun `should persist and retrieve user`() {
        val user = User.create(name = "Ana", email = "ana@example.com")
        userRepository.save(user)
        // assert via repo or direct JPA query
    }
}
```

### presenter-api dependencies (build.gradle.kts)

```kotlin
implementation("org.springframework.boot:spring-boot-starter-web")
implementation("org.springframework.boot:spring-boot-starter-validation")
implementation("org.springframework.boot:spring-boot-starter-actuator")
implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.6")

testImplementation("org.springframework.boot:spring-boot-starter-test")
testRuntimeOnly("org.junit.platform:junit-platform-launcher")
testImplementation("io.mockk:mockk:1.13.10")
testImplementation("com.ninja-squad:springmockk:4.0.2")       // @MockkBean
testImplementation("io.kotest:kotest-assertions-core:5.8.1")  // shouldBe, shouldThrow
```

### core test dependencies (build.gradle.kts)

```kotlin
testImplementation("org.springframework.boot:spring-boot-starter-test")
testRuntimeOnly("org.junit.platform:junit-platform-launcher")
testImplementation("io.mockk:mockk:1.13.10")
testImplementation("io.kotest:kotest-assertions-core:5.8.1")
testImplementation("org.testcontainers:postgresql:1.19.7")
testImplementation("org.testcontainers:junit-jupiter:1.19.7")
```

Swagger UI disponível em: `http://localhost:8080/swagger-ui.html`  
Actuator health: `http://localhost:8080/actuator/health`

---

## Spring Boot Version

Always target **Spring Boot 3.x**. Use constructor injection everywhere — never `@Autowired` on fields.

```kotlin
// root build.gradle.kts
plugins {
    kotlin("jvm") version "2.0.0"
    kotlin("plugin.spring") version "2.0.0"
    id("org.springframework.boot") version "3.4.4"
    id("io.spring.dependency-management") version "1.1.5"
}
```

---

## Docker Compose — PostgreSQL local

Criar `docker-compose.yml` na raiz do projeto:

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

O `application.yml` do `presenter-api` deve referenciar variáveis de ambiente com defaults
que casam com o `docker-compose.yml`:

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
```

---

## Makefile

Criar `Makefile` na raiz do projeto com os targets abaixo.
Sempre usar tabs (não espaços) na indentação dos comandos.

```makefile
.PHONY: help build run test test-unit test-integration docker-up docker-down docker-logs

help: ## Mostra os targets disponíveis
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ── Docker ────────────────────────────────────────────────────────────────────

docker-up: ## Inicia os containers (PostgreSQL)
	docker compose up -d

docker-down: ## Para e remove os containers
	docker compose down

docker-logs: ## Exibe os logs dos containers
	docker compose logs -f

# ── Build & Run ───────────────────────────────────────────────────────────────

build: ## Compila todos os módulos
	./gradlew build -x test

run: docker-up ## Sobe o banco e executa a aplicação
	./gradlew :presenter-api:bootRun

# ── Tests ─────────────────────────────────────────────────────────────────────

test: ## Executa todos os testes (unitários + integração)
	./gradlew test

test-unit: ## Executa apenas os testes unitários (exclui @Testcontainers)
	./gradlew test -PexcludeTags=integration

test-integration: docker-up ## Sobe o banco e executa os testes de integração
	./gradlew test -PincludeTags=integration
```

Para que `test-unit` e `test-integration` funcionem com tags, adicionar no `build.gradle.kts` raiz:

```kotlin
subprojects {
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

Anotar testes de integração com `@Tag("integration")`:

```kotlin
@Tag("integration")
@DataJpaTest
@Testcontainers
class UserRepositoryImplTest { ... }
```