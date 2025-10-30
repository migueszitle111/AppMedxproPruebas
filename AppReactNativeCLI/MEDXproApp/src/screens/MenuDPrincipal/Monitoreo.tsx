// Monitoreo.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

function Monitoreo(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Pantalla de Monitoreo</Text>
    </View>
  );
}

export default Monitoreo;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
