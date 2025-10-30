module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // ... otros plugins que puedas tener
    'react-native-reanimated/plugin', // <-- ¡DEBE SER LA ÚLTIMA LÍNEA AQUÍ!
  ],
};