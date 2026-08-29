export default {
  "*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}": [
    "eslint --fix --max-warnings=0 --no-warn-ignored",
    "prettier --write",
  ],
  "*.{json,jsonc,yaml,yml,css,scss,html}": "prettier --write",
};
