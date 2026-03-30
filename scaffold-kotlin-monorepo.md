## scaffold-kotlin-monorepo

Objetivo: scaffold um monorepo Kotlin Spring Boot Gradle do zero. Usado ao criar um novo projeto com módulos api e core, estrutura CQRS, Oracle/Flyway, Testcontainers. Gera build.gradle.kts, settings.gradle.kts, diretórios de módulos, Application.kt, e .github/instructions.

### Fluxo obrigatório
1. Criar estrutura de diretórios para módulos api e core.
2. Gerar build.gradle.kts e settings.gradle.kts para monorepo.
3. Implementar Application.kt no módulo api.
4. Configurar Testcontainers e Flyway.
5. Copiar .github/instructions para o novo projeto.
6. Documentar estrutura em PlantUML.

### Perguntas obrigatórias no início do scaffold (formato VSCode)
Pergunta 1 (Input Box):
- Texto: "Informe o nome do projeto (kebab-case, ex.: my-awesome-service)."

Pergunta 2 (Input Box):
- Texto: "Informe o grupo Gradle (ex.: ia.lirio)."

Pergunta 3 (Input Box):
- Texto: "Informe o pacote base Kotlin (ex.: ia.lirio.my.awesome.service)."

Pergunta 4 (Input Box):
- Texto: "Quais módulos criar? (padrão: api, core)."

Pergunta 5 (Input Box):
- Texto: "Configurar Oracle e Flyway? (sim/não)."

### Critérios de implementação
- Estrutura CQRS com módulos api e core.
- Build.gradle.kts configurado para monorepo.
- Application.kt no módulo api.
- Testcontainers e Flyway incluídos se solicitado.
- .github/instructions copiadas.

### Raciocínio de setup
Com base nas respostas, gerar templates apropriados. Se houver necessidade de customização, ajustar conforme especificado.
