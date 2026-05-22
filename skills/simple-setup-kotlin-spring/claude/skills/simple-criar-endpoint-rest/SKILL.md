---
name: simple-criar-endpoint-rest
description: >
  Use this skill whenever the user wants to scaffold a complete REST endpoint
  in a Kotlin + Spring Boot multi-module project that follows the SIMPLIFIED
  layout (no domain Repository interface, no RepositoryImpl). Triggers:
  "criar endpoint simples", "gerar endpoint simples", "novo endpoint simple",
  "scaffolding de endpoint simples", or when the user is working in a project
  whose conventions are set by the `simple-kotlin-spring` skill. The skill
  generates: Route, Request, Command/Query, Handler (consumes `XJpaRepository`
  directly), Result, domain Entity, BusinessRules, JPA Entity (with
  `toDomain()` / `fromDomain()`), `XJpaRepository`, Flyway migration SQL, and
  tests. For the full DDD version (with `XRepository` interface), use the
  `criar-endpoint-rest` skill instead.
---

# Skill: simple-criar-endpoint-rest

Variante enxuta de `criar-endpoint-rest`. Gera toda a estrutura de um
endpoint REST de uma vez, **sem `XRepository` (interface no domínio) e sem
`XRepositoryImpl`**. O Handler injeta `XJpaRepository` direto e usa
`XEntity.toDomain()` / `XEntity.fromDomain()` para o mapeamento.

> Use junto com a skill `simple-kotlin-spring`.

---

## Como usar

O usuário informa:
1. **Verbo HTTP** — GET, POST, PUT, DELETE, PATCH
2. **Path** — ex: `/users`, `/orders/list`
3. **JSON de exemplo** do request body (quando aplicável)

Exemplo:
> "Criar endpoint POST /users com esse json: `{"name": "Ana", "email": "ana@example.com"}`"

---

## Passo 1 — Deduzir contexto

| Informação | Como deduzir | Exemplo |
|---|---|---|
| **Aggregate** | Primeiro segmento do path, singular | `/users` → `User` |
| **Ação** | Verbo + segmento adicional se houver | `POST /users` → `Create`, `POST /users/list` → `List` |
| **Tipo de handler** | POST/PUT/PATCH/DELETE → `Command`, GET → `Query` | |
| **Próximo número de migration** | Perguntar ao usuário ou assumir o próximo sequencial | |
| **Retorno do endpoint** | **Sempre perguntar**: retorna body (201/200 + Result) ou 204 sem body? | |

---

## Passo 2 — Confirmar e gerar

```
Vou gerar os seguintes arquivos para POST /users:

presenter-api/
  └── presenter/user/create/
      ├── CreateUserRoute.kt
      └── CreateUserRequest.kt

core/
  └── application/user/
      ├── CreateUserCommand.kt
      ├── CreateUserHandler.kt          ← injeta UserJpaRepository direto
      └── CreateUserResult.kt           ← (omitir se 204)
  └── domain/user/
      ├── User.kt
      ├── UserId.kt
      └── rules/
          └── UserEmailMustBeValidRule.kt
  └── infrastructure/user/
      ├── UserEntity.kt                 ← @Entity + toDomain() + fromDomain()
      └── UserJpaRepository.kt          ← Spring Data interface

db/migration/
  └── V{N}__create_users_table.sql

Testes:
  ├── CreateUserHandlerTest.kt
  ├── UserJpaRepositoryTest.kt          ← @DataJpaTest + Testcontainers
  └── CreateUserRouteTest.kt

NÃO geramos:
  ✗ UserRepository.kt        (interface no domínio — removida na variante simple)
  ✗ UserRepositoryImpl.kt    (adapter — removido na variante simple)

Pode prosseguir? E o endpoint retorna o recurso (201/200 + body) ou 204 sem body?
```

---

## Passo 3 — Gerar os arquivos

Gerar **todos os arquivos abaixo**, um por um, com o código completo.

### 3.1 Flyway Migration (primeiro)

UUID gerado pelo banco com `gen_random_uuid()`. Mapeamento JSON → PostgreSQL:

| Kotlin/JSON type            | PostgreSQL type                       |
|-----------------------------|---------------------------------------|
| String (genérico/email/url) | `TEXT`                                |
| Int / Long                  | `BIGINT`                              |
| Boolean                     | `BOOLEAN`                             |
| LocalDate                   | `DATE`                                |
| LocalDateTime / OffsetDateTime | `TIMESTAMPTZ`                      |
| Double / BigDecimal         | `NUMERIC(precision, scale)`           |
| Enum                        | `TEXT` com comentário de valores      |

