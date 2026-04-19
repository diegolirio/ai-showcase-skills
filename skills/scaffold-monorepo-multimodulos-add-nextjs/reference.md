# Reference

## Goal

This skill scaffolds frontend-only monorepos that are independent from the backend
stack. The backend may be Java, Kotlin, Python, Go, or anything else.

## Default Shape

```text
{ROOT}/
├── {project-name}/
│   ├── {project-name}-web/
│   ├── {project-name}-mobile/
│   └── {project-name}-ui/
└── shared-front/
```

Examples:

```text
analizza/
├── properties/
│   ├── properties-web/
│   ├── properties-mobile/
│   └── properties-ui/
└── shared-front/
```

```text
company-x/
├── auctions/
│   ├── auctions-web/
│   ├── auctions-mobile/
│   └── auctions-ui/
└── shared-front/
```

## Naming Rules

- Use the project slug exactly as provided.
- Web app folder: `{{project-name}}-web`
- Mobile app folder: `{{project-name}}-mobile`
- Project UI package: `{{project-name}}-ui`
- Root shared package: `shared-front`

## Workspace Rules

- Keep a `package.json` at the selected frontend workspace root.
- Use `pnpm` workspaces when the project has more than one frontend package.
- Keep `shared-front` root-level so it can be shared across multiple projects.
- Keep `{{project-name}}-ui` inside the project so it only serves that domain.

## Detection Heuristics

Look for:

- `package.json`
- `next.config.*`
- `app/` or `pages/`
- `app.json`
- `expo-router`
- `shared-front`
- `*-ui`

If more than one project root is found, stop and ask which projects should be scaffolded.

## File Set

For a fresh project, scaffold the minimum:

- `{{project-name}}/package.json`
- `{{project-name}}-web/package.json`
- `{{project-name}}-web/next.config.mjs`
- `{{project-name}}-web/tsconfig.json`
- `{{project-name}}-web/app/layout.tsx`
- `{{project-name}}-web/app/page.tsx`
- `{{project-name}}-mobile/package.json`
- `{{project-name}}-mobile/app.json`
- `{{project-name}}-mobile/babel.config.js`
- `{{project-name}}-mobile/tsconfig.json`
- `{{project-name}}-mobile/app/_layout.tsx`
- `{{project-name}}-mobile/app/index.tsx`
- `{{project-name}}-ui/package.json`
- `{{project-name}}-ui/src/index.ts`
- `shared-front/package.json`
- `shared-front/src/index.ts`

## Shared Packages

- `{{project-name}}-ui` is for UI shared only within the project.
- `shared-front` is for shared frontend code across multiple projects.
- Avoid importing backend concerns into either package.

## Prompt Pattern

When multiple projects exist, ask:

> I found `properties` and `cars`. Do you want me to scaffold all projects or only `properties`?

When a single project exists, scaffold it without asking for extra confirmation.
