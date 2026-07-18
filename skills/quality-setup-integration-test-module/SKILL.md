---
name: quality-setup-integration-test-module
description: 'Cria e configura um modulo dedicado de testes de integracao (`{base}-integration-tests`) em projetos Kotlin + Spring Boot multi-modulo. Move os testes de integracao, mescla @SpringBootApplication e application.yml, centraliza o BaseIntegrationTest, isola libs pesadas de teste, configura jacoco-report-aggregation, tasks Gradle test/integrationTest, stage no Jenkinsfile e regra ArchUnit de cobertura de entrypoints. Use quando o usuario pedir "criar modulo de testes de integracao", "integration-tests module", "separar testes de integracao", "reduzir tempo de testcontainers" ou "setup integration test module".'
argument-hint: 'Opcional: nome base do projeto (ex: pp) e lista de modulos. Se omitido, a skill descobre a partir de settings.gradle.kts.'
user-invocable: true
---

# Setup Integration Test Module

Configura um modulo dedicado para testes de integracao, reduzindo o tempo de carregamento de
Testcontainers e de contextos Spring ao concentrar toda a infraestrutura de integracao em um unico
modulo nao implantavel.

## Quando usar

- Projeto Kotlin + Spring Boot multi-modulo com testes de integracao espalhados por varios modulos.
- Necessidade de reduzir tempo de build/testes isolando Testcontainers e contexto Spring pesado.
- Padronizar um unico `BaseIntegrationTest` e um unico `IntegrationTestApplication`.
- Centralizar cobertura agregada (Jacaco) e garantir ITs para todos os entrypoints.

## Artefatos criados / modificados

```
settings.gradle.kts                                        <- registra o novo modulo
build.gradle.kts (raiz)                                    <- plugin jacoco-report-aggregation + agregacao + tasks
{base}-integration-tests/build.gradle.kts                  <- libs pesadas de teste (novo)
{base}-integration-tests/src/test/kotlin/**                <- ITs movidos + BaseIntegrationTest + IntegrationTestApplication
{base}-integration-tests/src/test/resources/**             <- application.yml mesclado + archunit.properties + assets de container (oracle/Dockerfile, oracle/init.sql)
{outros modulos}/build.gradle.kts                          <- remover libs pesadas de teste de integracao
Jenkinsfile                                                <- stage "Integration Test"
```

> Substitua `{base}` pelo prefixo do projeto (ex.: `pp` para `pp-requests-core`).
> O novo modulo NAO e implantavel: `jar` e `bootJar` desabilitados.

---

## Passo 1 - Descobrir base do projeto e modulos (via settings.gradle.kts)

1. Ler `settings.gradle.kts` para obter `rootProject.name` e a lista COMPLETA de modulos
   declarados em `include(...)`. Esta lista e a fonte de verdade para todos os passos seguintes
   (dependencias do novo modulo e `jacocoAggregation`).

   ```bash
   grep -E "include\(" settings.gradle.kts
   ```

2. Derivar o prefixo `{base}` a partir do prefixo comum dos nomes dos modulos (ex.: `pp-requests-core`,
   `pp-products-api` -> `{base}` = `pp`).
3. Localizar todos os modulos que possuem classe principal Spring Boot (para mesclar Applications):

   ```bash
   grep -rl "runApplication<" --include="*.kt" .
   ```

4. Localizar os `BaseIntegrationTest` existentes e os testes que os estendem:

   ```bash
   grep -rl "BaseIntegrationTest" --include="*.kt" .
   ```

5. Apresentar ao usuario os modulos descobertos e confirmar o nome do novo modulo:
   `{base}-integration-tests`.

> Nos Passos 2 e 4, gerar uma linha por modulo descoberto no `settings.gradle.kts` — nao usar listas
> fixas. O novo modulo `{base}-integration-tests` entra apenas no `jacocoAggregation` (Passo 4), nao
> como dependencia de si mesmo (Passo 2).

---

## Passo 2 - Criar o modulo `{base}-integration-tests`

1. Registrar o modulo em `settings.gradle.kts` (`include("{base}-integration-tests")`).
2. Criar `build.gradle.kts` do modulo a partir de
   [integration-tests-build.gradle.kts.template](./templates/integration-tests-build.gradle.kts.template).
   Substituir o marcador `{project-dependencies}` por uma linha
   `testImplementation(project(":<modulo>"))` para CADA modulo do `settings.gradle.kts`
   (Passo 1), exceto o proprio `{base}-integration-tests`.
3. O modulo NAO e implantavel: `jar` e `bootJar` ficam desabilitados (ja no template).

---

## Passo 3 - Isolar libs pesadas de teste

