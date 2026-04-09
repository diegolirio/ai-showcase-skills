---
name: criar-endpoint-rest
description: >
  Use this skill whenever the user wants to scaffold a complete REST endpoint
  in a Kotlin + Spring Boot multi-module project. Triggers include: "criar endpoint",
  "gerar endpoint", "novo endpoint", "criar rota", "criar POST/GET/PUT/DELETE/PATCH",
  "scaffolding de endpoint", or when the user provides an HTTP verb + path + JSON example
  (e.g. "POST /users com esse json"). This skill generates ALL artifacts in one shot:
  Route, Request, Command/Query, Handler, Result, domain Entity, BusinessRules,
  Repository interface + impl, JPA Entity, Flyway migration SQL, and tests.
  Always use this skill instead of generating files ad-hoc. Requires kotlin-spring skill
  conventions to be active.
---

# Skill: criar-endpoint-rest

Gera toda a estrutura de um endpoint REST de uma vez, seguindo as convenções do
projeto multi-módulo Kotlin + Spring Boot.

---

## Como usar

O usuário informa:
1. **Verbo HTTP** — GET, POST, PUT, DELETE, PATCH
2. **Path** — ex: `/users`, `/orders/list`
3. **JSON de exemplo** do request body (quando aplicável)

Exemplo de invocação:
> "Criar endpoint POST /users com esse json: `{"name": "Ana", "email": "ana@example.com"}`"

---

## Passo 1 — Deduzir contexto

A partir do path e verbo, deduzir automaticamente:

| Informação | Como deduzir | Exemplo |
|---|---|---|
| **Aggregate** | Primeiro segmento do path, singular | `/users` → `User` |
| **Ação** | Verbo + segmento adicional se houver | `POST /users` → `Create`, `POST /users/list` → `List` |
| **Tipo de handler** | POST/PUT/PATCH/DELETE → `Command`, GET → `Query` | |
| **Próximo número de migration** | Perguntar ao usuário ou assumir o próximo sequencial | |
| **Retorno do endpoint** | **Sempre perguntar** antes de gerar: retorna body (Result + 201) ou sem body (204)? | |

**Nunca adivinhe o retorno** — sempre confirme com o usuário antes de gerar.

---

## Passo 2 — Confirmar e gerar

Após deduzir, apresente um resumo do que será gerado e pergunte se pode prosseguir:

```
Vou gerar os seguintes arquivos para POST /users:

presenter-api/
  └── presenter/user/
      └── create/
          ├── CreateUserRoute.kt
          └── CreateUserRequest.kt

core/
  └── application/user/
      ├── CreateUserCommand.kt
      ├── CreateUserHandler.kt
      └── CreateUserResult.kt         ← (confirmar: retorna body ou 204?)
  └── domain/user/
      ├── User.kt
      ├── UserId.kt
      ├── UserRepository.kt
      └── rules/
          └── UserEmailMustBeValidRule.kt
  └── infrastructure/user/
      ├── UserEntity.kt
      ├── UserJpaRepository.kt
      └── UserRepositoryImpl.kt

db/migration/
  └── V{N}__create_users_table.sql

Testes:
  ├── CreateUserHandlerTest.kt
  └── UserRouteTest.kt

Pode prosseguir? E o endpoint retorna o recurso criado (201 + body) ou 204 sem body?
```

---

## Passo 3 — Gerar os arquivos

Gere **todos os arquivos abaixo**, um por um, com o código completo.

### 3.1 Flyway Migration (gerar primeiro)

UUID gerado pelo banco com `gen_random_uuid()`. Mapear cada campo do JSON para
o tipo PostgreSQL mais adequado:

| Kotlin/JSON type | PostgreSQL type |
|---|---|
| String (genérico) | `TEXT` |
| String (email, url, código) | `TEXT` |
| String (nome próprio) | `TEXT` |
| Int / Long | `BIGINT` |
| Boolean | `BOOLEAN` |
| LocalDate | `DATE` |
| LocalDateTime / OffsetDateTime | `TIMESTAMPTZ` |
| Double / BigDecimal | `NUMERIC(precision, scale)` |
| Enum | `TEXT` com comentário de valores válidos |

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
- Todos os campos do JSON como `NOT NULL` por padrão, salvo indicação contrária
- Adicionar índice em coluna de busca óbvia (email, cpf, código) na mesma migration
- Sempre incluir `created_at` e `updated_at`

