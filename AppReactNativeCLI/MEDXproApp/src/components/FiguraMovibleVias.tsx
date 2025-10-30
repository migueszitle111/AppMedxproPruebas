import React from 'react';
import { Image, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  runOnJS,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';

// Constante exportada para el tamaño de figura
export const FIGURA_SIZE = 80;

// Definir tipo Figura localmente
type Figura = {
  id: string;
  tipo: 'circle' | 'square';
  uri: string;
  posicion: { x: number; y: number };
};

interface Props extends Pick<Figura, 'id' | 'tipo' | 'uri'> {
  posicionInicial: { x: number; y: number };
  onEliminar: (id: string) => void;
  onActualizarPosicion: (id: string, x: number, y: number) => void;
  limitesContenedor: { width: number; height: number };
  ocultarBoton?: boolean;
}

const FiguraMovible: React.FC<Props> = ({
  id,
  tipo,
  uri,
  posicionInicial,
  onEliminar,
  onActualizarPosicion,
  limitesContenedor,
  ocultarBoton,
}) => {
  const translateX = useSharedValue(posicionInicial.x);
  const translateY = useSharedValue(posicionInicial.y);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx: any) => {
      // Tamaño real de la figura (FIGURA_SIZE = 80)
      const figuraSize = FIGURA_SIZE;

      let newX = ctx.startX + event.translationX;
      let newY = ctx.startY + event.translationY;

      // Limitar dentro del contenedor (0 a ancho/alto del contenedor menos el tamaño de la figura)
      newX = Math.max(0, Math.min(newX, limitesContenedor.width - figuraSize));
      newY = Math.max(0, Math.min(newY, limitesContenedor.height - figuraSize));

      translateX.value = newX;
      translateY.value = newY;
    },
    onEnd: () => {
      runOnJS(onActualizarPosicion)(id, translateX.value, translateY.value);
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Reanimated.View style={[styles.figuraContenedor, animatedStyle]}>
        <Image
          source={{ uri }}
          style={tipo === 'circle' ? styles.imagenCirculo : styles.imagenCuadro}
        />
        {!ocultarBoton && (
        <TouchableOpacity style={styles.botonEliminar} onPress={() => onEliminar(id)}>
          <Text style={{ color: 'white' }}>✕</Text>
        </TouchableOpacity>
        )}
      </Reanimated.View>
    </PanGestureHandler>
  );
};

export default FiguraMovible;

const styles = StyleSheet.create({
  figuraContenedor: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 20,
  },
  imagenCirculo: {
    width: FIGURA_SIZE,
    height: FIGURA_SIZE,
    borderRadius: FIGURA_SIZE / 2,
    borderWidth: 1.2,
    borderColor: 'gray',
    //borderColor: '#999999',
  },
  imagenCuadro: {
    width: FIGURA_SIZE,
    height: FIGURA_SIZE,
    borderWidth: 1.2,
    borderColor: 'gray',
    //borderColor: '#999999',
  },
  botonEliminar: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'red',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
