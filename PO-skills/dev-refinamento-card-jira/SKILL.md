---
name: dev-refinamento-card-jira
description: "Use quando o card Jira refinado pelo PO precisar ser avaliado contra Definition of Ready antes de virar PRD, ou quando dev, qa ou sre for puxar atividade e precisar identificar gaps de prontidão."
---

# Refinamento de card do Jira — avaliação de prontidão

Decide se uma atividade pode seguir para documentação e desenvolvimento. Lê o card, as dependências declaradas e a documentação permitida no Confluence, confronta tudo com o **Definition of Ready** e devolve um parecer com veredito explícito e a lista de gaps que bloqueiam ou colocam em risco o início.

No fluxo do Agente Product Owner, esta é a segunda etapa da cadeia, executada após o preview de negócio aprovado pela skill `refinamento` e antes da criação do PRD pela skill `escrever-prd`.

## Cadeia de skills

```
refinamento  ->  dev-refinamento-card-jira  ->  escrever-prd  ->  escrever-jiracard
(entrevista)     (avalia prontidão)             (PRD)            (Jira)
```

Esta skill **avalia prontidão**. Ela não reescreve o card, não estima esforço e não publica nada sem confirmação explícita do PO.

## Documentação oficial viva

A documentação oficial do Agente Product Owner é:

https://jiraps.atlassian.net/wiki/spaces/NVSTMNTS/pages/77554190316/Agente+Product+Owner

Essa página deve ser tratada como documentação viva. Sempre que o fluxo, responsabilidades, ordem das skills, guardrails ou critérios de prontidão forem alterados, a atualização correspondente deve ser refletida nessa página oficial após validação do PO.

## Guardrail de Confluence

- Se o PO fornecer uma página de Confluence como contexto, consulte somente o Worktree Confluence dessa página: a página enviada e suas páginas filhas.
- Não suba para página pai, não leia páginas irmãs, não siga links para outros espaços, não abra páginas citadas fora da árvore e não faça busca global/paralela para completar lacunas.
- Se for necessário avaliar um DoR ou documento que não esteja no Worktree informado, peça o link ao PO em vez de buscar por conta própria.
- Quando não houver página informada pelo PO, use apenas o Jira e o checklist padrão desta skill, deixando a limitação clara no parecer.

## Quando usar

- Depois que a skill `refinamento` produzir um preview de negócio aprovado e antes de chamar `escrever-prd`.
- Dev vai puxar um card do backlog e precisa saber se dá para começar hoje.
- Cerimônia de refinamento com dev, qa e sre avaliando cards candidatos à próxima sprint.
- QA precisa verificar se os critérios de aceite são testáveis antes do desenvolvimento.
- SRE ou DBRE avalia card com impacto em infraestrutura, janela, rollback ou volumetria.
- Dados precisa confirmar origem, linhagem e contrato antes de iniciar uma carga.

## Passo a passo do refino

1. **Confirmar entradas** — receber o preview aprovado da skill `refinamento` quando estiver no fluxo do agente, além da chave do card (ex.: `ABC-1234`) ou URL da issue. Sem card, pedir ao usuário.
2. **Ler o card** com MCP Atlassian, extraindo descrição, critérios de aceite, tipo, épico, sprint, responsável, labels, anexos e comentários relevantes.
3. **Mapear dependências** percorrendo issue links (bloqueia / é bloqueado por / relaciona). Registrar chave e status de cada card vinculado.
4. **Consultar documentação permitida** somente dentro do Worktree Confluence informado pelo PO, quando houver. Se o DoR do time não estiver nesse Worktree, pedir o link ou usar o checklist padrão.
5. **Pedir ao usuário** o que o MCP não entregou, em bloco único, no formato da seção "Fontes de dados e fallback".
6. **Rodar o checklist de Definition of Ready** item a item, sem pular categoria.
7. **Classificar cada lacuna** em bloqueador, atenção ou informativo.
8. **Entregar o parecer** no formato da seção "Saída do refino", com veredito e gaps numerados.
9. **Confirmar com o PO** antes de publicar o parecer no card via MCP Atlassian.
10. **Perguntar ao PO se deseja seguir para `escrever-prd`**, passando o preview aprovado e o parecer de prontidão como entrada.

