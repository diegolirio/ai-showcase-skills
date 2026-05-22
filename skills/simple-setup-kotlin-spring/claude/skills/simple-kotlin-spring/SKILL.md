---
name: simple-kotlin-spring
description: >
  Use this skill whenever the user is working on a Kotlin + Spring Boot project
  using a SIMPLIFIED multi-module layered architecture (buildingBlocks, core,
  presenter-api, presenter-consumer, presenter-job) WITHOUT the domain
  Repository interface and WITHOUT a RepositoryImpl. Handlers depend directly
  on the Spring Data `XJpaRepository`, and domain↔JPA mapping lives inside the
  JPA Entity itself (`toDomain()` / `fromDomain()`). Trigger this skill when
  the user mentions "simple", "simplificado", "sem interface de repositório",
  "sem RepositoryImpl", or explicitly asks for the simple-* variant. For the
  full DDD layered version (with `XRepository` interface), use the
  `kotlin-spring` skill instead.
---

# Simple Kotlin + Spring Boot — Multi-Module Skill

Variante enxuta de `kotlin-spring`. Mantém a arquitetura em camadas (Domain,
Application, Infrastructure) e BusinessRules, **mas remove a interface de
repositório no domínio e a classe `XRepositoryImpl`**. O Handler injeta
direto o `XJpaRepository` e usa os helpers `toDomain()`/`fromDomain()` da
própria JPA Entity.

> Trade-off consciente: simplifica em ~2 arquivos por aggregate ao custo de
> acoplar `core/application` a `core/infrastructure`. Recomendado para
> projetos pequenos, MVPs e provas de conceito.

---

## Criação de Projeto — Scaffolding Inicial

Mesmas perguntas da skill `kotlin-spring`:

```
1. Nome do projeto (ex: my-service)
2. Pacote base (ex: br.com.mycompany.myservice)
3. Módulos: buildingBlocks e core (obrigatórios) + presenter-api / presenter-consumer / presenter-job
4. Nomes dos módulos (aceitar defaults se não informado)
```

### Defaults dos nomes de módulo

| Módulo            | Nome default        | Descrição                          |
|-------------------|---------------------|------------------------------------|
| Contratos         | `buildingBlocks`    | Interfaces e abstrações            |
| Domínio + Infra   | `core`              | Domain, Application, Infrastructure|
| REST              | `presenter-api`     | Endpoints HTTP                     |
| Mensageria        | `presenter-consumer`| Consumers de mensagens             |
| Jobs              | `presenter-job`     | Jobs agendados                     |

Confirmar com resumo antes de gerar.

---

## Module Structure

```
root/
├── buildingBlocks/     ← Interfaces e abstrações compartilhadas (sem Spring)
├── core/               ← Domain + Application + Infrastructure
├── presenter-api/      ← REST HTTP
├── presenter-consumer/ ← Mensageria
└── presenter-job/      ← Jobs agendados
```

**Direção de dependência:** `presenter-*` → `core` → `buildingBlocks`.

---

## Module: buildingBlocks

Contém apenas **interfaces e classes base** — sem Spring, sem regra de negócio.

### Application contracts

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

### Domain contracts

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
```

---

## Module: core

### Package layout (SIMPLIFICADO — sem XRepository, sem XRepositoryImpl)

```
core/src/main/kotlin/<package>/
├── application/
│   └── <feature>/
│       ├── CreateXCommand.kt        ← extends CommandBase ou implements ResultCommand
│       ├── CreateXHandler.kt        ← injeta XJpaRepository DIRETO (sem interface de domínio)
│       ├── CreateXResult.kt         ← data class, suffix Result
│       ├── GetXQuery.kt             ← extends QueryBase
│       └── GetXHandler.kt           ← implements QueryHandler
├── domain/
│   └── <feature>/
│       ├── X.kt                     ← Entity de domínio, com create() / reconstitute()
│       ├── XId.kt                   ← extends Id
│       └── rules/
│           └── XMustBeValidRule.kt  ← extends BusinessRule
└── infrastructure/
    └── <feature>/
        ├── XEntity.kt               ← @Entity JPA com toDomain() e fromDomain()
        └── XJpaRepository.kt        ← interface : JpaRepository<XEntity, UUID>
