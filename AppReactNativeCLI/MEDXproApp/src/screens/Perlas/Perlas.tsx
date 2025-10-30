import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { publicaciones, Publicacion } from './publicaciones';
import PublicacionCard from '../Perlas/PublicacionCard';
import Header from '../../components/Header';
import { ScrollView } from 'react-native-gesture-handler';
const { width } = Dimensions.get('window');

function Perlas(): React.JSX.Element {
  const [selected, setSelected] = useState<Publicacion | null>(null);
  const [isCargaCerrar, setIsCargaCerrar] = useState(false);

  return (
    <View style={styles.container}>
      <Header onStartLogout={() => setIsCargaCerrar(true)} onLogoutFinish={() => setIsCargaCerrar(false)} />

      <FlatList
        data={publicaciones}
        renderItem={({ item }) => (
          <PublicacionCard item={item} onSelect={setSelected} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 15 }}
      />

      {/* Overlay para descripción larga */}
      {selected && (
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => setSelected(null)}>
            <View style={styles.overlayBg} />
          </TouchableWithoutFeedback>

          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{selected.titulo}</Text>
            <ScrollView style={styles.scrollDesc}>
              <Text style={styles.modalDescLarga}>{selected.descripcionLarga}</Text>
            </ScrollView>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
              <Text style={{ color: '#fff', fontFamily: 'LuxoraGrotesk-Book', fontSize: 16 }}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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

export default Perlas;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalBox: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 15,
    width: '93%',
    alignItems: 'center',
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 20,
    //fontWeight: '700',
    marginBottom: 10,
    color: '#FF6F00',
    textAlign: 'center',
    fontFamily: 'LuxoraGrotesk-Book',
    //borderWidth: 1,
    borderColor: '#FF6F00',
    borderBottomWidth: 5,
    paddingBottom: 5,
  },
  scrollDesc: {
    maxHeight: width * 1, // altura máxima del scroll
    marginVertical: 10,
  },
  modalDesc: {
    fontSize: 17,
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'justify',
    fontFamily: 'LuxoraGrotesk-Book',
    //lineHeight: 20,
    //borderWidth: 1.2,
    borderColor: '#333',
    //padding: 10,
    paddingHorizontal: 5,
  },
  modalDescLarga: {
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'justify',
    fontFamily: 'LuxoraGrotesk-Light',
    lineHeight: 20,
    borderWidth: 1.2,
    borderColor: '#333',
    padding: 10,
  },
  closeBtn: {
    backgroundColor: '#FF6F00',
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 25,
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
