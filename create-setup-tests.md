## create-setup-tests

Objetivo: configurar testes de integração reutilizáveis em projetos Kotlin Spring Boot com Testcontainers Oracle, migrações Flyway no módulo core, Flyway desabilitado em runtime nas propriedades da aplicação, e targets de teste no Makefile. Usado para novos ou projetos existentes que precisam do padrão BaseIntegrationTest e tarefa Flyway pronta para pipeline.

### Fluxo obrigatório
1. Criar classe BaseIntegrationTest com Testcontainers para Oracle.
2. Configurar migrações Flyway no módulo core.
3. Desabilitar Flyway em runtime via application.properties.
4. Adicionar targets de teste no Makefile para execução em pipeline.
5. Garantir que os testes usem o padrão BaseIntegrationTest.
6. Documentar configuração em PlantUML se necessário.

### Perguntas obrigatórias no início da configuração (formato VSCode)
Pergunta 1 (Quick Pick):
- Texto: "O projeto já tem módulo core separado?"
- Opções:
- `Sim` (usar módulo core existente)
- `Não` (criar estrutura se necessário)

Pergunta 2 (Input Box):
- Texto: "Informe o nome do banco Oracle para Testcontainers (ex.: mydb)."

Pergunta 3 (Input Box):
- Texto: "Informe o caminho para as migrações Flyway no core (ex.: src/main/resources/db/migration)."

Pergunta 4 (Input Box):
- Texto: "Quais targets de teste adicionar no Makefile? (ex.: test-integration, test-flyway)."

Pergunta 5 (Input Box):
- Texto: "Existe necessidade de configuração adicional para Oracle ou Flyway?"

### Critérios de implementação
- BaseIntegrationTest deve usar Testcontainers com Oracle.
- Migrações Flyway devem estar no core module.
- Flyway deve ser desabilitado em application.properties para runtime.
- Makefile deve ter targets para executar testes de integração e Flyway.
- Garantir que os testes sejam reutilizáveis e sigam o padrão.

### Raciocínio de setup
Com base nas respostas das perguntas, avaliar se é necessário ajustar a estrutura do projeto ou adicionar dependências. Se houver dúvidas sobre Testcontainers ou Flyway, perguntar antes de implementar.
