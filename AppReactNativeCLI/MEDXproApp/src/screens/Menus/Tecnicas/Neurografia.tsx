import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TouchableWithoutFeedback, LayoutAnimation, UIManager, Dimensions, TextInput, KeyboardAvoidingView, useWindowDimensions    } from 'react-native';
import Orientation from 'react-native-orientation-locker';
import GaleriaT from './GaleriaT';

  UIManager.setLayoutAnimationEnabledExperimental &&
  UIManager.setLayoutAnimationEnabledExperimental(true);

// --- Definición de tipos para los botones y datos de la galería ---
type InfoButtonData = {
  type: 'info';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text: string;
  infoText: string;
  infoBoxX?: number;
  infoBoxY?: number;
  infoBoxWidth?: number;
  infoBoxHeight?: number;
  rotateDeg?: number;
  infoImage?: any; // Nueva propiedad para mostrar imagen en el cuadro
};

type ImageButtonData = {
  type: 'image'; // Nuevo discriminador de tipo
  x: number;
  y: number;
  width?: number;
  height?: number;
  text: string;
  imageSource: any; // Fuente de la imagen (ej: require('../assets/image.png'))
  popupImageX?: number; // Posición X de la imagen emergente
  popupImageY?: number; // Posición Y de la imagen emergente
  popupImageWidth?: number; // Ancho de la imagen emergente
  popupImageHeight?: number; // Alto de la imagen emergente
  buttonImageSource?: any; // **NUEVO**: Imagen para el background del botón (opcional)
};

type ButtonData = InfoButtonData | ImageButtonData;

type GalleryContent = {
  imagenes: any[];
  botones: ButtonData[][]; // Array de arrays de ButtonData, uno por cada imagen
};

