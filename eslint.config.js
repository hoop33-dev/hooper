// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expo = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expo,
  { ignores: ["dist/**"] },
  {
    rules: {
      // Prevent reverting to the deprecated styled() NativeWind API.
      // All RN components accept className directly via react-native-css. See CLAUDE.md.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "nativewind",
              importNames: ["styled"],
              message:
                "Use className directly — all RN components accept it via react-native-css. See CLAUDE.md.",
            },
          ],
        },
      ],
      // Prevent inline fontFamily: 'Inter' — use className='font-inter' instead. See CLAUDE.md.
      "no-restricted-syntax": [
        "warn",
        {
          selector: "Property[key.name='fontFamily'][value.value='Inter']",
          message:
            "Use className='font-inter' instead of style={{ fontFamily: 'Inter' }}. See CLAUDE.md.",
        },
      ],
    },
  },
]);
