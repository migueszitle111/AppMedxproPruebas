import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Header from '../components/Header';

const EventosScreen = () => {
  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.containerSecundary}>
        <Text style={styles.text}>Eventos</Text>
      </View>
    </View>
  );
};

export default EventosScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  text: { color: '#fff', fontSize: 20 },
  containerSecundary: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
});
