import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TouchableWithoutFeedback, LayoutAnimation, UIManager, Dimensions, TextInput, KeyboardAvoidingView, useWindowDimensions    } from 'react-native';
import Orientation from 'react-native-orientation-locker';
import GaleriaP from './GaleriaPt';

  UIManager.setLayoutAnimationEnabledExperimental &&
  UIManager.setLayoutAnimationEnabledExperimental(true);

// --- Definición de tipos para los botones y datos de la galería ---
type InfoButtonDataP = {
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
  infoImage?: any[] | any; // Nueva propiedad para mostrar imagen en el cuadro
};

type ImageButtonDataP = {
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
  popupText?: string;
  popupTextX?: number;
  popupTextY?: number;
  popupTextWidth?: number;
  popupTextHeight?: number;
  infoImage?: any[];
};

type ImgButton = {
  type: 'ImgBtn';
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
  infoImage: any[];
  buttonImageSource: any;
};

type TxtButtonImg = {
  type: 'TxtButtonImg';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text: string;
  infoText: string;
  infoImage: any[];
  infoBoxX?: number;
  infoBoxY?: number;
  infoBoxWidth?: number;
  infoBoxHeight?: number;
  rotateDeg?: number;
  buttonImageSource: any;
};

type ButtonData = InfoButtonDataP | ImageButtonDataP | ImgButton | TxtButtonImg;

type GalleryContent = {
  imagenes: any[];
  botones: ButtonData[][]; // Array de arrays de ButtonData, uno por cada imagen
};

