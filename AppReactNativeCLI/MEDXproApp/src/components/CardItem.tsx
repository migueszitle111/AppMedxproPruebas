import React from 'react';
import { View, Text, TouchableOpacity, ImageBackground, StyleSheet, ImageSourcePropType } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { Screens } from '../constants/screens';
import { NavigationProp as AppNav } from '../navigation/types';

interface CardItemProps {
  id: string;
  tipo: Screens;
  titulo?: string;
  descripcion?: string;
  imagenes: ImageSourcePropType[];
  customStyle?: any; // Permite estilos únicos por carta
  customImageStyle?: any; // Permite estilos únicos por imagen
  imageStyles?: any[]; // Permite estilos únicos por imagen
  overlayStyle?: any; // Permite estilos únicos para el overlay
}

const CardItem: React.FC<CardItemProps> = ({ id, tipo, titulo, descripcion, imagenes, customStyle, customImageStyle, imageStyles, overlayStyle }) => {
  const navigation = useNavigation<AppNav>();

  return (
    <TouchableOpacity
      onPress={() => {
        if (tipo !== Screens.Home) {
          navigation.navigate(tipo);
        }
      }}
      style={[styles.card, customStyle]}
    >
      <View style={styles.superposedImageContainer}>
        {imagenes.map((img, index) => {
        const containerStyle = imageStyles?.[index]?.container || imageStyles?.[index];
        const bgImageStyle = imageStyles?.[index]?.image || imageStyles?.[index]?.imageStyle;

        return (
            <ImageBackground
            key={index}
            source={img}
            style={[
                styles.imageBackground,
                containerStyle, // estilos de posición y tamaño del contenedor
            ]}
            imageStyle={[
                styles.imageStyle,
                customImageStyle,
                bgImageStyle, // estilos de la imagen interna
            ]}
            >
            {index === 0 && (
                <View style={[styles.overlay, overlayStyle]}>
                {titulo && <Text style={styles.cardTitle}>{titulo}</Text>}
                {descripcion && <Text style={styles.cardDescription}>{descripcion}</Text>}
                </View>
            )}
            </ImageBackground>
        );
        })}

      </View>
    </TouchableOpacity>
  );
};

export default CardItem;

const styles = StyleSheet.create({
  //___________Estilos para FlatList de HomeScreen2.tsx____________________________
  card: {
    margin: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  imageBackground: {
    width: '100%',
    height: 180,
    justifyContent: 'flex-end',
  },
  imageStyle: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Quando-Regular',
    color: '#fff',
  },
  cardDescription: {
    fontSize: 14,
    color: '#ddd',
    fontFamily: 'LuxoraGrotesk-Regular',
  },
  superposedImageContainer: {
    width: '100%',
    height: 180,
    position: 'relative', // importante para permitir superposición absoluta
  },
});
