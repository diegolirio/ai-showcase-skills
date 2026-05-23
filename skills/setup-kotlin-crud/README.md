# setup-kotlin-crud — Por que esta skill existe

Skill para gerar endpoints REST em projetos Kotlin + Spring multi-módulo criados
com `setup-kotlin-gradle`. Este README explica **por que usar a skill** em vez de
deixar o Cursor (ou outro IDE com agente) organizar o código por conta própria.

---

## O que é

A `setup-kotlin-crud` gera um endpoint completo em **~5 arquivos**, com padrão fixo:

- Separação de módulos (`buildingBlocks` → `core` → `presenter-api`)
- Domain com BusinessRules quando necessário
- Mapeamento `toDomain()` / `fromDomain()` na JPA Entity
- Migration Flyway versionada
- Validação de DTO (`@Valid`, `@field:NotBlank`, etc.)
- Teste de rota cobrindo 201/200, 400 e 422

Organização enxuta por feature (menos arquivos, menos repetição):

- Handler injeta `XJpaRepository` direto (sem camada extra só por convenção)
- Command + Handler + Result no mesmo arquivo
- Route + Request no mesmo arquivo
- Swagger mínimo (`@Operation` apenas)
- Um arquivo de teste por endpoint (`@WebMvcTest`)

---

## Por que ainda usar uma skill na era da IA?

A IA barateou **escrever** código, não **decidir onde cada coisa vai**.

Uma skill não é “documentação bonita” — é **arquitetura executável**: o mesmo
padrão em toda sessão, em todo dev, em todo modelo (Cursor, Claude, Codex, Copilot).

| O que mudou com IA | O que não mudou |
|--------------------|-----------------|
| Custo de gerar boilerplate → quase zero | Custo de entender código alheio → igual |
| Refatorar ficou mais rápido | Debug em produção às 3h → igual |
| O agente aplica padrões sem cansar | Review humano ainda é obrigatório |
| | PR inconsistente = dívida acumulada |

**Princípio:** cada camada/arquivo só existe se paga o custo cognitivo.
A skill define esse ponto doce **uma vez**; sem ela, cada sessão redefine do zero.

---

## O custo de *não* usar skill (deixar o IDE/Cursor livre)

Sem skill nem rule, o agente **pode** gerar um endpoint “que funciona”, mas cada
sessão tende a inventar um estilo diferente:

| Sintoma (sem skill) | Consequência |
|---------------------|--------------|
| Um dia cria `services/`, outro `usecases/`, outro tudo em `domain/` | Ninguém acha o POST `/users` sem perguntar à IA de novo |
| Mistura MVC plano, “clean” com 12 pastas e DDD parcial no mesmo repo | Review de PR lento; conflitos de merge |
| Estrutura inventada só naquela conversa | Código que compila na sessão mas não combina com o endpoint de ontem |
| Número de arquivos imprevisível (6 a 20+ por feature) | Mais tokens de **input** quando o agente relê o projeto depois |
| Testes às vezes só no controller, às vezes em 3 camadas | Regressão passa batido ou teste duplicado |
| Junior sem mapa mental | Dependência total da ferramenta para navegar |

Isso não aparece no dia 1 — aparece no mês 6, com dezenas de endpoints e
200+ arquivos sem convenção única.

A skill **não** substitui o dev no review. Ela **reduz a superfície de decisão**
para que humano e IA revisem a mesma coisa da mesma forma, toda vez.

---

## Economia de tokens e custo em dinheiro

Estimativa para um `POST /users` típico (1–2 business rules, 201 + body, testes 201/400/422):

| Métrica | Sem skill (agente livre)* | Com `setup-kotlin-crud` |
|---------|---------------------------|-------------------------|
| Arquivos gerados | Imprevisível (~8–20+) | ~5 (padrão fixo) |
| Rodadas de correção (“mova para pasta X”, “faltou migration”) | Frequentes | Raras |
| Tokens de *output* na 1ª geração | ~1.500 – 4.000+ | ~1.200 – 2.000 |
| Tokens de *input* nas sessões seguintes | Alto (estrutura diferente por feature) | Menor (mesmo layout sempre) |
| Custo API por endpoint** | ~$0,02 – $0,06+ (com retrabalho) | ~$0,01 – $0,03 |

