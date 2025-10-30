import React, { useState, useRef, useEffect } from 'react';
import { InteractionManager,Keyboard, View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, ImageBackground, PermissionsAndroid, Platform, Permission, Alert, TextInput, ViewStyle, Dimensions, ActivityIndicator } from 'react-native';
import Header from '../../../components/Header';
import DocumentPicker from 'react-native-document-picker';
import { launchCamera,launchImageLibrary } from 'react-native-image-picker';
import uuid from 'react-native-uuid';
import FiguraMovible from '../../../components/FiguraMovibleN';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, Easing, } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { botonesConfig } from './Botones';
import { botonesConfigSeg } from './BotonesSeg';
import { escanearImagen } from '../../../utils/EscanearImagen';
import Orientation, { OrientationType } from 'react-native-orientation-locker';
import styleReporte from '../../../styles/styleReporte';
import styleReporteHorizontal from '../../../styles/styleReporteHorizontal';
import FancyInput from '../../../components/FancyInput';
import GaleriaEmergente from './GaleriaTb';
import { captureRef } from 'react-native-view-shot';
import { PDFDocument } from 'pdf-lib';
import type { ImageSourcePropType} from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Svg, { Path } from 'react-native-svg';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../../../constants/config';

const IMG_BASE = require('../../../assets/CuerpoPng/PolineuMG/BP_Polineuropatia.png');
const IMG_BASE_TRANSPARENT = require('../../../assets/CuerpoPng/PolineuMG/BP_TR.png'); ;

const BASE_SRC = Image.resolveAssetSource(IMG_BASE_TRANSPARENT);
const BASE_AR = BASE_SRC.width / BASE_SRC.height;

// Link y storage
import LinkUploader, { type LinkUploaderProps } from '../../../components/LinkUploader';
import { supabase } from '../../../lib/supabase';
import { initShareLink, completeShareLink } from '../../../services/shareLinks';
import { decode as b64decode, encode as b64encode } from 'base64-arraybuffer';
import TemplatePickerModal, { type PlantillaId } from '../../../components/TemplatePickerModal';
import TemplatePickerButton from '../../../components/TemplatePickerButton';

import {
  PLANTILLAS_PDF, buildPdfWithTemplate,
  type PdfBuildConfig,
} from '../../../components/pdfLoadingTemplate';

//Modal de exito - Exportar pdf
import { ExportSuccessModal } from '../../../components/ExportSuccessModal';
import { text } from 'stream/consumers';
import EditTextModal from '../../../components/EditTextModal';
import ComentarioModal from '../../../components/ComentarioModal';

const safeName = (s: string) =>
  (s || 'Paciente')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim().replace(/\s+/g, '_');

// === Bucket de storage (mismo que en los otros reportes)
const BUCKET = 'report-packages';

// === Limpiar nombre de archivo
const sanitizeFilename = (name: string) =>
  name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w.\- ]+/g, '')
      .replace(/\s+/g, '_');

// === Uri -> path legible
const uriToReadablePath = async (rawUri: string) => {
  if (rawUri.startsWith('content://')) {
    try {
      const st = await ReactNativeBlobUtil.fs.stat(rawUri);
      if (st?.path) return decodeURIComponent(st.path.replace(/^file:\/\//, ''));
    } catch {}
    return rawUri;
  }
  if (rawUri.startsWith('file://')) return decodeURIComponent(rawUri.replace('file://', ''));
  return decodeURIComponent(rawUri);
};

// === Leer archivo como ArrayBuffer
const readAsArrayBuffer = async (rawUri: string) => {
  const path = await uriToReadablePath(rawUri);
  const base64 = await ReactNativeBlobUtil.fs.readFile(path, 'base64');
  return b64decode(base64);
};

/* ====== Utils ====== */
const limpiarTextoLibre = (s: string): string => {
  // Se usa SOLO para el comentario libre de la hoja 2 (no para el texto de reporte)
  if (!s) return '—';
  let t = s.replace(/\s+/g, ' ').trim();
  if (!t) return '—';
  return t[0].toUpperCase() + t.slice(1) + (/[.!?]$/.test(t) ? '' : '.');
};

/* ====== Config del PDF ====== */
type PdfConfig = {
  paper: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  renderScale: number;
  pageMargin: number;
  header: {
    height: number; padH: number; padTop: number; padBottom: number;
    patient: { labelSize: number; nameSize: number; weight: '400'|'600'|'700' };
    logo: { size: number; opacity: number; fogOpacity: number; fogPad: number };
  };
  lamina: { widthFrac: number; minHeight: number; };
  diag: {
    minHeight: number; padH: number; padV: number;
    titleSize: number; textSize: number; lineHeight: number;
    pullUp: number; borderW: number; borderColor: string; radius: number;
  };
  footer: {
    height: number; padH: number; padV: number; opacity: number;
    itemGap: number; icon: number; text: number; iconTextGap: number;
  raise?: number;
  }; 
  page2?: {
    shiftDown?: number;
  };

  debug: boolean;
};
const DEFAULT_PDF: PdfConfig = {
  paper: 'A4',
  orientation: 'portrait',
  renderScale: 2,
  pageMargin: 30,
  header: {
    height: 56, padH: 70, padTop: 50, padBottom: 1, // ← prueba estos valores
    patient: { labelSize: 12, nameSize: 12, weight: '700' },
    logo: { size: 48, opacity: 0.95, fogOpacity: 0.2, fogPad: 6 },
  },
  lamina: { widthFrac: 0.90, minHeight: 140 },
  diag: {
    minHeight: 100, padH: 64, padV: 12,
    titleSize: 11, textSize: 10.5, lineHeight: 17,
    pullUp: 90, borderW: 0, borderColor: '#ffffffff', radius: 10,
  },
  footer: {
    height: 54, padH: 12, padV: 12, opacity: 0.9,
    itemGap: 9, icon: 14, text: 7.5, iconTextGap: 4,
  raise: 17,
  },
   page2: {
    shiftDown: 94,
  },

  debug: false,
};

interface Jerarquia {
  titulo: string;
  seleccionMultiple: boolean;
  opciones: ({
    nombre: string;
    textoAMostrar?: string; 
    siguiente?: Jerarquia;
    texto?: string;
    textoLista?: string; 
    ImgValue?: string;
    BtnNerv?: string;
    BtnNervSeg?: string;
    zoomScale?: number;
    panX?: number;
    panY?: number;
  } | Jerarquia)[];
  siguiente?: Jerarquia;
  textoLista?: string;
}

const PronosticoDesm = {
  titulo: 'Pronóstico',
  seleccionMultiple: false,
  opciones: [
    { nombre: 'Recuperación completa', texto: '\n\nPronóstico de recuperación completa.', },
    { nombre: 'Recuperación parcial funcional', texto: '\n\nPronóstico de recuperación parcial funcional.', },
    { nombre: 'Recuperación Pobre no funcional', texto: '\n\nPronóstico de recuperación pobre no funcional.', },
    { nombre: 'Recuperación nula', texto: '\n\nPronóstico de recuperación nulo.', },
  ]
};

const Pronostico = {
  titulo: 'Pronóstico',
  seleccionMultiple: false,
  opciones: [
    { nombre: 'Recuperación completa', texto: 'Pronóstico de recuperación completa.', },
    { nombre: 'Recuperación parcial funcional', texto: 'Pronóstico de recuperación parcial funcional.', },
    { nombre: 'Recuperación Pobre no funcional', texto: 'Pronóstico de recuperación pobre no funcional.', },
    { nombre: 'Recuperación nula', texto: 'Pronóstico de recuperación nulo.', },
  ]
};

const Reinervacion = {
  titulo: 'Reinervación',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Reinervación activa', textoLista: 'Reinervación - Activa ', texto: 'Reinervación activa;', siguiente: Pronostico},
    {nombre: 'Reinervación inactiva', textoLista: 'Reinervación - Inactiva ', texto: 'Reinervación inactiva;', siguiente: Pronostico},
  ]
};

const IntensidadC = {
  titulo: 'Intensidad',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Leve', texto: ' intensidad leve.', siguiente: PronosticoDesm},
    {nombre: 'Moderada', texto: ' intensidad moderada.', siguiente: PronosticoDesm},
    {nombre: 'Severa', texto: ' intensidad severa.', siguiente: PronosticoDesm},

  ]
};

const Intensidad = {
  titulo: 'Intensidad',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Leve', texto: ' intensidad leve.', siguiente: Reinervacion},
    {nombre: 'Moderada', texto: ' intensidad moderada.', siguiente: Reinervacion},
    {nombre: 'Severa', texto: ' intensidad severa.', siguiente: Reinervacion},

  ]
};

const IntensidadDesm = {
  titulo: 'Intensidad',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Leve', texto: ' intensidad leve.', siguiente: PronosticoDesm},
    {nombre: 'Moderada', texto: ' intensidad moderada.', siguiente: PronosticoDesm},
    {nombre: 'Severa', texto: ' intensidad severa.', siguiente: PronosticoDesm},
  ]
};

const Fibras = {
  titulo: 'Fibras',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Motoras', texto: 'en fibras motoras,', siguiente: Intensidad},
    {nombre: 'Sensitivas', texto: 'en fibras sensitivas,', siguiente: Intensidad},
    {nombre: 'Mixtas (Sensitivo-Motora)', texto: 'en fibras mixtas (sensitivo-motora),', siguiente: Intensidad},

  ]
};

const FibrasDesm = {
  titulo: 'Fibras',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Motoras', texto: 'para fibras motoras,', siguiente: IntensidadDesm},
    {nombre: 'Sensitivas', texto: 'para fibras sensitivas,', siguiente: IntensidadDesm},
    {nombre: 'Mixtas (Sensitivo-Motora)', texto: 'para fibras mixtas (sensitivo-motora),', siguiente: IntensidadDesm},
  ]
}
const MixtaFB = {
  titulo: 'Mixta',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Desmielinizante-Axonal', textoLista: 'Tipo - Primariamente desmielinizante con perdida axonal secundaria', texto: ' de tipo desmielinizante con perdida axonal secundaria', siguiente: IntensidadDesm},//Antes Intensidad
    {nombre: 'Axonal-Desmielinizante', textoLista: 'Tipo - Primariamente axonal con desmielinizacón secundaria', texto: ' de tipo axonal con desmielinizacón secundaria', siguiente: IntensidadDesm},//Antes Intensidad
  ]
};

const MixtaF = {
  titulo: 'Mixta',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Desmielinizante-Axonal', textoLista: 'Tipo - Primariamente desmielinizante con perdida axonal secundaria', texto: ' de tipo desmielinizante con perdida axonal secundaria', siguiente: FibrasDesm},//Antes Fibras
    {nombre: 'Axonal-Desmielinizante', textoLista: 'Tipo - Primariamente axonal con desmielinizacón secundaria', texto: ' de tipo axonal con desmielinizacón secundaria', siguiente: FibrasDesm},//Antes Fibras
  ]
};

const DesmielinizanteTC = {
  titulo: 'Condición',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Retardo en la conducción', textoLista: 'con retardo en la conducción', texto: ' por retardo en la conducción', siguiente: IntensidadC},//Antes Fibras
    {nombre: 'Bloqueo parcial en la conducción', textoLista: 'con bloqueo parcial en la conducción', texto: ' por bloqueo parcial en la conducción', siguiente: IntensidadC},//Antes Fibras
    {nombre: 'Bloqueo completo en la conducción', textoLista: 'con bloqueo completo en la conducción', texto: ' por bloqueo completo en la conducción', siguiente: IntensidadC},//Antes Fibras
  ]
};

const DesmielinizanteTB = {
  titulo: 'Condición',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Retardo en la conducción', textoLista: 'con retardo en la conducción', texto: ' por retardo en la conducción', siguiente: FibrasDesm},//Antes Intensidad
    {nombre: 'Bloqueo parcial en la conducción', textoLista: 'con bloqueo parcial en la conducción', texto: ' por bloqueo parcial en la conducción', siguiente: FibrasDesm},//Antes Intensidad
    {nombre: 'Bloqueo completo en la conducción', textoLista: 'con bloqueo completo en la conducción', texto: ' por bloqueo completo en la conducción', siguiente: FibrasDesm},//Antes Intensidad
  ]
};

const DesmielinizanteT = {
  titulo: 'Condición',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Retardo en la conducción', textoLista: 'con retardo en la conducción', texto: ' por retardo en la conducción', siguiente: FibrasDesm},//Antes Fibras
    {nombre: 'Bloqueo parcial en la conducción', textoLista: 'con bloqueo parcial en la conducción', texto: ' por bloqueo parcial en la conducción', siguiente: FibrasDesm},//Antes Fibras
    {nombre: 'Bloqueo completo en la conducción', textoLista: 'con bloqueo completo en la conducción', texto: ' por bloqueo completo en la conducción', siguiente: FibrasDesm},//Antes Fibras
  ]
};

const AxonalIncompletaB = {
  titulo: 'Condición',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Denervación Difusa (++++)', textoLista: 'con denervación difusa (++++)', texto: ' con denervación difusa (++++)', siguiente: Intensidad},
    {nombre: 'Denervación Abundante (+++)', textoLista: 'con denervación abundante (+++) ', texto: ' con denervación abundante (+++)', siguiente: Intensidad},
    {nombre: 'Denervación Progresiva (++) ', textoLista: 'con denervación progresiva (++) ', texto: ' con denervación progresiva (++)', siguiente: Intensidad},
    {nombre: 'Denervación Discreta (+/+) ', textoLista: 'con denervación discreta (+/+)', texto: ' con denervación discreta (+/+)', siguiente: Intensidad},
    {nombre: 'Ausente', texto: ' sin denervación,', siguiente: Fibras},
  ]
};

const AxonalIncompleta = {
  titulo: 'Condición',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Denervación Difusa (++++)', textoLista: 'con denervación difusa (++++)', texto: ' con denervación difusa (++++)', siguiente: Fibras},
    {nombre: 'Denervación Abundante (+++)', textoLista: 'con denervación abundante (+++) ', texto: ' con denervación abundante (+++)', siguiente: Fibras},
    {nombre: 'Denervación Progresiva (++) ', textoLista: 'con denervación progresiva (++) ', texto: ' con denervación progresiva (++)', siguiente: Fibras},
    {nombre: 'Denervación Discreta (+/+) ', textoLista: 'con denervación discreta (+/+)', texto: ' con denervación discreta (+/+)', siguiente: Fibras},
    {nombre: 'Ausente', texto: ' sin denervación,', siguiente: Fibras},
  ]
};

const AxonalCompletaB = {
  titulo: 'Condición',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Denervación Difusa (++++)', textoLista: 'con denervación difusa (++++)', texto: ' con denervación difusa (++++)', siguiente: Intensidad},
    {nombre: 'Denervación Abundante (+++)', textoLista: 'con denervación abundante (+++) ', texto: ' con denervación abundante (+++)', siguiente: Intensidad},
    {nombre: 'Denervación Progresiva (++) ', textoLista: 'con denervación progresiva (++) ', texto: ' con denervación progresiva (++)', siguiente: Intensidad},
    {nombre: 'Denervación Discreta (+/+) ', textoLista: 'con denervación discreta (+/+)', texto: ' con denervación discreta (+/+)', siguiente: Intensidad},
    {nombre: 'Sin denervación', textoLista: ' sin denervación', texto: ' sin denervación,', siguiente: Intensidad},
  ]
};

const AxonalCompleta = {
  titulo: 'Condición',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Denervación Difusa (++++)', textoLista: 'con denervación difusa (++++)', texto: ' con denervación difusa (++++)', siguiente: Fibras},
    {nombre: 'Denervación Abundante (+++)', textoLista: 'con denervación abundante (+++) ', texto: ' con denervación abundante (+++)', siguiente: Fibras},
    {nombre: 'Denervación Progresiva (++) ', textoLista: 'con denervación progresiva (++) ', texto: ' con denervación progresiva (++)', siguiente: Fibras},
    {nombre: 'Denervación Discreta (+/+) ', textoLista: 'con denervación discreta (+/+)', texto: ' con denervación discreta (+/+)', siguiente: Fibras},
    {nombre: 'Sin denervación', textoLista: ' sin denervación', texto: ' sin denervación,', siguiente: Fibras},
  ]
};

// No tiene Fibras, Denervación y Reinervación
const TipoC = {
  titulo: 'Tipo',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Axonal completa', textoLista: 'Tipo - Axonal completa', texto: 'de tipo axonal completa', siguiente: IntensidadC},
    {nombre: 'Axonal incompleta', textoLista: 'Tipo - Axonal incompleta', texto: 'de tipo axonal incompleta', siguiente: IntensidadC},
    {nombre: 'Desmielinizante', textoLista: 'Tipo - Desmielinizante', texto: 'de tipo desmielinizante', siguiente: DesmielinizanteTB},
    {nombre: 'Mixta', textoLista: '_', texto: '', siguiente: MixtaFB},
  ]
};

const TipoB = {
  titulo: 'Tipo',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Axonal completa', textoLista: 'Tipo - Axonal completa', texto: 'de tipo axonal completa', siguiente: AxonalCompletaB},
    {nombre: 'Axonal incompleta', textoLista: 'Tipo - Axonal incompleta', texto: 'de tipo axonal incompleta', siguiente: AxonalIncompletaB},
    {nombre: 'Desmielinizante', textoLista: 'Tipo - Desmielinizante', texto: 'de tipo desmielinizante', siguiente: DesmielinizanteTC},
    {nombre: 'Mixta', textoLista: '_', texto: '', siguiente: MixtaFB},

  ]
};

const Tipo = {
  titulo: 'Tipo',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Axonal completa', textoLista: 'Tipo - Axonal completa', texto: 'de tipo axonal completa', siguiente: AxonalCompleta},
    {nombre: 'Axonal incompleta', textoLista: 'Tipo - Axonal incompleta', texto: 'de tipo axonal incompleta', siguiente: AxonalIncompleta},
    {nombre: 'Desmielinizante', textoLista: 'Tipo - Desmielinizante', texto: 'de tipo desmielinizante', siguiente: DesmielinizanteT},
    {nombre: 'Mixta', textoLista: '_', texto: '', siguiente: MixtaF},

  ]
};

const SeleccionC = {
  titulo: 'Seleccionar',
  seleccionMultiple: false,
  siguiente: TipoC, 
  opciones: [
    {nombre: '', textoAMostrar: 'Selecciona el nervio afectado'}
  ]
};

const SeleccionB = {
  titulo: 'Seleccionar',
  seleccionMultiple: false,
  siguiente: TipoB, 
  opciones: [
    {nombre: '', textoAMostrar: 'Selecciona el nervio afectado'}
  ]
};

const Seleccion = {
  titulo: 'Seleccionar',
  seleccionMultiple: false,
  siguiente: Tipo, 
  opciones: [
    {nombre: '', textoAMostrar: 'Selecciona el nervio afectado'}
  ]
};


// Nervio Pudendo
const UbicacionPudBlt = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnPudBlt', siguiente: Seleccion, zoomScale: 3.6, panX: 0, panY: 0, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnPudBltSg', siguiente: Seleccion, zoomScale: 3.6, panX: 0, panY: 0,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: Seleccion, zoomScale: 3.6, panX: 0, panY: 0,},
  ]};

const UbicacionPudIzq = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnPudIzq', siguiente: Seleccion, zoomScale: 3.6, panX: 0, panY: 0, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnPudIzqSg', siguiente: Seleccion, zoomScale: 3.6, panX: 0, panY: 0,},
    //nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: Seleccion, zoomScale: 3.6, panX: 0, panY: 0,},
  ]};

const UbicacionPud = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnPud', siguiente: Seleccion, zoomScale: 3.6, panX: 0, panY: 0,},
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnPudSg', siguiente: Seleccion, zoomScale: 3.6, panX: 0, panY: 0,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: Seleccion, zoomScale: 3.6, panX: 0, panY: 0,},
  ]};

const BilateralNPud = {
  titulo: 'Bilateral',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Predominio derecho', textoLista: 'Lado - Bilateral predominio derecho' , texto: ' con predominio derecho,', siguiente: UbicacionPudBlt},
    {nombre: 'Predominio izquierdo', textoLista: 'Lado - Bilateral predominio izquierdo' , texto: ' con predominio izquierdo,', siguiente: UbicacionPudBlt},
  ]
};
const LadoPud = { titulo: 'Lado',seleccionMultiple: false,
  opciones: [{nombre: 'Izquierdo', texto: ' izquierdo,', siguiente: UbicacionPudIzq},{nombre: 'Derecho', texto: ' derecho,', siguiente: UbicacionPud},{nombre: 'Bilateral',textoLista: '_', texto: ' bilateral', siguiente: BilateralNPud},]//Antes UbicacionPudBlt
};
// Nervio Ciático
const UbicacionCiaBlt = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnCiaBlt', siguiente: Seleccion, zoomScale: 1.8, panX: 0, panY: -120, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnCiaBltSg', siguiente: Seleccion, zoomScale: 1.8, panX: 0, panY: -120,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: Seleccion, zoomScale: 1.8, panX: 0, panY: -120,},
  ]};

const UbicacionCiaIzq = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnCiaIzq', siguiente: Seleccion, zoomScale: 1.8, panX: 0, panY: -120, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnCiaIzqSg', siguiente: Seleccion, zoomScale: 1.8, panX: 0, panY: -120,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: Seleccion, zoomScale: 1.8, panX: 0, panY: -120,},
  ]};

const UbicacionCia = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnCia', siguiente: Seleccion, zoomScale: 1.8, panX: 0, panY: -120,},
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnCiaSg', siguiente: Seleccion, zoomScale: 1.8, panX: 0, panY: -120,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: Seleccion, zoomScale: 1.8, panX: 0, panY: -120,},
  ]};