## Fontes de dados e fallback

### Ordem de consulta

| Fonte | O que extrair |
|---|---|
| Preview aprovado | User story, critérios de aceite, canais, campos, exceções, rollout, fluxo e fora de escopo |
| Card Jira | Descrição, critérios de aceite, tipo, épico, sprint, labels, anexos e responsável |
| Dependências | Chave e status de cada card vinculado |
| Histórico | Decisões tomadas fora da descrição |
| Worktree Confluence informado | DoR, padrões, contratos, runbooks e decisões que estejam na página enviada ou em páginas filhas |

### Quando o MCP não responde

O servidor pode estar desconectado, sem autenticação ou sem permissão no espaço. Nesse caso **não invente o conteúdo do card nem do DoR**, e não trate ausência de acesso como ausência de informação no card — são coisas diferentes.

1. **Declarar** qual fonte falhou e o motivo: desconectado, erro de autenticação, sem permissão ou página inexistente.
2. **Pedir em bloco único**, sem fatiar perguntas ao longo da conversa.
3. **Marcar a origem** de cada item do parecer: `[jira]`, `[confluence]`, `[preview]` ou `[informado pelo usuário]`.
4. **Manter o veredito**, sinalizando que ele se apoia em dado não verificado na fonte.

Template do pedido:

```text
Não consegui consultar <fonte> (<motivo>). Para seguir com a avaliação, cole:

1. Descrição do card ABC-1234, incluindo critérios de aceite
2. Status dos cards vinculados, se houver
3. O DoR do time ou confirme "usar o checklist padrão da skill"
4. Link ou trecho da documentação permitida no Worktree Confluence

Se algum item não existir, escreva "não existe" — isso também é resposta.
```

Item respondido com "não existe" é **gap real** e entra no parecer. Item não respondido é **lacuna de avaliação** e entra como ressalva de cobertura.

## Definition of Ready — checklist

O DoR do time, quando fornecido pelo PO ou encontrado dentro do Worktree Confluence permitido, **prevalece**. Este checklist é o piso, usado na ausência de um DoR documentado, e complementa o DoR do time no que ele não cobrir.

### Contexto
- [ ] Problema e resultado esperado descritos em texto, não só no título.
- [ ] Solicitante identificado e alcançável para dúvidas.
- [ ] Motivo da prioridade explícito: regulatório, incidente, roadmap ou outro.

### Escopo
- [ ] O que entra e o que **não** entra está escrito.
- [ ] Canais, sistemas, repositórios, serviços e schemas afetados estão nomeados quando forem relevantes.
- [ ] Card cabe em uma sprint; caso contrário, a quebra já foi proposta.

### Critérios de aceite
- [ ] Cada critério é verificável por alguém que não escreveu o card.
- [ ] Cenários de erro e borda descritos, não só o caminho feliz.
- [ ] Valores concretos onde a regra depende de número: limite, prazo, percentual, quantidade ou valor monetário.

### Regras de negócio
- [ ] Regras explícitas no card, no preview aprovado ou em documentação permitida.
- [ ] Comportamento esperado para dado ausente, nulo, inválido, duplicado ou fora do limite.
- [ ] Divergência entre card, preview e documentação resolvida antes do início.

### Dependências
- [ ] Cards bloqueadores concluídos ou com data acordada.
- [ ] Time terceiro acionado e ciente do prazo.
- [ ] Acessos, credenciais e permissões já concedidos ou solicitados com responsável.
- [ ] Contrato de informações, schema, API ou evento publicado, versionado ou aprovado como rascunho pelo PO.