\*Inclui variação de estilo, arquivos extras e prompts de alinhamento após a 1ª resposta.  
\*\*Ordem de grandeza; varia por modelo (input ~$3/1M, output ~$10–15/1M tokens).

### O que isso significa na prática

- **Por endpoint:** centavos na fatura da API — sozinho não justifica a skill.
- **Por sprint com 20 endpoints:** menos retrabalho, menos “conserta a estrutura”,
  menos truncamento de contexto na mesma sessão.
- **Por ano, codebase vivo:** estrutura repetível = o agente lê menos para entender
  cada feature nova — **esse** é o ganho recorrente.

**Conclusão:** o valor não é só “gastar menos tokens na geração”. É **não pagar
de novo** o custo de decidir arquitetura a cada endpoint e a cada sessão.

---

## Review humano: com skill vs sem skill

| Situação | Sem skill | Com `setup-kotlin-crud` |
|----------|-----------|-------------------------|
| Achar “tudo do POST /users” | Caça em pastas diferentes a cada PR | Slice vertical previsível (~5 arquivos) |
| Tamanho do PR | Muitos arquivos pequenos *ou* um monólito gigante | Poucos arquivos por feature, limites de linha |
| Critério de review | “Isso está certo?” + “onde deveria estar?” | “A regra de negócio está certa?” |
| Onboarding de dev | Precisa perguntar à IA como *este* endpoint foi feito | Lê um endpoint = entende os próximos |

**Regra da skill:** co-locate por **use case**, não um arquivo gigante com tudo.

| Arquivo | Conteúdo | Limite orientativo |
|---------|----------|-------------------|
| `CreateUser.kt` | Command + Handler + Result | ~120 linhas |
| `CreateUserEndpoint.kt` | Route + Request | ~80 linhas |
| `User.kt` | Domain + rules inline | ~100 linhas |
| `UserPersistence.kt` | JPA Entity + JpaRepository | ~90 linhas |

Se passar do limite → a skill manda separar o Handler em arquivo próprio.

**Não fundir:** migration SQL, `GlobalExceptionHandler`, classes de `buildingBlocks`.

---

## Quando esta skill faz sentido

Use `setup-kotlin-crud` quando:

- O projeto já foi criado com `setup-kotlin-gradle` (ou estrutura equivalente)
- Você quer **consistência** entre muitos endpoints CRUD
- O time (ou só você) usa agente de IA no dia a dia e não quer “arquitetura nova” por sessão
- Postgres estável, features principalmente HTTP + JPA

Reconsidere skill + convenção explícita (ou evoluir manualmente) quando:

- Várias fontes de dados por aggregate (Postgres + cache + fila com contratos diferentes)
- Precisa de portas de domínio rígidas e mocks pesados sem JPA em todo handler
- Compliance exige camadas documentadas fora do que esta skill gera

Para hackathon **descartável** em 48h, dá para não usar skill — aceite o caos.
Para produto que dura meses, o custo de **não** ter padrão executável costuma ser maior.

---

## Fluxo recomendado

```sh
# 1. Criar projeto (uma vez)
/setup-kotlin-gradle

# 2. Gerar endpoints com padrão fixo
/setup-kotlin-crud POST /users com {"name":"Ana","email":"ana@example.com"}
```

Cada novo endpoint segue o mesmo mapa de pastas e nomes — o review e o agente
nas próximas sessões não recomeçam do zero.

---

## Instalação

```sh
sh put-or-update-global-skills.sh
```

No Cursor: `/setup-kotlin-crud`

---

## Referências

- Instruções operacionais (o que gerar, checklist): [SKILL.md](./SKILL.md)
- Scaffold inicial do projeto: `setup-kotlin-gradle`