---

### 3.2 Domain Layer (core/domain)

**`{Aggregate}Id.kt`**
```kotlin
class {Aggregate}Id(id: UUID = UUID.randomUUID()) : Id(id)
// Nota: Id base usa UUID quando banco gera o ID; adaptar se necessário
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
    }
}
```

**`{Aggregate}Repository.kt`** — interface apenas, sem implementação
```kotlin
interface {Aggregate}Repository {
    fun save({aggregate}: {Aggregate})
    // adicionar findById se o endpoint retornar o recurso criado
}
```

**`rules/{Campo}MustBe{Regra}Rule.kt`** — gerar uma rule por campo que tenha
invariante óbvia no JSON (email → formato válido, nome → não em branco, valor → positivo):

```kotlin
class {Campo}MustBe{Regra}Rule(private val value: String) : BusinessRule(
    id = "{AGGREGATE}_{NNN}",   // ex: USER_001, ORDER_001
    message = "{Mensagem clara em português}"
) {
    override fun isBroken(): Boolean = // lógica da regra
}
```

---

### 3.3 Infrastructure Layer (core/infrastructure)

**`{Aggregate}Entity.kt`** — JPA entity mapeando exatamente a migration; contém os
métodos de conversão `toDomain()` (instância) e `fromDomain()` (companion object)

```kotlin
@Entity
@Table(name = "{table_name}")
class {Aggregate}Entity(
    @Id
    @Column(columnDefinition = "UUID")
    val id: UUID = UUID.randomUUID(),

    // um @Column por campo da migration
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
interface {Aggregate}JpaRepository : JpaRepository<{Aggregate}Entity, UUID>
```

**`{Aggregate}RepositoryImpl.kt`** — sem lógica de mapeamento; delega para `{Aggregate}Entity`

```kotlin
@Repository
class {Aggregate}RepositoryImpl(
    private val jpa: {Aggregate}JpaRepository,
) : {Aggregate}Repository {

    override fun save({aggregate}: {Aggregate}) {
        jpa.save({Aggregate}Entity.fromDomain({aggregate}))
    }

    override fun findById(id: {Aggregate}Id): {Aggregate}? =
        jpa.findById(id.value).orElse(null)?.toDomain()
}
```

---

### 3.4 Application Layer (core/application)

**Para POST/PUT/PATCH/DELETE → Command + ResultCommandHandler ou CommandHandler**

Regra de qual interface usar no Command:
- Retorna resultado (201/200 + body) → implementa `ResultCommand<{Action}{Aggregate}Result>`
- Não retorna resultado (204) → estende `CommandBase`

```kotlin
// {Action}{Aggregate}Command.kt  — quando retorna resultado (201/200)
class {Action}{Aggregate}Command(
    // um campo por propriedade do JSON request
    override val metadata: MutableMap<String, String?> = mutableMapOf(),
) : ResultCommand<{Action}{Aggregate}Result>

// {Action}{Aggregate}Command.kt  — quando não retorna resultado (204)
class {Action}{Aggregate}Command(
    // um campo por propriedade do JSON request
) : CommandBase()

// {Action}{Aggregate}Handler.kt
@Service
class {Action}{Aggregate}Handler(
    private val {aggregate}Repository: {Aggregate}Repository,
) : ResultCommandHandler<{Action}{Aggregate}Command, {Action}{Aggregate}Result> {
    // ou CommandHandler se 204

    override fun handle(command: {Action}{Aggregate}Command): {Action}{Aggregate}Result {
        val {aggregate} = {Aggregate}.create(/* campos do command */)
        {aggregate}Repository.save({aggregate})
        return {Action}{Aggregate}Result(/* campos do aggregate */)
    }
}

// {Action}{Aggregate}Result.kt  (omitir se 204)
data class {Action}{Aggregate}Result(
    val id: UUID,
    // demais campos relevantes para retornar
)
```

**Para GET → Query + QueryHandler**

Atenção: `QueryBase` já define uma propriedade `final id: UUID` (ID da query em si).
Nunca declare `val id` no construtor — use o nome do campo de negócio, ex: `{aggregate}Id`, `userId`, `orderId`.

