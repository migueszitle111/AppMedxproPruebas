import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { productos, Producto } from '../Shop/productos';
import ProductCard from './ProductoCard';
import Header from '../../components/Header';
const { width } = Dimensions.get('window');

function Shop(): React.JSX.Element {
  const [selected, setSelected] = useState<Producto | null>(null);
  const [isCargaCerrar, setIsCargaCerrar] = useState(false);
  useEffect(() => {
    console.log('selected ->', selected); // debugging: mira si cambia al tocar un producto
  }, [selected]);

  return (
    <View style={styles.container}>
     <Header onStartLogout={() => setIsCargaCerrar(true)} onLogoutFinish={() => setIsCargaCerrar(false)} />
      {/* Banner arriba */}
      <Image
        source={require('../../assets/shop/LP-19.png')}
        style={styles.banner}
        resizeMode='contain'
      />

      {/* Lista de productos */}
      <FlatList
        data={productos}
        renderItem={({ item }) => (
          <ProductCard item={item} onSelect={setSelected} />
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-around' }}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

    {selected && (
    <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={() => setSelected(null)}>
        <View style={styles.overlayBg} />
        </TouchableWithoutFeedback>

        <View style={styles.modalBox}>
        <Text style={styles.modalTitle}>{selected?.titulo}</Text>
        <Text style={styles.modalDesc}>{selected?.descripcion}</Text>
        {/*<Text style={styles.modalPrice}>{selected?.precio}</Text>*/}
        <Text style={styles.modalPrice}>{selected?.anuncio}</Text>

        <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setSelected(null)}
        >
            <Text style={{ color: '#fff' }}>Cerrar</Text>
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

export default Shop;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    //backgroundColor: '#121212',
    backgroundColor: '#0D0D0D',
  },
  banner: {
    width: '100%',
    height: width * 0.3,
    marginBottom: 15,
    marginTop: 10,
  },
  overlay: {
    position: 'absolute', // 👈 se monta encima de todo
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayBg: {
    ...StyleSheet.absoluteFillObject, // cubre todo
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalBox: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    alignItems: 'center',
    zIndex: 1, // para estar arriba del fondo oscuro
  },
  modalTitle: {
    fontSize: 18,
    //fontWeight: '700',
    fontFamily: 'LuxoraGrotesk-Bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#FF6F00',
  },
  modalDesc: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'LuxoraGrotesk-Light',
    color: '#FFFFFF',
  },
  modalPrice: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'LuxoraGrotesk-Bold',
    marginBottom: 20,
    color: '#B0BEC5',
  },
  closeBtn: {
    backgroundColor: '#FF6F00',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 20,
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
