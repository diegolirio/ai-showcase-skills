---
name: setup-kotlin-crud
description: >
  Scaffolds a REST endpoint in a Kotlin + Spring Boot multi-module project using
  a lean layout (~5 files per feature): no domain `XRepository` or
  `XRepositoryImpl` (Handler injects `XJpaRepository` directly), Command+Handler+Result
  co-located, Route+Request co-located, minimal Swagger (`@Operation` only), one
  `@WebMvcTest` per endpoint. Use for MVP, many CRUD endpoints, stable Postgres,
  or when the user says "lean", "enxuto", "endpoint simples", "sem repository
  interface". Assumes `setup-kotlin-gradle` layout. For full DDD with domain
  repository port + adapter, use `crud-kotlin`. See README.md in this folder for
  rationale, token savings, and when to choose lean vs full.
---

# setup-kotlin-crud

Gera um endpoint REST completo com **~5 arquivos por feature**, mantendo camadas
(`buildingBlocks` → `core` → `presenter-api`) e cortando cerimônia sem benefício
em CRUD simples.

> Contexto e trade-offs (tokens, review, “deixar o Cursor organizar”):
> leia [README.md](./README.md) nesta pasta.

> Projeto novo: `setup-kotlin-gradle`. DDD completo com `XRepository`:
> `crud-kotlin`.

---

## Como usar

O usuário informa:
1. **Verbo HTTP** — GET, POST, PUT, DELETE, PATCH
2. **Path** — ex: `/users`
3. **JSON de exemplo** do body (quando aplicável)

Exemplo:
> `/setup-kotlin-crud POST /users com {"name":"Ana","email":"ana@example.com"}`

---

## Regras desta variante (obrigatórias)

### NÃO gerar

- `core/domain/{feature}/{X}Repository.kt`
- `core/infrastructure/{feature}/{X}RepositoryImpl.kt`
- Pasta `rules/` separada (rules inline em `{Aggregate}.kt` se ≤3 rules)
- Múltiplos `@ApiResponse` por rota (apenas `@Operation`)
- `RepositoryImplTest` por padrão
- `toCommand()` quando Request e Command têm os mesmos campos 1:1

### Gerar (~5 arquivos)

```
db/migration/V{N}__{table}.sql

core/.../{aggregate}/
  {Aggregate}.kt              # Id + Entity (+ rules inline)
  {Aggregate}Persistence.kt   # Jpa Entity + JpaRepository
  {Action}{Aggregate}.kt      # Command + Handler + Result (omitir Result se 204)

presenter-api/.../{aggregate}/{action}/
  {Action}{Aggregate}Endpoint.kt  # Route + Request

test (presenter-api ou core — preferir presenter-api):
  {Action}{Aggregate}Test.kt    # @WebMvcTest: happy + 400 + 422
```

### Limites de tamanho (se passar, separar Handler)

| Arquivo | Máx. linhas orientativo |
|---------|-------------------------|
| `{Action}{Aggregate}.kt` | ~120 |
| `{Action}{Aggregate}Endpoint.kt` | ~80 |
| `{Aggregate}.kt` | ~100 |
| `{Aggregate}Persistence.kt` | ~90 |

### Domain: factory condicional

- **Com ≥1 BusinessRule:** `private constructor`, `create()` com `checkAllRules()`, `reconstitute()` para `toDomain()`.
- **Sem BusinessRule:** `data class {Aggregate}(...)` simples; sem `reconstitute()`.

### Handler

- Injeta `{Aggregate}JpaRepository` diretamente.
- `save`: `{aggregate}JpaRepository.save({Aggregate}Entity.fromDomain(aggregate))`
- `find`: `jpa.findById(id).orElse(null)?.toDomain()`

### Request → Command

- Campos 1:1: Route chama `handler.handle(CreateUserCommand(name = request.name, ...))` **ou** Request com `fun toCommand()` se houver transformação.
- Nunca colocar lógica de negócio no Route.

### Swagger

```kotlin
@Tag(name = "User", description = "Operações de usuário")
@Operation(summary = "Cria um novo usuário")
```

Sem `@ApiResponse` por método (o `GlobalExceptionHandler` do projeto já padroniza 400/422/404/500).

---

## Naming (igual ao ecossistema)

| Artefato | Sufixo | Exemplo |
|----------|--------|---------|
| Endpoint (Route+Request) | `Endpoint` | `CreateUserEndpoint` |
| Application slice | `{Action}{Aggregate}` | `CreateUser.kt` |
| Handler / Command / Result | dentro do slice | `CreateUserHandler` |
| Domain | — | `User` |
| Typed ID | `Id` | `UserId` |
| Business rule | `Rule` | `EmailMustBeValidRule` |
| JPA | `Entity` / `JpaRepository` | `UserEntity`, `UserJpaRepository` |
| Persistence file | `Persistence` | `UserPersistence.kt` |

---

## Passo 1 — Deduzir contexto

| Informação | Como deduzir |
|------------|--------------|
| **Aggregate** | Primeiro segmento do path, singular (`/users` → `User`) |
| **Ação** | Verbo + path (`POST /users` → `Create`) |
| **Handler** | POST/PUT/PATCH/DELETE → Command; GET → Query |
| **Migration** | Próximo `V{N}` — perguntar ou inferir sequencial |
| **Retorno** | **Sempre perguntar:** 201/200 + body ou 204? |

---

## Passo 2 — Confirmar