```sql
-- V{N}__{snake_case_table_name}.sql
CREATE TABLE {table_name} (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    {campos do JSON mapeados},
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Regras:
- Todos os campos do JSON como `NOT NULL` por padrão.
- Adicionar índice em colunas óbvias de busca (email, cpf, código) na mesma migration.
- Sempre incluir `created_at` e `updated_at`.

---

### 3.2 Domain Layer (core/domain)

**`{Aggregate}Id.kt`**
```kotlin
class {Aggregate}Id(id: UUID = UUID.randomUUID()) : Id(id)
```

**`{Aggregate}.kt`** — entidade de domínio
```kotlin
class {Aggregate} private constructor(
    val id: {Aggregate}Id,
    // um campo por propriedade do JSON
) : Entity() {
    companion object {
        fun create(/* parâmetros */): {Aggregate} {
            checkAllRules(
                // uma rule por invariante identificada
            )
            return {Aggregate}(id = {Aggregate}Id(), /* campos */)
        }

        fun reconstitute(id: {Aggregate}Id, /* demais campos */): {Aggregate} =
            {Aggregate}(id = id, /* demais campos */)
    }
}
```

> **`reconstitute()` é obrigatório** — `XEntity.toDomain()` usa essa factory
> para evitar re-executar BusinessRules em dados já persistidos.

**`rules/{Campo}MustBe{Regra}Rule.kt`** — gerar uma rule por campo com invariante óbvia:

```kotlin
class {Campo}MustBe{Regra}Rule(private val value: String) : BusinessRule(
    id = "{AGGREGATE}_{NNN}",   // ex: USER_001
    message = "{Mensagem clara em português}"
) {
    override fun isBroken(): Boolean = // lógica da regra
}
```

> **NÃO gerar `{Aggregate}Repository.kt`** — essa é a diferença principal
> em relação à skill `criar-endpoint-rest`.

---

### 3.3 Infrastructure Layer (core/infrastructure)

**`{Aggregate}Entity.kt`** — JPA entity com `toDomain()` e `fromDomain()` embutidos.

```kotlin
@Entity
@Table(name = "{table_name}")
class {Aggregate}Entity(
    @Id
    @Column(columnDefinition = "UUID")
    val id: UUID = UUID.randomUUID(),

    @Column(name = "{snake_field}", nullable = false)
    val {camelField}: {Type},

    @Column(name = "created_at", nullable = false)
    val createdAt: OffsetDateTime = OffsetDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: OffsetDateTime = OffsetDateTime.now(),
) {
    fun toDomain() = {Aggregate}.reconstitute(
        id = {Aggregate}Id(this.id),
        // mapear cada campo
    )

    companion object {
        fun fromDomain({aggregate}: {Aggregate}) = {Aggregate}Entity(
            id = {aggregate}.id.value,
            // mapear cada campo
        )
    }
}
```

**`{Aggregate}JpaRepository.kt`**
```kotlin
interface {Aggregate}JpaRepository : JpaRepository<{Aggregate}Entity, UUID> {
    // adicionar queries customizadas aqui se necessário, ex:
    // fun findByEmail(email: String): {Aggregate}Entity?
}
```

> **NÃO gerar `{Aggregate}RepositoryImpl.kt`** — não existe na variante simple.

---

### 3.4 Application Layer (core/application)

**Para POST/PUT/PATCH/DELETE → Command + Handler**

Regra de qual interface usar no Command:
- Retorna resultado (201/200 + body) → implementa `ResultCommand<{Action}{Aggregate}Result>`.
- Não retorna resultado (204) → estende `CommandBase`.

```kotlin
// {Action}{Aggregate}Command.kt  — retorna resultado (201/200)
class {Action}{Aggregate}Command(
    // um campo por propriedade do JSON
    override val metadata: MutableMap<String, String?> = mutableMapOf(),
) : ResultCommand<{Action}{Aggregate}Result>

// {Action}{Aggregate}Command.kt  — sem resultado (204)
class {Action}{Aggregate}Command(
    // um campo por propriedade do JSON
) : CommandBase()

// {Action}{Aggregate}Handler.kt
@Service
class {Action}{Aggregate}Handler(
    private val {aggregate}JpaRepository: {Aggregate}JpaRepository,
) : ResultCommandHandler<{Action}{Aggregate}Command, {Action}{Aggregate}Result> {
    // ou CommandHandler<{Action}{Aggregate}Command> se 204

    override fun handle(command: {Action}{Aggregate}Command): {Action}{Aggregate}Result {
        val {aggregate} = {Aggregate}.create(/* campos do command */)
        {aggregate}JpaRepository.save({Aggregate}Entity.fromDomain({aggregate}))
        return {Action}{Aggregate}Result(/* campos */)
    }
}

