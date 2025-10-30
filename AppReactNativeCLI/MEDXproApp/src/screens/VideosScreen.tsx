import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

function VideosScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Videos</Text>
      <Text>Explora nuestra colección de videos educativos.</Text>
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

export default VideosScreen;
