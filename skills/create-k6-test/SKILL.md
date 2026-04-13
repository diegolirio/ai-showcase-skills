---
name: create-k6-test
description: >
  Use this skill whenever the user wants to create a k6 load test for a REST
  endpoint. Triggers include: "criar teste de carga", "criar k6", "novo k6",
  "teste de carga com k6", "criar test k6", "adicionar cenário k6", or when
  the user provides an endpoint path and wants to measure throughput, latency,
  or concurrent load behavior. This skill generates ALL artifacts in one shot:
  docs/{feature}/k6.json (spec), k6.js (parametrized script), and Makefile targets.
  Always use this skill when creating or extending k6 tests — never generate files
  ad-hoc without it.
---

# Skill: create-k6-test

Gera a estrutura completa de um teste de carga com k6, baseada em um arquivo de
especificação JSON que serve como fonte única de verdade para todos os cenários.

---

## Artefatos gerados

```
docs/
  {feature}/
    k6.json          ← especificação de todos os cenários de carga

k6.js                ← script k6 na raiz, parametrizado via K6_TEST env var

Makefile             ← targets separados por cenário (k6-{scenarioName})
```

---

## Como usar

O usuário informa:
1. **Nome da funcionalidade** — vira a pasta `docs/{feature}/` e identifica o teste
2. **Endpoint HTTP** — verbo + path (ex.: `POST /movements`)
3. **Payload de exemplo** — corpo JSON do request
4. **Cenários** — quantos e com quais objetivos (ex.: smoke, stress, soak)

Exemplo de invocação:
> "Criar teste k6 para POST /movements" (com o JSON de exemplo em mãos)
> "Adicionar cenário de stress no k6 do movements"

---

## Passo 1 — Coletar informações

| Campo | Como obter | Default |
|---|---|---|
| `feature` | segmento principal do path | primeiro segmento do path (ex: `movements`) |
| `baseUrl` | perguntar ou assumir local | `http://localhost:8080` |
| `env` | perguntar | `local` |
| `body` | JSON de exemplo do usuário | `{}` |
| `responseValidation.status` | perguntar | `200` |
| `loadProfile.totalVirtualUsersWarmup` | perguntar | `1` |
| `loadProfile.totalVirtualUsers` | perguntar | `20` |
| `loadProfile.warmup` | perguntar | `10s` |
| `loadProfile.rampUp` | perguntar | `30s` |
| `loadProfile.plateau` | perguntar | `1m` |
| `loadProfile.rampDown` | perguntar | `15s` |
| `successCriteria.thresholds.http_req_failed` | perguntar | `rate<0.01` |
| `successCriteria.thresholds.http_req_duration` | perguntar | `p(95)<500` |
| `implementationPolicy.totalDuration` | calculado automaticamente | soma das fases do loadProfile |
| `implementationPolicy.repetitions` | perguntar | `1` |
| `implementationPolicy.stopCriteria` | perguntar | `manual` |

**Regras importantes:**
- O campo `body` deve ser copiado **exatamente** como o usuário forneceu — sem adições, remoções ou mutações.
- Campos que precisam ser únicos por requisição devem ser explicitamente declarados no JSON via campo dedicado (ex.: `dataStrategy.uniqueFields`), não implementados silenciosamente no script.
- O script k6.js deve ser **estrito**: falha explicitamente se qualquer campo obrigatório estiver ausente no JSON — sem silent fallbacks.

---

## Passo 2 — Confirmar e gerar

Antes de gerar, apresentar resumo:

```
Vou gerar os seguintes arquivos para POST /{feature}:

docs/{feature}/
  └── k6.json          ← especificação com cenário(s) test1 [, test2, ...]

k6.js                  ← script parametrizado via K6_TEST=test1
Makefile               ← targets: make k6-test1 [, make k6-test2, ...]

Cenários:
  test1 — {objetivo do cenário} — {totalVirtualUsers} VUs por {plateau}

Pode prosseguir?
```

