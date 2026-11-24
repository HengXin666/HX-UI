# HX-UI 2 (next/) for agents

`next/` is `@hx/ui` 2.x: a separate package (own package.json, lockfile, tsconfig). User docs: [README.md](./README.md).
The repository root (src/, docs/, scripts/gates, scripts/quality) is the legacy 0.18 line; its gates skip `next/`.

## Commands (run inside next/)

```bash
npm ci
npx tsc -b            # typecheck src/ + site/
npm run check         # size budgets + "use client" boundary (scripts/check-client.ts)
npm run check:bp      # blueprint logic + editor regression (34 checks)
npx vite build        # docs site -> dist-site/
npm run pack:check    # build:lib (runs check-client --dist) + npm pack + scripts/verify-pack.ts
```

CI runs the same list in `.github/workflows/next.yml`. Release: push tag `v<version>` matching package.json; `release.yml` builds and attaches the tgz.

## Boundaries

- `"use client"` goes at the top of every module that calls hooks, uses context, JSX event handlers, browser globals, or imports motion/react, recharts, three, @react-three/*. Pure utilities, constants, types, blueprint core (src/blueprint/*.ts) stay without it.
- Constants and helpers exported from an aggregate entry (".", "./theme", "./data", "./blueprint/ui" ...) must live in a module without the directive (hooks/theme-script.ts, data/charts/helpers.ts, blueprint/ui/shortcuts.ts). check-client enforces it.
- Framework-free modules that touch browser APIs only inside functions carry `// hx:server-safe <reason>` instead of the directive.
- Colors only through tokens; animate transform / opacity / filter; respect reduced motion (README "规则").
- New runtime dependencies need a reason; check `scripts/verify-pack.ts` output for the bare-import list.
