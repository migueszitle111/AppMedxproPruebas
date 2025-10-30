import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

function TecnicasScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Técnicas</Text>
      <Text>Bienvenido a la sección de técnicas.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default TecnicasScreen;
