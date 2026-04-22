#!/usr/bin/env node
import { Engine } from "../../core/engine.js";

function parseArgs(argv: string[]) {
  const [, , saasProjectName, ...flags] = argv;

  if (!saasProjectName) {
    throw new Error(
      "Uso: creator-saas-ecosystem <saasProjectName> --kotlin [--project-name <projectName>] [--group <group>]"
    );
  }

  let projectName = saasProjectName;
  let group = "br.com.lirio";
  let stack: "kotlin" | "python" = "kotlin";

  for (let i = 0; i < flags.length; i += 1) {
    const flag = flags[i];

    if (flag === "--kotlin") {
      stack = "kotlin";
      continue;
    }

    if (flag === "--python") {
      stack = "python";
      continue;
    }

    if (flag === "--project-name") {
      const nextValue = flags[i + 1];
      if (!nextValue) {
        throw new Error("Flag --project-name exige um valor.");
      }
      projectName = nextValue;
      i += 1;
      continue;
    }

    if (flag === "--group") {
      const nextValue = flags[i + 1];
      if (!nextValue) {
        throw new Error("Flag --group exige um valor.");
      }
      group = nextValue;
      i += 1;
      continue;
    }
  }

  return {
    saasProjectName,
    projectName,
    stack,
    group,
  };
}

function main() {
  try {
    const input = parseArgs(process.argv);
    const engine = new Engine();
    engine.run(input);
    console.log("[cli] finalizado com sucesso");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error(`[cli] erro: ${message}`);
    process.exit(1);
  }
}

main();
