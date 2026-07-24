# frontend-standard.md — ssolution (tier: Small)

## Scope
Whole project frontend (the entire project — there is no backend).

## Component Structure
- Framework: Angular ^21.2.0, standalone components (no NgModules observed)
- Folder layout: one folder per page under `src/app/pages/<page>/`; shared components under `src/app/components/<component>/`
- Naming: kebab-case folders/files, PascalCase component class names (no `Component` suffix)
- Container/presentational split: not observed/enforced — pages are simple, self-contained standalone components

## State Management
- Library: none — no NgRx/signals-store or global state library in use
- Local vs global rules: N/A, no shared state observed
- Data-fetching pattern: none — no `HttpClient`/`fetch` calls anywhere in `src/`; this is a static content site

## Styling
- Methodology/framework: Tailwind CSS (`tailwind.config.js`) + per-component `.css` files, `@tailwindcss/forms` and `@tailwindcss/container-queries` plugins enabled
- Design tokens: none custom — default Tailwind theme
- Responsive rules: TBD — ask before relying on this (no documented breakpoint/responsive convention observed beyond Tailwind defaults)

## API Integration
- None — no backend exists, no API calls in the codebase.
- Before wiring any future API call: `node ai-sop/codemap-tool/bin/cli.js query <endpoint_or_component>` to confirm the target exists or is planned.

## Testing
Per the testing matrix in `project-standard.md`, using Angular's unit-test builder (Vitest), spec files co-located as `<name>.spec.ts`.