```
Vou gerar (lean, ~5 arquivos) para POST /users:

  V{N}__create_users_table.sql
  core/.../user/User.kt
  core/.../user/UserPersistence.kt
  core/.../user/CreateUser.kt
  presenter-api/.../user/create/CreateUserEndpoint.kt
  presenter-api/.../user/create/CreateUserTest.kt

NÃO geramos: UserRepository, UserRepositoryImpl

Retorno: 201 + body ou 204?
Pode prosseguir?
```

---

## Passo 3 — Gerar arquivos

### 3.1 Migration

```sql
CREATE TABLE {table} (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    {campos},
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

JSON → PostgreSQL: String→`TEXT`, numérico→`BIGINT`/`NUMERIC`, datas→`TIMESTAMPTZ`.
Índice em email/cpf/código na mesma migration quando óbvio.

---

### 3.2 `{Aggregate}.kt` (domain)

```kotlin
class UserId(id: UUID = UUID.randomUUID()) : Id(id)

class EmailMustBeValidRule(private val email: String) : BusinessRule(
    id = "USER_001",
    message = "Email '$email' não é válido",
) {
    override fun isBroken() = !email.contains("@")
}

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

---

### 3.3 `{Aggregate}Persistence.kt`

```kotlin
@Entity
@Table(name = "users")
class UserEntity(
    @Id @Column(columnDefinition = "UUID")
    val id: UUID = UUID.randomUUID(),
    @Column(nullable = false) val name: String,
    @Column(nullable = false, unique = true) val email: String,
    @Column(name = "created_at", nullable = false)
    val createdAt: OffsetDateTime = OffsetDateTime.now(),
    @Column(name = "updated_at", nullable = false)
    var updatedAt: OffsetDateTime = OffsetDateTime.now(),
) {
    fun toDomain() = User.reconstitute(
        id = UserId(id), name = name, email = email,
    )
    companion object {
        fun fromDomain(user: User) = UserEntity(
            id = user.id.value, name = user.name, email = user.email,
        )
    }
}

interface UserJpaRepository : JpaRepository<UserEntity, UUID>
```

---

### 3.4 `{Action}{Aggregate}.kt` (application)

**201/200 + Result:**
```kotlin
class CreateUserCommand(
    val name: String,
    val email: String,
    override val metadata: MutableMap<String, String?> = mutableMapOf(),
) : ResultCommand<CreateUserResult>

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

data class CreateUserResult(val id: UUID, val name: String)
```

**204:** `CommandBase` + `CommandHandler`, sem `Result`.

**GET:** `QueryBase` — nunca `val id` no construtor; usar `{aggregate}Id`:

```kotlin
class GetUserQuery(val userId: UUID) : QueryBase<GetUserResult>()

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

---

### 3.5 `{Action}{Aggregate}Endpoint.kt` (presenter)

```kotlin
@RestController
@RequestMapping("/users")
@Tag(name = "User", description = "Operações de usuário")
class CreateUserEndpoint(
    private val createUserHandler: CreateUserHandler,
) {

    @PostMapping
    @Operation(summary = "Cria um novo usuário")
    fun create(
        @RequestBody @Valid request: CreateUserRequest,
    ): ResponseEntity<CreateUserResult> {
        val result = createUserHandler.handle(
            CreateUserCommand(name = request.name, email = request.email),
        )
        return ResponseEntity.status(HttpStatus.CREATED).body(result)
    }
}

data class CreateUserRequest(
    @field:NotBlank val name: String,
    @field:Email val email: String,
)
```

GET: `@GetMapping("/{id}")` + `GetUserQuery(id)`.

204: `ResponseEntity.noContent().build()` após `handler.handle(command)`.

---

### 3.6 `{Action}{Aggregate}Test.kt`

Um arquivo, `@WebMvcTest({Action}{Aggregate}Endpoint::class)`:

- Happy path (201/200)
- 422: handler mockado lança `BusinessRulesBrokenException` — JSON **válido** no DTO
- 400: JSON com campos inválidos (não `{}` vazio)

```kotlin
@WebMvcTest(CreateUserEndpoint::class)
class CreateUserTest {

    @Autowired lateinit var mockMvc: MockMvc
    @MockkBean lateinit var createUserHandler: CreateUserHandler

    @Test
    fun `POST users retorna 201`() { /* ... */ }

    @Test
    fun `POST users retorna 422 quando regra violada`() { /* ... */ }

    @Test
    fun `POST users retorna 400 quando request invalido`() { /* ... */ }
}
```

**Opcional (só se usuário pedir):** `{Aggregate}JpaRepositoryTest` com Testcontainers.

---

## Ordem de entrega

1. Migration  
2. `{Aggregate}.kt`  
3. `{Aggregate}Persistence.kt`  
4. `{Action}{Aggregate}.kt`  
5. `{Action}{Aggregate}Endpoint.kt`  
6. `{Action}{Aggregate}Test.kt`

---

## Checklist

- [ ] ~5 arquivos; sem `XRepository` / `XRepositoryImpl`
- [ ] Handler injeta `XJpaRepository`
- [ ] `toDomain()` / `fromDomain()` em `XEntity` (arquivo Persistence)
- [ ] `reconstitute()` só se houver BusinessRule
- [ ] Query sem `val id` no construtor
- [ ] Arquivos dentro dos limites de linhas
- [ ] Teste cobre 201/200, 400, 422
- [ ] Swagger: `@Tag` + `@Operation` apenas

---

## Escalar para full DDD

Se um aggregate precisar de porta de domínio mockável ou troca de persistência,
refatorar **só esse aggregate** com `crud-kotlin` (gerar `XRepository` +
`XRepositoryImpl` e mover lógica do Handler).
