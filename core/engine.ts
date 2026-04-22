import { SkillRunner } from "./skill-runner.js";

export type EngineInput = {
  saasProjectName: string;
  projectName: string;
  stack: "kotlin" | "python";
  group: string;
};

export class Engine {
  private readonly runner = new SkillRunner();

  run(input: EngineInput): void {
    if (input.stack !== "kotlin") {
      throw new Error("Somente --kotlin suportado neste MVP.");
    }

    this.runner.run({
      saasProjectName: input.saasProjectName,
      projectName: input.projectName,
      stack: input.stack,
      group: input.group,
    });
  }
}
