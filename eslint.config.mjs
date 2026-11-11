import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores([
    ".next/**",
    ".next-build-verify/**",
    "_incoming_review/**",
    "artifacts/**",
    "node_modules/**",
    "src/generated/prisma/**",
    "Aula*/**",
    "stacks_H.md",
  ]),
]);