// --- Datos de categorías y subcategorías (sin cambios en esta sección) ---
const categorias: { nombre: string; subcategorias: string[] }[] = [
  {
    nombre: 'Somatosensoriales',
    subcategorias: [
        "Miembros Superiores",
        "Nervio Mediano (fibras mixtas)",
        "Nervio Mediano (fibras sensitivas)",
        "Nervios Ulnar (fibras mixtas)",
        "Nervios Ulnar (fibras sensitivas)",
        "Radial Superficial",
        "Antebraquial cutáneo lateral",
        "Miembros Inferiores",
        "Nervio Tibial",
        "Nervio Tibial proximal",
        "Nervio Peroneo",
        "Femorocutáneo lateral",
        "Segmentarios",
        "Plantares",
        "Dermatomas cervicales",
        "Dermatomas torácicos",
        "Dermatomas lumbosacros",
        "Nervios Trigéminos",
        "Pudendos",
    ],
  },
  {
    nombre: 'Motores',
    subcategorias: [
        "Miembros superiores",
        "Miembros inferiores",
        "Triple respuesta", 
    ],
  },
  {
    nombre: 'Visuales',
    subcategorias: [
        "Campo total",
        "Hemicampos",
        "Cuadrantes",
        "Goggles Led",
    ],
  },
  {
    nombre: 'Auditivos',
    subcategorias: [
        "Tallo cerebral", 
        "Curva latencia intensidad",
      
    ],
  },
];
const IMGTabla = require('../../../assets/tecnicas/Info/I_Tabla_Gris.png');
const IMGGrafica = require('../../../assets/tecnicas/Info/mEDX_64_Valores.png');
const Estimulo = require('../../../assets/Potenciales/Estimulo.png');
const Sistema = require('../../../assets/Potenciales/Sistema.png');
const Registro = require('../../../assets/Potenciales/Registro.png');
// --- Mapeo de opciones a sus imágenes y nuevos datos de botones con propiedades de infoBox ---
// NOTA: Ajusta todas las coordenadas (x, y) y los tamaños (width, height) de los botones,
// así como el contenido de 'infoText' y las nuevas propiedades 'infoBoxX', 'infoBoxY',
// 'infoBoxWidth', 'infoBoxHeight' según tus necesidades.
// Si no defines infoBoxX/Y/Width/Height, se usarán los valores por defecto del estilo.
const contenidoPorOpcion: Record<string, GalleryContent> = {

  'Miembros Superiores': {
    imagenes: [
      require('../../../assets/Potenciales/Somt/SuperBs.png'),
    ],
    botones: [
      // Botones para Abductor_Corto_Pulgar.png (Índice 0) infoImage: require('../../../assets/tecnicas/Info/MedianoMt-T-01.png')
      [
        {
          x: 2, y: 18, width: 20, height: 10, text: 'C3’-Fpz’', type: 'info',infoText: 'Registro referenciado; electrodo activo en C3’ contralateral al estimulo (2 cm posterior a C3), referenciado a Fpz’ (12 cm arriba del inion).',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 58, infoBoxHeight: 15, infoImage: require('../../../assets/Potenciales/Somt/SupCanal1.png'),},
        {
          x: 2, y: 30, width: 20, height: 10, text: 'C3’-C4’', type: 'info',infoText: 'Registro bipolar C3’ activo con su referencia longitudinal contralateral C4’. Puede mejorar la amplitud y morfología de las respuestas corticales con relación al montaje referencial, pero es más susceptible a contaminación por ruido de fondo.',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 58, infoBoxHeight: 15, infoImage: require('../../../assets/Potenciales/Somt/SupCanal2.png'),},
        {
          x: 2, y: 42, width: 20, height: 10, text: 'C3’-Erb L', type: 'info',infoText: 'Registro de campo lejano colocando el electrodo activo craneal C3’ y referencia extracefálica en punto de Erb contralateral; se puede optar por el montaje Fpz’ referenciado a Erb ipsilateral, ambos con alta tendencia a contaminación por ruido de fondo.',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 59, infoBoxHeight: 19, infoImage: require('../../../assets/Potenciales/Somt/SupCanal3.png'),},
        {
          x: 2, y: 54, width: 20, height: 10, text: 'C5s-Fpz’', type: 'info',infoText: 'Colocar activo sobre apófisis espinosa cervical C5 o C2, ubicadas por su relación cercana a vertebra C7 (más prominente) y referenciado a Fpz’.',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 58, infoBoxHeight: 15, infoImage: require('../../../assets/Potenciales/Somt/SupCanal4.png'),},
        {
          x: 2, y: 66, width: 20, height: 10, text: 'Erb R-Erb L ', type: 'info',infoText: 'Punto de Erb ipsilateral al estimulo, 2-3 cm por arriba de la clavícula e intersección en el borde posterior del musculo ECM.',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 58, infoBoxHeight: 15, infoImage: require('../../../assets/Potenciales/Somt/SupCanal5.png'),},
        {
          x: 2, y: 78, width: 20, height: 10, text: 'FaC R', type: 'info',infoText: 'Fosa antecubital, a nivel del pulso de la arteria radial, referenciado a epicóndilo medial.',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 57, infoBoxHeight: 15, infoImage: require('../../../assets/Potenciales/Somt/SupCanal6.png'),},
        {
          type: 'image', x: 73, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/Sup-10-20.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Sistema,
        },
        {
          type: 'image', x: 89, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/Superiores-T01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 100, popupImageHeight: 100, buttonImageSource: IMGTabla,
        },
        {
          type: 'image', x: 81, y: 2, width: 7, height: 15, text: '', imageSource: require('../../../assets/Potenciales/Somt/SupEstimulo.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Estimulo  , 
          popupTextX: 1, popupTextY: 25, popupTextWidth: 30, popupTextHeight: 50, popupText: 'Nervio Mediano derecho, fibras mixtas a nivel del carpo. \n\nIntensidad, incremento progresivo hasta obtener una leve contracción visible en el pulgar y/o índice. \n\n Frecuencia a 4 a 7 Hz. \n\n Duración 0.2-0.3 ms.' , 
        },
        {
          x: 97, y: 2, width: 7, height: 15, text: '', type: 'ImgBtn',infoText: '',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, buttonImageSource: IMGGrafica, 
          infoImage: [
            require('../../../assets/Potenciales/Somt/SupCanal1.png'),
            require('../../../assets/Potenciales/Somt/SupCanal2.png'),
            require('../../../assets/Potenciales/Somt/SupCanal3.png'),
            require('../../../assets/Potenciales/Somt/SupCanal4.png'),
            require('../../../assets/Potenciales/Somt/SupCanal5.png'),
            require('../../../assets/Potenciales/Somt/SupCanal6.png'),
          ]},
      ],

    ],
  },
  'Nervio Mediano (fibras mixtas)': {
    imagenes: [
      require('../../../assets/Potenciales/Mediano01.png'),
    ],
    botones: [
      [
        {
          x: 2, y: 23, width: 20, height: 10, text: 'C4’-Fpz', type: 'info',infoText: 'Cortical N20-P22, electrodo activo contralateral al estímulo C3’ (C4’) 2 cm posterior a C3 (C4) con referencia en Fpz’.',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/MedMxCanal1.png'),},
        {
          x: 2, y: 43, width: 20, height: 10, text: 'C5s-Fpz', type: 'info',infoText: 'Cervical N11-N13, electrodo activo sobre apófisis espinosa de vertebra cervical C5s con referencia a Fpz’. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/MedMxCanal2.png'),},
        {
          x: 2, y: 63, width: 20, height: 10, text: 'ErbL-ErbR ', type: 'info',infoText: 'Erb N9.  Ipsilateral al estimulo, 2-3 cm por arriba de la clavícula e intersección en el borde posterior del musculo ECM. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/MedMxCanal3.png'),},
        
        {
          type: 'image', x: 73, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/Sup-10-20.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Sistema,
        },
        {
          type: 'image', x: 89, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/MedMx-T01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: IMGTabla,
        },
        {
          type: 'image', x: 81, y: 2, width: 7, height: 15, text: '', imageSource: require('../../../assets/Potenciales/Somt/MedMxEstimulo.png'), 
          popupImageX: 50, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Estimulo  , 
          popupTextX: 1, popupTextY: 10, popupTextWidth: 28, popupTextHeight: 70, popupText: 'Estimulo. Nervio Mediano fibras mixtas, con electrodos de superficie colocar el cátodo en dirección proximal a nivel del carpo entre los tendones del palmar mayor y palmar menor, ánodo 2-3 cm distal. Una forma práctica de colocación con electrodo de barra es ubicar el ánodo sobre pliegue de la muñeca y al cátodo proximal a esta referencia.'+
          '\n\nIntensidad. Incremento progresivo hasta obtener una leve contracción visible en el pulgar y/o índice. \n\nTierra. Antebrazo (otros autores prefieren a nivel de Cz).' , 
        },
        {
          x: 97, y: 2, width: 7, height: 15, text: '', type: 'ImgBtn',infoText: '',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, buttonImageSource: IMGGrafica, 
          infoImage: [
            require('../../../assets/Potenciales/Somt/MedMxCanal1.png'),
            require('../../../assets/Potenciales/Somt/MedMxCanal2.png'),
            require('../../../assets/Potenciales/Somt/MedMxCanal3.png'),
          ]},
      ],
    ],
  },
  'Nervio Mediano (fibras sensitivas)': {
    imagenes: [
      require('../../../assets/Potenciales/Mediano01.png'),

    ],
    botones: [
      [
                  {
          x: 2, y: 23, width: 20, height: 10, text: 'C4’-Fpz', type: 'info',infoText: 'Cortical N20-P22, electrodo activo contralateral al estímulo C3’ (C4’) 2 cm posterior a C3 (C4) con referencia en Fpz’. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/MedSnCanal1.png'),},
        {
          x: 2, y: 43, width: 20, height: 10, text: 'C5s-Fpz', type: 'info',infoText: 'Cervical N11-N13, electrodo activo sobre apófisis espinosa de vertebra cervical C5s con referencia a Fpz’. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/MedSnCanal2.png'),},
        {
          x: 2, y: 63, width: 20, height: 10, text: 'ErbL-ErbR', type: 'info',infoText: 'Erb N9.  Ipsilateral al estimulo, 2-3 cm por arriba de la clavícula e intersección en el borde posterior del musculo ECM. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/MedSnCanal3.png'),},
        
        {
          type: 'image', x: 73, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/Sup-10-20.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Sistema,
        },
        {
          type: 'image', x: 89, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Mediano-T01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: IMGTabla,
        },
        {
          type: 'image', x: 81, y: 2, width: 7, height: 15, text: '', imageSource: require('../../../assets/Potenciales/Somt/MedSnEstimulo.png'), 
          popupImageX: 20, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Estimulo  , 
          popupTextX: 1, popupTextY: 10, popupTextWidth: 26, popupTextHeight: 60, popupText: 'Estimulo. Nervio Mediano fibras sensoriales mediante electrodos de anillo sobre el tercer dedo con el cátodo en dirección proximal cercana al pliegue metacarpofalángico, ánodo 3-4 cm distal (también es posible la colocación de los anillos en dedos índice y medio).'+
          '\n\nIntensidad. El triple o 2.5 veces por arriba del umbral sensitivo percibido por el paciente. \n\nTierra. Antebrazo (otros autores prefieren a nivel de Cz.' , 
        },
        {
          x: 97, y: 2, width: 7, height: 15, text: '', type: 'ImgBtn',infoText: '',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, buttonImageSource: IMGGrafica, 
          infoImage: [
            require('../../../assets/Potenciales/Somt/MedSnCanal1.png'),
            require('../../../assets/Potenciales/Somt/MedSnCanal2.png'),
            require('../../../assets/Potenciales/Somt/MedSnCanal3.png'),
          ]},
      ],
      
    ],
  },
  'Nervios Ulnar (fibras mixtas)': {
    imagenes: [
      require('../../../assets/Potenciales/Mediano01.png'),

    ],
    botones: [
      [
        {
          x: 2, y: 25, width: 20, height: 10, text: 'C4’-Fpz', type: 'info',infoText: 'Cortical N20-P22, electrodo activo contralateral al estímulo C3’ (C4’) 2 cm posterior a C3 (C4) con referencia en Fpz’. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/UlCanal1.png'),},
        {
          x: 2, y: 45, width: 20, height: 10, text: 'C5s-Fpz', type: 'info',infoText: 'Cervical N11-N13, electrodo activo sobre apófisis espinosa de vertebra cervical C5s con referencia a Fpz’. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/UlCanal2.png'),},
        {
          x: 2, y: 65, width: 20, height: 10, text: 'ErbL-ErbR', type: 'info',infoText: 'Erb N9.  Ipsilateral al estimulo, 2-3 cm por arriba de la clavícula e intersección en el borde posterior del musculo ECM. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/UlCanal3.png'),},

        {
          type: 'image', x: 73, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/Sup-10-20.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Sistema,
        },
        {
          type: 'image', x: 89, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/Ulnar-T01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: IMGTabla,
        },
        {
          type: 'image', x: 81, y: 2, width: 7, height: 15, text: '', imageSource: require('../../../assets/Potenciales/Somt/UlEstimulo.png'), 
          popupImageX: 50, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Estimulo  , 
          popupTextX: 1, popupTextY: 10, popupTextWidth: 28, popupTextHeight: 60, popupText: 'Estimulo. Nervio Ulnar fibras mixtas, con electrodos de superficie colocando el cátodo en dirección proximal a nivel del carpo, medial y adyacente al tendón cubital anterior, ánodo 2-3 cm distal. Es de utilidad ajustar un electrodo de barra con el ánodo en el pliegue de la muñeca y cátodo proximal a esta referencia.'+
          '\n\nIntensidad. incremento progresivo hasta obtener una leve contracción visible en el quinto y/o cuarto dedos. \n\nTierra. Antebrazo (otros autores prefieren a nivel de Cz).' , 
        },
        {
          x: 97, y: 2, width: 7, height: 15, text: '', type: 'ImgBtn',infoText: '',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, buttonImageSource: IMGGrafica, 
          infoImage: [
            require('../../../assets/Potenciales/Somt/UlCanal1.png'),
            require('../../../assets/Potenciales/Somt/UlCanal2.png'),
            require('../../../assets/Potenciales/Somt/UlCanal3.png'),
          ]},
      ],
      
    ],
  },
  'Nervios Ulnar (fibras sensitivas)': {
    imagenes: [
      require('../../../assets/Potenciales/Mediano01.png'),
    ],
    botones: [
      [
        {
          x: 2, y: 25, width: 20, height: 10, text: 'C4’-Fpz', type: 'info',infoText: 'Cortical N20-P22, electrodo activo contralateral al estímulo C3’ (C4’) 2 cm posterior a C3 (C4) con referencia en Fpz’. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/UlStCanal1.png'),},
        {
          x: 2, y: 45, width: 20, height: 10, text: 'C5s-Fp', type: 'info',infoText: 'Cervical N11-N13, electrodo activo sobre apófisis espinosa de vertebra cervical C5s con referencia a Fpz’. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/UlStCanal2.png'),},
        {
          x: 2, y: 65, width: 20, height: 10, text: 'ErbL-ErbR', type: 'info',infoText: 'Erb N9.  Ipsilateral al estimulo, 2-3 cm por arriba de la clavícula e intersección en el borde posterior del musculo ECM. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/UlStCanal3.png'),},

        {
          type: 'image', x: 73, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/Sup-10-20.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Sistema,
        },
        {
          type: 'image', x: 89, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/UlnarSt-T01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: IMGTabla,
        },
        {
          type: 'image', x: 81, y: 2, width: 7, height: 15, text: '', imageSource: require('../../../assets/Potenciales/Somt/UlStEstimulo.png'), 
          popupImageX: 20, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Estimulo  , 
          popupTextX: 1, popupTextY: 10, popupTextWidth: 28, popupTextHeight: 60, popupText: 'Estimulo. Nervio UlnarSt fibras mixtas, con electrodos de superficie colocando el cátodo en dirección proximal a nivel del carpo, medial y adyacente al tendón cubital anterior, ánodo 2-3 cm distal. Es de utilidad ajustar un electrodo de barra con el ánodo en el pliegue de la muñeca y cátodo proximal a esta referencia. '+
          '\n\nIntensidad. incremento progresivo hasta obtener una leve contracción visible en el quinto y/o cuarto dedos. \n\nTierra. Antebrazo (otros autores prefieren a nivel de Cz).' , 
        },
        {
          x: 97, y: 2, width: 7, height: 15, text: '', type: 'ImgBtn',infoText: '',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, buttonImageSource: IMGGrafica, 
          infoImage: [
            require('../../../assets/Potenciales/Somt/UlStCanal1.png'),
            require('../../../assets/Potenciales/Somt/UlStCanal2.png'),
            require('../../../assets/Potenciales/Somt/UlStCanal3.png'),
          ]},
      ],
      
    ],
  },
  'Radial Superficial': {
    imagenes: [
      require('../../../assets/Potenciales/Mediano01.png'),
    ],
    botones: [
      [
        {
          x: 2, y: 25, width: 20, height: 10, text: 'C4’-Fpz', type: 'info',infoText: 'Cortical N20-P22, electrodo activo contralateral al estímulo C3’ (C4’) 2 cm posterior a C3 (C4) con referencia en Fpz’. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/RadCanal1.png'),},
        {
          x: 2, y: 45, width: 20, height: 10, text: 'C5s-Fpz ', type: 'info',infoText: 'Cervical N11-N13, electrodo activo sobre apófisis espinosa de vertebra cervical C5s con referencia a Fpz’. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/RadCanal2.png'),},
        {
          x: 2, y: 65, width: 20, height: 10, text: 'ErbL-ErbR', type: 'info',infoText: 'Erb N9.  Ipsilateral al estimulo, 2-3 cm por arriba de la clavícula e intersección en el borde posterior del musculo ECM. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/RadCanal3.png'),},

        {
          type: 'image', x: 73, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/Sup-10-20.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Sistema,
        },
        {
          type: 'image', x: 89, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/Radial-T01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: IMGTabla,
        },
        {
          type: 'image', x: 81, y: 2, width: 7, height: 15, text: '', imageSource: require('../../../assets/Potenciales/Somt/RadEstimulo.png'), 
          popupImageX: 20, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Estimulo  , 
          popupTextX: 1, popupTextY: 10, popupTextWidth: 28, popupTextHeight: 60, popupText: 'Estimulo. Nervio Radial superficial mediante electrodos de barra sobre el borde dorsolateral de la muñeca, 2 cm proximal a la apófisis estiloides radial; ánodo 3 cm distalmente. '+
          '\n\nIntensidad.  El triple o 2.5 veces por arriba del umbral sensitivo percibido por el paciente. \n\nTierra. Antebrazo (otros autores prefieren a nivel de Cz).' , 
        },
        {
          x: 97, y: 2, width: 7, height: 15, text: '', type: 'ImgBtn',infoText: '',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, buttonImageSource: IMGGrafica, 
          infoImage: [
            require('../../../assets/Potenciales/Somt/RadCanal1.png'),
            require('../../../assets/Potenciales/Somt/RadCanal2.png'),
            require('../../../assets/Potenciales/Somt/RadCanal3.png'),
          ]},
      ],
    ],
  },
  'Antebraquial cutáneo lateral': {
    imagenes: [
      require('../../../assets/Potenciales/Mediano01.png'),
    ],
    botones: [
      [
        {
          x: 2, y: 25, width: 20, height: 10, text: 'C4’-Fpz', type: 'info',infoText: 'Cortical N20-P22, electrodo activo contralateral al estímulo C3’ (C4’) 2 cm posterior a C3 (C4) con referencia en Fpz’. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Canal1.png'),},
        {
          x: 2, y: 45, width: 20, height: 10, text: 'C5s-Fpz', type: 'info',infoText: 'Cervical N11-N13, electrodo activo sobre apófisis espinosa de vertebra cervical C5s con referencia a Fpz’. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Canal2.png'),},
        {
          x: 2, y: 65, width: 20, height: 10, text: 'ErbL-ErbR', type: 'info',infoText: 'Erb N9.  Ipsilateral al estimulo, 2-3 cm por arriba de la clavícula e intersección en el borde posterior del musculo ECM. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Canal3.png'),},

        {
          type: 'image', x: 73, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/Sup-10-20.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Sistema,
        },
        {
          type: 'image', x: 89, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/Antebr-T01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: IMGTabla,
        },
        {
          type: 'image', x: 81, y: 2, width: 7, height: 15, text: '', imageSource: require('../../../assets/Potenciales/Somt/ESTIMULOIMG.png'), 
          popupImageX: 40, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Estimulo, 
          popupTextX: 1, popupTextY: 10, popupTextWidth: 28, popupTextHeight: 60, popupText: 'Estimulo. Nervio Cutáneo antebraquial lateral en el codo, 2 cm lateral al tendón del bíceps braquial con el ánodo distal al cátodo. '+
          '\n\nIntensidad.  El triple o 2.5 veces por arriba del umbral sensitivo percibido por el paciente.   \n\nTierra. Antebrazo (otros autores prefieren a nivel de Cz).' , 
        },
        {
          x: 97, y: 2, width: 7, height: 15, text: '', type: 'ImgBtn',infoText: '',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, buttonImageSource: IMGGrafica, 
          infoImage: [
            require('../../../assets/Potenciales/Canal1.png'),
            require('../../../assets/Potenciales/Canal2.png'),
            require('../../../assets/Potenciales/Canal3.png'),
          ]},
      ],
    ],
  },
  'Miembros Inferiores': {
    imagenes: [
      require('../../../assets/Potenciales/Somt/InferiorBs.png'),
    ],
    botones: [
      [
        {
          x: 2, y: 16, width: 20, height: 10, text: 'Cz’-Fpz’', type: 'info',infoText: 'Sobre región media del cráneo, 2 cm detrás del vértice Cz (Cz’) con referencia frontal a Fpz’. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 15, infoImage: require('../../../assets/Potenciales/Somt/InfeCanal1.png'),},
        {
          x: 2, y: 28, width: 20, height: 10, text: 'C1’-C2’', type: 'info',infoText: 'Registro bipolar C1’ activo con su referencia longitudinal contralateral C2’. Puede mejorar la amplitud y morfología de las respuestas corticales con relación al montaje referencial, pero más susceptible a contaminación por ruido de fondo muscular. Es común en miembros pélvicos la lateralización paradójica. ',
          infoBoxX: 6, infoBoxY: 1, infoBoxWidth: 60, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/InfeCanal2.png'),},
        {
          x: 2, y: 40, width: 20, height: 10, text: 'C5s-Fpz’ ', type: 'info',infoText: 'Registro de campo lejano colocando el electrodo activo en la apófisis espinosa de la quinta vertebra cervical (5Cs) y referenciado a Fpz’. Se puede optar por la colocación en M1 como en la monitorización intraoperatoria. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 15, infoImage: require('../../../assets/Potenciales/Somt/InfeCanal3.png'),},
        {
          x: 2, y: 52, width: 20, height: 10, text: 'L1s-EIAS', type: 'info',infoText: 'Apófisis espinosa L1 referenciada a espina iliaca anterosuperior para ampliar el campo de registro. Se puede modificar el montaje hacia niveles torácicos (T12s, T6s, etc). ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 60, infoBoxHeight: 15, infoImage: require('../../../assets/Potenciales/Somt/InfeCanal4.png'),},
        {
          x: 2, y: 64, width: 20, height: 10, text: 'L4s-L1s ', type: 'info',infoText: 'Electrodo activo sobre apófisis espinosa L4 (L4s) localizada un nivel por arriba de la línea que une las crestas iliacas (división L4-L5). Referenciado a L1s, 5 cm en dirección ascendente. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 15, infoImage: require('../../../assets/Potenciales/Somt/InfeCanal5.png'),},
        {
          x: 2, y: 76, width: 20, height: 10, text: 'Hpi-Hpc ', type: 'info',infoText: 'Hueco poplíteo, electrodo activo discretamente lateral a la línea media 2 cm proximal al pliegue cutáneo, referenciado a cara medial línea interarticular de la rodilla ipsilateral. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 15, infoImage: require('../../../assets/Potenciales/Somt/InfeCanal6.png'),},

        {
          type: 'image', x: 73, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/Peroneo-10-20.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Sistema,
        },
        {
          type: 'image', x: 89, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/Inferior-T01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: IMGTabla,
        },
        {
          type: 'image', x: 81, y: 2, width: 7, height: 15, text: '', imageSource: require('../../../assets/Potenciales/Somt/InfEstimulo.png'), 
          popupImageX: 20, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Estimulo  , 
          popupTextX: 1, popupTextY: 10, popupTextWidth: 30, popupTextHeight: 60, popupText: 'Nervio Tibial derecho, fibras mixtas a nivel del tobillo. \n\nEl nervio Tibial representa el estándar de estimulación en miembros inferiores por la alta tasa de registros exitosos en todos los relevos. '+
          '\n\nIntensidad, incremento progresivo hasta obtener una leve contracción visible en el primer y/o quinto ortejos. \n\nFrecuencia a 2 a 5 Hz. \n\nDuración 0.2-0.3 ms.' , 
        },
        {
          x: 97, y: 2, width: 7, height: 15, text: '', type: 'ImgBtn',infoText: '',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, buttonImageSource: IMGGrafica, 
          infoImage: [
            require('../../../assets/Potenciales/Somt/InfeCanal1.png'),
            require('../../../assets/Potenciales/Somt/InfeCanal2.png'),
            require('../../../assets/Potenciales/Somt/InfeCanal3.png'),
            require('../../../assets/Potenciales/Somt/InfeCanal4.png'),
            require('../../../assets/Potenciales/Somt/InfeCanal5.png'),
            require('../../../assets/Potenciales/Somt/InfeCanal6.png'),
          ]},
      ],
    ],
  },
  'Nervio Tibial': {
    imagenes: [
      require('../../../assets/Potenciales/Somt/TibialBs.png'),
    ],
    botones: [
      [
        {
          x: 2, y: 25, width: 20, height: 10, text: 'Cz’-Fpz´', type: 'info',infoText: 'Cortical P37-N45, electrodo activo Cz’ línea media central 2 cm posterior al vértice con referencia en Fpz’. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/TibCanal1.png'),},
        {
          x: 2, y: 45, width: 20, height: 10, text: 'L4s-L1s', type: 'info',infoText: 'N22 Lumbar electrodo activo en apófisis espinosa L4s con referencia a L1s o espina iliaca anterosuperior (opcional montaje T12s). ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/TibCanal2.png'),},
        {
          x: 2, y: 65, width: 20, height: 10, text: 'Hpi-Hpc', type: 'info',infoText: 'Fosa poplítea N7, electrodo activo discretamente lateral a la línea media, 2 cm proximal al pliegue cutáneo, referenciado a cara medial línea interarticular de la rodilla ipsilateral. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/TibCanal3.png'),},

        {
          type: 'image', x: 73, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/Tb-10-20.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Sistema,
        },
        {
          type: 'image', x: 89, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/Tib-T01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: IMGTabla,
        },
        {
          type: 'image', x: 81, y: 2, width: 7, height: 15, text: '', imageSource: require('../../../assets/Potenciales/Somt/TbEstimulo1.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Estimulo  , 
          popupTextX: 1, popupTextY: 10, popupTextWidth: 30, popupTextHeight: 60, popupText: 'Estimulo. Nervio Tibial fibras mixtas, colocar el cátodo entre maléolo medial y tendón de Aquiles, 1 cm por debajo del borde superior del maléolo, el ánodo se coloca a 3 cm en dirección distal al cátodo. '+
          '\n\nIntensidad. Incremento progresivo hasta obtener una leve contracción visible en el primer y/o quinto ortejos. \n\nTierra. Pierna, entre estimulo y primer relevo de registros, otros autores prefieren en M1 o C4’/C3’.' , 
        },
        {
          x: 97, y: 2, width: 7, height: 15, text: '', type: 'ImgBtn',infoText: '',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, buttonImageSource: IMGGrafica, 
          infoImage: [
            require('../../../assets/Potenciales/Somt/TibCanal1.png'),
            require('../../../assets/Potenciales/Somt/TibCanal2.png'),
            require('../../../assets/Potenciales/Somt/TibCanal3.png'),
          ]},
      ],
    ],
  },
  'Nervio Tibial proximal': {
    imagenes: [
      require('../../../assets/Potenciales/Somt/TibialBs.png'),
    ],
    botones: [
      [
        {
          x: 2, y: 25, width: 20, height: 10, text: 'Cz’-Fpz´', type: 'info',infoText: 'Cortical P37-N45, electrodo activo Cz’ línea media central 2 cm posterior al vértice con referencia en Fpz’. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/TibCanalP1.png'),},
        {
          x: 2, y: 45, width: 20, height: 10, text: 'L4s-L1s', type: 'info',infoText: 'N22 Lumbar electrodo activo en apófisis espinosa L4s con referencia a L1s o espina iliaca anterosuperior (opcional montaje T12s). ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/TibCanalP2.png'),},
        {
          x: 2, y: 65, width: 20, height: 10, text: 'EC - TM', type: 'info',infoText: 'Escotadura ciática N5, electrodo activo debajo del pliegue glúteo línea media, referencia al trocánter mayor. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/TibCanalP3.png'),},

        {
          type: 'image', x: 73, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/Tb-10-20.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Sistema,
        },
        {
          type: 'image', x: 89, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/TibP-T01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: IMGTabla,
        },
        {
          type: 'image', x: 81, y: 2, width: 7, height: 15, text: '', imageSource: require('../../../assets/Potenciales/Somt/TbEstimulo2.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Estimulo  , 
          popupTextX: 1, popupTextY: 30, popupTextWidth: 37, popupTextHeight: 40, popupText: 'Estimulo. Nervio Tibial en la fosa poplítea, cátodo aproximadamente 2 cm por arriba del pliegue cutáneo ligeramente lateral y adyacente a los tendones de los isquiotibiales; ánodo distal. '+
          '\n\nIntensidad.  Incremento progresivo tres veces el umbral sensitivo percibido por el paciente. \n\nTierra.  M1 o C4’/C3’.' , 
        },
        {
          x: 97, y: 2, width: 7, height: 15, text: '', type: 'ImgBtn',infoText: '',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, buttonImageSource: IMGGrafica, 
          infoImage: [
            require('../../../assets/Potenciales/Somt/TibCanalP1.png'),
            require('../../../assets/Potenciales/Somt/TibCanalP2.png'),
            require('../../../assets/Potenciales/Somt/TibCanalP3.png'),
          ]},
      ],
    ],
  },
  'Nervio Peroneo': {
    imagenes: [
      require('../../../assets/Potenciales/Somt/TibialBs.png'),
    ],
    botones: [
      [
        {
          x: 2, y: 25, width: 20, height: 10, text: 'Cz’-Fpz’', type: 'info',infoText: 'Cortical P37-N45, electrodo activo Cz’ línea media central 2 cm posterior al vértice con referencia en Fpz’. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/PeroCanal1.png'),},
        {
          x: 2, y: 45, width: 20, height: 10, text: 'L4s-L1s', type: 'info',infoText: 'N22 Lumbar electrodo activo en apófisis espinosa L4s con referencia a L1s o espina iliaca anterosuperior (opcional montaje T12s). ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/PeroCanal2.png'),},
        {
          x: 2, y: 65, width: 20, height: 10, text: 'EC-TM', type: 'info',infoText: 'Escotadura ciática N5, electrodo activo debajo del pliegue glúteo línea media con referencia al trocánter mayor. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/PeroCanal3.png'),},

        {
          type: 'image', x: 73, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/Peroneo-10-20.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Sistema,
        },
        {
          type: 'image', x: 89, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/Peroneo-T01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: IMGTabla,
        },
        {
          type: 'image', x: 81, y: 2, width: 7, height: 15, text: '', imageSource: require('../../../assets/Potenciales/Somt/PeroEstimulo.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Estimulo  , 
          popupTextX: 1, popupTextY: 25, popupTextWidth: 28, popupTextHeight: 50, popupText: 'Estimulo. Nervio Peroneo fibras mixtas, colocar el cátodo a nivel de la rodilla, lateral al cuello del peroné, el ánodo se coloca 3 cm distal. '+
          '\n\nIntensidad. Incremento progresivo hasta obtener una leve contracción visible en los dorsiflexores o extensores de los dedos. \n\nTierra. M1 o C4’/C3’.' , 
        },
        {
          x: 97, y: 2, width: 7, height: 15, text: '', type: 'ImgBtn',infoText: '',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, buttonImageSource: IMGGrafica, 
          infoImage: [
            require('../../../assets/Potenciales/Somt/PeroCanal1.png'),
            require('../../../assets/Potenciales/Somt/PeroCanal2.png'),
            require('../../../assets/Potenciales/Somt/PeroCanal3.png'),
          ]},
      ],
    ],
  },
  'Femorocutáneo lateral': {
    imagenes: [
      require('../../../assets/Potenciales/Somt/FemoroB.png'),
    ],
    botones: [
      [
        {
          x: 2, y: 38, width: 20, height: 10, text: 'Cz’-Fpz’', type: 'info',infoText: 'Cortical P37-N45, electrodo activo Cz’ línea media central 2 cm posterior al vértice con referencia en Fpz’. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/FemCanal1.png'),},
        {
          x: 2, y: 65, width: 20, height: 10, text: 'EIAS-TM', type: 'info',infoText: 'Espina iliaca anterosuperior N7, electrodo activo 1 cm medial a la espina ipsilateral al estimulo con electrodo de referencia sobre el trocánter mayor. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/FemCanal2.png'),},

        {
          type: 'image', x: 73, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/Fem10-20.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Sistema,
        },
        {
          type: 'image', x: 89, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/Femoro-T01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: IMGTabla,
        },
        {
          type: 'image', x: 81, y: 2, width: 7, height: 15, text: '', imageSource: require('../../../assets/Potenciales/Somt/FemEstimulo.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Estimulo  , 
          popupTextX: 1, popupTextY: 25, popupTextWidth: 37, popupTextHeight: 50, popupText: 'Estimulo. Nervio femorocutáneo lateral, colocar el cátodo sobre la cara anterior del muslo, 12 cm distal de la espina iliaca anterosuperior siguiendo una línea imaginaria trazada hasta el borde lateral de la rótula; el ánodo se coloca 3 cm distal. '+
          '\n\nIntensidad. 3 a 2.5 veces el umbral sensitivo percibido por el paciente.  \n\nTierra. M1, C5s o C4’/C3’.' , 
        },
        {
          x: 97, y: 2, width: 7, height: 15, text: '', type: 'ImgBtn',infoText: '',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, buttonImageSource: IMGGrafica, 
          infoImage: [
            require('../../../assets/Potenciales/Somt/FemCanal1.png'),
            require('../../../assets/Potenciales/Somt/FemCanal2.png'),
          ]},
      ],
      
    ],
  },
  'Segmentarios': {
    imagenes: [
      require('../../../assets/Potenciales/Somt/SegmentB.png'),
    ],
    botones: [
      [
        {
          x: 2, y: 25, width: 18, height: 10, text: 'Cz’-Fpz’', type: 'info',infoText: 'Cervical N11-N13, electrodo activo sobre apófisis espinosa de vertebra cervical C5s con referencia a Fpz’. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/SegCanal1.png'),},
        {
          x: 2, y: 48, width: 18, height: 10, text: 'C5s-Fpz', type: 'info',infoText: 'Cervical N11-N13, electrodo activo sobre apófisis espinosa de vertebra cervical C5s con referencia a Fpz’. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/SegCanal2.png'),},
        {
          x: 2, y: 72, width: 18, height: 10, text: 'ErbL-ErbR', type: 'info',infoText: 'Erb N9. Ipsilateral al estimulo, 2-3 cm por arriba de la clavícula e intersección en el borde posterior del musculo ECM. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/SegCanal3.png'),},

        {
          type: 'image', x: 73, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/Pudendos10-20.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Sistema,
        },
        {
          type: 'image', x: 89, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/Segmta-T01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: IMGTabla,
        },
        {
          type: 'image', x: 81, y: 2, width: 7, height: 15, text: '', imageSource: require('../../../assets/Potenciales/Lienzo.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Estimulo  , 
          popupTextX: 15, popupTextY: 35, popupTextWidth: 70, popupTextHeight: 35, popupText: 'Estimulo. Nervio Radial superficial mediante electrodos de barra sobre el borde dorsolateral de la muñeca, 2 cm proximal a la apófisis estiloides radial; ánodo 3 cm distalmente. '+
          '\n\nIntensidad. El triple o 2.5 veces por arriba del umbral sensitivo percibido por el paciente. \n\nTierra. Antebrazo (otros autores prefieren a nivel de Cz).' , 
        },
        {
          x: 97, y: 2, width: 7, height: 15, text: '', type: 'ImgBtn',infoText: '',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, buttonImageSource: IMGGrafica, 
          infoImage: [
            require('../../../assets/Potenciales/Somt/SegCanal1.png'),
            require('../../../assets/Potenciales/Somt/SegCanal2.png'),
            require('../../../assets/Potenciales/Somt/SegCanal3.png'),
          ]},
      ],
    ],
  },
  'Plantares': {
    imagenes: [
      require('../../../assets/Potenciales/Somt/PlantarBs.png'),
    ],
    botones: [
      [
        {
          x: 2, y: 29, width: 18, height: 10, text: 'Cz’-Fpz’', type: 'info',infoText: 'Cortical P37-N45, electrodo activo Cz’ línea media central 2 cm posterior al vértice con referencia en Fpz’. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/PlaCanal1.png'),},
        {
          x: 2, y: 49, width: 18, height: 10, text: 'Cz’-Fpz’', type: 'info',infoText: 'Cortical P37-N45, electrodo activo Cz’ línea media central 2 cm posterior al vértice con referencia en Fpz’. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/PlaCanal2.png'),},
        {
          x: 2, y: 69, width: 18, height: 10, text: 'Cz’-Fpz’', type: 'info',infoText: 'Cortical P37-N45, electrodo activo Cz’ línea media central 2 cm posterior al vértice con referencia en Fpz’. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/PlaCanal3.png'),},

        {
          type: 'image', x: 73, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/Pudendos10-20.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Sistema,
        },
        {
          type: 'image', x: 89, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/Plant-T01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: IMGTabla,
        },
        {
          type: 'image', x: 81, y: 2, width: 7, height: 15, text: '', imageSource: require('../../../assets/Potenciales/Lienzo.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Estimulo  , 
          popupTextX: 15, popupTextY: 25, popupTextWidth: 70, popupTextHeight: 60, popupText: 'Estimulo \n\nNervio Plantar medial: planta del pie, colocar electrodo activo en el centro de una línea trazada desde el talón hasta el espacio interdigital de dedos I-II. Electrodo de referencia a 3 cm distal. \n\nNervio Plantar lateral: planta del pie, colocar electrodo activo en el centro de una línea trazada desde el talón hasta el espacio interdigital de dedos IV-V. Electrodo de referencia a 3 cm distal. '+
          '\n\nNervio Calcáneo: margen posterior del talón, electrodo activo a pocos centímetros de la zona plantar, referencia a 3 cm distal. \n\nIntensidad. 2.5-3 veces al umbral percibido por el paciente en caso del nervio Calcáneo y presencia de contracción visible en sus respectivos dedos para el nervio Plantar.' , 
        },
        {
          x: 97, y: 2, width: 7, height: 15, text: '', type: 'ImgBtn',infoText: '',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, buttonImageSource: IMGGrafica, 
          infoImage: [
            require('../../../assets/Potenciales/Somt/PlaCanal1.png'),
            require('../../../assets/Potenciales/Somt/PlaCanal2.png'),
            require('../../../assets/Potenciales/Somt/PlaCanal3.png'),
          ]},
      ],
    ],
  },
  'Dermatomas cervicales': {
    imagenes: [
      require('../../../assets/Potenciales/Somt/DermatomaBs.png'),
    ],
    botones: [
      [
        {
          x: 2, y: 15, width: 20, height: 10, text: 'C4', type: 'info',infoText: 'Fosa supraclavicular 2 cm por arriba de línea media de la clavícula. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 14, infoImage: require('../../../assets/Potenciales/Somt/CervicalC4.png'),},
        {
          x: 2, y: 27, width: 20, height: 10, text: 'C5', type: 'info',infoText: '10 cm proximal al epicóndilo lateral en la superficie lateral del brazo. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 14, infoImage: require('../../../assets/Potenciales/Somt/CervicalC5.png'),},
        {
          x: 2, y: 39, width: 20, height: 10, text: 'C6', type: 'info',infoText: 'Electrodos de anillo alrededor del pulgar. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 14, infoImage: require('../../../assets/Potenciales/Somt/CervicalC6.png'),},
        {
          x: 2, y: 51, width: 20, height: 10, text: 'C7', type: 'info',infoText: 'Electrodos de anillo alrededor del dedo medio. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 14, infoImage: require('../../../assets/Potenciales/Somt/CervicalC7.png'),},
        {
          x: 2, y: 63, width: 20, height: 10, text: 'C8', type: 'info',infoText: 'Electrodos de anillo alrededor del dedo meñique. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 14, infoImage: require('../../../assets/Potenciales/Somt/CervicalC8.png'),},
        {
          x: 2, y: 75, width: 20, height: 10, text: 'T1', type: 'info',infoText: '5 cm distal al epicóndilo medial en la superficie medial del antebrazo. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 14, infoImage: require('../../../assets/Potenciales/Somt/CervicalT1.png'),},

        {
          type: 'image', x: 97, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/Sup-10-20.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Sistema,
        },
        {
          type: 'image', x: 97, y: 19, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/DermaC-T01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: IMGTabla,
        },
        {
          type: 'image', x: 97, y: 37, width: 7, height: 15, text: '', imageSource: require('../../../assets/Potenciales/Lienzo.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Estimulo  , 
          popupTextX: 25, popupTextY: 25, popupTextWidth: 60, popupTextHeight: 50, popupText: 'Cortical: \nMiembros superiores C4’ (C3’)-Fpz’ o Fpz. \nMiembros inferiores Cz’-Fpz’. '+
          '\n\nEstimulo: \nDos a tres veces el umbral sensitivo percibido por el paciente sobre la superficie cutánea definida por dermatomas; se utilizan electrodos de anillo en los dedos y de superficie en el resto de cuerpo, es de gran utilidad la colocación de una barra de estimulación para orientar el ánodo distal al cátodo en extremidades y lateral a línea media en el tronco. \n\nTierra: Ligeramente proximal al sitio de estimulación.' , 
        },
        {
          x: 97, y: 55, width: 7, height: 15, text: '', type: 'ImgBtn',infoText: '',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, buttonImageSource: IMGGrafica, 
          infoImage: [
            require('../../../assets/Potenciales/Somt/CervicalC4.png'),
            require('../../../assets/Potenciales/Somt/CervicalC5.png'),
            require('../../../assets/Potenciales/Somt/CervicalC6.png'),
            require('../../../assets/Potenciales/Somt/CervicalC7.png'),
            require('../../../assets/Potenciales/Somt/CervicalC8.png'),
            require('../../../assets/Potenciales/Somt/CervicalT1.png'),
          ]},
      ],
    ],
  },
  'Dermatomas torácicos': {
    imagenes: [
      require('../../../assets/Potenciales/Somt/DermatomaBs.png'),
    ],
    botones: [
      [
        {
          x: 2, y: 15, width: 20, height: 10, text: 'T2', type: 'info',infoText: '6-8 cm por arriba del nivel T4. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 14, infoImage: require('../../../assets/Potenciales/Somt/DerTorT2.png'),},
        {
          x: 2, y: 27, width: 20, height: 10, text: 'T4', type: 'info',infoText: 'A nivel lateral de la tetilla. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 14, infoImage: require('../../../assets/Potenciales/Somt/DerTorT4.png'),},
        {
          x: 2, y: 39, width: 20, height: 10, text: 'T6', type: 'info',infoText: '6-8 cm por debajo del nivel T4 o a nivel del esternón. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 14, infoImage: require('../../../assets/Potenciales/Somt/DerTorT6.png'),},
        {
          x: 2, y: 51, width: 20, height: 10, text: 'T8', type: 'info',infoText: '6-8 cm por arriba de T10. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 14, infoImage: require('../../../assets/Potenciales/Somt/DerTorT8.png'),},
        {
          x: 2, y: 63, width: 20, height: 10, text: 'T10', type: 'info',infoText: 'A nivel lateral de la cicatriz umbilical.',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 14, infoImage: require('../../../assets/Potenciales/Somt/DerTorT10.png'),},
        {
          x: 2, y: 75, width: 20, height: 10, text: 'T12', type: 'info',infoText: 'Discretamente arriba de la región inguinal.',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 14, infoImage: require('../../../assets/Potenciales/Somt/DerTorT12.png'),},

        {
          type: 'image', x: 97, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/Sup-10-20.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Sistema,
        },
        {
          type: 'image', x: 97, y: 19, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/DermaT-T01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: IMGTabla,
        },
        {
          type: 'image', x: 97, y: 37, width: 7, height: 15, text: '', imageSource: require('../../../assets/Potenciales/Lienzo.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Estimulo  , 
          popupTextX: 25, popupTextY: 25, popupTextWidth: 60, popupTextHeight: 50, popupText: 'Cortical: \nMiembros superiores C4’ (C3’)-Fpz’ o Fpz. \nMiembros inferiores Cz’-Fpz’. '+
          '\n\nEstimulo: \nDos a tres veces el umbral sensitivo percibido por el paciente sobre la superficie cutánea definida por dermatomas; se utilizan electrodos de anillo en los dedos y de superficie en el resto de cuerpo, es de gran utilidad la colocación de una barra de estimulación para orientar el ánodo distal al cátodo en extremidades y lateral a línea media en el tronco. \n\nLigeramente proximal al sitio de estimulación.' , 
        },
        {
          x: 97, y: 55, width: 7, height: 15, text: '', type: 'ImgBtn',infoText: '',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, buttonImageSource: IMGGrafica, 
          infoImage: [
            require('../../../assets/Potenciales/Somt/DerTorT2.png'),
            require('../../../assets/Potenciales/Somt/DerTorT4.png'),
            require('../../../assets/Potenciales/Somt/DerTorT6.png'),
            require('../../../assets/Potenciales/Somt/DerTorT8.png'),
            require('../../../assets/Potenciales/Somt/DerTorT10.png'),
            require('../../../assets/Potenciales/Somt/DerTorT12.png'),
          ]},
      ],
      
    ],
  },
  'Dermatomas lumbosacros': {
    imagenes: [
      require('../../../assets/Potenciales/DermatomaLmBs.png'),
    ],
    botones: [
      [
        {
          x: 2, y: 15, width: 20, height: 10, text: 'L1', type: 'info',infoText: '4-5 cm por debajo de T12.',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 14, infoImage: require('../../../assets/Potenciales/Somt/DerLumL1.png'),},
        {
          x: 2, y: 27, width: 20, height: 10, text: 'L2', type: 'info',infoText: '8-10 cm por debajo de T12. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 14, infoImage: require('../../../assets/Potenciales/Somt/DerLumL2.png'),},
        {
          x: 2, y: 39, width: 20, height: 10, text: 'L3', type: 'info',infoText: 'Punto medio de una línea oblicua trazada entre la creta iliaca anterosuperior, hasta el cóndilo medial de la tibia. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 14, infoImage: require('../../../assets/Potenciales/Somt/DerLumL3.png'),},
        {
          x: 2, y: 51, width: 20, height: 10, text: 'L4', type: 'info',infoText: 'Punto medio de una línea horizontal trazada desde el maléolo medial, hasta el cóndilo medial de la tibia. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 14, infoImage: require('../../../assets/Potenciales/Somt/DerLumL4.png'),},
        {
          x: 2, y: 63, width: 20, height: 10, text: 'L5', type: 'info',infoText: 'Borde medial en el dorso del segundo metatarsiano. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 14, infoImage: require('../../../assets/Potenciales/Somt/DerLumL5.png'),},
        {
          x: 2, y: 75, width: 20, height: 10, text: 'S1', type: 'info',infoText: 'Borde lateral en el dorso del quinto metatarsiano.',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 14, infoImage: require('../../../assets/Potenciales/Somt/DerLumS1.png'),},

        {
          type: 'image', x: 97, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/Sup-10-20.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Sistema,
        },
        {
          type: 'image', x: 97, y: 19, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/DermaT-T01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: IMGTabla,
        },
        {
          type: 'image', x: 97, y: 37, width: 7, height: 15, text: '', imageSource: require('../../../assets/Potenciales/Lienzo.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Estimulo  , 
          popupTextX: 25, popupTextY: 25, popupTextWidth: 60, popupTextHeight: 50, popupText: 'Cortical: \nMiembros superiores C4’ (C3’)-Fpz’ o Fpz. \nMiembros inferiores Cz’-Fpz’. '+
          '\n\nEstimulo: \nDos a tres veces el umbral sensitivo percibido por el paciente sobre la superficie cutánea definida por dermatomas; se utilizan electrodos de anillo en los dedos y de superficie en el resto de cuerpo, es de gran utilidad la colocación de una barra de estimulación para orientar el ánodo distal al cátodo en extremidades y lateral a línea media en el tronco. \n\nLigeramente proximal al sitio de estimulación.' , 
        },
        {
          x: 97, y: 55, width: 7, height: 15, text: '', type: 'ImgBtn',infoText: '',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, buttonImageSource: IMGGrafica, 
          infoImage: [
            require('../../../assets/Potenciales/Somt/DerLumL1.png'),
            require('../../../assets/Potenciales/Somt/DerLumL2.png'),
            require('../../../assets/Potenciales/Somt/DerLumL3.png'),
            require('../../../assets/Potenciales/Somt/DerLumL4.png'),
            require('../../../assets/Potenciales/Somt/DerLumL5.png'),
            require('../../../assets/Potenciales/Somt/DerLumS1.png'),
          ]},
      ],
      
    ],
  },
  'Nervios Trigéminos': {
    imagenes: [
      require('../../../assets/Potenciales/Somt/TrigeBs.png'),
    ],
    botones: [
      [
        {
          x: 2, y: 35, width: 15, height: 10, text: 'C5’-Fpz', type: 'info',infoText: 'Sobre cráneo, electrodo activo en C5’ al estimular lado derecho (2cm posterior a C5), referenciado a Fpz (línea media frontal). Invertir registro activo a C6’ al estimular lado izquierdo. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/TrigeCanal1.png'),},
        {
          x: 2, y: 58, width: 15, height: 10, text: 'C5’-C4’', type: 'info',infoText: 'Registro bipolar C6’ activo con su referencia longitudinal contralateral C5’, invertir registro para el siguiente lado. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/TrigeCanal2.png'),},

        {
          type: 'image', x: 73, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/Trigem10-20.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Sistema,
        },
        {
          type: 'image', x: 89, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/Trigem-T01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: IMGTabla,
        },

        {
          x: 81, y: 2, width: 7, height: 15, text: '', type: 'TxtButtonImg',infoText: 'Nervio Trigémino (contralateral a registro cortical), colocar el cátodo en la comisura labial y el ánodo paramedial entre ambos labios, esto estimula las divisiones maxilar y mandibular al unísono. Se puede optar por estimular cada labio de forma independiente colocando el cátodo 1 cm arriba o 1 cm debajo de la comisura en cada caso, ánodo paramedial. '+
          '\n\nIntensidad. 2 a 3 veces el umbral sensitivo, es posible la poca tolerancia a la estimulación y un artefacto de estímulo por arriba de los 10 mA.',
          infoBoxX: 18, infoBoxY: 35, infoBoxWidth: 37, infoBoxHeight: 48, buttonImageSource: Estimulo, 
          infoImage: [
            require('../../../assets/Potenciales/Somt/TrigeEs3.png'),
        ]},
        {
          x: 65, y: 2, width: 7, height: 15, text: '', type: 'TxtButtonImg',infoText: 'Nervio Trigémino (contralateral a registro cortical), colocar el cátodo en la comisura labial y el ánodo paramedial entre ambos labios, esto estimula las divisiones maxilar y mandibular al unísono. Se puede optar por estimular cada labio de forma independiente colocando el cátodo 1 cm arriba o 1 cm debajo de la comisura en cada caso, ánodo paramedial. '+
          '\n\nIntensidad. 2 a 3 veces el umbral sensitivo, es posible la poca tolerancia a la estimulación y un artefacto de estímulo por arriba de los 10 mA.',
          infoBoxX: 18, infoBoxY: 35, infoBoxWidth: 37, infoBoxHeight: 48, buttonImageSource: Estimulo, 
          infoImage: [
            require('../../../assets/Potenciales/Somt/TrigeEs1.png'),
        ]},
        
    
        {
          x: 97, y: 2, width: 7, height: 15, text: '', type: 'ImgBtn',infoText: '',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, buttonImageSource: IMGGrafica, 
          infoImage: [
            require('../../../assets/Potenciales/Somt/TrigeCanal1.png'),
            require('../../../assets/Potenciales/Somt/TrigeCanal2.png'),

          ]},  
      ],
    ],
  },
  'Pudendos': {
    imagenes: [
      require('../../../assets/Potenciales/Somt/PuedenFBs.png'),
      require('../../../assets/Potenciales/Somt/PudMBs.png'),
    ],
    botones: [
      [
        {
          x: 2, y: 50, width: 15, height: 10, text: 'Cz’-Fpz’', type: 'info',infoText: ' Sobre región media del cráneo, 2 cm detrás del vértice Cz (Cz’) con referencia frontal a Fpz’. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/PudFCanal1.png'),},
        
        {
          type: 'image', x: 73, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/Pudendos10-20.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Sistema,
        },
        {
          type: 'image', x: 89, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/Pudendos-T01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: IMGTabla,
        },
        {
          type: 'image', x: 81, y: 2, width: 7, height: 15, text: '', imageSource: require('../../../assets/Potenciales/Somt/PudFEstimulo.png'), 
          popupImageX: 20, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Estimulo  , 
          popupTextX: 1, popupTextY: 30, popupTextWidth: 30, popupTextHeight: 40, popupText: 'Colocar electrodo de barra con el cátodo sobre los labios mayores, 1 cm debajo del clítoris, ánodo distal para estímulo izquierdo o derecho; si se cuentan con dos estimuladores independientes se obtienen mejores registros al estimulo bilateral. ', 
        },
        {
          x: 97, y: 2, width: 7, height: 15, text: '', type: 'ImgBtn',infoText: '',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, buttonImageSource: IMGGrafica, 
          infoImage: [
            require('../../../assets/Potenciales/Somt/PudFCanal1.png'),

          ]},  
      ],
      [
        {
          x: 2, y: 25, width: 20, height: 10, text: 'Cz’-Fpz’', type: 'info',infoText: 'Sobre región media del cráneo, 2 cm detrás del vértice Cz (Cz’) con referencia frontal a Fpz’. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/PudMCanal1.png'),},
        {
          x: 2, y: 45, width: 20, height: 10, text: 'L1s-EIAS', type: 'info',infoText: 'Electrodo activo sobre apófisis espinosa L1 (L1s) Referenciado a espina iliaca anterosuperior EIAS. Se puede optar por L4s. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Somt/PudMCanal2.png'),},

        {
          type: 'image', x: 73, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/Pudendos10-20.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Sistema,
        },
        {
          type: 'image', x: 89, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Somt/Pudendos-T01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: IMGTabla,
        },
        {
          type: 'image', x: 81, y: 2, width: 7, height: 15, text: '', imageSource: require('../../../assets/Potenciales/Somt/PudMEstimulo.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Estimulo  , 
          popupTextX: 65, popupTextY: 30, popupTextWidth: 32, popupTextHeight: 35, popupText: 'Colocar electrodos de anillo, cátodo en la base del pene y ánodo 3-4 cm distal o en el cuello del glande. Se puede utilizar un electrodo de barra para estimular lado izquierdo o derecho por separado. ', 
        },
        {
          x: 97, y: 2, width: 7, height: 15, text: '', type: 'ImgBtn',infoText: '',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, buttonImageSource: IMGGrafica, 
          infoImage: [
            require('../../../assets/Potenciales/Somt/PudMCanal1.png'),
            require('../../../assets/Potenciales/Somt/PudMCanal2.png'),

          ]},  
      ],
    ],
  },
  'Miembros superiores': {
    imagenes: [
      require('../../../assets/Potenciales/Motores/MenSupBs.png'),
    ],
    botones: [
      [
        {
          x: 2, y: 20, width: 20, height: 10, text: 'Reposo', type: 'info',infoText: 'Determinar el umbral de estimulación magnética cortical mínimo al generar una pequeña contracción involuntaria en la mano. Esto se logra con incrementos progresivos del 5 al 10% de la intensidad. De no lograrlo, se reposicionará la bobina 1 cm en dirección anterior, lateral o posterior (en caso de no obtención con esta maniobra, pasar a la facilitación).',
          infoBoxX: 20, infoBoxY: 70, infoBoxWidth: 70, infoBoxHeight: 18, infoImage: require('../../../assets/Potenciales/Motores/ReposoSup.png'),},
        {
          x: 2, y: 32, width: 20, height: 10, text: 'Facilitación', type: 'info',infoText: 'Solicitar al paciente una contracción voluntaria con abducción del pulgar entre 10-20% de la fuerza (medida subjetiva). Este registro incrementa la amplitud y reducide la latencia del potencial en reposo.',
          infoBoxX: 22, infoBoxY: 70, infoBoxWidth: 58, infoBoxHeight: 15, infoImage: require('../../../assets/Potenciales/Motores/FacilitacionSup.png'),},
        {
          x: 2, y: 44, width: 20, height: 10, text: 'Cervical', type: 'info',infoText: 'Estimulación cervical/radicular localizando el proceso espinoso de la vertebra C7 y descender 1 a 2 cm hasta la unión C8-T1. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 45, infoBoxHeight: 18, infoImage: require('../../../assets/Potenciales/Motores/Cervical2.png'),},
        {
          x: 2, y: 56, width: 20, height: 10, text: 'Periférico', type: 'info',infoText: 'Estimulación en Punto de Erb ipsilateral al registro, se puede realizar tanto por estimulación magnética, como con estimulación eléctrica convencional.',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 45, infoBoxHeight: 18, infoImage: require('../../../assets/Potenciales/Motores/ERB.png'),},
        {
          x: 2, y: 68, width: 20, height: 10, text: 'Onda F', type: 'info',infoText: 'Registro convencional de latencia mínima de la onda F mediante técnica de estimulación ortodrómica continua a nivel de la muñeca.',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 45, infoBoxHeight: 18, infoImage: require('../../../assets/Potenciales/Motores/OndaFSup.png'),},

        {
          type: 'image', x: 57, y: 2, width: 7, height: 15, text: '', imageSource: require('../../../assets/Potenciales/Motores/RegidtroMiSup.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Registro  , 
          popupTextX: 58, popupTextY: 40, popupTextWidth: 35, popupTextHeight: 30, popupText: 'Abductor corto del pulgar \n\nActivo. Vientre muscular en eminencia tenar lateral. \nReferencia. Primera articulación metacarpofalángica. \nTierra. dorso de la mano o antebrazo.', 
        },
        {
          type: 'image', x: 65, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Motores/MieSup-10-20.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Sistema,
        },
        {
          type: 'image', x: 89, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Motores/MieSup1-T01.png'), 
          popupImageX: 50, popupImageY: 0, popupImageWidth: 99, popupImageHeight: 100, buttonImageSource: IMGTabla,
        },
        {
          type: 'image', x: 73, y: 2, width: 7, height: 15, text: '', imageSource: require('../../../assets/Potenciales/Lienzo.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Estimulo  , 
          popupTextX: 10, popupTextY: 25, popupTextWidth: 80, popupTextHeight: 60, popupText: 'ESTIMULO CORTICAL \n\nBobina circular o en doble cono de estimulación magnética transcraneal. Colocar el centro de la bobina tangencialmente sobre el Vertex (Cz) o 1 cm por delante siguiendo la línea media. Solo para bobina circular, dirigir la corriente en orientación de las manecillas del reloj para lado derecho, en invertir para lado izquierdo en contra de las manecillas del reloj.' + 
          '\n\nBobina en forma de 8 (mariposa) de estimulación magnética transcraneal. Colocar el centro de la unión de ambos circuitos en C1 o C2, orientándolo de forma tangencial en dirección a Fpz; C1 para el registro contralateral derecho y C2 para el registro contralateral izquierdo. En mEDXprolab obtenemos nuestras respuestas al estimulo de C3-C4.' +
          '\n\nIntensidad. Se recomienda iniciar en 30-50% con incrementos progresivos de 10% hasta obtener una contracción mínima en el dominio muscular distal.', 
        },
        {
          type: 'image', x: 81, y: 2, width: 7, height: 15, text: '', imageSource: require('../../../assets/Potenciales/Lienzo.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Estimulo  , 
          popupTextX: 25, popupTextY: 35, popupTextWidth: 60, popupTextHeight: 35, popupText: 'ESTIMULO CERVICAL' + 
          '\n\nBobina circular o en forma de 8 de estimulación magnética transcraneal. Colocar el centro de la bobina en orientación tangencial u horizontal sobre C7 con flexión de cuello de 45% y descender 1-2 cm hasta la unión C8-T1 con el 120% de intensidad prefijado en la estimulación cortical y únicamente en fase de reposo muscular.', 
        },
        {
          x: 97, y: 2, width: 7, height: 15, text: '', type: 'ImgBtn',infoText: '',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, buttonImageSource: IMGGrafica, 
          infoImage: [
            require('../../../assets/Potenciales/Motores/ReposoSup.png'),
            require('../../../assets/Potenciales/Motores/FacilitacionSup.png'),
            require('../../../assets/Potenciales/Motores/Cervical2.png'),
            require('../../../assets/Potenciales/Motores/ERB.png'),
            require('../../../assets/Potenciales/Motores/OndaFSup.png'),
          ]},  
      ],
    ],
  },
  'Miembros inferiores': {
    imagenes: [
      require('../../../assets/Potenciales/Motores/MenInfBs.png'),
    ],
    botones: [
      [
        {
          x: 2, y: 20, width: 20, height: 10, text: 'Reposo', type: 'info',infoText: 'Determinar el umbral de estimulación magnética cortical mínimo al generar un pequeño movimiento en el pie o dedos con incrementos progresivos del 10% de la intensidad. De no lograrlo al 100%, pasar a la facilitación.',
          infoBoxX: 22, infoBoxY: 71, infoBoxWidth: 60, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Motores/ReposoInf.png'),},
        {
          x: 2, y: 32, width: 20, height: 10, text: 'Facilitación', type: 'info',infoText: 'Solicitar al paciente una contracción voluntaria del 20% de la fuerza en dorsiflexión del tobillo (medida subjetiva). Este registro incrementa la amplitud y reducide la latencia del potencial en reposo.',
          infoBoxX: 22, infoBoxY: 71, infoBoxWidth: 58, infoBoxHeight: 15, infoImage: require('../../../assets/Potenciales/Motores/FacilitacionInf.png'),},
        {
          x: 2, y: 44, width: 20, height: 10, text: 'Lumbar', type: 'info',infoText: 'Estimulación medular/radicular localizando la unión L4-L5 con referencia a las crestas iliacas o a nivel sacro (S1-S2) un nivel por arriba de las espinas iliacas posteriores. ',
          infoBoxX: 22, infoBoxY: 71, infoBoxWidth: 58, infoBoxHeight: 15, infoImage: require('../../../assets/Potenciales/Motores/LumbarInf.png'),},
        {
          x: 2, y: 56, width: 20, height: 10, text: 'Periférico', type: 'info',infoText: 'Estimulación en hueco poplíteo ipsilateral al registro, se puede realizar tanto por estimulación magnética transcraneal, como con estimulación eléctrica convencional. ',
          infoBoxX: 22, infoBoxY: 72, infoBoxWidth: 58, infoBoxHeight: 15, infoImage: require('../../../assets/Potenciales/Motores/PerifericoInf.png'),},
        {
          x: 2, y: 68, width: 20, height: 10, text: 'Onda F', type: 'info',infoText: 'Registro convencional de latencia mínima mediante técnica de estimulación ortodrómica continua a nivel de la fíbula.',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 45, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Motores/OndaFInf.png'),},

        {
          type: 'image', x: 57, y: 2, width: 7, height: 15, text: '', imageSource: require('../../../assets/Potenciales/Motores/RegistroInf.png'), 
          popupImageX: 20, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Registro  , 
          popupTextX: 63, popupTextY: 30, popupTextWidth: 30, popupTextHeight: 40, popupText: 'Tibial anterior  \n\nActivo. Cara lateral de la tibia, el electrodo de superficie se coloca en la unión del tercio proximal y medio de la pierna, al interceptar una línea trazada entre la tuberosidad tibial y el maléolo lateral. Referencia: 4 cm distal al electrodo activo sobre el tendón del tibial anterior. Tierra: Tibia medial o rodilla.', 
        },
        {
          type: 'image', x: 65, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Motores/MieInf-10-20.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Sistema,
        },
        {
          type: 'image', x: 89, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Motores/MieInf1-T01.png'), 
          popupImageX: 20, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: IMGTabla,
        },
        {
          type: 'image', x: 73, y: 2, width: 7, height: 15, text: '', imageSource: require('../../../assets/Potenciales/Lienzo.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Estimulo  , 
          popupTextX: 25, popupTextY: 25, popupTextWidth: 60, popupTextHeight: 60, popupText: 'ESTIMULO CORTICAL \n\nBobina circular de estimulación magnética transcraneal. Colocar el centro de la bobina tangencialmente 3 cm por delante del Vertex (Cz) siguiendo la línea media.' + 
          '\n\nBobina en forma de 8 (mariposa) de estimulación magnética transcraneal. Colocar el centro de la unión de ambos circuitos en el vertex (Cz), orientándolo de forma horizontal en dirección a Fpz; se puede lateralizar discretamente a C1 para el registro periférico izquierdo o a C2 para el derecho (lateralización paradójica).' +
          '\n\nBobina en doble cono. Ideal para la estimulación en miembros inferiores por la profundidad que se genera a nivel cortical y subcortical.'+
          '\n\nIntensidad. Se recomienda iniciar en 60% con incrementos progresivos de 10% hasta obtener una contracción mínima al reposo.', 
        },
        {
          type: 'image', x: 81, y: 2, width: 7, height: 15, text: '', imageSource: require('../../../assets/Potenciales/Lienzo.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Estimulo  , 
          popupTextX: 25, popupTextY: 35, popupTextWidth: 60, popupTextHeight: 35, popupText: 'ESTIMULO LUMBAR  ' + 
          '\n\nBobina circular o en forma de 8 de estimulación magnética transcraneal. Colocar el centro de la bobina en orientación tangencial u horizontal sobre los procesos espinosos de las vértebras lumbosacras dependiendo de los niveles a explorar; se observa una respuesta idónea en L1-L2 para Vasto Medial, la unión L4-L5 para Tibial anterior y S1 para Abductor de hallux. La posición del paciente puede variar desde decúbito prono o en sedestación con máxima flexión del tronco.', 
        },
        {
          x: 97, y: 2, width: 7, height: 15, text: '', type: 'ImgBtn',infoText: '',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, buttonImageSource: IMGGrafica, 
          infoImage: [
            require('../../../assets/Potenciales/Motores/ReposoInf.png'),
            require('../../../assets/Potenciales/Motores/FacilitacionInf.png'),
            require('../../../assets/Potenciales/Motores/LumbarInf.png'),
            require('../../../assets/Potenciales/Motores/PerifericoInf.png'),
            require('../../../assets/Potenciales/Motores/OndaFInf.png'),
          ]},  
      ],
      
    ],
  },
  'Triple respuesta': {
    imagenes: [
      require('../../../assets/Potenciales/Motores/TripleBs2.png'),
      require('../../../assets/Potenciales/Motores/TripleBs1.png'),
      require('../../../assets/Potenciales/Motores/TripBs.png'),
    ],
    botones: [
      [
        {
          x: 14, y: 50, width: 16, height: 10, text: 'Primer interóseo dorsal', type: 'info',infoText: '',
          infoBoxX: 200, infoBoxY: 1, infoBoxWidth: 0, infoBoxHeight: 0, infoImage: [require('../../../assets/Potenciales/Motores/PrimerInDr.png'), require('../../../assets/Potenciales/Motores/Registro1-0.png'),],},
        {
          x: 31, y: 50, width: 16, height: 10, text: 'Flexor radial del carpo', type: 'info',infoText: '',
          infoBoxX: 220, infoBoxY: 1, infoBoxWidth: 0, infoBoxHeight: 0, infoImage: [require('../../../assets/Potenciales/Motores/FloxorCar.png'), require('../../../assets/Potenciales/Motores/Registro1-0.png'),],},
        {
          x: 48, y: 50, width: 16, height: 10, text: 'Bíceps braquial', type: 'info',infoText: '',
          infoBoxX: 200, infoBoxY: 1, infoBoxWidth: 0, infoBoxHeight: 0, infoImage: [require('../../../assets/Potenciales/Motores/BicepsBq.png'), require('../../../assets/Potenciales/Motores/Registro1-0.png'),],},

        {
          x: 10, y: 1, width: 7, height: 15, text: '', type: 'ImgBtn',infoText: '',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, buttonImageSource: Registro, 
          infoImage: [ require('../../../assets/Potenciales/Motores/Registro1-0.png'),]}, 
        {
          type: 'image', x: 18, y: 1, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Motores/Respuesta1-10-20.png'), 
          popupImageX: 70, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Sistema,
        },
        {
          type: 'image', x: 26, y: 1, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Motores/Triple1-T01.png'), 
          popupImageX: 40, popupImageY: 2, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: IMGTabla,
        },
        {
          type: 'image', x: 34, y: 1, width: 7, height: 15, text: '', imageSource: require('../../../assets/Potenciales/Lienzo.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Estimulo  , 
          popupTextX: 25, popupTextY: 25, popupTextWidth: 60, popupTextHeight: 33, popupText: 'Cortical a nivel Vertex craneal 1 cm delante de Cz \n\nCervical a nivel de proceso espinoso C5-C6 para Bíceps, C7 Para Flexor radial del carpo y C8-T1 para Primer interóseo dorsal.' + 
          '\n\nPeriférico. Opcional en punto de Erb o ventral a apófisis coracoides.', 
        },
        {
          x: 42, y: 1, width: 7, height: 15, text: '', type: 'ImgBtn',infoText: '',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, buttonImageSource: IMGGrafica, 
          infoImage: [
            require('../../../assets/Potenciales/Motores/PrimerInDr.png'),
            require('../../../assets/Potenciales/Motores/FloxorCar.png'),
            require('../../../assets/Potenciales/Motores/BicepsBq.png'),
          ]},  
      ],
      [
        {
          x: 14, y: 50, width: 16, height: 10, text: 'Abductor corto del pulgar', type: 'info',infoText: '',
          infoBoxX: 200, infoBoxY: 1, infoBoxWidth: 0, infoBoxHeight: 0, infoImage: [require('../../../assets/Potenciales/Motores/abductorCt.png'), require('../../../assets/Potenciales/Motores/Registro2.png'),],},
        {
          x: 31, y: 50, width: 16, height: 10, text: 'Abductor del dedo meñique', type: 'info',infoText: '',
          infoBoxX: 220, infoBoxY: 1, infoBoxWidth: 0, infoBoxHeight: 0, infoImage: [require('../../../assets/Potenciales/Motores/AbductorQut.png'), require('../../../assets/Potenciales/Motores/Registro2.png'),],},
        {
          x: 48, y: 50, width: 16, height: 10, text: 'Bíceps braquial', type: 'info',infoText: '',
          infoBoxX: 200, infoBoxY: 1, infoBoxWidth: 0, infoBoxHeight: 0, infoImage: [require('../../../assets/Potenciales/Motores/BicepBq2.png'), require('../../../assets/Potenciales/Motores/Registro2.png'),],},

        {
          x: 10, y: 1, width: 7, height: 15, text: '', type: 'ImgBtn',infoText: '',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, buttonImageSource: Registro, 
          infoImage: [
            require('../../../assets/Potenciales/Motores/Registro2.png'),

          ]}, 
        {
          type: 'image', x: 18, y: 1, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Motores/Repuesta2-10-20.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Sistema,
        },
        {
          type: 'image', x: 26, y: 1, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Motores/Triple2-T01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: IMGTabla,
        },
        {
          type: 'image', x: 34, y: 1, width: 7, height: 15, text: '', imageSource: require('../../../assets/Potenciales/Lienzo.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Estimulo  , 
          popupTextX: 25, popupTextY: 22, popupTextWidth: 60, popupTextHeight: 35, popupText: 'Cortical a nivel Vertex craneal 1 cm delante de Cz. Opcional con bobina en mariposa C1-C2 o C3-C4. \n\nCervical a nivel de proceso espinoso C7 se puede registrar en los tres músculos o individualizar C6 para Bíceps y C8-T1 para ACP y ADM.' + 
          '\n\nPeriférico. Opcional en punto de Erb o ventral a apófisis coracoides.', 
        },
        {
          x: 42, y: 1, width: 7, height: 15, text: '', type: 'ImgBtn',infoText: '',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, buttonImageSource: IMGGrafica, 
          infoImage: [
            require('../../../assets/Potenciales/Motores/abductorCt.png'),
            require('../../../assets/Potenciales/Motores/AbductorQut.png'),
            require('../../../assets/Potenciales/Motores/BicepBq2.png'),
          ]},  
      ],
      [
        {
          x: 42, y: 20, width: 16, height: 10, text: 'Vasto medial', type: 'info',infoText: '',
          infoBoxX: 200, infoBoxY: 1, infoBoxWidth: 0, infoBoxHeight: 0, infoImage: [require('../../../assets/Potenciales/Motores/VastoMd.png'), require('../../../assets/Potenciales/Motores/Registro3.png'),],},
        {
          x: 59, y: 20, width: 16, height: 10, text: 'Tibial anterior', type: 'info',infoText: '',
          infoBoxX: 220, infoBoxY: 1, infoBoxWidth: 0, infoBoxHeight: 0, infoImage: [require('../../../assets/Potenciales/Motores/TibialAnt.png'), require('../../../assets/Potenciales/Motores/Registro3.png'),],},
        {
          x: 76, y: 20, width: 16, height: 10, text: 'Abductor del hallux', type: 'info',infoText: '',
          infoBoxX: 200, infoBoxY: 1, infoBoxWidth: 0, infoBoxHeight: 0, infoImage: [require('../../../assets/Potenciales/Motores/AbdutorHallux.png'), require('../../../assets/Potenciales/Motores/Registro3.png'),],},

        {
          x: 10, y: 1, width: 7, height: 15, text: '', type: 'ImgBtn',infoText: '',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, buttonImageSource: Registro, 
          infoImage: [
            require('../../../assets/Potenciales/Motores/Registro3.png'),

          ]}, 
        {
          type: 'image', x: 18, y: 1, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Motores/Repuesta3-10-20.png'), 
          popupImageX: 40, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Sistema,
        },
        {
          type: 'image', x: 26, y: 1, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Motores/Triple3-T01.png'), 
          popupImageX: 20, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: IMGTabla,
        },
        {
          type: 'image', x: 34, y: 1, width: 7, height: 15, text: '', imageSource: require('../../../assets/Potenciales/Lienzo.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Estimulo  , 
          popupTextX: 22, popupTextY: 35, popupTextWidth: 60, popupTextHeight: 35, popupText: 'Cortical a nivel Vertex craneal 3 cm delante de Cz. \n\nLumbosacro a nivel de proceso espinoso L3-L4 para Vasto medial, L4-L5 para Tibial anterior y S1 para Abductor del hallux.' + 
          '\n\nPeriférico. Opcional en punto de Erb o ventral a apófisis coracoides.', 
        },
        {
          x: 42, y: 1, width: 7, height: 15, text: '', type: 'ImgBtn',infoText: '',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, buttonImageSource: IMGGrafica, 
          infoImage: [
            require('../../../assets/Potenciales/Motores/VastoMd.png'),
            require('../../../assets/Potenciales/Motores/TibialAnt.png'),
            require('../../../assets/Potenciales/Motores/AbdutorHallux.png'),
          ]},  
      ],
    ],
  },
  'Campo total': {
    imagenes: [
      require('../../../assets/Potenciales/Visual/CampBs.png'),
      require('../../../assets/Potenciales/Visual/CampBs.png'),
    ],
    botones: [
      [
        {
          x: 2, y: 25, width: 20, height: 10, text: 'O1-Fpz', type: 'info',infoText: 'Lado izquierdo, colocar electrodo activo 5 cm lateral a la línea media occipital (Oz) referenciado a línea media frontal (Fpz).',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Visual/CamCanal1.png'),},
        {
          x: 2, y: 40, width: 20, height: 10, text: 'Oz-Fpz', type: 'info',infoText: 'Línea media occipital, colocar electrodo activo 5 cm por arriba del inion, referenciado a Fpz (línea media frontal) 12 cm por arriba del nasion. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Visual/CamCanal2.png'),},
        {
          x: 2, y: 55, width: 20, height: 10, text: 'O2-Fpz', type: 'info',infoText: 'Lado derecho, colocar electrodo activo 5 cm lateral a la línea media occipital (Oz) referenciado a línea media frontal (Fpz).',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Visual/CamCanal3.png'),},
        {
          x: 2, y: 70, width: 20, height: 10, text: 'A1/A2 o M1/M2 – Fpz', type: 'info',infoText: 'Testigo opcional, colocar electrodo activo en Fpz referenciado a auricular A1/A2 o viceversa.',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Visual/CamCanal4.png'),},

        {
          type: 'image', x: 73, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Visual/Cam10-20.jpg'), 
          popupImageX: 20, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Sistema,
        },
        {
          type: 'image', x: 89, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Visual/Camp-T01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: IMGTabla,
        },
        {
          x: 81, y: 2, width: 7, height: 15, text: '', type: 'TxtButtonImg',infoText: 'Patrón Reverso de Dameros CAMPO TOTAL \n\n(Área Prequiasmática: nervio óptico).'+
          '\nA 100 cm de distancia, estimular de forma monocular con oclusión contralateral. \nTamaño de pantalla de 10 a 16° del campo visual. \nElementos de 50’-56’ arco visual (cuadros grandes para visión periférica parafoveal).',
          infoBoxX: 21, infoBoxY: 1, infoBoxWidth: 45, infoBoxHeight: 40, buttonImageSource: Estimulo, 
          infoImage: [
            require('../../../assets/Potenciales/Visual/CamEstimulo.png'),
          ]},  
        {
          x: 97, y: 2, width: 7, height: 15, text: '', type: 'ImgBtn',infoText: '',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, buttonImageSource: IMGGrafica, 
          infoImage: [
            require('../../../assets/Potenciales/Visual/CamCanal1.png'),
            require('../../../assets/Potenciales/Visual/CamCanal2.png'),
            require('../../../assets/Potenciales/Visual/CamCanal3.png'),
            require('../../../assets/Potenciales/Visual/CamCanal4.png'),
          ]},  
      ],
      [
        {
          x: 2, y: 25, width: 20, height: 10, text: 'O1-Fpz', type: 'info',infoText: 'Lado izquierdo, colocar electrodo activo 5 cm lateral a la línea media occipital (Oz) referenciado a línea media frontal (Fpz).',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Visual/CampCanal1.png'),},
        {
          x: 2, y: 40, width: 20, height: 10, text: 'Oz-Fpz', type: 'info',infoText: 'Línea media occipital, colocar electrodo activo 5 cm por arriba del inion, referenciado a Fpz (línea media frontal) 12 cm por arriba del nasion. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Visual/CampCanal2.png'),},
        {
          x: 2, y: 55, width: 20, height: 10, text: 'O2-Fpz', type: 'info',infoText: 'Lado derecho, colocar electrodo activo 5 cm lateral a la línea media occipital (Oz) referenciado a línea media frontal (Fpz).',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Visual/CampCanal3.png'),},
        {
          x: 2, y: 70, width: 20, height: 10, text: 'A1/A2 o M1/M2 – Fpz', type: 'info',infoText: 'Testigo opcional, colocar electrodo activo en Fpz referenciado a auricular A1/A2 o viceversa.',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Visual/CampCanal4.png'),},

        {
          type: 'image', x: 73, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Visual/Cam10-20.jpg'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Sistema,
        },
        {
          type: 'image', x: 89, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Visual/Camp-T01.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: IMGTabla,
        },
        {
          x: 81, y: 2, width: 7, height: 15, text: '', type: 'TxtButtonImg',infoText: 'Patrón Reverso de Dameros CAMPO TOTAL \n\n(Área Prequiasmática: nervio óptico).'+
          '\nA 100 cm de distancia, estimular de forma monocular con oclusión contralateral. \nTamaño de pantalla de 10 a 16° del campo visual. \nElementos de 28’-32’ arco visual (cuadros pequeños para visión central foveal).',
          infoBoxX: 21, infoBoxY: 1, infoBoxWidth: 45, infoBoxHeight: 40, buttonImageSource: Estimulo, 
          infoImage: [
            require('../../../assets/Potenciales/Visual/CamEstimulo2.png'),
          ]},  
        {
          x: 97, y: 2, width: 7, height: 15, text: '', type: 'ImgBtn',infoText: '',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, buttonImageSource: IMGGrafica, 
          infoImage: [
            require('../../../assets/Potenciales/Visual/CampCanal1.png'),
            require('../../../assets/Potenciales/Visual/CampCanal2.png'),
            require('../../../assets/Potenciales/Visual/CampCanal3.png'),
            require('../../../assets/Potenciales/Visual/CampCanal4.png'),
          ]},  
      ],
      
    ],
  },
  'Hemicampos': {
    imagenes: [
      require('../../../assets/Potenciales/Visual/HemiBs.png'),

    ],
    botones: [
      [
        {
          type: 'image', x: 81, y: 2, width: 7, height: 15, text: '', imageSource: require('../../../assets/Potenciales/Visual/Hem-10-20.jpg'), 
          popupImageX: 80, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Sistema, 
          popupTextX: 1, popupTextY: 7, popupTextWidth: 30, popupTextHeight: 80, popupText: 'Canal 1. T1-Fpz \nTemporal posterior izquierdo, colocar electrodo activo 10 cm lateral a la línea media occipital (Oz) referenciado a línea media frontal (Fpz).' + 
          '\nCanal 2. O1-Fpz \nOccipital lateral izquierdo, colocar electrodo activo 5 cm lateral a la línea media occipital (Oz) referenciado a línea media frontal (Fpz).' +
          '\nCanal 3. Oz-Fpz \nLínea media occipital, colocar electrodo activo 5 cm por arriba del inion, referenciado a Fpz (línea media frontal) 12 cm por arriba del nasion.'+
          '\nCanal 4. O2-Fpz \nOccipital lateral derecho, colocar electrodo activo 5 cm lateral a la línea media occipital (Oz) referenciado a línea media frontal (Fpz).'+
          '\nCanal 5. T2-Fpz \nTemporal posterior derecho, colocar electrodo activo 10 cm lateral a la línea media occipital (Oz) referenciado a línea media frontal (Fpz).', 
        },
        {
          x: 89, y: 2, width: 7, height: 15, text: '', type: 'TxtButtonImg',infoText: 'Patrón Reverso de Dameros por HEMICAMPOS \n(área retroquiasmática: quiasma y tracto óptico).'+
          '\nPrevio a realizar la valoración por hemicampos es necesario tener certeza de la integridad funcional a nivel prequiasmático, para ello se requiere la respuesta indemne por campo completo en cada ojo. \nA 100 cm de distancia, estimular de forma monocular con oclusión contralateral.'+
          '\nTamaño de pantalla de 10 a 16° del arco visual. \nElementos de 50’-90’ arco visual.',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 66, infoBoxHeight: 28, buttonImageSource: Estimulo, 
          infoImage: [
            require('../../../assets/Potenciales/Visual/HEMI-D-OJO-D.png'),
            require('../../../assets/Potenciales/Visual/HEMI-D-OJO-I.png'),
        ]},
        {
          x: 97, y: 2, width: 7, height: 15, text: '', type: 'TxtButtonImg',infoText: '',
          infoBoxX: 200, infoBoxY: 1, infoBoxWidth: 0, infoBoxHeight: 0, buttonImageSource: Estimulo, 
          infoImage: [
            require('../../../assets/Potenciales/Visual/HEMI-I-OJO-1.png'),
            require('../../../assets/Potenciales/Visual/HEMI-I-OJO-D.png'),
        ]},    
      ],
      
    ],
  },
  'Cuadrantes': {
    imagenes: [
      require('../../../assets/Potenciales/Visual/CuadBs.png'),

    ],
    botones: [
      [
        {
          type: 'image', x: 65, y: 2, width: 7, height: 15, text: '', imageSource: require('../../../assets/Potenciales/Visual/Hem-10-20.jpg'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Sistema, 
          popupTextX: 1, popupTextY: 7, popupTextWidth: 30, popupTextHeight: 80, popupText: 'Canal 1. T1-Fpz \nTemporal posterior izquierdo, colocar electrodo activo 10 cm lateral a la línea media occipital (Oz) referenciado a línea media frontal (Fpz).' + 
          '\nCanal 2. O1-Fpz \nOccipital lateral izquierdo) colocar electrodo activo 5 cm lateral a la línea media occipital (Oz) referenciado a línea media frontal (Fpz).' +
          '\nCanal 3. Oz-Fpz \nLínea media occipital, colocar electrodo activo 5 cm por arriba del inion, referenciado a Fpz (línea media frontal) 12 cm por arriba del nasion.'+
          '\nCanal 4. O2-Fpz \nOccipital lateral derecho, colocar electrodo activo 5 cm lateral a la línea media occipital (Oz) referenciado a línea media frontal (Fpz).'+
          '\nCanal 5. T2-Fpz \nTemporal posterior derecho, colocar electrodo activo 10 cm lateral a la línea media occipital (Oz) referenciado a línea media frontal (Fpz).', 
        },
        {
          x: 73, y: 2, width: 7, height: 15, text: '', type: 'TxtButtonImg',infoText: 'Patrón Reverso de Dameros por CUADRANTES \n(área retroquiasmática: quiasma y tracto óptico).'+
          '\nPrevio a realizar la valoración por hemicampos es necesario tener certeza de la integridad funcional a nivel prequiasmático, para ello se requiere la respuesta indemne por campo completo en cada ojo.'+
          '\nA 100 cm de distancia, estimular de forma monocular con oclusión contralateral. \nTamaño de pantalla de 10 a 16° del arco visual. \nElementos de 50’-90’ arco visual.',
          infoBoxX: 2, infoBoxY: 48, infoBoxWidth: 40, infoBoxHeight: 40, buttonImageSource: Estimulo, 
          infoImage: [
            require('../../../assets/Potenciales/Visual/VEP-CUAD_0003_CSI.png'),
        ]},
        {
          x: 81, y: 2, width: 7, height: 15, text: '', type: 'TxtButtonImg',infoText: 'Patrón Reverso de Dameros por CUADRANTES \n(área retroquiasmática: quiasma y tracto óptico).'+
          '\nPrevio a realizar la valoración por hemicampos es necesario tener certeza de la integridad funcional a nivel prequiasmático, para ello se requiere la respuesta indemne por campo completo en cada ojo.'+
          '\nA 100 cm de distancia, estimular de forma monocular con oclusión contralateral. \nTamaño de pantalla de 10 a 16° del arco visual. \nElementos de 50’-90’ arco visual.',
          infoBoxX: 2, infoBoxY: 2, infoBoxWidth: 40, infoBoxHeight: 40, buttonImageSource: Estimulo, 
          infoImage: [
            require('../../../assets/Potenciales/Visual/VEP-CUAD_0001_CII.png'),
        ]},
        {
          x: 89, y: 2, width: 7, height: 15, text: '', type: 'TxtButtonImg',infoText: 'Patrón Reverso de Dameros por CUADRANTES \n(área retroquiasmática: quiasma y tracto óptico).'+
          '\nPrevio a realizar la valoración por hemicampos es necesario tener certeza de la integridad funcional a nivel prequiasmático, para ello se requiere la respuesta indemne por campo completo en cada ojo.'+
          '\nA 100 cm de distancia, estimular de forma monocular con oclusión contralateral. \nTamaño de pantalla de 10 a 16° del arco visual. \nElementos de 50’-90’ arco visual.',
          infoBoxX: 57, infoBoxY: 48, infoBoxWidth: 40, infoBoxHeight: 40, buttonImageSource: Estimulo, 
          infoImage: [
            require('../../../assets/Potenciales/Visual/VEP-CUAD_0002_CSD.png'),
        ]},
        {
          x: 97, y: 2, width: 7, height: 15, text: '', type: 'TxtButtonImg',infoText: 'Patrón Reverso de Dameros por CUADRANTES \n(área retroquiasmática: quiasma y tracto óptico).'+
          '\nPrevio a realizar la valoración por hemicampos es necesario tener certeza de la integridad funcional a nivel prequiasmático, para ello se requiere la respuesta indemne por campo completo en cada ojo.'+
          '\nA 100 cm de distancia, estimular de forma monocular con oclusión contralateral. \nTamaño de pantalla de 10 a 16° del arco visual. \nElementos de 50’-90’ arco visual.',
          infoBoxX: 2, infoBoxY: 48, infoBoxWidth: 40, infoBoxHeight: 40, buttonImageSource: Estimulo, 
          infoImage: [
            require('../../../assets/Potenciales/Visual/VEP-CUAD_0000_CID.png'),
        ]},
      ],
      
    ],
  },
  'Goggles Led': {
    imagenes: [
      require('../../../assets/Potenciales/Visual/GoggBs.png'),
    ],
    botones: [
      [
        {
          x: 2, y: 25, width: 20, height: 10, text: 'O1-Fpz', type: 'info',infoText: 'Occipital lateral izquierdo, colocar electrodo activo 5 cm lateral a la línea media occipital (Oz) referenciado a línea media frontal (Fpz).',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Visual/GogCanal1.png'),},
        {
          x: 2, y: 43, width: 20, height: 10, text: 'Oz-Fpz', type: 'info',infoText: 'Línea media occipital, colocar electrodo activo 5 cm por arriba del inion, referenciado a Fpz (línea media frontal) 12 cm por arriba del nasion. ',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Visual/GogCanal1.png'),},
        {
          x: 2, y: 60, width: 20, height: 10, text: 'O2-Fpz', type: 'info',infoText: 'Occipital lateral derecho, colocar electrodo activo 5 cm lateral a la línea media occipital (Oz) referenciado a línea media frontal (Fpz).',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Visual/GogCanal1.png'),},

        {
          type: 'image', x: 73, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Visual/Gogg-10-20.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Sistema,
        },
        {
          type: 'image', x: 89, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Visual/Gogg-T01.png'), 
          popupImageX: 50, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: IMGTabla,
        },
        {
          type: 'image', x: 81, y: 2, width: 7, height: 15, text: '', imageSource: require('../../../assets/Potenciales/Visual/GogEstimulo.png'), 
          popupImageX: 20, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Estimulo  , 
          popupTextX: 1, popupTextY: 30, popupTextWidth: 28, popupTextHeight: 35, popupText: 'LED FLASH. (luces por emisión de diodos). Se ha recomendado estimular cada ojo por separado con 10 cm de distancia, lo común es colocar directamente los goggles sobre los globos oculares, el paciente debe mantener los ojos cerrados. ', 
        },
        {
          x: 97, y: 2, width: 7, height: 15, text: '', type: 'ImgBtn',infoText: '',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, buttonImageSource: IMGGrafica, 
          infoImage: [
            require('../../../assets/Potenciales/Visual/GogCanal1.png'),

        ]},  
      ],
    ],
  },
  'Tallo cerebral': {
    imagenes: [
      require('../../../assets/Potenciales/Auditivo/TalloBs.png'),

    ],
    botones: [
      [
        {
          x: 2, y: 20, width: 20, height: 10, text: 'Ai-Cz', type: 'info',infoText: 'Auricular ipsilateral o Mi (mastoides ipsilateral) con referencia al vertex. Registra todos los componentes obligatorios, la colocación en mastoides acorta la latencia de onda I en relación con el montaje auricular; el complejo IV-V es de gran amplitud, pero puede verse como una sola onda ensanchada.',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 60, infoBoxHeight: 19, infoImage: require('../../../assets/Potenciales/Auditivo/IPSILATERAL.png'),},
        {
          x: 2, y: 35, width: 20, height: 10, text: 'Ac-Cz', type: 'info',infoText: 'Auricular contralateral o Mc (mastoides contralateral) con referencia al vertex. Onda I ausente pero mejor diferenciación entre ondas IV y V que facilita la marcación individual.',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Auditivo/CONTRALATERAL.png'),},
        {
          x: 2, y: 50, width: 20, height: 10, text: 'Ai-Ac', type: 'info',infoText: 'Auricular ipsilateral (referencial interaural) con referencia contralateral o Mi-Mc. Genera el mejor registro y diferenciación de las ondas I y III cuando no son claras en el montaje ipsilateral por el artefacto de estímulo.',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 60, infoBoxHeight: 18, infoImage: require('../../../assets/Potenciales/Auditivo/LONGITUDINAL.png'),},
        {
          x: 2, y: 65, width: 20, height: 10, text: 'C5s-Cz', type: 'info',infoText: 'Proceso espinoso C5 o C2 (extracefálica) con referencia en vertex. Registra la mejor amplitud de la onda V.',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Auditivo/CERVICAL.png'),},  

        {
          type: 'image', x: 73, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Auditivo/Auditivo-10-20.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Sistema,
        },
        {
          type: 'image', x: 89, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Auditivo/Tallo-T01.png'), 
          popupImageX: 20, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: IMGTabla,
        },
        {
          type: 'image', x: 81, y: 2, width: 7, height: 15, text: '', imageSource: require('../../../assets/Potenciales/Auditivo/TallEstimulo.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Estimulo  , 
          popupTextX: 1, popupTextY: 30, popupTextWidth: 29, popupTextHeight: 45, popupText: 'Click monoauricular cuadrado a 10 ms de duración en modalidades de rarefacción y condensación. \n\n70 dBnHL de intensidad con enmascaramiento contralateral a 40 dB. \n\nFrecuencia a 11.1 Hz', 
        },
        {
          x: 97, y: 2, width: 7, height: 15, text: '', type: 'ImgBtn',infoText: '',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, buttonImageSource: IMGGrafica, 
          infoImage: [
            require('../../../assets/Potenciales/Auditivo/IPSILATERAL.png'),
            require('../../../assets/Potenciales/Auditivo/CONTRALATERAL.png'),
            require('../../../assets/Potenciales/Auditivo/LONGITUDINAL.png'),
            require('../../../assets/Potenciales/Auditivo/CERVICAL.png'),

        ]},  
      ],
      
    ],
  },
  'Curva latencia intensidad': {
    imagenes: [
      require('../../../assets/Potenciales/Auditivo/LatenBs.png'),
      
    ],
    botones: [
      [
        {
          x: 2, y: 75, width: 16, height: 10, text: 'Ai-Cz,', type: 'info',infoText: 'Auricular ipsilateral o Mi (mastoides ipsilateral) con referencia al vertex.',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Auditivo/LateCanal1.png'),},
        {
          x: 24, y: 75, width: 16, height: 10, text: 'Ac-Cz', type: 'info',infoText: 'Auricular contralateral o Mc (mastoides contralateral) con referencia al vertex.',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Auditivo/LateCanal2.png'),},
        {
          x: 70, y: 75, width: 16, height: 10, text: 'Ai-Ac', type: 'info',infoText: 'Auricular contralateral o Mc (mastoides contralateral) con referencia al vertex.',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 50, infoBoxHeight: 17, infoImage: require('../../../assets/Potenciales/Auditivo/CLI.png'),},

        {
          type: 'image', x: 73, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Auditivo/Auditivo-10-20.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Sistema,
        },
        {
          type: 'image', x: 89, y: 2, width: 7, height: 15, text: '',imageSource: require('../../../assets/Potenciales/Auditivo/Late-T01.png'), 
          popupImageX: 20, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: IMGTabla,
        },
        {
          type: 'image', x: 81, y: 2, width: 7, height: 15, text: '', imageSource: require('../../../assets/Potenciales/Auditivo/LateEstimulo.png'), 
          popupImageX: 0, popupImageY: 0, popupImageWidth: 98, popupImageHeight: 100, buttonImageSource: Estimulo  , 
          popupTextX: 1, popupTextY: 30, popupTextWidth: 30, popupTextHeight: 50, popupText: 'Click monoauricular cuadrado a 10 ms de duración en modalidad alterna. \n70 dB NA de intensidad con enmascaramiento contralateral a 40 dB. \nReducción progresiva de intensidad a 60, 40 y 20 dB.'+
          '\n\nFrecuencias: \nFase neurológica a 11.1 Hz. \nFase audiológica a 33.1 Hz. ', 
        },
        {
          x: 97, y: 2, width: 7, height: 15, text: '', type: 'ImgBtn',infoText: '',
          infoBoxX: 7, infoBoxY: 1, infoBoxWidth: 55, infoBoxHeight: 17, buttonImageSource: IMGGrafica, 
          infoImage: [
            require('../../../assets/Potenciales/Auditivo/LateCanal1.png'),
            require('../../../assets/Potenciales/Auditivo/LateCanal2.png'),
            require('../../../assets/Potenciales/Auditivo/CLI.png'),

        ]},  
      ],
      
    ],
  },
  
};

// const { width, height } = useWindowDimensions();

function PotencialesScreen(): React.JSX.Element {
  const { width, height } = useWindowDimensions();

  const [menuVisible, setMenuVisible] = useState(true);
  const [menuAbierto, setMenuAbierto] = useState<Record<string, boolean>>({});
  const [busqueda, setBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState<string[]>([]);
  const [inputLayout, setInputLayout] = useState({ x: 0, y: 0, width: 0 });
  const [opcionSeleccionada, setOpcionSeleccionada] = useState<string | null>(null);

  const toggleMenu = () => setMenuVisible(!menuVisible);

  const menuStyle = {
    ...styles.menu,
    height: height * 0.72,
    width: width * 0.50,
  };

  const toggleCategoria = (categoria: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    setMenuAbierto((prev) => {
      if (prev[categoria]) {
        return { ...prev, [categoria]: false };
      } else {
        const nuevoEstado: Record<string, boolean> = {};
        categorias.forEach((c) => (nuevoEstado[c.nombre] = false));
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

  useEffect(() => {
    setCurrentIndex(0);
  }, [opcionSeleccionada]);

  const handleSeleccionarOpcion = (opcion: string) => {
    setOpcionSeleccionada(opcion);
    setMenuVisible(false);
    setBusqueda('');
  };

  return (
    <View style={styles.container}>
      {menuVisible && (
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}

      {menuVisible && (
        <View style={styles.menuContainer}>
          <ScrollView style={menuStyle}>
            <View style={styles.searchRow}>
              <Text style={styles.tituloText}>Potenciales evocados</Text>
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
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleSeleccionarOpcion(sug)}
                    >
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
                    {menuAbierto[categoria.nombre] ? '▽' : '▶'} {categoria.nombre}
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
          {opcionSeleccionada &&
            contenidoPorOpcion[opcionSeleccionada] && (
              <GaleriaP
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

export default PotencialesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 10,
  },
  tituloText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Quando-Regular',
  },
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
    backgroundColor: 'rgba(255, 140, 0, 0.3)',
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
