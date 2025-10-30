import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { NavigationProp } from '../../navigation/types';
import { useNavigation } from '@react-navigation/native';
import Header from '../../components/Header';

function MenuTecnicas(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      <Header />
      <Text style={styles.header}>Técnicas</Text>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Sección Técnicas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Técnicas</Text>
          <View style={styles.line} />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Neurografia')}><Text style={styles.buttonText}>Neurografía</Text></TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Miografia')}><Text style={styles.buttonText}>Miografía</Text></TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('PotencialesProvocados')}><Text style={styles.buttonText}>Potenciales Provocados</Text></TouchableOpacity>
            <TouchableOpacity style={styles.button}><Text style={styles.buttonText}>Pruebas Especiales</Text></TouchableOpacity>
            {/*<TouchableOpacity style={styles.button}><Text style={styles.buttonText}>Valores</Text></TouchableOpacity>
            <TouchableOpacity style={styles.button}><Text style={styles.buttonText}>Protocolo</Text></TouchableOpacity>*/}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default MenuTecnicas;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    fontSize: 28,
    fontFamily: 'LuxoraGrotesk-Light',
    color: '#fff',
    textAlign: 'center',
    paddingVertical: 15,
    backgroundColor: '#000',
  },
  content: { paddingBottom: 20 },
  section: {
    backgroundColor: '#E65100',
    padding: 20,
    borderRadius: 10,
    marginHorizontal: 10,
    marginVertical: 10,
  },
  sectionTitle: { fontSize: 22, fontFamily: 'LuxoraGrotesk-Bold', color: '#fff' },
  line: { height: 1, backgroundColor: '#fff', marginVertical: 10 },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#000',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginVertical: 5,
    width: '48%', // Para hacer dos columnas
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, textAlign: 'center', fontFamily: 'LuxoraGrotesk-Light' },
});