```

> **Removidos em relação à skill `kotlin-spring`:**
> - `core/domain/<feature>/XRepository.kt`  (interface de domínio)
> - `core/infrastructure/<feature>/XRepositoryImpl.kt`  (adapter)

### Domain layer

```kotlin
// domain/user/UserId.kt
class UserId(id: UUID = UUID.randomUUID()) : Id(id)

// domain/user/rules/EmailMustBeValidRule.kt
class EmailMustBeValidRule(private val email: String) : BusinessRule(
    id = "USER_001",
    message = "Email '$email' não é válido",
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

        fun reconstitute(id: UserId, name: String, email: String) =
            User(id = id, name = name, email = email)
    }
}
```

> `reconstitute()` é usado pela JPA Entity em `toDomain()` para evitar
> re-rodar as BusinessRules em dados que já estão persistidos.

### Application layer

Handler injeta o `XJpaRepository` direto. Converte entre domínio e JPA usando
os helpers da Entity.

```kotlin
// application/user/CreateUserCommand.kt
class CreateUserCommand(val name: String, val email: String) : ResultCommand<CreateUserResult> {
    override val metadata: MutableMap<String, String?> = mutableMapOf()
}

// application/user/CreateUserHandler.kt
@Service
class CreateUserHandler(
    private val userJpaRepository: UserJpaRepository,
) : ResultCommandHandler<CreateUserCommand, CreateUserResult> {

    override fun handle(command: CreateUserCommand): CreateUserResult {
        val user = User.create(name = command.name, email = command.email)
        userJpaRepository.save(UserEntity.fromDomain(user))
        return CreateUserResult(id = user.id.value, name = user.name)
    }
}

// application/user/CreateUserResult.kt
data class CreateUserResult(val id: UUID, val name: String)
```

```kotlin
// application/user/GetUserQuery.kt — IMPORTANTE: nunca declarar val id no construtor (QueryBase já define)
class GetUserQuery(val userId: UUID) : QueryBase<GetUserResult>()

// application/user/GetUserHandler.kt
@Service
class GetUserHandler(
    private val userJpaRepository: UserJpaRepository,
) : QueryHandler<GetUserQuery, GetUserResult> {

    override fun handle(query: GetUserQuery): GetUserResult {
        val user = userJpaRepository.findById(query.userId).orElse(null)?.toDomain()
            ?: throw NoSuchElementException("User não encontrado: ${query.userId}")
        return GetUserResult(id = user.id.value, name = user.name, email = user.email)
    }
}
```

### Infrastructure layer

A JPA Entity carrega a responsabilidade do mapeamento via `toDomain()`
(instância) e `fromDomain()` (companion).

```kotlin
// infrastructure/user/UserEntity.kt
@Entity
@Table(name = "users")
class UserEntity(
    @Id
    @Column(columnDefinition = "UUID")
    val id: UUID = UUID.randomUUID(),

    @Column(nullable = false)
    val name: String,

    @Column(nullable = false, unique = true)
    val email: String,

    @Column(name = "created_at", nullable = false)
    val createdAt: OffsetDateTime = OffsetDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: OffsetDateTime = OffsetDateTime.now(),
) {
    fun toDomain() = User.reconstitute(
        id = UserId(this.id),
        name = this.name,
        email = this.email,
    )

    companion object {
        fun fromDomain(user: User) = UserEntity(
            id = user.id.value,
            name = user.name,
            email = user.email,
        )
    }
}

// infrastructure/user/UserJpaRepository.kt
interface UserJpaRepository : JpaRepository<UserEntity, UUID>
```

> **Não existe `UserRepository` (interface de domínio) nem `UserRepositoryImpl`.**
> Se o aggregate precisar de uma query custom (`findByEmail`, etc), adicione
> direto na `UserJpaRepository` como método Spring Data.

---

## Module: presenter-api

Routes, Requests e error handling **idênticos** à skill `kotlin-spring`.

```kotlin
// presenter/user/create/CreateUserRoute.kt
@RestController
@RequestMapping("/users")
@Tag(name = "User", description = "Operações de usuário")
class CreateUserRoute(private val createUserHandler: CreateUserHandler) {

    @PostMapping
    @Operation(summary = "Cria um novo usuário")
    @ApiResponse(responseCode = "201", description = "Criado com sucesso")
    @ApiResponse(responseCode = "400", description = "Request inválido")
    @ApiResponse(responseCode = "422", description = "Regra de negócio violada")
    fun create(@RequestBody @Valid request: CreateUserRequest): ResponseEntity<CreateUserResult> {
        val result = createUserHandler.handle(request.toCommand())
        return ResponseEntity.status(HttpStatus.CREATED).body(result)
    }
}

