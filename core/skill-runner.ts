import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

export type SkillRunInput = {
  saasProjectName: string;
  projectName: string;
  stack: "kotlin" | "python";
  group: string;
};

export class SkillRunner {
  run(input: SkillRunInput): void {
    const skill = "scaffold-monorepo-multimodulos-kotlin-speckit";
    const groupSlug = this.resolveGroupSlug(input.projectName);
    const groupApi = `${groupSlug}-api`;
    const groupCore = `${groupSlug}-core`;
    const projectRoot = resolve(process.cwd(), input.saasProjectName);
    const domainBasePkg = `${input.group}.${groupSlug}`;

    this.ensureEmptyProjectDirectory(projectRoot);
    this.createGradleSkeleton(projectRoot, groupSlug, groupApi, groupCore, input.group);
    this.createApiModule(projectRoot, groupSlug, groupApi, groupCore, domainBasePkg);
    this.createCoreModule(projectRoot, groupSlug, groupCore, domainBasePkg);
    this.createSharedLibsModule(projectRoot, input.group);
    this.createSpeckitStructure(projectRoot, groupSlug, groupApi, groupCore, domainBasePkg);

    console.log(`[skill-runner] skill: ${skill}`);
    console.log(`[skill-runner] saasProjectName: ${input.saasProjectName}`);
    console.log(`[skill-runner] project: ${input.projectName}`);
    console.log(`[skill-runner] stack: ${input.stack}`);
    console.log(`[skill-runner] group: ${input.group}`);
    console.log(`[skill-runner] generatedPath: ${projectRoot}`);
  }

  private resolveGroupSlug(projectName: string): string {
    if (projectName.endsWith("-api")) {
      return projectName.slice(0, -4);
    }

    return projectName.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase();
  }

  private ensureEmptyProjectDirectory(projectRoot: string): void {
    mkdirSync(projectRoot, { recursive: true });
    const files = readdirSync(projectRoot);
    if (files.length > 0) {
      throw new Error(`Diretorio ja existe e nao esta vazio: ${projectRoot}`);
    }
  }

  private writeFile(projectRoot: string, relativePath: string, content: string): void {
    const filePath = join(projectRoot, relativePath);
    const parentDir = filePath.slice(0, filePath.lastIndexOf("/"));
    mkdirSync(parentDir, { recursive: true });
    writeFileSync(filePath, content, "utf-8");
  }

  private createGradleSkeleton(
    projectRoot: string,
    groupSlug: string,
    groupApi: string,
    groupCore: string,
    baseGroup: string
  ): void {
    this.writeFile(
      projectRoot,
      "settings.gradle.kts",
      `rootProject.name = "${projectRoot.split("/").pop()}"\n\ninclude(\"${groupSlug}:${groupApi}\", \"${groupSlug}:${groupCore}\", \"shared-libs\")\n`
    );

    this.writeFile(
      projectRoot,
      "build.gradle.kts",
      `plugins {\n    alias(libs.plugins.kotlin.jvm) apply false\n    alias(libs.plugins.kotlin.spring) apply false\n    alias(libs.plugins.spring.boot) apply false\n    alias(libs.plugins.dependency.management) apply false\n}\n\nallprojects {\n    group = \"${baseGroup}\"\n    version = \"0.1.0-SNAPSHOT\"\n\n    repositories {\n        mavenCentral()\n    }\n}\n`
    );

    this.writeFile(
      projectRoot,
      "gradle.properties",
      "org.gradle.parallel=true\norg.gradle.caching=true\norg.gradle.configuration-cache=true\n"
    );

    this.writeFile(
      projectRoot,
      "gradle/libs.versions.toml",
      `[versions]\nkotlin = \"2.3.0\"\nspring-boot = \"4.0.5\"\ndependency-management = \"1.1.7\"\n\n[plugins]\nkotlin-jvm = { id = \"org.jetbrains.kotlin.jvm\", version.ref = \"kotlin\" }\nkotlin-spring = { id = \"org.jetbrains.kotlin.plugin.spring\", version.ref = \"kotlin\" }\nspring-boot = { id = \"org.springframework.boot\", version.ref = \"spring-boot\" }\ndependency-management = { id = \"io.spring.dependency-management\", version.ref = \"dependency-management\" }\n`
    );

    this.writeFile(
      projectRoot,
      "gradle/wrapper/gradle-wrapper.properties",
      "distributionBase=GRADLE_USER_HOME\ndistributionPath=wrapper/dists\ndistributionUrl=https\\://services.gradle.org/distributions/gradle-9.4.1-bin.zip\nnetworkTimeout=10000\nvalidateDistributionUrl=true\nzipStoreBase=GRADLE_USER_HOME\nzipStorePath=wrapper/dists\n"
    );

    this.writeFile(
      projectRoot,
      ".gitignore",
      ".gradle/\nbuild/\n**/build/\n*.log\n*.tmp\n*.swp\n*.swo\n*.jar\n!gradle/wrapper/gradle-wrapper.jar\n"
    );

    this.writeFile(
      projectRoot,
      "WRAPPER_BOOTSTRAP.md",
      "Para finalizar o wrapper completo com gradlew, gradlew.bat e gradle-wrapper.jar, execute na raiz do projeto:\n\ngradle wrapper --gradle-version 9.4.1 --distribution-type bin\n\nDepois versionar:\n- gradlew\n- gradlew.bat\n- gradle/wrapper/gradle-wrapper.jar\n- gradle/wrapper/gradle-wrapper.properties\n"
    );
  }

