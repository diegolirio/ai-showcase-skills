# Referência — scaffold monorepo Kotlin + speckit

## Matriz de versões (referência atual comum)

Ajustar no `gradle/libs.versions.toml` conforme o projeto alvo.

| Componente | Exemplo |
|------------|---------|
| Kotlin | 2.3.x (bytecode JVM 25) |
| Spring Boot | 4.x |
| `io.spring.dependency-management` | 1.1.x |
| Java (toolchain / target) | 25 |

O plugin Spring Boot 4 exige **Gradle** na faixa suportada (consultar release notes do Boot em uso).

## Gradle: paths de projeto

- Include `"{a}:{b}"` → diretório `a/b/` na raiz do repo.
- Dependência entre módulos: `implementation(project(":running:running-core"))`.
- Libs compartilhadas: `implementation(project(":shared-libs:{LIB}"))`.

## Pacotes (exemplo)

- `com.acme.running.api` — `RunningApplication.kt`, controllers.
- `com.acme.running.core` — tipos compartilhados.
- `com.acme.sharedlibs.auth` — lib compartilhada (pacote **sem** hífen).

Alinhar `group` no `build.gradle.kts` raiz (`com.acme` ou `com.acme.running`).

## IntelliJ / IDE

`ProjectRootManager` / SDK do projeto deve refletir o JDK usado. Kotlin da IDE
compatível com a versão do Kotlin do Gradle.

## Templates speckit — o que eles contêm

### `feature-spec.md`
- Contexto / problema / motivação.
- **Escopo técnico** (projetos Gradle, pacotes, shared libs).
- Atores e casos de uso.
- Contratos (REST / mensageria) com exemplos de payload.
- Regras de negócio.
- Critérios de aceitação (Dado/Quando/Então).
- Fora de escopo.
- Perguntas em aberto.

### `feature-plan.md`
- Módulos impactados (`*-api`, `*-core`, `shared-libs/*`).
- Dependências novas (atualizar version catalog).
- Modelo de dados / migrations.
- Arquitetura (fluxo, trade-offs, alternativas rejeitadas).
- Segurança, observabilidade, plano de testes, rollout, riscos.

### `feature-tasks.md`
- Preparação (catalog, `build.gradle.kts`).
- Core → API → Integração → Qualidade → Entrega.
- Cada item pequeno, verificável e mapeável a um commit.

## Convenção de numeração

- Pasta de feature: `NNN-slug` por domínio (`001-`, `002-`, ...).
- Branch correspondente: `feat/{group}-{NNN}-{slug}`.
- PR referencia `specs/{group}/{NNN}-{slug}/`.

## Erros comuns a evitar

- Colocar `spec.md` dentro de `*-api/src/...` (mistura doc com resources do JAR).
- Uma spec gigante por domínio acumulando dezenas de features.
- Duplicar `constitution.md` dentro de subpastas.
- Criar `specs/` sem referenciar módulos Gradle no README (spec órfã).
- Esquecer de criar `specs/{group-novo}/README.md` ao adicionar módulo Gradle novo.