const BilateralNCia = {
  titulo: 'Bilateral',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Predominio derecho', textoLista: 'Lado - Bilateral predominio derecho' , texto: ' con predominio derecho,', siguiente: UbicacionCiaBlt},
    {nombre: 'Predominio izquierdo', textoLista: 'Lado - Bilateral predominio izquierdo' , texto: ' con predominio izquierdo,', siguiente: UbicacionCiaBlt},
  ]
};
const LadoCia = { titulo: 'Lado',seleccionMultiple: false,
  opciones: [{nombre: 'Izquierdo', texto: ' izquierdo,', siguiente: UbicacionCiaIzq},{nombre: 'Derecho', texto: ' derecho,', siguiente: UbicacionCia},{nombre: 'Bilateral',textoLista: '_', texto: ' bilateral', siguiente: BilateralNCia},]//Antes UbicacionCiaBlt
};
// Nervio Ilioiguinal
const UbicacionIlioBlt = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnIlioBlt', siguiente: SeleccionC, zoomScale: 2.5, panX: 0, panY: 0, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnIlioBltSg', siguiente: SeleccionC, zoomScale: 2.5, panX: 0, panY: 0,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionC, zoomScale: 2.5, panX: 0, panY: 0,},
  ]};

const UbicacionIlioIzq = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnIlioIzq', siguiente: SeleccionC, zoomScale: 2.5, panX: 0, panY: 0, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnIlioIzqSg', siguiente: SeleccionC, zoomScale: 2.5, panX: 0, panY: 0,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionC, zoomScale: 2.5, panX: 0, panY: 0,},
  ]};

const UbicacionIlio = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnIlio', siguiente: SeleccionC, zoomScale: 2.5, panX: 0, panY: 0,},
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnIlioSg', siguiente: SeleccionC, zoomScale: 2.5, panX: 0, panY: 0,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionC, zoomScale: 2.5, panX: 0, panY: 0,},
  ]};

const BilateralNIlio = {
  titulo: 'Bilateral',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Predominio derecho', textoLista: 'Lado - Bilateral predominio derecho' , texto: ' con predominio derecho,', siguiente: UbicacionIlioBlt},
    {nombre: 'Predominio izquierdo', textoLista: 'Lado - Bilateral predominio izquierdo' , texto: ' con predominio izquierdo,', siguiente: UbicacionIlioBlt},
  ]
};
const LadoIlio = { titulo: 'Lado',seleccionMultiple: false,
  opciones: [{nombre: 'Izquierdo', texto: ' izquierdo,', siguiente: UbicacionIlioIzq},{nombre: 'Derecho', texto: ' derecho,', siguiente: UbicacionIlio},{nombre: 'Bilateral',textoLista: '_', texto: ' bilateral', siguiente: BilateralNIlio},]//Antes UbicacionIlioBlt
};
// Nervio plantar lateral
const UbicacionPlaLtBlt = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnPlaLtBlt', siguiente: Seleccion, zoomScale: 3.2, panX: 0, panY: -500, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnPlaLtBltSg', siguiente: Seleccion, zoomScale: 3.2, panX: 0, panY: -500,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: Seleccion, zoomScale: 3.2, panX: 0, panY: -500,},
  ]};

const UbicacionPlaLtIzq = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnPlaLtIzq', siguiente: Seleccion, zoomScale: 3.2, panX: 0, panY: -500, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnPlaLtIzqSg', siguiente: Seleccion, zoomScale: 3.2, panX: 0, panY: -500,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: Seleccion, zoomScale: 3.2, panX: 0, panY: -500,},
  ]};

const UbicacionPlaLt = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnPlaLt', siguiente: Seleccion, zoomScale: 3.2, panX: 0, panY: -500,},
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnPlaLtSg', siguiente: Seleccion, zoomScale: 3.2, panX: 0, panY: -500,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: Seleccion, zoomScale: 3.2, panX: 0, panY: -500,},
  ]};

const BilateralNPLrl = {
  titulo: 'Bilateral',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Predominio derecho', textoLista: 'Lado - Bilateral predominio derecho' , texto: ' con predominio derecho,', siguiente: UbicacionPlaLtBlt},
    {nombre: 'Predominio izquierdo', textoLista: 'Lado - Bilateral predominio izquierdo' , texto: ' con predominio izquierdo,', siguiente: UbicacionPlaLtBlt},
  ]
};
const LadoPlaLt = { titulo: 'Lado',seleccionMultiple: false,
  opciones: [{nombre: 'Izquierdo', texto: ' izquierdo,', siguiente: UbicacionPlaLtIzq},{nombre: 'Derecho', texto: ' derecho,', siguiente: UbicacionPlaLt},{nombre: 'Bilateral',textoLista: '_', texto: ' bilateral', siguiente: BilateralNPLrl},]//Antes UbicacionPlaLtBlt
};
// Nervio Plantar medial
const UbicacionPlaMeBlt = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnPlaMeBlt', siguiente: Seleccion, zoomScale: 3.2, panX: 0, panY: -500, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnPlaMeBltSg', siguiente: Seleccion, zoomScale: 3.2, panX: 0, panY: -500,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: Seleccion, zoomScale: 3.2, panX: 0, panY: -500,},
  ]};

const UbicacionPlaMeIzq = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnPlaMeIzq', siguiente: Seleccion, zoomScale: 3.2, panX: 0, panY: -500, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnPlaMeIzqSg', siguiente: Seleccion, zoomScale: 3.2, panX: 0, panY: -500,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: Seleccion, zoomScale: 3.2, panX: 0, panY: -500,},
  ]};

const UbicacionPlaMe = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnPlaMe', siguiente: Seleccion, zoomScale: 3.2, panX: 0, panY: -500,},
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnPlaMeSg', siguiente: Seleccion, zoomScale: 3.2, panX: 0, panY: -500,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: Seleccion, zoomScale: 3.2, panX: 0, panY: -500,},
  ]};

const BilateralNPMe = {
  titulo: 'Bilateral',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Predominio derecho', textoLista: 'Lado - Bilateral predominio derecho' , texto: ' con predominio derecho,', siguiente: UbicacionPlaMeBlt},
    {nombre: 'Predominio izquierdo', textoLista: 'Lado - Bilateral predominio izquierdo' , texto: ' con predominio izquierdo,', siguiente: UbicacionPlaMeBlt},
  ]
};
const LadoPlaMe = { titulo: 'Lado',seleccionMultiple: false,
  opciones: [{nombre: 'Izquierdo', texto: ' izquierdo,', siguiente: UbicacionPlaMeIzq},{nombre: 'Derecho', texto: ' derecho,', siguiente: UbicacionPlaMe},{nombre: 'Bilateral',textoLista: '_', texto: ' bilateral', siguiente: BilateralNPMe},]//Antes UbicacionPlaMeBlt
};
// Nervio Sural
const UbicacionSurBlt = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnSurBlt', siguiente: SeleccionC, zoomScale: 3, panX: 0, panY: -440, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnSurBltSg', siguiente: SeleccionC, zoomScale: 3, panX: 0, panY: -440,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionC, zoomScale: 3, panX: 0, panY: -440,},
  ]};

const UbicacionSurIzq = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnSurIzq', siguiente: SeleccionC, zoomScale: 3, panX: 0, panY: -440, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnSurIzqSg', siguiente: SeleccionC, zoomScale: 3, panX: 0, panY: -440,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionC, zoomScale: 3, panX: 0, panY: -440,},
  ]};

const UbicacionSur = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnSur', siguiente: SeleccionC, zoomScale: 3, panX: 0, panY: -440,},
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnSurSg', siguiente: SeleccionC, zoomScale: 3, panX: 0, panY: -440,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionC, zoomScale: 3, panX: 0, panY: -440,},
  ]};

const BilateralNSur = {
  titulo: 'Bilateral',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Predominio derecho', textoLista: 'Lado - Bilateral predominio derecho' , texto: ' con predominio derecho,', siguiente: UbicacionSurBlt},
    {nombre: 'Predominio izquierdo', textoLista: 'Lado - Bilateral predominio izquierdo' , texto: ' con predominio izquierdo,', siguiente: UbicacionSurBlt},
  ]
};
const LadoSur = { titulo: 'Lado',seleccionMultiple: false,
  opciones: [{nombre: 'Izquierdo', texto: ' izquierdo,', siguiente: UbicacionSurIzq},{nombre: 'Derecho', texto: ' derecho,', siguiente: UbicacionSur},{nombre: 'Bilateral',textoLista: '_', texto: ' bilateral', siguiente: BilateralNSur},]//Antes UbicacionSurBlt
};
// Nervio Tibial
const UbicacionTibBlt = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnTibBlt', siguiente: Seleccion, zoomScale: 2.5, panX: 0, panY: -300, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnTibBltSg', siguiente: Seleccion, zoomScale: 2.5, panX: 0, panY: -300,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: Seleccion, zoomScale: 2.5, panX: 0, panY: -300,},
  ]};

const UbicacionTibIzq = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnTibIzq', siguiente: Seleccion, zoomScale: 2.5, panX: 0, panY: -300, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnTibIzqSg', siguiente: Seleccion, zoomScale: 2.5, panX: 0, panY: -300,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: Seleccion, zoomScale: 2.5, panX: 0, panY: -300,},
  ]};

const UbicacionTib = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnTib', siguiente: Seleccion, zoomScale: 2.5, panX: 0, panY: -300,},
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnTibSg', siguiente: Seleccion, zoomScale: 2.5, panX: 0, panY: -300,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: Seleccion, zoomScale: 2.5, panX: 0, panY: -300,},
  ]};

const BilateralNTib = {
  titulo: 'Bilateral',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Predominio derecho', textoLista: 'Lado - Bilateral predominio derecho' , texto: ' con predominio derecho,', siguiente: UbicacionTibBlt},
    {nombre: 'Predominio izquierdo', textoLista: 'Lado - Bilateral predominio izquierdo' , texto: ' con predominio izquierdo,', siguiente: UbicacionTibBlt},
  ]
};
const LadoTib = { titulo: 'Lado',seleccionMultiple: false,
  opciones: [{nombre: 'Izquierdo', texto: ' izquierdo,', siguiente: UbicacionTibIzq},{nombre: 'Derecho', texto: ' derecho,', siguiente: UbicacionTib},{nombre: 'Bilateral',textoLista: '_', texto: ' bilateral', siguiente: BilateralNTib},]//Antes UbicacionTibBlt
};
// Nervio peroneo profundo
const UbicacionPerPfBlt = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnPerPfBlt', siguiente: Seleccion, zoomScale: 2.8, panX: 0, panY: -390, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnPerPfBltSg', siguiente: Seleccion, zoomScale: 2.8, panX: 0, panY: -390,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: Seleccion, zoomScale: 2.8, panX: 0, panY: -390,},
  ]};

const UbicacionPerPfIzq = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnPerPfIzq', siguiente: Seleccion, zoomScale: 2.8, panX: 0, panY: -390, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnPerPfIzqSg', siguiente: Seleccion, zoomScale: 2.8, panX: 0, panY: -390,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: Seleccion, zoomScale: 2.8, panX: 0, panY: -390,},
  ]};

const UbicacionPerPf = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnPerPf', siguiente: Seleccion, zoomScale: 2.8, panX: 0, panY: -390,},
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnPerPfSg', siguiente: Seleccion, zoomScale: 2.8, panX: 0, panY: -390,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: Seleccion, zoomScale: 2.8, panX: 0, panY: -390,},
  ]};

const BilateralNPerP = {
  titulo: 'Bilateral',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Predominio derecho', textoLista: 'Lado - Bilateral predominio derecho' , texto: ' con predominio derecho,', siguiente: UbicacionPerPfBlt},
    {nombre: 'Predominio izquierdo', textoLista: 'Lado - Bilateral predominio izquierdo' , texto: ' con predominio izquierdo,', siguiente: UbicacionPerPfBlt},
  ]
};
const LadoPerPf = { titulo: 'Lado',seleccionMultiple: false,
  opciones: [{nombre: 'Izquierdo', texto: ' izquierdo,', siguiente: UbicacionPerPfIzq},{nombre: 'Derecho', texto: ' derecho,', siguiente: UbicacionPerPf},{nombre: 'Bilateral',textoLista: '_', texto: ' bilateral', siguiente: BilateralNPerP},]//Antes UbicacionPerBlt
};
// Nervio peroneo Superficial
const UbicacionPerSpBlt = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnPerSpBlt', siguiente: SeleccionC, zoomScale: 2.7, panX: 0, panY: -340, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnPerSpBltSg', siguiente: SeleccionC, zoomScale: 2.7, panX: 0, panY: -340,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionC, zoomScale: 2.7, panX: 0, panY: -340,},
  ]};

const UbicacionPerSpIzq = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnPerSpIzq', siguiente: SeleccionC, zoomScale: 2.7, panX: 0, panY: -340, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnPerSpIzqSg', siguiente: SeleccionC, zoomScale: 2.7, panX: 0, panY: -340,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionC, zoomScale: 2.7, panX: 0, panY: -340,},
  ]};

const UbicacionPerSp = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnPerSp', siguiente: SeleccionC, zoomScale: 2.7, panX: 0, panY: -340,},
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnPerSpSg', siguiente: SeleccionC, zoomScale: 2.7, panX: 0, panY: -340,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionC, zoomScale: 2.7, panX: 0, panY: -340,},
  ]};

const BilateralNPerS = {
  titulo: 'Bilateral',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Predominio derecho', textoLista: 'Lado - Bilateral predominio derecho' , texto: ' con predominio derecho,', siguiente: UbicacionPerSpBlt},
    {nombre: 'Predominio izquierdo', textoLista: 'Lado - Bilateral predominio izquierdo' , texto: ' con predominio izquierdo,', siguiente: UbicacionPerSpBlt},
  ]
};
const LadoPerSp = { titulo: 'Lado',seleccionMultiple: false,
  opciones: [{nombre: 'Izquierdo', texto: ' izquierdo,', siguiente: UbicacionPerSpIzq},{nombre: 'Derecho', texto: ' derecho,', siguiente: UbicacionPerSp},{nombre: 'Bilateral',textoLista: '_', texto: ' bilateral', siguiente: BilateralNPerS},]//Antes UbicacionPerBlt
};
// Nervio Peroneo Común
const UbicacionPerBlt = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnPerBlt', siguiente: Seleccion, zoomScale: 2.7, panX: 0, panY: -310, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnPerBltSg', siguiente: Seleccion, zoomScale: 2.7, panX: 0, panY: -310,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: Seleccion, zoomScale: 2.7, panX: 0, panY: -310,},
  ]};

const UbicacionPerIzq = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnPerIzq', siguiente: Seleccion, zoomScale: 2.7, panX: 0, panY: -310, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnPerIzqSg', siguiente: Seleccion, zoomScale: 2.7, panX: 0, panY: -310,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: Seleccion, zoomScale: 2.7, panX: 0, panY: -310,},
  ]};

const UbicacionPer = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnPer', siguiente: Seleccion, zoomScale: 2.7, panX: 0, panY: -310,},
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnPerSg', siguiente: Seleccion, zoomScale: 2.7, panX: 0, panY: -310,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: Seleccion, zoomScale: 2.7, panX: 0, panY: -310,},
  ]};

const BilateralNPC = {
  titulo: 'Bilateral',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Predominio derecho', textoLista: 'Lado - Bilateral predominio derecho' , texto: ' con predominio derecho,', siguiente: UbicacionPerBlt},
    {nombre: 'Predominio izquierdo', textoLista: 'Lado - Bilateral predominio izquierdo' , texto: ' con predominio izquierdo,', siguiente: UbicacionPerBlt},
  ]
};
const LadoPer = { titulo: 'Lado',seleccionMultiple: false,
  opciones: [{nombre: 'Izquierdo', texto: ' izquierdo,', siguiente: UbicacionPerIzq},{nombre: 'Derecho', texto: ' derecho,', siguiente: UbicacionPer},{nombre: 'Bilateral',textoLista: '_', texto: ' bilateral', siguiente: BilateralNPC},]//Antes UbicacionPerBlt
};

// nervio obturador
const UbicacionObtBlt = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnObtBlt', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: 0, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnObtBltSg', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: 0,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: 0,},
  ]};

const UbicacionObtIzq = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnObtIzq', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: 0, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnObtIzqSg', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: 0,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: 0,},
  ]};

const UbicacionObt = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnObt', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: 0,},
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnObtSg', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: 0,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: 0,},
  ]};

const BilateralNOb = {
  titulo: 'Bilateral',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Predominio derecho', textoLista: 'Lado - Bilateral predominio derecho' , texto: ' con predominio derecho,', siguiente: UbicacionObtBlt},
    {nombre: 'Predominio izquierdo', textoLista: 'Lado - Bilateral predominio izquierdo' , texto: ' con predominio izquierdo,', siguiente: UbicacionObtBlt},
  ]
};
const LadoObt = { titulo: 'Lado',seleccionMultiple: false,
  opciones: [{nombre: 'Izquierdo', texto: ' izquierdo,', siguiente: UbicacionObtIzq},{nombre: 'Derecho', texto: ' derecho,', siguiente: UbicacionObt},{nombre: 'Bilateral',textoLista: '_', texto: ' bilateral', siguiente: BilateralNOb},]//Antes UbicacionObtBlt
};
// Nervio Safeno
const UbicacionSafBlt = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnSafBlt', siguiente: SeleccionC, zoomScale: 2.8, panX: 0, panY: -350, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnSafBltSg', siguiente: SeleccionC, zoomScale: 2.8, panX: 0, panY: -350,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionC, zoomScale: 2.8, panX: 0, panY: -350,},
  ]};

const UbicacionSafIzq = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnSafIzq', siguiente: SeleccionC, zoomScale: 2.8, panX: 0, panY: -350, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnSafIzqSg', siguiente: SeleccionC, zoomScale: 2.8, panX: 0, panY: -350,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionC, zoomScale: 2.8, panX: 0, panY: -350,},
  ]};

const UbicacionSaf = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnSaf', siguiente: SeleccionC, zoomScale: 2.8, panX: 0, panY: -350,},
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnSafSg', siguiente: SeleccionC, zoomScale: 2.8, panX: 0, panY: -350,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionC, zoomScale: 2.8, panX: 0, panY: -350,},
  ]};

const BilateralNSf = {
  titulo: 'Bilateral',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Predominio derecho', textoLista: 'Lado - Bilateral predominio derecho' , texto: ' con predominio derecho,', siguiente: UbicacionSafBlt},
    {nombre: 'Predominio izquierdo', textoLista: 'Lado - Bilateral predominio izquierdo' , texto: ' con predominio izquierdo,', siguiente: UbicacionSafBlt},
  ]
};
const LadoSaf = { titulo: 'Lado',seleccionMultiple: false,
  opciones: [{nombre: 'Izquierdo', texto: ' izquierdo,', siguiente: UbicacionSafIzq},{nombre: 'Derecho', texto: ' derecho,', siguiente: UbicacionSaf},{nombre: 'Bilateral',textoLista: '_', texto: ' bilateral', siguiente: BilateralNSf},]//Antes UbicacionSafBlt
};

// Nervio Femorocutáneo Lateral
const UbicacionFemctBlt = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnFemctBlt', siguiente: SeleccionC, zoomScale: 2.8, panX: 0, panY: -40, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnFemctBltSg', siguiente: SeleccionC, zoomScale: 2.8, panX: 0, panY: -40,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionC, zoomScale: 2.8, panX: 0, panY: -40,},
  ]};

const UbicacionFemctIzq = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnFemctIzq', siguiente: SeleccionC, zoomScale: 2.8, panX: 0, panY: -40, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnFemctIzqSg', siguiente: SeleccionC, zoomScale: 2.8, panX: 0, panY: -40,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionC, zoomScale: 2.8, panX: 0, panY: -40,},
  ]};

const UbicacionFemct = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnFemct', siguiente: SeleccionC, zoomScale: 2.8, panX: 0, panY: -40,},
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnFemctSg', siguiente: SeleccionC, zoomScale: 2.8, panX: 0, panY: -40,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionC, zoomScale: 2.8, panX: 0, panY: -40,},
  ]};

const BilateralNFLr = {
  titulo: 'Bilateral',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Predominio derecho', textoLista: 'Lado - Bilateral predominio derecho' , texto: ' con predominio derecho,', siguiente: UbicacionFemctBlt},
    {nombre: 'Predominio izquierdo', textoLista: 'Lado - Bilateral predominio izquierdo' , texto: ' con predominio izquierdo,', siguiente: UbicacionFemctBlt},
  ]
};
const LadoFemct = { titulo: 'Lado',seleccionMultiple: false,
  opciones: [{nombre: 'Izquierdo', texto: ' izquierdo,', siguiente: UbicacionFemctIzq},{nombre: 'Derecho', texto: ' derecho,', siguiente: UbicacionFemct},{nombre: 'Bilateral',textoLista: '_', texto: ' bilateral', siguiente: BilateralNFLr},]//Antes UbicacionFemctBlt
};

// Nervio Femoral
const UbicacionFemBlt = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnFemBlt', siguiente: Seleccion, zoomScale: 2.1, panX: 0, panY: -100, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnFemBltSg', siguiente: Seleccion, zoomScale: 2.1, panX: 0, panY: -100,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: Seleccion, zoomScale: 2.1, panX: 0, panY: -100,},
  ]};

const UbicacionFemIzq = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnFemIzq', siguiente: Seleccion, zoomScale: 2.1, panX: 0, panY: -100, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnFemIzqSg', siguiente: Seleccion, zoomScale: 2.1, panX: 0, panY: -100,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: Seleccion, zoomScale: 2.1, panX: 0, panY: -100,},
  ]};

const UbicacionFem = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnFem', siguiente: Seleccion, zoomScale: 2.1, panX: 0, panY: -100,},
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnFemSg', siguiente: Seleccion, zoomScale: 2.1, panX: 0, panY: -100,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: Seleccion, zoomScale: 2.1, panX: 0, panY: -100,},
  ]};

