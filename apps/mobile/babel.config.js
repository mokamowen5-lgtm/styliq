module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // Reanimated 3.16+ moved its Babel plugin to react-native-worklets/plugin.
    // Must be the LAST plugin in the list.
    plugins: ["react-native-worklets/plugin"],
  }
}
