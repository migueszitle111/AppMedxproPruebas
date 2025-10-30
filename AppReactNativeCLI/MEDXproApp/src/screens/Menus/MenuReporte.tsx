import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { NavigationProp } from '../../navigation/types';
import { useNavigation } from '@react-navigation/native';
import Header from '../../components/Header';

function MenuReporte(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp>();

  const [activeSection, setActiveSection] = useState<null | 'nervous' | 'neurological'>(null);
  const [isCargaCerrar, setIsCargaCerrar] = useState(false);

  const toggleSection = (section: 'nervous' | 'neurological') => {
    setActiveSection(prev => (prev === section ? null : section));
  };

  return (
    <View style={styles.container}>
      <Header onStartLogout={() => setIsCargaCerrar(true)} onLogoutFinish={() => setIsCargaCerrar(false)} />
      <Text style={styles.header}>Reporte Anatómico</Text>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Botón/Sección Sistema Nervioso */}
        <View style={[styles.section, styles.nervousSystem]}>
          {activeSection !== 'nervous' ? (
            <TouchableOpacity
              style={styles.sectionButton}
              onPress={() => toggleSection('nervous')}
            >
              <View style={styles.iconContainer}>
                <Image
                  source={require('../../assets/Iconos/PNG/mEDX_64_SNP.png')}
                  style={styles.iconLarge}
                />
                <Text style={styles.sectionTitle}>Sistema Nervioso</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <ScrollView style={styles.optionsScroll} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
              <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Neuronopatia')}>
                <Text style={styles.buttonText}>Neuronopatía</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Radiculopatia')}>
                <Text style={styles.buttonText}>Radiculopatía</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Plexopatia')}>
                <Text style={styles.buttonText}>Plexopatía</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Neuropatia')}>
                <Text style={styles.buttonText}>Neuropatía</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Polineuropatia')}>
                <Text style={styles.buttonText}>Polineuropatía</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('UnionNeuroMuscular')}>
                <Text style={styles.buttonText}>Unión Neuromuscular</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Miopatia')}>
                <Text style={styles.buttonText}>Miopatía</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>

        {/* Botón/Sección Vías Neurológicas */}
        <View style={[styles.section, styles.neurologicalPaths]}>
          {activeSection !== 'neurological' ? (
            <TouchableOpacity
              style={styles.sectionButton}
              onPress={() => toggleSection('neurological')}
            >
              <View style={styles.iconContainer}>
                <Text style={styles.sectionTitle}>Vías Neurológicas</Text>
                <Image
                  source={require('../../assets/Iconos/PNG/mEDX_64_VN.png')}
                  style={styles.iconLarge}
                />
              </View>
            </TouchableOpacity>
          ) : (
            <ScrollView style={styles.optionsScroll} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
              <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Visual')}>
                <Text style={styles.buttonText}>Visual</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Auditiva')}>
                <Text style={styles.buttonText}>Auditiva</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Somatosensorial')}>
                <Text style={styles.buttonText}>Somatosensorial</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('MotoraCorticoespinal')}>
                <Text style={styles.buttonText}>Corticoespinal</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </ScrollView>
      {/* Overlay cerrar sesión */}
      {isCargaCerrar && (
      <View style={styles.logoutOverlay}>
          <Text style={styles.logoutText}>Cerrando sesión...</Text>
          <ActivityIndicator size="large" color="#E65800" />
      </View>
      )}
    </View>
  );
}

export default MenuReporte;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    fontSize: 25,
    fontFamily: 'LuxoraGrotesk-Light',
    color: '#fff',
    textAlign: 'center',
    paddingVertical: 15,
    backgroundColor: '#000',
  },
  content: { paddingBottom: 20 },
  section: {
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 10,
    marginVertical: 10,
    maxHeight: 350, //para evitar que se expanda demasiado (opcional)
  },
  nervousSystem: { backgroundColor: '#C44900' },
  neurologicalPaths: { backgroundColor: '#616161' },
  sectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  sectionTitle: {
    fontSize: 23,
    fontFamily: 'LuxoraGrotesk-Light',
    color: '#fff',
    //marginBottom: 10,
    marginLeft: 15,
    flexShrink: 1,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '110%',
    marginLeft: -15,
  },
  iconLarge: {
    width: 190,
    height: 190,
    resizeMode: 'contain',
  },
  optionsScroll: {
    maxHeight: 250,
    marginVertical: 5,
  },
  button: {
    backgroundColor: '#000',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginVertical: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'LuxoraGrotesk-Light',
  },
  //Estilos para el spinner de cargado de cerrar sesion
logoutOverlay: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 999,
  },
  logoutText: {
  color: '#fff',
  fontSize: 20,
  fontFamily: 'LuxoraGrotesk-Light',
  },
});