const BilateralNFm = {
  titulo: 'Bilateral',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Predominio derecho', textoLista: 'Lado - Bilateral predominio derecho' , texto: ' con predominio derecho,', siguiente: UbicacionFemBlt},
    {nombre: 'Predominio izquierdo', textoLista: 'Lado - Bilateral predominio izquierdo' , texto: ' con predominio izquierdo,', siguiente: UbicacionFemBlt},
  ]
};
const LadoFem = { titulo: 'Lado',seleccionMultiple: false,
  opciones: [{nombre: 'Izquierdo', texto: ' izquierdo,', siguiente: UbicacionFemIzq},{nombre: 'Derecho', texto: ' derecho,', siguiente: UbicacionFem},{nombre: 'Bilateral',textoLista: '_', texto: ' bilateral', siguiente: BilateralNFm},]//Antes UbicacionFemBlt
};
// Nervio Glúteo Superior
const UbicacionGltSpBlt = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnGltSpBlt', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: -30, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnGltSpBltSg', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: -30,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: -30,},
  ]};

const UbicacionGltSpIzq = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnGltSpIzq', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: -30, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnGltSpIzqSg', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: -30,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: -30,},
  ]};

const UbicacionGltSp = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnGltSp', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: -30,},
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnGltSpSg', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: -30,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: -30,},
  ]};

const BilateralNGS = {
  titulo: 'Bilateral',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Predominio derecho', textoLista: 'Lado - Bilateral predominio derecho' , texto: ' con predominio derecho,', siguiente: UbicacionGltSpBlt},
    {nombre: 'Predominio izquierdo', textoLista: 'Lado - Bilateral predominio izquierdo' , texto: ' con predominio izquierdo,', siguiente: UbicacionGltSpBlt},
  ]
};
const LadoGltSp = { titulo: 'Lado',seleccionMultiple: false,
  opciones: [{nombre: 'Izquierdo', texto: ' izquierdo,', siguiente: UbicacionGltSpIzq},{nombre: 'Derecho', texto: ' derecho,', siguiente: UbicacionGltSp},{nombre: 'Bilateral',textoLista: '_', texto: ' bilateral', siguiente: BilateralNGS},]//Antes UbicacionGltSpBlt
};

// Nervio Glúteo Inferior
const UbicacionGltInBlt = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnGltInBlt', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: -30, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnGltInBltSg', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: -30,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: -30,},
  ]};

const UbicacionGltInIzq = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnGltInIzq', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: -30, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnGltInIzqSg', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: -30,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: -30,},
  ]};

const UbicacionGltIn = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnGltIn', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: -30,},
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnGltInSg', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: -30,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: -30,},
  ]};

const BilateralNGI = {
  titulo: 'Bilateral',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Predominio derecho', textoLista: 'Lado - Bilateral predominio derecho' , texto: ' con predominio derecho,', siguiente: UbicacionGltInBlt},
    {nombre: 'Predominio izquierdo', textoLista: 'Lado - Bilateral predominio izquierdo' , texto: ' con predominio izquierdo,', siguiente: UbicacionGltInBlt},
  ]
};
const LadoGltIn = { titulo: 'Lado',seleccionMultiple: false,
  opciones: [{nombre: 'Izquierdo', texto: ' izquierdo,', siguiente: UbicacionGltInIzq},{nombre: 'Derecho', texto: ' derecho,', siguiente: UbicacionGltIn},{nombre: 'Bilateral',textoLista: '_', texto: ' bilateral', siguiente: BilateralNGI},]//Antes UbicacionGltInBlt
};
// Nervio Facial
const UbicacionFaciBlt = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnFaciBlt', siguiente: SeleccionB, zoomScale: 3.7, panX: 0, panY: 540, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnFaciBltSg', siguiente: SeleccionB, zoomScale: 3.7, panX: 0, panY: 540,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionB, zoomScale: 3.7, panX: 0, panY: 540,},
  ]};

const UbicacionFaciIzq = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnFaciIzq', siguiente: SeleccionB, zoomScale: 3.7, panX: 0, panY: 540, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnFaciIzqSg', siguiente: SeleccionB, zoomScale: 3.7, panX: 0, panY: 540,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionB, zoomScale: 3.7, panX: 0, panY: 540,},
  ]};

const UbicacionFaci = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnFaci', siguiente: SeleccionB, zoomScale: 3.7, panX: 0, panY: 540,},
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnFaciSg', siguiente: SeleccionB, zoomScale: 3.7, panX: 0, panY: 540,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionB, zoomScale: 3.7, panX: 0, panY: 540,},
  ]};

const BilateralNFc = {
  titulo: 'Bilateral',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Predominio derecho', textoLista: 'Lado - Bilateral predominio derecho' , texto: ' con predominio derecho,', siguiente: UbicacionFaciBlt},
    {nombre: 'Predominio izquierdo', textoLista: 'Lado - Bilateral predominio izquierdo' , texto: ' con predominio izquierdo,', siguiente: UbicacionFaciBlt},
  ]
};
const LadoFaci = { titulo: 'Lado',seleccionMultiple: false,
  opciones: [{nombre: 'Izquierdo', texto: ' izquierdo,', siguiente: UbicacionFaciIzq},{nombre: 'Derecho', texto: ' derecho,', siguiente: UbicacionFaci},{nombre: 'Bilateral',textoLista: '_', texto: ' bilateral', siguiente: BilateralNFc},]//Antes UbicacionFaciBlt
};
// Nervio Accesorio
const UbicacionAccBlt = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnAccBlt', siguiente: SeleccionB, zoomScale: 3.5, panX: 0, panY: 380, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnAccBltSg', siguiente: SeleccionB, zoomScale: 3.5, panX: 0, panY: 380,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionB, zoomScale: 3.5, panX: 0, panY: 380,},
  ]};

const UbicacionAccIzq = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnAccIzq', siguiente: SeleccionB, zoomScale: 3.5, panX: 0, panY: 380, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnAccIzqSg', siguiente: SeleccionB, zoomScale: 3.5, panX: 0, panY: 380,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionB, zoomScale: 3.5, panX: 0, panY: 380,},
  ]};

const UbicacionAcc = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnAcc', siguiente: SeleccionB, zoomScale: 3.5, panX: 0, panY: 380,},
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnAccSg', siguiente: SeleccionB, zoomScale: 3.5, panX: 0, panY: 380,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionB, zoomScale: 3.5, panX: 0, panY: 380,},
  ]};

const BilateralNAc = {
  titulo: 'Bilateral',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Predominio derecho', textoLista: 'Lado - Bilateral predominio derecho' , texto: ' con predominio derecho,', siguiente: UbicacionAccBlt},
    {nombre: 'Predominio izquierdo', textoLista: 'Lado - Bilateral predominio izquierdo' , texto: ' con predominio izquierdo,', siguiente: UbicacionAccBlt},
  ]
};
const LadoAcc = { titulo: 'Lado',seleccionMultiple: false,
  opciones: [{nombre: 'Izquierdo', texto: ' izquierdo,', siguiente: UbicacionAccIzq},{nombre: 'Derecho', texto: ' derecho,', siguiente: UbicacionAcc},{nombre: 'Bilateral',textoLista: '_', texto: ' bilateral', siguiente: BilateralNAc},]//Antes UbicacionAccBlt
};
// Nervio Frénico
const UbicacionFrnBlt = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnFrnBlt', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: 260, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnFrnBltSg', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: 260,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: 260,},
  ]};

const UbicacionFrnIzq = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnFrnIzq', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: 260, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnFrnIzqSg', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: 260,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: 260,},
  ]};

const UbicacionFrn = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnFrn', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: 260,},
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnFrnSg', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: 260,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: 260,},
  ]};

const BilateralNF = {
  titulo: 'Bilateral',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Predominio derecho', textoLista: 'Lado - Bilateral predominio derecho' , texto: ' con predominio derecho,', siguiente: UbicacionFrnBlt},
    {nombre: 'Predominio izquierdo', textoLista: 'Lado - Bilateral predominio izquierdo' , texto: ' con predominio izquierdo,', siguiente: UbicacionFrnBlt},
  ]
};
const LadoFrn = { titulo: 'Lado',seleccionMultiple: false,
  opciones: [{nombre: 'Izquierdo', texto: ' izquierdo,', siguiente: UbicacionFrnIzq},{nombre: 'Derecho', texto: ' derecho,', siguiente: UbicacionFrn},{nombre: 'Bilateral',textoLista: '_', texto: ' bilateral', siguiente: BilateralNF},]//Antes UbicacionFrnBlt
};
// Nervio Antebraquial Lateral
const UbicacionAntLrBlt = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnAntLrBlt', siguiente: SeleccionC, zoomScale: 2.5, panX: 0, panY: 180, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnAntLrBltSg', siguiente: SeleccionC, zoomScale: 2.5, panX: 0, panY: 180,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionC, zoomScale: 2.5, panX: 0, panY: 180,},
  ]};

const UbicacionAntLrIzq = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnAntLrIzq', siguiente: SeleccionC, zoomScale: 2.5, panX: 0, panY: 180, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnAntLrIzqSg', siguiente: SeleccionC, zoomScale: 2.5, panX: 0, panY: 180,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionC, zoomScale: 2.5, panX: 0, panY: 180,},
  ]};

const UbicacionAntLr = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnAntLr', siguiente: SeleccionC, zoomScale: 2.5, panX: 0, panY: 180,},
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnAntLrSg', siguiente: SeleccionC, zoomScale: 2.5, panX: 0, panY: 180,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionC, zoomScale: 2.5, panX: 0, panY: 180,},
  ]};

const BilateralNALr = {
  titulo: 'Bilateral',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Predominio derecho', textoLista: 'Lado - Bilateral predominio derecho' , texto: ' con predominio derecho,', siguiente: UbicacionAntLrBlt},
    {nombre: 'Predominio izquierdo', textoLista: 'Lado - Bilateral predominio izquierdo' , texto: ' con predominio izquierdo,', siguiente: UbicacionAntLrBlt},
  ]
};
const LadoAntLr = { titulo: 'Lado',seleccionMultiple: false,
  opciones: [{nombre: 'Izquierdo', texto: ' izquierdo,', siguiente: UbicacionAntLrIzq},{nombre: 'Derecho', texto: ' derecho,', siguiente: UbicacionAntLr},{nombre: 'Bilateral',textoLista: '_', texto: ' bilateral', siguiente: BilateralNALr},]//Antes UbicacionAntLrBlt
};
// Nervio Antebraquial Medial
const UbicacionAntMBlt = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnAntMBlt', siguiente: SeleccionC, zoomScale: 2.5, panX: 0, panY: 120, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnAntMBltSg', siguiente: SeleccionC, zoomScale: 2.5, panX: 0, panY: 120,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionC, zoomScale: 2.5, panX: 0, panY: 120,},
  ]};

const UbicacionAntMIzq = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnAntMIzq', siguiente: SeleccionC, zoomScale: 2.5, panX: 0, panY: 120, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnAntMIzqSg', siguiente: SeleccionC, zoomScale: 2.5, panX: 0, panY: 120,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionC, zoomScale: 2.5, panX: 0, panY: 120,},
  ]};

const UbicacionAntM = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnAntM', siguiente: SeleccionC, zoomScale: 2.5, panX: 0, panY: 120,},
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnAntMSg', siguiente: SeleccionC, zoomScale: 2.5, panX: 0, panY: 120,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionC, zoomScale: 2.5, panX: 0, panY: 120,},
  ]};

const BilateralNAM = {
  titulo: 'Bilateral',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Predominio derecho', textoLista: 'Lado - Bilateral predominio derecho' , texto: ' con predominio derecho,', siguiente: UbicacionAntMBlt},
    {nombre: 'Predominio izquierdo', textoLista: 'Lado - Bilateral predominio izquierdo' , texto: ' con predominio izquierdo,', siguiente: UbicacionAntMBlt},
  ]
};
const LadoAntM = { titulo: 'Lado',seleccionMultiple: false,
  opciones: [{nombre: 'Izquierdo', texto: ' izquierdo,', siguiente: UbicacionAntMIzq},{nombre: 'Derecho', texto: ' derecho,', siguiente: UbicacionAntM},{nombre: 'Bilateral',textoLista: '_', texto: ' bilateral', siguiente: BilateralNAM},]//Antes UbicacionAntMBlt
};
// Nervio Toracico largo
const UbicacionToraBlt = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnToraBlt', siguiente: SeleccionB, zoomScale: 2.7, panX: 0, panY: 280, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnToraBltSg', siguiente: SeleccionB, zoomScale: 2.7, panX: 0, panY: 280,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionB, zoomScale: 2.7, panX: 0, panY: 280,},
  ]};

const UbicacionToraIzq = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnToraIzq', siguiente: SeleccionB, zoomScale: 2.7, panX: 0, panY: 280, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnToraIzqSg', siguiente: SeleccionB, zoomScale: 2.7, panX: 0, panY: 280,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionB, zoomScale: 2.7, panX: 0, panY: 280,},
  ]};

const UbicacionTora = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnTora', siguiente: SeleccionB, zoomScale: 2.7, panX: 0, panY: 280,},
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnToraSg', siguiente: SeleccionB, zoomScale: 2.7, panX: 0, panY: 280,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionB, zoomScale: 2.7, panX: 0, panY: 280,},
  ]};

const BilateralNTLg = {
  titulo: 'Bilateral',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Predominio derecho', textoLista: 'Lado - Bilateral predominio derecho' , texto: ' con predominio derecho,', siguiente: UbicacionToraBlt},
    {nombre: 'Predominio izquierdo', textoLista: 'Lado - Bilateral predominio izquierdo' , texto: ' con predominio izquierdo,', siguiente: UbicacionToraBlt},
  ]
};
const LadoTora = { titulo: 'Lado',seleccionMultiple: false,
  opciones: [{nombre: 'Izquierdo', texto: ' izquierdo,', siguiente: UbicacionToraIzq},{nombre: 'Derecho', texto: ' derecho,', siguiente: UbicacionTora},{nombre: 'Bilateral',textoLista: '_', texto: ' bilateral', siguiente: BilateralNTLg},]//Antes UbicacionToraBlt
};
// Nervio Toracodorsal
const UbicacionToracBlt = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnToracBlt', siguiente: SeleccionB, zoomScale: 2.7, panX: 0, panY: 280, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnToracBltSg', siguiente: SeleccionB, zoomScale: 2.7, panX: 0, panY: 280,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionB, zoomScale: 2.7, panX: 0, panY: 280,},
  ]};

const UbicacionToracIzq = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnToracIzq', siguiente: SeleccionB, zoomScale: 2.7, panX: 0, panY: 280, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnToracIzqSg', siguiente: SeleccionB, zoomScale: 2.7, panX: 0, panY: 280,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionB, zoomScale: 2.7, panX: 0, panY: 280,},
  ]};

const UbicacionTorac = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnTorac', siguiente: SeleccionB, zoomScale: 2.7, panX: 0, panY: 280,},
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnToracSg', siguiente: SeleccionB, zoomScale: 2.7, panX: 0, panY: 280,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionB, zoomScale: 2.7, panX: 0, panY: 280,},
  ]};

const BilateralNTc = {
  titulo: 'Bilateral',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Predominio derecho', textoLista: 'Lado - Bilateral predominio derecho' , texto: ' con predominio derecho,', siguiente: UbicacionToracBlt},
    {nombre: 'Predominio izquierdo', textoLista: 'Lado - Bilateral predominio izquierdo' , texto: ' con predominio izquierdo,', siguiente: UbicacionToracBlt},
  ]
};
const LadoTorac = { titulo: 'Lado',seleccionMultiple: false,
  opciones: [{nombre: 'Izquierdo', texto: ' izquierdo,', siguiente: UbicacionToracIzq},{nombre: 'Derecho', texto: ' derecho,', siguiente: UbicacionTorac},{nombre: 'Bilateral',textoLista: '_', texto: ' bilateral', siguiente: BilateralNTc},]//Antes UbicacionToracBlt
};
// Nervio dorsal cutáneo
const UbicacionDrcBlt = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnDrcBlt', siguiente: SeleccionC, zoomScale: 2.2, panX: 0, panY: -70, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnDrcBltSg', siguiente: SeleccionC, zoomScale: 2.2, panX: 0, panY: -70,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionC, zoomScale: 2.2, panX: 0, panY: -70,},
  ]};

const UbicacionDrcIzq = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnDrcIzq', siguiente: SeleccionC, zoomScale: 2.2, panX: 0, panY: -70, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnDrcIzqSg', siguiente: SeleccionC, zoomScale: 2.2, panX: 0, panY: -70,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionC, zoomScale: 2.2, panX: 0, panY: -70,},
  ]};

const UbicacionDrc = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnDrc', siguiente: SeleccionC, zoomScale: 2.2, panX: 0, panY: -70,},
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnDrcSg', siguiente: SeleccionC, zoomScale: 2.2, panX: 0, panY: -70,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionC, zoomScale: 2.2, panX: 0, panY: -70,},
  ]};

const BilateralNdc = {
  titulo: 'Bilateral',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Predominio derecho', textoLista: 'Lado - Bilateral predominio derecho' , texto: ' con predominio derecho,', siguiente: UbicacionDrcBlt},
    {nombre: 'Predominio izquierdo', textoLista: 'Lado - Bilateral predominio izquierdo' , texto: ' con predominio izquierdo,', siguiente: UbicacionDrcBlt},
  ]
};
const LadoDrc = { titulo: 'Lado',seleccionMultiple: false,
  opciones: [{nombre: 'Izquierdo', texto: ' izquierdo,', siguiente: UbicacionDrcIzq},{nombre: 'Derecho', texto: ' derecho,', siguiente: UbicacionDrc},{nombre: 'Bilateral',textoLista: '_', texto: ' bilateral', siguiente: BilateralNdc},]//Antes UbicacionDrcBlt
};
// Nervio Ulnar
const UbicacionUlnBlt = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnUlnBlt', siguiente: Seleccion, zoomScale: 2.2, panX: 0, panY: 120, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnUlnBltSg', siguiente: Seleccion, zoomScale: 2.2, panX: 0, panY: 120,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: Seleccion, zoomScale: 2.2, panX: 0, panY: 120,},
  ]};

const UbicacionUlnIzq = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnUlnIzq', siguiente: Seleccion, zoomScale: 2.2, panX: 0, panY: 120, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnUlnIzqSg', siguiente: Seleccion, zoomScale: 2.2, panX: 0, panY: 120,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: Seleccion, zoomScale: 2.2, panX: 0, panY: 120,},
  ]};

const UbicacionUln = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnUln', siguiente: Seleccion, zoomScale: 2.2, panX: 0, panY: 120,},
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnUlnSg', siguiente: Seleccion, zoomScale: 2.2, panX: 0, panY: 120,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: Seleccion, zoomScale: 2.2, panX: 0, panY: 120,},
  ]};

const BilateralNUl = {
  titulo: 'Bilateral',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Predominio derecho', textoLista: 'Lado - Bilateral predominio derecho' , texto: ' con predominio derecho,', siguiente: UbicacionUlnBlt},
    {nombre: 'Predominio izquierdo', textoLista: 'Lado - Bilateral predominio izquierdo' , texto: ' con predominio izquierdo,', siguiente: UbicacionUlnBlt},
  ]
};
const LadoUln = { titulo: 'Lado',seleccionMultiple: false,
  opciones: [{nombre: 'Izquierdo', texto: ' izquierdo,', siguiente: UbicacionUlnIzq},{nombre: 'Derecho', texto: ' derecho,', siguiente: UbicacionUln},{nombre: 'Bilateral',textoLista: '_', texto: ' bilateral', siguiente: BilateralNUl},]//Antes UbicacionUlnBlt
};
// Nervio Supraescapular
const UbicacionSprBlt = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnSprBlt', siguiente: SeleccionB, zoomScale: 2.7, panX: 0, panY: 280, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnSprBltSg', siguiente: SeleccionB, zoomScale: 2.7, panX: 0, panY: 280,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionB, zoomScale: 2.7, panX: 0, panY: 280,},
  ]};

const UbicacionSprIzq = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnSprIzq', siguiente: SeleccionB, zoomScale: 2.7, panX: 0, panY: 280, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnSprIzqSg', siguiente: SeleccionB, zoomScale: 2.7, panX: 0, panY: 280,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionB, zoomScale: 2.7, panX: 0, panY: 280,},
  ]};

const UbicacionSpr = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnSpr', siguiente: SeleccionB, zoomScale: 2.7, panX: 0, panY: 280,},
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnSprSg', siguiente: SeleccionB, zoomScale: 2.7, panX: 0, panY: 280,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionB, zoomScale: 2.7, panX: 0, panY: 280,},
  ]};

const BilateralNSe = {
  titulo: 'Bilateral',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Predominio derecho', textoLista: 'Lado - Bilateral predominio derecho' , texto: ' con predominio derecho,', siguiente: UbicacionSprBlt},
    {nombre: 'Predominio izquierdo', textoLista: 'Lado - Bilateral predominio izquierdo' , texto: ' con predominio izquierdo,', siguiente: UbicacionSprBlt},
  ]
};
const LadoSpr = { titulo: 'Lado',seleccionMultiple: false,
  opciones: [{nombre: 'Izquierdo', texto: ' izquierdo,', siguiente: UbicacionSprIzq},{nombre: 'Derecho', texto: ' derecho,', siguiente: UbicacionSpr},{nombre: 'Bilateral',textoLista: '_', texto: ' bilateral', siguiente: BilateralNSe},]//Antes UbicacionSprBlt
};
// Nervio Interóseo posterior
const UbicacionInPsBlt = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnInPsBlt', siguiente: SeleccionB, zoomScale: 2.2, panX: 0, panY: -70, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnInPsBltSg', siguiente: SeleccionB, zoomScale: 2.2, panX: 0, panY: -70,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionB, zoomScale: 2.2, panX: 0, panY: -70,},
  ]};

const UbicacionInPsIzq = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnInPsIzq', siguiente: SeleccionB, zoomScale: 2.2, panX: 0, panY: -70, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnInPsIzqSg', siguiente: SeleccionB, zoomScale: 2.2, panX: 0, panY: -70,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionB, zoomScale: 2.2, panX: 0, panY: -70,},
  ]};

