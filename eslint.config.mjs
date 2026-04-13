import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // shadcn/ui components with upstream version-compatibility issues
    // (not used in MVP; revisit when upgrading their peer deps)
    "components/ui/calendar.tsx",
    "components/ui/chart.tsx",
    "components/ui/resizable.tsx",
    "components/ui/form.tsx",
    "components/ui/sonner.tsx",
  ]),
]);

export default eslintConfig;