// {Action}{Aggregate}Result.kt  (omitir se 204)
data class {Action}{Aggregate}Result(
    val id: UUID,
    // demais campos relevantes
)
```

**Para GET → Query + QueryHandler**

> Atenção: `QueryBase` já define `final id: UUID`. Nunca declarar `val id` no
> construtor — use o nome do campo de negócio, ex: `{aggregate}Id`, `userId`.

```kotlin
// Get{Aggregate}Query.kt
class Get{Aggregate}Query(val {aggregate}Id: UUID) : QueryBase<Get{Aggregate}Result>()

// Get{Aggregate}Handler.kt
@Service
class Get{Aggregate}Handler(
    private val {aggregate}JpaRepository: {Aggregate}JpaRepository,
) : QueryHandler<Get{Aggregate}Query, Get{Aggregate}Result> {

    override fun handle(query: Get{Aggregate}Query): Get{Aggregate}Result {
        val {aggregate} = {aggregate}JpaRepository.findById(query.{aggregate}Id)
            .orElse(null)?.toDomain()
            ?: throw NoSuchElementException("{Aggregate} não encontrado: ${query.{aggregate}Id}")
        return Get{Aggregate}Result(/* campos do aggregate */)
    }
}
```

---

### 3.5 Presenter Layer (presenter-api)

Cada endpoint tem seu **próprio arquivo de Route**, organizado por aggregate
e ação:

```
presenter/{aggregate}/
  {action}/
    {Action}{Aggregate}Route.kt
    {Action}{Aggregate}Request.kt   ← quando há request body
```

Exemplo para `POST /users` e `GET /users/{id}`:
```
presenter/user/
  create/
    CreateUserRoute.kt
    CreateUserRequest.kt
  get/
    GetUserByIdRoute.kt
```

**`{Action}{Aggregate}Route.kt`** — sempre com Swagger (`@Tag`, `@Operation`, `@ApiResponse`).

POST retornando body (201):
```kotlin
@RestController
@RequestMapping("/{path}")
@Tag(name = "{Aggregate}", description = "Operações de {aggregate}")
class {Action}{Aggregate}Route(private val {action}{Aggregate}Handler: {Action}{Aggregate}Handler) {

    @PostMapping
    @Operation(summary = "{Descrição curta}")
    @ApiResponse(responseCode = "201", description = "Criado com sucesso")
    @ApiResponse(responseCode = "400", description = "Request inválido")
    @ApiResponse(responseCode = "422", description = "Regra de negócio violada")
    fun {action}(@RequestBody @Valid request: {Action}{Aggregate}Request): ResponseEntity<{Action}{Aggregate}Result> {
        val result = {action}{Aggregate}Handler.handle(request.toCommand())
        return ResponseEntity.status(HttpStatus.CREATED).body(result)
    }
}
```

POST sem body (204):
```kotlin
@PostMapping
@ApiResponse(responseCode = "204", description = "Executado com sucesso")
fun {action}(@RequestBody @Valid request: {Action}{Aggregate}Request): ResponseEntity<Void> {
    {action}{Aggregate}Handler.handle(request.toCommand())
    return ResponseEntity.noContent().build()
}
```

GET por id:
```kotlin
@GetMapping("/{id}")
@Operation(summary = "{Descrição curta}")
@ApiResponse(responseCode = "200", description = "Encontrado")
@ApiResponse(responseCode = "404", description = "Não encontrado")
fun {action}(@PathVariable id: UUID): ResponseEntity<{Action}{Aggregate}Result> {
    val result = {action}{Aggregate}Handler.handle({Action}{Aggregate}Query(id))
    return ResponseEntity.ok(result)
}
```

**`{Action}{Aggregate}Request.kt`** — mesma pasta da Route:
```kotlin
data class {Action}{Aggregate}Request(
    // String genérica → @field:NotBlank
    // Email → @field:Email
    // Numérico positivo → @field:Positive
    // Lista → @field:NotEmpty
) {
    fun toCommand() = {Action}{Aggregate}Command(/* mapeamento direto */)
}
```

---

### 3.6 Testes

**`{Aggregate}JpaRepositoryTest.kt`** (core, integration test com Testcontainers)

Substitui o antigo `{Aggregate}RepositoryImplTest`. Como não há
`RepositoryImpl`, testamos o `JpaRepository` direto + a conversão da Entity.

Dependências em `core/build.gradle.kts`:
```kotlin
testImplementation("org.testcontainers:postgresql:1.19.7")
testImplementation("org.testcontainers:junit-jupiter:1.19.7")
testRuntimeOnly("org.junit.platform:junit-platform-launcher")
```

O módulo `core` não tem `@SpringBootApplication`. Criar em `core/src/test`:
```kotlin
// {package}/TestCoreApplication.kt
@SpringBootApplication
class TestCoreApplication
```

```kotlin
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class {Aggregate}JpaRepositoryTest {

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

    @Autowired
    lateinit var {aggregate}JpaRepository: {Aggregate}JpaRepository

    @Test
    fun `deve salvar e recuperar {aggregate}`() {
        val {aggregate} = {Aggregate}.create(/* campos válidos */)

        {aggregate}JpaRepository.save({Aggregate}Entity.fromDomain({aggregate}))

        val found = {aggregate}JpaRepository.findById({aggregate}.id.value)
            .orElse(null)?.toDomain()
        found shouldNotBe null
        found!!.id shouldBe {aggregate}.id
    }
}
```

---

**`{Action}{Aggregate}HandlerTest.kt`** (core, unit test)

Como o Handler injeta `XJpaRepository`, mockamos ele.

> Cuidado: o `save()` do JPA retorna a entidade. Use
> `answers { firstArg() }` para devolver o que entrou.

```kotlin
class {Action}{Aggregate}HandlerTest {