const UbicacionInPs = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnInPs', siguiente: SeleccionB, zoomScale: 2.2, panX: 0, panY: -70,},
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnInPsSg', siguiente: SeleccionB, zoomScale: 2.2, panX: 0, panY: -70,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionB, zoomScale: 2.2, panX: 0, panY: -70,},
  ]};

const BilateralNlp = {
  titulo: 'Bilateral',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Predominio derecho', textoLista: 'Lado - Bilateral predominio derecho' , texto: ' con predominio derecho,', siguiente: UbicacionInPsBlt},
    {nombre: 'Predominio izquierdo', textoLista: 'Lado - Bilateral predominio izquierdo' , texto: ' con predominio izquierdo,', siguiente: UbicacionInPsBlt},
  ]
};
const LadoInPs = { titulo: 'Lado',seleccionMultiple: false,
  opciones: [{nombre: 'Izquierdo', texto: ' izquierdo,', siguiente: UbicacionInPsIzq},{nombre: 'Derecho', texto: ' derecho,', siguiente: UbicacionInPs},{nombre: 'Bilateral',textoLista: '_', texto: ' bilateral', siguiente: BilateralNlp},]//Antes UbicacionInPsBlt
};
// Nercio Radial Superficial
const UbicacionRadsBlt = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnRadsBlt', siguiente: SeleccionC, zoomScale: 2.2, panX: 0, panY: -70, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnRadsBltSg', siguiente: SeleccionC, zoomScale: 2.2, panX: 0, panY: -70,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionC, zoomScale: 2.2, panX: 0, panY: -70,},
  ]};

const UbicacionRadsIzq = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnRadsIzq', siguiente: SeleccionC, zoomScale: 2.2, panX: 0, panY: -70, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnRadsIzqSg', siguiente: SeleccionC, zoomScale: 2.2, panX: 0, panY: -70,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionC, zoomScale: 2.2, panX: 0, panY: -70,},
  ]};

const UbicacionRads = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnRads', siguiente: SeleccionC, zoomScale: 2.2, panX: 0, panY: -70,},
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnRadsSg', siguiente: SeleccionC, zoomScale: 2.2, panX: 0, panY: -70,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionC, zoomScale: 2.2, panX: 0, panY: -70,},
  ]};

const BilateralNRS = {
  titulo: 'Bilateral',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Predominio derecho', textoLista: 'Lado - Bilateral predominio derecho' , texto: ' con predominio derecho,', siguiente: UbicacionRadsBlt},
    {nombre: 'Predominio izquierdo', textoLista: 'Lado - Bilateral predominio izquierdo' , texto: ' con predominio izquierdo,', siguiente: UbicacionRadsBlt},
  ]
};
const LadoRads = { titulo: 'Lado',seleccionMultiple: false,
  opciones: [{nombre: 'Izquierdo', texto: ' izquierdo,', siguiente: UbicacionRadsIzq},{nombre: 'Derecho', texto: ' derecho,', siguiente: UbicacionRads},{nombre: 'Bilateral',textoLista: '_', texto: ' bilateral', siguiente: BilateralNRS},]//Antes UbicacionRadsBlt
};

// Nervio Radial
const UbicacionRadBlt = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnRadBlt', siguiente: Seleccion, zoomScale: 2.4, panX: 0, panY: 220, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnRadBltSg', siguiente: Seleccion, zoomScale: 2.4, panX: 0, panY: 220,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: Seleccion, zoomScale: 2.4, panX: 0, panY: 220,},
  ]};

const UbicacionRadIzq = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnRadIzq', siguiente: Seleccion, zoomScale: 2.4, panX: 0, panY: 220, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnRadIzqSg', siguiente: Seleccion, zoomScale: 2.4, panX: 0, panY: 220,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: Seleccion, zoomScale: 2.4, panX: 0, panY: 220,},
  ]};

const UbicacionRad = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnRad', siguiente: Seleccion, zoomScale: 2.4, panX: 0, panY: 220,},
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnRadSg', siguiente: Seleccion, zoomScale: 2.4, panX: 0, panY: 220,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: Seleccion, zoomScale: 2.4, panX: 0, panY: 220,},
  ]};

const BilateralNR = {
  titulo: 'Bilateral',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Predominio derecho', textoLista: 'Lado - Bilateral predominio derecho' , texto: ' con predominio derecho,', siguiente: UbicacionRadBlt},
    {nombre: 'Predominio izquierdo', textoLista: 'Lado - Bilateral predominio izquierdo' , texto: ' con predominio izquierdo,', siguiente: UbicacionRadBlt},
  ]
};
const LadoRad = { titulo: 'Lado',seleccionMultiple: false,
  opciones: [{nombre: 'Izquierdo', texto: ' izquierdo,', siguiente: UbicacionRadIzq},{nombre: 'Derecho', texto: ' derecho,', siguiente: UbicacionRad},{nombre: 'Bilateral',textoLista: '_', texto: ' bilateral', siguiente: BilateralNR},]//Antes UbicacionRadBlt
};

// Nervio Musculocutáneo
const UbicacionMctnBlt = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnMctnBlt', siguiente: Seleccion, zoomScale: 2.4, panX: 0, panY: 220, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnMctnBltSg', siguiente: Seleccion, zoomScale: 2.4, panX: 0, panY: 220,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionB, zoomScale: 2.4, panX: 0, panY: 220,},
  ]};

const UbicacionMctnIzq = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnMctnIzq', siguiente: Seleccion, zoomScale: 2.4, panX: 0, panY: 220, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnMctnIzqSg', siguiente: Seleccion, zoomScale: 2.4, panX: 0, panY: 220,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: Seleccion, zoomScale: 2.4, panX: 0, panY: 220,},
  ]};

const UbicacionMctn = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnMctn', siguiente: Seleccion, zoomScale: 2.4, panX: 0, panY: 220,},
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnMctnSg', siguiente: Seleccion, zoomScale: 2.4, panX: 0, panY: 220,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: Seleccion, zoomScale: 2.4, panX: 0, panY: 220,},
  ]};

const BilateralNMl = {
  titulo: 'Bilateral',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Predominio derecho', textoLista: 'Lado - Bilateral predominio derecho' , texto: ' con predominio derecho,', siguiente: UbicacionMctnBlt},
    {nombre: 'Predominio izquierdo', textoLista: 'Lado - Bilateral predominio izquierdo' , texto: ' con predominio izquierdo,', siguiente: UbicacionMctnBlt},
  ]
};
const LadoMctn = { titulo: 'Lado',seleccionMultiple: false,
  opciones: [{nombre: 'Izquierdo', texto: ' izquierdo,', siguiente: UbicacionMctnIzq},{nombre: 'Derecho', texto: ' derecho,', siguiente: UbicacionMctn},{nombre: 'Bilateral',textoLista: '_', texto: ' bilateral', siguiente: BilateralNMl},]//Antes UbicacionMctnBlt
};
// Nervio Axilar
const UbicacionAxlBlt = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnAxlBlt', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: 280, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnAxlBltSg', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: 280,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: 280,},
  ]};

const UbicacionAxlIzq = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnAxlIzq', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: 280, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnAxlIzqSg', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: 280,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: 280,},
  ]};

const UbicacionAxl = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnAxl', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: 280,},
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnAxlSg', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: 280,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionB, zoomScale: 3, panX: 0, panY: 280,},
  ]};

const BilateralNA = {
  titulo: 'Bilateral',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Predominio derecho', textoLista: 'Lado - Bilateral predominio derecho' , texto: ' con predominio derecho,', siguiente: UbicacionAxlBlt},
    {nombre: 'Predominio izquierdo', textoLista: 'Lado - Bilateral predominio izquierdo' , texto: ' con predominio izquierdo,', siguiente: UbicacionAxlBlt},
  ]
};
const LadoAxl = { titulo: 'Lado',seleccionMultiple: false,
  opciones: [{nombre: 'Izquierdo', texto: ' izquierdo,', siguiente: UbicacionAxlIzq},{nombre: 'Derecho', texto: ' derecho,', siguiente: UbicacionAxl},{nombre: 'Bilateral',textoLista: '_', texto: ' bilateral', siguiente: BilateralNA},]//Antes UbicacionAxlBlt
};
// Nervio Interóseo anterior
const UbicacionIntAnBlt = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnIntAnBlt', siguiente: SeleccionB, zoomScale: 2.4, panX: 0, panY: -20, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnIntAnBltSg', siguiente: SeleccionB, zoomScale: 2.4, panX: 0, panY: -20,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionB, zoomScale: 2.4, panX: 0, panY: -20,},
  ]};

const UbicacionIntAnIzq = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnIntAnIzq', siguiente: SeleccionB, zoomScale: 2.4, panX: 0, panY: -20, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnIntAnIzqSg', siguiente: SeleccionB, zoomScale: 2.4, panX: 0, panY: -20,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionB, zoomScale: 2.4, panX: 0, panY: -20,},
  ]};

const UbicacionIntAn = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BtnIntAn', siguiente: SeleccionB, zoomScale: 2.4, panX: 0, panY: -20, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BtnIntAnSg', siguiente: SeleccionB, zoomScale: 2.4, panX: 0, panY: -20,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: SeleccionB, zoomScale: 2.4, panX: 0, panY: -20,},
  ]};

const BilateralNIA = {
  titulo: 'Bilateral',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Predominio derecho', textoLista: 'Lado - Bilateral predominio derecho' , texto: ' con predominio derecho,', siguiente: UbicacionIntAnBlt},
    {nombre: 'Predominio izquierdo', textoLista: 'Lado - Bilateral predominio izquierdo' , texto: ' con predominio izquierdo,', siguiente: UbicacionIntAnBlt},
  ]
};
const LadoIntAn = { titulo: 'Lado',seleccionMultiple: false,
  opciones: [{nombre: 'Izquierdo', texto: ' izquierdo,', siguiente: UbicacionIntAnIzq},{nombre: 'Derecho', texto: ' derecho,', siguiente: UbicacionIntAn},{nombre: 'Bilateral',textoLista: '_', texto: ' bilateral', siguiente: BilateralNIA},]//Antes UbicacionIntAnBlt
};
// Nervio Mediano
const UbicacionMdBlt = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BotónMedianoBtl', siguiente: Seleccion, zoomScale: 2, panX: 0, panY: 80, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BotónMedianoBtlSg', siguiente: Seleccion, zoomScale: 2, panX: 0, panY: 80,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: Seleccion, zoomScale: 2, panX: 0, panY: 80,},
  ]};

const UbicacionMdIzq = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BotónMedianoIzq', siguiente: Seleccion, zoomScale: 2, panX: 0, panY: 80, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BotónMedianoIzqSg', siguiente: Seleccion, zoomScale: 2, panX: 0, panY: 80,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: Seleccion, zoomScale: 2, panX: 0, panY: 80,},
  ]};

const UbicacionMd = { titulo: 'Ubicación', seleccionMultiple: false,opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel',  BtnNerv: 'BotónMediano', siguiente: Seleccion, zoomScale: 2, panX: 0, panY: 80, },
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel ', BtnNervSeg: 'BotónMedianoSg', siguiente: Seleccion, zoomScale: 2, panX: 0, panY: 80,},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel', siguiente: Seleccion, zoomScale: 2, panX: 0, panY: 80,}
    ]};

const BilateralNM = {
  titulo: 'Bilateral',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Predominio derecho', textoLista: 'Lado - Bilateral predominio derecho' , texto: ' con predominio derecho,', siguiente: UbicacionMdBlt},
    {nombre: 'Predominio izquierdo', textoLista: 'Lado - Bilateral predominio izquierdo' , texto: ' con predominio izquierdo,', siguiente: UbicacionMdBlt},
  ]
};
const LadoMd = { titulo: 'Lado',seleccionMultiple: false,
  opciones: [{nombre: 'Izquierdo', texto: ' izquierdo,', siguiente: UbicacionMdIzq},{nombre: 'Derecho', texto: ' derecho,', siguiente: UbicacionMd},{nombre: 'Bilateral',textoLista: '_', texto: ' bilateral', siguiente: BilateralNM},]
};


const Ubicacion = {
  titulo: 'Ubicación',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Focalizada', texto: ' focalizada a nivel ', siguiente: Tipo},
    {nombre: 'Segmentaria', texto: ' segmentaria a nivel', BtnNervSeg: 'Sg', siguiente: Tipo},
    //{nombre: 'Generalizada', texto: ' generalizada a nivel ', siguiente: Tipo},
  ]
};

const Bilateral = {
  titulo: 'Bilateral',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Predominio derecho', textoLista: 'Lado - Bilateral predominio derecho' ,  texto: ' con predominio derecho,', siguiente: Ubicacion},
    {nombre: 'Predominio izquierdo', textoLista: 'Lado - Bilateral predominio izquierdo' , texto: ' con predominio izquierdo,', siguiente: Ubicacion},
  ]
};

const Lado = {
  titulo: 'Lado',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Izquierdo', texto: ' izquierdo,', siguiente: Ubicacion},
    {nombre: 'Derecho', texto: ' derecho,', siguiente: Ubicacion},
    {nombre: 'Bilateral 2',textoLista: '_', texto: ' bilateral', siguiente: Bilateral},
  ]
};

const Sacro = {
  titulo: 'Nervio',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Ciático', texto: 'de nervio Ciático', siguiente: LadoCia, ImgValue: 'Ciatico'},
    {nombre: 'Pudendo', texto: 'de nervio Pudendo', siguiente: LadoPud, ImgValue: 'Pudendo'  },
  ]
};

const Inferiores = {
  titulo: 'Nervio',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Glúteo inferior', texto: 'de nervio Glúteo inferior', siguiente: LadoGltIn, ImgValue: 'GluteoInf'},
    {nombre: 'Glúteo superior', texto: 'de nervio Glúteo superior', siguiente: LadoGltSp, ImgValue: 'GluteoSup'},
    {nombre: 'Femoral', texto: 'de nervio Femoral', siguiente: LadoFem, ImgValue: 'Femoral'},
    {nombre: 'Femorocutáneo lateral', texto: 'de nervio Femorocutáneo lateral', siguiente: LadoFemct, ImgValue: 'FemoralCtn'},
    {nombre: 'Safeno', texto: 'de nervio Safeno', siguiente: LadoSaf, ImgValue: 'Safeno'},
    {nombre: 'Obturador', texto: 'de nervio Obturador', siguiente: LadoObt, ImgValue: 'Obturador'},
    {nombre: 'Peroneo común', texto: 'de nervio Peroneo común', siguiente: LadoPer, ImgValue: 'Peroneo'},
    {nombre: 'Peroneo superficial', texto: 'de nervio Peroneo superficial', siguiente: LadoPerSp, ImgValue: 'PeroneoS'},
    {nombre: 'Peroneo profundo', texto: 'de nervio Peroneo profundo', siguiente: LadoPerPf, ImgValue: 'PeroneoP'},
    {nombre: 'Tibial', texto: 'de nervio Tibial', siguiente: LadoTib, ImgValue: 'Tibial'},
    {nombre: 'Sural', texto: 'de nervio Sural', siguiente: LadoSur, ImgValue: 'Sural'},
    {nombre: 'Plantar medial', texto: 'de nervio Plantar medial', siguiente: LadoPlaMe, ImgValue: 'PlantarMe'},
    {nombre: 'Plantar lateral', texto: 'de nervio Plantar lateral', siguiente: LadoPlaLt, ImgValue: 'PlantarLa'},
    {nombre: 'Ilioiguinal', texto: 'de nervio Ilioiguinal', siguiente: LadoIlio, ImgValue: 'Ilioiguinal'},
  ]
};

const Craneales = {
  titulo: 'Nervio',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Frénico', texto: 'de nervio Frénico', siguiente: LadoFrn, ImgValue: 'Frenico'},
    {nombre: 'Accesorio', texto: 'de nervio Accesorio', siguiente: LadoAcc, ImgValue: 'Accesorio'},
    {nombre: 'Facial', texto: 'de nervio Facial', siguiente: LadoFaci, ImgValue: 'Facial'},
  ]
};

const Superiores = {
  titulo: 'Nervio',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Mediano', texto: 'de nervio Mediano', siguiente: LadoMd, ImgValue: 'MedianoImg'},
    {nombre: 'Interóseo anterior', texto: 'de nervio Interóseo anterior', siguiente: LadoIntAn, BtnNerv: 'Interoseo', ImgValue: 'InteroseoA'},
    {nombre: 'Axilar', texto: 'de nervio Axilar', siguiente: LadoAxl, ImgValue: 'Axilar'},
    {nombre: 'Musculocutáneo', texto: 'de nervio Musculocutáneo', siguiente: LadoMctn, ImgValue: 'Musculocutáneo'},
    {nombre: 'Radial', texto: 'de nervio Radial', siguiente: LadoRad, ImgValue: 'Radial'},
    {nombre: 'Radial superficial', texto: 'de nervio Radial superficial', siguiente: LadoRads, ImgValue: 'Radial superficial'},
    {nombre: 'Interóseo posterior', texto: 'de nervio Interóseo posterior', siguiente: LadoInPs, ImgValue: 'Interóseo posterior'},
    {nombre: 'Supraescapular', texto: 'de nervio Supraescapular', siguiente: LadoSpr, ImgValue: 'Supraescapular'},
    {nombre: 'Ulnar', texto: 'de nervio Ulnar', siguiente: LadoUln, ImgValue: 'Ulnar'},
    {nombre: 'Dorsal cutáneo', texto: 'de nervio Dorsal cutáneo', siguiente: LadoDrc, ImgValue: 'Dorsal cutáneo'},
    {nombre: 'Toracodorsal', texto: 'de nervio Toracodorsal', siguiente: LadoTorac, ImgValue: 'Toracodorsal'},
    {nombre: 'Torácico largo', texto: 'de nervio Torácico largo', siguiente: LadoTora, ImgValue: 'Torácico largo'},
    {nombre: 'Antebraquial medial', texto: 'de nervio Antebraquial medial', siguiente: LadoAntM, ImgValue: 'Antebraquial medial'},
    {nombre: 'Antebraquial lateral', texto: 'de nervio Antebraquial lateral', siguiente: LadoAntLr, ImgValue: 'Antebraquial lateral'},
  ]
};

const Nervios = {
  titulo: 'División',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Miembros superiores', textoLista: '_', texto: '', siguiente: Superiores},
    {nombre: 'Craneales' , textoLista: '_', texto: '', siguiente: Craneales},
    {nombre: 'Miembros inferiores' , textoLista: '_', texto: '', siguiente: Inferiores},
    {nombre: 'Sacro' , textoLista: '_', texto: '', siguiente: Sacro},

  ]
};



const estructuraJerarquica: Jerarquia = {
  titulo: 'Evolución',
  seleccionMultiple: false,
  opciones: [
    {
      nombre: 'Neuropatía aguda',textoLista: 'Evolucion - Neuropatía aguda', texto: 'Neuropatía aguda', siguiente: Nervios,
    },
    {
      nombre: 'Neuropatía subaguda',textoLista: 'Evolucion - Neuropatía subaguda', texto: 'Neuropatía subaguda', siguiente: Nervios,
    },
    {
      nombre: 'Neuropatía crónica',textoLista: 'Evolucion - Neuropatía crónica', texto: 'Neuropatía crónica', siguiente: Nervios,
    },
  ],
};

const zonasOverlay = {
  'MedianoImg': { top: 10, height: 60}, 'Axilar': { top: 10, height: 60 }, 'InteroseoA': { top: 10, height: 60 },
  'Musculocutáneo': { top: 10, height: 60 }, 'Radial': { top: 10, height: 60 }, 'Radial superficial': { top: 10, height: 60 },
  'Interóseo posterior': { top: 10, height: 60 }, 'Supraescapular': { top: 10, height: 60 }, 'Ulnar': { top: 10, height: 60 },
  'Dorsal cutáneo': { top: 10, height: 60 }, 'Toracodorsal': { top: 10, height: 60 }, 'Torácico largo': { top: 10, height: 60 },
  'Antebraquial medial': { top: 10, height: 60 }, 'Antebraquial lateral': { top: 10, height: 60 }, 'MedianoFlz': { top: 10, height: 60 },
  'MedianoFIqz': { top: 10, height: 60 }, 'FocalIzq': { top: 10, height: 60 }, 'Frenico': { top: 10, height: 60 }, 'Accesorio': { top: 10, height: 60 },
  'Facial': { top: 10, height: 60 },
  'GluteoInf': { top: 10, height: 60 }, 'GluteoSup': { top: 10, height: 60 }, 'Femoral': { top: 10, height: 60 },
  'FemoralCtn': { top: 10, height: 60 }, 'Safeno': { top: 10, height: 60 }, 'Obturador': { top: 10, height: 60 },
  'Peroneo': { top: 10, height: 60 }, 'PeroneoS': { top: 10, height: 60 }, 'PeroneoP': { top: 10, height: 60 },
  'Tibial': { top: 10, height: 60 }, 'Sural': { top: 10, height: 60 }, 'PlantarMe': { top: 10, height: 60 },
  'PlantarLa': { top: 10, height: 60 }, 'Ilioiguinal': { top: 10, height: 60 }, 'Ciatico': { top: 10, height: 60 },
  'Pudendo': { top: 10, height: 60 },

  'MEDF01': { top: 10, height: 60 }, 'MEDF02': { top: 10, height: 60 }, 'MEDF03': { top: 10, height: 60 }, 'MEDF04': { top: 10, height: 60 }, 'MEDF05': { top: 10, height: 60 }, 'MEDF06': { top: 10, height: 60 },
  'MEDF07': { top: 10, height: 60 }, 'MEDF08': { top: 10, height: 60 }, 'MEDF09': { top: 10, height: 60 }, 'MEDF10': { top: 10, height: 60 }, 'MEDF11': { top: 10, height: 60 }, 'MEDF12': { top: 10, height: 60 },
  'MEDF13': { top: 10, height: 60 }, 'MEDF14': { top: 10, height: 60 }, 'MEDF15': { top: 10, height: 60 }, 'MEDF16': { top: 10, height: 60 }, 'MEDF17': { top: 10, height: 60 }, 'MEDF18': { top: 10, height: 60 },
  'MEDF19': { top: 10, height: 60 }, 'MEDF20': { top: 10, height: 60 }, 'MEDF21': { top: 10, height: 60 }, 'MEDF22': { top: 10, height: 60 }, 'MEDF23': { top: 10, height: 60 }, 'MEDF24': { top: 10, height: 60 }, 'MEDF25': { top: 10, height: 60 }, 'MEDF26': { top: 10, height: 60 },


};

