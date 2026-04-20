---
name: devops-pipeline-hybrid-java-nextjs
description: >
  Configura pipeline CI/CD com GitHub Actions para monorepo Kotlin Spring Boot + Next.js,
  com deploy por app backend em paralelo, Dockerfile por modulo @SpringBootApplication,
  naming de imagem padronizado e build frontend dist (Next export -> out/) apenas para modulo *-api.
---

# Skill: devops-pipeline-hybrid-java-nextjs

## Objetivo
Padronizar CI/CD para monorepo multi-modulo com:
- Build, imagem e deploy separados por app backend
- Execucao paralela por app (matrix)
- Regra de frontend apenas para modulo `*-api`
- Build final frontend em `out/` e copia para `src/main/resources/static`
- Imagem Docker por app com naming padrao

## Placeholders obrigatorios
| Placeholder | Exemplo | Uso |
|---|---|---|
| `{PROJECT_NAME}` | `analizza` | Prefixo da imagem |
| `{DOCKER_USERNAME}` | `diegolirio` | Namespace Docker Hub |
| `{DOMAIN}` | `properties` | Pasta de dominio |
| `{APP_TYPE}` | `api`, `async`, `job` | Tipo de app backend |
| `{MODULE_PATH}` | `:properties:properties-api` | Build Gradle por app |

## Naming de imagem
Formato obrigatorio:

`{DOCKER_USERNAME}/{PROJECT_NAME}-{DOMAIN}-{APP_TYPE}:latest`

Exemplos:
- `diegolirio/analizza-properties-api:latest`
- `diegolirio/analizza-properties-async:latest`

## Regras de pipeline (obrigatorias)
1. Detectar apps backend automaticamente (modulos com `*Application.kt`)
    - derivar `app_dir` de forma simples e robusta com:
       `app_dir="${app_file%/src/main/kotlin/*}"`
2. Criar matrix com um item por app backend
3. Rodar build/push em paralelo por app
4. Para app `*-api` com `*-web` existente:
   - build frontend
   - copiar `out/.` + `public/.` para `*-api/src/main/resources/static`
5. Para app `*-async`, `*-job`, etc:
   - build apenas backend
6. Deploy separado por app (tambem em matrix)

## Estrutura minima esperada
```text
{repo}/
├── .github/workflows/ci.yml
├── Makefile
├── {domain}/
│   ├── {domain}-api/
│   │   ├── Dockerfile
│   │   └── src/main/resources/static/
│   ├── {domain}-core/
│   ├── {domain}-async/ (opcional)
│   │   └── Dockerfile
│   └── {domain}-web/ (opcional)
│       ├── package.json
│       └── next.config.mjs
└── settings.gradle.kts
```

## Frontend dist (obrigatorio para embed)
Arquivo `next.config.mjs`:
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true
  }
};

export default nextConfig;
```

## Configuracao Gradle Wrapper (obrigatoria e explicita)

Arquivos obrigatorios no root:

```text
{repo}/
├── gradlew
├── gradlew.bat
└── gradle/wrapper/
    ├── gradle-wrapper.jar
    └── gradle-wrapper.properties
```

Regras obrigatorias:
- Pipeline e Makefile devem usar `./gradlew`.
- `gradle/wrapper/gradle-wrapper.jar` deve estar versionado no Git.
- Se existir regra global `*.jar` no `.gitignore`, adicionar excecao explicita: `!gradle/wrapper/gradle-wrapper.jar`.
- `gradle/wrapper/gradle-wrapper.properties` deve definir `distributionUrl` fixo.
- Em modulos aninhados, task path sempre no formato `:{DOMAIN}:{DOMAIN}-api`.

Troubleshooting rapido (CI):
- Erro `Could not find or load main class org.gradle.wrapper.GradleWrapperMain` indica wrapper incompleto no checkout.
- Validar no repo: `gradle/wrapper/gradle-wrapper.jar` existe e esta versionado.
- Se ausente, regenerar com `gradle wrapper --gradle-version 9.4.1 --distribution-type bin` e commitar `gradlew`, `gradlew.bat`, `gradle/wrapper/gradle-wrapper.jar` e `gradle/wrapper/gradle-wrapper.properties`.

Exemplo de `gradle/wrapper/gradle-wrapper.properties`:
```properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-9.4.1-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```

## Versoes Recomendadas (Validadas)

| Componente | Versao | Observacao |
|---|---|---|
| **Gradle** | 9.4.1 | Via wrapper (gradlew) |
| **Spring Boot** | 4.0.5 | LTS, Jakarta EE, Tomcat 11.0.20 |
| **Kotlin** | 2.3.0 | Compativel com Spring Boot 4.0.5 |
| **Java Toolchain** | 25 | JDK 25 |
| **Next.js** | 16.0.0 | Com Turbopack, output: 'export' |
| **Node/pnpm** | LTS / 10.9.0+ | Package manager |

## Dependencias Recomendadas (Validadas Spring Boot 4.0.5)

Cada app `{DOMAIN}-api` deve ter `build.gradle.kts` assim:

```kotlin
dependencies {
    implementation(project(":{DOMAIN}:{DOMAIN}-core"))
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.jetbrains.kotlin:kotlin-reflect")

    testImplementation("org.springframework.boot:spring-boot-starter-actuator-test")
    testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

kotlin {
    jvmToolchain(25)
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict", "-Xannotation-default-target=param-property")
    }
}

