import React from 'react';
import { Text, Image, TouchableOpacity, StyleSheet, Linking, View } from 'react-native';
import { Publicacion } from '../Perlas/publicaciones';

interface Props {
  item: Publicacion;
  onSelect: (p: Publicacion) => void;
}

function PublicacionCard({ item, onSelect }: Props): React.JSX.Element {
  return (
    <View style={styles.card}>
      {/* Imagen con link */}
      <TouchableOpacity onPress={() => item.link && Linking.openURL(item.link)}>
        <Image source={item.img} style={styles.img} resizeMode="cover" />
      </TouchableOpacity>

      <Text style={styles.title}>{item.titulo}</Text>
      <Text style={styles.desc}>{item.descripcion}</Text>

      {/* Solo aparece si hay descripción larga */}
      {item.descripcionLarga && (
        <TouchableOpacity style={styles.moreBtn} onPress={() => onSelect(item)}>
          <Text style={styles.moreText}>Leer más</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default PublicacionCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#101010',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    marginHorizontal: 10,
  },
  img: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    //fontWeight: '700',
    color: '#FF6F00',
    marginBottom: 6,
    fontFamily: 'LuxoraGrotesk-Book',
    textAlign: 'justify',
  },
  desc: {
    fontSize: 13.5,
    color: '#E0E0E0',
    marginBottom: 10,
    fontFamily: 'LuxoraGrotesk-Light',
    textAlign: 'justify',
  },
  moreBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF6F00',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  moreText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'LuxoraGrotesk-Light',
  },
});
