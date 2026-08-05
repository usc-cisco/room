/** @type {import("lint-staged").Configuration} */
const config = {
  "*.{ts,tsx,mts,cts}": ["prettier --check", "eslint --max-warnings=0"],
  "*.{js,jsx,mjs,cjs,json,css,md}": ["prettier --check"],
}

export default config
