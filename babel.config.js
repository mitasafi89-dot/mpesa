module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // react-native-reanimated v4 relies on react-native-worklets; its Babel
    // plugin must be listed last. The original APK ships reanimated + worklets.
    plugins: ["react-native-worklets/plugin"],
  };
};
