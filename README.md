# AI Showcase Skills

## Criando uma startup o mais rapido possivel com QUALIDADE elevada  usando IA

---

## Skills Disponíveis `Principais para um comeco rapido`

> Skills BASE: sao skills para o start do projeto

| Skill | Base | Descrição breve |
|---|---|---|
| `scaffold-monorepo-multimodulos-kotlin-speckit` | YES | Cria um ecosistema multi monorepo Kotlin Spring Boot com framework SDD speckit.|
| `scaffold-monorepo-multimodulos-kotlin` | YES | Cria um ecosistema multi monorepo Kotlin Spring Boot.|
| `scaffold-monorepo-multimodulos-add-nextjs` | NO | Adiciona o frontend (web/mobile) nos projetos dentro multi monorepo, independente na liguagem backend.|

---

## Quick Start 

### 1. Copie as skill executando o arquivo shell como abaixo

```sh
sh put-or-update-global-skills.sh
```

> Obs.: Para executar em cada LLM o comando pode mudar   
>  codex => `$scaffold-monorepo-multimodulos-kotlin-speckit`   
>  claude => `/scaffold-monorepo-multimodulos-kotlin-speckit`   
>  cursor => `/scaffold-monorepo-multimodulos-kotlin-speckit`   
>  copilot => `/scaffold-monorepo-multimodulos-kotlin-speckit`   

### 2. No VSCode, Cursor, Claude-Cli, execute a skill
Criando o monorepo backend kotlin
```
/scaffold-monorepo-multimodulos-kotlin-speckit
```
Adicionando frontend nextjs (web e mobile)
```
/scaffold-monorepo-multimodulos-add-nextjs
```

## Usando o npx

Instala as dependencias Node.js do projeto CLI.
```sh
npm install
```

Compila o TypeScript e gera os arquivos executaveis em `dist/`.
```sh
npm run build
```

Instala a CLI globalmente na sua maquina para usar o comando em qualquer pasta.
```sh
npm install -g .
```

Cria um novo projeto `my-saas` no padrao da skill `scaffold-monorepo-multimodulos-kotlin-speckit`.
```sh
creator-saas-ecosystem my-saas --kotlin --project-name sales-api --group br.com.lirio
```

Dentro da pasta criada, gera os arquivos completos do Gradle Wrapper (`gradlew`, `gradlew.bat` e jar do wrapper).
```sh
gradle wrapper --gradle-version 9.4.1 --distribution-type bin
```