- Remover dos `build.gradle.kts` dos demais modulos (e da raiz, se estiverem la) as libs pesadas
  usadas apenas por testes de integracao: `spring-boot-testcontainers`, `testcontainers-*`,
  `wiremock-standalone`, `awaitility`, `archunit-junit5`, `springmockk`, slices de teste
  (`spring-boot-starter-*-test`) que so sao necessarias na integracao.
- Manter nos modulos apenas o minimo para testes unitarios (`kotlin-test-junit5`,
  `junit-platform-launcher`, `mockk`).

### Regras

- Nao remover dependencias usadas por testes unitarios que permanecem no modulo.
- Preservar ordem/indentacao/convencoes do arquivo.
- Nao duplicar dependencias.

---

## Passo 4 - Configurar Jacoco agregado e tasks Gradle na raiz

No `build.gradle.kts` da raiz, aplicar os trechos de
[root-build-jacoco-aggregation.gradle.kts.template](./templates/root-build-jacoco-aggregation.gradle.kts.template):

1. Aplicar o plugin `jacoco-report-aggregation`.
2. Substituir o marcador `{jacoco-aggregation}` por uma linha
   `jacocoAggregation(project(":<modulo>"))` para CADA modulo do `settings.gradle.kts`
   (Passo 1); o template ja inclui `{base}-integration-tests`.
3. Em `subprojects` (ou equivalente):
   - `test` roda apenas testes unitarios: `useJUnitPlatform { excludeTags("integration") }`.
   - registrar `integrationTest` que roda apenas `@Tag("integration")` com
     `useJUnitPlatform { includeTags("integration") }` e `isFailOnNoMatchingTests = false`.
   - configurar `JacocoReport` para agregar `test.exec` + `integrationTest.exec`.
4. Configurar `testCodeCoverageReport` (relatorio agregado XML/HTML) e a task
   `jacocoAggregatedCoverageVerification` com minimos de LINE e BRANCH (ex.: `0.80`).

### Regras

- Adaptar os trechos a estrutura existente (ex.: se ja ha bloco `subprojects`, mesclar).
- Nao sobrescrever regras de cobertura existentes sem confirmar com o usuario.

---

## Passo 5 - Mesclar Application, application.yml e mover ITs

1. Criar um unico `IntegrationTestApplication` no novo modulo, mesclando os `@SpringBootApplication`
   dos demais modulos (component scan abrangente). Base em
   [IntegrationTestApplication.kt.template](./templates/IntegrationTestApplication.kt.template).
2. Mesclar os `application.yml`/`application.properties` dos modulos em
   `{base}-integration-tests/src/test/resources/`. O `BaseIntegrationTest` usa
   `spring.config.name=core-application,application` para carregar ambos.
3. Criar/centralizar o `BaseIntegrationTest` a partir de
   [BaseIntegrationTest.kt.template](./templates/BaseIntegrationTest.kt.template):
   - Se ja existir em outros modulos, mesclar o conteudo e mover para o novo modulo.
   - Se nao existir, criar do zero.
4. Mover TODOS os testes que estendem `BaseIntegrationTest` para o novo modulo, mantendo os packages.
5. Garantir que todos os testes de integracao tenham `@Tag("integration")` e que os demais testes unitarios NAO tenham esta tag.
6. Caso necessário renomear os testes movidos para `<Nome>IT` (ex.: `UserControllerTest` -> `UserControllerIT`).
7. **Assets de container (ex.: `Dockerfile`/`init.sql` do Oracle):** devem viver DENTRO do
   modulo `{base}-integration-tests`, em `src/test/resources/<engine>/` (ex.: `.../resources/oracle/`).
   - Se ja existirem em outro modulo (ex.: `{modulo}-core/src/test/resources/`), MOVE-los
     (`git mv`) para o novo modulo.
   - Se nao existirem, cria-los no novo modulo.
   - No `BaseIntegrationTest`, carrega-los pelo **classpath** (limpo e explicito), nunca por
     caminho relativo com `..`:

     ```kotlin
     ImageFromDockerfile()
         .withFileFromClasspath("Dockerfile", "oracle/Dockerfile")
         .withFileFromClasspath("init.sql", "oracle/init.sql")
         .get()
     ```

     Assim o modulo fica autocontido e nao depende do `workingDir` do Gradle nem da estrutura
     de outros modulos.

### Regras

- Testes de integracao devem percorrer todo o fluxo real: acessar banco de dados e HTTP.
- Nao deixar `BaseIntegrationTest` duplicado nos modulos antigos.
- Todo teste de integracao deve ter `@Tag("integration")`.
- Assets de Testcontainers (Dockerfile/init.sql/etc.) pertencem ao modulo `{base}-integration-tests`
  e sao carregados via classpath (`withFileFromClasspath`), nunca via caminho relativo `..`.