    private val {aggregate}JpaRepository = mockk<{Aggregate}JpaRepository>()
    private val handler = {Action}{Aggregate}Handler({aggregate}JpaRepository)

    @Test
    fun `deve criar {aggregate} e retornar result`() {
        every { {aggregate}JpaRepository.save(any<{Aggregate}Entity>()) } answers { firstArg() }

        val result = handler.handle(
            {Action}{Aggregate}Command(/* campos válidos do JSON */)
        )

        result.id shouldNotBe null
        verify(exactly = 1) { {aggregate}JpaRepository.save(any<{Aggregate}Entity>()) }
    }

    @Test
    fun `deve lancar BusinessRulesBrokenException quando {campo} invalido`() {
        // um teste por BusinessRule gerada
        shouldThrow<BusinessRulesBrokenException> {
            handler.handle(
                {Action}{Aggregate}Command(/* campo inválido */)
            )
        }
    }
}
```

Para Handler de GET:
```kotlin
@Test
fun `deve retornar {aggregate} quando encontrado`() {
    val id = UUID.randomUUID()
    every { {aggregate}JpaRepository.findById(id) } returns
        Optional.of({Aggregate}Entity(id = id, /* demais campos */))

    val result = handler.handle(Get{Aggregate}Query(id))

    result.id shouldBe id
}

@Test
fun `deve lancar NoSuchElementException quando nao encontrado`() {
    every { {aggregate}JpaRepository.findById(any()) } returns Optional.empty()

    shouldThrow<NoSuchElementException> {
        handler.handle(Get{Aggregate}Query(UUID.randomUUID()))
    }
}
```

---

**`{Action}{Aggregate}RouteTest.kt`** (presenter-api, `@WebMvcTest`) — um arquivo por Route.

```kotlin
@WebMvcTest({Action}{Aggregate}Route::class)
class {Action}{Aggregate}RouteTest {

    @Autowired lateinit var mockMvc: MockMvc
    @MockkBean lateinit var {action}{Aggregate}Handler: {Action}{Aggregate}Handler