tasks.withType<Test>().configureEach {
    useJUnitPlatform()
}
```

## Makefile padrao
Targets obrigatorios:
```makefile
build-front-back-{DOMAIN}-api:
	cd {DOMAIN} && pnpm install
	cd {DOMAIN}/{DOMAIN}-web && pnpm run build
	mkdir -p {DOMAIN}/{DOMAIN}-api/src/main/resources/static
	cp -r {DOMAIN}/{DOMAIN}-web/out/. {DOMAIN}/{DOMAIN}-api/src/main/resources/static/ 2>/dev/null || true
	cp -r {DOMAIN}/{DOMAIN}-web/public/. {DOMAIN}/{DOMAIN}-api/src/main/resources/static/ 2>/dev/null || true

build-back-{DOMAIN}-api:
   ./gradlew :{DOMAIN}:{DOMAIN}-api:clean :{DOMAIN}:{DOMAIN}-api:build -x test

build-back-{DOMAIN}-async:
   ./gradlew :{DOMAIN}:{DOMAIN}-async:clean :{DOMAIN}:{DOMAIN}-async:build -x test

test-backend:
   ./gradlew test

discover-apps-local:
   find . -name "*Application.kt" -path "*/src/main/kotlin/*" -print

ci-local: test-backend build-back-{DOMAIN}-api build-back-{DOMAIN}-async

run-front-back: build-front-back-{DOMAIN}-api
   ./gradlew :{DOMAIN}:{DOMAIN}-api:bootRun
```

## Workflow padrao (modelo)
Jobs obrigatorios:
1. `discover-apps`
   - checkout
   - descobrir apps backend
   - derivar campos da matrix com `app_dir="${app_file%/src/main/kotlin/*}"`, `domain`, `appType` e `modulePath`
   - gerar output matrix JSON
2. `build-and-push-app` (matrix)
   - checkout
   - se appType = api e web existe: build web + copy dist
   - setup java
   - gradle build do modulo
   - docker build/push da imagem do app
3. `test-backend`
   - checkout
   - setup java
   - `./gradlew test`
4. `deploy-app` (matrix)
   - depende de build-and-push-app + test-backend
   - executa deploy separado por app

## Checklist pre-aplicacao
- [ ] `settings.gradle.kts` inclui todos os modulos backend
- [ ] Cada app backend tem `@SpringBootApplication`
- [ ] Cada app backend possui Dockerfile proprio
- [ ] Todos os apps backend tem actuator (`spring-boot-starter-actuator`)
- [ ] Frontend usa pnpm
- [ ] `next.config.mjs` com `output: 'export'`
- [ ] Secret `DOCKER_PASSWORD` configurado no GitHub

## Checklist pos-aplicacao
- [ ] Pipeline com `discover-apps` + matrix
- [ ] Build/push em paralelo por app
- [ ] `*-api` faz copy de `out/.` para `resources/static`
- [ ] Apps nao-api fazem build sem frontend
- [ ] Naming da imagem segue `{PROJECT_NAME}-{DOMAIN}-{APP_TYPE}`
- [ ] Deploy separado por app

## Comandos de validacao local
```bash
make ci-local
make run-front-back
./gradlew :{DOMAIN}:{DOMAIN}-api:clean :{DOMAIN}:{DOMAIN}-api:build -x test

docker build -t {DOCKER_USERNAME}/{PROJECT_NAME}-{DOMAIN}-api:latest \
  -f {DOMAIN}/{DOMAIN}-api/Dockerfile .
```

## Limites desta skill
- Nao define estrategia final de deploy (k8s/ECS/etc.)