  private createApiModule(
    projectRoot: string,
    groupSlug: string,
    groupApi: string,
    groupCore: string,
    basePkg: string
  ): void {
    const appName = this.toPascalCase(groupSlug);
    const pkgPath = this.pkgToPath(`${basePkg}.api`);

    this.writeFile(
      projectRoot,
      `${groupSlug}/${groupApi}/build.gradle.kts`,
      `plugins {\n    alias(libs.plugins.kotlin.jvm)\n    alias(libs.plugins.kotlin.spring)\n    alias(libs.plugins.spring.boot)\n    alias(libs.plugins.dependency.management)\n}\n\ndependencies {\n    implementation(project(\":${groupSlug}:${groupCore}\"))\n    implementation(\"org.springframework.boot:spring-boot-starter-webmvc\")\n    implementation(\"org.springframework.boot:spring-boot-starter-actuator\")\n    implementation(\"org.jetbrains.kotlin:kotlin-reflect\")\n\n    testImplementation(\"org.springframework.boot:spring-boot-starter-actuator-test\")\n    testImplementation(\"org.springframework.boot:spring-boot-starter-webmvc-test\")\n    testImplementation(\"org.jetbrains.kotlin:kotlin-test-junit5\")\n    testRuntimeOnly(\"org.junit.platform:junit-platform-launcher\")\n}\n\nkotlin {\n    jvmToolchain(25)\n    compilerOptions {\n        freeCompilerArgs.addAll(\"-Xjsr305=strict\", \"-Xannotation-default-target=param-property\")\n    }\n}\n\ntasks.withType<Test>().configureEach {\n    useJUnitPlatform()\n}\n`
    );

    this.writeFile(
      projectRoot,
      `${groupSlug}/${groupApi}/src/main/kotlin/${pkgPath}/${appName}ApiApplication.kt`,
      `package ${basePkg}.api\n\nimport org.springframework.boot.autoconfigure.SpringBootApplication\nimport org.springframework.boot.runApplication\n\n@SpringBootApplication\nclass ${appName}ApiApplication\n\nfun main(args: Array<String>) {\n    runApplication<${appName}ApiApplication>(*args)\n}\n`
    );

    this.writeFile(
      projectRoot,
      `${groupSlug}/${groupApi}/src/main/resources/application.yml`,
      `spring:\n  application:\n    name: ${groupApi}\n\nserver:\n  port: 8080\n`
    );
  }

  private createCoreModule(projectRoot: string, groupSlug: string, groupCore: string, basePkg: string): void {
    const markerName = `${this.toPascalCase(groupSlug)}CoreMarker`;
    const pkgPath = this.pkgToPath(`${basePkg}.core`);

    this.writeFile(
      projectRoot,
      `${groupSlug}/${groupCore}/build.gradle.kts`,
      `plugins {\n    alias(libs.plugins.kotlin.jvm)\n}\n\ndependencies {\n    implementation(\"org.jetbrains.kotlin:kotlin-reflect\")\n\n    testImplementation(\"org.jetbrains.kotlin:kotlin-test-junit5\")\n    testRuntimeOnly(\"org.junit.platform:junit-platform-launcher\")\n}\n\nkotlin {\n    jvmToolchain(25)\n    compilerOptions {\n        freeCompilerArgs.addAll(\"-Xjsr305=strict\", \"-Xannotation-default-target=param-property\")\n    }\n}\n\ntasks.withType<Test>().configureEach {\n    useJUnitPlatform()\n}\n`
    );

    this.writeFile(
      projectRoot,
      `${groupSlug}/${groupCore}/src/main/kotlin/${pkgPath}/${markerName}.kt`,
      `package ${basePkg}.core\n\nclass ${markerName}\n`
    );
  }

