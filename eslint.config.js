// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expo = require("eslint-config-expo/flat");

module.exports = defineConfig([expo, { ignores: ["dist/**"] }]);