    @Test
    fun `POST {path} deve retornar 201 com result`() {
        every { {action}{Aggregate}Handler.handle(any()) } returns
            {Action}{Aggregate}Result(id = UUID.randomUUID(), /* demais campos */)

        mockMvc.post("/{path}") {
            contentType = MediaType.APPLICATION_JSON
            content = """{ /* JSON de exemplo fornecido pelo usuário */ }"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.id") { isNotEmpty() }
        }
    }

    @Test
    fun `POST {path} deve retornar 422 quando regra de negocio violada`() {
        every { {action}{Aggregate}Handler.handle(any()) } throws
            BusinessRulesBrokenException(listOf(/* primeira rule gerada */))

        // JSON com dados VÁLIDOS do ponto de vista do DTO (@field:Email, etc.)
        // para passar a validação e chegar no handler mockado
        mockMvc.post("/{path}") {
            contentType = MediaType.APPLICATION_JSON
            content = """{ /* JSON com todos os campos válidos */ }"""
        }.andExpect {
            status { isUnprocessableEntity() }
            jsonPath("$.error") { value("Business rule violation") }
        }
    }

    @Test
    fun `POST {path} deve retornar 400 quando request invalido`() {
        // Campos com valores inválidos (NÃO JSON vazio {}). JSON vazio dispara
        // HttpMessageNotReadableException em data classes Kotlin; campos inválidos
        // disparam MethodArgumentNotValidException → 400.
        mockMvc.post("/{path}") {
            contentType = MediaType.APPLICATION_JSON
            content = """{ /* campos com valores inválidos: strings vazias, números negativos */ }"""
        }.andExpect {
            status { isBadRequest() }
        }
    }
}
```

---

## Ordem de entrega dos arquivos

1. Migration SQL
2. Domain — Id, Entity, BusinessRules
3. Infrastructure — JPA Entity, JpaRepository
4. Application — Command/Query, Handler, Result
5. Presenter — `{Action}{Aggregate}Route.kt` e `{Action}{Aggregate}Request.kt`
6. Testes — JpaRepositoryTest, HandlerTest, RouteTest

---

## Checklist antes de entregar

- [ ] Todos os campos do JSON estão mapeados em todos os arquivos
- [ ] Migration usa `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- [ ] JPA Entity tem `@Column(columnDefinition = "UUID")` no id
- [ ] `toCommand()` está no Request (não no Handler)
- [ ] Cada endpoint tem sua própria Route em `presenter/{aggregate}/{action}/`
- [ ] Request body fica na mesma pasta da Route que o usa
- [ ] Route tem `@Tag`, `@Operation` e `@ApiResponse` do Swagger
- [ ] `toDomain()` e `fromDomain()` estão em `{Aggregate}Entity`
- [ ] **NÃO foi gerado `{Aggregate}Repository.kt` (interface no domínio)**
- [ ] **NÃO foi gerado `{Aggregate}RepositoryImpl.kt`**
- [ ] **Handler injeta `{Aggregate}JpaRepository` diretamente**
- [ ] `{Aggregate}` tem `reconstitute()` no companion (usado por `toDomain()`)
- [ ] BusinessRules têm IDs únicos no formato `{AGGREGATE}_{NNN}`
- [ ] Testes cobrem: caminho feliz, violação de BusinessRule, request inválido (400)
- [ ] `{Aggregate}JpaRepositoryTest` gerado com Testcontainers cobrindo `save` + `findById`
- [ ] Se 204: Command estende `CommandBase`, Handler implementa `CommandHandler`, sem `Result`
- [ ] Se 201/200: Command implementa `ResultCommand<{Result}>`, Handler implementa `ResultCommandHandler`
- [ ] Query nunca declara `val id` no construtor — `QueryBase` já define; usar `{aggregate}Id`

---

## Variações por verbo

| Verbo | Handler base | Suffix Command/Query | Retorno típico |
|---|---|---|---|
| POST (criar)         | `ResultCommandHandler` ou `CommandHandler` | `Command` | 201 + Result ou 204 |
| PUT / PATCH          | `ResultCommandHandler` ou `CommandHandler` | `Command` | 200 + Result ou 204 |
| DELETE               | `CommandHandler`                           | `Command` | 204                 |
| GET (por id)         | `QueryHandler`                             | `Query`   | 200 + Result        |
| GET / POST listagem  | `QueryHandler`                             | `Query`   | 200 + List<Result>  |

---

## Diferenças vs. `criar-endpoint-rest` (skill completa)

| Aspecto                                      | criar-endpoint-rest       | simple-criar-endpoint-rest |
|----------------------------------------------|---------------------------|----------------------------|
| `core/domain/{feature}/{X}Repository.kt`     | ✅ Gera (interface)       | ❌ Não gera                |
| `core/infrastructure/{feature}/{X}RepositoryImpl.kt` | ✅ Gera           | ❌ Não gera                |
| Handler injeta...                            | `{X}Repository` (domínio) | `{X}JpaRepository` (Spring Data) |
| Mapeamento domain↔JPA fica em...             | `{X}Entity` (toDomain/fromDomain) | `{X}Entity` (igual) |
| Teste de integração de DB                    | `{X}RepositoryImplTest`   | `{X}JpaRepositoryTest`     |
| Acoplamento `core/application` → JPA         | Não (depende só do domain)| Sim (importa Entity + JpaRepository) |
| Arquivos por aggregate                       | ~12                       | ~10                        |

Use a variante simple quando:
- O projeto é um MVP, CRUD simples ou prova de conceito;
- Não há plano de trocar de fonte de dados;
- Velocidade > pureza arquitetural.
