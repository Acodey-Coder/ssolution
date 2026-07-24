# project-standard.md — ssolution (tier: Small)

> Project-wide conventions — this file is always global, never per module. Every agent inherits these.

## Language & Tooling
- Language/framework + version: TypeScript ~5.9.2, Angular ^21.2.0 (standalone components, `@angular/build:application` builder)
- Lint/format: Prettier (`.prettierrc` — printWidth 100, singleQuote, Angular parser for `.html`), `.editorconfig`. No ESLint config present.
- Package manager / build: npm (`npm@11.6.2` pinned in `package.json`), Angular CLI (`ng build` / `ng serve` / `ng test`)
- Styling: Tailwind CSS (`tailwind.config.js`, with `@tailwindcss/forms` and `@tailwindcss/container-queries` plugins)

## Naming Conventions
- Files: kebab-case folders per page/component (`src/app/pages/<name>/<name>.ts|.html|.css|.spec.ts`)
- Functions/classes/variables: PascalCase component classes (e.g. `Contact`, `Home`), matching Angular standalone-component style; no `Component` suffix in class names observed
- Database objects: N/A — no database in this project

## Folder Structure
- `src/app/pages/<page>/` — one folder per routed page (`home`, `about`, `services`, `portfolio`, `contact`), each with `.ts`, `.html`, `.css`, `.spec.ts`
- `src/app/components/<component>/` — shared components (`top-nav`, `footer`)
- `src/app/app.routes.ts` — route table
- `public/` — static assets (logos, favicon)
- New pages go under `src/app/pages/`; new shared components under `src/app/components/`

## Commit & Branch Format
- Conventional Commits: `feat:`, `fix:`, `chore:`, `style:`, `refactor:` prefix + short imperative subject line.

## Error Handling Philosophy
- No custom error handling infrastructure observed — static Angular frontend with no HTTP calls, no backend, no global error boundary. Angular's default error behavior applies.
- If backend/API integration is added later, this section must be revisited before relying on it.

## Logging Strategy
- None established — no logging library or structured logging in use; browser console only (Angular default).

## Testing Matrix (canonical — referenced by all case files and layer standards)
- **Case 1**: unit test covering the changed logic only.
- **Case 2**: unit tests per layer + one feature-level integration test.
- **Case 3**: unit tests per layer per scope unit + cross-boundary contract/integration test.
- Test runner & location conventions: `@angular/build:unit-test` (Vitest under the hood, per `devDependencies`), run via `npm test` / `ng test`. Spec files co-located as `<name>.spec.ts` next to the component they test.
