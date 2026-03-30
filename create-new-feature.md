## create-new-feature

Objetivo: iniciar uma nova feature seguindo arquitetura em camadas, scaffold do projeto e fluxo TDD (testes primeiro).

### Fluxo obrigatorio
1. Escrever testes primeiro (TDD).
2. Implementar entrada (Controller, Listener ou Job).
3. Implementar caso de uso/handler e regras de negocio.
4. Implementar saidas de infraestrutura (banco, topicos, filas, APIs externas).
5. Garantir retorno/saida esperada (HTTP response, evento, processamento batch).
6. Documentar fluxo em PlantUML.

### Perguntas obrigatorias no inicio da feature (formato VSCode)
Pergunta 1 (Quick Pick):
- Texto: "Qual o tipo de entrada da nova funcionalidade?"
- Opcoes:
- `Controller` (seguir padrao existente)
- `Listener` (seguir padrao; se houver modulo async devera ser implementado no mesmo; se nao, em `api`)
- `Job` (criar com ShedLock)

Pergunta 2 (Input Box):
- Texto: "Informe a descricao da task, regras de negocio, validacoes e caso de uso (normalmente estabelecido pelo(a) Product Owner)."

Pergunta 3 (Input Box):
- Texto: "Informe a descricao tecnica, infraestrutura e requisitos nao funcionais."

Pergunta 4 (Input Box):
- Texto: "Informe o caminho do diagrama PlantUML da feature (ex.: documentation/produtos/criar-produtos-flow.puml)."

Pergunta 5 (Input Box):
- Texto: "Quais sao as saidas para a infraestrutura? (Oracle, Kafka, RabbitMQ, APIs externas, cron/processamento, etc.)"

Pergunta 6 (Input Box):
- Texto: "Existe necessidade de setup adicional? (oracle, kafka, rabbitmq, job/shedlock)."

### Criterios de implementacao
- Toda feature deve iniciar por testes.
- Para entrada via Controller: criar teste de controller + teste de integracao.
- Para entrada via Listener: criar teste de listener (incluindo teste com Producer) + teste de integracao.
- Para entrada via Job: criar teste do agendamento/execucao + teste de integracao.
- Garantir cobertura de entrada e saida dos dados.
- Seguir padrao arquitetural em camadas do scaffold.

### Raciocinio de setup
Com base nas respostas das perguntas do VSCode, na descricao funcional/tecnica ou no PlantUML, avaliar se e necessario executar setups auxiliares:
- `create-setup-kafka`
- `create-setup-rabbitmq`
- `create-setup-job` (spring cronjob + shedlock)

Se houver duvida de tecnologia, perguntar antes de iniciar a implementacao.
