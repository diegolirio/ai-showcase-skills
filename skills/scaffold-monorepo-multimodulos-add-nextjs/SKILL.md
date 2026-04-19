---
name: scaffold-monorepo-multimodulos-add-nextjs
description: >-
  Scaffolds or extends a frontend monorepo with Next.js web apps, Expo mobile apps,
  shared domain UI packages, and a root-level shared-front package. Use when the
  user asks to create or extend a frontend structure for one or more projects,
  including templates like {{project-name}}-web, {{project-name}}-mobile, and
  {{project-name}}-ui, regardless of whether the backend is Java, Python, Go, or
  anything else.
---

# Scaffold frontend monorepo (Next.js + Expo)

## What This Skill Does

Create or extend a frontend monorepo that is independent from the backend stack.
It standardizes a structure like:

```text
{ROOT}/
├── {project-name}/
│   ├── {project-name}-web/
│   ├── {project-name}-mobile/
│   └── {project-name}-ui/
└── shared-front/
```

Use this skill for projects such as `properties-web` and `properties-mobile`, but
always keep the names generic and template-based:

- `{{project-name}}-web`
- `{{project-name}}-mobile`
- `{{project-name}}-ui`
- `shared-front` at the root for cross-project frontend sharing

## Core Rules

- Frontend structure is independent from backend technology.
- Never create backend modules or backend-specific folders.
- If multiple frontend projects exist in the monorepo, first detect them and ask
  whether the scaffold should be applied to all projects or only the selected ones.
- Treat each project as independent. `properties` and `cars` are separate projects.
- `shared-front` is root-level and can be consumed by more than one frontend project.
- `{{project-name}}-ui` is project-scoped UI shared between that project's web and mobile apps.

## Discovery

Before creating files, inspect the monorepo for existing frontend projects:

- directories that contain `package.json`
- Next.js indicators: `next.config.*`, `app/`, `pages/`, `.next/`
- Expo indicators: `app.json`, `app.config.*`, `expo`, `expo-router`
- shared UI indicators: `*-ui`, `ui`, `shared-front`

If one project exists, scaffold that project.
If multiple projects exist, ask a short question like:

- "I found `properties` and `cars`. Do you want me to scaffold all projects or only `properties`?"

Do not assume that every detected project should be changed.

## Default Output Layout

For each selected project, create or extend:

```text
{project-name}/
├── {project-name}-web/
├── {project-name}-mobile/
└── {project-name}-ui/
```

At the root of the frontend workspace, keep:

```text
shared-front/
```

## Package Manager and Workspace Rules

- Prefer `pnpm` workspaces.
- Keep a `package.json` at the frontend workspace root for the selected project.
- Use local workspace/package references for `{{project-name}}-ui`.
- Use local file or workspace references for root `shared-front`.
- Do not bind the frontend to a backend build tool.

## Setup Guidance

For a new project, scaffold the minimum viable files:

- `{{project-name}}/package.json`
- `{{project-name}}-web/package.json`, `next.config.mjs`, `tsconfig.json`, `app/layout.tsx`, `app/page.tsx`
- `{{project-name}}-mobile/package.json`, `app.json`, `babel.config.js`, `tsconfig.json`, `app/_layout.tsx`, `app/index.tsx`
- `{{project-name}}-ui/package.json`, `src/index.ts`, plus any shared UI primitives
- `shared-front/package.json`, `src/index.ts`, plus any cross-project shared primitives

Keep the implementation simple and reusable. Prefer placeholders over project-specific
logic when the user did not provide domain details.

## Naming Conventions

- Use the project slug exactly as provided for folder and package names.
- Derive web and mobile app names by appending `-web` and `-mobile`.
- Derive the shared domain UI package by appending `-ui`.
- Keep `shared-front` as a root-level generic shared package for frontend code used
  by multiple projects.

## Validation Mindset

After scaffolding, verify that:

- the package manager can install dependencies inside the selected project root
- the web app can start independently
- the mobile app can start independently
- shared UI imports resolve through local workspace or file references
- root `shared-front` does not depend on any single project

## When to Stop and Ask

Pause and ask the user when:

- multiple frontend projects are detected and the target scope is unclear
- the requested project naming conflicts with existing folders
- the user wants the scaffold applied to all projects, but shared UI rules differ
- the frontend workspace root is ambiguous

## Output Expectations

Favor a clean structure that can be copied to new monorepos of any backend stack.
Keep the skill backend-agnostic, and focus only on frontend folders, workspace
config, naming, and startup scripts.

## Reference

See [reference.md](reference.md) for concrete tree examples, workspace layout,
and the default naming template for `{{project-name}}-web`, `{{project-name}}-mobile`,
`{{project-name}}-ui`, and `shared-front`.