// --- Datos de categorías y subcategorías (sin cambios en esta sección) ---
const categorias: { nombre: string; subcategorias: string[] }[] = [
  {
    nombre: 'Miembros Superiores',
    subcategorias: [
      'Mediano (motor)',
      'Mediano (sensitivo)',
      'Ulnar (motor)',
      'Ulnar (sensitivo)',
      'Radial (motor)',
      'Radial (sensitivo)',
      'Antebraquial cutáneo lateral',
      'Antebraquial cutáneo medial',
      'Antebraquial cutáneo posterior',
      'Axilar',
      'Musculocutáneo',
      'Supraescapular',
      'Escapular dorsal',
      'Torácico largo',
      'Toracodorsal',
    ],
  },
  {
    nombre: 'Cervicales/Craneales',
    subcategorias: [
      'Frénico',
      'Espinal accesorio',
      'Supraclavicular',
      'Auricular mayor',
      'Occipital mayor',
      'Facial',
      'Trigémino',
    ],
  },
  {
    nombre: 'Miembros Inferiores',
    subcategorias: [
      'Peroneo',
      'Peroneo superficial',
      'Peroneo profundo',
      'Tibial',
      'Sural',
      'Plantar',
      'Femoral',
      'Safeno',
      'Femorocutáneo lateral',
      'Cutáneo femoral',
    ],
  },
  {
    nombre: 'Sacros',
    subcategorias: [
      'Ciático',
      'Pudendo',
      'Dorsal del pene',
      
    ],
  },
];
const IMGTabla = require('../../../assets/tecnicas/Info/I_Tabla_Gris.png');
const IMGGrafica = require('../../../assets/tecnicas/Info/mEDX_64_Valores.png');
// --- Mapeo de opciones a sus imágenes y nuevos datos de botones con propiedades de infoBox ---
// NOTA: Ajusta todas las coordenadas (x, y) y los tamaños (width, height) de los botones,
// así como el contenido de 'infoText' y las nuevas propiedades 'infoBoxX', 'infoBoxY',
// 'infoBoxWidth', 'infoBoxHeight' según tus necesidades.
// Si no defines infoBoxX/Y/Width/Height, se usarán los valores por defecto del estilo.
const contenidoPorOpcion: Record<string, GalleryContent> = {

  'Mediano (motor)': {
    imagenes: [
      require('../../../assets/tecnicas/neurografia/abductor_corto_pulgar.png'),
      require('../../../assets/tecnicas/neurografia/abductor_corto_pulgar_complemento.png'),
      require('../../../assets/tecnicas/neurografia/flexor_largo_pulgar.png'),
      require('../../../assets/tecnicas/neurografia/pronador_cuadrado.png'),
      require('../../../assets/tecnicas/neurografia/palmar_mayor.png'),
      require('../../../assets/tecnicas/neurografia/pronador_redondo.png'),
      require('../../../assets/tecnicas/neurografia/inching.png'),
    ],
    botones: [
      // Botones para Abductor_Corto_Pulgar.png (Índice 0) infoImage: require('../../../assets/tecnicas/Info/MedianoMt-T-01.png')
      [
        {
          x: 11.0, y: 60.0, width: 7, height: 10, text: '', type: 'info',infoText: 'CODO. Fosa antecubital, solo medial al pulso de la arteria braquial',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 12},
        {
          x: 37, y: 61, width: 7, height: 10, text: '', type: 'info',infoText: 'Dorso de la mano o antebrazo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15},
        {
          x: 53, y: 47, width: 6, height: 10, text: '', type: 'info',infoText: 'MUÑECA. 8 cm proximal a electrodo activo, entre los tendones del palmar mayor y palmar menor, trazando una línea imaginaria con la intersección en el pliegue cutáneo del carpo, haciéndose horizontal en tercio distal del antebrazo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 60, infoBoxHeight: 15},
        {
          x: 62, y: 24, width: 6, height: 10, text: '', type: 'info',infoText: 'ABDUCTOR POLLICIS BREVIS C8, T1 - (eminencia tenar lateral).',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15},
        {
          x: 72, y: 15, width: 6, height: 10, text: '', type: 'info',infoText: 'Primera articulación metacarpofalángica.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15},
        {
          x: 75.5, y: 48, width: 6, height: 10, text: '', type: 'info',infoText: 'PALMA. 7 cm distal del punto de la muñeca entre los dedos índice y medio.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15},
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/MedianoMt-T-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla,
        },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/MedianoMt-G-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, 
        },
      ],
      // Botones para Abductor_Corto_Pulgar_Complemento.png (Índice 1)
      [
        {
          x: 28.0, y: 22.78, width: 5.11, height: 7.77, text: '', type: 'info', infoText: 'Primera articulación metacarpofalángica.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15 },
        {
          x: 32.2, y: 30.09, width: 5.11, height: 7.77, text: '', type: 'info', infoText: 'ABDUCTOR POLLICIS BREVIS C8, T1 - (eminencia tenar lateral).',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 39.45, y: 48.70, width: 5.11, height: 7.77, text: '', type: 'info', infoText: 'MUÑECA. 8 cm proximal a electrodo activo, entre los tendones del palmar mayor y palmar menor.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 55.29, y: 50.52, width: 5.11, height: 7.77, text: '', type: 'info', infoText: 'Dorso de la mano o antebrazo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 62.86, y: 61.66, width: 5.11, height: 7.77, text: '', type: 'info', infoText: 'CODO. Fosa antecubital, solo medial al pulso de la arteria braquial.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 80.34, y: 63.69, width: 5.11, height: 7.77, text: '', type: 'info', infoText: 'AXILA. Base del hueco axilar a 1cm distal entre el borde lateral de los músculos Pectoral menor y porción corta del Bíceps braquial.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.84
        },
        {
          x: 94.0, y: 69.95, width: 5.11, height: 7.77, text: '', type: 'info', infoText: 'ERB. Fosa supraclavicular, lateral al esternocleidomastoideo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/MedianoMt-T-02.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/MedianoMt-G-02.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],

      [
        {
          x: 11.56, y: 60.10, width: 5.38, height: 8.29, text: '', type: 'info', infoText: 'CODO. Fosa antecubital, solo medial al pulso de la arteria braquial.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 36.30, y: 60.88, width: 6.38, height: 10.29, text: '', type: 'info', infoText: 'Antebrazo, región medial.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 50.0, y: 32.24, width: 5.38, height: 8.29, text: '', type: 'info', infoText: 'FLEXOR POLLICIS LONGUS C7, C8, T1 - Antebrazo cara ventral, 3 travesees de dedo proximal a la muñeca entre los tendones del supinador largo y palmar mayor.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 55.74, y: 33.22, width: 5.38, height: 8.29, text: '', type: 'info', infoText: 'Proceso estiloides radial en el carpo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/MedianoMt-G-03.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
      [
        {
          x: 37.2, y: 32.42, width: 5.38, height: 8.29, text: '', type: 'info', infoText: 'Distal al recorrido del tendón.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 45.70, y: 27.13, width: 5.38, height: 8.29, text: '', type: 'info', infoText: 'PRONATOR QUADRATUS C7, C8, T1 - Con aguja monopolar (o concéntrica sin necesidad de referencia) 2cm proximal de la apófisis estiloides cubital, cara dorsal de antebrazo entre huesos radio/cubito.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 65.2, y: 36.29, width: 4.66, height: 8.81, text: '', type: 'info', infoText: 'Dorso de la mano o antebrazo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 94.28, y: 56.48, width: 5.38, height: 8.29, text: '', type: 'info', infoText: 'CODO. Fosa antecubital, solo medial al pulso de la arteria braquial.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/MedianoMt-G-03.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ], 
      [
        {
          x: 46.0, y: 36.03, width: 6.38, height: 8.29, text: '', type: 'info', infoText: 'Distal al recorrido del tendón o 2 cm proximal aL pliegue de la muñeca.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 65.0, y: 41.19, width: 6.52, height: 8.55, text: '', type: 'info', infoText: 'Tercio medio del antebrazo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 79.47, y: 66.06, width: 6.38, height: 8.29, text: '', type: 'info', infoText: 'FLEXOR CARPI RADIALIS C6, C7 - Antebrazo tercio medio, línea trazada desde el centro del pliegue del codo hasta al centro de la fila proximal de los huesos del carpo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 95.44, y: 49.74, width: 6.38, height: 8.29, text: '', type: 'info', infoText: 'CODO. Fosa antecubital, solo medial al pulso de la arteria braquial.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/MedianoMt-G-04.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
        
      ],
      [
        {
          x: 63.32, y: 30.60, width: 6.38, height: 8.29, text: '', type: 'info', infoText: 'Distal al recorrido del tendón, en el tercio medio del antebrazo con orientación radial.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 67.15, y: 59.84, width: 6.38, height: 9.29, text: '', type: 'info', infoText: 'Tercio medio del antebrazo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 83.67, y: 67.42, width: 6.38, height: 8.29, text: '', type: 'info', infoText: 'PRONATOR TERES - Antebrazo, vientre muscular buscar contracción activa, o 4 cm distal a pliegue del codo discretamente con orientación cubital a línea media.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 95.6, y: 52.21, width: 6.38, height: 8.29, text: '', type: 'info', infoText: 'CODO. Fosa antecubital, solo medial al pulso de la arteria braquial.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/MedianoMt-G-04.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
        
      ],
      [
        {
          x: 43.05, y: 14.54, width: 6.93, height: 9.33, text: '', type: 'info', infoText: 'ABDUCTOR POLLICIS BREVIS C8, T1 - (eminencia tenar lateral).',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 57.01, y: 4.99, width: 6.93, height: 9.33, text: '', type: 'info', infoText: 'Primera articulación metacarpofalángica.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 35.68, y: 42.49, width: 17.93, height: 9.33, text: '', type: 'info', infoText: 'MUÑECA. Se realiza a intervalos de 1 cm a lo largo del trayecto del nervio Mediano. La referencia 0 se asigna al pliegue cutáneo del carpo: Los puntos de estimulación distales se marcan con un signo negativo y los puntos proximales con un signo positivo o neutral.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 60, infoBoxHeight: 20
        },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/MedianoMt-G-05.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
        
      ],
    ],
  },
  'Mediano (sensitivo)': {
    imagenes: [
      require('../../../assets/tecnicas/neurografia/indice_medio.png'),
      require('../../../assets/tecnicas/neurografia/indice_o_medio2.png'),
      require('../../../assets/tecnicas/neurografia/indice_o_medio3.png'),
      require('../../../assets/tecnicas/neurografia/dedos1a42.png'),
      require('../../../assets/tecnicas/neurografia/sindrome_tunel_carpo.png'),
      require('../../../assets/tecnicas/neurografia/sindrome_tunel_carpo2.png'),
      require('../../../assets/tecnicas/neurografia/base_sindrome_tunel_carpo.png'),
      require('../../../assets/tecnicas/neurografia/base_inching.png'),
    ],
    botones: [
      [
        {
          x: 35.34, y: 47.67, width: 5.48, height: 10.36, text: '', type: 'info', infoText: 'MUÑECA. 14 cm distal al electrodo de registro, entre los tendones palmar mayor y palmar menor.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 59.2, y: 55.20, width: 7.48, height: 11.36, text: '', type: 'info', infoText: 'Dorso de la mano.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 70.72, y: 18.17, width: 7.48, height: 10.36, text: '', type: 'info', infoText: 'DEDO ÍNDICE O MEDIO - Ligeramente distal a la articulación metacarpofalángica, evitando los pliegues cutáneos que restaran amplitud.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 80.88, y: 15.08, width: 7.48, height: 10.36, text: '', type: 'info', infoText: '3-4 cm del electrodo de registo, discretamente distal a articulación interfalángica distal.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/01-MedianoSt-T.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/01-MedianoSt-G.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
      [
        {
          x: 30.47, y: 49.48, width: 7.48, height: 10.36, text: '', type: 'info', infoText: 'MUÑECA. 14 cm proximal del electrodo de registro, entre los tendones palmar mayor y palmar menor.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 55.60, y: 58.28, width: 7.48, height: 10.88, text: '', type: 'info', infoText: 'Dorso de la mano.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 56.01, y: 46.63, width: 7.48, height: 10.36, text: '', type: 'info', infoText: 'MEDIA PALMA. 7 cm distal al punto de la muñeca hasta la palma, entre los dedos índice y medio.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 71.62, y: 21.54, width: 7.48, height: 10.36, text: '', type: 'info', infoText: 'DEDO ÍNDICE O MEDIO - Ligeramente distal a la articulación metacarpofalángica, evitando los pliegues cutáneos que restaran amplitud.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 83.21, y: 19.21, width: 7.48, height: 10.36, text: '', type: 'info', infoText: '3-4 cm del electrodo de registo, discretamente distal a articulación interfalángica distal.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/01-MedianoSt-T.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/01-MedianoSt-G.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ], 
      [
        {
          x: 19.96, y: 63.18, width: 4.68, height: 8.59, text: '', type: 'info', infoText: 'CODO. Fosa antecubital, solo medial al pulso de la arteria braquial.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 59.43, y: 53.0, width: 4.68, height: 8.59, text: '', type: 'info', infoText: 'MUÑECA. 14 cm proximal del electrodo de registro, entre los tendones palmar mayor y palmar menor.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 73.58, y: 57.28, width: 6.68, height: 9.59, text: '', type: 'info', infoText: 'Dorso de la mano.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 76.0, y: 48.15, width: 4.68, height: 8.59, text: '', type: 'info', infoText: 'Media palma. 7 cm distal al punto de la muñeca hasta la palma, entre los dedos índice y medio.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 82.23, y: 31.9, width: 4.68, height: 8.59, text: '', type: 'info', infoText: 'DEDO ÍNDICE O MEDIO - Ligeramente distal a la articulación metacarpofalángica, evitando los pliegues cutáneos que restaran amplitud.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 87.46, y: 29.57, width: 5.38, height: 8.29, text: '', type: 'info', infoText: '3-4 cm del electrodo de registo, discretamente distal a articulación interfalángica distal.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/01-MedianoSt-T.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/02-MedianoSt-G.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ], 
      [
        {
          x: 36.56, y: 67.06, width: 6.48, height: 10.36, text: '', type: 'info', infoText: 'DEDO IV - Ligeramente distal a la articulación metacarpofalángica.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 26.95, y: 59.81, width: 6.48, height: 10.36, text: '', type: 'info', infoText: '3-4 cm distal.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 23.25, y: 45.34, width: 6.48, height: 10.36, text: '', type: 'info', infoText: 'Referencia 3-4 cm distal.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 25.16, y: 28.79, width: 6.48, height: 10.36, text: '', type: 'info', infoText: 'DEDO III - Ligeramente distal a la articulación metacarpofalángica.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 35.75, y: 21.28, width: 6.48, height: 10.36, text: '', type: 'info', infoText: '3-4 cm distal.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 44.42, y: 22.05, width: 6.48, height: 10.36, text: '', type: 'info', infoText: 'DEDO II - Ligeramente distal a la articulación metacarpofalángica.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 56.0, y: 3.74, width: 6.68, height: 10.59, text: '', type: 'info', infoText: '3-4 cm distal.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 61.35, y: 10.0, width: 5.68, height: 10.59, text: '', type: 'info', infoText: 'DEDO I - Ligeramente distal a la articulación metacarpofalángica.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 61.08, y: 50.0, width: 6.48, height: 10.36, text: '', type: 'info', infoText: 'Dorso de la mano.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 77.88, y: 38.07, width: 6.48, height: 10.36, text: '', type: 'info', infoText: 'MUÑECA. 14 cm con dirección proximal desde los electrodos activos tomando como referencia punto medio entre tendones palmar mayor y palmar menor.',
          infoBoxX: 1, infoBoxY: 2, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/03-MedianoSt-G.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
      [
        {
          x: 38.04, y: 49.48, width: 6.93, height: 9.33, text: '', type: 'info', infoText: 'NERVIO MEDIANO - (antidrómica) entre tendones de los palmares mayor/menor a 10 cm en dirección proximal del electrodo de registro.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 38.04, y: 40.93, width: 6.93, height: 9.33, text: '', type: 'info', infoText: 'NERVIO RADIAL - (antidromica) borde lateral del radio a 10 cm en dirección proximal del electrodo de registro.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 55.24, y: 17.62, width: 6.93, height: 9.33, text: '', type: 'info', infoText: 'DEDO PULGAR (THUMBDIFF) - Diferencia de latencia sensorial MEDIANO-RADIAL con registro en el primer dedo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 58.06, y: 9.0, width: 6.93, height: 9.33, text: '', type: 'info', infoText: 'ACTIVO, ligeramente distal a la articulación metacarpofalángica REFERENCIA, 3-4 cm distal.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 61.46, y: 59.81, width: 8.48, height: 10.36, text: '', type: 'info', infoText: 'Dorso de la mano.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/02-MedianoSt-T.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/04-MedianoSt-G.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
      [
        {
          x: 22.25, y: 34.24, width: 7.48, height: 12.36, text: '', type: 'info', infoText: 'Dorso de la mano o antebrazo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 35.89, y: 41.45, width: 7.21, height: 9.84, text: '', type: 'info', infoText: 'NERVIO MEDIANO - (antidromica) A través de la muñeca 14 cm proximal del electrodo activo, entre los tendones de los palmares mayor/menor.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 35.89, y: 51.04, width: 7.21, height: 9.84, text: '', type: 'info', infoText: 'NERVIO CUBITAL - (antidromica) A través de la muñeca 14 cm proximal del electrodo activo, medial al tendón cubital anterior.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 74.54, y: 67.32, width: 6.48, height: 10.36, text: '', type: 'info', infoText: 'DEDO ANULAR (RINGDIFF) - Diferencia de latencia sensorial MEDIANO-CUBITAL con registro en el IV dedo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 82.79, y: 68.84, width: 6.48, height: 10.36, text: '', type: 'info', infoText: 'ACTIVO, ligeramente distal a la articulación metacarpofalángica REFERENCIA, 3-4 cm distal.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/02-MedianoSt-T.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/05-MedianoSt-G.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ], 
      [
        {
          x: 32.74, y: 58.82, width: 6, height: 10.36, text: '', type: 'info', infoText: 'ACTIVO, discretamente proximal al pliegue de la muñeca, existiendo una distancia de 8 cm en relación al punto de estimulación, REFERENCIA 3 cm proximal.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 32.74, y: 46.11, width: 6, height: 10.36, text: '', type: 'info', infoText: 'ACTIVO, discretamente proximal al pliegue de la muñeca, existiendo una distancia de 8 cm en relación al punto de estimulación, REFERENCIA 3 cm proximal.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 39.0, y: 46.11, width: 6, height: 10.36, text: '', type: 'info', infoText: 'Diferencia de latencia de nervios mixtos en la palma de la mano (PALMDIFF) NERVIO MEDIANO.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 39.0, y: 58.82, width: 6, height: 10.36, text: '', type: 'info', infoText: 'Diferencia de latencia de nervios mixtos en la palma de la mano (PALMDIFF) NERVIO CUBITAL.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 50.90, y: 30.09, width: 8.03, height: 12.80, text: '', type: 'info', infoText: 'Dorso de la mano.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 60.40, y: 48.19, width: 6.48, height: 10.36, text: '', type: 'info', infoText: 'NERVIO MEDIANO - (ortodrómico) Media palma en el espacio interdigital III-IV.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 60.40, y: 58.27, width: 6.48, height: 10.36, text: '', type: 'info', infoText: 'NERVIO CUBITAL - (ortodrómico) Media palma en el espacio interdigital IV-V.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/02-MedianoSt-T.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/06-MedianoSt-G.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ], 
      [
        {
          x: 46.34, y: 38.46, width: 7.0, height: 8.81, text: '', type: 'info', infoText: 'Dorso de la mano.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 53.78, y: 24.0, width: 7.0, height: 8.81, text: '', type: 'info', infoText: 'DEDO MEDIO O ÍNDICE - Ligeramente distal a la articulación metacarpofalángica, evitando colocar electrodo sobre pliegue cutáneo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 52.96, y: 11.18, width: 7.0, height: 8.81, text: '', type: 'info',  infoText: '3-4 cm distal al electrodo de registo discretamente distal de articulación interfalangica distal.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 53.92, y: 43.04, width: 6.11, height: 33.68, text: '', type: 'info', infoText: 'MUÑECA. Comienza 2 o 3 cm proximal al pliegue de la muñeca (+2) y continua segmentaria y progresivamente con incrementos de 1 cm, hasta 6 cm distales (-5) al pliegue cutáneo del carpo catalogado como punto 0.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 19
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/03-MedianoSt-T.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/07-MedianoSt-G.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
    ],
  },
  'Ulnar (motor)': {
    imagenes: [
      require('../../../assets/tecnicas/neurografia/ulnar_mt.png'),
      require('../../../assets/tecnicas/neurografia/ulnar_mt2.png'),
      require('../../../assets/tecnicas/neurografia/ulnar_mt3.png'),
      require('../../../assets/tecnicas/neurografia/ulnar_mt4.png'),
      require('../../../assets/tecnicas/neurografia/ulnar_mt5.png'),
      require('../../../assets/tecnicas/neurografia/ulnar_mt6.png'),
      require('../../../assets/tecnicas/neurografia/ulnar_mt7.png'),
    ],
    botones: [
      [
          {
            x: 20.89, y: 63.47, width: 5.11, height: 8.77, text: '', type: 'info', infoText: 'CODO. 2-3 cm distal al epicóndilo medial en línea media dibujada con relación al olecranon.',
            infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
          },
          {
            x: 50.22, y: 45.86, width: 5.11, height: 8.77, text: '', type: 'info', infoText: 'Dorso de la mano o antebrazo.',
            infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
          },
          {
            x: 68.52, y: 62.69, width: 5.11, height: 8.77, text: '', type: 'info', infoText: 'MUÑECA: 8 cm en dirección proximal de electrodo activo, medial a tendón cubital anterior.',
            infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
          },
          {
            x: 81.48, y: 61.66, width: 5.11, height: 8.77, text: '', type: 'info', infoText: 'ABDUCTOR DIGITI MINIMI C8, T1 - (eminencia hipotenar medial).',
            infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
          },
          {
            x: 88.78, y: 63.73, width: 5.11, height: 8.77, text: '', type: 'info', infoText: 'Articulación metacarpofalángica del quinto dedo.',
            infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
          },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/01UlnarT.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 97, popupImageHeight: 72, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/01UlnarG.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
      [
        {
          x: 19.82, y: 0, width: 4.11, height: 7.77, text: '', type: 'info',
          infoText: 'ERB. Fosa supraclavicular lateral al esternocleidomastoideo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 35.11, y: 27.50, width: 4.11, height: 7.77, text: '', type: 'info', infoText: 'AXILA. Base del hueco axilar o 1cm distal entre borde lateral de los músculos Pectoral menor y porción corta del Bíceps braquial.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 42.87, y: 71.95, width: 4.11, height: 7.77, text: '', type: 'info', infoText: 'ARRIBA DE CODO. 10 cm proximal al punto de estimulación de codo, a nivel de humero medial entre tendones de Bíceps-Tríceps.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 50.82, y: 71.95, width: 4.11, height: 7.77, text: '', type: 'info', infoText: 'CODO. 2-3 cm distal al epicóndilo medial en línea media dibujada con relación al olecranon.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 61.95, y: 47.77, width: 4.11, height: 7.77, text: '', type: 'info', infoText: 'Dorso de la mano o antebrazo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 71.99, y: 44.56, width: 4.11, height: 7.77, text: '', type: 'info', infoText: 'MUÑECA. 8 cm en dirección proximal de electrodo activo, medial a tendón cubital anterior.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 77.78, y: 47.67, width: 4.11, height: 7.77, text: '', type: 'info', infoText: 'ABDUCTOR DIGITI MINIMI C8, T1 - (eminencia hipotenar medial).',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 81.89, y: 46.35, width: 4.11, height: 7.77, text: '', type: 'info', infoText: 'Articulación metacarpofalángica del quinto dedo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/01UlnarT.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/02UlnarG.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ], 
      [
        {
          x: 35.75, y: 67.06, width: 6.68, height: 8.59, text: '', type: 'info', infoText: 'Articulación metacarpofalángica del dedo índice.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 36.85, y: 57.80, width: 6.68, height: 8.59, text: '', type: 'info', infoText: 'INTEROSEUS DORSALIS C8, T1 - Espacio dorsal línea media de membrana cutánea entre dedos pulgar e índice.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 27.90, y: 34.07, width: 6.68, height: 9.59, text: '', type: 'info', infoText: 'Dorso de la mano.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 41.00, y: 16.13, width: 6.68, height: 8.59, text: '', type: 'info', infoText: 'MUÑECA. 8 cm en dirección proximal de electrodo activo, medial a tendón cubital anterior.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 64.92, y: 0.59, width: 6.68, height: 8.59, text: '', type: 'info', infoText: 'CODO. 2-3 cm distal al epicóndilo medial en línea media dibujada con relación al olecranon.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          x: 82.25, y: 4.22, width: 6.68, height: 8.59, text: '', type: 'info', infoText: 'ARRIBA DE CODO. 10 cm proximal al punto de estimulación de codo, a nivel de humero medial entre tendones de Bíceps-Tríceps.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 15
        },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/03UlnarG.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ], 
      [
        {
          x: 59.00, y: 50.78, width: 6.38, height: 8.29, text: '', type: 'info', infoText: 'MUÑECA (N. ULNAR) - 8 cm en dirección proximal de electrodo activo, medial a tendón cubital anterior.',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 57.5, y: 42.25, width: 6.38, height: 8.29, text: '', type: 'info', infoText: 'MUÑECA (N. MEDIANO) - 8 cm en dirección proximal de electrodo activo, entre los tendones palmar mayor y menor.',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 63.41, y: 29.57, width: 6.68, height: 9.59, text: '', type: 'info', infoText: 'Dorso de la mano.',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 74.41, y: 14.03, width: 6.68, height: 8.59, text: '', type: 'info', infoText: 'PRIMER INTERÓSEO PALMAR (N. ULNAR) / SEGUNDO LUMBRICAL (N. MEDIANO) - Palma ligeramente lateral al punto medio del tercer metacarpiano.',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          x: 81.58, y: 12.47, width: 6.68, height: 8.59, text: '', type: 'info', infoText: 'Articulación metacarpofalángica del dedo índice.',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/04UlnarG.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ], 
      [
        {
          x: 15.95, y: 40.41, width: 5.68, height: 8.59, text: '', type: 'info', infoText: 'ARRIBA DE CODO. 10 cm proximal al punto de estimulación de codo, a nivel de humero medial entre tendones de Bíceps-Tríceps.',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 16.84
        },
        {
          x: 30.97, y: 57.80, width: 5.68, height: 8.59, text: '', type: 'info', infoText: 'CODO: 2-3 cm distal al epicóndilo medial en línea media dibujada con relación al olecranon.',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 42.64, y: 61.88, width: 5.68, height: 8.59, text: '', type: 'info', infoText: 'FLEXOR CARPI ULNARIS C7, C8, T1 - Punto motor a cuatro dedos de distancia, distal de epicóndilo medial sobre borde cubital entre línea imaginaria de tercio medio y proximal del antebrazo.',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          x: 50.77, y: 34.20, width: 5.68, height: 8.59, text: '', type: 'info', infoText: 'Dorso de la mano o antebrazo lateral.',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 73.0, y: 49.22, width: 5.68, height: 8.59, text: '', type: 'info', infoText: 'En dirección al carpo sobre borde cubital, recorrido distal del tendón.',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/05UlnarG.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ], 
      [
        {
          x: 51.59, y: 9.44, width: 6.11, height: 8.77, text: '', type: 'info', infoText: 'Antebrazo.',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 73.78, y: 22.32, width: 5.11, height: 6.77, text: '', type: 'info', infoText: 'ABDUCTOR DIGITI MINIMI C8, T1 - (eminencia hipotenar medial).',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 79.04, y: 24.61, width: 5.11, height: 6.77, text: '', type: 'info', infoText: 'Articulación metacarpofalángica del quinto dedo.',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 25.62, y: 51.81, width: 24.92, height: 21.76, text: '', type: 'info', infoText: 'CODO. Estimulación a intervalos de 1 cm a lo largo del trayecto del nervio Ulnar a través del codo. La referencia 0 corresponde a la intersección del olecranon y el epicóndilo medial; los puntos de estimulación distales se designan con un signo negativo y los puntos proximales con un signo positivo o neutral.',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 24.61
        },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/06UlnarG.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ], 
      [
        {
          x: 77.19, y: 2.23, width: 5.55, height: 7.77, text: '', type: 'info', infoText: 'Dorso de la mano.',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 78.59, y: 23.35, width: 5.55, height: 7.77, text: '', type: 'info', infoText: 'Articulación metacarpofalángica del dedo índice.',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 85.04, y: 18.43, width: 5.55, height: 7.77, text: '', type: 'info', infoText: 'INTEROSEUS DORSALIS C8, T1 - Espacio dorsal línea media de membrana cutánea entre dedos pulgar e índice',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          x: 53.32, y: 60.10, width: 35.51, height: 11.66, text: '', type: 'info', infoText: 'MUÑECA. Estimulación a intervalos de 1 cm a lo largo del trayecto del nervio Ulnar a través del carpo. La referencia 0 corresponde al carpo, inmediatamente proximal al pisiforme: Los puntos de estimulación distales, también se designarán con un signo negativo y los puntos proximales con un signo positivo.',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 24.61
        },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/07UlnarG.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
    ],
  },
  'Ulnar (sensitivo)': {
    imagenes: [
      require('../../../assets/tecnicas/neurografia/ulnar_st.png'),
      require('../../../assets/tecnicas/neurografia/ulnar_st2.png'),
    ],
    botones: [
      [
        {
          x: 54.92, y: 57.01, width: 5.66, height: 8.81, text: '', type: 'info', infoText: 'MUÑECA. Estimulo Antidrómico a 14 cm con dirección proximal del electrodo de registro, medial y adyacente al tendón cubital anterior.',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 82.30, y: 60.93, width: 5.66, height: 8.81, text: '', type: 'info', infoText: 'DEDO MEÑIQUE O QUINTO DEDO - Ligeramente distal a la articulación metacarpofalángica, evitando colocar electrodo sobre pliegue cutáneo.',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 90.97, y: 22.31, width: 5.66, height: 8.81, text: '', type: 'info', infoText: 'CUARTO DEDO - Ligeramente distal a la articulación metacarpofalángica, evitando colocar electrodo sobre pliegue cutáneo.',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 89.40, y: 62.18, width: 5.66, height: 9.81, text: '', type: 'info', infoText: '3-4 cm distal al electrodo de registo en articulación interfalangica distal.',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 95.81, y: 25.20, width: 4.66, height: 9.81, text: '', type: 'info', infoText: '3-4 cm distal al electrodo de registo en articulación interfalangica distal.',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/01UlnarStT.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/01UlnarStG.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
      [
        {
          x: 29.77, y: 12.25, width: 8.03, height: 12.40, text: '', type: 'info', infoText: '4 cm distalmente sobre dorso del 4to dedo, falange proximal.',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 42.64, y: 12.25, width: 8.03, height: 12.40, text: '', type: 'info', infoText: 'DORSO DE LA MANO - Punto medio entre 4to y 5to metacarpianos.',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 63.14, y: 40.71, width: 8.03, height: 14.40, text: '', type: 'info', infoText: 'MUÑECA. Estimulo Antidrómico a 14 cm con dirección proximal del electrodo de registro, medial y adyacente al tendón cubital anterior.',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/01UlnarStT.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/02UlnarStG.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
    ],
  },
  'Radial (motor)': {
    imagenes: [
      require('../../../assets/tecnicas/neurografia/radial_mt.png'),
      require('../../../assets/tecnicas/neurografia/radial_mt2.png'),
      require('../../../assets/tecnicas/neurografia/radial_mt3.png'),
      require('../../../assets/tecnicas/neurografia/radial_mt4.png'),
      require('../../../assets/tecnicas/neurografia/radial_mt5.png'),
      require('../../../assets/tecnicas/neurografia/radial_mt6.png'),
    ],
    botones: [
      [
        {
          x: 24.89, y: 45.34, width: 5.38, height: 8.29, text: '', type: 'info', infoText: 'BRAZO. Canal de torsión, tercio medio del humero, en dirección lateral entre Bíceps y Tríceps braquiales, o discretamente posterior a la cabeza lateral de este último. ',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          x: 39.0, y: 40.41, width: 5.38, height: 8.29, text: '', type: 'info', infoText: 'PUNTO SUPINADOR. Lateral al codo entre los musculos Braquiorradial (supinador largo) y Extensor largo del carpo (primer radial externo).',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 59.30, y: 64.47, width: 5.38, height: 8.29, text: '', type: 'info', infoText: 'ANTEBRAZO. 4-6 cm en dirección proximal del electrodo activo, dorso del antebrazo sobre borde lateral del cubito. ',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 67.97, y: 61.0, width: 5.38, height: 8.29, text: '', type: 'info', infoText: 'EXTENSOR INDICIS C7, C8 - 4 cm en dirección proximal con relación a apófisis estiloides cubital, cara dorsal del tercio distal en antebrazo, lateral al borde del Cubito.',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          x: 75.14, y: 59.57, width: 5.38, height: 8.29, text: '', type: 'info', infoText: 'Apófisis estiloides cubital. ',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 82.44, y: 48.96, width: 5.38, height: 8.29, text: '', type: 'info', infoText: 'Dorso de la mano. ',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/RadialMt-T-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/RadialMt-G-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
      [
        {
          x: 7.68, y: 62.14, width: 5.38, height: 8.29, text: '', type: 'info', infoText: 'ERB. Fosa supraclavicular lateral al esternocleidomastoideo.',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 20.89, y: 32.21, width: 5.38, height: 8.29, text: '', type: 'info', infoText: 'AXILA. A 1 cm distal entre borde lateral de los músculos Pectoral menor y porción corta del Bíceps braquial.',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 28.58, y: 25.42, width: 5.38, height: 8.29, text: '', type: 'info', infoText: 'POR ARRIBA DEL CANAL DE TORSIÓN. Borde lateral del humero proximal discretamente posterior a la inserción del Deltoides.',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 34.89, y: 16.13, width: 5.38, height: 8.29, text: '', type: 'info', infoText: 'CANAL DE TORSIÓN. Tercio medio del humero, en dirección lateral entre Bíceps y Tríceps braquiales. ',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 42.23, y: 18.55, width: 5.38, height: 8.29, text: '', type: 'info', infoText: 'PUNTO SUPINADOR. Lateral al codo entre los musculos Braquiorradial (supinador largo) y Extensor largo del carpo (primer radial externo).',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 39.09, y: 46.89, width: 5.38, height: 8.29, text: '', type: 'info', infoText: 'Punto medio entre estimulo y registro.',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 59.81, y: 39.50, width: 5.38, height: 8.29, text: '', type: 'info', infoText: 'ANTEBRAZO. 4-6 cm en dirección proximal del electrodo activo, dorso del antebrazo sobre borde lateral del cubito.',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 66.88, y: 27.08, width: 5.38, height: 8.29, text: '', type: 'info', infoText: 'EXTENSOR INDICIS C7, C8 - 4 cm en dirección proximal con relación a apófisis estiloides cubital, cara dorsal del tercio distal en antebrazo, lateral al borde del Cubito.',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          x: 75.27, y: 28.53, width: 5.38, height: 8.29, text: '', type: 'info', infoText: 'Apófisis estiloides cubital.',
          infoBoxX: 12, infoBoxY: 1,  infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/RadialMt-G-02.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ], 
      [
        {
          x: 48.71, y: 23.21, width: 5.38, height: 9.29, text: '', type: 'info', infoText: '4 cm distal en misma orientación sobre borde del radio.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 55.29, y: 58.04, width: 6.38, height: 9.29, text: '', type: 'info', infoText: 'Antebrazo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 64.14, y: 28.02, width: 5.38, height: 9.29, text: '', type: 'info', infoText: 'BRACHIORRADIALIS C5, C6 - Antebrazo en punto medio de pronación/supinación y codo en flexión de 90°, tercio proximal 4 cm distal a pliegue del codo sobre borde del radio.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          x: 83.07, y: 36.09, width: 6.38, height: 9.29, text: '', type: 'info', infoText: 'CANAL DE TORSIÓN. Tercio medio del humero, en dirección lateral entre Bíceps y Tríceps braquiales.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/RadialMt-G-03.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ], 
      [
        {
          x: 56.24, y: 32.68, width: 6.38, height: 9.29, text: '', type: 'info', infoText: '4 cm distal en misma orientación sobre borde del cubito.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 63.54, y: 34.23, width: 6.38, height: 9.29, text: '', type: 'info', infoText: 'EXTENSOR CARPI RADIALIS LONGUS C5, C6, C7 - Antebrazo en pronación y extensión de codo, 4-5 cm distal al epicóndilo lateral y horizontal al borde lateral del cubito, debajo del supinador largo (braquiorradial).',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 19.42
        },
        {
          x: 71.40, y: 50.30, width: 6.38, height: 10.29, text: '', type: 'info', infoText: 'Antebrazo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 89.29, y: 40.98, width: 6.38, height: 9.29, text: '', type: 'info', infoText: 'CANAL DE TORSIÓN. Tercio medio del humero, en dirección lateral entre Bíceps y Tríceps braquiales.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/RadialMt-G-03.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ], 
      [
        {
          x: 39.45, y: 58.82, width: 6.38, height: 9.29, text: '', type: 'info', infoText: '4 cm distal en misma orientación entre cubito y radio.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 63.55, y: 63.71, width: 6.38, height: 9.29, text: '', type: 'info', infoText: 'EXTENSOR DIGITORUM COMMUNIS C7, C8 - Antebrazo en pronación, unión entre tercio proximal y medio de antebrazo, región dorsal punto medio con discreta desviación radial.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          x: 86.14, y: 40.26, width: 6.38, height: 9.29, text: '', type: 'info', infoText: 'CANAL DE TORSIÓN. Tercio medio del humero, en dirección lateral entre Bíceps y Tríceps braquiales.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 90.92, y: 51.04, width: 6.38, height: 9.29, text: '', type: 'info', infoText: 'Antebrazo ventral.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/RadialMt-G-03.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ], 
      [
        {
          x: 20.48, y: 51.81, width: 7.03, height: 11.40, text: '', type: 'info', infoText: 'ERB. Fosa supraclavicular lateral al esternocleidomastoideo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 60.12, y: 18.43, width: 7.03, height: 11.40, text: '', type: 'info', infoText: 'TRICEPS BRACHIALIS C6, C7 - Cabeza lateral, tercio medio deL brazo borde lateral ligeramente posterior.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 71.90, y: 14.03, width: 7.03, height: 11.40, text: '', type: 'info', infoText: 'Sobre Bíceps braquial.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 83.67, y: 9.0, width: 7.03, height: 11.40, text: '', type: 'info', infoText: 'En dirección distal sobre eje horizontal, 3-4 cm del electrodo activo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 67.29, y: 64.50, width: 7.03, height: 11.40, text: '', type: 'info', infoText: 'TRICEPS BRACHIALIS C6, C7 - Cabeza larga, tercio proximal deL brazo borde medial ligeramente posterior.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 82.03, y: 61.10, width: 7.03, height: 11.40, text: '', type: 'info', infoText: 'En dirección distal sobre eje horizontal, 3-4 cm del electrodo activo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/RadialMt-G-04.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
    ],
  },
  'Radial (sensitivo)': {
    imagenes: [
      require('../../../assets/tecnicas/neurografia/radial_st.png'),
      require('../../../assets/tecnicas/neurografia/radial_st2.png'),
    ],
    botones: [
      [
        {
          x: 30.0, y: 29.0, width: 7.03, height: 11.40, text: '', type: 'info', infoText: 'MUÑECA. En la parte media distal del radio 10/12/14 cm proximal al electrodo activo cara volar del antebrazo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 42.78, y: 22.32, width: 7.03, height: 11.40, text: '', type: 'info', infoText: 'Dorso de la mano.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 51.03, y: 38.34, width: 7.03, height: 11.40, text: '', type: 'info', infoText: 'BASE DE PULGAR - Dorso de la mano entre los tendones del extensor largo y corto del pulgar, 1 cm distal al borde el radio.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 64.96, y: 41.98, width: 7.03, height: 11.40, text: '', type: 'info', infoText: '3-4 cm distal al electrodo de registo, borde lateral del segundo metacarpiano.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/RadialSt-T-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/RadialSt-G-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
      [
        {
          x: 45.0, y: 61.10, width: 7.03, height: 11.40, text: '', type: 'info', infoText: '3 distal a elétrodo activo sobre articulación interfalángica.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 51.18, y: 56.46, width: 7.03, height: 11.40, text: '', type: 'info', infoText: 'DORSO DEL PULGAR - Discretamente distal a la primera articulación metacarpofalángica.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 53.10, y: 8.10, width: 8.03, height: 11.40, text: '', type: 'info', infoText: 'BASE DE PULGAR - Dorso de la mano entre los tendones del extensor largo y corto del pulgar, 1 cm distal al borde el radio.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.85
        },
        {
          x: 79.44, y: 6.77, width: 7.03, height: 11.40, text: '', type: 'info', infoText: 'MUÑECA. En la parte media distal del radio 10/12/14 cm proximal al electrodo activo cara volar del antebrazo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/RadialSt-T-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/RadialSt-G-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
    ],
  },
  'Antebraquial cutáneo lateral': {
    imagenes: [
      require('../../../assets/tecnicas/neurografia/cutaneo_l.png'),
    ],
    botones: [
      [
        {
          x: 15.12, y: 43.78, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'CODO. Borde lateral del tendón del bíceps braquial y pliegue de la fosa antecubital.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 29.00, y: 57.51, width: 6.68, height: 9.59, text: '', type: 'info', infoText: 'Antebrazo medial.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 39.0, y: 47.15, width: 4.11, height: 7.77, text: '', type: 'info', infoText: 'ANTEBRAZO LATERAL - 12 a 14 cm con dirección distal del punto de estimulación sobre línea trazada hasta pulso de arteria radial en la muñeca o base del primer metacarpiano.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          x: 43.55, y: 47.15, width: 4.11, height: 7.77, text: '', type: 'info', infoText: '3 cm distal del electrodo activo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/CutaneoLt-T-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/CutaneoMd-G-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
    ],
  },
  'Antebraquial cutáneo medial': {
    imagenes: [
      require('../../../assets/tecnicas/neurografia/cutaneo_m.png'),
    ],
    botones: [
      [
        {
          x: 14.5, y: 53.11, width: 6.68, height: 9.59, text: '', type: 'info', infoText: 'CODO. Punto medio trazado entre el borde medial del tendón del bíceps braquial y epicóndilo medial, 1-2 cm proximal del pliegue del codo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 23.0, y: 42.0, width: 6.68, height: 9.59, text: '', type: 'info', infoText: 'Antebrazo lateral.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 33.8, y: 55.44, width: 4.11, height: 7.77, text: '', type: 'info', infoText: 'ANTEBRAZO MEDIAL - 12 a 14 cm con dirección distal del punto de estimulación sobre línea trazada hasta el pisiforme en la muñeca, justo medial del tendón cubital anterior.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          x: 38.30, y: 55.44, width: 4.11, height: 7.77, text: '', type: 'info', infoText: '3-4 cm distal del electrodo activo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/CutaneoMd-T-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/CutaneoLt-G-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
    ],
  },
  'Antebraquial cutáneo posterior': {
    imagenes: [
      require('../../../assets/tecnicas/neurografia/cutaneo_p.png'),
    ],
    botones: [
      [
        {
          x: 19.36, y: 50.52, width: 5.38, height: 8.29, text: '', type: 'info', infoText: 'BRAZO. 2 cm en dirección proximal al epicóndilo lateral, entre los músculos braquiorradial (supinador largo) y la cabeza lateral del tríceps.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 32.13, y: 59.07, width: 5.38, height: 8.29, text: '', type: 'info', infoText: 'Antebrazo lateral.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 43.8, y: 53.37, width: 4.11, height: 7.77, text: '', type: 'info', infoText: 'ANTEBRAZO POSTERIOR - 12 cm distal desde el punto de estímulo a lo largo de una línea que se traza hacia el dorso medio de la muñeca.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 47.56, y: 53.37, width: 4.11, height: 7.77, text: '', type: 'info', infoText: '3-4 cm distal del electrodo activo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/CutaneoPst-T-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/CutaneoPst-G-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
    ],
  },
  'Axilar': {
    imagenes: [
      require('../../../assets/tecnicas/neurografia/axilar.png'),
    ],
    botones: [
      [
        {
          x: 53.73, y: 2.60, width: 5.38, height: 8.29, text: '', type: 'info', infoText: 'ERB. Fosa supraclavicular, 2 cm por arriba de la clavícula y borde posterior del esternocleidomastoideo, entre el escaleno anterior y el escaleno medio.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          x: 54.72, y: 11.25, width: 5.38, height: 8.29, text: '', type: 'info', infoText: 'Articulación acromioclavicular.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 65.03, y: 38.86, width: 5.38, height: 8.29, text: '', type: 'info', infoText: 'DELTOIDS MIDIUM C5, C6 - Punto medio entre articulación acromioclavicular y área de inserción deltoidea en region lateral del hombro.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          x: 64.26, y: 57.59, width: 5.38, height: 8.29, text: '', type: 'info', infoText: 'Inserción deltoidea, unión del tercio proximal y medio del brazo. ',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/Axilar-T-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/Axilar-G-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
    ],
  },
  'Musculocutáneo': {
    imagenes: [
      require('../../../assets/tecnicas/neurografia/musculocutaneo.png'),
    ],
    botones: [
      [
        {
          x: 51.50, y: 0.59, width: 4.11, height: 7.77, text: '', type: 'info', infoText: 'ERB. Fosa supraclavicular, 2 cm por arriba de la clavícula y borde posterior del esternocleidomastoideo, entre el escaleno anterior y el escaleno medio.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.84
        },
        {
          x: 56.21, y: 18.43, width: 4.11, height: 7.77, text: '', type: 'info', infoText: 'Articulación acromoclavicular.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 46.79, y: 50.76, width: 4.11, height: 7.77, text: '', type: 'info', infoText: 'BICEPS BRACHII C5, C6 - Electrodo colocado sobre el vientre muscular más prominente del Bíceps braquial o punto medio ventral del brazo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.84
        },
        {
          x: 44.20, y: 69.65, width: 4.11, height: 7.77, text: '', type: 'info', infoText: 'Tendón del bíceps braquiai en el codo. ',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/musculocutaneo-T-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/musculocutaneo-G-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
    ],
  },
  'Supraescapular': {
    imagenes: [
      require('../../../assets/tecnicas/neurografia/supraescapular.png'),
      require('../../../assets/tecnicas/neurografia/supraescapular2.png'),
    ],
    botones: [
      [
        {
          x: 39.63, y: 35.09, width: 5.68, height: 8.59, text: '', type: 'info', infoText: 'Articulación acromoclavicular.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 45.42, y: 34.0, width: 5.68, height: 8.59, text: '', type: 'info', infoText: 'No se requiere. En caso de utilizar aguja monopolar como registro, colocar su referencia con electrodo de superfície a 2 cm en dirección lateral hacia su inserción.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          x: 56.24, y: 38.86, width: 5.68, height: 8.59, text: '', type: 'info', infoText: 'SUPRASPINATUS C5, C6 - Insertar guja concéntrica en el punto medio del trayecto del musculo, a 2 cm del borde superior de la espina de la escapula, tomando como referencia su tercio medio; se inserta de forma lenta hasta hacer contacto con la cortical ósea y retirar mínimamente.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 20.72
        },
        {
          x: 59.15, y: 10.0, width: 5.68, height: 8.59, text: '', type: 'info', infoText: 'ERB. Fosa supraclavicular, 2 cm por arriba de la clavícula y borde posterior del esternocleidomastoideo, entre el escaleno anterior y el escaleno medio.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/supraescapular-T-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/supraescapular-G-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
      [
        {
          x: 50.22, y: 0.59, width: 5.38, height: 8.29, text: '', type: 'info', infoText: 'ERB. Fosa supraclavicular, 2 cm por arriba de la clavícula y borde posterior del esternocleidomastoideo, entre el escaleno anterior y el escaleno medio.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          x: 65.92, y: 25.94, width: 5.38, height: 8.29, text: '', type: 'info', infoText: 'Articulación acromoclavicular.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 54.52, y: 48.71, width: 5.38, height: 8.29, text: '', type: 'info', infoText: 'INFRASPINATUS C5, C6 - Electrodo de aguja concéntrica, insertar 3-5 cm por debajo de la espina de la escapula, línea media imaginaria del vértice escapular al tercio medio de la espina.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          x: 48.85, y: 67.06, width: 5.38, height: 8.29, text: '', type: 'info', infoText: 'No se requiere. En caso de utilizar aguja monopolar como registro, colocar su referencia com electrodo de superfície a 2 cm en direccion distal. ',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/supraescapular-T-02.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/supraescapular-G-02.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
    ],
  },
  'Escapular dorsal': {
    imagenes: [
      require('../../../assets/tecnicas/neurografia/escapular_dorsal.png'),
    ],
    botones: [
      [
        {
          x: 55.40, y: 0.59, width: 5.38, height: 8.29, text: '', type: 'info', infoText: 'ERB. Fosa supraclavicular, 2 cm por arriba de la clavícula y borde posterior del esternocleidomastoideo, entre el escaleno anterior y el escaleno medio.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.85
        },
        {
          x: 58.68, y: 12.77, width: 5.38, height: 9.29, text: '', type: 'info', infoText: 'Articulación acromoclavicular.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 65.23, y: 58.48, width: 5.38, height: 8.29, text: '', type: 'info', infoText: 'RHOMBOIDEUS MAJOR C5 - Electrodo de aguja concéntrica, insertar en el borde medial del ángulo inferior de la escápula.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.85
        },
        {
          x: 58.95, y: 68.36, width: 5.38, height: 8.29, text: '', type: 'info', infoText: 'No se requiere. En caso de modificar la técnica (no recomendable) con aguja monopolar, colocar su referencia con electrodos de superfice en el vértice de la escapula.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/escapularDorsal-T-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/escapularDorsal-G-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
    ],
  },
  'Torácico largo': {
    imagenes: [
      require('../../../assets/tecnicas/neurografia/toracico_largo.png'),
    ],
    botones: [
      [
        {
          x: 52.77, y: 6.0, width: 5.68, height: 8.59, text: '', type: 'info', infoText: 'ERB. Fosa supraclavicular, 2 cm por arriba de la clavícula y borde posterior del esternocleidomastoideo, entre el escaleno anterior y el escaleno medio.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.85
        },
        {
          x: 56.70, y: 12.21, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'Articulación acromoclavicular.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 47.0, y: 65.92, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'Se colocan sobre el mismo segmento siguiendo la curvatura costal de forma horizontal de 3 a 4 cm más anteriormente que el electrodo activo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.85
        },
        {
          x: 68.51, y: 63.21, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'SERRATUS ANTERIOR C5, C6, C7 - Electrodos de superficie sobre la quinta o sexta costilla en la línea media axilar.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.85
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/toracicoLg-T-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/toracicoLg-G-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
    ],
  },
  'Toracodorsal': {
    imagenes: [
      require('../../../assets/tecnicas/neurografia/toracodorsal.png'),
    ],
    botones: [
      [
        {
          x: 48.85, y: 5.25, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'ERB. Fosa supraclavicular, 2 cm por arriba de la clavícula y borde posterior del esternocleidomastoideo, entre el escaleno anterior y el escaleno medio.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.85
        },
        {
          x: 52.81, y: 12.17, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'Articulación acromoclavicular.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 67.25, y: 52.33, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'LATISSIMUS DORSI C6, C7, C8 - Electrodo de aguja concéntrico insertado en el vientre muscular, pared posterior de la axila.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.85
        },
        {
          x: 65.92, y: 61.91, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'No se requiere.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/toracodorsal-T-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/toracodorsal-G-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
    ],
  },
  'Frénico': {
    imagenes: [
      require('../../../assets/tecnicas/neurografia/frenico.png'),
      require('../../../assets/tecnicas/neurografia/frenico2.png'),
    ],
    botones: [
      [
        {
          x: 47.48, y: 6.29, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'CUELLO PUNTO MEDIO. Borde posterior del músculo esternocleidomastoideo (ECM) a nivel del cartílago tiroides.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 49.26, y: 16.13, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'CUELLO PUNTO INFERIOR. Sobre el borde superior de la clavícula entre las cabezas esternal y clavicular del musculo ECM con posición a la neutra o ligeramente extendida.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.85
        },
        {
          x: 36.53, y: 30.09, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'Sobre pectoral ipsilateral a estimulo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 40.32, y: 67.32, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'De forma bilateral en el séptimo espacio intercostal horizontal a la tetilla o con referencia a línea media clavicular.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.85
        },
        {
          x: 53.56, y: 58.54, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'DIAPHRAGM C3, C4, C5 - Electrodo de superficie sobre apófisis xifoides.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 66.88, y: 67.32, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'De forma bilateral en el séptimo espacio intercostal horizontal a línea media clavicular.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.85
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/01-Frenico-T.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/01-Frenico-G.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
      [
        {
          x: 53.52, y: 9.58, width: 5.68, height: 8.59, text: '', type: 'info', infoText: 'CUELLO PUNTO INFERIOR. Sobre el borde superior de la clavícula entre las cabezas esternal y clavicular del musculo ECM con posición a la neutra o ligeramente extendida.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          x: 65.23, y: 51.81, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'Esternón.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 43.60, y: 60.90, width: 5.84, height: 7.25, text: '', type: 'info', infoText: 'DIAPHRAGM C3, C4, C5 - Electrodo de superficie sobre octavo espacio intercostal en la línea axilar anterior.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 43.60, y: 68.13, width: 5.84, height: 7.25, text: '', type: 'info', infoText: 'Caudalmente a electrodo de registros, pero sobre noveno espacio intercostal.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/01-Frenico-T.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/FrenicoG.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
    ],
  },
  'Espinal accesorio': {
    imagenes: [
      require('../../../assets/tecnicas/neurografia/espinal.png'),
      require('../../../assets/tecnicas/neurografia/espinal2.png'),
    ],
    botones: [
      [
        {
          x: 56.70, y: 42.76, width: 5.68, height: 8.59, text: '', type: 'info', infoText: 'TRIANGULO POSTERIOR DEL CUELLO. Borde posterior del esternocleidomastoideo, ligeramente por arriba de su tercio medio.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.85
        },
        {
          x: 73.08, y: 41.97, width: 5.68, height: 8.59, text: '', type: 'info', infoText: 'TRAPEZIUS C3, C4 - Fibras superiores con electrodo de superficie colocar 5-8 cm lateral en relacion a la apófisis espinosa C7.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.85
        },
        {
          x: 75.47, y: 50.92, width: 5.68, height: 8.59, text: '', type: 'info', infoText: '3 cm lateral del electrodo de registro.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 73.99, y: 65.0, width: 7.68, height: 10.59, text: '', type: 'info', infoText: 'Acromio.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/01-Espinal-T.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/01-Espinal-G.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
      [
        {
          x: 15.95, y: 21.02, width: 5.68, height: 8.59, text: '', type: 'info',
          infoText: 'TRIANGULO POSTERIOR DEL CUELLO. Borde posterior del esternocleidomastoideo, ligeramente por arriba de su tercio medio',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.85
        },
        {
          x: 26.76, y: 38.61, width: 5.68, height: 8.59, text: '', type: 'info',
          infoText: '3 cm lateral del electrodo de registro.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 25.98, y: 25.51, width: 5.68, height: 8.59, text: '', type: 'info',
          infoText: 'TRAPEZIUS C3, C4 - Fibras superiores con electrodo de superficie colocar 5-8 cm lateral en relacion a la apófisis espinosa C7.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.85
        },
        {
          x: 36.0, y: 16.61, width: 5.68, height: 8.59, text: '', type: 'info',
          infoText: 'TRAPEZIUS C3, C4 - Fibras medias con electrodo de superficie, colocarlo en el punto medio entre la espina escapular y la apófisis espinosa de T3.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          x: 41.95, y: 15.84, width: 5.68, height: 8.59, text: '', type: 'info',
          infoText: '3 cm distal del electrodo de registro.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 58.34, y: 14.26, width: 5.68, height: 8.59, text: '', type: 'info',
          infoText: 'TRAPEZIUS C3, C4 - Fibras inferiores Con electrodo de superficie, colocarlo en el punto medio entre el ángulo inferior escapular y la apófisis espinosa de T7.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          x: 64.41, y: 12.95, width: 5.68, height: 8.59, text: '', type: 'info',
          infoText: '3 cm distal del electrodo de registro.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 38.0, y: 68.36, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'Acromio.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/02-Espinal-T.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/02-Espinal-G.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
    ],
  },
  'Supraclavicular': {
    imagenes: [
      require('../../../assets/tecnicas/neurografia/supraclavicular.png'),
    ],
    botones: [
      [
        {
          x: 34.71, y: 59.59, width: 4.11, height: 7.77, text: '', type: 'info', infoText: 'Acromio.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 52.59, y: 50.52, width: 4.11, height: 7.77, text: '', type: 'info', infoText: 'CUELLO PUNTO MEDIO. El cátodo se coloca en el borde posterior del músculo esternocleidomastoideo a nivel del margen inferior del cartílago tiroides.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.85
        },
        {
          x: 39.22, y: 63.21, width: 14.0, height: 5.70, text: '', type: 'info', infoText: 'ÁREA SUPRACLAVICULAR - Electrodos adheribles de tira colocados sobre la superficie exterior de la diáfisis clavicular.', rotateDeg: 14,
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 38.12, y: 68.91, width: 14.0, height: 5.70, text: '', type: 'info', infoText: '3 cm en dirección caudal con electrodo de tira, horizontal al activo.', rotateDeg: 14,
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/01-Supraclavicular-T.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/01-Supraclavicular-G.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },  
      ],
    ],
  },
  'Auricular mayor': {
    imagenes: [
      require('../../../assets/tecnicas/neurografia/auricular_m.png'),
    ],
    botones: [
      [
        {
          x: 45.40, y: 36.79, width: 5.11, height: 7.77, text: '', type: 'info', infoText: '2 cm en dirección cefálica a electrodo activo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 44.50, y: 45.08, width: 5.38, height: 8.29, text: '', type: 'info', infoText: 'LÓBULO DE LA OREJA - Con electrodos de superficie sobre la parte posterior y tercio inferior del lóbulo de la oreja.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 46.84, y: 56.22, width: 5.38, height: 8.29, text: '', type: 'info', infoText: 'CUELLO PUNTO MEDIO. De forma antidrómica en el borde lateral del músculo esternocleidomastoideo, aproximadamente en su tercio medio u 8cm de distancia en dirección caudal del electrodo de registro.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          x: 62.88, y: 67.87, width: 5.38, height: 9.29, text: '', type: 'info', infoText: 'Proceso espinoso C7.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/01-AuricularM-T.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/01-AuricularM-G.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
    ],
  },
  'Occipital mayor': {
    imagenes: [
      require('../../../assets/tecnicas/neurografia/occipital_m.png'),
    ],
    botones: [
      [
        {
          x: 57.93, y: 30.05, width: 4.42, height: 6.47, text: '', type: 'info', infoText: '2 cm en direccion cefálica tomando como referencia el electrodo activo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 57.93, y: 36.27, width: 4.42, height: 6.47, text: '', type: 'info', infoText: 'ÁREA OCCIPITAL - Electrodo de aguja subdérmico, colocado en el trayecto del ápex, 1 cm lateral a la protuberancia occipital externa ipsilateral al lado a estimular (insertar de forma oblicua en dirección cefálica).',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 19.42
        },
        {
          x: 57.38, y: 47.15, width: 4.42, height: 6.47, text: '', type: 'info', infoText: 'ESPACIO INTERVERTEBRAL C1-C2. Con electrodo de aguja monopolar (cátodo), 6-8 cm en dirección caudal de electrodo activo, 1 cm lateral a la línea media con referencia al borde inferior de la apófisis mastoides, emulando las técnicas de estimulación de raíz (colocar ánodo 3-4 cm caudal).',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 24.61
        },
        {
          x: 55.0, y: 68.65, width: 5.11, height: 8.77, text: '', type: 'info', infoText: 'Apófisis espinosa C7.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/01-OccipitalM-T.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/01-OccipitalM-G.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
    ],
  },
  'Facial': {
    imagenes: [
      require('../../../assets/tecnicas/neurografia/facial.png'),
      require('../../../assets/tecnicas/neurografia/facial2.png'),
      require('../../../assets/tecnicas/neurografia/facial3.png'),
      require('../../../assets/tecnicas/neurografia/facial4.png'),
      require('../../../assets/tecnicas/neurografia/facial5.png'),
    ],
    botones: [
      [
        {
          x: 35.21, y: 44.56, width: 5.11, height: 7.77, text: '', type: 'info', infoText: 'POSTAURICULAR. El cátodo se coloca en el agujero estilomastoideo justo detrás y después del oído, inferior y anterior a la apófisis mastoides.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          x: 45.92, y: 41.97, width: 5.11, height: 7.77, text: '', type: 'info', infoText: 'Hueso cigomatico.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 53.0, y: 61.10, width: 3.70, height: 6.42, text: '', type: 'info', infoText: 'MENTALIS.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 56.84, y: 61.10, width: 3.70, height: 6.42, text: '', type: 'info', infoText: 'MENTALIS.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 49.26, y: 51.30, width: 5.11, height: 7.77, text: '', type: 'info', infoText: 'ORBICULARIS ORIS.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 59.03, y: 51.30, width: 5.11, height: 7.77, text: '', type: 'info', infoText: 'ORBICULARIS ORIS.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 53.55, y: 38.34, width: 3.42, height: 6.47, text: '', type: 'info', infoText: 'NASALIS.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 56.84, y: 38.34, width: 3.42, height: 6.47, text: '', type: 'info', infoText: 'NASALIS.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 44.97, y: 33.68, width: 5.11, height: 7.77, text: '', type: 'info', infoText: 'ORBICULARIS OCULI.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 62.45, y: 33.68, width: 5.11, height: 7.77, text: '', type: 'info', infoText: 'ORBICULARIS OCULI.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 48.55, y: 18.41, width: 5.11, height: 7.77, text: '', type: 'info', infoText: 'FRONTALIS.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 59.71, y: 18.41, width: 5.11, height: 7.77, text: '', type: 'info', infoText: 'FRONTALIS.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/02-Facial-T.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/01-Facial-G.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
      [
        {
          x: 52.55, y: 52.33, width: 4.42, height: 6.47, text: '', type: 'info', infoText: 'Sobre el dorso del tabique nasal 1 cm en dirección lateral, ipsilateral al lado estimulado.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 67.97, y: 55.44, width: 4.42, height: 6.47, text: '', type: 'info', infoText: 'ORBICULARIS ORIS - Con electrodo de superficie colocado lateral al borde externo de la comisura labial.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 72.40, y: 59.81, width: 3.42, height: 6.47, text: '', type: 'info', infoText: 'Inferior a la mitad del labio menor.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 63.50, y: 35.27, width: 4.42, height: 6.47, text: '', type: 'info', infoText: 'ORBICULARIS OCULI - Con electrodo de superficie colocado lateral al borde externo de la órbita.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.85
        },
        {
          x: 73.36, y: 41.23, width: 3.74, height: 5.78, text: '', type: 'info', infoText: 'NASALIS - Con electrodo de superficie colocado lateral al centro de la nariz.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 73.90, y: 37.31, width: 2.74, height: 5.18, text: '', type: 'info', infoText: 'Sobre el dorso del tabique nasal 1 cm en dirección lateral, ipsilateral al lado estimulado.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.85
        },
        {
          x: 71.71, y: 34.97, width: 2.74, height: 5.18, text: '', type: 'info', infoText: 'Sobre dorso del tabique nasal 2 cm en dirección lateral, ipsilateral al lado estimulado.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.85
        },
        {
          x: 71.26, y: 17.69, width: 6.11, height: 8.77, text: '', type: 'info', infoText: 'Región frontal.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/02-Facial-T.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/02-Facial-G.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
      [
        {
          x: 42.37, y: 18.73, width: 5.11, height: 8.77, text: '', type: 'info', infoText: 'Región frontal.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 45.04, y: 37.61, width: 4.42, height: 7.47, text: '', type: 'info', infoText: 'Sobre dorso del tabique nasal 2 cm en dirección lateral, ipsilateral al lado estimulado.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 54.55, y: 39.41, width: 4.42, height: 6.47, text: '', type: 'info', infoText: 'ORBICULARIS OCULI - Con electrodo de superficie colocado lateral al borde externo de la órbita.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 59.71, y: 49.74, width: 4.42, height: 6.47, text: '', type: 'info', infoText: 'RAMA. 2 a 5 cm en dirección antero medial y orientado hacia el musculo correspondiente.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 61.95, y: 56.00, width: 2.74, height: 6.18, text: '', type: 'info', infoText: 'PREAURICULAR. El cátodo se coloca sobre el trago anterior delante de la oreja dirigiendo el ánodo proximalmente.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.85
        },
        {
          x: 64.82, y: 56.99, width: 2.74, height: 6.18, text: '', type: 'info', infoText: 'POSTAURICULAR. El cátodo se coloca en el agujero estilomastoideo justo detrás y después del oído, inferior y anterior a la apófisis mastoides.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/02-Facial-T.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/03-Facial-G.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
      [
        {
          x: 49.52, y: 51.81, width: 2.74, height: 5.18, text: '', type: 'info', infoText: 'POSTAURICULAR. El cátodo se coloca en el agujero estilomastoideo justo detrás y después del oído, inferior y anterior a la apófisis mastoides.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          x: 52.39, y: 51.55, width: 2.74, height: 5.18, text: '', type: 'info', infoText: 'PREAURICULAR. El cátodo se coloca sobre el trago anterior delante de la oreja dirigiendo el ánodo proximalmente.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.85
        },
        {
          x: 56.01, y: 50.00, width: 3.42, height: 6.47, text: '', type: 'info', infoText: 'RAMA. 2 a 5 cm en dirección antero medial y orientado hacia el musculo correspondiente.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 71.79, y: 40.16, width: 3.74, height: 5.18, text: '', type: 'info', infoText: 'NASALIS - Con electrodo de superficie colocado lateral al centro de la nariz.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 71.76, y: 33.97, width: 3.74, height: 5.18, text: '', type: 'info', infoText: 'Sobre el dorso del tabique nasal 1 cm en dirección lateral, ipsilateral al lado estimulado.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.85
        },
        {
          x: 69.89, y: 16.10, width: 6.11, height: 8.77, text: '', type: 'info', infoText: 'Región frontal.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/02-Facial-T.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/04-Facial-G.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
      [
        {
          x: 40.32, y: 16.65, width: 5.11, height: 8.77, text: '', type: 'info', infoText: 'Región frontal.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 40.0, y: 60.36, width: 4.42, height: 7.47, text: '', type: 'info', infoText: 'Inferior a la mitad del labio menor.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 46.0, y: 54.92, width: 4.42, height: 7.47, text: '', type: 'info', infoText: 'ORBICULARIS ORIS - Con electrodo de superficie colocado lateral al borde externo de la comisura labial.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 55.09, y: 53.09, width: 3.42, height: 6.47, text: '', type: 'info', infoText: 'RAMA. 2 a 5 cm en dirección antero medial y orientado hacia el musculo correspondiente.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 59.0, y: 52.07, width: 2.94, height: 5.18, text: '', type: 'info', infoText: 'PREAURICULAR. El cátodo se coloca sobre el trago anterior delante de la oreja dirigiendo el ánodo proximalmente.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.85
        },
        {
          x: 62.08, y: 52.33, width: 2.94, height: 5.78, text: '', type: 'info', infoText: 'POSTAURICULAR. El cátodo se coloca en el agujero estilomastoideo justo detrás y después del oído, inferior y anterior a la apófisis mastoides.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/02-Facial-T.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/05-Facial-G.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
    ],
  },
  'Trigémino': {
    imagenes: [
      require('../../../assets/tecnicas/neurografia/trigemino.png'),
    ],
    botones: [
      [
        {
          x: 56.8, y: 9.0, width: 4.42, height: 6.47, text: '', type: 'info', infoText: 'ÁREA FRONTAL. El cátodo del estimulador se coloca en la esquina lateral superior del hueso frontal.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 61.52, y: 19.21, width: 4.42, height: 6.47, text: '', type: 'info', infoText: 'RAMA OFTÁLIMICA - El electrodo activo de superficie se coloca en el foramen supraorbitario.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 66.02, y: 20.76, width: 4.42, height: 6.47, text: '', type: 'info', infoText: 'Medial al elétrodo activo, 2-3 cm de distancia.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 65.78, y: 7.59, width: 5.11, height: 8.77, text: '', type: 'info', infoText: 'Región frontal contralateral.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/01-Trigemino-T.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/01-Trigemino-G.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
    ],
  },
  'Peroneo': {
    imagenes: [
      require('../../../assets/tecnicas/neurografia/peroneo.png'),
      require('../../../assets/tecnicas/neurografia/peroneo2.png'),
      require('../../../assets/tecnicas/neurografia/peroneo3.png'),
      require('../../../assets/tecnicas/neurografia/peroneo4.png'),
      require('../../../assets/tecnicas/neurografia/peroneo5.png'),
    ],
    botones: [
      [
        {
          x: 21.33, y: 50.26, width: 5.11, height: 7.77, text: '', type: 'info', infoText: 'Articulación metatarsofalángica del quinto ortejo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 29.0, y: 56.48, width: 5.11, height: 7.77, text: '', type: 'info', infoText: 'EXTENSOR DIGITORUM BREVIS L5, S1 - Región anterolateral mediotarsiana proximal, trazar una línea imaginaria desde el centro del maléolo lateral hasta la articulación metatarsofalángica del quinto ortejo y colocar electrodo de superficie en el centro del tercio proximal.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 20.72
        },
        {
          x: 33.84, y: 66.84, width: 5.11, height: 8.77, text: '', type: 'info', infoText: 'Dorso del pie o talón.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 36.39, y: 49.74, width: 5.11, height: 7.77, text: '', type: 'info', infoText: 'TOBILLO. 8 cm proximal del electrodo activo, discretamente lateral al tendón del tibial anterior.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 79.52, y: 26.46, width: 5.11, height: 8.77, text: '', type: 'info', infoText: 'FÍBULA. Detrás y discretamente por debajo de la cabeza del peroné.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 87.78, y: 28.79, width: 5.11, height: 8.77, text: '', type: 'info', infoText: 'RODILLA. En el punto de la sección transversal entre el tendón lateral de los isquiotibiales y el pliegue del hueco poplíteo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.85
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/01-Peroneo-T.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/01-Peroneo-G.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
      [
        {
          x: 14.89, y: 21.54, width: 5.68, height: 8.59, text: '', type: 'info', infoText: 'Tibia medial o rotula',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 14.0, y: 52.33, width: 5.68, height: 8.59, text: '', type: 'info', infoText: 'RODILLA. En el punto de la sección transversal entre el tendón lateral de los isquiotibiales y el pliegue del hueco poplíteo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 22.42, y: 51.47, width: 5.68, height: 8.59, text: '', type: 'info', infoText: 'FÍBULA. Detrás y discretamente por debajo de la cabeza del peroné.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 39.36, y: 44.04, width: 5.68, height: 8.59, text: '', type: 'info', infoText: 'TIBIALIS ANTERIOR L4, L5 - Cara lateral de la tibia, el electrodo de superficie se coloca en la unión del tercio proximal y medio de la pierna, en el punto exacto de una línea trazada entre la tuberosidad tibial anterior y el maléolo lateral.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 20.72
        },
        {
          x: 48.44, y: 49.74, width: 5.68, height: 8.59, text: '', type: 'info', infoText: '4 cm distal al electrodo activo sobre el tendón del Tibial anterior.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/02-Peroneo-T.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/02-Peroneo-G.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
      [
        {
          x: 9.0, y: 64.25, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'RODILLA. En el punto de la sección transversal entre el tendón lateral de los isquiotibiales y el pliegue del hueco poplíteo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.84
        },
        {
          x: 23.99, y: 59.07, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'FÍBULA. Detrás y discretamente por debajo de la cabeza del peroné.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 37.30, y: 55.70, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'PERONEUS LONGUS L5, S1 - El electrodo de superficie se coloca a 8 cm distal del punto de estimulación de la fíbula sobre una línea trazada entre maléolo lateral y la cabeza del peroné.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          x: 45.0, y: 57.02, width: 5.68, height: 9.59, text: '', type: 'info', infoText: '4 cm distal del electrodo activo sobre el recorrido del tendón.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 41.68, y: 44.04, width: 6.68, height: 9.59, text: '', type: 'info', infoText: 'Tibia medial.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/02-Peroneo-T.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/03-Peroneo-G.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ], 
      [
        {
          x: 9.2, y: 55.70, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'RODILLA. En el punto de la sección transversal entre el tendón lateral de los isquiotibiales y el pliegue del hueco poplíteo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 23.66, y: 53.09, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'FÍBULA. Detrás y discretamente por debajo de la cabeza del peroné.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 42.10, y: 39.68, width: 6.68, height: 10.59, text: '', type: 'info', infoText: 'Tibia medial.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 56.56, y: 53.09, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'EXTENSOR HALLUCIS LONGUS L5-S1 - Electrodo de superficie colocado entre el tercio distal y medio de la pierna a 2 cm lateral del borde de la tibia.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          x: 65.23, y: 53.88, width: 5.68, height: 9.59, text: '', type: 'info', infoText: '4 cm distal del electrodo activo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/02-Peroneo-T.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/03-Peroneo-G.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ], 
      [
        {
          x: 11.01, y: 5.70, width: 4.68, height: 7.59, text: '', type: 'info', infoText: 'Rótula.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 19.82, y: 32.16, width: 4.11, height: 7.77, text: '', type: 'info', infoText: 'TIBIALIS ANTERIOR L4, L5 - Cara lateral de la tibia, el electrodo de superficie se coloca en la unión del tercio proximal y medio de la pierna, en el punto exacto de una línea trazada entre la tuberosidad tibial anterior y el maléolo lateral.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 19.43
        },
        {
          x: 23.0, y: 41.45, width: 4.11, height: 7.77, text: '', type: 'info', infoText: '4 cm distal al electrodo activo sobre el tendón del Tibial anterior.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 65.33, y: 6.79, width: 6.68, height: 9.59, text: '', type: 'info', infoText: 'Rotula.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 82.58, y: 62.69, width: 4.11, height: 7.77, text: '', type: 'info', infoText: 'Articulación metatarsofalángica del quinto ortejo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 88.37, y: 58.28, width: 4.11, height: 7.77, text: '', type: 'info', infoText: 'EXTENSOR DIGITORUM BREVIS L5, S1 - Región anterolateral mediotarsiana proximal, trazar una línea imaginaria desde el centro del maléolo lateral hasta la articulación metatarsofalángica del quinto ortejo y colocar electrodo de superficie en el centro del tercio proximal.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 20.78
        },
        {
          x: 93.56, y: 56.99, width: 4.11, height: 7.77, text: '', type: 'info', infoText: 'Talón.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 47.48, y: 16.06, width: 18.49, height: 58.28, text: '', type: 'info', infoText: 'P2. La estimulación se aplica a intervalos de 2 cm a lo largo del trayecto del nervio Peroneo a través de la fíbula. El punto de estimulación “P” se identifica como el punto 0 o cabeza del peroné. Los puntos D2 y D4 corresponden a 2 y 4 cm distales al punto “P”. Los puntos P2, P4 y P6 corresponden a 2, 4 y 6 cm proximales respectivamente.',
          rotateDeg: 115,
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 23.31
        },
        {
          type: 'image', x: 130, y: 240, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/04-Peroneo-T.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 640, y: 10, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/04-Peroneo-G.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
        {
          type: 'image', x: 190, y: 240, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/06-Peroneo-G.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
    ],
  },
  'Peroneo superficial': {
    imagenes: [
      require('../../../assets/tecnicas/neurografia/peroneo_superficial.png'),
      require('../../../assets/tecnicas/neurografia/peroneo_superficial2.png'),
    ],
    botones: [
      [
        {
          x: 44.92, y: 57.01, width: 5.11, height: 7.77, text: '', type: 'info', infoText: 'Dorso del pie.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 45.42, y: 44.56, width: 4.11, height: 7.77, text: '', type: 'info', infoText: '2 cm distal: registro de la rama cutánea dorsal medial y 1 cm lateral rama cutánea dorsal intermedia.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 57.12, y: 39.38, width: 4.42, height: 6.47, text: '', type: 'info', infoText: '3-4 cm distal del electrodo de registo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 58.5, y: 33.20, width: 4.42, height: 6.47, text: '', type: 'info', infoText: 'INTERMALEOLAR - Electrodo de superficie, colocar preferetemente barra en la línea media, entre el maléolo lateral y el tendón del tibial anterior, transversal a la intersección de ambos maléolos.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.85
        },
        {
          x: 64.56, y: 1.63, width: 5.11, height: 7.77, text: '', type: 'info', infoText: 'PIERNA LATERAL. (Antidrómico) 12-14 cm proximal del electrodo activo, anterior al musculo peroneo largo y adyacente al musculo tibial anterior.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.85
        },
        {
          x: 60.80, y: 63.70, width: 5.11, height: 7.77, text: '', type: 'info', infoText: '3-4 cm distal del electrodo de registo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/PeroneoSp-T-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/PeroneoSp-G-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
      [
        {
          x: 44.89, y: 55.97, width: 5.11, height: 7.77, text: '', type: 'info', infoText: 'Dorso del pie.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 58.07, y: 38.86, width: 4.42, height: 6.47, text: '', type: 'info', infoText: '3-4 cm distal del electrodo de registo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 59.30, y: 33.68, width: 4.42, height: 6.47, text: '', type: 'info', infoText: 'INTERMALEOLAR - Electrodo de superficie, colocar preferetemente barra en la línea media, entre el maléolo lateral y el tendón del tibial anterior, transversal a la intersección de ambos maléolos.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          x: 63.14, y: 2.88, width: 5.11, height: 28.50, text: '', type: 'info', infoText: 'PIERNA LATERAL. La estimulación se aplica de forma antidrómica como primer punto a 12 cm en dirección proximal del electrodo activo justo lateral al tendón extensor largo del primer ortejo en la región lateral de la pierna. Los siguientes puntos de estímulo de aplicaran cada centímetro en dirección distal hasta llegar al electrodo de registro.',
          rotateDeg: 18,
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 23.32
        },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/PeroneoPf-G-02.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
    ],
  },
  'Peroneo profundo': {
    imagenes: [
      require('../../../assets/tecnicas/neurografia/peroneo_profundo.png'),
    ],
    botones: [
      [
        {
          x: 54.22, y: 66.82, width: 4.42, height: 6.48, text: '', type: 'info', infoText: '3 cm distal sobre dorso del segundo ortejo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 55.70, y: 60.88, width: 4.42, height: 6.48, text: '', type: 'info', infoText: 'DORSO DEL PIE - Horizontal al espacio interdigital, entre las cabezas del primer y segundo metatarsiano.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 53.26, y: 31.38, width: 5.11, height: 7.77, text: '', type: 'info', infoText: 'TOBILLO. (Antidrómico) 12 cm proximal del electrodo activo y justo lateral al tendón extensor largo del primer ortejo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 51.45, y: 0.1, width: 5.11, height: 7.77, text: '', type: 'info',
          infoText: 'Dorso del pie o pierna.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/PeroneoPf-T-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/PeroneoPf-G-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
    ],
  },
  'Tibial': {
    imagenes: [
      require('../../../assets/tecnicas/neurografia/tibial.png'),
      require('../../../assets/tecnicas/neurografia/tibial2.png'),
      require('../../../assets/tecnicas/neurografia/tibial3.png'),
      require('../../../assets/tecnicas/neurografia/tibial4.png'),
    ],
    botones: [
      [
        {
          x: 12.99, y: 27.24, width: 5.11, height: 8.77, text: '', type: 'info', infoText: 'HUECO POPLITEO. Ligeramente lateral del punto medio sobre el pliegue cutáneo poplíteo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 64.0, y: 61.40, width: 5.11, height: 7.77, text: '', type: 'info', infoText: 'TOBILLO. Ligeramente detrás del maléolo medial, línea media entre el borde óseo y el tendón de Aquiles, aproximadamente 8-10 cm del electrodo activo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.84
        },
        {
          x: 79.0, y: 59.07, width: 5.11, height: 7.77, text: '', type: 'info', infoText: 'ABDUCTOR HALLUCIS S1, S2 - Colocar electrodo de superficie ligeramente proximal y por debajo de la tuberosidad navicular, aproximadamente 1 cm en ambas direcciones.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          x: 75.81, y: 44.08, width: 6.11, height: 8.77, text: '', type: 'info', infoText: 'Dorso del pie.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 86.27, y: 37.82, width: 5.11, height: 7.77, text: '', type: 'info', infoText: 'Base del primer metatarsiano, o en la articulación metatarsofalángica.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/Tibial-T-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/Tibial-G-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
      [
        {
          x: 7.95, y: 34.97, width: 5.68, height: 8.59, text: '', type: 'info', infoText: 'HUECO POPLITEO. Ligeramente lateral del punto medio sobre el pliegue cutáneo poplíteo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 65.03, y: 33.68, width: 5.68, height: 8.59, text: '', type: 'info', infoText: 'TOBILLO. Ligeramente detrás del maléolo medial, línea media entre el borde óseo y el tendón de Aquiles.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 72.58, y: 65.77, width: 5.68, height: 8.59, text: '', type: 'info', infoText: 'ABDUCTOR DIGITI MINIMI S2, S3 - Electrodo de superficie colocado debajo del maléolo lateral, dividiendo la distancia hasta la planta del pie.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.84
        },
        {
          x: 75.38, y: 46.90, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'Dorso del pie.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 84.54, y: 52.85, width: 5.68, height: 8.59, text: '', type: 'info', infoText: 'Articulación metatarsofalángica del quinto ortejo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/Tibial-T-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/Tibial-G-02.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ], 
      [
        {
          x: 43.25, y: 6.77, width: 5.68, height: 8.59, text: '', type: 'info', infoText: 'TOBILLO. Ligeramente detrás del maléolo medial, línea media entre el borde óseo y el tendón de Aquiles.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 48.16, y: 27.20, width: 5.68, height: 8.59, text: '', type: 'info', infoText: 'ABDUCTOR HALLUCIS S1, S2 - RAMA MEDIAL, colocar electrodo de superficie ligeramente proximal y por debajo de la tuberosidad navicular, aproximadamente 1 cm en ambas direcciones.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.84
        },
        {
          x: 63.84, y: 25.91, width: 5.68, height: 8.59, text: '', type: 'info', infoText: 'ABDUCTOR DIGITI MINIMI S2, S3 - RAMA LATERAL, electrodo de superficie colocado debajo del maléolo lateral, dividiendo la distancia hasta la planta del pie.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.84
        },
        {
          x: 54.85, y: 35.75, width: 5.68, height: 8.59, text: '', type: 'info', infoText: 'Dorso del pie.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 48.44, y: 46.11, width: 5.68, height: 8.59, text: '', type: 'info', infoText: 'Base del primer metatarsiano, o en la articulación metatarsofalángica.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 61.21, y: 44.04, width: 5.68, height: 8.59, text: '', type: 'info', infoText: 'Articulación metatarsofalángica del quinto ortejo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/Tibial-T-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/Tibial-G-03.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ], 
      [
        {
          x: 13.7, y: 42.75, width: 5.11, height: 7.77, text: '', type: 'info', infoText: 'HUECO POPLITEO. Ligeramente lateral del punto medio sobre el pliegue cutáneo poplíteo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 34.92, y: 29.02, width: 5.11, height: 7.77, text: '', type: 'info', infoText: 'GASTROCNEMIUS LATERAL S1, S2 - 8 a 10 cm distal del pliegue de la rodilla con orientación lateral, tomando como referencia una línea horizontal desde los tendones isquiotibiales en el hueco poplíteo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          x: 37.08, y: 52.33, width: 5.11, height: 7.77, text: '', type: 'info', infoText: 'GASTROCNEMIUS MEDIAL S1, S2 - 8 a 10 cm distal del pliegue de la rodilla con orientación medial, tomando como referencia una línea horizontal desde los tendones isquiotibiales en el hueco poplíteo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          x: 45.81, y: 32.38, width: 5.11, height: 7.77, text: '', type: 'info', infoText: 'Justo debajo del borde inferior del gastrocnemio con orientación lateral.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 48.45, y: 38.86, width: 5.11, height: 7.77, text: '', type: 'info', infoText: 'SOLEUS S1, S2 - Justo debajo del borde que divide ambos gastrocnemios, se recomienda utilizar aguja de registro.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.84
        },
        {
          x: 47.34, y: 46.89, width: 5.11, height: 7.77, text: '', type: 'info', infoText: 'Justo debajo del borde inferior del gastrocnemio con orientación medial.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 57.0, y: 27.50, width: 5.11, height: 8.77, text: '', type: 'info', infoText: 'Pierna lateral.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 62.96, y: 40.16, width: 5.21, height: 7.77, text: '', type: 'info', infoText: 'Distal al recorrido del tendón de Aquiles.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/Tibial-G-04.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
    ],
  },
  'Sural': {
    imagenes: [
      require('../../../assets/tecnicas/neurografia/sural.png'),
      require('../../../assets/tecnicas/neurografia/sural2.png'),
    ],
    botones: [
      [
        {
          x: 40.73, y: 23.0, width: 4.42, height: 6.47, text: '', type: 'info', infoText: '1 cm lateral.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 41.00, y: 28.50, width: 4.01, height: 5.70, text: '', type: 'info', infoText: 'PIERNA. (ntidrómico), 10 a 14 cm proximal del electrodo activo, región posterior de la pierna en la unión del tercio medio e inferior, justo lateral a la línea media.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          x: 41.14, y: 33.68, width: 4.01, height: 5.70, text: '', type: 'info', infoText: '1 cm medial.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 68.28, y: 27.50, width: 4.42, height: 6.47, text: '', type: 'info', infoText: 'TOBILLO RETROMALEOLAR - Línea media entre el borde posterior del maléolo lateral y el tendón de Aquiles, tomando como límite proximal el polo superior del maléolo y pudiéndose ubicar hasta su borde inferior como límite distal.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 19.42
        },
        {
          x: 72.53, y: 26.72, width: 4.42, height: 6.47, text: '', type: 'info', infoText: '3 cm distal del electrodo de registo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 81.30, y: 33.97, width: 6.68, height: 10.59, text: '', type: 'info', infoText: 'Punto medio entre estimulo y registro.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/Sural-T-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/Sural-G-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
      [
        {
          x: 50.22, y: 57.28, width: 5.11, height: 7.77, text: '', type: 'info', infoText: 'TOBILLO. De forma antidrómica, justo por detrás del maléolo lateral horizontal al borde inferior.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 54.33, y: 30.35, width: 6.68, height: 10.59, text: '', type: 'info', infoText: 'Dorso del pie.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 65.92, y: 35.03, width: 5.11, height: 7.77, text: '', type: 'info', infoText: 'RAMA CUTÁNEA LATERAL DORSAL - Dorso del pie sobre la porción medial del quinto metatarsiano, justo lateral al tendón extensor largo del quinto dedo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.85
        },
        {
          x: 69.54, y: 27.0, width: 5.11, height: 7.77, text: '', type: 'info', infoText: '3 cm distal del electrodo activo o en la articulacion metatarsofalangica del 5to ortejo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/Sural-T-02.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/Sural-G-02.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
    ],
  },
  'Plantar': {
    imagenes: [
      require('../../../assets/tecnicas/neurografia/plantar.png'),
      require('../../../assets/tecnicas/neurografia/plantar2.png'),
      require('../../../assets/tecnicas/neurografia/plantar3.png'),
    ],
    botones: [
      [
        {
          x: 31.64, y: 60.80, width: 4.42, height: 7.47, text: '', type: 'info', infoText: 'Primer ortejo, distal a electrodo activo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 34.38, y: 55.70, width: 4.42, height: 6.47, text: '', type: 'info', infoText: 'RAMA MEDIAL - Electrodos de anillo en el primer ortejo, cercano al pliegue metatarsofalángico.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 52.41, y: 71.50, width: 4.74, height: 7.18, text: '', type: 'info', infoText: 'Quinto ortejo, distal a electrodo activo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 54.23, y: 66.84, width: 4.74, height: 5.18, text: '', type: 'info', infoText: 'RAMA LATERAL - Electrodos de anillo en el quinto ortejo, cercano al pliegue metatarsofalángico.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 55.33, y: 17.91, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'Dorso del pie o sitio indiferente entre estimulo y registro.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 61.77, y: 14.58, width: 4.42, height: 7.47, text: '', type: 'info', infoText: 'RETROMALEOLAR. Antidrómico detrás y justo por encima del maléolo medial (retináculo flexor). Distancia no indispensable, deseada de 14 cm del cátodo a electrodo activo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/Plantar-T-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/Plantar-G-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
      [
        {
          x: 24.27, y: 36.79, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'Referencia proximal.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 30.00, y: 36.79, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'NERVIO TIBIAL - Se coloca electrodo de barra (activo distal-referencia proximal) detrás y justo por encima del maléolo medial (retináculo flexor).',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.84
        },
        {
          x: 33.56, y: 56.77, width: 8.16, height: 14.66, text: '', type: 'info', infoText: 'Talón.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 73.82, y: 45.60, width: 6.68, height: 9.59, text: '', type: 'info', infoText: 'RAMA LATERAL. Sobre la planta del pie, se trazan de forma imaginaria 14 cm en línea diagonal hasta el especio intermedio entre cuarto y quinto metatarsianos.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          x: 71.53, y: 28.79, width: 6.68, height: 9.59, text: '', type: 'info', infoText: 'RAMA MEDIAL. Sobre la planta del pie, se determina midiendo 10 cm con dirección distal del electrodo ACTIVO, entre el primer y segundo metatarsiano, y extendiendo 4 cm horizontalmente hasta el espacio interdigital.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 19.43
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/Plantar-T-02.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/Plantar-G-02.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ], 
      [
        {
          x: 49.00, y: 39.19, width: 8.16, height: 14.66, text: '', type: 'info', infoText: 'Dorso del pie.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 70.30, y: 58.81, width: 5.11, height: 7.77, text: '', type: 'info', infoText: 'RAMA MEDIAL CALCÁNEA. Se coloca a un tercio de la distancia desde el vértice del talón hasta el punto medio entre el escafoides y punta del maléolo medial.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.84
        },
        {
          x: 74.1, y: 63.21, width: 6.11, height: 8.77, text: '', type: 'info', infoText: 'Sobre el vértice del talon.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 78.84, y: 27.24, width: 6.68, height: 9.59, text: '', type: 'info', infoText: 'TOBILLO RETROMALEOLAR - De forma antidrómica y con intensidad submáxima a 10 cm en dirección proximal del electrodo activo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.84
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/Plantar-T-03.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/Plantar-G-03.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
    ],
  },
  'Femoral': {
    imagenes: [
      require('../../../assets/tecnicas/neurografia/femoral.png'),
      require('../../../assets/tecnicas/neurografia/femoral2.png'),
    ],
    botones: [
      [
        {
          x: 11.56, y: 36.56, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'INGUINAL. Se aplica justo debajo del ligamento inguinal y lateral a la arteria femoral.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 22.42, y: 53.89, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'Zona media lateral entre estimulo y registro.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 41.98, y: 36.27, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'RECTUS FEMORIS L2, L3, L4 - Colocar el electrodo de superficie sobre la cara anterior del muslo, a la media distancia entre el ligamento inguinal y el polo superior de la rótula. Se pueden utilizar distancias establecidas desde el ligamento inguinal en dirección distal de 14 y 30 cm.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 22.01
        },
        {
          x: 62.72, y: 45.86, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'Distal al tendón del recto femoral, cerca del borde superior de la rótula.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/Femoral-T-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/Femoral-G-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
      [
        {
          x: 7.16, y: 14.54, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'ARRIBA DEL LIGAMENTO INGUINAL. 5.5 cm con dirección proximal o cefálica con relación al estímulo por debajo del ligamento inguinal.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.84
        },
        {
          x: 14.03, y: 15.44, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'DEBAJO DEL LIGAMENTO INGUINAL. Justo debajo del ligamento inguinal y lateral a la arteria femoral.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 31.64, y: 4.22, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'Entre estimulo y registro.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 63.26, y: 41.45, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'VASTUS MEDIALIS L2, L3, L4 - Colocando el electrodo de registro en el vientre muscular con una distancia deseable desde el ligamento inguinal de 35.4 ± 1.9 cm. El punto motor se puede ubicar a 8 cm con dirección proximal del ángulo formado por los bordes superior y medial de la rótula.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 22.01
        },
        {
          x: 64.55, y: 23.35, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'VASTUS LATERALIS L2, L3, L4 - Colocando el electrodo de registro en el vientre muscular con una distancia deseable desde el ligamento inguinal de 35.4 ± 1.9 cm. El punto motor se puede ubicar a 8 cm con dirección proximal del ángulo formado por los bordes superior y lateral de la rótula.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 22.01
        },
        {
          x: 74.43, y: 42.49, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'Distal al recorrido del tendón, cerca del borde superior de la rótula con orientacion medial.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 75.14, y: 25.42, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'Distal al recorrido del tendón, cerca del borde superior de la rótula con orientacion lateral.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/Femoral-T-02.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/Femoral-G-02.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
    ],
  },
  'Safeno': {
    imagenes: [
      require('../../../assets/tecnicas/neurografia/safeno.png'),
      require('../../../assets/tecnicas/neurografia/safeno2.png'),
    ],
    botones: [
      [
        {
          x: 41.41, y: 51.30, width: 6.68, height: 10.59, text: '', type: 'info', infoText: 'Dorso del pie.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 53.55, y: 41.45, width: 4.11, height: 7.77, text: '', type: 'info', infoText: '3-4 cm distal del electrodo activo sobre borde maleolar o utilizar el electrodo fijo de barra, colocando inicialmente esta referencia en la prominencia inferior del maléolo medial.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          x: 56.97, y: 37.31, width: 4.11, height: 7.77, text: '', type: 'info', infoText: 'REGISTRO DISTAL (Tobillo medial-anterior) - Con electrodo de superficie, se coloca entre el maléolo medial y el tendón del Tibial anterior tomando como referencia el borde superior óseo del mismo maléolo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 19.42
        },
        {
          x: 74.32, y: 1.81, width: 4.11, height: 7.77, text: '', type: 'info', infoText: 'PIERNA. De forma antidrómica 12 a 14 cm proximal del electrodo activo, entre el borde medial de la tibia y el musculo Gastrocnemio medial.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 16.84
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/Safeno-T-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/Safeno-G-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
      [
        {
          x: 24.25, y: 38.16, width: 4.11, height: 7.77, text: '', type: 'info', infoText: 'RODILLA. De forma antidrómica en la cara medial de la rodilla ligeramente flexionada, colocar el cátodo con presión firme entre los tendones del Sartorio y el Grácil, tomando como referencia trasversal, aproximadamente 1 cm por encima del borde inferior de la rótula.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 20.73
        },
        {
          x: 44.05, y: 38.34, width: 4.11, height: 7.77, text: '', type: 'info', infoText: 'REGISTRO PROXIMAL (Pierna medial-anterior) - 15 cm distal desde el punto de estimulación marcado previamente, colocar el electrodo de registro entre el borde medial de la tibia y el Gastrocnemio medial.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 19.42
        },
        {
          x: 48.56, y: 38.86, width: 4.51, height: 7.77, text: '', type: 'info', infoText: '3-4 cm distal del electrodo activo pudiendo ser útil la barra de registro.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 42.50, y: 26.72, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'Borde anterior de la tibia entre el estímulo y el registro.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
                {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/Safeno-T-02.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/Safeno-G-02.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
    ],
  },
  'Femorocutáneo lateral': {
    imagenes: [
      require('../../../assets/tecnicas/neurografia/femoralcutaneolt.png'),
      require('../../../assets/tecnicas/neurografia/femoralcutaneolt2.png'),
    ],
    botones: [
      [
        {
          x: 11.29, y: 5.47, width: 5.11, height: 7.77, text: '', type: 'info', infoText: '4 cm en dirección cefálica o ascendente del electrodo activo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 16.17, y: 8.59, width: 5.11, height: 7.77, text: '', type: 'info', infoText: 'ORTODRÓMICA - Colocar electrodo de superficie a 1 cm medial de la espina iliaca anterosuperior.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 41.00, y: 20.24, width: 5.11, height: 8.77, text: '', type: 'info', infoText: 'MUSLO ANTERO-LATERAL. Aplicar la estimulación entre 12 a 16 cm distal del electrodo activo, sobre una línea tazada desde la espina iliaca anterosuperior hasta el borde lateral de la rótula.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/FemoralLt-T-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/FemoralLt-G-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
      [
        {
          x: 15.83, y: 9.18, width: 5.11, height: 8.77, text: '', type: 'info', infoText: 'EIASs. Por arriba del ligamento inguinal 1 cm medial a la espina iliaca anterosuperior.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 21.4, y: 11.73, width: 5.11, height: 8.77, text: '', type: 'info', infoText: 'EIASi. Por debajo del ligamento inguinal sobre el origen del musculo Sartorio.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 47.22, y: 20.54, width: 5.11, height: 8.77, text: '', type: 'info', infoText: 'ANTIDRÓMICA. Colocar electrodo de superficie sobre la cara anterior del muslo a 16-20 cm distal de la espina ilíaca anterosuperior, siguiendo una línea imaginaria hasta el borde lateral de la rótula.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          x: 52.64, y: 24.39, width: 5.11, height: 8.77, text: '', type: 'info', infoText: '3-4 cm distal del electrodo activo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/FemoralLt-T-02.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/FemoralLt-G-02.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
    ],
  },
  'Cutáneo femoral': {
    imagenes: [
      require('../../../assets/tecnicas/neurografia/cutaneo_femoral.png'),
      require('../../../assets/tecnicas/neurografia/cutaneo_femoral2.png'),
    ],
    botones: [
      [
        {
          x: 11.95, y: 39.12, width: 6.68, height: 9.59, text: '', type: 'info', infoText: 'INGUINAL. 4 cm debajo del ligamento inguinal, lateral a la arteria femoral con presión firme.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 23.25, y: 53.15, width: 7.07, height: 11.59, text: '', type: 'info', infoText: 'Región medial del muslo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 37.82, y: 26.46, width: 5.68, height: 9.59, text: '', type: 'info', infoText: 'RAMA MEDIAL - Trazar una línea imaginaria desde el ligamento inguinal, lateral a la arteria femoral hasta el borde medial de la rótula y colocar el electrodo de superficie en la intersección de 14 cm distal de la ingle.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          x: 44.85, y: 27.24, width: 5.68, height: 9.59, text: '', type: 'info', infoText: '3-4 cm distal del electrodo activo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/CutaneoFm-T-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/CutaneoFm-T-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
      [
        {
          x: 42.37, y: 24.17, width: 7.07, height: 11.59, text: '', type: 'info', infoText: 'Muslo lateral.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 45.25, y: 42.49, width: 6.68, height: 9.59, text: '', type: 'info', infoText: 'MUSLO POSTERIOR. De forma antidrómica a 12 cm proximal del electrodo de registro, siguiendo una línea imaginaria con dirección a la tuberosidad isquiática.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          x: 71.67, y: 51.05, width: 6.68, height: 9.59, text: '', type: 'info', infoText: 'RAMA POSTERIOR - Línea media del muslo posterior, 6 cm proximal del pliegue del hueco poplíteo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 78.29, y: 54.40, width: 5.68, height: 9.59, text: '', type: 'info', infoText: '3-4 cm distal del electrodo activo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/CutaneoFm-T-02.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/CutaneoFm-T-02.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
    ],
  },
  'Ciático': {
    imagenes: [
      require('../../../assets/tecnicas/neurografia/ciatico.png'),
      require('../../../assets/tecnicas/neurografia/ciatico2.png'),
    ],
    botones: [
      [
        {
          x: 10.88, y: 45.86, width: 5.11, height: 8.77, text: '', type: 'info', infoText: 'SACRO. Se inserta la aguja de estimulación monopolar alrededor de 1 cm medial y ligeramente caudal a la espina ilíaca postero superior, el ánodo será un electrodo de superficie colocado sobre la apófisis espinosa. Con este registro se puede determinar la conducción a través del plexo sacro, posterior a la evaluación del nervio Ciático y restando el cálculo de su latencia.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 27.23
        },
        {
          x: 24.92, y: 35.27, width: 5.11, height: 8.77, text: '', type: 'info', infoText: 'GLÚTEO. Se inserta una aguja monopolar (cátodo) de 0.75 mm en el pliegue glúteo a media distancia de la intersección entre la tuberosidad isquiática y el trocánter mayor, u horizontalmente con referencia a una línea trazada desde el vértice del hueco poplíteo. Electrodo de superficie cercano a aguja de estimulación como ánodo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 27.23
        },
        {
          x: 38.21, y: 45.93, width: 6.11, height: 8.77, text: '', type: 'info', infoText: 'Entre registro y estimulación.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 56.70, y: 39.63, width: 4.90, height: 6.99, text: '', type: 'info', infoText: 'HUECO POPLÍTEO. Con estimulador convencional de puntas, se realiza la estimulación respectiva de nervio Tibial siguiendo el trayecto a nivel medial.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          x: 54.90, y: 33.42, width: 4.90, height: 6.99, text: '', type: 'info', infoText: 'HUECO POPLÍTEO. Con estimulador convencional de puntas, se realiza la estimulación respectiva de nervio Peroneo siguiendo el trayecto a nivel lateral.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },
        {
          type: 'image', x: 700, y: 10, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/Ciatico-T-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
      ],
      [
        {
          x: 24.62, y: 34.23, width: 7.48, height: 12.36, text: '', type: 'info', infoText: 'Articulación metatarsofalángica del quinto ortejo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 36.03, y: 42.52, width: 7.48, height: 12.36, text: '', type: 'info', infoText: 'EXTENSOR DIGITORUM BREVIS L5, S1 - Región anterolateral mediotarsiana proximal, trazar una línea imaginaria desde el centro del maléolo lateral hasta la articulación metatarsofalángica del quinto ortejo y colocar electrodo de superficie en el centro del tercio proximal.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 20.73
        },
        {
          x: 66.07, y: 26.96, width: 7.48, height: 12.36, text: '', type: 'info', infoText: 'ABDUCTOR HALLUCIS S1, S2 - Colocar electrodo de superficie ligeramente proximal y por debajo de la tuberosidad navicular, aproximadamente 1 cm en ambas direcciones.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 18.13
        },  
        {
          x: 76.89, y: 48.22, width: 7.48, height: 12.36, text: '', type: 'info', infoText: 'Base del primer metatarsiano, o en la articulación metatarsofalángica.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          type: 'image', x: 700, y: 10, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/Ciatico-G-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
        {
          type: 'image', x: 150, y: 10, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/Ciatico-G-02.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
    ],
  },
  'Pudendo': {
    imagenes: [
      require('../../../assets/tecnicas/neurografia/pudendo.png'),
    ],
    botones: [
      [
        {
          x: 55.51, y: 45.08, width: 4.42, height: 6.47, text: '', type: 'info', infoText: 'ELECTRODO “ST. MARK” - Colocado ventral en el dedo índice del explorador, se realiza su introducción profunda a través del esfínter anal externo (S2-S3-S4), hasta el contacto muscular con la base del dedo que contiene incrustado el electrodo de referencia.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 19.42
        },
        {
          x: 59.30, y: 49.22, width: 4.42, height: 6.47, text: '', type: 'info', infoText: 'ELECTRODO “ST. MARK” - Colocado ventral en el dedo índice del explorador, se realiza su introducción profunda a través del esfínter anal externo (S2-S3-S4), hasta el contacto muscular con la base del dedo que contiene incrustado el electrodo de captación.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 19.42
        },
        {
          x: 63.86, y: 35.75, width: 4.42, height: 6.47, text: '', type: 'info', infoText: 'ELECTRODO “ST. MARK”. Con la punta del dedo índice y direccionando con una leve rotación hacia izquierda o derecha (30 a 45°) dependiendo del lado a evaluar, con una palpación delicada se buscará una protuberancia de consistencia firme que corresponde a la espina isquiática.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 19.42
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/Pudendo-T-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/Pudendo-G-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
    ],
  },
  'Dorsal del pene': {
    imagenes: [
      require('../../../assets/tecnicas/neurografia/dorsal_del_pene.png'),
    ],
    botones: [
      [
        {
          x: 29.96, y: 4.0, width: 6.11, height: 9.77, text: '', type: 'info', infoText: 'Sínfisis del pubis.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 55.79, y: 0, width: 5.11, height: 7.77, text: '', type: 'info', infoText: 'Colocar en la base del pene antes de la colocación del electrodo activo.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 59.74, y: 4.70, width: 5.11, height: 8.77, text: '', type: 'info', infoText: 'DORSO DEL PENE (antidromico) - 1-2 cm distal del electrodo de referencia.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 15.54
        },
        {
          x: 72.78, y: 30.09, width: 5.11, height: 8.77, text: '', type: 'info', infoText: 'ESTIMULADOR DE ANILLO. Colocar el cátodo en el cuello del glande.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          x: 77.60, y: 40.45, width: 5.11, height: 8.77, text: '', type: 'info', infoText: 'ESTIMULADOR DE ANILLO. Colocar el ánodo justo en la mitad del glande.',
          infoBoxX: 12, infoBoxY: 1, infoBoxWidth: 54.79, infoBoxHeight: 12.95
        },
        {
          type: 'image', x: 90, y: 2, width: 9, height: 15, text: '',imageSource: require('../../../assets/tecnicas/Info/DorsalP-T-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGTabla, },
        {
          type: 'image', x: 100, y: 2, width: 9, height: 15, text: '', imageSource: require('../../../assets/tecnicas/Info/DorsalP-G-01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 85, buttonImageSource: IMGGrafica, },
      ],
    ],
  },
};

// const { width, height } = useWindowDimensions();

function NeurografiaScreen(): React.JSX.Element {
  const { width, height } = useWindowDimensions();

  const [menuVisible, setMenuVisible] = useState(true);
  const [menuAbierto, setMenuAbierto] = useState<Record<string, boolean>>({});
  const [busqueda, setBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState<string[]>([]);
  const [inputLayout, setInputLayout] = useState({ x: 0, y: 0, width: 0 });
  const [opcionSeleccionada, setOpcionSeleccionada] = useState<string | null>(null);

  const toggleMenu = () => setMenuVisible(!menuVisible);

  const menuStyle = {
    ...styles.menu, // Copiamos los estilos estáticos
    height: height * 0.72, // Aplicamos la altura dinámica
    width: width * 0.50, // Aplicamos el ancho dinámico
  };

  const toggleCategoria = (categoria: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  
    // El nuevo estado depende del estado anterior
    setMenuAbierto((prev) => {
      // Si la categoría que se hizo clic ya estaba abierta, la cerramos
      if (prev[categoria]) {
        return { ...prev, [categoria]: false };
      } 
      // Si no estaba abierta, la abrimos y nos aseguramos de que las demás estén cerradas
      else {
        // Creamos un nuevo objeto de estado con todas las categorías en 'false'
        const nuevoEstado: Record<string, boolean> = {};
        categorias.forEach(c => nuevoEstado[c.nombre] = false);

        // Ahora, establecemos la categoría actual en 'true'
        return { ...nuevoEstado, [categoria]: true };
      }
    });
  };

  useEffect(() => {
    Orientation.lockToLandscape();
    return () => Orientation.unlockAllOrientations();
  }, []);

  useEffect(() => {
    const todas = categorias.flatMap((c) => c.subcategorias);
    const filtradas = todas.filter((item) =>
      item.toLowerCase().includes(busqueda.toLowerCase())
    );
    setSugerencias(busqueda.length > 0 ? filtradas : []);
  }, [busqueda]);

  const [currentIndex, setCurrentIndex] = useState(0);

  // useEffect que se ejecuta cada vez que 'opcionSeleccionada' cambia
  useEffect(() => {
    // Al detectar un cambio en la opción, se establece el índice en 0.
    // Esto asegura que siempre se muestre la primera imagen.
    setCurrentIndex(0); 
  }, [opcionSeleccionada]);

  const handleSeleccionarOpcion = (opcion: string) => {
    setOpcionSeleccionada(opcion);
    setMenuVisible(false); // Oculta el menú al seleccionar
    setBusqueda(''); // Limpia la búsqueda
  };

  return (
    <View style={styles.container}>
      {/* <View style={styles.header}>
        <Text style={styles.tituloText}>Neurografía</Text>

      </View> */}

      {menuVisible && (
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}

      {menuVisible && (
        <View style={styles.menuContainer}>
          <ScrollView style={menuStyle}>
            <View style={styles.searchRow}>
              <Text style={styles.tituloText}>Neurografía</Text>
              <TextInput
                value={busqueda}
                onChangeText={setBusqueda}
                placeholder="Buscar..."
                placeholderTextColor="#999"
                style={styles.buscador}
                onLayout={(event) => {
                  const { x, y, width } = event.nativeEvent.layout;
                  setInputLayout({ x, y, width });
                }}
              />
            </View>

            {/* Contenedor de sugerencias independiente */}
            {sugerencias.length > 0 && (
              <View
                style={[
                  styles.sugerenciasContainer,
                  {
                    top: inputLayout.y + 35,
                    left: inputLayout.x,
                    width: inputLayout.width,
                  },
                ]}
              >
                <ScrollView
                  style={styles.sugerenciasScroll}
                  keyboardShouldPersistTaps="handled"
                  scrollEnabled
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.sugerenciasContent}
                  nestedScrollEnabled={true}
                  pointerEvents="auto"
                >
                  {sugerencias.map((sug, index) => (
                    <TouchableOpacity key={index} onPress={() => handleSeleccionarOpcion(sug)}>
                      <Text
                        style={[
                          styles.sugerencia,
                          opcionSeleccionada === sug && styles.sugerenciaSeleccionada,
                        ]}
                      >
                        {sug}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {categorias.map((categoria, index) => (
              <View key={index}>
                <TouchableOpacity
                  style={[
                    styles.categoria,
                    menuAbierto[categoria.nombre] && styles.categoriaSeleccionada,
                  ]}
                  onPress={() => toggleCategoria(categoria.nombre)}
                >
                  <Text style={styles.categoriaTexto}>
                    {menuAbierto[categoria.nombre] ? '▽' : '▷'} {categoria.nombre}
                  </Text>
                </TouchableOpacity>

                {menuAbierto[categoria.nombre] && (
                  <View style={styles.subcategoriaContainer}>
                    {categoria.subcategorias.length > 0 ? (
                      categoria.subcategorias.map((sub, idx) => (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => handleSeleccionarOpcion(sub)}
                        >
                          <Text
                            style={[
                              styles.subcategoria,
                              opcionSeleccionada === sub &&
                                styles.subcategoriaSeleccionada, // 👈 Nuevo estilo aplicado
                            ]}
                          >
                            ● {sub}
                          </Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.subcategoriaVacia}>Sin información</Text>
                    )}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.imageContainer}>
        <View style={styles.imageContainer}>
          {opcionSeleccionada && contenidoPorOpcion[opcionSeleccionada] && (
            <GaleriaT
              data={contenidoPorOpcion[opcionSeleccionada]}
              opcionSeleccionada={opcionSeleccionada}
              toggleMenu={toggleMenu}
              menuVisible={menuVisible}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

export default NeurografiaScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#222',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  tituloText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Quando-Regular',
  },
  // menuButton: {
  //   padding: 10,
  //   borderRadius: 5,
  //   backgroundColor: '#444',
  // },
  // menuText: {
  //   color: 'white',
  //   fontSize: 12,
  // },
  menuContainer: {
    position: 'absolute',
    top: 60,
    left: 10,
    width: '100%',
    zIndex: 10,
  },
  menu: {
    backgroundColor: '#000',
    paddingVertical: 10,
    paddingHorizontal: 15,
    maxWidth: '70%',
    //height: height * 0.7, // Usamos la altura del hook
    //width: width * 0.40, // Usamos el ancho del hook
    //height: Dimensions.get('window').height * 0.7, //Dimensions.get('window').height * 0.7,
    //width: Dimensions.get('window').width * 0.40, //Dimensions.get('window').width * 0.70,
    borderRadius: 20,
    borderColor: 'orange',
    borderWidth: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 75,
  },
  buscador: {
    backgroundColor: '#111',
    color: 'white',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#888',
    fontSize: 14,
    flex: 0.9,
    fontFamily: 'LuxoraGrotesk-Light',
  },
  sugerenciasContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(34, 34, 34, 0.9)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'orange',
    zIndex: 20,
    padding: 8,
    maxHeight: 200,
  },
  sugerenciasScroll: {
    maxHeight: 200,
  },
  sugerenciasContent: {
    paddingVertical: 8,
  },
  sugerencia: {
    color: 'white',
    fontSize: 14,
    paddingVertical: 4,
    fontFamily: 'LuxoraGrotesk-Light',
  },
  sugerenciaSeleccionada: {
    backgroundColor: 'rgba(196, 73, 0, 0.3)',
    borderRadius: 6,
  },
  categoria: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    borderRadius: 10,
    marginBottom: 5,
  },
  categoriaSeleccionada: {
    backgroundColor: 'orange',
  },
  categoriaTexto: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'LuxoraGrotesk-Heavy',
  },
  subcategoriaContainer: {
    paddingLeft: 15,
    paddingVertical: 5,
    marginBottom: 15,
  },
  subcategoria: {
    color: '#ddd',
    fontSize: 16,
    paddingVertical: 4,
    fontFamily: 'LuxoraGrotesk-Light',
  },
  subcategoriaSeleccionada: {
    //backgroundColor: 'rgba(255, 140, 0, 0.3)',
    borderRadius: 6,
    color: '#eb9800ff',
  },
  subcategoriaVacia: {
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic',
  },
  imageContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    height: '100%',
    width: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});