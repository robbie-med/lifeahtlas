# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Build Fixes (2026-02-16)

The following TypeScript errors were encountered during `npm run build` and fixed:

| File | Error | Fix |
|------|-------|-----|
| `src/components/family/FamilyMemberList.tsx` | `TS6133`: `Badge` imported but never used | Removed unused `Badge` import |
| `src/components/longevity/LongevityView.tsx` | `TS2322`: Recharts `Tooltip` `formatter` params typed as `number, string` but Recharts passes `number \| undefined, string \| undefined` | Changed formatter signature to `(value?: number, name?: string)` |
| `src/components/timeline/TimelineCanvas.tsx` | `TS6133`: `useEffect` imported but never used | Removed `useEffect` from import |
| `src/components/timeline/TimelineCanvas.tsx` | `TS6133`: `minPx` destructured but never used in `handleThumbPointerMove` | Removed `minPx` from destructuring |
| `src/components/timeline/TimelineCanvas.tsx` | `TS2322`: `textTransform` is not a valid SVG attribute prop | Changed to `style={{ textTransform: 'uppercase' }}` |
| `src/engine/family-phase-engine.ts` | `TS6196`: `Sex` and `Relationship` type imports never used | Removed unused type imports |

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
