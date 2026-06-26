import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __dirname = dirname(fileURLToPath(import.meta.url));

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "apps/web/.next/**",
      "backend/**",
      "frontend/**",
      "data/**"
    ],
    settings: {
      next: {
        rootDir: "apps/web/"
      }
    }
  },
  ...compat.extends("next/core-web-vitals")
];
