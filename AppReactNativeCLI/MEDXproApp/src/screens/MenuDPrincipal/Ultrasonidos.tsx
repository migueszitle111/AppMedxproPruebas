// Ultrasonidos.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

function Ultrasonidos(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Pantalla de Ultrasonidos</Text>
    </View>
  );
}

export default Ultrasonidos;

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