const imagenesOverlay: Record<string, any> = {

  'MedianoImg': require('../../../assets/CuerpoPng/NeuropatiaImg/NOMediano.png'),
  //'MedianoImg': require('../../../assets/CuerpoPng/NeuropatiaImg/MedianoIzq.png'),
  'MedianoFlz': require('../../../assets/CuerpoPng/NeuropatiaImg/MedianoFlz.png'),
  'MedianoFIqz': require('../../../assets/CuerpoPng/NeuropatiaImg/FocalMIzq.png'),
  'FocalIzq': require('../../../assets/CuerpoPng/NeuropatiaImg/AxilFcIzq.png'),
  'Axilar': require('../../../assets/CuerpoPng/NeuropatiaImg/Axilar.png'),
  'InteroseoA': require('../../../assets/CuerpoPng/NeuropatiaImg/InteroseoAnterior.png'),
  'Musculocutáneo': require('../../../assets/CuerpoPng/NeuropatiaImg/Musculocutaneo.png'),
  'Radial': require('../../../assets/CuerpoPng/NeuropatiaImg/Radial.png'),
  'Radial superficial': require('../../../assets/CuerpoPng/NeuropatiaImg/RadialSuperficial.png'),
  'Interóseo posterior': require('../../../assets/CuerpoPng/NeuropatiaImg/InteroseoP.png'),
  'Supraescapular': require('../../../assets/CuerpoPng/NeuropatiaImg/Supraescapular.png'),
  'Ulnar': require('../../../assets/CuerpoPng/NeuropatiaImg/Ulnar.png'),
  'Dorsal cutáneo': require('../../../assets/CuerpoPng/NeuropatiaImg/DorsalCutaneo.png'),
  'Toracodorsal': require('../../../assets/CuerpoPng/NeuropatiaImg/Toracodorsal.png'),
  'Torácico largo': require('../../../assets/CuerpoPng/NeuropatiaImg/ToracicoLargo.png'),
  'Antebraquial medial': require('../../../assets/CuerpoPng/NeuropatiaImg/Antebraquial.png'),
  'Antebraquial lateral': require('../../../assets/CuerpoPng/NeuropatiaImg/Musculocutaneo.png'),

  'Frenico': require('../../../assets/CuerpoPng/NeuropatiaImg/Frenico.png'),
  'Accesorio': require('../../../assets/CuerpoPng/NeuropatiaImg/Accesorio.png'),
  'Facial': require('../../../assets/CuerpoPng/NeuropatiaImg/Facial.png'),

  'GluteoInf': require('../../../assets/CuerpoPng/NeuropatiaImg/GluteoSupIn.png'),
  'GluteoSup': require('../../../assets/CuerpoPng/NeuropatiaImg/GluteoMedio.png'),
  'Femoral': require('../../../assets/CuerpoPng/NeuropatiaImg/Femoral.png'),
  'FemoralCtn': require('../../../assets/CuerpoPng/NeuropatiaImg/Femorocutáneo.png'),
  'Safeno': require('../../../assets/CuerpoPng/NeuropatiaImg/Safeno.png'),
  'Obturador': require('../../../assets/CuerpoPng/NeuropatiaImg/Obturador.png'),
  'Peroneo': require('../../../assets/CuerpoPng/NeuropatiaImg/Peroneo.png'),
  'PeroneoS': require('../../../assets/CuerpoPng/NeuropatiaImg/PeroneoSu.png'),
  'PeroneoP': require('../../../assets/CuerpoPng/NeuropatiaImg/PeroneoPr.png'),
  'Tibial': require('../../../assets/CuerpoPng/NeuropatiaImg/Tibial.png'),
  'Sural': require('../../../assets/CuerpoPng/NeuropatiaImg/Sural.png'),
  'PlantarMe': require('../../../assets/CuerpoPng/NeuropatiaImg/PlantarMe.png'),
  'PlantarLa': require('../../../assets/CuerpoPng/NeuropatiaImg/PlantarLa.png'),
  'Ilioiguinal': require('../../../assets/CuerpoPng/NeuropatiaImg/Ilioinguinal.png'),

  'Ciatico': require('../../../assets/CuerpoPng/NeuropatiaImg/Ciatico.png'),
  'Pudendo': require('../../../assets/CuerpoPng/NeuropatiaImg/Pudendo.png'),



};

interface OverlayButtonConfig {
  nombre: string;
  ImgValue: string;
  top: number;
  left: number;
  width: number;
  height: number;
  texto: string;
  style?: object;
  backgroundImage?: any;
  borderRadius?: number; // Nuevo: radio de borde individual
  rotate?: number;       // Nuevo: rotación en grados
}

interface Figura {
  id: string;
  tipo: 'circle' | 'square';
  uri: string;
  posicion: { x: number; y: number };
}


function ReporteScreen(): React.JSX.Element {
  
  const [ruta, setRuta] = useState<Jerarquia[]>([estructuraJerarquica]);
  const [seleccionMultiple, setSeleccionMultiple] = useState<string[]>([]);
  const [resumen, setResumen] = useState<string[]>([]);
  const [figuras, setFiguras] = useState<Figura[]>([]);
  const scrollPrincipalRef = useRef<Animated.ScrollView>(null);
  const [mostrarMiniatura, setMostrarMiniatura] = useState(false);
  const [distribucionFinalizada, setDistribucionFinalizada] = useState(false);
  const [nombrePaciente, setNombrePaciente] = useState('');
  const [resumenTextoLargo, setResumenTextoLargo] = useState<string[]>([]);
  const nivelActual = ruta.length > 0 ? ruta[ruta.length - 1] : estructuraJerarquica;
  const [limitesContenedor, setLimitesContenedor] = useState({ width: 0, height: 0 });
  const [botonesOverlay, setBotonesOverlay] = useState<OverlayButtonConfig[] | null>(null); // Usamos la nueva interfaz
  const [botonesOverlaySeg, setBotonesOverlaySeg] = useState<OverlayButtonConfig[] | null>(null);
  const [zonasFijas, setZonasFijas] = useState<string[]>([]);
  const [imagenBotonOverlayActiva, setImagenBotonOverlayActiva] = useState<string | null>(null);
  const [textoBotonOverlayActivo, setTextoBotonOverlayActivo] = useState<string | null>(null);
  const [modoReporte, setModoReporte] = useState<'enunciado' | 'lista' | 'GenerarLink'>('enunciado');  
  const [modoPrincipal, setModoPrincipal] = useState<'reporte' | 'lista' | 'GenerarLink'>('reporte');
  const zonasSeleccionadas = [...seleccionMultiple, ...zonasFijas];
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [isCaptureMode, setIsCaptureMode] = useState(false); // oculta todo lo que no va al PDF/JPEG
  const [baseLoaded, setBaseLoaded] = useState(false);        // asegura que la base ya está lista
  const leftCanvasRef = useRef<View>(null);     // contenedor visible de la lámina
  const [shot, setShot] = useState<string|null>(null); // base64 de la captura
  const [suppressDim, setSuppressDim] = useState(false); // para ocultar capa oscura al capturar
  const [exportSuccess, setExportSuccess] = useState<{ filename: string; path: string } | null>(null);

  /** === Nombres bonitos y consistentes (Miopatía) === */
const STUDY_KEY = 'Neuropatia';                 // sin acentos
const STUDY_PREFIX = `mEDXpro${STUDY_KEY}`;   // mEDXproMiopatia

const toSafeToken = (s: string) =>
  (s || '')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')  // sin acentos
    .replace(/[^\p{L}\p{N}\-_. ]/gu, '')                // solo letras/números/._-
    .trim()
    .replace(/\s+/g, '_');

const isImageLike = (mime?: string, name?: string) => {
  if (mime?.startsWith('image/')) return true;
  return /\.(jpg|jpeg|png|webp|gif|heic|heif)$/i.test(name || '');
};

const guessExt = (name?: string, mime?: string) => {
  const e = (name?.split('.').pop() || '').toLowerCase();
  if (e) return e;
  if (!mime) return 'dat';
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'application/pdf') return 'pdf';
  const m = mime.split('/')[1];
  return (m || 'dat').toLowerCase();
};

// Si NO hay nombre de paciente, usamos "1" para el lote actual
const UNNAMED_BATCH_ORDINAL = 1;

/** Base: mEDXproMiopatia_<Paciente o N> */
const buildBaseName = (paciente?: string | null): string => {
  const token = toSafeToken(paciente || '');
  const n = token || String(UNNAMED_BATCH_ORDINAL);
  return `${STUDY_PREFIX}_${n}`;
};


  // Lo que ya muestras como texto del reporte
const textoReporte = resumenTextoLargo.join(' ');

// Nombre de PDF
const reportFileName = () => {
  const base = buildBaseName(nombrePaciente);
  return `${base}.pdf`; // mEDXproMiopatia_<...>.pdf
};

// Valores por omisión

const linkDefaults = React.useMemo(() => {
  // Título personalizado según el tipo de estudio
  let tipoEstudio = '';
  if (resumenTextoLargo.length > 0) {
    const textoCompleto = resumenTextoLargo.join(' ').toLowerCase();
    if (textoCompleto.includes('plexopatía') || textoCompleto.includes('neuropatía') || textoCompleto.includes('unión') || textoCompleto.includes('polineuropatía') || textoCompleto.includes('neuronopatía') || textoCompleto.includes('radiculopatía') || textoCompleto.includes('miopatía')) {
      tipoEstudio = 'Electroneuromiografía';
    } else if (textoCompleto.includes('visual') || textoCompleto.includes('auditiva')|| textoCompleto.includes('somatosensorial')|| textoCompleto.includes('motora')) {
      tipoEstudio = 'Potenciales Evocados';
    }
  }

  const titulo = nombrePaciente
    ? `${tipoEstudio} — ${nombrePaciente}`
    : tipoEstudio;

  return {
    defaultTitle:  titulo,
    defaultMessage: 'Saludos...',  // ✅ Siempre "Saludos..." por defecto
    autoReportName: reportFileName(),
  };
}, [nombrePaciente, textoReporte, resumenTextoLargo]);

