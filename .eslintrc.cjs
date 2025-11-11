module.exports = {
  env: {
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/node",
    "plugin:prettier/recommended"
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module"
  },
  rules: {
    // project preferences
    "no-console": ["warn", { allow: ["warn", "error", "info"] }],
    "import/no-unresolved": "off",
    "prettier/prettier": ["error"]
  },
  settings: {
    "import/resolver": {
      node: { extensions: [".js", ".mjs", ".cjs"] }
    }
  }
};
