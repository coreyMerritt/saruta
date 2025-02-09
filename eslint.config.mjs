import globals from "globals"
import pluginJs from "@eslint/js"
import tseslint from "typescript-eslint"
import unusedImports from "eslint-plugin-unused-imports"

export default [
  {
    ignores: ["eslint.config.mjs"],
  },
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      "unused-imports": unusedImports
    },
    rules: {
      "prefer-const": ["error", {
        "destructuring": "any",
        "ignoreReadBeforeAssign": false
      }],
      "no-var": "error",
      "indent": ["error", 2, { "SwitchCase": 1 }],
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "no-self-assign": "off",
      "no-trailing-spaces": "error",
      "space-before-blocks": ["error", "always"],
      "space-before-function-paren": ["error", "never"],
      "space-unary-ops": ["error", { "words": true, "nonwords": true }],
      "array-bracket-spacing": ["error", "never"],
      "object-curly-spacing": ["error", "always"],
      "semi-spacing": ["error", { "before": false, "after": true }],
      "key-spacing": ["error", { "beforeColon": false, "afterColon": true }],
      "eol-last": ["error", "always"],
      "eqeqeq": ["error", "always"],
      "curly": ["error", "all"],
      "no-duplicate-imports": "error",
      "max-len": ["error", { "code": 120 }],
      "newline-before-return": "error",
      "padding-line-between-statements": [
        "error",
        { "blankLine": "always", "prev": "const", "next": "return" },
        { "blankLine": "always", "prev": "let", "next": "return" },
        { "blankLine": "always", "prev": "block", "next": "return" },
        { "blankLine": "always", "prev": "function", "next": "function" },
        { "blankLine": "always", "prev": "function", "next": "class" },
        { "blankLine": "always", "prev": "class", "next": "function" }
      ],
      "@typescript-eslint/explicit-function-return-type": ["error"],
      "quotes": ["error", "single"],
      "semi": ["error", "never"],
      "no-mixed-spaces-and-tabs": "error",
      "prefer-template": "error",
      "@typescript-eslint/typedef": [
        "error",
        {
          "variableDeclaration": false,
          "memberVariableDeclaration": false,
          "parameter": true,
          "propertyDeclaration": false,
          "arrowParameter": true
        }
      ],
      "@typescript-eslint/naming-convention": [
        "error",
        { "selector": "function", "format": ["camelCase"] },
        { "selector": "variable", "format": ["camelCase"], "leadingUnderscore": "allow" },
        { "selector": "variable", "modifiers": ["const"], "format": ["UPPER_CASE"] },
        { "selector": "property", "format": ["camelCase"], "leadingUnderscore": "allow" },
        { "selector": "parameterProperty", "format": ["camelCase"], "leadingUnderscore": "allow" },
        { "selector": "method", "format": ["camelCase"] }
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "vars": "all",
          "varsIgnorePattern": "^_",
          "args": "after-used",
          "argsIgnorePattern": "^_"
        }
      ],
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        {
          "vars": "all",
          "varsIgnorePattern": "^_",
          "args": "after-used",
          "argsIgnorePattern": "^_"
        }
      ]
    }
  }
]