const generateShareLink: LinkUploaderProps['onGenerateLink'] = async ({
  files, title, message, expiry, onFileProgress, templateId,
}) => {
  const studyType  = 'Neuropatia';
  const doctorName =
    [userData?.name, userData?.lastname].filter(Boolean).join(' ') || undefined;

  const expSeconds = expiry === '24h' ? 60 * 60 * 24 : 60 * 60 * 24 * 5;

  const defaultTitle =
    `${studyType} – ${nombrePaciente || 'Paciente'}${doctorName ? ` – ${doctorName}` : ''}`;
  const finalTitle   = (title?.trim() || defaultTitle).slice(0, 140);

  const finalMessage = (message && message.trim())
    ? message.trim()
    : [
        `Estudio: ${studyType}`,
        `Paciente: ${nombrePaciente || '—'}`,
        `Médico: ${doctorName || '—'}`,
        '',
        (textoReporte || '').trim(),
      ].join('\n');

  // 1) Crear link
  const init = await initShareLink({
    title: finalTitle,
    message: finalMessage,
    expiresInSeconds: expSeconds,
    patient:   nombrePaciente || null,
    doctor:    doctorName || null,
    studyType: studyType,
    meta: { patient: nombrePaciente || null, doctor: doctorName || null, study: studyType, studyType },
  });
  if (!init.ok) throw new Error(init.error);
  const { linkId } = init;

// 2) Subir PDF autogenerado
onFileProgress?.('__auto_report__', 0);
const reportAb   = await buildReportPdfArrayBuffer({
  studyType,
  doctorName,
  templateId: templateId as PlantillaId | null | undefined
});
const reportName = reportFileName();

// carpeta por paciente (o base si no hay nombre)
const basePretty   = buildBaseName(nombrePaciente);                 // mEDXproMiopatia_<...>
const patientFolder = toSafeToken(nombrePaciente || basePretty);    // carpeta segura
const reportPath   = `${patientFolder}/${uuid.v4()}_${reportName}`;

const up1 = await supabase.storage.from(BUCKET).upload(reportPath, reportAb, {
  contentType: 'application/pdf',
  upsert: false,
});
if (up1.error) throw new Error(`Error subiendo reporte: ${up1.error.message}`);
onFileProgress?.('__auto_report__', 1);

const uploadedForDB = [{
  name: reportName,
  mime_type: 'application/pdf',
  size_bytes: reportAb.byteLength,
  storage_path: up1.data.path,
}];

// 3) Subir los adjuntos del usuario con nombres bonitos
const processed = new Set<string>();
let imgIdx = 0; // contador local solo para imágenes

for (const file of files || []) {
  if (!file || file.id === '__auto_report__' || processed.has(file.id)) continue;
  processed.add(file.id);

  const localUri  = (file as any).fileCopyUri || file.uri;
  const ab        = await readAsArrayBuffer(localUri);
  onFileProgress?.(file.id, 0);

  const ext    = guessExt(file.name, file.type);
  let niceName = '';

  if (isImageLike(file.type, file.name)) {
    imgIdx += 1;
    // mEDXproMiopatia_<paciente_o_num>img1.jpg
    niceName = `${basePretty}img${imgIdx}.${ext}`;
  } else {
    // para no-imágenes, conserva base del usuario pero saneado
    const fallback = `archivo_${Date.now()}.${ext}`;
    const original = toSafeToken(file.name || fallback);
    niceName = original; // (si quieres prefijar: `${basePretty}_${original}`)
  }

  const objectPath = `${patientFolder}/${uuid.v4()}_${niceName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, ab, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });
  if (error) throw new Error(`Error subiendo ${file.name || niceName}: ${error.message}`);
  onFileProgress?.(file.id, 1);

  uploadedForDB.push({
    name: niceName,
    mime_type: file.type || 'application/octet-stream',
    size_bytes: (file as any).size || ab.byteLength,
    storage_path: data.path,
  });
}


  // 4) Completar link y retornar URL
  const done = await completeShareLink({ linkId, files: uploadedForDB });
  if (!done.ok) throw new Error(done.error);
  return done.url;
};

   const [imgListaAR, setImgListaAR] = useState<number | null>(null);
              type Tab = 'reporte' | 'lista' | 'filtros';
              
                const [activeTab, setActiveTab] = useState<Tab>('reporte'); // ← AÑADIR
              // helper para obtener AR según sea require(...) o uri
             const setImgLista = (src: string | ImageSourcePropType) => {
  const source = toImageSource(src);
  setImgListaSrc(source);

  try {
    if (typeof src === 'string') {
      Image.getSize(src, (w, h) => setImgListaAR(w / h), () => setImgListaAR(null));
    } else {
      // @ts-ignore
      const r = Image.resolveAssetSource(src);
      if (r?.width && r?.height) setImgListaAR(r.width / r.height);
      else setImgListaAR(null);
    }
  } catch { setImgListaAR(null); }

  setActiveTab('lista');
  setMostrarGaleria(true);       // ✅ Ábrela aquí
};
// helper cerca de tus otros helpers (FUERA del componente)
const getListaLabel = (nodoPadre: Jerarquia) => {
  // si estamos en la raíz, usa "Evolución"
  if (nodoPadre === estructuraJerarquica || nodoPadre.titulo === 'Evolución') return 'Evolución';
  return nodoPadre.titulo || 'Evolución';
};


  const prepareShot = async () => {
  if (!leftCanvasRef.current) return;
  setSuppressDim(true);                       // 🔴 apaga la capa oscura
  await flushBeforeCapture();
  const b64 = await captureRef(leftCanvasRef.current, {
    format: 'png',
    quality: 1,
    result: 'base64',
  });
  setShot(b64);
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
  await new Promise<void>((r) => setTimeout(r, 30));
  setSuppressDim(false);                      // 🔵 vuelve a encender
};


  useEffect(() => {
  const uri = Image.resolveAssetSource(IMG_BASE_TRANSPARENT)?.uri;
  if (uri) Image.prefetch(uri).catch(() => {});
  }, []);
  
  // NUEVO: soporte UI Lista
  const [mostrarGaleria, setMostrarGaleria] = useState(false);
  const [imgListaSrc, setImgListaSrc] = useState<ImageSourcePropType | null>(null);
  const [comentarioLista, setComentarioLista] = useState('');
  const [showComentarioModal, setShowComentarioModal] = useState(false);

  // NUEVO: placeholders simples para Filtros
  const [filtroLado, setFiltroLado] = useState<'todos'|'izq'|'der'|'bilateral'>('todos');
  const [filtroTipo, setFiltroTipo] = useState<'todos'|'axonal'|'desmielinizante'|'mixta'>('todos');

  const [isHorizontal, setIsHorizontal] = useState(false);
  const [isCargaCerrar, setIsCargaCerrar] = useState(false);
  
  
  // Obtener dimensiones de pantalla
  const { width: screenWidth } = Dimensions.get('window');
  // Definir el ancho máximo para la imagen y el contenedor (por ejemplo, 95% del ancho de pantalla)
  const maxImageWidth = Math.min(screenWidth * 0.95, 500); // Puedes ajustar 500 si quieres un límite mayor/menor
  // Relación de aspecto de la imagen base (ajusta según tu imagen base)
  const aspectRatio = 1.0; // Por ejemplo, 450/1000 = 0.45 (alto/ancho), AJUSTA según tu imagen real
  const imageHeight = maxImageWidth * aspectRatio;

  // --- REANIMATED HOOKS PARA ZOOM Y PAN ---
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      if (scale.value < 0.5) {
        scale.value = withSpring(0.5);
      } else if (scale.value > 3) {
        scale.value = withSpring(3);
      }
      savedScale.value = scale.value;
    });

  let initialX = 0;
  let initialY = 0;
  let parentScale = 1;

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      initialX = savedTranslateX.value;
      initialY = savedTranslateY.value;
      parentScale = scale.value;
    })
    .onUpdate((event) => {
      translateX.value = initialX + event.translationX / parentScale;
      translateY.value = initialY + event.translationY / parentScale;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;

      if (scale.value === 1) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  // --- FIN REANIMATED HOOKS ---

  /* ====== Datos de usuario para header/footer ====== */
  type UserData = {
    name: string; lastname: string; idprofessional: string; specialty: string; email: string; imageUrl: string;
  };
  const [userData, setUserData] = useState<UserData | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;
        const res = await axios.post(`${BASE_URL}/userdata`, { token });
        const ud = res?.data?.data;
        if (ud) {
          setUserData(ud);
          if (ud.imageUrl) Image.prefetch(ud.imageUrl).catch(() => {});
        }
      } catch (e) {
        console.warn('No se pudo obtener el usuario para el PDF', e);
      }
    })();
  }, []);

  // Config PDF/render (puedes dejar tu DEFAULT_PDF tal cual)
  const [pdfCfg] = useState<PdfConfig>(DEFAULT_PDF);
  const PT = { A4: { W: 595, H: 842 }, Letter: { W: 612, H: 792 } };
  const base = PT[pdfCfg.paper] || PT.A4;
  const Wpt = pdfCfg.orientation === 'portrait' ? base.W : base.H;
  const Hpt = pdfCfg.orientation === 'portrait' ? base.H : base.W;

  // Escala de render alta para nitidez (2x es buen equilibrio)
  const s = Math.max(1, pdfCfg.renderScale || 1) * 2;

  const px = (n: number) => Math.round(n * s);
  const pageWpx = px(Wpt);
  const pageHpx = px(Hpt);
  const pad = px(pdfCfg.pageMargin);
  const innerW = pageWpx - pad * 2;
  const innerH = pageHpx - pad * 2;

  const headerHpx = px(pdfCfg.header.height);
  const footerHpx = px(pdfCfg.footer.height);

  // Mantén la misma lógica de lámina/cuerpo (usa tu BASE_AR ya calculado arriba)
  let laminaWpx = Math.round(innerW * pdfCfg.lamina.widthFrac);
  let laminaHpx = Math.round(laminaWpx / BASE_AR);
  const MIN_DIAG = px(pdfCfg.diag.minHeight);
  const MIN_LAMINA = px(pdfCfg.lamina.minHeight);
  const footerRaise = px(pdfCfg.footer.raise || 0);

  let diagHpx = innerH - headerHpx - laminaHpx - footerHpx;
  if (diagHpx < MIN_DIAG) {
    const deficit = MIN_DIAG - diagHpx;
    laminaHpx = Math.max(MIN_LAMINA, laminaHpx - deficit);
    laminaWpx = Math.round(laminaHpx * BASE_AR);
    diagHpx   = innerH - headerHpx - laminaHpx - footerHpx;
  }
  if (pdfCfg.diag.pullUp > 0) {
    laminaHpx = Math.max(MIN_LAMINA, laminaHpx - px(pdfCfg.diag.pullUp));
    diagHpx   = innerH - headerHpx - laminaHpx - footerHpx;
  }
  if (footerRaise > 0) {
    diagHpx = Math.max(MIN_DIAG, diagHpx - footerRaise);
  }

  // Refs para cada hoja
  const exportRef = useRef<View>(null);
  const exportRef2 = useRef<View>(null);

  // Estado de export (spinner/botón, etc.)
  const [exporting, setExporting] = useState(false);
  const [exportKind, setExportKind] = useState<'pdf'|'jpeg'|null>(null);
  const [plantillaId, setPlantillaId] = useState<PlantillaId>('none');
  const exportBgColor = plantillaId === 'none' ? '#fff' : 'transparent';
  const [templatePickerVisible, setTemplatePickerVisible] = useState(false);
  const [templatePickerIntent, setTemplatePickerIntent] = useState<'export' | 'link' | null>(null);
  const templatePickerPromiseRef = useRef<((id: PlantillaId | null) => void) | null>(null);
  const [pendingTemplateExport, setPendingTemplateExport] = useState<PlantillaId | null>(null);
  const exportarPdfRef = useRef<() => Promise<void>>(async () => {});
  const plantillaDef = React.useMemo(
    () => (plantillaId === 'none' ? null : PLANTILLAS_PDF[plantillaId]),
    [plantillaId],
  );

const waitFor = async (cond: () => boolean, timeout = 5000, step = 50) => {
  const t0 = Date.now();
  while (!cond()) {
    if (Date.now() - t0 > timeout) break;
     await new Promise<void>(r => setTimeout(r, step));
  }
};

  const handleExportRequest = () => {
    if (exporting) return;
    templatePickerPromiseRef.current = null;
    setTemplatePickerIntent('export');
    setTemplatePickerVisible(true);
  };

  const requestTemplateForLink = (): Promise<PlantillaId | null> => {
    if (templatePickerIntent === 'export') {
      return Promise.resolve(null);
    }

    if (templatePickerPromiseRef.current) {
      templatePickerPromiseRef.current(null);
    }

    setTemplatePickerIntent('link');
    setTemplatePickerVisible(true);

    return new Promise(resolve => {
      templatePickerPromiseRef.current = resolve;
    });
  };

  const handleTemplatePicked = (id: PlantillaId) => {
    setTemplatePickerVisible(false);

    if (templatePickerIntent === 'export') {
      if (!exporting) {
        setPendingTemplateExport(id);
      }
    } else if (templatePickerIntent === 'link') {
      setPlantillaId(id);
      templatePickerPromiseRef.current?.(id);
    }

    templatePickerPromiseRef.current = null;
    setTemplatePickerIntent(null);
  };

  const handleTemplatePickerClose = () => {
    setTemplatePickerVisible(false);

    if (templatePickerIntent === 'link') {
      templatePickerPromiseRef.current?.(null);
    }

    templatePickerPromiseRef.current = null;
    setTemplatePickerIntent(null);
  };

const flushBeforeCapture = async () => {
  Keyboard.dismiss();
  // NO confíes en prefetch para assets locales; la señal real es onLoad
  await waitFor(() => baseLoaded, 5000);
  // Si tienes logo remoto en header:
  if (userData?.imageUrl) {
    try { await Image.prefetch(userData.imageUrl); } catch {}
  }
  await new Promise<void>(r => InteractionManager.runAfterInteractions(() => r()));
  await new Promise<void>(r => requestAnimationFrame(() => r()));
  await new Promise<void>(r => setTimeout(r, 30));
};
  // Captura ambas páginas como base64 (png o jpg), al tamaño exacto de “papel”
  const capturePages = async (format: 'png' | 'jpg') => {
    if (!exportRef.current) throw new Error('El lienzo no está listo');
    setIsCaptureMode(true);
    // Deja renderizar el modo de captura
    await new Promise<void>(r => requestAnimationFrame(() => r()));
    await flushBeforeCapture();
    const quality = format === 'jpg' ? 0.95 : 1;
    const p1 = await captureRef(exportRef.current, {
      format,
      quality,
      result: 'base64',
      width: pageWpx,
      height: pageHpx,
    });
    let p2: string | null = null;
    if (exportRef2?.current) {
      p2 = await captureRef(exportRef2.current, {
        format,
        quality,
        result: 'base64',
        width: pageWpx,
        height: pageHpx,
      });
    }

    setIsCaptureMode(false);
    return { p1, p2 };
  };


  const buildReportPdfArrayBuffer = async ({
    studyType,
    doctorName,
    templateId,
  }: {
    studyType: string;
    doctorName?: string;
    templateId?: PlantillaId | null;
  }): Promise<ArrayBuffer> => {
    // 1. Capturar páginas (usa los refs del componente)
    const capturedPages = await capturePages('png');

    // 2. Preparar configuración
    const config: PdfBuildConfig = {
      studyType,
      doctorName,
      templateId: templateId || plantillaId,
      patientName: nombrePaciente,
      Wpt,
      Hpt,
    };

    // 3. Construir PDF usando el servicio
    return await buildPdfWithTemplate(capturedPages, config);
  };
  // Diálogo simple
  const handleExport = () => {
    Alert.alert(
      'Exportar',
      '¿En qué formato deseas exportar?',
      [
        { text: 'PDF', onPress: exportarPDF },
        { text: 'LINK', },
        { text: 'Cancelar', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  // Bloquea orientación mientras exporta para evitar re-layouts
  const lockOrientation = async () => {
    try { await Orientation.lockToPortrait(); } catch {}
  };
  const unlockOrientation = async () => {
    try { await Orientation.unlockAllOrientations(); } catch {}
  };

  // ===== PDF =====
  const exportarPDF = async () => {
    if (!exportRef.current) {
      Alert.alert('Exportar', 'El lienzo del PDF no está listo.');
      return;
    }
    try {
      setExportSuccess(null);
      setExportKind('pdf');
      await prepareShot();
      setExporting(true);
      await lockOrientation();
      await new Promise<void>(r => requestAnimationFrame(() => r()));
      await new Promise<void>(r => setTimeout(r, 30));

      const studyType = 'Polineuropatía';
      const doctorName = [userData?.name, userData?.lastname].filter(Boolean).join(' ') || undefined;
      const ab = await buildReportPdfArrayBuffer({ studyType, doctorName, templateId: plantillaId });
      const base64Pdf = b64encode(ab);
      const filename = reportFileName();

      if (Platform.OS === 'android' && Platform.Version <= 28) {
        const w = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
        if (w !== PermissionsAndroid.RESULTS.GRANTED) throw new Error('WRITE_EXTERNAL_STORAGE no otorgado');
      }

      const RNBU: any = ReactNativeBlobUtil;
      const tmpPath = `${RNBU.fs.dirs.CacheDir}/${filename}`;
      await RNBU.fs.writeFile(tmpPath, base64Pdf, 'base64');

      let outPath = tmpPath;
      if (Platform.OS === 'android') {
        outPath = `${RNBU.fs.dirs.DownloadDir}/${filename}`;
        try {
          await RNBU.fs.cp(tmpPath, outPath);
        } catch {
          await RNBU.fs.writeFile(outPath, base64Pdf, 'base64');
        }
        await RNBU.fs.scanFile([{ path: outPath, mime: 'application/pdf' }]);
        RNBU.android?.addCompleteDownload?.({
          title: filename,
          description: 'Reporte descargado',
          mime: 'application/pdf',
          path: outPath,
          showNotification: true,
        });
      } else {
        outPath = `${RNBU.fs.dirs.DocumentDir}/${filename}`;
        await RNBU.fs.writeFile(outPath, base64Pdf, 'base64');
      }

      setExportSuccess({ filename, path: outPath });
    } catch (e: any) {
      Alert.alert('Error', `No se pudo exportar el PDF.\n\n${e?.message ?? e}`);
    } finally {
      await unlockOrientation();
      setExporting(false);
      setExportKind(null);
    }
  };

  exportarPdfRef.current = exportarPDF;

  React.useEffect(() => {
    if (!pendingTemplateExport) return;
    let cancelled = false;

    const run = async () => {
      try {
        setPlantillaId(pendingTemplateExport);
        await new Promise<void>(resolve => setTimeout(resolve, 0));
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        if (cancelled) return;
        await exportarPdfRef.current();
      } finally {
        if (!cancelled) {
          setPendingTemplateExport(null);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [pendingTemplateExport]);

  // ===== JPEG (2 archivos: _P1 y _P2 si hay segunda hoja) =====
  const exportarJPEG = async () => {
    try {
      setExportKind('jpeg');
      setExporting(true);
      await lockOrientation();
      await prepareShot();
      const { p1, p2 } = await capturePages('jpg');

      if (Platform.OS === 'android' && Platform.Version <= 28) {
        const w = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
        if (w !== PermissionsAndroid.RESULTS.GRANTED) throw new Error('WRITE_EXTERNAL_STORAGE no otorgado');
      }

      const RNBU: any = ReactNativeBlobUtil;
      const baseName = `ReporteNeuropatia_${safeName(nombrePaciente)}`;
      const dirAndroid = RNBU.fs.dirs.DownloadDir;
      const diriOS = RNBU.fs.dirs.DocumentDir;

      const writeJpeg = async (b64: string, suffix: string) => {
        const filename = `${baseName}${suffix}.jpg`;
        const outPath = Platform.OS === 'android'
          ? `${dirAndroid}/${filename}`
          : `${diriOS}/${filename}`;

        await RNBU.fs.writeFile(outPath, b64, 'base64');

        if (Platform.OS === 'android') {
          await RNBU.fs.scanFile([{ path: outPath, mime: 'image/jpeg' }]);
          RNBU.android?.addCompleteDownload?.({
            title: filename,
            description: 'Imagen exportada',
            mime: 'image/jpeg',
            path: outPath,
            showNotification: true,
          });
        }

        return filename;
      };

      const names: string[] = [];
      if (p1) names.push(await writeJpeg(p1, '_P1'));
      if (p2) names.push(await writeJpeg(p2, '_P2'));

      const msg = names.length > 1
        ? `Se guardaron:\n• ${names[0]}\n• ${names[1]}`
        : `Se guardó:\n${names[0]}`;

      Alert.alert('Listo', msg);
    } catch (e: any) {
      Alert.alert('Error', `No se pudo exportar a JPEG.\n\n${e?.message ?? e}`);
    } finally {
      await unlockOrientation();
      setExporting(false);
      setExportKind(null);
    }
  };



  const manejarBotonesOverlay = (btnNerv?: string) => {
    if (btnNerv && botonesConfig[btnNerv]) {
      setBotonesOverlay(botonesConfig[btnNerv]);
    } else {
      // No limpiar aquí: deja los botones activos aunque avances de nivel
      // setBotonesOverlay(null);
    }
  };
    const manejarBotonesOverlay2 = (BtnNervSeg?: string) => {
    if (BtnNervSeg && botonesConfigSeg[BtnNervSeg]) {
      setBotonesOverlaySeg(botonesConfigSeg[BtnNervSeg]);
    } else {

    }
  };

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setMostrarMiniatura(offsetY > 200);
  };

  /* ====== Canvas para export ====== */
  const CanvasView: React.FC<{ w: number; h: number; transparentBg?: boolean }> = ({ w, h, transparentBg = false }) => {
    const sx = limitesContenedor.width ? w / limitesContenedor.width : 1;
    const sy = limitesContenedor.height ? h / limitesContenedor.height : 1;
    const figBase = 55;
    const baseImage = IMG_BASE_TRANSPARENT;
    return (
  <View style={{ width: w, height: h, position: 'relative', overflow: 'hidden', backgroundColor: 'transparent' }} collapsable={false}>
  <Image
  source={baseImage}
  onLoad={() => setBaseLoaded(true)}
  onError={(e) => {
    console.warn('No se pudo cargar la base', e?.nativeEvent);
    setBaseLoaded(true);
  }}
  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
  resizeMode="contain"
/>
        {/* Overlays */}
        {zonasSeleccionadas.map((zona, idx) => {
          const src = imagenesOverlay[zona];
          if (!src) return null;
          return (
            <Image
              key={`ov_${zona}_${idx}`}
              source={src}
              style={{ position: 'absolute', top:0, left:0, width:'100%', height:'100%' }}
              resizeMode="contain"
            />
          );
        })}
        {/* Renderizar la imagen activa del botón de overlay */}
        {imagenBotonOverlayActiva && imagenesOverlay[imagenBotonOverlayActiva] && (
          <Image
            key="boton-overlay-activa-canvas"
            source={imagenesOverlay[imagenBotonOverlayActiva]}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        )}
        {/* Figuras */}
        {figuras.map((f) => {
          const wFig = figBase * sx;
          const hFig = figBase * sy;
          const br = f.tipo === 'circle' ? Math.min(wFig, hFig) / 2 : 8 * Math.min(sx, sy);
          return (
            <Image
              key={`fig_${f.id}`}
              source={{ uri: f.uri }}
              style={{ position:'absolute', left: f.posicion.x * sx, top: f.posicion.y * sy, width: wFig, height: hFig, borderRadius: br }}
              resizeMode="cover"
            />
          );
        })}
      </View>
    );
  };
      // si src es string -> { uri: string } ; si es require(...) -> tal cual
        const toImageSource = (src: string | ImageSourcePropType): ImageSourcePropType =>
          typeof src === 'string' ? { uri: src } : src;

  const pedirPermiso = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const permisos = [
          PermissionsAndroid.PERMISSIONS.CAMERA,
          Platform.Version >= 33
            ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
            : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        ] as const;
        const granted = await PermissionsAndroid.requestMultiple([...permisos]);
        const camaraOk = granted['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED;
        const lecturaOk =
          Platform.Version >= 33
            ? granted['android.permission.READ_MEDIA_IMAGES'] === PermissionsAndroid.RESULTS.GRANTED
            : granted['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED;

        if (camaraOk && lecturaOk) {
          console.log('✅ Permisos concedidos');
          return true;
        } else {
          console.log('❌ Algún permiso fue denegado');
          return false;
        }
      } catch (err) {
        console.warn(err);
        return false;
      }
    } else {
      return true;
    }
  };

    const manejarSeleccionImagen = async (tipo: 'circle' | 'square') => {
      const permiso = await pedirPermiso();
      if (!permiso) {
        console.warn('Permiso denegado para usar la cámara o galería');
        return;
      }
  
      try {
        Alert.alert('Seleccionar Imagen:',
          '¿Qué deseas hacer?',
  
          [
            {
                text: 'Tomar foto',
                onPress: async () => {
                  const imagenEscaneada = await escanearImagen();
  
                  if (imagenEscaneada) {
                    agregarFigura(tipo, imagenEscaneada);
                  }else{
                    console.warn('No se pudo escanear la imagen');
                  }
                },
            },
            {
              text: 'Seleccionar de la galería',
              onPress: async() => {
                try{
                  if (Platform.OS === 'android' && Platform.Version < 33) {
                    const results = await DocumentPicker.pick({
                      type: [DocumentPicker.types.images],
                      allowMultiSelection: true,
                    });
                    if (results?.length){
                      results.forEach((file) => {
                        if (file.uri) agregarFigura(tipo, file.uri);
                      });
                    }
                  } else {
                    launchImageLibrary({ mediaType: 'photo', quality: 1, selectionLimit: 0 }, (res) => {
                      if (res.didCancel || res.errorCode) return;
                      if (res.assets?.length && res.assets[0].uri) {
                        res.assets.forEach((asset) => {
                          if (asset.uri) {
                            agregarFigura(tipo, asset.uri);
                          }
                        });
                      }
                    });
                  }
                } catch (error){
                  console.warn('Error en seleccionar imagen', error);
                }
              },
            },
            {
              text: 'Cancelar',
              style: 'cancel',
            },
          ],
  
        );
      } catch (error) {
        console.error('Error inesperado al seleccionar imagen:', error);
      }
    };

 const agregarFigura = (tipo: 'circle' | 'square', uri: string) => {
    // Tamaño base de las figuras (debe coincidir con FiguraMovibleN: 55px)
    const figuraSize = 55;

    // Calcular posición central del contenedor
    const centerX = (limitesContenedor.width / 2) - (figuraSize / 2);
    const centerY = (limitesContenedor.height / 2) - (figuraSize / 2);

    const nuevaFigura = {
      id: uuid.v4() as string,
      tipo,
      uri,
      posicion: {
        x: centerX > 0 ? centerX : 0,
        y: centerY > 0 ? centerY : 0
      },
    };
    setFiguras((prev) => [...prev, nuevaFigura]);
  };


  const actualizarPosicion = (id: string, x: number, y: number) => {
    setFiguras((prev) =>
      prev.map((fig) =>
        fig.id === id ? { ...fig, posicion: { x, y } } : fig
      )
    );
  };

  const eliminarFigura = (id: string) => {
    setFiguras((prev) => prev.filter((fig) => fig.id !== id));
  };

  function joinConY(arr: string[]) {
    if (arr.length === 0) return '';
    if (arr.length === 1) return arr[0];
    if (arr.length === 2) {
      const conj = arr[1].trim().toLowerCase().startsWith('i') ? ' e ' : ' y ';
      return arr[0] + conj + arr[1];
    }
    const last = arr[arr.length - 1];
    const conj = last.trim().toLowerCase().startsWith('i') ? ' e ' : ' y ';
    return arr.slice(0, -1).join(', ') + conj + last;
  }

const avanzarNivel = (opcion: any) => {
    // Lógica para aplicar zoom y pan
    scale.value = withSpring(opcion.zoomScale !== undefined ? opcion.zoomScale : 1);
    savedScale.value = opcion.zoomScale !== undefined ? opcion.zoomScale : 1;
    translateX.value = withSpring(opcion.panX !== undefined ? opcion.panX : 0);
    savedTranslateX.value = opcion.panX !== undefined ? opcion.panX : 0;
    translateY.value = withSpring(opcion.panY !== undefined ? opcion.panY : 0);
    savedTranslateY.value = opcion.panY !== undefined ? opcion.panY : 0;
    manejarBotonesOverlay(opcion.BtnNerv);
    manejarBotonesOverlay2(opcion.BtnNervSeg);

    if (opcion.siguiente) {
      setRuta([...ruta, opcion.siguiente]);
    }

    if (nivelActual.seleccionMultiple) {
      setSeleccionMultiple((prev) => {
        const nuevo = prev.includes(opcion.nombre)
          ? prev.filter((nombre) => nombre !== opcion.nombre)
          : [...prev, opcion.nombre];

        const imgKey = opcion.ImgValue || opcion.nombre;
        setZonasFijas((prevZonas) => {
          if (imagenesOverlay[imgKey]) {
            if (prev.includes(opcion.nombre)) {
              return prevZonas.filter(z => z !== imgKey);
            } else {
              if (!prevZonas.includes(imgKey)) {
                return [...prevZonas, imgKey];
              }
            }
          }
          return prevZonas;
        });
        const nuevaEntrada = `${nivelActual.titulo} - ${joinConY(nuevo)}`;
        let actualizado = [...resumen];
        const indexExistente = resumen.findIndex(entry =>
          entry.startsWith(`${nivelActual.titulo} -`)
        );
        if (indexExistente !== -1) {
          actualizado[indexExistente] = nuevaEntrada;
        } else {
          actualizado.push(nuevaEntrada);
        }
        setResumen(actualizado);
        return nuevo;
      });
    } else {
      const imgKey = opcion.ImgValue || opcion.nombre;
      if (imagenesOverlay[imgKey]) {
        setZonasFijas((prev) => {
          if (prev.includes(imgKey)) return prev;
          return [...prev, imgKey];
        });
      }

      if (
        nivelActual.titulo === 'Pronóstico' &&
        ['Recuperación completa', 'Recuperación parcial funcional', 'Recuperación Pobre no funcional', 'Recuperación nula'].includes(opcion.nombre)
      ) {
        const nuevaEntrada = `${nivelActual.titulo} - ${opcion.nombre}`;
        const indexExistente = resumen.findIndex(entry =>
          entry.startsWith(`${nivelActual.titulo} -`)
        );
        let actualizado = [...resumen];
        if (indexExistente !== -1) {
          actualizado[indexExistente] = nuevaEntrada;
        } else {
          actualizado.push(nuevaEntrada);
        }
        setResumen(actualizado);

        let nuevaEntradaTexto = opcion.texto || '';
        let actualizadoTexto = [...resumenTextoLargo];
        if (indexExistente !== -1) {
          actualizadoTexto[indexExistente] = nuevaEntradaTexto;
        } else {
          actualizadoTexto.push(nuevaEntradaTexto);
        }
        setResumenTextoLargo(actualizadoTexto);

        setDistribucionFinalizada(true);
        return;
      }
      if (opcion.siguiente) {
        setRuta([...ruta, opcion.siguiente]);

        // NUEVA LÓGICA DE ACTUALIZACIÓN DEL RESUMEN
        if (nivelActual.titulo === 'Condición' && ruta[ruta.length - 2]?.titulo === 'Tipo') {
          const prevEntry = resumen[resumen.length - 1];
          const newEntry = prevEntry + ' ' + (opcion.textoLista || opcion.nombre);
          let actualizado = [...resumen];
          actualizado[resumen.length - 1] = newEntry;
          setResumen(actualizado);
        } else if (opcion.textoLista === '_') {
          // No hagas nada con el resumen si el valor es '_'
        } else {
          let nuevaEntradaLista;
          if (opcion.textoLista) {
            nuevaEntradaLista = opcion.textoLista;
          } else {
            nuevaEntradaLista = `${nivelActual.titulo} - ${opcion.nombre}`;
          }
          let actualizado = [...resumen];
          const indexExistente = resumen.findIndex(entry =>
            entry.startsWith(`${nivelActual.titulo} -`)
          );
          if (indexExistente !== -1) {
            actualizado[indexExistente] = nuevaEntradaLista;
          } else {
            actualizado.push(nuevaEntradaLista);
          }

          // --- Lógica Condicional para "Focalizada" en resumen ---
          if (opcion.nombre === 'Focalizada') {
            const primerTextoResumenIndex = actualizado.findIndex(t =>
              t.includes('Neuropatía aguda') ||
              t.includes('Neuropatía subaguda') ||
              t.includes('Neuropatía crónica')
            );
           if (primerTextoResumenIndex !== -1) {
  let textoOriginal = actualizado[primerTextoResumenIndex];
  if (textoOriginal.includes('Neuropatía aguda')) {
    actualizado[primerTextoResumenIndex] = 'Evolución - Mono Neuropatía aguda';
  } else if (textoOriginal.includes('Neuropatía subaguda')) {
    actualizado[primerTextoResumenIndex] = 'Evolución - Mono Neuropatía subaguda';
  } else if (textoOriginal.includes('Neuropatía crónica')) {
    actualizado[primerTextoResumenIndex] = 'Evolución - Mono Neuropatía crónica';
  }
}
       }
          // --- Fin de la Lógica Condicional en resumen ---

          setResumen(actualizado);
        }

        // LÓGICA ACTUALIZADA PARA resumenTextoLargo
        let nuevaEntradaTexto = opcion.texto || '';
        if (['Reinervación'].includes(nivelActual.titulo)) {
          nuevaEntradaTexto = '\n\n' + nuevaEntradaTexto;
        }

        let actualizadoTexto = [...resumenTextoLargo];
        const indexExistenteTexto = resumen.findIndex(entry =>
          entry.startsWith(`${nivelActual.titulo} -`)
        );
        if (indexExistenteTexto !== -1) {
          actualizadoTexto[indexExistenteTexto] = nuevaEntradaTexto;
        } else {
          actualizadoTexto.push(nuevaEntradaTexto);
        }

        // --- Lógica Condicional para "Focalizada" en resumenTextoLargo ---
        if (opcion.nombre === 'Focalizada') {
          const primerTextoIndex = resumenTextoLargo.findIndex(t => 
            t.includes('Neuropatía aguda') || 
            t.includes('Neuropatía subaguda') || 
            t.includes('Neuropatía crónica')
          );

          if (primerTextoIndex !== -1) {
            let textoOriginal = actualizadoTexto[primerTextoIndex];
            if (textoOriginal.includes('Neuropatía aguda')) {
              actualizadoTexto[primerTextoIndex] = 'Mono Neuropatía aguda';
            } else if (textoOriginal.includes('Neuropatía subaguda')) {
              actualizadoTexto[primerTextoIndex] = 'Mono Neuropatía subaguda';
            } else if (textoOriginal.includes('Neuropatía crónica')) {
              actualizadoTexto[primerTextoIndex] = 'Mono Neuropatía crónica';
            }
          }
        }
        // --- Fin de la Lógica Condicional ---

        setResumenTextoLargo(actualizadoTexto);
        setSeleccionMultiple([]);
      }
    }
};

  const retrocederNivel = () => {
    if (nivelActual.titulo === 'Pronóstico' && distribucionFinalizada) {
      setDistribucionFinalizada(false);
      setNombrePaciente('');
      return;
    }
    if (
      ruta.length > 1 &&
      ruta[ruta.length - 2]?.titulo === 'Nervio'
    ) {
      setZonasFijas([]);
    }

      if (ruta.length > 1) {
          const nuevaRuta = ruta.slice(0, -1);
          const nivelAnterior = nuevaRuta[nuevaRuta.length - 1];
          const entradaAEliminar = `${nivelAnterior.opciones.find(o => o.siguiente === nivelActual)?.textoLista || nivelAnterior.titulo}:`;

          setRuta(nuevaRuta);
          setResumen(resumen.filter(linea => !linea.startsWith(entradaAEliminar)));
          setResumenTextoLargo(resumenTextoLargo.slice(0, -1));
      setFiguras([]);
      setSeleccionMultiple([]);
      setNombrePaciente('');
      // Restablecer el zoom al retroceder si no estás en el primer nivel
      if (nuevaRuta.length > 0) {
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
      setBotonesOverlay(null);
      setBotonesOverlaySeg(null);
      setImagenBotonOverlayActiva(null);
      setTextoBotonOverlayActivo(null);
      
      
    }
  };


  const reiniciar = () => {
    setRuta([estructuraJerarquica]);
    setResumen([]);
    setResumenTextoLargo([]);
    setSeleccionMultiple([]);
    setNombrePaciente('');
    setZonasFijas([]);
    setFiguras([]);
    setDistribucionFinalizada(false);
    // Reiniciar también el estado del zoom
    scale.value = withSpring(1);
    savedScale.value = 1;
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    // Reiniciar también el estado de los botones de overlay y su imagen activa
    setBotonesOverlay(null);
    setBotonesOverlaySeg(null);
    setImagenBotonOverlayActiva(null);
    setTextoBotonOverlayActivo(null); // Esto sí debe limpiar el texto al reiniciar
    setComentarioLista('');
    setImgListaSrc(null);
  };

  useEffect(() => {
    if (
      (nivelActual.opciones.length > 2 || resumen.length > 1) &&
      scrollPrincipalRef.current
    ) {
      setTimeout(() => {
        scrollPrincipalRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [nivelActual, resumen]);
  
  const [textoEditado, setTextoEditado] = useState<string>('');
  const [textoEditadoManualmente, setTextoEditadoManualmente] = useState(false); // 👈 NUEVO

  // Las zonas seleccionadas por jerarquía (zonasFijas)
  const zonasSeleccionadasPorJerarquia = [...zonasFijas];

  const resumenConOverlay = [...resumen]; // Copia el resumen actual
if (textoBotonOverlayActivo) {
  // Elimina cualquier línea previa de overlay para evitar duplicados.
  const focoIndex = resumenConOverlay.findIndex(line => line.startsWith('Foco: ') || line.startsWith('A nivel '));
  if (focoIndex !== -1) {
    resumenConOverlay.splice(focoIndex, 1);
  }

  // Busca la posición de la línea de "Ubicación:"
  const ubicacionIndex = resumenConOverlay.findIndex(line => line.startsWith('Ubicación -'));

  if (ubicacionIndex !== -1) {
    // Si la línea de "Ubicación:" ya existe, verifica si ya tiene el texto del overlay
    const ubicacionLine = resumenConOverlay[ubicacionIndex];
    // Solo agrega el texto si no está presente ya
    if (!ubicacionLine.includes(textoBotonOverlayActivo)) {
      // No hace nada porque el texto ya fue agregado por el onPress del botón en la línea 3155
      // El resumen ya contiene el texto completo
    }
  } else {
    // Si "Ubicación:" no está presente, simplemente agrega la línea del overlay.
    resumenConOverlay.push(`A nivel${textoBotonOverlayActivo}`);
  }
  }
  // Lógica para resumenTextoLargo (modo enunciado)
let resumenTextoLargoConOverlay = textoEditadoManualmente 
  ? textoEditado 
  : resumenTextoLargo.join(' ');

  if (!textoEditadoManualmente && textoBotonOverlayActivo) {
    // Definimos las frases de ubicación que buscamos
    const ubicacionTexts = [
      'focalizada a nivel',
      'segmentaria a nivel',
      'generalizada a nivel',
    ];
    let inserted = false;

    for (const ubicacionText of ubicacionTexts) {
    
      const regex = new RegExp(`(${ubicacionText})`, 'i');
      if (resumenTextoLargoConOverlay.match(regex)) {
        resumenTextoLargoConOverlay = resumenTextoLargoConOverlay.replace(regex, `$1 ${textoBotonOverlayActivo}`);
        inserted = true;
        break; // Una vez insertado, salimos del bucle
      }
    }

    if (!inserted && !resumenTextoLargoConOverlay.includes(textoBotonOverlayActivo)) {
        resumenTextoLargoConOverlay = `${resumenTextoLargoConOverlay.trim()} ${textoBotonOverlayActivo}`;
    }
  }

  useEffect(() => {
    // Checar orientación inicial
    Orientation.getDeviceOrientation((orientation) => {
      if (orientation === 'LANDSCAPE-LEFT' || orientation === 'LANDSCAPE-RIGHT') {
        setIsHorizontal(true);
      } else {
        setIsHorizontal(false);
      }
    });

    // Listener para cambios
    const listener = (orientation: OrientationType) => {
      if (orientation === 'LANDSCAPE-LEFT' || orientation === 'LANDSCAPE-RIGHT') {
        setIsHorizontal(true);
      } else {
        setIsHorizontal(false);
      }
    };

    Orientation.addDeviceOrientationListener(listener);

    return () => {
      Orientation.removeDeviceOrientationListener(listener);
    };
  }, []);


  // Cambia el style activo dependiendo de la orientación
  const activeStyles = isHorizontal ? styleReporteHorizontal : styleReporte;
  const [showEditModal, setShowEditModal] = useState(false);// Estado para habilitar el modo de edición
  return (
    <>
    <View style={activeStyles.container}>
      {!isHorizontal && <Header onStartLogout={() => setIsCargaCerrar(true)} onLogoutFinish={() => setIsCargaCerrar(false)}/>}
      <View style={activeStyles.topBar}>
        {/* Nombre del paciente – movido aquí */}
        <View style={activeStyles.nombrePacienteContainerTop}>
            <FancyInput
              label="Nombre del paciente"
              placeholder="Nombre del paciente"
              value={nombrePaciente}
              onChangeText={setNombrePaciente}
            />
          </View>
      </View>
      

      <Animated.ScrollView contentContainerStyle={{ flexGrow: 1, }} keyboardShouldPersistTaps="handled">
        <View style={activeStyles.principalReporte}>
          <View style={activeStyles.leftPanel}>
            
            <View
              ref={leftCanvasRef}
              style={[
                activeStyles.imageInteractionArea,
                {
                  width: maxImageWidth,
                  height: imageHeight,
                  alignSelf: 'center',
                  ...((suppressDim || exporting) && {
                    backgroundColor: 'transparent',
                    borderRadius: 0,
                  }),
                }
              ]}
              collapsable={false}
              renderToHardwareTextureAndroid
              needsOffscreenAlphaCompositing
              onLayout={(event) => {
                const { width, height } = event.nativeEvent.layout;
                setLimitesContenedor({ width, height });
              }}
            >
              <GestureDetector gesture={composedGesture}>
                <Animated.View style={[activeStyles.animatedImageContainer, { width: maxImageWidth, height: imageHeight }, animatedStyle]}>
                  <Image source={IMG_BASE_TRANSPARENT} style={{ width: maxImageWidth, height: imageHeight, resizeMode: 'contain' }} />
                  {figuras.map((figura) => (
                    <FiguraMovible
                      key={figura.id}
                      id={figura.id}
                      tipo={figura.tipo}
                      uri={figura.uri}
                      posicionInicial={figura.posicion}
                      onEliminar={eliminarFigura}
                      onActualizarPosicion={actualizarPosicion}
                      limitesContenedor={limitesContenedor}
                      ocultarBoton={suppressDim || exporting}
                    />
                  ))}
                  {/* Renderizar imágenes de jerarquía (zonasFijas) */}
                  {zonasSeleccionadasPorJerarquia.map((zona, index) => {
                    const imgSource = imagenesOverlay[zona];
                    if (!imgSource) return null;

                    return (
                      <Image
                        key={`jerarquia-overlay-${index}`}
                        source={imgSource}
                        style={activeStyles.fullSizeOverlayImage}
                      />
                    );
                  })}

                  {/* Renderizar la imagen activa del botón de overlay */}
                  {imagenBotonOverlayActiva && imagenesOverlay[imagenBotonOverlayActiva] && (
                    <Image
                      key={`boton-overlay-activa`}
                      source={imagenesOverlay[imagenBotonOverlayActiva]}
                      style={activeStyles.fullSizeOverlayImage}
                    />
                  )}

                    {botonesOverlay &&
                    botonesOverlay.map((boton, index) => {
                      
                      const top = limitesContenedor.height * (boton.top / 100);
                      const left = limitesContenedor.width * (boton.left / 100);
                      const width = limitesContenedor.width * (boton.width / 100);
                      const height = limitesContenedor.height * (boton.height / 100);

                      
                      const isActive = imagenBotonOverlayActiva === boton.ImgValue;
                      const borderColor = isActive ? '#ff4500' : 'transparent';
                      const buttonStyle: ViewStyle = {
                        position: 'absolute',
                        top,
                        left,
                        width,
                        height,
                        borderRadius: boton.borderRadius ?? 20,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderColor: borderColor,
                        borderWidth: 1,
                        transform: [
                          { rotate: `${boton.rotate ?? 0}deg` }
                        ],
                        backgroundColor: borderColor,
                      };

                      const textStyle = {
                        color: boton.backgroundImage ? '#000' : '#fff',
                        fontSize: 14,
                      };

                      if (boton.backgroundImage) {
                        return (
                          <TouchableOpacity
                            key={index}
                            style={buttonStyle}
                            onPress={() => {
                              setImagenBotonOverlayActiva(boton.ImgValue);
                              setTextoBotonOverlayActivo(boton.texto);

                              // Agregar el nivel al resumen
                              if (boton.texto) {
                                setResumen((prev) => {
                                  const copy = [...prev];
                                  const ubicacionIndex = copy.findIndex(line => line.startsWith('Ubicación -'));

                                  if (ubicacionIndex !== -1) {
                                    // Actualizar la línea existente de Ubicación
                                    const ubicacionLine = copy[ubicacionIndex];
                                    copy[ubicacionIndex] = ubicacionLine.replace(/,?\s*a nivel.*$/, '') + ` a nivel ${boton.texto}`;
                                  } else {
                                    // Agregar nueva línea de nivel
                                    copy.push(`Nivel - ${boton.texto}`);
                                  }

                                  return copy;
                                });
                              }
                            }}
                          >
                            <ImageBackground
                              source={boton.backgroundImage}
                              style={activeStyles.imageBackgroundButton}
                              imageStyle={{ borderRadius: 8, resizeMode: 'contain' }}
                            >
                              <Text style={textStyle}>{boton.nombre}</Text>
                            </ImageBackground>
                          </TouchableOpacity>
                        );
                      } else {
                        return (
                          <TouchableOpacity
                            key={index}
                            style={buttonStyle}
                            onPress={() => {
                              setImagenBotonOverlayActiva(boton.ImgValue);
                              setTextoBotonOverlayActivo(boton.texto);

                              // Agregar el nivel al resumen
                              if (boton.texto) {
                                setResumen((prev) => {
                                  const copy = [...prev];
                                  const ubicacionIndex = copy.findIndex(line => line.startsWith('Ubicación -'));

                                  if (ubicacionIndex !== -1) {
                                    // Actualizar la línea existente de Ubicación
                                    const ubicacionLine = copy[ubicacionIndex];
                                    copy[ubicacionIndex] = ubicacionLine.replace(/,?\s*a nivel.*$/, '') + ` a nivel ${boton.texto}`;
                                  } else {
                                    // Agregar nueva línea de nivel
                                    copy.push(`Nivel - ${boton.texto}`);
                                  }

                                  return copy;
                                });
                              }
                            }}
                          >
                            <Text style={textStyle}>{boton.nombre}</Text>
                          </TouchableOpacity>
                        );
                      }
                    })}

                    {botonesOverlaySeg &&
                      botonesOverlaySeg.map((boton, index) => {
                        
                        const top = limitesContenedor.height * (boton.top / 100);
                        const left = limitesContenedor.width * (boton.left / 100);
                        const width = limitesContenedor.width * (boton.width / 100);
                        const height = limitesContenedor.height * (boton.height / 100);

                        const isActive = imagenBotonOverlayActiva === boton.ImgValue;
                        const buttonStyle: ViewStyle = {
                          position: 'absolute',
                          top,
                          left,
                          width,
                          height,
                          borderRadius: boton.borderRadius ?? 8,
                          justifyContent: 'center',
                          alignItems: 'center',
                          borderColor: 'transparent',
                          borderWidth: 0,
                          transform: [{ rotate: `${boton.rotate ?? 0}deg` }],
                          backgroundColor: 'transparent',
                        };

                        const textStyle = {
                          color: boton.backgroundImage ? '#000' : '#fff',
                          fontSize: 14,
                        };

                        return (
                          <TouchableOpacity
                            key={index}
                            style={buttonStyle}
                            onPress={() => {
                              setImagenBotonOverlayActiva(boton.ImgValue);
                              setTextoBotonOverlayActivo(boton.texto);

                              // Agregar el nivel al resumen
                              if (boton.texto) {
                                setResumen((prev) => {
                                  const copy = [...prev];
                                  const ubicacionIndex = copy.findIndex(line => line.startsWith('Ubicación -'));

                                  if (ubicacionIndex !== -1) {
                                    // Actualizar la línea existente de Ubicación
                                    const ubicacionLine = copy[ubicacionIndex];
                                    copy[ubicacionIndex] = ubicacionLine.replace(/,?\s*a nivel.*$/, '') + ` a nivel ${boton.texto}`;
                                  } else {
                                    // Agregar nueva línea de nivel
                                    copy.push(`Nivel - ${boton.texto}`);
                                  }

                                  return copy;
                                });
                              }
                            }}
                          >
                            {isActive && boton.backgroundImage ? (
                              <ImageBackground
                                source={boton.backgroundImage}
                                style={activeStyles.imageBackgroundButton}
                                imageStyle={{ borderRadius: 8, resizeMode: 'contain' }}
                              >
                                <Text style={textStyle}>{boton.nombre}</Text>
                              </ImageBackground>
                            ) : (
                              <Text style={textStyle}>{boton.nombre}</Text>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                </Animated.View>
              </GestureDetector>
            </View>
          </View>

          <View style={activeStyles.rightPanelNeuropatia}>
            <View style={activeStyles.optionsSection}>
              <View style={activeStyles.ContenedorSeccion}>
                <View style={activeStyles.iconContainer}>
                    <TouchableOpacity style={activeStyles.iconCircle} onPress={retrocederNivel}>
                      <ImageBackground
                        source={require('../../../assets/03_Íconos/03_02_PNG/I_Out2.png')} // Cambia la ruta a tu imagen
                        style={activeStyles.iconBackground}
                        imageStyle={{
                          width: '90%',
                          height: '90%',

                        }}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity style={activeStyles.iconCircle} onPress={reiniciar}>
                      <ImageBackground
                        source={require('../../../assets/03_Íconos/03_02_PNG/I_Repeat2.png')} // Cambia la ruta a tu imagen
                        style={activeStyles.iconBackground}
                        imageStyle={{
                          width: '90%',
                          height: '90%',
                        }}
                      />
                    </TouchableOpacity>
                    {nivelActual.titulo === 'Distribución ' && !distribucionFinalizada && (
                      <TouchableOpacity style={activeStyles.iconCircle} onPress={() => { if ('siguiente' in nivelActual && nivelActual.siguiente)
                        {
                          setZonasFijas((prev) => {
                            const nuevas = seleccionMultiple.filter(z => !prev.includes(z));
                            return [...prev, ...nuevas];
                          });
                      }
                      }}>
                        <ImageBackground
                          source={require('../../../assets/03_Íconos/03_02_PNG/I_In2.png')} // Cambia la ruta a tu imagen
                          style={activeStyles.iconBackground}
                          imageStyle={{
                            width: '90%',
                            height: '90%',
                          }}
                        />
                      </TouchableOpacity>
                    )}
                    {['Fibras',].includes(nivelActual.titulo) && 
                    (
                      <TouchableOpacity style={activeStyles.iconCircle}
                        onPress={() => {
                          // Si el nivel tiene siguiente, avanza normalmente
                          if ('siguiente' in nivelActual && nivelActual.siguiente) {
                            setRuta([...ruta, nivelActual.siguiente as typeof estructuraJerarquica]);
                          } else if (nivelActual.opciones && nivelActual.opciones.length > 0 && nivelActual.opciones[0].siguiente) {
                            setRuta([...ruta, nivelActual.opciones[0].siguiente]);
                          }

                          // ACTUALIZA resumenTextoLargo con las selecciones actuales
                          if (seleccionMultiple.length > 0) {
                            const raices = joinConY(seleccionMultiple);
                            const nuevaEntradaTexto = ` ${raices}`;
                            setResumenTextoLargo((prev) => {
                              const indexExistente = resumenTextoLargo.findIndex((entry, idx) =>
                                resumen[idx]?.startsWith(`${nivelActual.titulo}:`)
                              );
                              let actualizado = [...prev];
                              if (indexExistente !== -1) {
                                actualizado[indexExistente] = nuevaEntradaTexto;
                              } else {
                                actualizado.push(nuevaEntradaTexto);
                              }
                              return actualizado;
                            });
                          }
                        }}
                      >
                        <ImageBackground
                          source={require('../../../assets/03_Íconos/03_02_PNG/I_In2.png')} // Cambia la ruta a tu imagen
                          style={activeStyles.iconBackground}
                          imageStyle={{
                            width: '90%',
                            height: '90%',
                          }}
                        />
                      </TouchableOpacity>
                    )}

                    {('siguiente' in nivelActual && nivelActual.siguiente) && (
                      <TouchableOpacity style={activeStyles.iconCircle}
                        onPress={() => {
                          // Como ya verificamos que 'siguiente' existe, simplemente lo usamos
                          setRuta([...ruta, nivelActual.siguiente as typeof estructuraJerarquica]);
                          
                          // La lógica de actualización de resumenTextoLargo sigue siendo la misma
                          if (seleccionMultiple.length > 0) {
                            const raices = joinConY(seleccionMultiple);
                            const nuevaEntradaTexto = ` ${raices}`;
                            setResumenTextoLargo((prev) => {
                              const indexExistente = resumenTextoLargo.findIndex((entry, idx) =>
                                resumen[idx]?.startsWith(`${nivelActual.titulo}:`)
                              );
                              let actualizado = [...prev];
                              if (indexExistente !== -1) {
                                actualizado[indexExistente] = nuevaEntradaTexto;
                              } else {
                                actualizado.push(nuevaEntradaTexto);
                              }
                              return actualizado;
                            });
                          }
                        }}
                      >
                        <ImageBackground
                          source={require('../../../assets/03_Íconos/03_02_PNG/I_In2.png')}
                          style={activeStyles.iconBackground}
                          imageStyle={{
                            width: '90%',
                            height: '90%',
                          }}
                        />
                      </TouchableOpacity>
                    )}
                    
                    {nivelActual.titulo === 'Pronóstico' && distribucionFinalizada ? (
                      <TouchableOpacity
                      style={[activeStyles.iconCircle, activeStyles.printButton]}
                      onPress={handleExportRequest}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel="Exportar reporte"
                    >
                      <ImageBackground
                        source={require('../../../assets/03_Íconos/03_02_PNG/I_Document.png')}
                        style={activeStyles.iconBackground}
                        imageStyle={{ width: '90%', height: '90%', tintColor: '#fff' }}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>

                  ) : null}
                  </View>
                {!(nivelActual.titulo === 'Pronóstico' && distribucionFinalizada) && (
                  <Text style={[activeStyles.titleText, { marginBottom: 10 }]}>{nivelActual.titulo}</Text>
                )}

                {nivelActual.titulo === 'Pronóstico' && distribucionFinalizada ? (
                   <>
    {modoReporte === 'GenerarLink' ? (
      <View style={[activeStyles.ContenedorSeccion, { alignItems: 'stretch' }]}>
        <View style={{ alignSelf: 'stretch', width: '100%', flexShrink: 1, marginTop: 36 }}>
          <LinkUploader
            key={`uploader-${linkDefaults.defaultTitle}`}
            compact
            defaultTitle={linkDefaults.defaultTitle}
            defaultMessage={linkDefaults.defaultMessage}
            autoReportName={linkDefaults.autoReportName}
            onRequestTemplate={requestTemplateForLink}
            onGenerateLink={generateShareLink}
          />
        </View>
      </View>
    ) : (
      <View style={activeStyles.contenedorFiguras}>
        <View style={activeStyles.tituloFiguras}>
          {modoReporte === 'enunciado' ? (
            <>
              <TouchableOpacity onPress={() => manejarSeleccionImagen('circle')}>
                <Image source={require('../../../assets/Figuras/circulo.png')} style={activeStyles.imagenCirculo}/>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => manejarSeleccionImagen('square')}>
                <Image source={require('../../../assets/Figuras/cuadrado.png')} style={activeStyles.imagenCuadro}/>
              </TouchableOpacity>
            </>
          ) : (
            <View style={activeStyles.listaStack}>
              <TouchableOpacity
                onPress={() => setMostrarGaleria(true)}
                style={[activeStyles.BotonReporte, activeStyles.botonGaleria]}
              >
                <ImageBackground
                  source={require('../../../assets/tecnicas/Info/I_Tabla_Gris.png')}
                  style={activeStyles.backgroundBoton}
                  imageStyle={activeStyles.imagenFondoBoton}
                />
              </TouchableOpacity>

              {!!imgListaSrc
                ? <Text style={activeStyles.estadoImagenOk}>✓ Imagen lista seleccionada</Text>
                : <Text style={activeStyles.estadoImagenVacia}>Sin imagen seleccionada</Text>
              }

              {/* Vista previa del comentario */}
              {comentarioLista && (
                <View style={activeStyles.comentarioPreview}>
                  <ScrollView
                    style={{ maxHeight: 120 }}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={true}
                  >
                    <Text style={activeStyles.comentarioPreviewText}>
                      {comentarioLista}
                    </Text>
                  </ScrollView>
                </View>
              )}
              {/* Botón para abrir el modal de comentarios */}
              <TouchableOpacity
                onPress={() => setShowComentarioModal(true)}
                style={activeStyles.btnComentario}
              >
                <Text style={activeStyles.btnComentarioText}>
                  {comentarioLista ? 'Editar Comentario' : 'Agregar Comentario'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    )}
  </>


                ) : (
                  <ScrollView style={[activeStyles.categoryContainer,
                  nivelActual.titulo === 'Pronóstico' && { width: '70%', marginRight: 0 }
                  ]} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                    {nivelActual.opciones.map((opcion: any, index: number) => {
                      // Condición para mostrar un botón si tiene una propiedad "siguiente" o "nombre"
                      if (opcion.siguiente || opcion.nombre) {
                        return (
                          <TouchableOpacity
                            key={index}
                            style={[activeStyles.category, { backgroundColor: '#222' }]}
                            onPress={() => avanzarNivel(opcion)}
                          >
                            <Text style={activeStyles.categoryText}>{opcion.nombre}</Text>
                          </TouchableOpacity>
                        );
                      } else if (opcion.textoAMostrar) {
                        // Condición para mostrar el texto si tiene la propiedad "textoAMostrar"
                        return (
                          <View key={index} style={estilosLocales.textContainer}>
                            <Text style={estilosLocales.infoText}>{opcion.textoAMostrar}</Text>
                          </View>
                        );
                      }
                    })}
                  </ScrollView>
                )}
                {
                  (nivelActual.titulo === 'Seleccionar' &&
                  !distribucionFinalizada
                ) && (
                    <View style={{ flexDirection: 'row', marginBottom: 10, gap: 10 }}>
                      <TouchableOpacity
                        onPress={() => {
                          if ('siguiente' in nivelActual && nivelActual.siguiente) {
                            setRuta([...ruta, nivelActual.siguiente as Jerarquia]);
                          } else if (nivelActual.opciones && nivelActual.opciones.length > 0 && nivelActual.opciones[0].siguiente) {
                            setRuta([...ruta, nivelActual.opciones[0].siguiente as Jerarquia]);
                          }

                        }}
                        style={{ backgroundColor: '#ff4500', padding: 10, borderRadius: 5 }}
                      >
                        <Text style={{ color: 'white', textAlign: 'center' }}>Siguiente ➔</Text>
                      </TouchableOpacity>
                    </View>
                  )}
              </View>
            </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 10 }}>
            <TouchableOpacity
              style={[{ padding: 10, borderRadius: 8, marginHorizontal: 5, backgroundColor: modoPrincipal === 'reporte' ? '#ff4500' : '#222' }]}
              onPress={() => { setModoPrincipal('reporte'); setModoReporte('enunciado'); }}
            >
              <Text style={{ color: '#fff' }}>Reporte</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[{ padding: 10, borderRadius: 8, marginHorizontal: 5, backgroundColor: modoPrincipal === 'lista' ? '#ff4500' : '#222' }]}
              onPress={() => { setModoPrincipal('lista'); setModoReporte('lista'); }}
            >
              <Text style={{ color: '#fff' }}>Lista</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[{ padding:10, borderRadius:8, marginHorizontal:5, backgroundColor: modoReporte==='GenerarLink' ? '#ff4500' : '#222' }]}
              onPress={() =>  { setModoPrincipal('GenerarLink'); setModoReporte('GenerarLink'); }}
            >
              <Text style={{ color:'#fff' }}>GenerarLink</Text>
            </TouchableOpacity>
          </View>

            <View style={activeStyles.reporteContainer}>
              <Text style={activeStyles.reporteTitle}>Neuropatía</Text>
              {nombrePaciente.trim() !== '' && (
                <Text style={[activeStyles.reporteTexto, { fontWeight: 'bold', marginBottom: 5 }]}>
                  Paciente: {nombrePaciente}
                </Text>
              )}
              {modoReporte === 'lista' ? (
                <View style={estilosLocales.wrap}>
                  
                  {(resumenConOverlay ?? [])
                    .filter(l => l && l !== '_') // evita imprimir placeholders
                    .map((linea, index) => (
                      <Text key={index} style={[activeStyles.reporteTexto, estilosLocales.linea]}>
                        {linea}
                      </Text>
                    ))
                  }
                </View>
              ) : (
                <View>
                  <Text
                    style={[
                      activeStyles.reporteTexto,
                      { color: '#fff', fontSize: 14, lineHeight: 20, fontFamily: 'LuxoraGrotesk-Light', textAlign: 'justify' }
                    ]}
                  >
                    {resumenTextoLargoConOverlay}
                  </Text>
                  {/* Botón para habilitar/deshabilitar edición */}
                  <TouchableOpacity
                    style={{
                      marginTop: 10,
                      padding: 10,
                      backgroundColor: '#222',
                      borderRadius: 5,
                      alignItems: 'center',
                    }}
                    onPress={() =>{
                      setShowEditModal(true)
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                      Editar
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
        
      </Animated.ScrollView>
      {isCargaCerrar && (
        <View style={activeStyles.logoutOverlay}>
          <Text style={activeStyles.logoutText}>Cerrando sesión...</Text>
          <ActivityIndicator size="large" color="#E65800" />
        </View>
      )}
    
      {/* Galería Emergente */}
      {mostrarGaleria && (
        <GaleriaEmergente
          visible={mostrarGaleria}
          onClose={() => setMostrarGaleria(false)}
          onImagenSeleccionada={(src) => {
        setImgLista(src)
        setMostrarGaleria(false);
        setActiveTab('lista');
      }}
        />
      )}


        {/* ========= LIENZOS OCULTOS PARA EXPORT ========= */}
  <View
          ref={exportRef}
          style={{
            position: 'absolute', left: 0, top: 0, zIndex: -1,
            width: pageWpx, height: pageHpx, backgroundColor: exportBgColor, pointerEvents: 'none',
            padding: pad, flexDirection: 'column',
            borderWidth: 0, borderColor: 'transparent'
          }}
          collapsable={false}
          renderToHardwareTextureAndroid
          needsOffscreenAlphaCompositing
        >
          {/* HEADER (logo arriba a la derecha en hoja 1) */}
           <View style={{
           height: headerHpx, backgroundColor:'transparent',
           paddingHorizontal: px(pdfCfg.header.padH),
           paddingTop: px(pdfCfg.header.padTop),
           paddingBottom: px(pdfCfg.header.padBottom),
           justifyContent:'center',
           borderWidth: 0, borderColor: 'transparent'
                                          }}>
            <View style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between'}}>
              <Text
                numberOfLines={1}
                style={{
                  flex: 1,
                  color:'#000',
                  fontWeight: pdfCfg.header.patient.weight,
                  fontSize: px(pdfCfg.header.patient.nameSize),
                  marginRight: px(8),
                }}
              >
                <Text style={{ fontSize: px(pdfCfg.header.patient.labelSize) }}> </Text>
                {nombrePaciente || ''}
              </Text>
  
              {!!userData?.imageUrl && (
                <View style={{
                  position:'relative',
                  width: px(pdfCfg.header.logo.size + pdfCfg.header.logo.fogPad*2),
                  height: px(pdfCfg.header.logo.size + pdfCfg.header.logo.fogPad*2),
                  justifyContent:'center',
                  alignItems:'center',
                  alignSelf:'flex-start',
                }}>
                  <View style={{
                    position:'absolute', width:'100%', height:'100%',
                    backgroundColor:'#fff', opacity: pdfCfg.header.logo.fogOpacity
                  }} />
                  <Image
                    source={{ uri: userData.imageUrl }}
                    resizeMode="contain"
                    style={{
                      width: px(pdfCfg.header.logo.size),
                      height: px(pdfCfg.header.logo.size),
                      opacity: pdfCfg.header.logo.opacity
                    }}
                  />
                </View>
              )}
            </View>
          </View>
{/* LÁMINA (usa la captura real si existe, si no, cae al CanvasView) */}
<View
  style={{
    width: laminaWpx,
    height: laminaHpx,
    alignSelf: 'center',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  }}
  collapsable={false}
  renderToHardwareTextureAndroid
>
  {shot ? (
    <Image
      source={{ uri: `data:image/png;base64,${shot}` }}
      style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
      resizeMode="contain"
    />
  ) : (
    <CanvasView w={laminaWpx} h={laminaHpx} transparentBg={plantillaId !== 'none'} />
  )}
</View>

              
          {/* DIAGNÓSTICO (siempre el TEXTO DEL MODO REPORTE tal cual join(' ')) */}
          <View style={{
                  height: diagHpx, backgroundColor:'transparent',
                  borderTopWidth: 0, borderTopColor: 'transparent',
                  justifyContent:'flex-start',
                  paddingHorizontal: px(pdfCfg.diag.padH),
                  paddingVertical: px(pdfCfg.diag.padV),
                  overflow:'hidden', 
                  marginTop: px(20), 
                       }}>
            <Text style={{ color:'#000', fontSize: px(pdfCfg.diag.titleSize), fontWeight:'700',  marginBottom: px(26) }}>
              Diagnóstico
            </Text>
            <Text style={{ color:'#000', fontSize: px(pdfCfg.diag.textSize), lineHeight: px(pdfCfg.diag.lineHeight), textAlign:'justify' }}>
              {resumenTextoLargoConOverlay || textoReporte}
            </Text>
          </View>
  
          {/* FOOTER */}
          <View style={{
                         height: footerHpx,
                         paddingHorizontal: px(pdfCfg.footer.padH),
                         paddingVertical: px(pdfCfg.footer.padV),
                         backgroundColor:'transparent',
                         opacity: pdfCfg.footer.opacity,
                         justifyContent:'center'
                       }}>
            <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'center' }}>
              {/* Usuario */}
              <View style={{ flexDirection:'row', alignItems:'center', marginHorizontal: px(pdfCfg.footer.itemGap) }}>
                <Svg width={px(pdfCfg.footer.icon)} height={px(pdfCfg.footer.icon)} viewBox="0 0 24 24" fill="#000">
                  <Path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </Svg>
                <Text numberOfLines={1} style={{ color:'#000', fontSize: px(pdfCfg.footer.text), marginLeft: px(pdfCfg.footer.iconTextGap) }}>
                  {`${userData?.name || ''} ${userData?.lastname || ''}`.trim()}
                </Text>
              </View>
              {/* Email */}
              <View style={{ flexDirection:'row', alignItems:'center', marginHorizontal: px(pdfCfg.footer.itemGap) }}>
                <Svg width={px(pdfCfg.footer.icon)} height={px(pdfCfg.footer.icon)} viewBox="0 0 24 24" fill="#000">
                  <Path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 
                  2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </Svg>
                <Text numberOfLines={1} style={{ color:'#000', fontSize: px(pdfCfg.footer.text), marginLeft: px(pdfCfg.footer.iconTextGap) }}>
                  {userData?.email || ''}
                </Text>
              </View>
              {/* Especialidad */}
              <View style={{ flexDirection:'row', alignItems:'center', marginHorizontal: px(pdfCfg.footer.itemGap) }}>
                <Svg width={px(pdfCfg.footer.icon)} height={px(pdfCfg.footer.icon)} viewBox="0 0 90 90" fill="#000">
                  <Path d="M45.12,61.02c0,0,0,7.32-4.79,7.32h-8.68c-1.82,0-3.29-1.47-3.29-3.29
                  c0,0-2.39-8.68-2.65-8.68l-2.88-1.21c-1.57-0.66-2.31-2.46-1.66-4.03l4.8-9.65v-0.67
                  c0-11.9,9.65-21.55,21.55-21.55s21.55,9.65,21.55,21.55c0,5.12-1.8,9.84-4.79,13.54v16.39" />
                </Svg>
                <Text numberOfLines={1} style={{ color:'#000', fontSize: px(pdfCfg.footer.text), marginLeft: px(pdfCfg.footer.iconTextGap) }}>
                  {userData?.specialty || ''}
                </Text>
              </View>
              {/* Cédula */}
              <View style={{ flexDirection:'row', alignItems:'center', marginHorizontal: px(pdfCfg.footer.itemGap) }}>
                <Svg width={px(pdfCfg.footer.icon)} height={px(pdfCfg.footer.icon)} viewBox="0 0 24 24" fill="#000">
                  <Path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 
                  0 2-.9 2-2V4c-1.1-.9-2-2-2-2zm-2 2l-6 3.99L6 4h12z"/>
                </Svg>
                <Text numberOfLines={1} style={{ color:'#000', fontSize: px(pdfCfg.footer.text), marginLeft: px(pdfCfg.footer.iconTextGap) }}>
                  {userData?.idprofessional || ''}
                </Text>
              </View>
            </View>
          </View>
        </View>
  
            
          {/* 2ª HOJA (igual que la tuya) */}
            <View
              ref={exportRef2}
              style={{
                position: 'absolute', left: 0, top: 0, zIndex: -1,
                width: pageWpx, height: pageHpx, backgroundColor: exportBgColor, pointerEvents: 'none',
                padding: pad,
              }}
              collapsable={false}
              renderToHardwareTextureAndroid
              needsOffscreenAlphaCompositing
            >
              {/* Layout: arriba (2 columnas) / abajo (imagen) */}
              <View style={{ flex: 1, flexDirection: 'column' }}>
                 <View style={{ height: px((pdfCfg.page2?.shiftDown) || 0) }} />

                <View style={{ flexDirection: 'row', flex: 1 }}>
                  {/* LISTA */}
                    <View style={{ flex: 1, marginRight: px(6), paddingVertical: px(10), paddingLeft: px(36), paddingRight: px(14),backgroundColor:'transparent' }}>
                    <Text style={{ fontWeight: '700', fontSize: px(12), marginBottom: px(6), color: '#000' }}>Neuropatía
                    </Text>
                    {resumen.map((line, idx) => (
                      <Text key={`li_${idx}`} style={{ fontSize: px(9.2), color:'#000', marginBottom: px(4), lineHeight: px(13) }}>
                        • {line}
                      </Text>
                    ))}
                    {resumen.length === 0 && (
                      <Text style={{ fontSize: px(9.2), color:'#000' }}>—</Text>
                    )}
                  </View>
                  {/* COMENTARIO */}
                    <View style={{ flex: 1, marginLeft: px(2), paddingVertical: px(10), paddingRight: px(24), paddingLeft: px(6),backgroundColor:'transparent' }}>
                    <Text style={{ fontWeight: '700', fontSize: px(12), marginBottom: px(6), color: '#000' }}>
                    </Text>
                    <Text style={{ fontSize: px(ninth(9.2) as any), color:'#000', lineHeight: px(13), textAlign: 'justify' }}>
                      {limpiarTextoLibre(comentarioLista)}
                    </Text>
                  </View>
                </View>
      
               {/* Fila inferior: IMAGEN COMPLETA (anclada arriba) */}
                                       <View style={{
                                         flex: 1.3,
                                         padding: px(30),
                                         alignItems: 'center',
                                         marginTop: px(25),
                                         justifyContent: 'flex-start',   
                                      }}>
                                        {imgListaSrc ? (
                                          <Image
                                            source={imgListaSrc as ImageSourcePropType}
                                            resizeMode="contain"
                                            style={{
                                            width: '85%',
                                            height: undefined,         
                                            aspectRatio: imgListaAR || 16/9, 
                                            maxHeight: '85%',         
                                            alignSelf: 'center',
                                            }}
                                          />
                                        ) : (
                                          <Text style={{ fontSize: px(10), color: '#666' }}>Sin imagen seleccionada.</Text>
                                        )}
                                      </View>
              </View>
            </View>
      
            {/* Overlay exportando */}
            {exporting && (
              <View style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: 'rgba(0,0,0,0.5)',
                justifyContent: 'center', alignItems: 'center', zIndex: 9999
              }}>
                <ActivityIndicator size="large" color="#ff4500" />
                <Text style={{ marginTop: 12, fontSize: 16, color:'#fff', fontWeight:'600' }}>
                  {exportKind === 'pdf' ? 'Exportando PDF…' : exportKind === 'jpeg' ? 'Exportando JPEG…' : 'Exportando…'}
                </Text>
              </View>
            )}

            {/* Template Picker Modal */}
            <TemplatePickerModal
              visible={templatePickerVisible}
              onClose={handleTemplatePickerClose}
              onSelect={handleTemplatePicked}
            />
            {/* Modal de éxito - Ahora como componente */}
            <ExportSuccessModal
              exportSuccess={exportSuccess}
              onClose={() => setExportSuccess(null)}
            />
          </View>

      {/* Modales fuera del contenedor principal para z-index correcto */}
      <EditTextModal
        visible={showEditModal}
        title="Editar Diagnóstico"
        initialText={resumenTextoLargoConOverlay}
        onSave={(newText) => {
          // Marcar que fue editado manualmente
          setTextoEditadoManualmente(true);
          setTextoEditado(newText);
          // Actualizar el resumen completo
          setResumenTextoLargo([newText]);
          setShowEditModal(false);
        }}
        onCancel={() => setShowEditModal(false)}
      />

      <ComentarioModal
        visible={showComentarioModal}
        title="Comentario sobre caso clínico"
        initialComentario={comentarioLista}
        onSave={(newComentario) => {
          setComentarioLista(newComentario);
          setShowComentarioModal(false);
        }}
        onCancel={() => setShowComentarioModal(false)}
      />
    </>
  );
}

export default ReporteScreen;

const estilosLocales = StyleSheet.create({
  listaStack: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  botonGaleria: {
    width: 110,
    height: 90,
    alignSelf: 'center',
    borderRadius: 10,
    overflow: 'hidden',
    bottom:15,
  },
  estadoImagenOk: {
    color: '#35d16f',
    fontWeight: '600',
    marginTop: 0,
    bottom:25,
  },
  estadoImagenVacia: {
    color: '#aaa',
    marginTop: 0,
    bottom:25,
  },
  inputComentario: {
    width: '94%',
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#fff',
    textAlignVertical: 'top',
    backgroundColor: '#1a1a1a',
    bottom:18,
  },
  inputComentarioFijo: {
    // evita “salto” de layout
  },
  filtrosWrap: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
  },
  filtrosTitulo: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },
  rowChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#555',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#111',
  },
  chipActivo: {
    backgroundColor: '#ff4500',
    borderColor: '#ff4500',
  },
  chipTxt: {
    color: '#fff',
    fontWeight: '600',
  },
  btnClear: {
    backgroundColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
   overlay: {
    ...StyleSheet.absoluteFillObject,   // top:0, left:0, right:0, bottom:0
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    maxWidth: '92%',
    maxHeight: '90%',
    alignSelf: 'center',
  },
    textContainer: {
    padding: 15,
    marginVertical: 10,
    backgroundColor: '#333', // Un color de fondo para distinguirlo
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },

     wrap: {
    alignSelf: 'stretch',
    width: '100%',
    paddingHorizontal: 12,
    marginTop: 8,
  },
  tituloSeccion: {
    width: '100%',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 4,
  },
  linea: {
    width: '100%',       // el <Text> mide toda la fila
    textAlign: 'center', // centra cada línea si el texto se parte
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 2,
  },
  titulo: {
    width: '100%',
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 6,
  },
  comentario: {
    width: '100%',
    textAlign: 'center',
    fontSize: 12,
    opacity: 0.8,
    marginTop: 8,
  },



});
const ninth = (n:number)=>n; // pequeño hack para evitar warnings con px(9.2)