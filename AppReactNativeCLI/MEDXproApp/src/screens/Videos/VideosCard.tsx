import React from 'react';
import { Text, TouchableOpacity, StyleSheet, View, Image } from 'react-native';
import { VideoItem } from '../Videos/videos_info';
//import { Ionicons } from '@expo/vector-icons'; // si usas react-native-vector-icons

interface Props {
  item: VideoItem;
  onSelect: (v: VideoItem) => void;
}

function VideosCard({ item, onSelect }: Props): React.JSX.Element {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onSelect(item)}>
      <View style={styles.videoBox}>
      {item.thumbnail ? (
          <Image source={item.thumbnail} style={styles.thumbnail} resizeMode="cover" />
        ) : (
          <Image source={require('../../assets/03_Íconos/03_02_PNG/I_Play.png')}
            style={styles.playIcon} resizeMode="contain"
          />
        )}
      </View>
      <Text style={styles.title}>{item.titulo}</Text>
    </TouchableOpacity>
  );
}

export default VideosCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    marginHorizontal: 10,
  },
  videoBox: {
    height: 180,
    backgroundColor: '#0D0D0D',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',// para que no se salga de la caja
  },
  title: {
    fontSize: 16,
    //fontWeight: '600',
    fontFamily: 'LuxoraGrotesk-Book',
    color: '#FFFFFF',
    marginLeft: 3,
  },
  playIcon: {
    width: 85,
    height: 85,
    tintColor: '#FF6F00', // opcional, si querés forzar un color blanco
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
});