---

## Passo 6 - Jenkinsfile

Garantir um stage de testes de integracao no `Jenkinsfile` usando
[Jenkinsfile-integration-stage.template](./templates/Jenkinsfile-integration-stage.template):

- Se ja existir `"test": { bindings -> junit(bindings) }`, incluir o stage "Integration Test" no
  binding.
- Se nao existir, criar o binding conforme o template.
- Comportamento: `main` sempre executa; `PR Builder` pula; demais pedem input com timeout.
- Executa `./gradlew integrationTest --no-daemon` e arquiva os resultados JUnit.

---

## Passo 7 - Regra ArchUnit (entrypoints exigem IT)

No modulo `{base}-integration-tests`:

1. Criar `src/test/resources/archunit.properties` a partir de
   [archunit.properties.template](./templates/archunit.properties.template).
2. Criar `EntrypointHasIntegrationTestRuleIT` a partir de
   [EntrypointHasIntegrationTestRuleIT.kt.template](./templates/EntrypointHasIntegrationTestRuleIT.kt.template),
   ajustando o package base (`importPackages(...)`) e o import do `BaseIntegrationTest`.

A regra garante que todo entrypoint (`@RestController`, `@KafkaListener`, `@Scheduled`) tenha um IT
`<Nome>IT` que estenda `BaseIntegrationTest`.

---

## Passo 8 - Ajustar skills e instructions do projeto

Procurar por instructions de teste existentes no projeto (ex.: `.github/instructions/*test*.instructions.md`,
`.github/copilot-instructions.md`, `AGENTS.md`):

```bash
grep -rli "integration\|test" .github/instructions AGENTS.md .github/copilot-instructions.md 2>/dev/null
```

- **Se existir** instruction relacionada a testes, atualiza-la para refletir que:
  - Novos testes de integracao devem ser criados no modulo `{base}-integration-tests`.
  - Controllers, Endpoints, Consumers e Schedulers DEVEM ter teste de integracao.
  - Os testes de integracao devem percorrer todo o processo, acessando banco de dados e HTTP.
- **Se NAO existir** nenhuma instruction de testes, perguntar ao usuario se deseja criar uma
  (ex.: `.github/instructions/testing-conventions.instructions.md` com `applyTo: "**/*IT.kt"`)
  contendo as mesmas regras acima. Criar apenas se confirmado.

Alem disso, documentar o novo modulo:

- Incluir a descricao do modulo `{base}-integration-tests` (proposito, nao implantavel, onde ficam
  os ITs, `BaseIntegrationTest`/`IntegrationTestApplication` e como rodar `./gradlew integrationTest`)
  nas instructions do projeto.
- Atualizar o `README.md` do projeto com uma secao/entrada descrevendo o modulo
  `{base}-integration-tests` e o fluxo de testes de integracao.

---

## Passo 9 - Integracoes opcionais (perguntar ao usuario)

Ao final, perguntar se deseja configurar via outras skills:

- **quality-setup-testcontainers-arch-kafka** — caso o `BaseIntegrationTest` ainda nao tenha Kafka.
- **quality-setup-testcontainers-oracle** — caso o `BaseIntegrationTest` ainda nao tenha Oracle.
- **quality-setup-testcontainers-redis** — caso o projeto use Redis e o `BaseIntegrationTest` ainda nao o tenha.

E perguntar sobre **WireMock**: caso o projeto dependa de HTTP externo e precise de mock nos testes,
aplicar o bloco de [references/wiremock.md](./references/wiremock.md) quando solicitado.

---

## Checklist de conclusao

- [ ] Modulo `{base}-integration-tests` criado e registrado em `settings.gradle.kts`.
- [ ] `jar`/`bootJar` desabilitados no novo modulo.
- [ ] Libs pesadas de teste removidas dos demais modulos.
- [ ] `jacoco-report-aggregation` + `jacocoAggregation(...)` para todos os modulos.
- [ ] Tasks `test` (exclui integration) e `integrationTest` (inclui integration) configuradas.
- [ ] `IntegrationTestApplication` unico + `application.yml` mesclado.
- [ ] `BaseIntegrationTest` centralizado; ITs movidos e com `@Tag("integration")`.
- [ ] Stage "Integration Test" no Jenkinsfile.
- [ ] `archunit.properties` + `EntrypointHasIntegrationTestRuleIT` criados.
- [ ] Skills/instructions do projeto atualizadas (ou criada instruction de testes, se confirmado).
- [ ] Descricao do modulo `{base}-integration-tests` documentada nas instructions e no `README.md` do projeto.
- [ ] Perguntado sobre Kafka/Oracle/Redis/WireMock.