---

## Passo 3 — Gerar os arquivos

### 3.1 Spec: `docs/{feature}/k6.json`

Use o template em `templates/k6.json` como base. Regras de preenchimento:

- Cada cenário recebe uma chave sequencial: `test1`, `test2`, etc.
- `request.body` deve ser o JSON fornecido pelo usuário, **sem modificações**.
- Calcular `implementationPolicy.totalDuration` somando todas as fases do `loadProfile`.
- Preencher `goal` com uma frase descrevendo o objetivo do cenário.
- Manter `observability` e `implementationPolicy` com os defaults do template salvo indicação contrária.
- `dataStrategy` só incluir se o usuário mencionar necessidade de dados únicos por requisição.

**Fase → VUs:**

| Fase | VUs alvo |
|---|---|
| warmup | `totalVirtualUsersWarmup` |
| rampUp | `totalVirtualUsers` |
| plateau | `totalVirtualUsers` |
| rampDown | `0` |

### 3.2 Script: `k6.js` (raiz do projeto)

Use o template em `templates/k6.js` como base. Regras:

- O script seleciona o cenário pelo nome em `__ENV.K6_TEST`.
- Todas as propriedades obrigatórias devem ser validadas com `throw new Error(...)` claro — **nunca usar `?? valor_default`** no script.
- O `request.body` deve ser enviado **exatamente como está no JSON**, sem transformações.
- O check de resposta deve validar apenas `responseValidation.status` — nada além disso, salvo campos explicitamente em `responseValidation`.
- `Content-Type` e `Accept` são sempre `application/json`.

### 3.3 Makefile targets

Adicionar ao `Makefile` existente um target por cenário:

```makefile
k6-{scenarioName}:
	K6_TEST={scenarioName} k6 run ./k6.js
```

Se já existir `k6-test` genérico, substituir pela lista de targets explícita. Nunca criar um target genérico sem `K6_TEST` explícito.

---

## Decisões de design consolidadas nessa skill

| Decisão | Justificativa |
|---|---|
| JSON como fonte única de verdade | Todos os valores — perfil de carga, thresholds, body — ficam no JSON; o script não tem lógica de negócio |
| Um k6.js reutilizável | test1 e test2 são o mesmo fluxo com configurações diferentes; separar em scripts distintos só vale quando payloads estruturalmente divergem |
| K6_TEST via env var | Permite execução independente por cenário sem duplicar script |
| Makefile separado por cenário | Operação simples, rastreável em CI/CD |
| Sem mutação de body no script | Garante que o k6.js não acrescenta comportamento não auditado |
| Strict mode no script | Falhas explícitas evitam testes rodando silenciosamente com configs erradas |
| Lock liberado no commit/rollback | Para endpoints com `@Transactional` + `PESSIMISTIC_WRITE`, o lock dura toda a transação — relevante para calibrar VUs e interpretar contenção |

---

## Interpretação de resultados

Ao apresentar resultados de um teste executado, seguir esse template de análise:

### 1. Latência
- Avaliar `http_req_duration` p95 vs. threshold configurado.
- Latência alta com taxa de erro baixa → gargalo de processamento.
- Latência baixa com taxa de erro alta → problema funcional/dados, não performance.

### 2. Taxa de erro
- `http_req_failed` acima do threshold → reprovar o teste.
- Distinguir: erro 4xx (dados/regra de negócio) vs. 5xx (infraestrutura/lock timeout).

### 3. Throughput
- `http_reqs` total e por segundo (`/s`).
- Comparar com `totalVirtualUsers` para estimar concorrência efetiva.

### 4. Perfil de carga vs. resultados
- Confirmar que os stages de warmup/rampUp/plateau/rampDown se refletiram nos VUs observados.

### 5. Conclusão
- Aprovado: todos os thresholds dentro do limite.
- Reprovado: indicar qual threshold falhou e hipótese da causa raiz.