```kotlin
// Get{Aggregate}Query.kt
class Get{Aggregate}Query(val {aggregate}Id: UUID) : QueryBase<Get{Aggregate}Result>()

// Get{Aggregate}Handler.kt
@Service
class Get{Aggregate}Handler(
    private val {aggregate}Repository: {Aggregate}Repository,
) : QueryHandler<Get{Aggregate}Query, Get{Aggregate}Result> {

    override fun handle(query: Get{Aggregate}Query): Get{Aggregate}Result {
        val {aggregate} = {aggregate}Repository.findById(query.{aggregate}Id)
            ?: throw NoSuchElementException("{Aggregate} não encontrado: ${query.{aggregate}Id}")
        return Get{Aggregate}Result(/* campos */)
    }
}
```

---

### 3.5 Presenter Layer (presenter-api)

Cada endpoint tem seu **próprio arquivo de Route**. A estrutura de pastas segue
o aggregate e a ação:

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

**`{Action}{Aggregate}Route.kt`**

Sempre incluir anotações do Swagger (`@Operation`, `@ApiResponse`) nas Routes.

POST retornando body (201):
```kotlin
@RestController
@RequestMapping("/{path}")
@Tag(name = "{Aggregate}", description = "Operações de {aggregate}")
class {Action}{Aggregate}Route(private val {action}{Aggregate}Handler: {Action}{Aggregate}Handler) {

    @PostMapping
    @Operation(summary = "{Descrição curta da ação}")
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
@RestController
@RequestMapping("/{path}")
@Tag(name = "{Aggregate}", description = "Operações de {aggregate}")
class {Action}{Aggregate}Route(private val {action}{Aggregate}Handler: {Action}{Aggregate}Handler) {

    @PostMapping
    @Operation(summary = "{Descrição curta da ação}")
    @ApiResponse(responseCode = "204", description = "Executado com sucesso")
    @ApiResponse(responseCode = "400", description = "Request inválido")
    @ApiResponse(responseCode = "422", description = "Regra de negócio violada")
    fun {action}(@RequestBody @Valid request: {Action}{Aggregate}Request): ResponseEntity<Void> {
        {action}{Aggregate}Handler.handle(request.toCommand())
        return ResponseEntity.noContent().build()
    }
}
```

GET por parâmetro:
```kotlin
@RestController
@RequestMapping("/{path}")
@Tag(name = "{Aggregate}", description = "Operações de {aggregate}")
class {Action}{Aggregate}Route(private val {action}{Aggregate}Handler: {Action}{Aggregate}Handler) {

    @GetMapping("/{id}")
    @Operation(summary = "{Descrição curta da ação}")
    @ApiResponse(responseCode = "200", description = "Encontrado com sucesso")
    @ApiResponse(responseCode = "404", description = "Não encontrado")
    fun {action}(@PathVariable id: UUID): ResponseEntity<{Action}{Aggregate}Result> {
        val result = {action}{Aggregate}Handler.handle({Action}{Aggregate}Query(id))
        return ResponseEntity.ok(result)
    }
}
```

**`{Action}{Aggregate}Request.kt`** — na mesma pasta da Route que a usa
```kotlin
data class {Action}{Aggregate}Request(
    // um campo por propriedade do JSON, com anotação de validação adequada:
    // String → @field:NotBlank
    // Email → @field:Email
    // Numérico positivo → @field:Positive
    // Lista → @field:NotEmpty
) {
    fun toCommand() = {Action}{Aggregate}Command(/* mapeamento direto */)
}
```

---

### 3.6 Testes

**`{Aggregate}RepositoryImplTest.kt`** (core, integration test com Testcontainers)

Usar `@DataJpaTest` (não `@SpringBootTest` — o módulo `core` não tem `@SpringBootApplication`).
Importar manualmente o `RepositoryImpl` via `@Import`.
Dependências necessárias em `core/build.gradle.kts`:
```kotlin
testImplementation("org.testcontainers:postgresql:1.19.7")
testImplementation("org.testcontainers:junit-jupiter:1.19.7")  // para @Testcontainers e @Container
testRuntimeOnly("org.junit.platform:junit-platform-launcher") // obrigatório no Gradle 9
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
@Import({Aggregate}RepositoryImpl::class)
@Testcontainers
class {Aggregate}RepositoryImplTest {

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
    lateinit var {aggregate}Repository: {Aggregate}Repository

    @Test
    fun `deve salvar e recuperar {aggregate}`() {
        val {aggregate} = {Aggregate}.create(/* campos válidos */)

        {aggregate}Repository.save({aggregate})

        val found = {aggregate}Repository.findById({aggregate}.id)
        found shouldNotBe null
        found!!.id shouldBe {aggregate}.id
        // demais assertions por campo
    }
}
```

