import http from 'k6/http';
import { check } from 'k6';

// ---------------------------------------------------------------------------
// Configuração — lida exclusivamente de docs/{feature}/k6.json
// O nome do cenário é passado via variável de ambiente: K6_TEST=test1
// ---------------------------------------------------------------------------

const rawConfig = open('./docs/{feature}/k6.json');
const config = JSON.parse(rawConfig);

const testName = __ENV.K6_TEST;
const testConfig = config[testName];

if (!testConfig) {
  throw new Error(
    `Cenário "${testName}" não encontrado em docs/{feature}/k6.json. ` +
    `Defina K6_TEST com um dos cenários disponíveis: ${Object.keys(config).join(', ')}`
  );
}

// --- target ----------------------------------------------------------------
if (!testConfig.target?.baseUrl) {
  throw new Error(`Campo target.baseUrl ausente no cenário "${testName}"`);
}
const endpoint = `${testConfig.target.baseUrl}/{path}`;

// --- loadProfile -----------------------------------------------------------
const lp = testConfig.loadProfile;
if (!lp?.warmup || !lp?.rampUp || !lp?.plateau || !lp?.rampDown) {
  throw new Error(`Campos de loadProfile (warmup/rampUp/plateau/rampDown) ausentes no cenário "${testName}"`);
}
if (lp.totalVirtualUsersWarmup === undefined || lp.totalVirtualUsers === undefined) {
  throw new Error(`Campos totalVirtualUsersWarmup/totalVirtualUsers ausentes no cenário "${testName}"`);
}

// --- successCriteria -------------------------------------------------------
if (!testConfig.successCriteria?.thresholds) {
  throw new Error(`Campo successCriteria.thresholds ausente no cenário "${testName}"`);
}

// --- responseValidation ----------------------------------------------------
if (testConfig.responseValidation?.status === undefined) {
  throw new Error(`Campo responseValidation.status ausente no cenário "${testName}"`);
}

// ---------------------------------------------------------------------------
// Opções do k6 — derivadas do JSON
// ---------------------------------------------------------------------------

export const options = {
  thresholds: testConfig.successCriteria.thresholds,
  scenarios: {
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: lp.warmup, target: lp.totalVirtualUsersWarmup },
        { duration: lp.rampUp, target: lp.totalVirtualUsers },
        { duration: lp.plateau, target: lp.totalVirtualUsers },
        { duration: lp.rampDown, target: 0 },
      ],
      gracefulRampDown: '15s',
    },
  },
};

// ---------------------------------------------------------------------------
// Execução — body enviado exatamente como está no JSON, sem mutações
// ---------------------------------------------------------------------------

export default function () {
  const payload = JSON.stringify(testConfig.request?.body ?? {});

  const response = http.{http_method}(endpoint, payload, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  check(response, {
    [`status is ${testConfig.responseValidation.status}`]: (r) =>
      r.status === testConfig.responseValidation.status,
  });
}