// presenter/user/create/CreateUserRequest.kt
data class CreateUserRequest(
    @field:NotBlank val name: String,
    @field:Email val email: String,
) {
    fun toCommand() = CreateUserCommand(name = name, email = email)
}
```

### Error handling — presenter-api

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
        ResponseEntity.status(HttpStatus.NOT_FOUND).body(ListErrorMessage(error = ex.message ?: "Not found"))

    @ExceptionHandler(Exception::class)
    fun handleGeneric(ex: Exception): ResponseEntity<ListErrorMessage> =
        ResponseEntity.internalServerError().body(ListErrorMessage(error = "Internal server error"))
}

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

| Exception                         | Status                       |
|-----------------------------------|------------------------------|
| `BusinessRulesBrokenException`    | `422 Unprocessable Entity`   |
| `MethodArgumentNotValidException` | `400 Bad Request`            |
| `NoSuchElementException`          | `404 Not Found`              |
| Outras                            | `500 Internal Server Error`  |

---

## Module: presenter-consumer

```kotlin
@Component
class UserCreatedConsumer(private val createUserHandler: CreateUserHandler) {

    @KafkaListener(topics = ["\${kafka.topics.user-created}"])
    fun consume(@Payload message: UserCreatedMessage) {
        createUserHandler.handle(message.toCommand())
    }
}

data class UserCreatedMessage(val name: String, val email: String) {
    fun toCommand() = CreateUserCommand(name = name, email = email)
}
```

---

## Module: presenter-job

```kotlin
@Component
class UserSyncJob(private val syncUsersHandler: SyncUsersHandler) {

    @Scheduled(cron = "\${jobs.user-sync.cron}")
    fun run() {
        syncUsersHandler.handle(SyncUsersCommand())
    }
}
```

---

## Naming Convention Summary

| Artifact         | Module              | Suffix       | Example                    |
|------------------|---------------------|--------------|----------------------------|
| HTTP endpoint    | presenter-api       | `Route`      | `CreateUserRoute`          |
| HTTP input DTO   | presenter-api       | `Request`    | `CreateUserRequest`        |
| Message handler  | presenter-consumer  | `Consumer`   | `UserCreatedConsumer`      |
| Message DTO      | presenter-consumer  | `Message`    | `UserCreatedMessage`       |
| Scheduled job    | presenter-job       | `Job`        | `UserSyncJob`              |
| Command          | core/application    | `Command`    | `CreateUserCommand`        |
| Query            | core/application    | `Query`      | `GetUserQuery`             |
| Handler          | core/application    | `Handler`    | `CreateUserHandler`        |
| Response body    | core/application    | `Result`     | `CreateUserResult`         |
| Domain entity    | core/domain         | *(none)*     | `User`                     |
| Typed ID         | core/domain         | `Id`         | `UserId`                   |
| Business rule    | core/domain/rules   | `Rule`       | `EmailMustBeValidRule`     |
| JPA entity       | core/infrastructure | `Entity`     | `UserEntity`               |
| Spring Data repo | core/infrastructure | `JpaRepository` | `UserJpaRepository`     |

> Note que **não há** `XRepository` nem `XRepositoryImpl` na coluna `core/domain` / `core/infrastructure`.

---

## Database — Flyway + PostgreSQL

```kotlin
// core/build.gradle.kts
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.flywaydb:flyway-database-postgresql")
    runtimeOnly("org.postgresql:postgresql")
}
```

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

springdoc:
  swagger-ui:
    path: /swagger-ui.html
```

Migration: `V{N}__{snake_case_description}.sql`. UUID via `gen_random_uuid()`.
Sempre `created_at` e `updated_at` em `TIMESTAMPTZ`.

```sql
-- V1__create_users_table.sql
CREATE TABLE users (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    email      TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Testing

| Camada                    | Estratégia                                                    |
|---------------------------|---------------------------------------------------------------|
| Domain rules / entities   | JUnit 5 + Kotest assertions                                   |
| Handlers (application)    | Mockk em cima de `XJpaRepository`                             |
| Routes (presenter-api)    | `@WebMvcTest` + MockMvc + `@MockkBean`                        |
| Integração com banco      | `@DataJpaTest` + Testcontainers (sobre o próprio JpaRepository)|

### Unit test — Handler com Mockk

Como o Handler injeta `XJpaRepository`, o mock retorna `Optional<XEntity>`:

```kotlin
class CreateUserHandlerTest {

