# AI Showcase Skills

## Criando uma startup o mais rapido possivel com QUALIDADE elevada  usando IA

---

## Skills Disponíveis `Principais para um comeco rapido`

> Skills BASE: sao skills para o start do projeto

| Skill | Base | Descrição breve |
|---|---|---|
| `sec-multi-monorepo-kotlin-scaffold-speckit` | YES | Cria um ecosistema multi monorepo Kotlin Spring Boot com framework SDD speckit.|
| `sec-multi-monorepo-kotlin-scaffold` | YES | Cria um ecosistema multi monorepo Kotlin Spring Boot.|
| `sec-multi-monorepo-add-nextjs` | NO | Adiciona o frontend (web/mobile) nos projetos dentro multi monorepo, independente na liguagem backend.|
| `sec-multi-monorepo-kotlin-nextjs-hybrid-pipeline` | NO | Add pipeline buildando frontend e backend imbutido.|
| `kotlin-spring` + `criar-endpoint-rest` | NO | Conven\u00e7\u00f5es e scaffolding completo (DDD layered) para projetos Kotlin + Spring multi-m\u00f3dulo, com `XRepository` (interface no dom\u00ednio) + `RepositoryImpl`. Instalado via `setup-kotlin-spring`.|
| `setup-kotlin-gradle` + `crud-kotlin` | NO | Split da dupla acima em duas skills independentes: `setup-kotlin-gradle` faz apenas o scaffold de projeto (root Gradle, m\u00f3dulos, `buildingBlocks` com classes-base, docker, Makefile) e `crud-kotlin` gera endpoints REST completos (Migration + Domain + Infra + Application + Route + testes) seguindo as mesmas conven\u00e7\u00f5es DDD layered.|
| `setup-kotlin-gradle` + `setup-kotlin-crud` | NO | Variante enxuta recomendada para MVP/CRUD: ~5 arquivos por endpoint, sem `XRepository`/`RepositoryImpl`, co-location por feature (Command+Handler+Result, Route+Request), Swagger m\u00ednimo, 1 teste `@WebMvcTest`. Ver `skills/setup-kotlin-crud/README.md` (tokens, review, custo de n\u00e3o usar skill).|
| `simple-kotlin-spring` + `simple-criar-endpoint-rest` | NO | Variante enxuta da skill acima: **sem `XRepository` (interface) e sem `RepositoryImpl`**; o Handler injeta `XJpaRepository` direto. Economiza ~2 arquivos por aggregate e ~30% de tokens por endpoint. Instalado via `simple-setup-kotlin-spring`.|

---

## SEC - SaaS Ecosystem Creator

### 1. Copie as skill executando o arquivo shell como abaixo

```sh
sh put-or-update-global-skills.sh
```

> Obs.: Para executar em cada LLM o comando pode mudar   
>  codex => `$sec-multi-monorepo-kotlin-scaffold-speckit`   
>  claude => `/sec-multi-monorepo-kotlin-scaffold-speckit`   
>  cursor => `/sec-multi-monorepo-kotlin-scaffold-speckit`   
>  copilot => `/sec-multi-monorepo-kotlin-scaffold-speckit`   

### 2. No VSCode, Cursor, Claude-Cli, execute a skill
Criando o monorepo backend kotlin
```sh
/sec-multi-monorepo-kotlin-scaffold-speckit my-project
```
Adicionando frontend nextjs (web e mobile)
```sh
/sec-multi-monorepo-add-nextjs
```
Adicionando pipeline com frontend e backend build-in (Considere os secrets na sua pipeline DOCKER_USERNAME e DOCKER_PASSWORD)
```sh
/sec-multi-monorepo-kotlin-nextjs-hybrid-pipeline
```
