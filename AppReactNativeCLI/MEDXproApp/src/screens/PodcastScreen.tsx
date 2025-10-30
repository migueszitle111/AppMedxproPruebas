import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

function PodcastScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Podcast</Text>
      <Text>Escucha nuestros podcasts informativos.</Text>
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

export default PodcastScreen;
