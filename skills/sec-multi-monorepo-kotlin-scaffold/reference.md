# Referência — scaffold monorepo Kotlin

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

## Pacotes (exemplo)

- `com.acme.running.api` — `RunningApplication.kt`
- `com.acme.running.core` — tipos compartilhados

Alinhar `group` no `build.gradle.kts` raiz (`com.acme` ou `com.acme.running` conforme convenção do time).

## IntelliJ / IDE

Após scaffold, `ProjectRootManager` / SDK do projeto deve refletir o JDK usado (ex.: nome do SDK "25"). Kotlin plugin na IDE deve ser compatível com a versão do Kotlin do Gradle.
