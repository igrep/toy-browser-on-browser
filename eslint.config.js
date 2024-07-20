import * as os from "node:os";
import * as path from "node:path";

import globals from "globals";

import { FlatCompat } from "@eslint/eslintrc";

import parser from "@typescript-eslint/parser";
import typeScriptEslint from "@typescript-eslint/eslint-plugin";
import promise from "eslint-plugin-promise";
import love from 'eslint-config-love';

const baseDirectory = dirOfImportMetaUrl(import.meta.url)

const compat = new FlatCompat({ baseDirectory });

export default [
  {
    ignores: [
      "**/*.d.ts",
      "**/*.js",
      "**/node_modules/",
      "**/*.mjs",
    ],
  },
  ...compat.extends(
    "plugin:promise/recommended",
    'plugin:react-hooks/recommended',
  ),
  {
    ...love,
    files: ["**/*.ts{x,}"],
    languageOptions: {
      globals: {
        ...globals.builtin,
        ...globals.browser,
        ...globals.es2021,
        ...globals.worker,
      },
      parser,
      parserOptions: {
        tsconfigRootDir: baseDirectory,
        project: ["./tsconfig.json"],
        sourceType: "module",
        extraFileExtensions: [],
      },
    },
    plugins: {
      "@typescript-eslint": typeScriptEslint,
      promise,
    },
    rules: {
      "import/no-unresolved": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/no-floating-promises": [
        "error",
        {
          ignoreIIFE: true,
        },
      ],
      "@typescript-eslint/no-redundant-type-constituents": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "caughtErrorsIgnorePattern": "^_",
          "destructuredArrayIgnorePattern": "^_"
        },
      ],

      // Disable rules related to style, which is enforced by prettier
      "@typescript-eslint/comma-dangle": "off",
      "@typescript-eslint/comma-spacing": "off",
      "@typescript-eslint/indent": "off",
      "@typescript-eslint/keyword-spacing": "off",
      "@typescript-eslint/object-curly-spacing": "off",
      "@typescript-eslint/quotes": "off",
      "@typescript-eslint/semi": "off",
      "@typescript-eslint/space-before-function-paren": "off",
      "@typescript-eslint/space-infix-ops": "off",
      "@typescript-eslint/member-delimiter-style": "off",
      "@typescript-eslint/consistent-indexed-object-style": ["error", "index-signature"],
      "@typescript-eslint/strict-boolean-expressions": ["error", {
        allowNullableBoolean: true,
        allowNullableString: true,
        allowNullableObject: true,
      }],
    },
  },
  {
    files: ["*.test.[jt]s"],
    rules: {
      "@typescript-eslint/no-null-assertion": "off",
    },
  },
];

function fileOfImportMetaUrl(importMetaUrl) {
  return dropLeadingSlashOnWindows(new URL(importMetaUrl).pathname);
}

function dirOfImportMetaUrl(importMetaUrl) {
  return path.dirname(fileOfImportMetaUrl(importMetaUrl));
}

function dropLeadingSlashOnWindows(pathname) {
  return os.platform() === "win32" ? pathname.slice(1) : pathname;
}