### Técnico
- [ ] Ponto de partida no código identificado quando o card já indicar repositório, módulo ou serviço.
- [ ] Abordagem técnica acordada, ou spike separado criado.
- [ ] Massa de teste e ambiente disponíveis.
- [ ] Feature flag ou estratégia de rollout definida quando houver impacto em produção.

### Não funcional
- [ ] Volumetria esperada e limite de latência declarados quando aplicável.
- [ ] Métrica, log ou alerta que comprovam funcionamento em produção.
- [ ] Impacto em custo de infraestrutura avaliado quando houver processamento, rotina automática ou alto volume.

### Segurança e compliance
- [ ] Tratamento de dado pessoal e sensível definido: LGPD, PCI-DSS ou outra regra aplicável.
- [ ] Necessidade de aprovação, RFC ou janela de mudança avaliada.
- [ ] Plano de rollback descrito para mudança com efeito em produção.

## Classificação dos gaps e veredito

| Severidade | Critério | Efeito |
|---|---|---|
| Bloqueador | Sem a resposta, a implementação começa errada ou não começa | Impede o início |
| Atenção | Dá para começar, mas a resposta é necessária antes do fim | Início parcial |
| Informativo | Melhora o card, não muda a execução | Não impede |

- **PRONTA** — nenhum bloqueador. O card pode seguir para PRD ou desenvolvimento.
- **PRONTA COM RESSALVAS** — nenhum bloqueador, com pontos de atenção nomeados e com responsável.
- **NÃO PRONTA** — ao menos um bloqueador. O parecer diz de quem é a resposta que destrava.

Bloqueador sem responsável nomeado é bloqueador que ninguém vai resolver. Toda pergunta do parecer aponta para uma pessoa ou papel.

## Saída do refino

```text
# Parecer de prontidão — PAGX-4821
Tipo: História · Sprint: 2026-S18 · Responsável: não atribuído

## Resumo [jira]
Expor consulta de limite disponível do cliente para o app.

## Veredito: NÃO PRONTA — 2 bloqueadores

## Gaps

1. Bloqueador — Contrato de informações não definido [preview]
   Card cita "retornar o limite" sem campos, mensagens ou cenários de erro.
   Pergunta para o PO e o time de app: quais campos e mensagens devem ser validados antes do desenvolvimento?

2. Bloqueador — Card dependente PAGX-4790 em "Em desenvolvimento" [jira]
   A fonte do limite depende da entrega desse card.
   Pergunta para o time responsável: qual a data acordada de conclusão?

3. Atenção — Volumetria e latência ausentes [informado pelo usuário]
   Sem limite de latência não há critério de performance verificável.
   Pergunta para o PO: qual o tempo aceitável e volume esperado?

## Verificado sem gap
Escopo, tratamento de PII, plano de rollback.

## Cobertura da avaliação
Preview aprovado: disponível.
Jira: consultado.
Worktree Confluence: página informada e filhas consultadas.
Não consultado: nenhuma fonte falhou.
```

## Notas e limites

- A skill avalia prontidão; **não** reescreve o card nem estima esforço.
- Publicar comentário no Jira altera artefato compartilhado com o time. Confirmar antes de publicar.
- Card sem responsável atribuído não é bloqueador por si só, mas vira bloqueador quando existe pergunta sem destinatário.
- O checklist é piso, não teto. Time com DoR próprio informado dentro do Worktree Confluence permitido tem o documento dele como fonte de verdade em caso de conflito.
- Ausência de item no card difere de ausência de acesso à fonte. Registrar as duas de forma distinta preserva a confiança no veredito.

## Skills relacionadas

- `refinamento` — entrevista de negócio que produz o preview aprovado para esta avaliação.
- `escrever-prd` — transforma o preview e o parecer de prontidão aprovado em PRD.
- `escrever-jiracard` — organiza o conteúdo final no Jira após o PRD aprovado.
