import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TouchableWithoutFeedback, LayoutAnimation, UIManager, Dimensions, TextInput, KeyboardAvoidingView, useWindowDimensions    } from 'react-native';
import Orientation from 'react-native-orientation-locker';
import GaleriaP from './GaleriaMp';

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
    
    // 📢 NUEVOS PARÁMETROS AGREGADOS AQUÍ:
    magnifierSize?: number; 
    zoomFactor?: number;
    divX?: number;
    divY?: number;
};

type StaticTextData = {
  type: 'staticText';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text: string;
  rotateDeg?: number;
  infoImage?: any[];
  fontSize?: number;
  fontFamily?: string;
  textHighlights?: { text: string; }[];
};

type ButtonData = InfoButtonDataP | ImageButtonDataP | ImgButton | TxtButtonImg | StaticTextData;

type GalleryContent = {
  imagenes: any[];
  botones: ButtonData[][]; // Array de arrays de ButtonData, uno por cada imagen
};

// --- Datos de categorías y subcategorías (sin cambios en esta sección) ---
const categorias: { nombre: string; subcategorias: string[] }[] = [
  {
    nombre: 'Mano',
    subcategorias: [
        "Abductor Pollicis Brevis",
        "Flexor pollicis brevis (caput superficiale)",
        "Opponens pollicis",
        'Lumbricales manus (I–II)',
        'Lumbricales manus (III–IV)',
        'Pronator Quadratus',
        //'Adductor pollicis (caput obliquum + transversum)',
        //'Abductor Digiti Minimi',
        'Opponens Digiti Minimi',
        'Flexor Digiti Minimi',
    ],
  },
  {
    nombre: 'Antebrazo',
    subcategorias: [
        'Pronator Quadratus',
        "Flexor digitorum superficialis",
        //'Flexor digitorum profundus',
        'Flexor Pollicis Longus',
        'Palmaris Longus',
        'Flexor Carpi Radialis',
        'Flexor Carpi Ulnaris',
        'Pronator Teres',
        'Extensor Indicis',
        'Extensor Pollicis Brevis',
        'Extensor Pollicis Longus',
        'Extensor Carpi Ulnaris',
        'Abductor Pollicis Longus',
    ],
  },
    {
    nombre: 'Brazo',
    subcategorias: [
        'Anconeus',
        'Brachialis',
        'Triceps brachii (caput longum)',
        'Triceps brachii (caput laterale)',
        'Triceps brachii (caput mediale)',
        'Biceps brachii (caput longum)',
        'Biceps brachii (caput breve)',
        'Coracobrachialis',
    ],
  },
  {
    nombre: 'Hombro',
    subcategorias: [
        'Infraspinatus',
        'Supraspinatus',
        'Teres Major',

    ],
  },
  {
    nombre: 'Cuello',
    subcategorias: [
        'Levator Scapulae',
        'Sternocleidomastoideus'

    ],
  },

  {
    nombre: 'Torax',
    subcategorias: [
        'Serratus Anterior',
        'Pectoralis major (pars clavicularis)',
        'Pectoralis major (pars sternocostalis)',
        'Pectoralis Minor',

    ],
  },
    {
    nombre: 'Muslo',
    subcategorias: [
        'Semitendinosus',
        'Semimembranosus',
        'Biceps femoris (caput longum)',
        'Biceps femoris (caput breve)',
        'Gastrocnemius caput mediale',
    ],
  },
      {
    nombre: 'Cadera y Glúteo',
    subcategorias: [
        'Gluteus Maximus',
        'Gluteus Medius',
        'Gluteus Minimus',
        'Tensor Fasciae Latae',

    ],
  },
  {
    nombre: 'Pierna y pie',
    subcategorias: [
        'Gastrocnemius caput mediale',
        'Soleus',
        'Tibialis Anterior',
        'Tibialis Posterior',
        'Flexor Digitorum Longus',
        'Flexor Hallucis Longus',
        'Flexor Digitorum Brevis',
        'Flexor Hallucis Brevis',
        'Abductor Digiti Minimi Pedis',
        'Extensor Digitorum Longus',
        'Extensor Hallucis Longus',

        
    ],
  },


  
];
const IMGTabla = require('../../../assets/tecnicas/Info/I_Tabla_Gris.png');
const IMGGrafica = require('../../../assets/tecnicas/Info/mEDX_64_Valores.png');
const Estimulo = require('../../../assets/Potenciales/Estimulo.png');
const Sistema = require('../../../assets/Potenciales/Sistema.png');
const Registro = require('../../../assets/Potenciales/Registro.png');
const Buscar = require('../../../assets/Miografia/Search.png');
// --- Mapeo de opciones a sus imágenes y nuevos datos de botones con propiedades de infoBox ---
// NOTA: Ajusta todas las coordenadas (x, y) y los tamaños (width, height) de los botones,
// así como el contenido de 'infoText' y las nuevas propiedades 'infoBoxX', 'infoBoxY',
// 'infoBoxWidth', 'infoBoxHeight' según tus necesidades.
// Si no defines infoBoxX/Y/Width/Height, se usarán los valores por defecto del estilo.
const contenidoPorOpcion: Record<string, GalleryContent> = {

      'Abductor Pollicis Brevis': {
imagenes: [
        [
            [require('../../../assets/Miografia/Esqueleto1.jpeg'), 
            require('../../../assets/Miografia/ELE_01.png')
            ],
        [require('../../../assets/Miografia/Esqueleto2.jpeg'),]],
    ],
    botones: [
        // Botones para Abductor_Corto_Pulgar.png (Índice 0) infoImage: require('../../../assets/tecnicas/Info/MedianoMt-T-01.png')
        [
        {
        x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Mano supinada en reposo \n\nPuntos de referencia palpables: Eminencia tenar radial' +
            '\n\nPunto de entrada exacto: 1 cm distal y radial a la tuberosidad del escafoides \n\nOrientación y profundidad estimada de aguja: Perpendicular; 0.5–1 cm' + 
            '\n\nPrecauciones: Nervio mediano superficial; arteria radial en tabaquera anatómica \n\nManiobra de activación y/o nota ecográfica: Abducción del pulgar contra resistencia; (US útil para delimitar fibras superficiales)',
        infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, magnifierSize: 160, zoomFactor: 3, divY: 0.6, divX: 0.31, 
        infoImage: [
          require('../../../assets/Miografia/LupaELE_01.png'),
        ]},  

        { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'ABDUCTOR POLLICIS BREVIS',
          fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },

        { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Abductor corto del pulgar',
          fontSize: 14, fontFamily: 'sans-serif-medium'},

        { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. mediano (C8–T1)',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
        },
        { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Retináculo flexor y tubérculos del escafoides/trapecio',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
        },
        { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: base falange proximal del pulgar (radial)',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
        },
        { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Abducción CMC y MCP del pulgar/Colaboración en oposición',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
        },

        { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio tipo IIa (≈55%)',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
        },

        { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈60,000',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
        },

        { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈150–250',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
        },

      ]
    ],
    },

          'Flexor pollicis brevis (caput superficiale)': {
imagenes: [
        [
            [require('../../../assets/Miografia/Esqueleto1.jpeg'), 
            require('../../../assets/Miografia/ELE_02.png')
            ],
        [require('../../../assets/Miografia/Esqueleto2.jpeg'),]],
    ],
    botones: [
        [
        {
        x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Mano supinada \n\nPuntos de referencia palpables: Eminencia tenar central' +
            '\n\nPunto de entrada exacto: 1 cm distal a la flexura palmar tenar, sobre tendón FPL \n\nOrientación y profundidad estimada de aguja: Perpendicular; 0.5–1 cm' + 
            '\n\nPrecauciones: Arco palmar superficial; ramas digitales nerviosas \n\nManiobra de activación y/o nota ecográfica: Flexión MCP pulgar; (US opcional para separar fascículos)',
        infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, magnifierSize: 160, zoomFactor: 3, divY: 0.6, divX: 0.31, 
        infoImage: [
          require('../../../assets/Miografia/LupaELE_02.png'),
        ]},  

        { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'FLEXOR POLLICIS BREVIS (CAPUT SUPERFICIALE)',
          fontSize: 16, fontFamily: 'LuxoraGrotesk-Heavy',  },

        { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Flexor corto del pulgar (cabeza superficial)',
          fontSize: 14, fontFamily: 'sans-serif-medium'},

        { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. mediano (C8–T1)',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
        },
        { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Retináculo flexor y trapecio',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
        },
        { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: base falange proximal del pulgar',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
        },
        { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Flexión MCP pulgar/Colaboración en oposición',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
        },

        { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio tipo IIa (≈55%)',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
        },

        { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈50,000',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
        },

        { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈120–200',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
        },
      ]],},

          'Opponens pollicis': {
imagenes: [
        [
            [require('../../../assets/Miografia/Esqueleto1.jpeg'), 
            require('../../../assets/Miografia/ELE_03.png')
            ],
        [require('../../../assets/Miografia/Esqueleto2.jpeg'),]],
    ],
    botones: [
        [
        {
        x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Mano supinada \n\nPuntos de referencia palpables: Borde radial del 1.º metacarpiano' +
            '\n\nPunto de entrada exacto: 1 cm proximal al pliegue tenar, borde radial del 1.º metacarpiano \n\nOrientación y profundidad estimada de aguja: Oblicua medial; 0.5–1 cm' + 
            '\n\nPrecauciones: Nervio digital palmar radial; arteria radial superficial \n\nManiobra de activación y/o nota ecográfica: Oposición pulgar-meñique; (US útil en fascículos profundos)',
        infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, magnifierSize: 160, zoomFactor: 2.2, divY: 0.9, divX: 0.43, 
        infoImage: [
          require('../../../assets/Miografia/LupaELE_03.png'),
        ]},  

        { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'OPPONENS POLLICIS',
          fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },

        { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Oponente del pulgar',
          fontSize: 14, fontFamily: 'sans-serif-medium'},

        { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. mediano (C8–T1)',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
        },
        { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Trapecio y retináculo flexor',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
        },
        { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: borde lateral 1.º metacarpiano',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
        },
        { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Oposición del pulgar (flexión, abducción, rotación)/Estabilización CMC pulgar',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
        },

        { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio tipo IIa (≈55%)',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
        },

        { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈40,000',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
        },

        { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈100–150',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
        },
      ]],},

          'Lumbricales manus (I–II)': {
imagenes: [
        [
            [require('../../../assets/Miografia/Esqueleto1.jpeg'), 
            require('../../../assets/Miografia/ELE_04.png')
            ],
        [require('../../../assets/Miografia/Esqueleto2.jpeg'),]],
    ],
    botones: [
        [
        {
        x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Mano supinada, dedos extendidos \n\nPuntos de referencia palpables: Espacio interóseo radial de 2.º–3.º MC' +
            '\n\nPunto de entrada exacto: 1–1.5 cm distal a pliegue palmar distal, radial a tendones FDP \n\nOrientación y profundidad estimada de aguja: Perpendicular; 0.5–1 cm' + 
            '\n\nPrecauciones: Nervios digitales medianos; arco palmar superficial \n\nManiobra de activación y/o nota ecográfica: Flexión MCP dedos 2–3; (US recomendable para separar de interóseos)',
        infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, magnifierSize: 160, zoomFactor: 2.2, divY: 0.9, divX: 0.43, 
        infoImage: [
          require('../../../assets/Miografia/LupaELE_04.png'),
        ]},  

        { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'Lumbricales manus (I–II)',
          fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },

        { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Lumbricales de la mano (1.º–2.º)',
          fontSize: 14, fontFamily: 'sans-serif-medium'},

        { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. mediano (C8–T1)',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
        },
        { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Tendones FDP radial (dedos 2–3)',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
        },
        { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Expansiones dorsales 2–3',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
        },
        { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Flexión MCP y extensión IP dedos 2–3/Control fino pinza',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
        },

        { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio tipo I (≈60%)',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
        },

        { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈25,000 cada uno',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
        },

        { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈60–90',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
        },
      ]],},

      'Lumbricales manus (III–IV)': {
        imagenes: [
                [
                    [require('../../../assets/Miografia/Esqueleto1.jpeg'), 
                    require('../../../assets/Miografia/ELE_04.png')
                    ],
                [require('../../../assets/Miografia/Esqueleto2.jpeg'),]],
            ],
            botones: [
                [
                {
                x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Mano supinada \n\nPuntos de referencia palpables: Espacios interóseos ulnar de 4.º–5.º MC' +
                    '\n\nPunto de entrada exacto: 1–1.5 cm distal a pliegue palmar distal, ulnar a tendones FDP \n\nOrientación y profundidad estimada de aguja: Perpendicular; 0.5–1 cm' + 
                    '\n\nPrecauciones: Nervios digitales ulnares; arco palmar superficial \n\nManiobra de activación y/o nota ecográfica: Flexión MCP dedos 4–5; (US útil para delimitar fibras)',
                infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, magnifierSize: 160, zoomFactor: 2.2, divY: 0.9, divX: 0.43, 
                infoImage: [
                  require('../../../assets/Miografia/LupaELE_04.png'),
                ]},  

                { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'LUMBRICALES MANUS (III–IV)',
                  fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },

                { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Lumbricales de la mano (3.º–4.º)',
                  fontSize: 14, fontFamily: 'sans-serif-medium'},

                { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. ulnar (C8–T1)',
                  fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                },
                { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Tendones FDP ulnar (dedos 4–5)',
                  fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                },
                { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Expansiones dorsales 4–5',
                  fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                },
                { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Flexión MCP y extensión IP dedos 4–5/Control fino pinza',
                  fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                },

                { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio tipo I (≈60%)',
                  fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                },

                { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈25,000 cada uno',
                  fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                },

                { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈60–90',
                  fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                },
              ]],},

                'Pronator Quadratus': {
imagenes: [
        [
            [require('../../../assets/Miografia/Esqueleto1.jpeg'), 
            require('../../../assets/Miografia/ELE_05.png')
            ],
        [require('../../../assets/Miografia/Esqueleto2.jpeg'),]],
    ],
    botones: [
        [
        {
        x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Antebrazo supinado, muñeca neutra \n\nPuntos de referencia palpables: Borde distal del radio y ulna (cerca de muñeca)' +
            '\n\nPunto de entrada exacto: 2–3 cm proximal al pliegue de la muñeca, cara anterior radial \n\nOrientación y profundidad estimada de aguja: Perpendicular profunda; 2–3 cm' + 
            '\n\nPrecauciones: Arteria radial lateral y ulnar medial; nervio interóseo anterior cercano \n\nManiobra de activación y/o nota ecográfica: Pronación distal; (US casi imprescindible por localización profunda y vasos cercanos)',
        infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, magnifierSize: 160, zoomFactor: 2.2, divY: 0.9, divX: 0.43, 
        infoImage: [
          require('../../../assets/Miografia/LupaELE_05.png'),
        ]},  

        { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'PRONATOR QUADRATUS',
          fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },

        { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Pronador cuadrado',
          fontSize: 14, fontFamily: 'sans-serif-medium'},

        { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. interóseo anterior (C8–T1)',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
        },
        { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Ulna distal',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
        },
        { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Radio distal',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
        },
        { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Pronación distal del antebrazo/Estabilización radioulnar distal',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
        },

        { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio tipo I (≈60%)',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
        },

        { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈60,000',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
        },

        { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈150–250',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
        },
      ]],},

      'Adductor pollicis (caput obliquum + transversum)': {
        imagenes: [
                [
                    [require('../../../assets/Miografia/Esqueleto1.jpeg'), 
                    require('../../../assets/Miografia/ELE_12.png')
                    ],
                [require('../../../assets/Miografia/Esqueleto2.jpeg'),]],
            ],
            botones: [
                [
                {
                x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Mano supinada \n\nPuntos de referencia palpables: 1.º espacio interóseo' +
                    '\n\nPunto de entrada exacto: En el 1.º espacio interóseo, 1–1.5 cm distal a la comisura \n\nOrientación y profundidad estimada de aguja: Perpendicular oblicua; 0.8–1.5 cm' + 
                    '\n\nPrecauciones: Arco palmar profundo; nervio ulnar profundo \n\nManiobra de activación y/o nota ecográfica: Aducción pulgar contra resistencia; (US recomendada para delimitar arco vascular)',
                infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, magnifierSize: 160, zoomFactor: 2.2, divY: 0.9, divX: 0.43, 
                infoImage: [
                  //require('../../../assets/Miografia/LupaELE_12.png'),
                ]},  

                { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'ADDUCTOR POLLICIS (CAPUT OBLIQUUM + TRANSVERSUM)',
                  fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },

                { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Aductor del pulgar',
                  fontSize: 14, fontFamily: 'sans-serif-medium'},

                { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. ulnar profundo (C8–T1)',
                  fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                },
                { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Cabeza oblicua: trapecio, trapezoide, grande, bases MC 2–3l',
                  fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                },
                { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: base falange proximal pulgar; cabeza transversa: cuerpo 3.º MC → base falange proximal',
                  fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                },
                { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Aducción CMC/MCP del pulgar/Colaboración en pinza',
                  fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                },

                { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio tipo I (≈60%)',
                  fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                },

                { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈70,000',
                  fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                },

                { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈150–250',
                  fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                },
              ]],},

      'Abductor Digiti Minimi': {
        imagenes: [
                [
                    [require('../../../assets/Miografia/Esqueleto1.jpeg'), 
                    require('../../../assets/Miografia/ELE_18.png')
                    ],
                [require('../../../assets/Miografia/Esqueleto2.jpeg'),]],
            ],
            botones: [
                [
                {
                x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Mano supinada \n\nPuntos de referencia palpables: Eminencia hipotenar' +
                    '\n\nPunto de entrada exacto: 1 cm distal a pisiforme, borde ulnar palma \n\nOrientación y profundidad estimada de aguja: Perpendicular; 0.5–1 cm' + 
                    '\n\nPrecauciones: Ramas nerviosas digitales ulnares; arteria ulnar superficial \n\nManiobra de activación y/o nota ecográfica: Abducción meñique; (US útil para ubicar vientre superficial)',
                infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, magnifierSize: 160, zoomFactor: 2.2, divY: 0.9, divX: 0.43, 
                infoImage: [
                  //require('../../../assets/Miografia/LupaELE_18.png'),
                ]},  

                { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'ADDUCTOR DIGITI MINIMI',
                  fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },

                { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Abductor del meñique',
                  fontSize: 14, fontFamily: 'sans-serif-medium'},

                { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. ulnar (C8–T1)',
                  fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                },
                { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Pisiforme',
                  fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                },
                { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: base falange proximal 5.º dedo',
                  fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                },
                { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Abducción 5.º dedo/Flexión ligera MCP',
                  fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                },

                { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio tipo IIa (≈55%)',
                  fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                },

                { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈40,000',
                  fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                },

                { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈100–150',
                  fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                },
              ]],},

        'Opponens Digiti Minimi': {
          imagenes: [
                  [
                      [require('../../../assets/Miografia/Esqueleto1.jpeg'), 
                      require('../../../assets/Miografia/ELE_19.png')
                      ],
                  [require('../../../assets/Miografia/Esqueleto2.jpeg'),]],
              ],
              botones: [
                  [
                  {
                  x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Mano supinada \n\nPuntos de referencia palpables: Eminencia hipotenar medial' +
                      '\n\nPunto de entrada exacto: 1 cm proximal al pliegue hipotenar, sobre 5.º MC \n\nOrientación y profundidad estimada de aguja: Oblicua radial; 0.5–1 cm' + 
                      '\n\nPrecauciones: Ramas nerviosas digitales ulnares; arco palmar superficial \n\nManiobra de activación y/o nota ecográfica: Oposición meñique; (US útil en planos profundos)',
                  infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, magnifierSize: 160, zoomFactor: 2.2, divY: 0.9, divX: 0.43, 
                  infoImage: [
                    require('../../../assets/Miografia/LupaELE_19.png'),
                  ]},  

                  { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'OPPONENS DIGITI MINIMI',
                    fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },

                  { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Oponente del meñique',
                    fontSize: 14, fontFamily: 'sans-serif-medium'},

                  { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. ulnar (C8–T1)',
                    fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                  },
                  { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Gancho del ganchoso y retináculo flexor',
                    fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                  },
                  { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: borde medial 5.º metacarpiano',
                    fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                  },
                  { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Oposición del meñique/Flexión ligera CMC',
                    fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                  },

                  { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio tipo IIa (≈55%)',
                    fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                  },

                  { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈30,000',
                    fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                  },

                  { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈70–100',
                    fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                  },
                ]],},

        'Flexor Digiti Minimi': {
          imagenes: [
                  [
                      [require('../../../assets/Miografia/Esqueleto1.jpeg'), 
                      require('../../../assets/Miografia/ELE_20.png')
                      ],
                  [require('../../../assets/Miografia/Esqueleto2.jpeg'),]],
              ],
              botones: [
                  [
                  {
                  x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Mano supinada \n\nPuntos de referencia palpables: Eminencia hipotenar' +
                      '\n\nPunto de entrada exacto: 1 cm distal y radial a pisiforme \n\nOrientación y profundidad estimada de aguja: Perpendicular; 0.5–1 cm' + 
                      '\n\nPrecauciones: Arteria ulnar superficial; nervios digitales ulnares \n\nManiobra de activación y/o nota ecográfica: Flexión MCP 5.º dedo; (US opcional)',
                  infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, magnifierSize: 160, zoomFactor: 2.2, divY: 0.9, divX: 0.43, 
                  infoImage: [
                    require('../../../assets/Miografia/LupaELE_20.png'),
                  ]},  

                  { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'FLEXOR DIGITI MINIMI',
                    fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },

                  { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Flexor corto del meñique',
                    fontSize: 14, fontFamily: 'sans-serif-medium'},

                  { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. ulnar (C8–T1)',
                    fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                  },
                  { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Gancho del ganchoso y retináculo flexor',
                    fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                  },
                  { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: base falange proximal 5.º dedo',
                    fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                  },
                  { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Flexión MCP 5.º dedo/Colabora en oposición',
                    fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                  },

                  { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio tipo IIa (≈55%)',
                    fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                  },

                  { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈35,000',
                    fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                  },

                  { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈80–120',
                    fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                  },
                ]],},

      'Flexor Pollicis Brevis': {
        imagenes: [
                [
                    [require('../../../assets/Miografia/Esqueleto1.jpeg'), 
                    require('../../../assets/Miografia/ELE_12.png')
                    ],
                [require('../../../assets/Miografia/Esqueleto2.jpeg'),]],
            ],
            botones: [
                [
                {
                x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Mano supinada \n\nPuntos de referencia palpables: 1.º espacio interóseo' +
                    '\n\nPunto de entrada exacto: En el 1.º espacio interóseo, 1–1.5 cm distal a la comisura \n\nOrientación y profundidad estimada de aguja: Perpendicular oblicua; 0.8–1.5 cm' + 
                    '\n\nPrecauciones: Arco palmar profundo; nervio ulnar profundo \n\nManiobra de activación y/o nota ecográfica: Aducción pulgar contra resistencia; (US recomendada para delimitar arco vascular)',
                infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                infoImage: [
                  //require('../../../assets/Miografia/LupaELE_13.png'),
                ]},  

                { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'ADDUCTOR POLLICIS (CAPUT OBLIQUUM + TRANSVERSUM)',
                  fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },

                { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Aductor del pulgar',
                  fontSize: 14, fontFamily: 'sans-serif-medium'},

                { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. ulnar profundo (C8–T1)',
                  fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                },
                { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Cabeza oblicua: trapecio, trapezoide, grande, bases MC 2–3l',
                  fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                },
                { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: base falange proximal pulgar; cabeza transversa: cuerpo 3.º MC → base falange proximal',
                  fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                },
                { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Aducción CMC/MCP del pulgar/Colaboración en pinza',
                  fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                },

                { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio tipo I (≈60%)',
                  fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                },

                { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈70,000',
                  fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                },

                { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈150–250',
                  fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                },
              ]],},

'Flexor digitorum superficialis': {
imagenes: [
        [
            [require('../../../assets/Miografia/Esqueleto1.jpeg'), 
            require('../../../assets/Miografia/ELE_08.png')
            ],
        [require('../../../assets/Miografia/Esqueleto2.jpeg'),]],
    ],
    botones: [
        // Botones para Abductor_Corto_Pulgar.png (Índice 0) infoImage: require('../../../assets/tecnicas/Info/MedianoMt-T-01.png')
        [
        {
        x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Antebrazo supinado \n\nPuntos de referencia palpables: Vientre medial profundo a FCR y PL' +
            '\n\nPunto de entrada exacto: Mitad del antebrazo, 2–3 cm medial a línea media \n\nOrientación y profundidad estimada de aguja: Oblicua posterolateral; 2–3 cm' + 
            '\n\nPrecauciones: Arteria ulnar medial profunda; nervio mediano en arco superficial \n\nManiobra de activación y/o nota ecográfica: Flexión PIP de dedos 2–5; (US recomendable para ubicar vientre profundo)',
        infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
        infoImage: [
          require('../../../assets/Miografia/LupaELE_08.png'),
        ]},  
        { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'FLEXOR DIGITORUM SUPERFICIALIS',
          fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },

        { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Flexor superficial de los dedos',
          fontSize: 14, fontFamily: 'sans-serif-medium'},

        { type: 'staticText', x: 1, y: 36, width: 20, height: 15, text: 'Inervación: N. mediano (C7–T1)',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
        },
        { type: 'staticText', x: 1, y: 48, width: 20, height: 15, text: 'Origen: Epicóndilo medial, radio proximal y coronoides',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
        },
        { type: 'staticText', x: 1, y: 59, width: 20, height: 15, text: 'Inserción: falanges medias dedos 2–5',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
        },
        { type: 'staticText', x: 1, y: 73, width: 20, height: 15, text: 'Función: Flexión interfalángica proximal/Flexión de muñeca y codo',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
        },

        { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio tipo I (≈65%)',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
        },

        { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈110,000',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
        },

        { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈300–500',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
        },

      ]
    ],
    },

    'Flexor digitorum profundus': {
imagenes: [
        [
            [require('../../../assets/Miografia/Esqueleto1.jpeg'), 
            require('../../../assets/Miografia/ELE_07.png')
            ],
        [require('../../../assets/Miografia/Esqueleto2.jpeg'),]],
    ],
    botones: [
        // Botones para Abductor_Corto_Pulgar.png (Índice 0) infoImage: require('../../../assets/tecnicas/Info/MedianoMt-T-01.png')
        [

        {
        x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Antebrazo supinado \n\nPuntos de referencia palpables: Cara medial proximal del antebrazo' +
            '\n\nPunto de entrada exacto: Mitad proximal del antebrazo, 2–3 cm medial \n\nOrientación y profundidad estimada de aguja: Oblicua anterolateral profunda; 3–4 cm' + 
            '\n\nPrecauciones: Arteria ulnar medial; nervio mediano/ulnar cercanos \n\nManiobra de activación y/o nota ecográfica: Flexión DIP de dedos 2–5; (US altamente recomendada para localizar fascículos profundos)',
        infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
        infoImage: [
          require('../../../assets/Miografia/LupaELE_06.png'),
        ]},
        // {
        //     x: 83, y: 65, width: 22, height: 20, text: 'PUNTO MOTOR', type: 'info',infoText: 'Posición del paciente: Antebrazo supinado \n\nPuntos de referencia palpables: Cara medial proximal del antebrazo' +
        //     '\n\nPunto de entrada exacto: Mitad proximal del antebrazo, 2–3 cm medial \n\nOrientación y profundidad estimada de aguja: Oblicua anterolateral profunda; 3–4 cm' + 
        //     '\n\nPrecauciones: Arteria ulnar medial; nervio mediano/ulnar cercanos \n\nManiobra de activación y/o nota ecográfica: Flexión DIP de dedos 2–5; (US altamente recomendada para localizar fascículos profundos)',
        //     infoBoxX: 62, infoBoxY: 1, infoBoxWidth: 35, infoBoxHeight: 80, infoImage: require('../../../assets/Miografia/LupaELE_01.png'),},

        { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'FLEXOR DIGITORUM PROFUNDUS',
          fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },

        { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Flexor profundo de los dedos',
          fontSize: 14, fontFamily: 'sans-serif-medium'},

        { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Mitad medial: N. ulnar (C8–T1); mitad lateral: N. mediano (interóseo anterior, C8–T1)',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
        },
        { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Ulna proximal, membrana interósea',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
        },
        { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Falanges distales 2–5',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
        },
        { type: 'staticText', x: 1, y: 73, width: 18, height: 15, text: 'Función: Flexión interfalángica distal/flexión de muñeca',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
        },

        { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio tipo I (≈65%)',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
        },

        { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: 400 000',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
        },

        { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: 800-1200',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
        },

      ] ],
    },

        'Flexor Pollicis Longus': {
imagenes: [
        [
            [require('../../../assets/Miografia/Esqueleto1.jpeg'), 
            require('../../../assets/Miografia/ELE_06.png')
            ],
        [require('../../../assets/Miografia/Esqueleto2.jpeg'),]],
    ],
    botones: [
        // Botones para Abductor_Corto_Pulgar.png (Índice 0) infoImage: require('../../../assets/tecnicas/Info/MedianoMt-T-06.png')
        [

        {
        x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Antebrazo supinado \n\nPuntos de referencia palpables: Radio distal anterior; tendón palpable en muñeca' +
            '\n\nPunto de entrada exacto: Un tercio medio anterior radial del antebrazo \n\nOrientación y profundidad estimada de aguja: Perpendicular; 2–3 cm' + 
            '\n\nPrecauciones: Arteria radial lateral; nervio interóseo anterior cercano \n\nManiobra de activación y/o nota ecográfica: Flexión IP del pulgar; (US muy recomendada para diferenciar de FDP y evitar nervio)',
        infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
        infoImage: [
          require('../../../assets/Miografia/LupaELE_06.png'),
        ]},
        
        // {
        //     x: 83, y: 65, width: 22, height: 20, text: 'PUNTO MOTOR', type: 'info',infoText: 'Posición del paciente: Antebrazo supinado \n\nPuntos de referencia palpables: Radio distal anterior; tendón palpable en muñeca' +
        //     '\n\nPunto de entrada exacto: Un tercio medio anterior radial del antebrazo \n\nOrientación y profundidad estimada de aguja: Perpendicular; 2–3 cm' + 
        //     '\n\nPrecauciones: Arteria radial lateral; nervio interóseo anterior cercano \n\nManiobra de activación y/o nota ecográfica: Flexión IP del pulgar; (US muy recomendada para diferenciar de FDP y evitar nervio)',
        //     infoBoxX: 62, infoBoxY: 1, infoBoxWidth: 35, infoBoxHeight: 80, infoImage: require('../../../assets/Miografia/LupaELE_06.png'),},

        { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'FLEXOR POLLICIS LONGUS',
          fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },

        { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Flexor largo del pulgar',
          fontSize: 14, fontFamily: 'sans-serif-medium'},

        { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. interóseo anterior (C8–T1, rama del mediano)',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
        },
        { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Radio anterior (mitad) y membrana interósea',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
        },
        { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Falange distal del pulgar',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
        },
        { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Flexión interfalángica del pulgar/Flexión MCP y CMC pulgar',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
        },

        { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Mixto',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
        },

        { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: 400 000',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
        },

        { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: 800-1200',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
        },

      ]
    ],
    },

            'Palmaris Longus': {
imagenes: [
        [
            [require('../../../assets/Miografia/Esqueleto1.jpeg'), 
            require('../../../assets/Miografia/ELE_09.png')
            ],
        [require('../../../assets/Miografia/Esqueleto2.jpeg'),]],
    ],
    botones: [
        // Botones para Abductor_Corto_Pulgar.png (Índice 0) infoImage: require('../../../assets/tecnicas/Info/MedianoMt-T-01.png')
        [

        {
          x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Antebrazo supinado, codo extendido \n\nPuntos de referencia palpables: Tendón visible al oponer pulgar-meñique' +
              '\n\nPunto de entrada exacto: Un tercio medio del antebrazo, medial al FCR \n\nOrientación y profundidad estimada de aguja: Perpendicular; 1–1.5 cm' + 
              '\n\nPrecauciones: Arteria mediana accesoria (variable); nervio mediano profundo \n\nManiobra de activación y/o nota ecográfica: Flexión de muñeca ligera; (US opcional; músculo ausente en ~15% población)',
          infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
          infoImage: [
            require('../../../assets/Miografia/LupaELE_09.png'),
        ]},
        // {
        //     x: 83, y: 65, width: 22, height: 20, text: 'PUNTO MOTOR', type: 'info',infoText: 'Posición del paciente: Antebrazo supinado, codo extendido \n\nPuntos de referencia palpables: Tendón visible al oponer pulgar-meñique' +
        //     '\n\nPunto de entrada exacto: Un tercio medio del antebrazo, medial al FCR \n\nOrientación y profundidad estimada de aguja: Perpendicular; 1–1.5 cm' + 
        //     '\n\nPrecauciones: Arteria mediana accesoria (variable); nervio mediano profundo \n\nManiobra de activación y/o nota ecográfica: Flexión de muñeca ligera; (US opcional; músculo ausente en ~15% población)',
        //     infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, infoImage: require('../../../assets/Miografia/LupaELE_09.png'),},

        { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'PALMARIS LONGUS',
          fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },

        { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Palmar largo',
          fontSize: 14, fontFamily: 'sans-serif-medium'},

        { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. mediano (C7–C8)',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
        },
        { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Epicóndilo medial',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
        },
        { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Aponeurosis palmar',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
        },
        { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Flexión de la muñeca/Tensar aponeurosis palmar',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
        },

        { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio tipo IIa (≈55%)',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
        },

        { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈80,000',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
        },

        { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈200–300',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
        },

      ]
    ],
    },

            'Flexor Carpi Radialis': {
imagenes: [
        [
            [require('../../../assets/Miografia/Esqueleto1.jpeg'), 
            require('../../../assets/Miografia/ELE_10.png')
            ],
        [require('../../../assets/Miografia/Esqueleto2.jpeg'),]],
    ],
    botones: [
        // Botones para Abductor_Corto_Pulgar.png (Índice 0) infoImage: require('../../../assets/tecnicas/Info/MedianoMt-T-01.png')
        [

        {
        x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Antebrazo supinado, muñeca neutra \n\nPuntos de referencia palpables: Tendón palpable radial a PL y ulnar a BR' +
            '\n\nPunto de entrada exacto: Un tercio proximal del antebrazo, 2 cm medial al BR \n\nOrientación y profundidad estimada de aguja: Perpendicular; 1–2 cm' + 
            '\n\nPrecauciones: Arteria radial lateral profunda; nervio mediano medial \n\nManiobra de activación y/o nota ecográfica: Flexión radial de muñeca; (US útil para ubicar tendón FCR vs PL)',
        infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
        infoImage: [
          require('../../../assets/Miografia/LupaELE_10.png'),
        ]},  


        // {
        //     x: 83, y: 65, width: 22, height: 20, text: 'PUNTO MOTOR', type: 'info',infoText: 'Posición del paciente: Antebrazo supinado, codo extendido \n\nPuntos de referencia palpables: Tendón visible al oponer pulgar-meñique' +
        //     '\n\nPunto de entrada exacto: Un tercio medio del antebrazo, medial al FCR \n\nOrientación y profundidad estimada de aguja: Perpendicular; 1–1.5 cm' + 
        //     '\n\nPrecauciones: Arteria mediana accesoria (variable); nervio mediano profundo \n\nManiobra de activación y/o nota ecográfica: Flexión de muñeca ligera; (US opcional; músculo ausente en ~15% población)',
        //     infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, infoImage: require('../../../assets/Miografia/LupaELE_09.png'),},

        { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'FLEXOR CARPI RADIALIS',
          fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },

        { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Flexor radial del carpo',
          fontSize: 14, fontFamily: 'sans-serif-medium'},

        { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. mediano (C6–C7)',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
        },
        { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Epicóndilo medial',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
        },
        { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción:  base 2.º–3.º metacarpiano',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
        },
        { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Flexión y abducción de la muñeca/Flexión accesoria del codo',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
        },

        { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio tipo I (≈60%)',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
        },

        { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈100,000',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
        },

        { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈250–400',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
        },

      ]
    ],
    },

        'Flexor Carpi Ulnaris': {
          imagenes: [
                  [
                      [require('../../../assets/Miografia/Esqueleto1.jpeg'), 
                      require('../../../assets/Miografia/ELE_22.png')
                      ],
                  [require('../../../assets/Miografia/Esqueleto2.jpeg'),]],
              ],
              botones: [
                  [
                  {
                  x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Antebrazo supinado \n\nPuntos de referencia palpables: Tendón cubital palpable proximal a pisiforme' +
                      '\n\nPunto de entrada exacto: Un tercio proximal del antebrazo, 2 cm medial \n\nOrientación y profundidad estimada de aguja: Perpendicular; 1–2 cm' + 
                      '\n\nPrecauciones: Nervio cubital en surco epitroclear proximal y distalmente; arteria ulnar profunda \n\nManiobra de activación y/o nota ecográfica: Flexión cubital de muñeca; (US útil para guiar y evitar nervio ulnar)',
                  infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                  infoImage: [
                    require('../../../assets/Miografia/LupaELE_22.png'),
                  ]},  

                  { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'FLEXOR CARPI ULNARIS',
                    fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },

                  { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Flexor cubital del carpo',
                    fontSize: 14, fontFamily: 'sans-serif-medium'},

                  { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. ulnar (C7–T1)',
                    fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                  },
                  { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Epicóndilo medial y olécranon',
                    fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                  },
                  { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: pisiforme, ganchoso y 5.º metacarpiano',
                    fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                  },
                  { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Flexión y aducción de la muñeca/Flexión accesoria del codo',
                    fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                  },

                  { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio tipo I (≈65%)',
                    fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                  },

                  { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈110,000',
                    fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                  },

                  { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈300–500',
                    fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                  },
                ]],},

            'Pronator Teres': {
imagenes: [
        [
            [require('../../../assets/Miografia/Esqueleto1.jpeg'), 
            require('../../../assets/Miografia/ELE_11.png')
            ],
        [require('../../../assets/Miografia/Esqueleto2.jpeg'),]],
    ],
    botones: [
        // Botones para Abductor_Corto_Pulgar.png (Índice 0) infoImage: require('../../../assets/tecnicas/Info/MedianoMt-T-01.png')
        [

        {
        x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Sedente, codo a 90° \n\nPuntos de referencia palpables: Epicóndilo medial; borde radial proximal' +
            '\n\nPunto de entrada exacto: 2–3 cm distal a pliegue del codo, línea medial del antebrazo \n\nOrientación y profundidad estimada de aguja: Oblicua laterodistal; 1.5–2.5 cm' + 
            '\n\nPrecauciones: Nervio mediano pasa entre sus fascículos; arteria ulnar profunda medial \n\nManiobra de activación y/o nota ecográfica: Pronación contra resistencia; (US muy recomendable para evitar nervio mediano)',
        infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
        infoImage: [
          require('../../../assets/Miografia/LupaELE_11.png'),
        ]},  

        { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'PRONATOR TERES',
          fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },

        { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Pronador redondo',
          fontSize: 14, fontFamily: 'sans-serif-medium'},

        { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. mediano (C6–C7)',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
        },
        { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Epicóndilo medial y apófisis coronoides',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
        },
        { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: radio (tercio medio, cara lateral)',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
        },
        { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Pronación del antebrazo/Flexión accesoria del codo',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
        },

        { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio tipo IIa (≈55%)',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
        },

        { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈120,000',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
        },

        { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈300–500',
          fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
        },

      ]
    ],
    },

        'Extensor Indicis': {
          imagenes: [
                  [
                      [require('../../../assets/Miografia/Esqueleto2.jpeg'), 
                      require('../../../assets/Miografia/ELE_23.png')
                      ],
                  [require('../../../assets/Miografia/Esqueleto1.jpeg'),]],
              ],
              botones: [
                  [
                  {
                  x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Antebrazo en pronación, mano apoyada \n\nPuntos de referencia palpables: Espacio entre ED y cubital posterior proximal al carpo' +
                      '\n\nPunto de entrada exacto: 2–3 cm proximal al carpo, borde ulnar del ED \n\nOrientación y profundidad estimada de aguja: Perpendicular; 1–2 cm' + 
                      '\n\nPrecauciones: Arteria interósea posterior profunda; nervio interóseo posterior \n\nManiobra de activación y/o nota ecográfica: Extensión aislada del índice; (US útil para diferenciar de ED)',
                  infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                  infoImage: [
                    require('../../../assets/Miografia/LupaELE_23.png'),
                  ]},  

                  { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'EXTENSOR INDICIS',
                    fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },

                  { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Extensor del índice',
                    fontSize: 14, fontFamily: 'sans-serif-medium'},

                  { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. interóseo posterior (C7–C8)',
                    fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                  },
                  { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Ulna distal y membrana interósea',
                    fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                  },
                  { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: expansión extensora del 2.º dedo',
                    fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                  },
                  { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Extensión del índice/Extensión de muñeca (secundaria)',
                    fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                  },

                  { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio tipo IIa (≈55%)',
                    fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                  },

                  { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈60,000',
                    fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                  },

                  { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈150–250',
                    fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                  },
                ]],},

          'Extensor Pollicis Brevis': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto2.jpeg'), 
                        require('../../../assets/Miografia/ELE_24.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto1.jpeg'),]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Antebrazo en pronación \n\nPuntos de referencia palpables: Tabaquera anatómica (tendón radial a EPL)' +
                        '\n\nPunto de entrada exacto: 4–5 cm proximal a la muñeca, cara posterorradial \n\nOrientación y profundidad estimada de aguja: Perpendicular; 1–2 cm' + 
                        '\n\nPrecauciones: Arteria radial lateral; nervio interóseo posterior \n\nManiobra de activación y/o nota ecográfica: Extensión MCP pulgar; (US útil para diferenciar de APL)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      require('../../../assets/Miografia/LupaELE_24.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'EXTENSOR POLLICIS BREVIS',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Extensor corto del pulgar',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. interóseo posterior (C7–C8)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Radio distal y membrana interósea',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: base falange proximal del pulgar',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Extensión MCP pulgar/Colabora en abducción radial',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio tipo IIa (≈55%)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈80,000',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈200–300',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},

          'Extensor Pollicis Longus': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto2.jpeg'), 
                        require('../../../assets/Miografia/ELE_25.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto1.jpeg'),]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Antebrazo en pronación, pulgar relajado \n\nPuntos de referencia palpables: Tabaquera anatómica (tendón EPL ulnar a EPB/APL)' +
                        '\n\nPunto de entrada exacto: 5–6 cm proximal a la muñeca, cara posteroulnar radial \n\nOrientación y profundidad estimada de aguja: Oblicua distal‑radial; 2–3 cm' + 
                        '\n\nPrecauciones: Arteria radial en tabaquera; nervio interóseo posterior \n\nManiobra de activación y/o nota ecográfica: Extensión IP pulgar; (US recomendable en tabaquera para evitar arteria radial)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      require('../../../assets/Miografia/LupaELE_25.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'EXTENSOR POLLICIS LONGUS',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Extensor largo del pulgar',  
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. interóseo posterior (C7–C8)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Ulna distal, membrana interósea',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: falange distal del pulgar',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Extensión interfalángica del pulgar/Extensión MCP y CMC del pulgar',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio tipo IIa (≈55%)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈120,000',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈250–400',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},

          'Extensor Carpi Ulnaris': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto2.jpeg'), 
                        require('../../../assets/Miografia/ELE_28.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto1.jpeg'),]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Antebrazo en pronación \n\nPuntos de referencia palpables: Tabaquera anatómica radial' +
                        '\n\nPunto de entrada exacto: 6–7 cm proximal a la muñeca, borde posterorradial \n\nOrientación y profundidad estimada de aguja: Perpendicular; 1–2 cm' + 
                        '\n\nPrecauciones: Arteria radial superficial; nervio interóseo posterior \n\nManiobra de activación y/o nota ecográfica: Abducción radial del pulgar; (US muy recomendable en zona compartimental)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      require('../../../assets/Miografia/LupaELE_26.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'EXTENSOR CARPI ULNARIS',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Extensor cubital del carpo',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. interóseo posterior (C7–C8)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Epicóndilo lateral y ulna posterior',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Base metacarpiano V',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Extiende y aduce muñeca',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio tipo I (≈60%)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈130,000',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈300–500',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},

          'Abductor Pollicis Longus': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto1.jpeg'), 
                        require('../../../assets/Miografia/ELE_26.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto2.jpeg'),]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Antebrazo en pronación \n\nPuntos de referencia palpables: Tabaquera anatómica radial' +
                        '\n\nPunto de entrada exacto: 6–7 cm proximal a la muñeca, borde posterorradial \n\nOrientación y profundidad estimada de aguja: Perpendicular; 1–2 cm' + 
                        '\n\nPrecauciones: Arteria radial superficial; nervio interóseo posterior \n\nManiobra de activación y/o nota ecográfica: Abducción radial del pulgar; (US muy recomendable en zona compartimental)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      require('../../../assets/Miografia/LupaELE_26.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'ABDUCTOR POLLICIS LONGUS',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Abductor largo del pulgar',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. interóseo posterior (C7–C8)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Ulna, radio y membrana interósea (tercio medio)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: base 1.º metacarpiano',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Abducción radial CMC pulgar/Colabora extensión pulgar',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio tipo IIa (≈55%)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈100,000',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈250–400',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},

          'Anconeus': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto2.jpeg'), 
                          require('../../../assets/Miografia/ELE_32.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto1.jpeg'),
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Sedente con codo flexo a 90° \n\nPuntos de referencia palpables: Epicóndilo lateral; borde del olécranon' +
                        '\n\nPunto de entrada exacto: 1 cm distal y posterior al epicóndilo lateral (vientre pequeño) \n\nOrientación y profundidad estimada de aguja: Perpendicular; 0.8–1.5 cm' + 
                        '\n\nPrecauciones: Nervio interóseo posterior (rama radial) más distal; bursa olecraniana \n\nManiobra de activación y/o nota ecográfica: Extensión suave del codo; (US útil para delimitar vientre pequeño y evitar bursa)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      require('../../../assets/Miografia/LupaELE_32.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'ANCONEUS',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Ancóneo',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. radial (C7–C8)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Epicóndilo lateral del húmero',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Cara lateral del olécranon y ulna proximal',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Asistencia a extensión del codo/Estabilización posterolateral del codo',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio tipo I (≈60%)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈40,000',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈100–200',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},

          'Brachialis': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto1.jpeg'), 
                        require('../../../assets/Miografia/ELE_40.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto2.jpeg'),
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Sedente, codo 90°, antebrazo en pronación (para minimizar bíceps) \n\nPuntos de referencia palpables: Borde lateral del bíceps; surco intermuscular lateral' +
                        '\n\nPunto de entrada exacto: 2–3 cm distal al 50% del brazo, 1–1.5 cm lateral al tendón bicipital \n\nOrientación y profundidad estimada de aguja: Oblicua posteromedial; 2–3 cm (profundo bajo bíceps)' + 
                        '\n\nPrecauciones: Arteria braquial medial; nervio radial lateral profundo; protección ósea humeral anterior \n\nManiobra de activación y/o nota ecográfica: Flexión del codo isométrica en pronación; (US muy recomendada para ver plano profundo bajo bíceps)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      require('../../../assets/Miografia/LupaELE_40.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'BRACHIALIS',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Braquial anterior',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. musculocutáneo (C5–C6) ± rama al n. radial (C7)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Mitad distal de la cara anterior del húmero',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Apófisis coronoides y tuberosidad de la ulna',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Flexión pura del codo (todas las posiciones de prono/supi)/Estabilidad articular',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio tipo I (≈65%)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈220,000',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈500–800',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},

          'Coracobrachialis': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto1.jpeg'), 
                        require('../../../assets/Miografia/ELE_42.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto2.jpeg'),
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Sedente, hombro en ligera flexión y aducción \n\nPuntos de referencia palpables: Surco bicipital; cara medial del brazo (vientre profundo delgado)' +
                        '\n\nPunto de entrada exacto: En tercio proximal-medial del brazo, 2 cm medial al bíceps \n\nOrientación y profundidad estimada de aguja: Oblicua anterolateral; 2–3 cm (profundo)' + 
                        '\n\nPrecauciones: Nervio musculocutáneo perfora el vientre; arteria braquial medial \n\nManiobra de activación y/o nota ecográfica: Flexión/adducción suave del hombro; (US recomendada para localizar vientre estrecho y evitar nervio)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      require('../../../assets/Miografia/LupaELE_42.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'CORACOBRACHIALIS',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Coracobraquial',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. musculocutáneo (C5–C7)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Apófisis coracoides',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Cara medial del húmero (mitad)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Flexión y aducción glenohumeral/Estabilización anterior del hombro',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio tipo I (≈60%)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈90,000',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈200–400',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},

          'Triceps brachii (caput longum)': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto2.jpeg'), 
                          require('../../../assets/Miografia/ELE_34.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto1.jpeg'),
                      
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Prono o sedente, brazo relajado \n\nPuntos de referencia palpables: Borde posterior del brazo; surco entre cabeza larga y lateral' +
                        '\n\nPunto de entrada exacto: Mitad proximal del brazo posterior, 2 cm medial a línea media posterior \n\nOrientación y profundidad estimada de aguja: Perpendicular; 1.5–3 cm' + 
                        '\n\nPrecauciones: Nervio radial en canal de torsión (más distal/lateral); arteria braquial profunda \n\nManiobra de activación y/o nota ecográfica: Extensión del codo contra resistencia; (US opcional para ubicar septos entre cabezas)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      require('../../../assets/Miografia/LupaELE_34.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'TRICEPS BRACHII (CAPUT LONGUM)',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Tríceps braquial (cabeza larga)',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. radial (C7–C8)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Tubérculo infraglenoideo',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Olecranon ulnae',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Extensión del codo/Extensión-adducción del hombro (secundaria)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Mixto (≈50% tipo I, 50% tipo IIa)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈360,000',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈800–1,200',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},

          'Triceps brachii (caput laterale)': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto2.jpeg'), 
                          require('../../../assets/Miografia/ELE_33.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto1.jpeg'),
                      
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Prono o sedente \n\nPuntos de referencia palpables: Cara posterolateral del brazo; referencia septo lateral' +
                        '\n\nPunto de entrada exacto: A 5–7 cm proximal al epicóndilo lateral, 2 cm lateral a la línea media posterior \n\nOrientación y profundidad estimada de aguja: Perpendicular; 1.5–3 cm' + 
                        '\n\nPrecauciones: Nervio radial en canal espiral (proximal) y en septo lateral (distal) \n\nManiobra de activación y/o nota ecográfica: Extensión del codo contra resistencia; (US útil para evitar trayecto radial distal)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      require('../../../assets/Miografia/LupaELE_33.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'TRICEPS BRACHII (CAPUT LATERALE)',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Tríceps braquial (cabeza lateral)',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. radial (C7–C8)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Cara posterior del húmero por encima del surco radial',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Olecranon',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Extensión del codo/Estabilización del codo',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Mixto (≈50% tipo I, 50% tipo IIa)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈360,000',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈800–1,200',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},

          'Triceps brachii (caput mediale)': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto1.jpeg'), 
                        
                        ],
                    [require('../../../assets/Miografia/Esqueleto2.jpeg'),
                      require('../../../assets/Miografia/ELE_35.png')
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Prono/sedente \n\nPuntos de referencia palpables: Cara posteromedial del brazo; surco medial del tríceps' +
                        '\n\nPunto de entrada exacto: A 6–8 cm proximal al epicóndilo medial, 2 cm medial a línea media posterior \n\nOrientación y profundidad estimada de aguja: Perpendicular; 1.5–3 cm' + 
                        '\n\nPrecauciones: Nervio ulnar (más medial en surco epitroclear distal); arteria braquial profunda proximal \n\nManiobra de activación y/o nota ecográfica: Extensión isométrica; (US recomendable para visualizar ulnar distalmente)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      require('../../../assets/Miografia/LupaELE_35.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'TRICEPS BRACHII (CAPUT MEDIALE)',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Tríceps braquial (cabeza medial)',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. radial (C7–C8)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Cara posterior del húmero por debajo del surco radial',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Olecranon',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Extensión del codo/Estabilización del codo',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Mixto (≈50% tipo I, 50% tipo IIa)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈360,000',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈800–1,200',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},


          'Infraspinatus': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto2.jpeg'), 
                        require('../../../assets/Miografia/ELE_43.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto1.jpeg'),
                      
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Sedente/prono, brazo colgando \n\nPuntos de referencia palpables: Espina de la escápula; fosa infraespinosa' +
                        '\n\nPunto de entrada exacto: 2–3 cm inferior a espina escapular, línea medioescapular \n\nOrientación y profundidad estimada de aguja: Perpendicular; 1.5–2.5 cm' + 
                        '\n\nPrecauciones: Nervio supraescapular; vasos circunflejos escapulares \n\nManiobra de activación y/o nota ecográfica: Rotación externa contra resistencia; (US opcional para delimitar espesor)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, magnifierSize: 160, zoomFactor: 2.2, divY: 0.41, divX: 0.356, 
                    infoImage: [
                      require('../../../assets/Miografia/LupaELE_43.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'INFRASPINATUS',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Infraespinoso',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. supraescapular (C5–C6)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Fosa infraespinosa',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Tubérculo mayor (carilla media)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Rotación externa del hombro/Estabilización glenohumeral',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Mixto (≈55% tipo I, 45% tipo IIa)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈140,000',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈400–600',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},

          'Supraspinatus': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto2.jpeg'), 
                          require('../../../assets/Miografia/ELE_44.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto1.jpeg'),
                      
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Sedente, brazo colgando \n\nPuntos de referencia palpables: Espina de la escápula; fosa supraespinosa' +
                        '\n\nPunto de entrada exacto: 1–2 cm superior a espina escapular, medial al acromion \n\nOrientación y profundidad estimada de aguja: Oblicua inferolateral; 1.5–2.5 cm' + 
                        '\n\nPrecauciones: Nervio supraescapular; arteria supraescapular; pleura profunda más medial \n\nManiobra de activación y/o nota ecográfica: Abducción inicial contra resistencia; (US recomendable para evitar estructuras neurovasculares)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      require('../../../assets/Miografia/LupaELE_44.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'SUPRASPINATUS',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },  

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Supraespinoso',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. supraescapular (C5–C6)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Fosa supraespinosa',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Tubérculo mayor (carilla superior)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Abducción inicial del hombro/Estabilización glenohumeral',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio tipo I (≈65%)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈120,000',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈300–500',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},







          'Levator Scapulae': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto1.jpeg'), 
                        
                        ],
                    [require('../../../assets/Miografia/Esqueleto2.jpeg'),
                      require('../../../assets/Miografia/ELE_46.png')
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Sedente, hombro relajado \n\nPuntos de referencia palpables: Borde superomedial escapular; masa posterolateral del cuello' +
                        '\n\nPunto de entrada exacto: 2–3 cm superomedial al ángulo superomedial escapular \n\nOrientación y profundidad estimada de aguja: Perpendicular; 1.5–2.5 cm' + 
                        '\n\nPrecauciones: Nervio accesorio variable superficial; arteria transversa del cuello \n\nManiobra de activación y/o nota ecográfica: Elevación escapular contra resistencia; (US útil para diferenciar de esplenios)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      require('../../../assets/Miografia/LupaELE_46.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'ELEVATOR SCAPULAE',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },  

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Elevador de la escápula',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. dorsal de la escápula (C5) ± ramos C3–C4',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Tubérculos posteriores C1–C4',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Ángulo superomedial de la escápula',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Elevar escápula - inclinación ipsilateral/Rotación ipsilateral leve',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio tipo I (≈60%)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈180,000',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈500–700',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},



          'Serratus Anterior': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto1.jpeg'), 
                        require('../../../assets/Miografia/ELE_47.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto2.jpeg'),
                      //require('../../../assets/Miografia/ELE_47.png')
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: ' Posición del paciente: Sedente o decúbito lateral contrario, brazo en 90° de flexión \n\nPuntos de referencia palpables: Líneas axilares media/anterior; digitaciones costales palpables' +
                        '\n\nPunto de entrada exacto: Sobre digitación 6.ª–7.ª en línea axilar media \n\nOrientación y profundidad estimada de aguja: Perpendicular; 1–2 cm' + 
                        '\n\nPrecauciones: Pleura y vasos intercostales; riesgo de neumotórax si profunda \n\nManiobra de activación y/o nota ecográfica: Empuje de pared (‘push-up plus’); (US muy recomendada para ver pleura deslizante y espesor muscular)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      require('../../../assets/Miografia/LupaELE_47.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'SERRATUS ANTERIOR',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },  

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Serrato anterior',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. torácico largo (C5–C7)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Costillas I–VIII/IX',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Cara costal del borde medial de la escápula',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Protracción y rotación superior de escápula/Fijación escapular',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: ~45–55% I; 35–45% IIa; ≤10% IIx',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ~1.0–1.3 millones',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: Sin dato',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},


          'Teres Major': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto2.jpeg'), 
                        require('../../../assets/Miografia/ELE_48.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto1.jpeg'),
                      
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Prono/sedente \n\nPuntos de referencia palpables: Ángulo inferior escapular; borde lateral' +
                        '\n\nPunto de entrada exacto: 2–3 cm superior al ángulo inferior, línea axilar posterior \n\nOrientación y profundidad estimada de aguja: Perpendicular; 2–3 cm' + 
                        '\n\nPrecauciones: Vasos circunflejos escapulares; nervio subescapular profundo \n\nManiobra de activación y/o nota ecográfica: Extensión/adducción contra resistencia; (US opcional)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      require('../../../assets/Miografia/LupaELE_48.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'TERES MAJOR',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },  

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Redondo mayor',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. subescapular inferior (C5–C6)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Ángulo inferior de la escápula',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Labio medial del surco bicipital',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 24, height: 16, text: 'Función: Rotación interna, aducción, extensión del hombro/Estabilización humeral',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Mixto (≈50% tipo I, 50% tipo IIa)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈100,000',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈300–500',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},

          'Pectoralis major (pars clavicularis)': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto1.jpeg'), 
                        require('../../../assets/Miografia/ELE_50.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto2.jpeg'),
                      //require('../../../assets/Miografia/ELE_48.png')
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Supino o sedente, brazo en ligera abducción (20–30°) \n\nPuntos de referencia palpables: Borde inferior de clavícula; esternón; surco deltopectoral' +
                        '\n\nPunto de entrada exacto: 2–3 cm inferior a la clavícula, medial al surco deltopectoral \n\nOrientación y profundidad estimada de aguja: Perpendicular; 1–2 cm' + 
                        '\n\nPrecauciones: Vasos toracoacromiales; evitar punción muy medial por cercanía de pleura \n\nManiobra de activación y/o nota ecográfica: Aducción horizontal contra resistencia; (US útil para delimitar grosor y evitar pleura en biotipos delgados)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      require('../../../assets/Miografia/LupaELE_50.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'PECTORALIS MAJOR (PARS CLAVICULARIS)',
                      fontSize: 15, fontFamily: 'LuxoraGrotesk-Heavy',  },  

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Pectoral mayor (porción clavicular)',
                      fontSize: 13, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. pectoral lateral (C5–C6) ± pectoral medial (C7–T1)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Mitad medial de la clavícula',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Cresta del tubérculo mayor',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Flexión y aducción del hombro/Rotación interna, aproximación horizontal',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: ~45–55% I; 35–45% IIa; ≤10% IIx',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ~1.8–2.2 millones',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: Sin dato normativo',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},

          'Pectoralis major (pars sternocostalis)': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto1.jpeg'), 
                        require('../../../assets/Miografia/ELE_50.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto2.jpeg'),
                      //require('../../../assets/Miografia/ELE_48.png')
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Supino, brazo en ligera abducción \n\nPuntos de referencia palpables: Borde esternal; cartílagos costales; pezón' +
                        '\n\nPunto de entrada exacto: A 3–4 cm lateral del borde esternal a nivel del 4.º espacio intercostal \n\nOrientación y profundidad estimada de aguja: Perpendicular; 1.5–2.5 cm' + 
                        '\n\nPrecauciones: Pleura parietal profunda; vasos mamarios internos (parasternales) \n\nManiobra de activación y/o nota ecográfica: Aducción/rotación interna contra resistencia; (US recomendada en región parasternal para evitar pleura/vasos)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      //require('../../../assets/Miografia/LupaELE_50.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'PECTORALIS MAJOR (PARS STERNOCOSTALIS)',
                      fontSize: 16, fontFamily: 'LuxoraGrotesk-Heavy',  },  

                    { type: 'staticText', x: 1, y: 24, width: 28, height: 20, text: 'Pectoral mayor (porción esternocostal)',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 38, width: 25, height: 15, text: 'Inervación: N. pectoral medial (C8–T1) ± pectoral lateral (C5–C7)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Esternón y cartílagos costales II–VI ',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Cresta del tubérculo mayor',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 25, height: 15, text: 'Función: Aducción y rotación interna / Descenso de cintura escapular, inspiración accesoria',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: ~45–55% I; 35–45% IIa; ≤10% IIx',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ~1.8–2.2 millones',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: Sin dato normativo',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},

          'Pectoralis Minor': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto1.jpeg'), 
                        require('../../../assets/Miografia/ELE_51.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto2.jpeg'),
                      //require('../../../assets/Miografia/ELE_48.png')
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Supino, brazo en ligera abducción y rotación externa \n\nPuntos de referencia palpables: Proceso coracoides; espacios intercostales 3–5' +
                        '\n\nPunto de entrada exacto: 2 cm inferior y medial al coracoides, hacia inserción costal \n\nOrientación y profundidad estimada de aguja: Oblicua inferomedial; 2–3 cm' + 
                        '\n\nPrecauciones: Pleura y arteria toracoacromial; plexo braquial superolateral \n\nManiobra de activación y/o nota ecográfica: Protracción escapular (‘empuje’); (US recomendable por pleura subyacente)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      require('../../../assets/Miografia/LupaELE_51.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'PECTORALIS MINOR',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },  

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Pectoral menor',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. pectoral medial (C8–T1) ± pectoral lateral (C5–C7)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Costillas III–V',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Proceso coracoides',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Basculación anterior y descenso de escápula / Inspiración accesoria',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: ~55–60% I; 30–40% IIa; ≤10% IIx',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ~0.35–0.6 millones',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: Sin dato',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},


          'Sternocleidomastoideus': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto1.jpeg'), 
                        require('../../../assets/Miografia/ELE_52.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto2.jpeg'),
                      //require('../../../assets/Miografia/ELE_48.png')
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Sedente, cabeza neutra \n\nPuntos de referencia palpables: Borde anterior/lateral del ECM; mastoides' +
                        '\n\nPunto de entrada exacto: Mitad del vientre, 2 cm por encima de clavícula, borde anterior \n\nOrientación y profundidad estimada de aguja: Oblicua posterior; 1–2 cm' + 
                        '\n\nPrecauciones: Vena yugular interna profunda; paquete carotídeo medial; nervio accesorio dentro del vientre \n\nManiobra de activación y/o nota ecográfica: Rotar cabeza contralateral contra resistencia; (US útil si variantes o vasos prominentes)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      require('../../../assets/Miografia/LupaELE_52.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'STERNOCLEIDOMASTOIDEUS',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },  

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Esternocleidomastoideo',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. accesorio (XI) + ramos C2–C3',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Manubrio esternal y tercio medial clavícula',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Proceso mastoides y línea nucal',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 24, height: 15, text: 'Función: Rotación contralateral de cabeza / Inclinación ipsilateral - flexión cervical',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: ~55% I, 35% IIa, 10% IIx',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ~1 millón',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: Alto (~1000)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},

          'Trapezius (pars descendens)': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto1.jpeg'), 
                        require('../../../assets/Miografia/ELE_53.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto2.jpeg'),
                      //require('../../../assets/Miografia/ELE_48.png')
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Sedente, hombros relajados \n\nPuntos de referencia palpables: Borde superior del trapecio; clavícula lateral' +
                        '\n\nPunto de entrada exacto: A 3–4 cm por encima de la clavícula, sobre vientre muscular \n\nOrientación y profundidad estimada de aguja: Perpendicular; 1–1.5 cm' + 
                        '\n\nPrecauciones: Ramas del plexo cervical superficial; vasos transversos del cuello \n\nManiobra de activación y/o nota ecográfica: Elevación del hombro contra resistencia; (US no suele ser necesaria)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      //require('../../../assets/Miografia/LupaELE_52.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'TRAPEZIUS (PARS DESCENDENS)',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },  

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Trapecio (porción descendente)',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. accesorio (XI) + ramos C3–C4',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Línea nucal superior y lig. nucal',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Clavícula lateral y acromion',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Elevación escapular - extensión cervical asistida / Inclinación contralateral leve',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Mixto; predominio tipo I en tono postural, con fibras tipo II para elevación rápida',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: Unidades motoras de tamaño medio; reclutamiento escalonado para control escapular fino; actividad tónica postural continua',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    // { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ...',
                    //   fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    // },
                  ]],},


          'Semitendinosus': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto2.jpeg'), 
                        require('../../../assets/Miografia/ELE_56.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto1.jpeg'),
                      //require('../../../assets/Miografia/ELE_48.png')
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Prono \n\nPuntos de referencia palpables: Masa posteromedial proximal' +
                        '\n\nPunto de entrada exacto: Mitad proximal medial, 2 cm medial a línea posterior \n\nOrientación y profundidad estimada de aguja: Perpendicular; 2.5–3.5 cm' + 
                        '\n\nPrecauciones: Nervio ciático (lateral); vena safena parva distal \n\nManiobra de activación y/o nota ecográfica: Extensión/flexión; (US útil)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      require('../../../assets/Miografia/LupaELE_56.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'SEMITENDINOSUS',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },  

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Semitendinoso',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. tibial (L5–S2)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Tuberosidad isquiática',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Pata de ganso',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Extensión de cadera / Flexión de rodilla y RI',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio I/IIa',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈0.8–1.0 millones',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈900–1,200',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},

          'Semimembranosus': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto2.jpeg'), 
                        require('../../../assets/Miografia/ELE_57.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto1.jpeg'),
                      //require('../../../assets/Miografia/ELE_48.png')
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Prono \n\nPuntos de referencia palpables: Masa posteromedial profunda' +
                        '\n\nPunto de entrada exacto: Tercio proximal medial, profundo a ST \n\nOrientación y profundidad estimada de aguja: Oblicua anterolateral; 4–5 cm' + 
                        '\n\nPrecauciones: Nervio ciático lateral; vasos perforantes \n\nManiobra de activación y/o nota ecográfica: Flexión/RI; (US muy recomendada)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      require('../../../assets/Miografia/LupaELE_57.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'SEMIMEMBRANOSUS',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },  

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Semimembranoso',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. tibial (L5–S2)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Tuberosidad isquiática',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Cóndilo medial tibial',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Extensión de cadera / Flexión rodilla y RI',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio I/IIa',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈0.9–1.1 millones',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈1,000–1,300',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},

          'Biceps femoris (caput longum)': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto2.jpeg'), 
                        require('../../../assets/Miografia/ELE_58.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto1.jpeg'),
                      //require('../../../assets/Miografia/ELE_48.png')
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Prono \n\nPuntos de referencia palpables: Isquion; masa posterolateral proximal' +
                        '\n\nPunto de entrada exacto: Mitad proximal posterior, 2 cm lateral a línea media \n\nOrientación y profundidad estimada de aguja: Perpendicular; 3–4 cm' + 
                        '\n\nPrecauciones: Nervio ciático; arterias perforantes \n\nManiobra de activación y/o nota ecográfica: Extensión cadera/flexión rodilla; (US recomendable)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      require('../../../assets/Miografia/LupaELE_58.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'BICEPS FEMORIS (CAPUT LONGUM)',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },  

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Bíceps femoral (cabeza larga)',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. tibial (L5–S2)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Tuberosidad isquiática',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Cabeza del peroné',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Extensión de cadera / Flexión de rodilla y RE',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio IIa/IIx',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈0.9–1.2 millones',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈1,000–1,300',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},

          'Biceps femoris (caput breve)': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto2.jpeg'), 
                        require('../../../assets/Miografia/ELE_59.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto1.jpeg'),
                      //require('../../../assets/Miografia/ELE_48.png')
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Prono \n\nPuntos de referencia palpables: Isquion; masa posterolateral proximal' +
                        '\n\nPunto de entrada exacto: Mitad proximal posterior, 2 cm lateral a línea media \n\nOrientación y profundidad estimada de aguja: Perpendicular; 3–4 cm' + 
                        '\n\nPrecauciones: Nervio ciático; arterias perforantes \n\nManiobra de activación y/o nota ecográfica: Extensión cadera/flexión rodilla; (US recomendable)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      //require('../../../assets/Miografia/LupaELE_58.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'BICEPS FEMORIS (CAPUT BREVE)',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },  

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Bíceps femoral (cabeza corta)',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: Nervio peroneo común (ramo a caput breve), L5–S2',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Línea áspera (labio lateral) y septo intermuscular lateral del fémur',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Cabeza del peroné (tendón conjunt',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Extensión de cadera / Flexión de rodilla y RE',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio IIa/IIx',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈0.9–1.2 millones',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈1,000–1,300',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},

          'Biceps brachii (caput longum)': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto1.jpeg'), 
                        require('../../../assets/Miografia/ELE_41.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto2.jpeg'),
                      //require('../../../assets/Miografia/ELE_48.png')
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Sedente, codo a 90°, antebrazo en supinación neutra \n\nPuntos de referencia palpables: Surco bicipital; vientre proximal (porción larga más lateral)' +
                        '\n\nPunto de entrada exacto: En el tercio medio del brazo, 2 cm lateral a la línea media anterior \n\nOrientación y profundidad estimada de aguja: Perpendicular; 1–2.5 cm' + 
                        '\n\nPrecauciones: Nervio musculocutáneo en el vientre; arteria braquial medial profunda \n\nManiobra de activación y/o nota ecográfica: Supinación contra resistencia; (US útil para diferenciar fibras largas/cortas y evitar arteria braquial)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      require('../../../assets/Miografia/LupaELE_41.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'BICEPS BRACHII (CAPUT LONGUM)',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },  

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Bíceps braquial (cabeza larga)',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. musculocutáneo (C5–C6)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Tubérculo supraglenoideo (y labrum)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: tuberosidad del radio y aponeurosis bicipital',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Supinación del antebrazo / Flexión del codo y asistencia en flexión del hombro',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio tipo IIa (≈55%)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈260,000',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈600–900',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},

          'Biceps brachii (caput breve)': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto1.jpeg'), 
                        require('../../../assets/Miografia/ELE_41.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto2.jpeg'),
                      //require('../../../assets/Miografia/ELE_48.png')
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Sedente, codo a 90° \n\nPuntos de referencia palpables: Borde medial del vientre bicipital (cabeza corta más medial)' +
                        '\n\nPunto de entrada exacto: Tercio medio del brazo, 2 cm medial a la línea media anterior \n\nOrientación y profundidad estimada de aguja: Perpendicular; 1–2.5 cm' + 
                        '\n\nPrecauciones: Arteria y vena braquial en canal medial; nervio mediano más distal \n\nManiobra de activación y/o nota ecográfica: Flexión del codo contra resistencia; (US recomendada para identificar paquete vasculonervioso medial)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      //require('../../../assets/Miografia/LupaELE_41.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'BICEPS BRACHII (CAPUT BREVE)',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },  

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Bíceps braquial (cabeza corta)',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. musculocutáneo (C5–C6)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Apófisis coracoides',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: tuberosidad del radio y aponeurosis bicipital',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Flexión del codo / Supinación; estabilización anterior del hombro',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio tipo IIa (≈55%)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈260,000',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈600–900',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},


          'Gastrocnemius caput mediale': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto2.jpeg'), 
                        require('../../../assets/Miografia/ELE_60.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto1.jpeg'),
                      //require('../../../assets/Miografia/ELE_60.png')
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Prono, pie fuera camilla \n\nPuntos de referencia palpables: Cóndilos femorales; masa medial' +
                        '\n\nPunto de entrada exacto: 6–8 cm distal a pliegue poplíteo (vientre medial) \n\nOrientación y profundidad estimada de aguja: Perpendicular; 1.5–2.5 cm' + 
                        '\n\nPrecauciones: Vena safena parva; N. tibial proximal \n\nManiobra de activación y/o nota ecográfica: Flexión plantar; (US opcional)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      require('../../../assets/Miografia/LupaELE_60.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'GASTROCNEMIUS CAPUT MEDIALE',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },  

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Gastrocnemio (cabeza medial)',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. tibial (S1–S2)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Cóndilo medial femoral',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Tendón de Aquiles',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Flexión plantar / Flexión ligera de rodilla',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio IIa/IIx',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈0.9–1.2 millones',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈1,000–1,300',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},

          'Soleus': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto2.jpeg'), 
                        require('../../../assets/Miografia/ELE_61.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto1.jpeg'),
                      //require('../../../assets/Miografia/ELE_48.png')
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Prono o sedente rodilla 90° \n\nPuntos de referencia palpables: Línea sólea; vientre profundo' +
                        '\n\nPunto de entrada exacto: Mitad de la pierna, 2–3 cm medial a línea media posterior \n\nOrientación y profundidad estimada de aguja: Oblicua anteromedial; 2–3 cm' + 
                        '\n\nPrecauciones: N. tibial y A. tibial posterior profundos \n\nManiobra de activación y/o nota ecográfica: Flexión plantar isométrica; (US recomendada)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      require('../../../assets/Miografia/LupaELE_61.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'SOLEUS',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },  

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Sóleo',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. tibial (S1–S2)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Cabeza/ cuello fíbula; línea sólea',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Tendón de Aquiles',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Flexión plantar (rodilla flexa) / Bomba venosa',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio I (≈80% I, 15% IIa, 5% IIx)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈1.0–1.5 millones',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈1,200–1,600',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},

          'Tibialis Posterior': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto2.jpeg'), 
                        require('../../../assets/Miografia/ELE_62.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto1.jpeg'),
                      //require('../../../assets/Miografia/ELE_48.png')
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Decúbito lateral/supino \n\nPuntos de referencia palpables: Borde tibial posterior medial; maléolo medial' +
                        '\n\nPunto de entrada exacto: 6–8 cm proximal a maléolo medial, cara posteromedial profunda \n\nOrientación y profundidad estimada de aguja: Oblicua anterolateral; 3–4 cm' + 
                        '\n\nPrecauciones: Paquete tibial posterior; N. tibial \n\nManiobra de activación y/o nota ecográfica: Inversión resistida; (US altamente recomendada)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      require('../../../assets/Miografia/LupaELE_62.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'TIBIALIS POSTERIOR',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },  

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Tibial posterior',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. tibial (L4–L5)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Membrana interósea y tibia/fíbula posteriores',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Navicular y expansiones plantares',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Inversión y soporte arco medial / Flexión plantar accesoria',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio I/IIa',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈0.35–0.45 millones',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈400–600',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},

          'Flexor Digitorum Longus': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto1.jpeg'), 
                        require('../../../assets/Miografia/ELE_63.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto2.jpeg'),
                      //require('../../../assets/Miografia/ELE_48.png')
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Prono/supino \n\nPuntos de referencia palpables: Borde posteromedial tibial proximal a maléolo' +
                        '\n\nPunto de entrada exacto: 6–8 cm proximal a maléolo medial, posteromedial profunda \n\nOrientación y profundidad estimada de aguja: Oblicua anterolateral; 2.5–3.5 cm' + 
                        '\n\nPrecauciones: Paquete tibial posterior \n\nManiobra de activación y/o nota ecográfica: Flexión 2–5; (US útil)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      require('../../../assets/Miografia/LupaELE_63.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'FLEXOR DIGITORUM LONGUS',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },  

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Flexor largo de los dedos',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. tibial (S2–S3)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Cara posterior tibial',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Falanges distales 2–5 (planta)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Flexión dedos 2–5 / Flexión plantar; soporte arco',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio I/IIa',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈0.25–0.35 millones',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈300–500',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},

          'Flexor Hallucis Longus': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto2.jpeg'), 
                        require('../../../assets/Miografia/ELE_64.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto1.jpeg'),
                      //require('../../../assets/Miografia/ELE_48.png')
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Prono/decúbito lateral \n\nPuntos de referencia palpables: Cara posterolateral de pierna; retromaleolar medial' +
                        '\n\nPunto de entrada exacto: 8–10 cm proximal a maléolo medial, posterolateral profundo \n\nOrientación y profundidad estimada de aguja: Oblicua anteromedial; 3–4 cm' + 
                        '\n\nPrecauciones: Paquete tibial posterior; N. tibial \n\nManiobra de activación y/o nota ecográfica: Flexión hallux; (US recomendada)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      require('../../../assets/Miografia/LupaELE_64.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'FLEXOR HALLUCIS LONGUS',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },  

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Flexor largo del hallux',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. tibial (S2–S3)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Fíbula posterior y membrana interósea',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Falange distal hallux (planta)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Flexión IP hallux / Flexión plantar; soporte arco',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio IIa/IIx',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈0.3–0.5 millones',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈400–600',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},

          'Popliteus': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto2.jpeg'), 
                        require('../../../assets/Miografia/ELE_65.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto1.jpeg'),
                      //require('../../../assets/Miografia/ELE_65.png')
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Prono, rodilla ligera flexión \n\nPuntos de referencia palpables: Línea articular posterolateral' +
                        '\n\nPunto de entrada exacto: 1–2 cm por debajo cóndilo lateral, cara posterolateral tibia \n\nOrientación y profundidad estimada de aguja: Oblicua anteromedial; 1.5–2.5 cm' + 
                        '\n\nPrecauciones: Vasos poplíteos; N. tibial proximal \n\nManiobra de activación y/o nota ecográfica: RI tibial; (US recomendable)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      require('../../../assets/Miografia/LupaELE_65.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'POPLITEUS',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },  

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Poplíteo',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. tibial (L4–S1)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Cóndilo femoral lateral',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Tibia posterior proximal',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Desbloqueo rodilla (RI tibial) / Estabilización PL',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio I/IIa',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈0.15–0.25 millones',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈200–300',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},

          'Abductor Hallucis': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto2.jpeg'), 
                        require('../../../assets/Miografia/ELE_66.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto1.jpeg'),
                      //require('../../../assets/Miografia/ELE_48.png')
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Prono, rodilla ligera flexión \n\nPuntos de referencia palpables: Línea articular posterolateral' +
                        '\n\nPunto de entrada exacto: 1–2 cm por debajo cóndilo lateral, cara posterolateral tibia \n\nOrientación y profundidad estimada de aguja: Oblicua anteromedial; 1.5–2.5 cm' + 
                        '\n\nPrecauciones: Vasos poplíteos; N. tibial proximal \n\nManiobra de activación y/o nota ecográfica: RI tibial; (US recomendable)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      //require('../../../assets/Miografia/LupaELE_41.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'ABDUCTOR HALLUCIS',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },  

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Abductor del hallux',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. tibial (L4–S1)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Cóndilo femoral lateral',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Tibia posterior proximal',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Desbloqueo rodilla (RI tibial) / Estabilización PL',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio I/IIa',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈0.15–0.25 millones',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈200–300',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},

          'Flexor Digitorum Brevis': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto1.jpeg'), 
                        require('../../../assets/Miografia/ELE_67.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto2.jpeg'),
                      //require('../../../assets/Miografia/ELE_48.png')
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Supino/prono \n\nPuntos de referencia palpables: Eminencia plantar central' +
                        '\n\nPunto de entrada exacto: Centro plantar a nivel arco, 2–3 cm distal a calcáneo \n\nOrientación y profundidad estimada de aguja: Perpendicular; 0.5–1.2 cm' + 
                        '\n\nPrecauciones: Arco plantar medial; ramas digitales \n\nManiobra de activación y/o nota ecográfica: Flexión PIP; (US opcional)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      require('../../../assets/Miografia/ELE_67_Z2.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'FLEXOR DIGITORUM BREVIS',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },  

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Flexor corto de los dedos',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. plantar medial (S2–S3)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Proceso medial calcáneo',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Falanges medias 2–5',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Flexión PIP 2–5 / Soporte plantar',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio IIa',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈0.25–0.35 millones',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈300–450',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},

          'Flexor Hallucis Brevis': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto2.jpeg'), 
                        require('../../../assets/Miografia/ELE_68.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto1.jpeg'),
                      //require('../../../assets/Miografia/ELE_48.png')
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Supino \n\nPuntos de referencia palpables: Eminencia plantar medial (sesamoideos)' +
                        '\n\nPunto de entrada exacto: 1 cm proximal a sesamoideos, borde medial plantar \n\nOrientación y profundidad estimada de aguja: Perpendicular; 0.5–0.8 cm' + 
                        '\n\nPrecauciones: A. plantar medial; nervios digitales \n\nManiobra de activación y/o nota ecográfica: Flexión MTP hallux; (US útil)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      require('../../../assets/Miografia/ELE_68_Z2.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'FLEXOR HALLUCIS BREVIS',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },  

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Flexor corto del hallux',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. plantar medial (S2–S3)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Cuboid/cuneiforme lat. + TP',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Sesamoideos/base falange proximal hallux',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Flexión MTP hallux / Soporte arco medial',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio I/IIa',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈0.2–0.3 millones',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈250–400',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},

          'Abductor Digiti Minimi Pedis': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto2.jpeg'), 
                        require('../../../assets/Miografia/ELE_69.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto1.jpeg'),
                      //require('../../../assets/Miografia/ELE_69_Z2.png')
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Supino/prono \n\nPuntos de referencia palpables: Borde lateral plantar' +
                        '\n\nPunto de entrada exacto: 1–2 cm distal a proceso lateral calcáneo \n\nOrientación y profundidad estimada de aguja: Perpendicular; 0.5–1 cm' + 
                        '\n\nPrecauciones: N. sural/N. plantar lateral; A. plantar lateral \n\nManiobra de activación y/o nota ecográfica: Abducción 5.º; (US útil)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      require('../../../assets/Miografia/ELE_69_Z2.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'ADDUCTOR DIGITI MINIMI PEDIS',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },  

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Abductor del meñique del pie',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. plantar lateral (S2–S3)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Proceso lateral calcáneo',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Base falange proximal 5.º',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Abducción 5.º dedo / Soporte lateral arco',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio IIa',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈0.18–0.25 millones',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈220–320',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},

          'Adductor Hallucis': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto2.jpeg'), 
                        require('../../../assets/Miografia/ELE_69.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto1.jpeg'),
                      //require('../../../assets/Miografia/ELE_48.png')
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Supino/prono \n\nPuntos de referencia palpables: Tubérculo medial calcáneo' +
                        '\n\nPunto de entrada exacto: 1–2 cm distal al tubérculo medial, borde medial planta \n\nOrientación y profundidad estimada de aguja: Perpendicular; 0.5–1 cm' + 
                        '\n\nPrecauciones: N. plantar medial; vasos plantares mediales \n\nManiobra de activación y/o nota ecográfica: Abducción hallux; (US útil)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      //require('../../../assets/Miografia/LupaELE_41.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'ADDUCTOR HALLUCIS',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },  

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Abductor del hallux',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. plantar medial (S2–S3)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Proceso medial calcáneo',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Base falange proximal hallux (medial)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Abducción-flexión MTP hallux / Soporte arco medial',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio I/IIa',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈0.2–0.3 millones',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈250–350',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},

          'Tibialis Anterior': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto2.jpeg'), 
                        require('../../../assets/Miografia/ELE_71.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto1.jpeg'),
                      //require('../../../assets/Miografia/ELE_48.png')
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Sedente, rodilla 90° \n\nPuntos de referencia palpables: Cresta tibial; vientre lateral a cresta' +
                        '\n\nPunto de entrada exacto: 8–10 cm distal a tuberosidad tibial, 1–2 cm lateral a cresta \n\nOrientación y profundidad estimada de aguja: Perpendicular; 1–2 cm' + 
                        '\n\nPrecauciones: A. tibial anterior/N. fibular profundo distales; periostio tibial \n\nManiobra de activación y/o nota ecográfica: Dorsiflexión; (US útil)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      require('../../../assets/Miografia/LupaELE_71.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'TIBIALIS ANTERIOR',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },  

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Tibial anterior',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. fibular profundo (L4–L5)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Cóndilo lateral tibial y tibia lateral',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Base 1.º metatarsiano y cuneiforme medial',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Dorsiflexión de tobillo / Inversión del pie',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio fibras I/IIa (≈55% I, 40% IIa, 5% IIx)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈0.25–0.35 millones',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈350–500',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},

          'Extensor Digitorum Longus': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto1.jpeg'), 
                        require('../../../assets/Miografia/ELE_72.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto2.jpeg'),
                      //require('../../../assets/Miografia/ELE_48.png')
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Sedente \n\nPuntos de referencia palpables: Cara anterolateral pierna; tendones dorsales' +
                        '\n\nPunto de entrada exacto: Tercio superior anterolateral, 1–2 cm lateral a TA \n\nOrientación y profundidad estimada de aguja: Perpendicular; 1–2 cm' + 
                        '\n\nPrecauciones: A./N. tibial anterior \n\nManiobra de activación y/o nota ecográfica: Extensión dedos; (US útil)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      require('../../../assets/Miografia/LupaELE_72.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'EXTENSOR DIGITORUM LONGUS',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },  

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Extensor largo de los dedos',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. fibular profundo (L5–S1)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Cóndilo lat. tibial, fíbula, membrana interósea',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Expansiones dorsales 2–5',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Extensión de dedos 2–5 / Dorsiflexión tobillo y ligera eversión',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio IIa',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈0.35–0.45 millones',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈400–600',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},

          'Extensor Hallucis Longus': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto1.jpeg'), 
                        require('../../../assets/Miografia/ELE_73.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto2.jpeg'),
                      //require('../../../assets/Miografia/ELE_73.png')
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Sedente \n\nPuntos de referencia palpables: Tendón dorsal del hallux; borde anterior fíbula' +
                        '\n\nPunto de entrada exacto: Tercio medio anterolateral, 2 cm lateral a cresta tibial \n\nOrientación y profundidad estimada de aguja: Perpendicular; 1–2 cm' + 
                        '\n\nPrecauciones: A. tibial anterior; N. fibular profundo \n\nManiobra de activación y/o nota ecográfica: Extensión del hallux; (US recomendable)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      require('../../../assets/Miografia/LupaELE_73.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'EXTENSOR HALLUCIS LONGUS',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },  

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Extensor largo del hallux',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. fibular profundo (L5–S1)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Fíbula medial y membrana interósea',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Falange distal hallux (dorso)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Extensión IP hallux / Dorsiflexión tobillo',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio IIa/IIx',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈0.18–0.25 millones',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈250–350',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},

          'Gluteus Medius': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto2.jpeg'), 
                        require('../../../assets/Miografia/ELE_78.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto1.jpeg'),
                      //require('../../../assets/Miografia/ELE_48.png')
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Decúbito lateral contralateral \n\nPuntos de referencia palpables: Cresta ilíaca; trocánter mayor' +
                        '\n\nPunto de entrada exacto: 3–4 cm superior al trocánter mayor \n\nOrientación y profundidad estimada de aguja: Perpendicular; 3–4 cm' + 
                        '\n\nPrecauciones: N. glúteo superior; vasos glúteos \n\nManiobra de activación y/o nota ecográfica: Abducción contra resistencia; (US recomendable)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      require('../../../assets/Miografia/LupaELE_78.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'GLUTEUS MEDIUS',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },  

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Glúteo medio',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. glúteo superior (L4–S1)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Ilion entre líneas anterior y posterior',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Trocánter mayor (lateral)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Abducción-estabilización pélvica / RI-RE según fibras',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio tipo I (≈60% I, 35% IIa, 5% IIx)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈0.8–1.1 millones',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈800–1,400',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},

          'Gluteus Minimus': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto2.jpeg'), 
                        require('../../../assets/Miografia/ELE_79.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto1.jpeg'),
                      //require('../../../assets/Miografia/ELE_48.png')
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Decúbito lateral \n\nPuntos de referencia palpables: Cresta ilíaca; trocánter mayor anterior' +
                        '\n\nPunto de entrada exacto: 1–2 cm anterosuperior al trocánter; plano profundo \n\nOrientación y profundidad estimada de aguja: Oblicua posteromedial; 3.5–5 cm' + 
                        '\n\nPrecauciones: Vasos glúteos superiores; n. glúteo superior \n\nManiobra de activación y/o nota ecográfica: Abducción/RI; (US muy recomendada)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      require('../../../assets/Miografia/LupaELE_79.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'GLUTEUS MINIMUS',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },  

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Glúteo menor',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. glúteo superior (L4–S1)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Ilion entre líneas anterior e inferior',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: trocánter mayor (anterior)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Abducción y RI / Estabilización pélvica',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Predominio tipo I (≈60% I, 35% IIa, 5% IIx)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈0.5–0.7 millones',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈500–900',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},

          'Tensor Fasciae Latae': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto2.jpeg'), 
                        require('../../../assets/Miografia/ELE_80.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto1.jpeg'),
                      //require('../../../assets/Miografia/ELE_48.png')
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Supino \n\nPuntos de referencia palpables: EIAS; masa anterolateral proximal' +
                        '\n\nPunto de entrada exacto: 2–3 cm distal y posterior a EIAS \n\nOrientación y profundidad estimada de aguja: Perpendicular; 2–3 cm' + 
                        '\n\nPrecauciones: Ramas cutáneas femorales laterales; vasos circunflejos \n\nManiobra de activación y/o nota ecográfica: Abducción/RI; (US útil)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      require('../../../assets/Miografia/LupaELE_80.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'TENSOR FASCIAE LATAE',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },  

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Tensor de la fascia lata (TFL)',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. glúteo superior (L4–S1)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: EIAS/cresta ilíaca anterior',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Tracto iliotibial',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Tensionar tracto IT; abducción/RI / Estabilizar rodilla',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Leve predominio IIa (≈45% I, 50% IIa, 5% IIx)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈0.3–0.5 millones',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈500–900',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},

          'Gluteus Maximus': {
            imagenes: [
                    [
                        [require('../../../assets/Miografia/Esqueleto2.jpeg'), 
                        require('../../../assets/Miografia/ELE_81.png')
                        ],
                    [require('../../../assets/Miografia/Esqueleto1.jpeg'),
                      //require('../../../assets/Miografia/ELE_48.png')
                      ]],
                ],
                botones: [
                    [
                    {
                    x: 84, y: 65, width: 20, height: 12, text: 'PUNTO MOTOR', type: 'TxtButtonImg',infoText: 'Posición del paciente: Prono o decúbito lateral \n\nPuntos de referencia palpables: Cresta ilíaca posterior; trocánter mayor; pliegue glúteo' +
                        '\n\nPunto de entrada exacto: Tercio medio entre cresta posterior y trocánter mayor \n\nOrientación y profundidad estimada de aguja: Perpendicular; 3–5 cm' + 
                        '\n\nPrecauciones: Nervio ciático profundo; vasos glúteos inferiores \n\nManiobra de activación y/o nota ecográfica: Extensión contra resistencia; (US útil)',
                    infoBoxX: 62, infoBoxY: 5, infoBoxWidth: 35, infoBoxHeight: 80, buttonImageSource: Buscar, 
                    infoImage: [
                      //require('../../../assets/Miografia/LupaELE_41.png'),
                    ]},  

                    { type: 'staticText', x: 1, y: 10, width: 25, height: 20, text: 'GLUTEUS MAXIMUS',
                      fontSize: 18, fontFamily: 'LuxoraGrotesk-Heavy',  },  

                    { type: 'staticText', x: 1, y: 22, width: 28, height: 20, text: 'Glúteo mayor',
                      fontSize: 14, fontFamily: 'sans-serif-medium'},

                    { type: 'staticText', x: 1, y: 36, width: 24, height: 15, text: 'Inervación: N. glúteo inferior (L5–S2)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inervación: ' }],
                    },
                    { type: 'staticText', x: 1, y: 50, width: 20, height: 15, text: 'Origen: Ilion posterior, sacro',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Origen: ' }],
                    },
                    { type: 'staticText', x: 1, y: 60, width: 20, height: 15, text: 'Inserción: Tracto IT y tuberosidad glútea',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Inserción: ' }],
                    },
                    { type: 'staticText', x: 1, y: 73, width: 22, height: 15, text: 'Función: Extensión potente de cadera / RE y estabilización',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Función: ' }],
                    },

                    { type: 'staticText', x: 84, y: 25, width: 20, height: 15, text: 'Tipo de fibras: Mixto con leve predominio IIa (≈45% I, 50% IIa, 5% IIx)',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Tipo de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 35, width: 20, height: 15, text: 'Cantidad de fibras: ≈1.5–2.0 millones',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Cantidad de fibras: ' }],
                    },

                    { type: 'staticText', x: 84, y: 45, width: 22, height: 15, text: 'Unidades motoras: ≈1,500–2,500',
                      fontSize: 15, fontFamily: 'Times New Roman', textHighlights: [{ text: 'Unidades motoras: ' }],
                    },
                  ]],},

};

// const { width, height } = useWindowDimensions();

function MiografiaScreen(): React.JSX.Element {
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
    width: width * 0.99,
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
              <Text style={styles.tituloText}>Miografía</Text>
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

export default MiografiaScreen;

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
    maxWidth: '100%',
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