---

**`{Action}{Aggregate}HandlerTest.kt`** (core, unit test)

```kotlin
class {Action}{Aggregate}HandlerTest {

    private val {aggregate}Repository = mockk<{Aggregate}Repository>()
    private val handler = {Action}{Aggregate}Handler({aggregate}Repository)

    @Test
    fun `deve criar {aggregate} e retornar result`() {
        every { {aggregate}Repository.save(any()) } just Runs

        val result = handler.handle(
            {Action}{Aggregate}Command(/* campos válidos do JSON */)
        )

        result.id shouldNotBe null
        verify(exactly = 1) { {aggregate}Repository.save(any()) }
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

**`{Action}{Aggregate}RouteTest.kt`** (presenter-api, @WebMvcTest) — um arquivo de teste por Route

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

        // IMPORTANTE: usar JSON com dados VÁLIDOS do ponto de vista do DTO (@field:Email, etc.)
        // para que a requisição passe a validação e chegue ao handler mockado
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
        // IMPORTANTE: usar campos com valores inválidos (não JSON vazio {})
        // JSON vazio causa HttpMessageNotReadableException em Kotlin data classes
        // Campos inválidos causam MethodArgumentNotValidException → 400
        mockMvc.post("/{path}") {
            contentType = MediaType.APPLICATION_JSON
            content = """{ /* campos com valores inválidos, ex: strings vazias, números negativos */ }"""
        }.andExpect {
            status { isBadRequest() }
        }
    }
}
```

---

## Ordem de entrega dos arquivos

Sempre gerar nesta ordem para facilitar a leitura:

1. Migration SQL
2. Domain — Id, Entity, Repository interface, BusinessRules
3. Infrastructure — JPA Entity, JpaRepository, RepositoryImpl
4. Application — Command/Query, Handler, Result
5. Presenter — `{Action}{Aggregate}Route.kt` e `{Action}{Aggregate}Request.kt` em `presenter/{aggregate}/{action}/`
6. Testes — RepositoryImplTest, HandlerTest, `{Action}{Aggregate}RouteTest`

---

## Checklist antes de entregar

Antes de finalizar, verificar internamente:

- [ ] Todos os campos do JSON estão mapeados em todos os arquivos
- [ ] A migration usa `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- [ ] A JPA Entity tem `@Column(columnDefinition = "UUID")` no id
- [ ] O `toCommand()` está no Request (não no Handler)
- [ ] Cada endpoint tem sua própria Route em `presenter/{aggregate}/{action}/{Action}{Aggregate}Route.kt`
- [ ] Request body fica na mesma pasta da Route que o usa
- [ ] Route tem `@Tag`, `@Operation` e `@ApiResponse` do Swagger
- [ ] `toDomain()` e `fromDomain()` estão em `{Aggregate}Entity` (não no RepositoryImpl)
- [ ] `{Aggregate}RepositoryImpl` não tem lógica de mapeamento — apenas chama `{Aggregate}Entity.fromDomain()` e `.toDomain()`
- [ ] BusinessRules têm IDs únicos no formato `{AGGREGATE}_{NNN}`
- [ ] Testes cobrem: caminho feliz, violação de BusinessRule, request inválido (400)
- [ ] `{Aggregate}RepositoryImplTest` gerado com Testcontainers cobrindo o método `save`
- [ ] Se 204: Command estende `CommandBase`, Handler implementa `CommandHandler`, sem `Result`
- [ ] Se 201/200: Command implementa `ResultCommand<{Result}>`, Handler implementa `ResultCommandHandler`
- [ ] Query nunca declara `val id` no construtor — `QueryBase` já define `id` como `final`; usar `{aggregate}Id` ou nome do campo de negócio

---

## Variações por verbo

| Verbo | Handler base | Suffix Command/Query | Retorno típico |
|---|---|---|---|
| POST (criar) | `ResultCommandHandler` ou `CommandHandler` | `Command` | 201 + Result ou 204 |
| PUT / PATCH | `ResultCommandHandler` ou `CommandHandler` | `Command` | 200 + Result ou 204 |
| DELETE | `CommandHandler` | `Command` | 204 |
| GET (por id) | `QueryHandler` | `Query` | 200 + Result |
| GET / POST (listagem) | `QueryHandler` | `Query` | 200 + List<Result> |