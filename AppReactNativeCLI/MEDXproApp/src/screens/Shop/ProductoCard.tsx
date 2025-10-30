import React from 'react';
import {  Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Producto } from './productos';

interface Props {
  item: Producto;
  onSelect: (p: Producto) => void;
}

function ProductCard({ item, onSelect }: Props): React.JSX.Element {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={() => (scale.value = withSpring(0.95))}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        onPress={() => onSelect(item)}
      >
        <Image
          source={
            item.img
              ? item.img
              : require('../../assets/03_Íconos/03_02_PNG/I_Book.png') // imagen por defecto
          }
          style={styles.productImg}
          resizeMode="contain"
        />
        <Text style={styles.title}>{item.titulo}</Text>
        <Text style={styles.price}>{item.precio}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default ProductCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 10,
    marginBottom: 20,
    width: 160,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#FF6F00',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  productImg: {
    width: 100,
    height: 100,
    marginBottom: 10,
    marginLeft: 20,
    //tintColor: '#FF6F00',
  },
  title: {
    fontSize: 14,
    //fontWeight: '600',
    textAlign: 'center',
    color: '#FFFFFF',
    fontFamily: 'LuxoraGrotesk-Book',
  },
  price: {
    fontSize: 13,
    color: '#FF6F00',
    marginTop: 5,
    fontFamily: 'LuxoraGrotesk-Light',
  },
});