  private createSharedLibsModule(projectRoot: string, basePkg: string): void {
    this.writeFile(
      projectRoot,
      "shared-libs/build.gradle.kts",
      `plugins {\n    alias(libs.plugins.kotlin.jvm)\n}\n\nkotlin {\n    jvmToolchain(25)\n}\n`
    );

    this.writeFile(
      projectRoot,
      `shared-libs/src/main/kotlin/${this.pkgToPath(`${basePkg}.sharedlibs`)}/SharedLibsMarker.kt`,
      `package ${basePkg}.sharedlibs\n\nclass SharedLibsMarker\n`
    );
  }

  private createSpeckitStructure(
    projectRoot: string,
    groupSlug: string,
    groupApi: string,
    groupCore: string,
    basePkg: string
  ): void {
    this.writeFile(
      projectRoot,
      "specs/README.md",
      `# Speckit\n\nUse esta pasta para Spec-Driven Development.\n\n- specs/constitution.md define as regras globais.\n- specs/_templates contem os modelos de spec, plan e tasks.\n- specs/${groupSlug}/ contem o contexto do dominio.\n- specs/shared-libs/ contem o contexto do modulo root.\n`
    );

    this.writeFile(
      projectRoot,
      "specs/constitution.md",
      `# Constitution\n\n## 1. Arquitetura\n- Modulos por dominio: *-api e *-core.\n- shared-libs na raiz para codigo compartilhado.\n\n## 2. Linguagem e plataforma\n- Kotlin 2.3.x, Spring Boot 4.x, Java 25.\n\n## 3. Convencoes de codigo\n- Pacotes por dominio em ${basePkg}.api e ${basePkg}.core.\n\n## 4. Runtime\n- Definir spring.application.name por modulo API.\n\n## 5. Persistencia\n- Cada servico com seu schema e migrations.\n\n## 6. Testes\n- JUnit Platform e testes alinhados aos criterios de aceitacao.\n\n## 7. Observabilidade\n- Logs estruturados, metricas e traces.\n\n## 8. Speckit\n- Mudancas de comportamento iniciam em specs/.\n\n## 9. Processo\n- PR deve referenciar a pasta da feature em specs/.\n`
    );

    this.writeFile(
      projectRoot,
      "specs/_templates/feature-spec.md",
      `# Feature Spec\n\n## Escopo tecnico\n- Projetos Gradle: :${groupSlug}:${groupApi}, :${groupSlug}:${groupCore}\n- Pacotes: ${basePkg}.api.<feature>, ${basePkg}.core.<feature>\n- Shared libs usadas: :shared-libs\n\n## Regras de negocio\n\n## Criterios de aceitacao\n`
    );

    this.writeFile(
      projectRoot,
      "specs/_templates/feature-plan.md",
      "# Feature Plan\n\n## Modulos impactados\n\n## Dependencias\n\n## Testes e rollout\n"
    );

    this.writeFile(
      projectRoot,
      "specs/_templates/feature-tasks.md",
      "# Feature Tasks\n\n- [ ] Preparar modulo core\n- [ ] Preparar modulo api\n- [ ] Criar testes\n- [ ] Validar build\n"
    );

    this.writeFile(
      projectRoot,
      `specs/${groupSlug}/README.md`,
      `# ${groupSlug}\n\n## Modulos\n- :${groupSlug}:${groupApi}\n- :${groupSlug}:${groupCore}\n\n## Pacote base\n- ${basePkg}\n\n## Indice de features\n- (preencher quando criar features)\n`
    );

    this.writeFile(
      projectRoot,
      "specs/shared-libs/README.md",
      "# shared-libs\n\n## Modulo\n- :shared-libs\n\n## Indice de features\n- (preencher quando criar features)\n"
    );
  }

  private toPascalCase(value: string): string {
    return value
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("");
  }

  private pkgToPath(pkg: string): string {
    return pkg.split(".").join("/");
  }
}