    private val userJpaRepository = mockk<UserJpaRepository>()
    private val handler = CreateUserHandler(userJpaRepository)

    @Test
    fun `deve criar usuário e retornar result`() {
        every { userJpaRepository.save(any<UserEntity>()) } answers { firstArg() }

        val result = handler.handle(CreateUserCommand(name = "Ana", email = "ana@example.com"))

        result.name shouldBe "Ana"
        verify(exactly = 1) { userJpaRepository.save(any<UserEntity>()) }
    }

    @Test
    fun `deve lançar BusinessRulesBrokenException para email inválido`() {
        shouldThrow<BusinessRulesBrokenException> {
            handler.handle(CreateUserCommand(name = "Ana", email = "bad-email"))
        }
    }
}
```

### Integration test — JpaRepository com Testcontainers

```kotlin
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class UserJpaRepositoryTest {

    companion object {
        @Container
        val postgres = PostgreSQLContainer<Nothing>("postgres:16").apply {
            withDatabaseName("testdb"); withUsername("test"); withPassword("test")
        }

        @JvmStatic
        @DynamicPropertySource
        fun properties(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl)
            registry.add("spring.datasource.username", postgres::getUsername)
            registry.add("spring.datasource.password", postgres::getPassword)
        }
    }

    @Autowired lateinit var userJpaRepository: UserJpaRepository

    @Test
    fun `deve salvar e recuperar usuário`() {
        val user = User.create(name = "Ana", email = "ana@example.com")
        userJpaRepository.save(UserEntity.fromDomain(user))

        val found = userJpaRepository.findById(user.id.value).orElse(null)?.toDomain()
        found shouldNotBe null
        found!!.name shouldBe "Ana"
    }
}
```

### Dependências de teste

```kotlin
// core/build.gradle.kts
testImplementation("org.springframework.boot:spring-boot-starter-test")
testRuntimeOnly("org.junit.platform:junit-platform-launcher")
testImplementation("io.mockk:mockk:1.13.10")
testImplementation("io.kotest:kotest-assertions-core:5.8.1")
testImplementation("org.testcontainers:postgresql:1.19.7")
testImplementation("org.testcontainers:junit-jupiter:1.19.7")
```

```kotlin
// presenter-api/build.gradle.kts
implementation("org.springframework.boot:spring-boot-starter-web")
implementation("org.springframework.boot:spring-boot-starter-validation")
implementation("org.springframework.boot:spring-boot-starter-actuator")
implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.6")

testImplementation("org.springframework.boot:spring-boot-starter-test")
testRuntimeOnly("org.junit.platform:junit-platform-launcher")
testImplementation("io.mockk:mockk:1.13.10")
testImplementation("com.ninja-squad:springmockk:4.0.2")
testImplementation("io.kotest:kotest-assertions-core:5.8.1")
```

---

## Spring Boot Version

Sempre Spring Boot **3.x**. Constructor injection em tudo — nunca `@Autowired` em field.

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

## Docker Compose

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

## Makefile

```makefile
.PHONY: help build run test docker-up docker-down docker-logs

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

docker-up: ## Sobe o PostgreSQL
	docker compose up -d

docker-down: ## Derruba os containers
	docker compose down

docker-logs: ## Logs dos containers
	docker compose logs -f

build: ## Compila os módulos
	./gradlew build -x test

run: docker-up ## Sobe o banco e roda a API
	./gradlew :presenter-api:bootRun

test: ## Roda os testes
	./gradlew test
```

---

## Quando NÃO usar esta skill

- Domínio com múltiplas fontes de dados (Postgres + Mongo + cache + gRPC) — use `kotlin-spring`.
- Necessidade de mockar a "porta" do domínio independente de JPA nos testes — use `kotlin-spring`.
- Equipes com forte cultura DDD/Hexagonal que tratam a interface de repositório como contrato de domínio — use `kotlin-spring`.

Para tudo o mais (MVPs, serviços CRUD, projetos pessoais, prototipagem), esta
skill economiza ~2 arquivos por aggregate e mantém o resto da arquitetura
intacta.
