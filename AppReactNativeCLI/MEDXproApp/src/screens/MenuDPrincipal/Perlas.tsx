// Perlas.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

function Perlas(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Pantalla de Perlas</Text>
    </View>
  );
}

export default Perlas;

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
