import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, ImageBackground, PermissionsAndroid, Platform, Permission, Alert, Animated, TextInput, ActivityIndicator,InteractionManager, Keyboard} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Header from '../../../components/Header';
import DocumentPicker from 'react-native-document-picker';
import { launchCamera,launchImageLibrary } from 'react-native-image-picker';
import uuid from 'react-native-uuid';
import FiguraMovible from '../../../components/FiguraMovible';
import { Figura } from '../../../navigation/types';
import { escanearImagen } from '../../../utils/EscanearImagen';
import Orientation, { OrientationType } from 'react-native-orientation-locker';
import styleReporte from '../../../styles/styleReporte';
import styleReporteHorizontal from '../../../styles/styleReporteHorizontal';
import FancyInput from '../../../components/FancyInput';
import GaleriaEmergente from './GaleriaTb';
import { captureRef } from 'react-native-view-shot';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import ReactNativeBlobUtil from 'react-native-blob-util';
import type { ImageSourcePropType } from 'react-native';
// Link
import LinkUploader, { type LinkUploaderProps } from '../../../components/LinkUploader';
import { supabase } from '../../../lib/supabase';
import { initShareLink, completeShareLink } from '../../../services/shareLinks';
import { decode as b64decode, encode as b64encode } from 'base64-arraybuffer';
import TemplatePickerModal, { type PlantillaId } from '../../../components/TemplatePickerModal';
import TemplatePickerButton from '../../../components/TemplatePickerButton';

const imagenCuerpo = require('../../../assets/CuerpoPng/PlexoImg/BP_Plexopatia.png');
const IMG_BASE_TRANSPARENT = require('../../../assets/CuerpoPng/PlexoImg/BP_PTR.png');
const BASE_SRC = Image.resolveAssetSource(imagenCuerpo);
const BASE_AR = BASE_SRC.width / BASE_SRC.height;

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../../../constants/config';

import {
  PLANTILLAS_PDF, buildPdfWithTemplate,
  type PdfBuildConfig,
} from '../../../components/pdfLoadingTemplate';

//Modal de exito - Exportar pdf
import { ExportSuccessModal } from '../../../components/ExportSuccessModal';
import EditTextModal from '../../../components/EditTextModal';
import ComentarioModal from '../../../components/ComentarioModal';

/* ====== Utils ====== */
const limpiarTextoLibre = (s: string): string => {
  // Se usa SOLO para el comentario libre de la hoja 2 (no para el texto de reporte)
  if (!s) return '—';
  let t = s.replace(/\s+/g, ' ').trim();
  if (!t) return '—';
  return t[0].toUpperCase() + t.slice(1) + (/[.!?]$/.test(t) ? '' : '.');
};

const safeName = (s: string) =>
  (s || 'Paciente')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim().replace(/\s+/g, '_');

    // === Bucket de storage (igual al de los otros reportes)
const BUCKET = 'report-packages';
const MIN_COMENTARIO_HEIGHT = 120;

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


// ====== Ajustes rápidos para el PDF (cámbialos aquí) ======
// ====== Config del PDF (runtime) ======
type PdfConfig = {
  paper: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  renderScale: number;       // resolución del canvas oculto
  pageMargin: number;        // padding global de la página (px)
  header: {
    height: number; padH: number; padTop: number; padBottom: number;
    patient: { labelSize: number; nameSize: number; weight: '400'|'600'|'700' };
    logo: { size: number; opacity: number; fogOpacity: number; fogPad: number };
  };
  lamina: {
    widthFrac: number;       // fracción del ancho disponible
    minHeight: number;       // alto mínimo
  };
  diag: {
    minHeight: number;
    padH: number; padV: number;
    titleSize: number; textSize: number; lineHeight: number;
    pullUp: number;          // sube diagnóstico (recortando lámina)
    borderW: number; borderColor: string; radius: number;
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
  renderScale: 1,          
  pageMargin: 30,
  header: {
   height: 56, padH: 70, padTop: 50, padBottom: 1, 
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
    siguiente?: Jerarquia;
    texto?: string;
  } | Jerarquia)[];
  siguiente?: Jerarquia;
}



const Pronostico = {
  titulo: 'Pronóstico',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Recuperación completa', textoLista: ' Pronóstico de recuperación completa.', texto: ' pronóstico de recuperación completa.'},
    {nombre: 'Recuperación parcial', textoLista: ' Pronóstico de recuperación parcial.', texto: ' pronóstico de recuperación parcial.'},
    {nombre: 'Pobre no funcional', textoLista: ' Pronóstico de recuperación pobre no funcional.', texto: ' pronóstico de recuperación pobre no funcional.'},
    {nombre: 'Recuperación nulo', textoLista: ' Ppronóstico de recuperación nulo.', texto: ' pronóstico de recuperación nulo.'},

  ]
};

const Reinervacion = {
  titulo: 'Reinervación',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Activa', texto: 'Reinervación activa;', siguiente: Pronostico},
    {nombre: 'Inactiva', texto: 'Reinervación inactiva;', siguiente: Pronostico},

  ]
};

const IntensidadDesm = {
  titulo: 'Intensidad',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Leve', texto: ' intensidad leve.', siguiente: Pronostico},
    {nombre: 'Moderada', texto: ' intensidad moderada.', siguiente: Pronostico},
    {nombre: 'Severa', texto: ' intensidad severa.', siguiente: Pronostico},
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

const MixtaF = {
  titulo: 'Mixta',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Desmielinizante-Axonal', textoLista: 'Desmielinizante con pérdida axonal secundaria', texto: 'de tipo mixta primariamente desmielinizante con perdida axonal secundaria,', siguiente: IntensidadDesm},//Antes Intensidad
    {nombre: 'Axonal-Desmielinizante', textoLista: 'Axonal con desmielinización secundaria', texto: 'de tipo mixta primariamente axonal con desmielinizacón secundaria,', siguiente: IntensidadDesm},//Antes Intensidad
  ]
};

const DesmielinizanteT = {
  titulo: 'Desmielinizante',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Retardo en la conducción', textoLista: ' por retardo en la conducción',texto: ' por retardo en la conducción.', siguiente: Pronostico},
    {nombre: 'Bloqueo parcial en la conducción', textoLista: 'por bloqueo parcial en la conducción', texto: ' por bloqueo parcial en la conducción.', siguiente: Pronostico},
    {nombre: 'Bloqueo completo en la conducción', textoLista: 'por bloqueo completo en la conducción', texto: ' por bloqueo completo en la conducción.', siguiente: Pronostico},
  ]
};

const AxonalIncompleta = {
  titulo: 'Axonal incompleta',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Difusa (++++)', textoLista: 'con denervación difusa (++++)', texto: ' con denervación difusa (++++),', siguiente: Intensidad},
    {nombre: 'Abundante (+++)', textoLista: 'con denervación abundante (+++)', texto: ' con denervación abundante (+++),', siguiente: Intensidad},
    {nombre: 'Progresiva (++)', textoLista: 'con denervación progresiva (++)', texto: ' con denervación progresiva (++),', siguiente: Intensidad},
    {nombre: 'Discreta (+/+)', textoLista: ' con denervación discreta (+/+)', texto: ' con denervación discreta (+/+),', siguiente: Intensidad},
    {nombre: 'Ausente', textoLista: 'sin denervación,', texto: ' sin denervación', siguiente: Intensidad},
  ]
};

const AxonalCompleta = {
  titulo: 'Axonal completa',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Difusa (++++)', textoLista: 'con denervación difusa (++++)',texto: ' con denervación difusa (++++),', siguiente: Intensidad},
    {nombre: 'Abundante (+++)', textoLista: 'con denervación abundante (+++)',texto: ' con denervación abundante (+++),', siguiente: Intensidad},
    {nombre: 'Progresiva (++)', textoLista: 'con denervación progresiva (++)', texto: ' con denervación progresiva (++),', siguiente: Intensidad},
    {nombre: 'Discreta (+/+)', textoLista: 'con denervación discreta (+/+)',texto: ' con denervación discreta (+/+),', siguiente: Intensidad},
    {nombre: 'Ausente', textoLista: 'sin denervación,',texto: ' sin denervación', siguiente: Intensidad},
  ]
};

const Tipos = {
  titulo: 'Tipo',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Axonal completa', textoLista: 'Tipo: Axonal completa', texto: ' de tipo axonal completa', siguiente: AxonalCompleta},
    {nombre: 'Axonal incompleta', textoLista: 'Tipo: Axonal incompleta', texto: ' de tipo axonal incompleta', siguiente: AxonalIncompleta},
    {nombre: 'Desmielinizante', textoLista: 'Tipo: Desmielinizante', texto: ' de tipo desmielinizante', siguiente: DesmielinizanteT},
    {nombre: 'Mixta', textoLista: 'Tipo: ', texto: '', siguiente: MixtaF},
  ]
};

const CordonesDrc = {
  titulo: 'Cordones',
  seleccionMultiple: true,
  opciones: [
    {nombre: 'Lateral', texto: ' lateral', siguiente: Tipos, ImgValue: 'CordonLtD'},
    {nombre: 'Medio', texto: ' medio', siguiente: Tipos, ImgValue: 'CordonMdD'},
    {nombre: 'Posterior', textoLista: ' posterior', texto: ' posterior', siguiente: Tipos, ImgValue: 'CordonPsD'},
  ]
};

const CordonesIzq = {
  titulo: 'Cordones',
  seleccionMultiple: true,
  opciones: [
    {nombre: 'Lateral', textoLista: ' lateral', texto: ' lateral', siguiente: Tipos, ImgValue: 'CordonLtIzq'},
    {nombre: 'Medio', textoLista: ' medio', texto: ' medio', siguiente: Tipos, ImgValue: 'CordonMdIzq'},
    {nombre: 'Posterior', textoLista: ' posterior', texto: ' posterior', siguiente: Tipos, ImgValue: 'CordonPsIzq'},
  ]
};

const Cordones = {
  titulo: 'Cordones',
  seleccionMultiple: true,
  opciones: [
    {nombre: 'Lateral', textoLista: ' lateral',texto: ' lateral', siguiente: Tipos, ImgValue: 'CordonLtBlt'},
    {nombre: 'Medio', textoLista: ' medio', texto: ' medio', siguiente: Tipos, ImgValue: 'CordonMdBlt'},
    {nombre: 'Posterior', textoLista: ' posterior', texto: ' posterior', siguiente: Tipos, ImgValue: 'CordonPsBlt'},
  ]
};

const TroncosDrc = {
  titulo: 'Tronco',
  seleccionMultiple: true,
  opciones: [
    {nombre: 'Superior', textoLista: ' superior',texto: ' superior', siguiente: Tipos, ImgValue: 'ImgTroncosDrc'},
    {nombre: 'Medio', textoLista: ' medio', texto: ' medio', siguiente: Tipos, ImgValue: 'ImgTroncoMdDrc'},
    {nombre: 'Inferior', textoLista: ' inferior', texto: ' inferior', siguiente: Tipos, ImgValue: 'ImgTroncoInDrc'},
  ]
};

const TroncosIzq = {
  titulo: 'Tronco',
  seleccionMultiple: true,
  opciones: [
    {nombre: 'Superior', textoLista: ' superior',texto: ' superior', siguiente: Tipos, ImgValue: 'ImgTroncosIzq'},
    {nombre: 'Medio', textoLista: ' medio',texto: ' medio', siguiente: Tipos, ImgValue: 'ImgTroncoMdIzq'},
    {nombre: 'Inferior', textoLista: ' inferior', texto: ' inferior', siguiente: Tipos, ImgValue: 'ImgTroncoInIzq'},
  ]
};

const Troncos = {
  titulo: 'Tronco',
  seleccionMultiple: true,
  opciones: [
    {nombre: 'Superior', textoLista: ' superior', texto: ' superior', siguiente: Tipos, ImgValue: 'ImgTroncoSpBlt'},
    {nombre: 'Medio', textoLista: ' medio', texto: ' medio', siguiente: Tipos, ImgValue: 'ImgTroncoMdBlt'},
    {nombre: 'Inferior', textoLista: ' inferior',texto: ' inferior', siguiente: Tipos, ImgValue: 'ImgTroncoInBlt'},
  ]
};

const PostganglionarParcialCDrc = {
  titulo: 'Postganglionar parcial',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Plexo lumbar (Iliohipogástrico e Ilioinginal)', textoLista: 'a nivel de plexo lumbar (Iliohipogástrico e Ilioinginal)', texto: ' plexo lumbar (Iliohipogástrico e Ilioinginal)', siguiente: Tipos, ImgValue: 'IliohipoDrc'},
    {nombre: 'Plexo lumbar (Genitocrural y Femorocutáneo lateral)', textoLista: 'a nivel de plexo lumbar (Genitocrural y Femorocutáneo lateral)', texto: ' plexo lumbar (Genitocrural y Femorocutáneo lateral)', siguiente: Tipos, ImgValue: 'FemoroDrc'},
    {nombre: 'Plexo lumbar (Femoral y Obturador)', textoLista: 'a nivel de plexo lumbar (Femoral y Obturador)', texto: ' plexo lumbar (Femoral y Obturador)', siguiente: Tipos, ImgValue: 'LumbarDrc'},
    {nombre: 'Tronco lumbosacro (Ciático menor y mayor)', textoLista: 'a nivel de tronco lumbosacro (Ciático menor y mayor)', texto: ' tronco lumbosacro (Ciático menor y mayor)', siguiente: Tipos, ImgValue: 'TcLumbosDrc'},
    {nombre: 'Plexo sacro', textoLista: 'a nivel de plexo sacro', texto: ' plexo sacro', siguiente: Tipos, ImgValue: 'SacroDrc'},
    {nombre: 'Plexo pudendo', textoLista: 'a nivel de plexo pudendo', texto: ' plexo pudendo', siguiente: Tipos, ImgValue: 'PudendoDrc'},
  ]
};

const PostganglionarParcialCIzq = {
  titulo: 'Postganglionar parcial',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Plexo lumbar (Iliohipogástrico e Ilioinginal)', textoLista: 'a nivel de plexo lumbar (Iliohipogástrico e Ilioinginal)', texto: ' Plexo lumbar (Iliohipogástrico e Ilioinginal)', siguiente: Tipos, ImgValue: 'IliohipoIzq'},
    {nombre: 'Plexo lumbar (Genitocrural y Femorocutáneo lateral)', textoLista: 'a nivel de plexo lumbar (Genitocrural y Femorocutáneo lateral)', texto: ' Plexo lumbar (Genitocrural y Femorocutáneo lateral)', siguiente: Tipos, ImgValue: 'FemoroIzq'},
    {nombre: 'Plexo lumbar (Femoral y Obturador)', textoLista: 'a nivel de plexo lumbar (Femoral y Obturador)', texto: ' Plexo lumbar (Femoral y Obturador)', siguiente: Tipos, ImgValue: 'LumbarIzq'},
    {nombre: 'Tronco lumbosacro (Ciático menor y mayor)', textoLista: 'a nivel de tronco lumbosacro (Ciático menor y mayor)', texto: ' Tronco lumbosacro (Ciático menor y mayor)', siguiente: Tipos, ImgValue: 'TcLumbosIzq'},
    {nombre: 'Plexo sacro', textoLista: 'a nivel de plexo sacro', texto: ' Plexo sacro', siguiente: Tipos, ImgValue: 'SacroIzq'},
    {nombre: 'Plexo pudendo', textoLista: 'a nivel de plexo pudendo', texto: ' Plexo pudendo', siguiente: Tipos, ImgValue: 'PudendoIzq'},
  ]
};

const PostganglionarParcialC = {
  titulo: 'Postganglionar parcial',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Plexo lumbar (Iliohipogástrico e Ilioinginal)', textoLista: 'a nivel de plexo lumbar (Iliohipogástrico e Ilioinginal)', texto: ' Plexo lumbar (Iliohipogástrico e Ilioinginal)', siguiente: Tipos, ImgValue: 'IliohipoBlt'},
    {nombre: 'Plexo lumbar (Genitocrural y Femorocutáneo lateral)', textoLista: 'a nivel de plexo lumbar (Genitocrural y Femorocutáneo lateral)', texto: ' Plexo lumbar (Genitocrural y Femorocutáneo lateral)', siguiente: Tipos, ImgValue: 'FemoroBlt'},
    {nombre: 'Plexo lumbar (Femoral y Obturador)', textoLista: 'a nivel de plexo lumbar (Femoral y Obturador)', texto: ' Plexo lumbar (Femoral y Obturador)', siguiente: Tipos, ImgValue: 'LumbarBlt'},
    {nombre: 'Tronco lumbosacro (Ciático menor y mayor)', textoLista: 'a nivel de tronco lumbosacro (Ciático menor y mayor)', texto: ' Tronco lumbosacro (Ciático menor y mayor)', siguiente: Tipos, ImgValue: 'TcLumbosBlt'},
    {nombre: 'Plexo sacro', textoLista: 'a nivel de plexo sacro', texto: ' Plexo sacro', siguiente: Tipos, ImgValue: 'SacroBlt'},
    {nombre: 'Plexo pudendo', textoLista: 'a nivel de plexo pudendo', texto: ' Plexo pudendo', siguiente: Tipos, ImgValue: 'PudendoBlt'},
  ]
};

const PostganglionarParcialDrc = {
  titulo: 'Postganglionar parcial',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Troncos (Supraclavicular)', textoLista: '', texto: '', siguiente: TroncosDrc },
    {nombre: 'Divisiones (Clavicular)', textoLista: ' divisiones', texto: ' divisiones', siguiente: Tipos, ImgValue: 'CordonesDrc'},
    {nombre: 'Cordones (Infraclavicular)', textoLista: '', texto: '', siguiente: CordonesDrc },
  ]
};

const PostganglionarParcialIzq = {
  titulo: 'Postganglionar parcial',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Troncos (Supraclavicular)', textoLista: '', texto: '', siguiente: TroncosIzq },
    {nombre: 'Divisiones (Clavicular)', textoLista: ' divisiones', texto: ' divisiones', siguiente: Tipos, ImgValue: 'CordonesIzq'},
    {nombre: 'Cordones (Infraclavicular)', textoLista: '', texto: '', siguiente: CordonesIzq },
  ]
};

const PostganglionarParcial = {
  titulo: 'Postganglionar parcial',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Troncos (Supraclavicular)', textoLista: '', texto: '', siguiente: Troncos },
    {nombre: 'Divisiones (Clavicular)', textoLista: ' divisiones', texto: ' divisiones', siguiente: Tipos, ImgValue: 'CordonesBlt'},
    {nombre: 'Cordones (Infraclavicular)', textoLista: '', texto: '', siguiente: Cordones },
  ]
};

const PostganglionartotalDrc = {
  titulo: 'Postganglionar total',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Troncos (Supraclavicular)', textoLista: ' troncos', texto: ' troncos', siguiente: Tipos, ImgValue: 'TroncosDrc'},
    {nombre: 'Divisiones (Clavicular)', textoLista: ' divisiones', texto: ' divisiones', siguiente: Tipos, ImgValue: 'CordonesDrc'},
    {nombre: 'Cordones (Infraclavicular)', textoLista: ' cordones', texto: ' cordones', siguiente: Tipos, ImgValue: 'CordonesDrc'},
  ]
};

const PostganglionartotalIzq = {
  titulo: 'Postganglionar total',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Troncos (Supraclavicular)', textoLista: ' troncos', texto: ' troncos', siguiente: Tipos, ImgValue: 'TroncosIzq'},
    {nombre: 'Divisiones (Clavicular)', textoLista: ' divisiones', texto: ' divisiones', siguiente: Tipos, ImgValue: 'CordonesIzq'},
    {nombre: 'Cordones (Infraclavicular)', textoLista: ' cordones', texto: ' cordones', siguiente: Tipos, ImgValue: 'CordonesIzq'},
  ]
};

const Postganglionartotal = {
  titulo: 'Postganglionar total',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Troncos (Supraclavicular)', textoLista: ' troncos', texto: ' troncos', siguiente: Tipos, ImgValue: 'TroncosBlt'},
    {nombre: 'Divisiones (Clavicular)', textoLista: ' divisiones', texto: ' divisiones', siguiente: Tipos, ImgValue: 'CordonesBlt'},
    {nombre: 'Cordones (Infraclavicular)', textoLista: ' cordones', texto: ' cordones', siguiente: Tipos, ImgValue: 'CordonesBlt'},
  ]
};

const PreganglionarParcialDrc = {
  titulo: 'Preganglionar parcial',
  seleccionMultiple: true,
  opciones: [
    {nombre: 'C5', texto: ' C5', siguiente: Tipos, ImgValue: 'ImgTroncosDrc'},
    {nombre: 'C6', texto: ' C6', siguiente: Tipos, ImgValue: 'ImgTroncosDrc'},
    {nombre: 'C7', texto: ' C7', siguiente: Tipos, ImgValue: 'ImgTroncoMdDrc'},
    {nombre: 'C8', texto: ' C8', siguiente: Tipos, ImgValue: 'ImgTroncoInDrc'},
    {nombre: 'T1', texto: ' T1', siguiente: Tipos, ImgValue: 'ImgTroncoInDrc'},
  ]
};

const PreganglionarParcialIzq = {
  titulo: 'Preganglionar parcial',
  seleccionMultiple: true,
  opciones: [
    {nombre: 'C5', texto: ' C5', siguiente: Tipos, ImgValue: 'ImgTroncosIzq'},
    {nombre: 'C6', texto: ' C6', siguiente: Tipos, ImgValue: 'ImgTroncosIzq'},
    {nombre: 'C7', texto: ' C7', siguiente: Tipos, ImgValue: 'ImgTroncoMdIzq'},
    {nombre: 'C8', texto: ' C8', siguiente: Tipos, ImgValue: 'ImgTroncoInIzq'},
    {nombre: 'T1', texto: ' T1', siguiente: Tipos, ImgValue: 'ImgTroncoInIzq'},
  ]
};

const PreganglionarParcial = {
  titulo: 'Preganglionar parcial',
  seleccionMultiple: true,
  opciones: [
    {nombre: 'C5', texto: ' C5', siguiente: Tipos, ImgValue: 'ImgTroncoSpBlt'},
    {nombre: 'C6', texto: ' C6', siguiente: Tipos, ImgValue: 'ImgTroncoSpBlt'},
    {nombre: 'C7', texto: ' C7', siguiente: Tipos, ImgValue: 'ImgTroncoMdBlt'},
    {nombre: 'C8', texto: ' C8', siguiente: Tipos, ImgValue: 'ImgTroncoInBlt'},
    {nombre: 'T1', texto: ' T1', siguiente: Tipos, ImgValue: 'ImgTroncoInBlt'},
  ]
};

const DivisionesDrc = {
  titulo: 'Divisiones',
  seleccionMultiple: true,
  opciones: [
    {nombre: 'L2', texto: ' L2', siguiente: Tipos, ImgValue: 'LumbarDrc'},
    {nombre: 'L3', texto: ' L3', siguiente: Tipos, ImgValue: 'LumbarDrc'},
    {nombre: 'L4', texto: ' L4', siguiente: Tipos, ImgValue: 'TcLumbosDrc'},
    {nombre: 'L5', texto: ' L5', siguiente: Tipos, ImgValue: 'TcLumbosDrc'},
    {nombre: 'S1', texto: ' S1', siguiente: Tipos, ImgValue: 'SacroDrc'},
    {nombre: 'S2', texto: ' S2', siguiente: Tipos, ImgValue: 'SacroDrc'},
  ]
};

const DivisionesIqd = {
  titulo: 'Divisiones',
  seleccionMultiple: true,
  opciones: [
    {nombre: 'L2', texto: ' L2', siguiente: Tipos, ImgValue: 'LumbarIzq'},
    {nombre: 'L3', texto: ' L3', siguiente: Tipos, ImgValue: 'LumbarIzq'},
    {nombre: 'L4', texto: ' L4', siguiente: Tipos, ImgValue: 'TcLumbosIzq'},
    {nombre: 'L5', texto: ' L5', siguiente: Tipos, ImgValue: 'TcLumbosIzq'},
    {nombre: 'S1', texto: ' S1', siguiente: Tipos, ImgValue: 'SacroIzq'},
    {nombre: 'S2', texto: ' S2', siguiente: Tipos, ImgValue: 'SacroIzq'},
  ]
};

const Divisiones = {
  titulo: 'Divisiones',
  seleccionMultiple: true,
  opciones: [
    {nombre: 'L2', texto: ' L2', siguiente: Tipos, ImgValue: 'LumbarBlt'},
    {nombre: 'L3', texto: ' L3', siguiente: Tipos, ImgValue: 'LumbarBlt'},
    {nombre: 'L4', texto: ' L4', siguiente: Tipos, ImgValue: 'TcLumbosBlt'},
    {nombre: 'L5', texto: ' L5', siguiente: Tipos, ImgValue: 'TcLumbosBlt'},
    {nombre: 'S1', texto: ' S1', siguiente: Tipos, ImgValue: 'SacroBlt'},
    {nombre: 'S2', texto: ' S2', siguiente: Tipos, ImgValue: 'SacroBlt'},
  ]
};

const UbicacionCIqd = {
  titulo: 'Ubicacion',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Preganglionar total', texto: ' preganglionar total', siguiente: Tipos, ImgValue: 'LumbosacroIzq'},
    {nombre: 'Preganglionar parcial', texto: ' preganglionar parcial a nivel de', siguiente: DivisionesIqd},
    {nombre: 'Postganglionar total', texto: ' postganglionar total', siguiente: Tipos, ImgValue: 'LumbosacroIzq'},
    {nombre: 'Postganglionar parcial', texto: ' postganglionar parcial a nivel de', siguiente: PostganglionarParcialCIzq},
  ]
};

const UbicacionCDerc = {
  titulo: 'Ubicacion',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Preganglionar total', texto: ' preganglionar total', siguiente: Tipos, ImgValue: 'LumbosacroDrc'},
    {nombre: 'Preganglionar parcial', texto: ' preganglionar parcial a nivel de', siguiente: DivisionesDrc},
    {nombre: 'Postganglionar total', texto: ' postganglionar total', siguiente: Tipos, ImgValue: 'LumbosacroDrc'},
    {nombre: 'Postganglionar parcial', texto: ' postganglionar parcial a nivel de', siguiente: PostganglionarParcialCDrc},
  ]
};

const UbicacionC = {
  titulo: 'Ubicacion',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Preganglionar total', texto: ' preganglionar total', siguiente: Tipos, ImgValue: 'LumbosacroBlt'},
    {nombre: 'Preganglionar parcial', texto: ' preganglionar parcial a nivel de', siguiente: Divisiones},
    {nombre: 'Postganglionar total', texto: ' postganglionar total', siguiente: Tipos, ImgValue: 'LumbosacroBlt'},
    {nombre: 'Postganglionar parcial', texto: ' postganglionar parcial a nivel de', siguiente: PostganglionarParcialC},
  ]
};


const EvolucionCIqd = {
  titulo: 'Evolución',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Aguda', texto: ' aguda', siguiente: UbicacionCIqd},
    {nombre: 'Subaguda', texto: ' subaguda', siguiente: UbicacionCIqd},
    {nombre: 'Crónica', texto: ' crónica', siguiente: UbicacionCIqd},
  ]
};

const EvolucionCDerc = {
  titulo: 'Evolución',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Aguda', texto: ' aguda', siguiente: UbicacionCDerc},
    {nombre: 'Subaguda', texto: ' subaguda', siguiente: UbicacionCDerc},
    {nombre: 'Crónica', texto: ' crónica', siguiente: UbicacionCDerc},
  ]
};

const EvolucionCBlt = {
  titulo: 'Evolución',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Aguda', texto: ' aguda', siguiente: UbicacionC},
    {nombre: 'Subaguda', texto: ' subaguda', siguiente: UbicacionC},
    {nombre: 'Crónica', texto: ' crónica', siguiente: UbicacionC},
  ]
};

const LadoC = {
  titulo: 'Lado',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Izquierdo', texto: ' izquierda,', siguiente: EvolucionCIqd},
    {nombre: 'Derecho' , texto: ' derecha,', siguiente: EvolucionCDerc},
    {nombre: 'Bilateral' , texto: ' bilateral,', siguiente: EvolucionCBlt},
  ]
};

const UbicacionBIzq = {
  titulo: 'Ubicacion',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Preganglionar total', textoLista: 'Ubicación: Preganglionar total a nivel', texto: ' preganglionar total', siguiente: Tipos, ImgValue: 'TroncosIzq'},
    {nombre: 'Preganglionar parcial', textoLista:'Ubicación: Preganglionar parcial a nivel de', texto: ' preganglionar parcial a nivel de', siguiente: PreganglionarParcialIzq},
    {nombre: 'Postganglionar total', textoLista: 'Ubicación: Postganglionar total a nivel de', texto: ' postganglionar total a nivel de', siguiente: PostganglionartotalIzq},
    {nombre: 'Postganglionar parcial', textoLista: 'Ubicación: Postganglionar parcial a nivel de', texto: ' postganglionar parcial a nivel de', siguiente: PostganglionarParcialIzq},
    {nombre: 'Salida torácica', texto: '  a nivel de salida torácica', siguiente: Tipos, ImgValue: 'ImgTroncoInIzq'},
  ]
};

const UbicacionBDerc = {
  titulo: 'Ubicacion',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Preganglionar total', textoLista: 'Ubicación: Preganglionar total a nivel', texto: ' preganglionar total', siguiente: Tipos, ImgValue: 'TroncosDrc'},
    {nombre: 'Preganglionar parcial', textoLista:'Ubicación: Preganglionar parcial a nivel de', texto: ' preganglionar parcial a nivel de', siguiente: PreganglionarParcialDrc},
    {nombre: 'Postganglionar total', textoLista: 'Ubicación: Postganglionar total a nivel de', texto: ' postganglionar total a nivel de', siguiente: PostganglionartotalDrc},
    {nombre: 'Postganglionar parcial', textoLista: 'Ubicación: Postganglionar parcial a nivel de', texto: ' postganglionar parcial a nivel de', siguiente: PostganglionarParcialDrc},
    {nombre: 'Salida torácica', texto: '  a nivel de salida torácica', siguiente: Tipos, ImgValue: 'ImgTroncoInDrc'},
  ]
};

const UbicacionB = {
  titulo: 'Ubicacion',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Preganglionar total', textoLista: 'Ubicación: Preganglionar total a nivel', texto: ' preganglionar total', siguiente: Tipos, ImgValue: 'TroncosBlt'},
    {nombre: 'Preganglionar parcial', textoLista :'Ubicación: Preganglionar parcial a nivel de', texto: ' preganglionar parcial a nivel de', siguiente: PreganglionarParcial},
    {nombre: 'Postganglionar total', textoLista: 'Ubicación: Postganglionar total a nivel de', texto: ' postganglionar total a nivel de', siguiente: Postganglionartotal},
    {nombre: 'Postganglionar parcial', textoLista: 'Ubicación: Postganglionar parcial a nivel de', texto: ' postganglionar parcial a nivel de', siguiente: PostganglionarParcial},
    {nombre: 'Salida torácica', texto: '  a nivel de salida torácica', siguiente: Tipos, ImgValue: 'ImgTroncoInBlt'},
  ]
};

const EvolucionBDerc = {
  titulo: 'Evolución',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Aguda', texto: ' aguda', siguiente: UbicacionBDerc},
    {nombre: 'Subaguda', texto: ' subaguda', siguiente: UbicacionBDerc},
    {nombre: 'Crónica', texto: ' crónica', siguiente: UbicacionBDerc},
  ]
};

const EvolucionBIqd = {
  titulo: 'Evolución',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Aguda', texto: ' aguda', siguiente: UbicacionBIzq},
    {nombre: 'Subaguda', texto: ' subaguda', siguiente: UbicacionBIzq},
    {nombre: 'Crónica', texto: ' crónica', siguiente: UbicacionBIzq},
  ]
};

const EvolucionBlt = {
  titulo: 'Evolución',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Aguda', texto: ' aguda', siguiente: UbicacionB},
    {nombre: 'Subaguda', texto: ' subaguda', siguiente: UbicacionB},
    {nombre: 'Crónica', texto: ' crónica', siguiente: UbicacionB},
  ]
};

const LadoB = {
  titulo: 'Lado',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Izquierdo', texto: ' izquierda,', siguiente: EvolucionBIqd},
    {nombre: 'Derecho', texto: ' derecha,', siguiente: EvolucionBDerc},
    {nombre: 'Bilateral', texto: ' bilateral,', siguiente: EvolucionBlt},
  ]
};

const Evolucion = {
  titulo: 'Evolución',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Aguda', texto: ' aguda', siguiente: Tipos},
    {nombre: 'Subaguda', texto: ' subaguda', siguiente: Tipos},
    {nombre: 'Crónica', texto: ' crónica', siguiente: Tipos},


  ]
};

const Lado = {
  titulo: 'Lado',
  seleccionMultiple: false,
  opciones: [
    {nombre: 'Izquierdo', texto: ' izquierda,', siguiente: Evolucion, ImgValue: 'IzquierdoIMG'},
    {nombre: 'Derecho' , texto: ' derecha,', siguiente: Evolucion, ImgValue: 'DerechoIMG'},
    {nombre: 'Bilateral' , texto: ' bilateral,', siguiente: Evolucion, ImgValue: ['BilateralIMG']},
  ]
};



const estructuraJerarquica: Jerarquia = {
  titulo: 'Plexo',
  seleccionMultiple: false,
  opciones: [
    {
      nombre: 'Cervical', texto: 'Plexopatía cervical',
      siguiente: Lado,
    },

    {
      nombre: 'Braquial', texto: 'Plexopatía braquial',
      siguiente: LadoB,

    },
        {
      nombre: 'Lumbosacro', texto: 'Plexopatía lumbosacra',
      siguiente: LadoC,
    },
  ],
};

const zonasOverlay = {
  'IzquierdoIMG': { top: 10, height: 60 },
  'DerechoIMG': { top: 10, height: 60 },
  'BilateralIMG': { top: 10, height: 60 },
  'ImgTroncosDrc': { top: 10, height: 60 },
  'ImgTroncosIzq': { top: 10, height: 60 },
  'ImgTroncoMdDrc': { top: 10, height: 60 },
  'ImgTroncoMdIzq': { top: 10, height: 60 },
  'ImgTroncoInDrc': { top: 10, height: 60 },
  'ImgTroncoInIzq': { top: 10, height: 60 },
  'ImgTroncoSpBlt': { top: 10, height: 60 },
  'ImgTroncoMdBlt': { top: 10, height: 60 },
  'ImgTroncoInBlt': { top: 10, height: 60 },
  'TroncosDrc': { top: 10, height: 60 },
  'TroncosIzq': { top: 10, height: 60 },
  'TroncosBlt': { top: 10, height: 60 },
  'CordonesDrc': { top: 10, height: 60 },
  'CordonesIzq': { top: 10, height: 60 },
  'CordonesBlt': { top: 10, height: 60 },

  'CordonLtD': { top: 10, height: 60 },
  'CordonMdD': { top: 10, height: 60 },
  'CordonPsD': { top: 10, height: 60 },
  'CordonLtIzq': { top: 10, height: 60 },
  'CordonMdIzq': { top: 10, height: 60 },
  'CordonPsIzq': { top: 10, height: 60 },
  'CordonLtBlt': { top: 10, height: 60 },
  'CordonMdBlt': { top: 10, height: 60 },
  'CordonPsBlt': { top: 10, height: 60 },
  'LumbosacroDrc': { top: 10, height: 60 },
  'LumbosacroIzq': { top: 10, height: 60 },
  'LumbosacroBlt': { top: 10, height: 60 },
  'LumbarDrc': { top: 10, height: 60 },
  'LumbarIzq': { top: 10, height: 60 },
  'LumbarBlt': { top: 10, height: 60 },
  'TcLumbosDrc': { top: 10, height: 60 },
  'TcLumbosIzq': { top: 10, height: 60 },
  'TcLumbosBlt': { top: 10, height: 60 },
  'SacroDrc': { top: 10, height: 60 },
  'SacroIzq': { top: 10, height: 60 },
  'SacroBlt': { top: 10, height: 60 },
  'IliohipoDrc': { top: 10, height: 60 },
  'IliohipoIzq': { top: 10, height: 60 },
  'IliohipoBlt': { top: 10, height: 60 },
  'FemoroDrc': { top: 10, height: 60 },
  'FemoroIzq': { top: 10, height: 60 },
  'FemoroBlt': { top: 10, height: 60 },
  'PudendoDrc': { top: 10, height: 60 },
  'PudendoIzq': { top: 10, height: 60 },
  'PudendoBlt': { top: 10, height: 60 },
};

const imagenesOverlay: Record<string, any> = {

  'IzquierdoIMG': require('../../../assets/CuerpoPng/PlexoImg/PlcervicalIZQ.png'),
  'DerechoIMG': require('../../../assets/CuerpoPng/PlexoImg/PlCervicalDec.png'),
  /*'BilateralIMG': [
    require('../../../assets/CuerpoPng/PlexoImg/PlcervicalIZQ.png'),
    require('../../../assets/CuerpoPng/PlexoImg/PlCervicalDec.png'),
  ],*/
  'BilateralIMG': ['IzquierdoIMG', 'DerechoIMG'],

  'ImgTroncosDrc': require('../../../assets/CuerpoPng/PlexoImg/TroncoSpD.png'),
  'ImgTroncosIzq': require('../../../assets/CuerpoPng/PlexoImg/TroncoSpIzq.png'),
  'ImgTroncoMdDrc': require('../../../assets/CuerpoPng/PlexoImg/TroncoMdD.png'),
  'ImgTroncoMdIzq': require('../../../assets/CuerpoPng/PlexoImg/TroncoMdIzq.png'),
  'ImgTroncoInDrc': require('../../../assets/CuerpoPng/PlexoImg/TroncoInD.png'),
  'ImgTroncoInIzq': require('../../../assets/CuerpoPng/PlexoImg/TroncoInIzq.png'),

  'ImgTroncoSpBlt': require('../../../assets/CuerpoPng/PlexoImg/TroncoSpBl.png'),
  'ImgTroncoMdBlt': require('../../../assets/CuerpoPng/PlexoImg/TroncoMdBl.png'),
  'ImgTroncoInBlt': require('../../../assets/CuerpoPng/PlexoImg/TroncoInBl.png'),

  /*'TroncosDrc':[
    require('../../../assets/CuerpoPng/PlexoImg/TroncoSpD.png'), require('../../../assets/CuerpoPng/PlexoImg/TroncoMdD.png'), require('../../../assets/CuerpoPng/PlexoImg/TroncoInD.png'),
  ] ,*/
  'TroncosDrc': ['ImgTroncosDrc', 'ImgTroncoMdDrc', 'ImgTroncoInDrc'],

  /*'TroncosIzq': [ require('../../../assets/CuerpoPng/PlexoImg/TroncoSpIzq.png'), require('../../../assets/CuerpoPng/PlexoImg/TroncoMdIzq.png'), require('../../../assets/CuerpoPng/PlexoImg/TroncoInIzq.png'),
  ],*/
  'TroncosIzq': ['ImgTroncosIzq', 'ImgTroncoMdIzq', 'ImgTroncoInIzq'],

  /*'TroncosBlt': [require('../../../assets/CuerpoPng/PlexoImg/TroncoSpBl.png'), require('../../../assets/CuerpoPng/PlexoImg/TroncoMdBl.png'), require('../../../assets/CuerpoPng/PlexoImg/TroncoInBl.png'),],*/
  'TroncosBlt': ['ImgTroncoSpBlt', 'ImgTroncoMdBlt', 'ImgTroncoInBlt'],

  /*'CordonesDrc':[require('../../../assets/CuerpoPng/PlexoImg/CordonLtD.png'), require('../../../assets/CuerpoPng/PlexoImg/CordonMdD.png'), require('../../../assets/CuerpoPng/PlexoImg/CordonPsD.png'),],*/
  'CordonesDrc':['CordonLtD', 'CordonMdD', 'CordonPsD'],
  /*'CordonesIzq':[require('../../../assets/CuerpoPng/PlexoImg/CordonLtIzq.png'), require('../../../assets/CuerpoPng/PlexoImg/CordonMdIzq.png'), require('../../../assets/CuerpoPng/PlexoImg/CordonPsIzq.png'),],*/
  'CordonesIzq':['CordonLtIzq', 'CordonMdIzq', 'CordonPsIzq'],
  /*'CordonesBlt':[require('../../../assets/CuerpoPng/PlexoImg/CordonLtBlt.png'), require('../../../assets/CuerpoPng/PlexoImg/CordonMdBlt.png'), require('../../../assets/CuerpoPng/PlexoImg/CordonPsBlt.png'),],*/
  'CordonesBlt':['CordonLtBlt', 'CordonMdBlt', 'CordonPsBlt'],

  'CordonLtD': require('../../../assets/CuerpoPng/PlexoImg/CordonLtD.png'),
  'CordonMdD': require('../../../assets/CuerpoPng/PlexoImg/CordonMdD.png'),
  'CordonPsD': require('../../../assets/CuerpoPng/PlexoImg/CordonPsD.png'),
  'CordonLtIzq': require('../../../assets/CuerpoPng/PlexoImg/CordonLtIzq.png'),
  'CordonMdIzq': require('../../../assets/CuerpoPng/PlexoImg/CordonMdIzq.png'),
  'CordonPsIzq': require('../../../assets/CuerpoPng/PlexoImg/CordonPsIzq.png'),
  'CordonLtBlt': require('../../../assets/CuerpoPng/PlexoImg/CordonLtBlt.png'),
  'CordonMdBlt': require('../../../assets/CuerpoPng/PlexoImg/CordonMdBlt.png'),
  'CordonPsBlt': require('../../../assets/CuerpoPng/PlexoImg/CordonPsBlt.png'),

  'LumbosacroDrc': require('../../../assets/CuerpoPng/PlexoImg/LumbosacroD.png'),
  'LumbosacroIzq': require('../../../assets/CuerpoPng/PlexoImg/LumbosacroIzq.png'),
  'LumbosacroBlt': require('../../../assets/CuerpoPng/PlexoImg/LumbosacroBlt.png'),

  'LumbarDrc': require('../../../assets/CuerpoPng/PlexoImg/PxLumbarD.png'),
  'LumbarIzq': require('../../../assets/CuerpoPng/PlexoImg/PxLumbarIzq.png'),
  'LumbarBlt': require('../../../assets/CuerpoPng/PlexoImg/LumbarBlt.png'),

  'TcLumbosDrc': require('../../../assets/CuerpoPng/PlexoImg/TcLumbosacroD.png'),
  'TcLumbosIzq': require('../../../assets/CuerpoPng/PlexoImg/TcLumbosacroIzq.png'),
  'TcLumbosBlt': require('../../../assets/CuerpoPng/PlexoImg/TcLumbosacroBlt.png'),

  'SacroDrc': require('../../../assets/CuerpoPng/PlexoImg/SacroD.png'),
  'SacroIzq': require('../../../assets/CuerpoPng/PlexoImg/SacroIzq.png'),
  'SacroBlt': require('../../../assets/CuerpoPng/PlexoImg/SacroBlt.png'),

  'IliohipoDrc': require('../../../assets/CuerpoPng/PlexoImg/IliohipoD.png'),
  'IliohipoIzq': require('../../../assets/CuerpoPng/PlexoImg/IliohipoIzq.png'),
  'IliohipoBlt': require('../../../assets/CuerpoPng/PlexoImg/IliohipoBlt.png'),

  'FemoroDrc': require('../../../assets/CuerpoPng/PlexoImg/FemoroD.png'),
  'FemoroIzq': require('../../../assets/CuerpoPng/PlexoImg/FemoroIzq.png'),
  'FemoroBlt': require('../../../assets/CuerpoPng/PlexoImg/FemoroBlt.png'),

  'PudendoDrc': require('../../../assets/CuerpoPng/PlexoImg/PudendoD.png'),
  'PudendoIzq': require('../../../assets/CuerpoPng/PlexoImg/PudendoIzq.png'),
  /*'PudendoBlt':[require('../../../assets/CuerpoPng/PlexoImg/PudendoD.png'), require('../../../assets/CuerpoPng/PlexoImg/PudendoIzq.png'),], */
  'PudendoBlt': ['PudendoDrc', 'PudendoIzq'],
};


function ReporteScreen(): React.JSX.Element {
   const leftCanvasRef = useRef<View>(null);     // contenedor visible de la lámina
    const [shot, setShot] = useState<string|null>(null); // base64 de la captura
  const [ruta, setRuta] = useState([estructuraJerarquica]);
  const [seleccionMultiple, setSeleccionMultiple] = useState<string[]>([]);
  const [resumen, setResumen] = useState<string[]>([]);
  //const [figuraActiva, setFiguraActiva] = useState<'circle' | 'square' | null>(null);
  //const [imagenFigura, setImagenFigura] = useState<string | null>(null);
  const [figuras, setFiguras] = useState<Figura[]>([]);
  const scrollPrincipalRef = useRef<ScrollView>(null);
  const [mostrarMiniatura, setMostrarMiniatura] = useState(false);
  const [distribucionFinalizada, setDistribucionFinalizada] = useState(false);
  const [nombrePaciente, setNombrePaciente] = useState('');
  const [resumenTextoLargo, setResumenTextoLargo] = useState<string[]>([]);
  const nivelActual = ruta[ruta.length - 1];
  const tituloActual = (nivelActual?.titulo || '').trim();
  const esPasoMultiple = !!nivelActual?.seleccionMultiple;
  const esOpcional = /Opcional/i.test(tituloActual || '');
  const requiereMinimoUno = esPasoMultiple && !esOpcional;
  const puedeContinuar = esOpcional || !requiereMinimoUno || (seleccionMultiple.length > 0);
  const textoReporte = resumenTextoLargo.join(' ');

  /** === Nombres bonitos y consistentes () === */
const STUDY_KEY = 'Plexopatia';                 // sin acentos
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


// Nombre coherente de archivo
const reportFileName = () => {
  const base = buildBaseName(nombrePaciente);
  return `${base}.pdf`; // mEDXproMiopatia_<...>.pdf
};


// Valores por defecto del uploader

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
  const studyType  = 'Plexopatía';
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

// Texto del botón naranja
const textoBotonNaranja = esOpcional ? 'Saltar ➔' : 'Siguiente ➔';


  const [limitesContenedor, setLimitesContenedor] = useState({ width: 0, height: 0 });

  const [isHorizontal, setIsHorizontal] = useState(false);
  const [isCargaCerrar, setIsCargaCerrar] = useState(false);
  const [mostrarGaleria, setMostrarGaleria] = useState(false);
  const [imgListaSrc, setImgListaSrc] = useState<ImageSourcePropType | null>(null);
  const [comentarioLista, setComentarioLista] = useState('');
  const [comentarioHeight, setComentarioHeight] = useState(MIN_COMENTARIO_HEIGHT);
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
                    // require(...)
                    // @ts-ignore
                    const r = Image.resolveAssetSource(src);
                    if (r?.width && r?.height) setImgListaAR(r.width / r.height);
                    else setImgListaAR(null);
                  }
                } catch { setImgListaAR(null); }
                setActiveTab('lista');
                setMostrarGaleria(false);
              };

  useEffect(() => {
    if (comentarioLista.length === 0) {
      setComentarioHeight(MIN_COMENTARIO_HEIGHT);
    }
  }, [comentarioLista]);

  const exportRef = useRef<View>(null);
          const exportRef2 = useRef<View>(null);
          const [exporting, setExporting] = useState(false);
          const [exportKind, setExportKind] = useState<'pdf'|'jpeg'|null>(null);
          const [plantillaId, setPlantillaId] = useState<PlantillaId>('none');
          const exportBgColor = plantillaId === 'none' ? '#fff' : 'transparent';
          const [templatePickerVisible, setTemplatePickerVisible] = useState(false);
          const [templatePickerIntent, setTemplatePickerIntent] = useState<'export' | 'link' | null>(null);
          const templatePickerPromiseRef = useRef<((id: PlantillaId | null) => void) | null>(null);
          const [pendingTemplateExport, setPendingTemplateExport] = useState<PlantillaId | null>(null);
          const [exportSuccess, setExportSuccess] = useState<{ filename: string; path: string } | null>(null);
          const [exportKey, setExportKey] = useState(0);
          const exportarPdfRef = useRef<() => Promise<void>>(async () => {});
          const plantillaDef = React.useMemo(
            () => (plantillaId === 'none' ? null : PLANTILLAS_PDF[plantillaId]),
            [plantillaId],
          );

          const prepareShot = async () => {
  if (!leftCanvasRef.current) return;
  await flushBeforeCapture(); // ya la tienes definida
  const b64 = await captureRef(leftCanvasRef.current, {
    format: 'png',
    quality: 1,
    result: 'base64',
  });
  setShot(b64);
  // espera un frame para que el hidden export page la pinte
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
  await new Promise<void>((r) => setTimeout(r, 30));
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

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setMostrarMiniatura(offsetY > 200); // Solo mostrar miniatura si scroll bajó más de 200px
  };
    // si src es string -> { uri: string } ; si es require(...) -> tal cual
      const toImageSource = (src: string | ImageSourcePropType): ImageSourcePropType =>
        typeof src === 'string' ? { uri: src } : src;
  const pedirPermiso = async(): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const permisos: Permission[] = [
          PermissionsAndroid.PERMISSIONS.CAMERA,
          Platform.Version >= 33
            ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
            : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        ];
        // Cámara
        //permisos.push(PermissionsAndroid.PERMISSIONS.CAMERA);

        // Android 13+
        if (Platform.Version >= 33) {
          permisos.push(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
        } else {
          permisos.push(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
        }

        const granted = await PermissionsAndroid.requestMultiple(permisos);
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
      // iOS: puede manejarse con react-native-permissions si lo necesitas
      return true;
    }
  };

  /* ====== EXPORT ====== */
  const [pdfCfg] = useState<PdfConfig>(DEFAULT_PDF);
  const PT = { A4: { W: 595, H: 842 }, Letter: { W: 612, H: 792 } };
  const base = PT[pdfCfg.paper] || PT.A4;
  const Wpt = pdfCfg.orientation === 'portrait' ? base.W : base.H;
  const Hpt = pdfCfg.orientation === 'portrait' ? base.H : base.W;
  const s = pdfCfg.renderScale;
  const px = (n: number) => Math.round(n * s);
  const pageWpx = px(Wpt);
  const pageHpx = px(Hpt);
  const pad = px(pdfCfg.pageMargin);
  const innerW = pageWpx - pad * 2;
  const innerH = pageHpx - pad * 2;
  const headerHpx = px(pdfCfg.header.height);
  const footerHpx = px(pdfCfg.footer.height);
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
 

const flushBeforeCapture = async () => {
    Keyboard.dismiss();
    if (userData?.imageUrl) { try { await Image.prefetch(userData.imageUrl); } catch {} }
    await new Promise<void>(r => InteractionManager.runAfterInteractions(() => r()));
    await new Promise<void>(r => requestAnimationFrame(() => r()));
    await new Promise<void>(r => setTimeout(r, 30));
  };
const capturePages = async (format: 'png' | 'jpg') => {
  if (!exportRef.current) throw new Error('El lienzo no está listo');
  await flushBeforeCapture();
  const quality = format === 'jpg' ? 0.95 : 1;
  const bg = plantillaId === 'none' ? '#ffffff' : 'transparent';
  const base_opts = { format, quality, result: 'base64' as const };
  const opts = format === 'png' ? { ...base_opts, backgroundColor: bg } : base_opts;

  const p1 = await captureRef(exportRef.current, opts);
  let p2: string | null = null;
  if (exportRef2?.current) {
    p2 = await captureRef(exportRef2.current, opts);
  }
  return { p1, p2 };
};

 
  /*const loadPlantillaPdf = async (plantillaSrc: any): Promise<Uint8Array | null> => {
    try {
      const resolved = Image.resolveAssetSource(plantillaSrc);
      if (!resolved?.uri) {
        console.warn('[Plexopatia] No se pudo resolver la plantilla PDF');
        return null;
      }

      const response = await fetch(resolved.uri);
      if (!response.ok) {
        console.warn('[Plexopatia] Falló la carga de la plantilla PDF', response.status);
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (error) {
      console.error('[Plexopatia] Error al cargar plantilla PDF:', error);
      return null;
    }
  };

  const buildReportPdfArrayBuffer = async ({
  studyType,
  doctorName,
  templateId,
}: { studyType: string; doctorName?: string; templateId?: PlantillaId | null; }): Promise<ArrayBuffer> => {
  const { p1, p2 } = await capturePages('png');

  const desiredId =
    templateId && templateId !== 'none' ? templateId : plantillaId;

  const plantillaForBuild =
    desiredId && desiredId !== 'none'
      ? PLANTILLAS_PDF[desiredId as Exclude<PlantillaId, 'none'>]
      : null;

  let pdfDoc: PDFDocument;

  const drawImageFullPage = (page: any, image: any) => {
    const { width, height } = page.getSize?.() ?? { width: Wpt, height: Hpt };
    page.drawImage(image, { x: 0, y: 0, width, height });
  };

  if (plantillaForBuild) {
    const plantillaPdf1 = await loadPlantillaPdf(plantillaForBuild.src1);

    if (plantillaPdf1) {
      pdfDoc = await PDFDocument.load(plantillaPdf1);
      const [templatePage1] = pdfDoc.getPages();
      const img1 = await pdfDoc.embedPng(p1);
      drawImageFullPage(templatePage1, img1);

      if (p2) {
        let handledPage2 = false;

        if (plantillaForBuild.src2) {
          const plantillaPdf2 = await loadPlantillaPdf(plantillaForBuild.src2);
          if (plantillaPdf2) {
            const templateDoc2 = await PDFDocument.load(plantillaPdf2);
            const [copiedPage] = await pdfDoc.copyPages(templateDoc2, [0]);
            pdfDoc.addPage(copiedPage);
            const templatePage2 = pdfDoc.getPages()[1];
            const img2 = await pdfDoc.embedPng(p2);
            drawImageFullPage(templatePage2, img2);
            handledPage2 = true;
          }
        }

        if (!handledPage2) {
          const page2 = pdfDoc.addPage([Wpt, Hpt]);
          const img2 = await pdfDoc.embedPng(p2);
          drawImageFullPage(page2, img2);
        }
      }
    } else {
      pdfDoc = await PDFDocument.create();
      const page1 = pdfDoc.addPage([Wpt, Hpt]);
      const img1 = await pdfDoc.embedPng(p1);
      drawImageFullPage(page1, img1);

      if (p2) {
        const page2 = pdfDoc.addPage([Wpt, Hpt]);
        const img2 = await pdfDoc.embedPng(p2);
        drawImageFullPage(page2, img2);
      }
    }
  } else {
    pdfDoc = await PDFDocument.create();
    const page1 = pdfDoc.addPage([Wpt, Hpt]);
    const img1 = await pdfDoc.embedPng(p1);
    drawImageFullPage(page1, img1);

    if (p2) {
      const page2 = pdfDoc.addPage([Wpt, Hpt]);
      const img2 = await pdfDoc.embedPng(p2);
      drawImageFullPage(page2, img2);
    }
  }

  try { pdfDoc.setTitle?.(`Reporte ${studyType} – ${nombrePaciente || 'Paciente'}`); } catch {}
  try { if (doctorName) pdfDoc.setAuthor?.(doctorName); } catch {}
  try { pdfDoc.setSubject?.(studyType); } catch {}
  try { pdfDoc.setCreationDate?.(new Date()); } catch {}

  const u8 = await pdfDoc.save();
  const ab = new ArrayBuffer(u8.byteLength);
  new Uint8Array(ab).set(u8);
  return ab;
};*/

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

  const handleExport = () => {
    Alert.alert(
      'Exportar',
      '¿En qué formato deseas exportar?',
      [
        { text: 'PDF', onPress: exportarPDF },
        { text: 'Cancelar', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };
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
      await new Promise<void>(r => requestAnimationFrame(() => r()));
      await new Promise<void>(r => setTimeout(r, 30));

      const studyType = 'Plexopatía';
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
        try { await RNBU.fs.cp(tmpPath, outPath); }
        catch { await RNBU.fs.writeFile(outPath, base64Pdf, 'base64'); }
        await RNBU.fs.scanFile([{ path: outPath, mime: 'application/pdf' }]);
        RNBU.android?.addCompleteDownload?.({
          title: filename, description: 'Reporte descargado', mime: 'application/pdf',
          path: outPath, showNotification: true,
        });
      } else {
        outPath = `${RNBU.fs.dirs.DocumentDir}/${filename}`;
        await RNBU.fs.writeFile(outPath, base64Pdf, 'base64');
      }
      setExportSuccess({ filename, path: outPath });
    } catch (e: any) {
      Alert.alert('Error', `No se pudo exportar el PDF.\n\n${e?.message ?? e}`);
    } finally {
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

  /* ====== Canvas para export ====== */
  const CanvasView: React.FC<{ w: number; h: number; transparentBg?: boolean }> = ({ w, h, transparentBg = false }) => {
    //const sx = limitesContenedor.width ? w / limitesContenedor.width : 1;
    //const sy = limitesContenedor.height ? h / limitesContenedor.height : 1;
    //const figBase = 56;
    const size = { w, h };

    // límites de la lámina visible
    const vw = limitesContenedor.width || 1;
    const vh = limitesContenedor.height || 1;

    // escalas pantalla -> export
    const kx = size.w / vw;
    const ky = size.h / vh;
    const k  = Math.min(kx, ky);
    const ox = (size.w - vw * k) / 2;
    const oy = (size.h - vh * k) / 2;

    const figBaseCircle = 55;
    const figBaseSquare = 55;
    const figBorderPx = 1.2;
    const figBorderColor = '#808080';

    const baseImage = transparentBg ? IMG_BASE_TRANSPARENT : imagenCuerpo;

    return (
      <View style={{ width: size.w, height: size.h, position: 'relative', overflow: 'hidden', backgroundColor: 'transparent',}} collapsable={false}>
        <Image source={baseImage} style={{ position: 'absolute', top:0, left:0, width: size.w, height: size.h }} resizeMode="contain" />
        {/* Overlays */}
        {zonasSeleccionadas.map((zona, idx) => {
          const src = imagenesOverlay[zona];
          if (!src) return null;

          // Si es un array de imágenes, renderizar cada una
          if (Array.isArray(src)) {
            return src.map((img, subIdx) => (
              <Image
                key={`ov_${zona}_${idx}_${subIdx}`}
                source={img}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: size.w,
                  height: size.h,
                }}
                resizeMode="contain"
              />
            ));
          }

          // Imagen única
          return (
            <Image
              key={`ov_${zona}_${idx}`}
              source={src}
              style={{ position: 'absolute', top:0, left:0, width: size.w, height: size.h, }}
              resizeMode="contain"
            />
          );
        })}
        {/* Figuras */}
        {figuras.map((f) => {
          const baseSize = f.tipo === 'circle' ? figBaseCircle : figBaseSquare;
          const side = baseSize * k;
          const br = f.tipo === 'circle' ? side / 2 : 0;
          const borderWidth = Math.max(0.6, figBorderPx * k);
          const left = ox + f.posicion.x * k;
          const top = oy + f.posicion.y * k;

          return (
            <View
              key={`fig_${f.id}`}
              style={{
                position: 'absolute',
                left,
                top,
                width: side,
                height: side,
                borderRadius: br,
                overflow: 'hidden',
                backgroundColor: 'transparent',
              }}
            >
              {/* Imagen de la figura */}
              <Image
                source={{ uri: f.uri }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />

              {/* Borde gris encima (queda en el PDF) */}
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: 0, top: 0, right: 0, bottom: 0,
                  borderWidth,
                  borderColor: figBorderColor,
                  borderRadius: br,
                  borderStyle: 'solid',
                }}
              />
            </View>
          );
        })}
      </View>
    );
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
                /*launchCamera({ mediaType: 'photo', quality: 1 }, (res) => {
                  if (res.didCancel) {
                    console.log('El usuario canceló la cámara.');
                    return;
                  }
                  if (res.errorCode) {
                    console.error('Error al tomar foto:', res.errorMessage);
                    return;
                  }

                  if (res.assets?.length && res.assets[0].uri) {
                    agregarFigura(tipo, res.assets[0].uri);
                  }
                });*/
              },
          },
          {
            text: 'Seleccionar de la galería',
            onPress: async () => {
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
  // Tamaño base de las figuras (debe coincidir con FiguraMovible: 55px)
  const figuraSize = 55;

  // Calcular posición central del contenedor
  const centerX = (limitesContenedor.width / 2) - (figuraSize / 2);
  const centerY = (limitesContenedor.height / 2) - (figuraSize / 2);

  const nuevaFigura = {
    id: uuid.v4(),
    tipo,
    uri,
    posicion: {
      x: centerX > 0 ? centerX : 0,  // ✅ Valida que no sea negativo
      y: centerY > 0 ? centerY : 0   // ✅ Valida que no sea negativo
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
      // Si la segunda palabra empieza con "i" o "I", usar "e"
      const conj = arr[1].trim().toLowerCase().startsWith('i') ? ' e ' : ' y ';
      return arr[0] + conj + arr[1];
    }
    // Para más de dos elementos, revisar la última palabra
    const last = arr[arr.length - 1];
    const conj = last.trim().toLowerCase().startsWith('i') ? ' e ' : ' y ';
    return arr.slice(0, -1).join(', ') + conj + last;
  }
  useEffect(() => {
    const marcador = nivelActual.titulo === 'Tronco' ? 'tronco' : nivelActual.titulo === 'Cordones' ? 'cordón' : null;
  
    if (!marcador) return;
  
    setResumenTextoLargo((prev) => {
      const yaExiste = prev.some(item => item.trim().toLowerCase() === marcador);
      const sinMarcador = prev.filter(item => item.trim().toLowerCase() !== marcador);
  
      if (seleccionMultiple.length === 0) {
        // Si no hay selección y no existe aún el marcador, lo agregamos
        return yaExiste ? prev : [...prev, marcador];
      } else {
        // Si hay selección, nos aseguramos de remover el marcador si estaba
        return sinMarcador;
      }
    });
  }, [nivelActual, seleccionMultiple]);
  
  
  const actualizarResumenLargo = ( opcion: any) => {
    const indexExistente = resumen.findIndex(entry =>
      entry.startsWith(`${nivelActual.titulo}:`)
    );
    let nuevaEntradaTexto = opcion.texto || '';
    let actualizadoTexto = [...resumenTextoLargo];
    if (indexExistente !== -1) {
      actualizadoTexto[indexExistente] = nuevaEntradaTexto;
    } else {
      actualizadoTexto.push(nuevaEntradaTexto);
    }
    setResumenTextoLargo(actualizadoTexto);
  };

  const avanzarNivel = (opcion: any) => {
    if (nivelActual.seleccionMultiple) {
      setSeleccionMultiple((prev) => {
        const nuevo = prev.includes(opcion.nombre)
          ? prev.filter((nombre) => nombre !== opcion.nombre)
          : [...prev, opcion.nombre];

        // --- AGREGAR O QUITAR IMAGENES PARA MULTISELECT ---
        const imgKey = opcion.ImgValue || opcion.nombre;
        setZonasFijas((prevZonas) => {
          if (imagenesOverlay[imgKey]) {
            if (prev.includes(opcion.nombre)) {
              // Si se deselecciona, quitar la imagen
              return prevZonas.filter(z => z !== imgKey);
            } else {
              // Si se selecciona, agregar la imagen si no está
              if (!prevZonas.includes(imgKey)) {
                return [...prevZonas, imgKey];
              }
            }
          }
          return prevZonas;
        });
        // ---------------------------------------------------
            // --- 🚀 Caso especial Tronco ---
        if (['Tronco', 'Cordones', 'Preganglionar parcial', 'Divisiones'].includes(nivelActual.titulo)) {
          const ubicacionIdx = resumen.findIndex(r => r.startsWith('Ubicación:'));
          if (ubicacionIdx !== -1) {
            let opcionesTxt = joinConY(nuevo.map(n => n.toLowerCase()));
            let opcionesTxtM = joinConY(nuevo.map(n => n.toUpperCase()));
            let actualizado = [...resumen];
            if (nivelActual.titulo === 'Tronco') {
              const troncoTexto = nuevo.length === 1 ? `a nivel de tronco ${opcionesTxt}` : `a nivel de troncos ${opcionesTxt}`;
              actualizado[ubicacionIdx] =
              resumen[ubicacionIdx].replace(/a nivel de troncos?.*/i, troncoTexto);
            } else if (nivelActual.titulo === 'Cordones') {
              const cordonTexto = nuevo.length === 1 ? `a nivel de cordón ${opcionesTxt}` : `a nivel de cordones ${opcionesTxt}`;
              actualizado[ubicacionIdx] =
              resumen[ubicacionIdx].replace(/a nivel de cordones.*/i, cordonTexto);
            }else if (nivelActual.titulo === 'Preganglionar parcial') {
              if (/a nivel de.*/i.test(actualizado[ubicacionIdx])) {
                actualizado[ubicacionIdx] = actualizado[ubicacionIdx]
                  .replace(/a nivel de.*/i, `a nivel de ${opcionesTxtM}`);
              } else {
                actualizado[ubicacionIdx] += ` a nivel de ${opcionesTxtM}`;
              }
            }else {
              if (/a nivel de.*/i.test(actualizado[ubicacionIdx])) {
                actualizado[ubicacionIdx] = actualizado[ubicacionIdx]
                  .replace(/a nivel de.*/i, `a nivel de ${opcionesTxtM}`);
              } else {
                actualizado[ubicacionIdx] += ` a nivel de ${opcionesTxtM}`;
              }
            }
            setResumen(actualizado);

            setResumenTextoLargo((prevTextoLargo) => {
              const contieneOpciones = (txt: string) => {
                if (nivelActual.titulo === 'Tronco') {
                  return /(tronco|troncos).*(superior|medio|inferior)/i.test(txt);
                } else if (nivelActual.titulo === 'Cordones') {
                  return /(cordón|cordones).*(lateral|medio|posterior)/i.test(txt);
                } else if (nivelActual.titulo === 'Preganglionar parcial') {
                  return /(C5|C6|C7|C8|T1)/i.test(txt);
                }else{
                  return /(L2|L3|L4|L5|S1|S2)/i.test(txt);
                }
              };

              // Si no hay nada seleccionado → eliminamos la entrada de troncos
              if (nuevo.length === 0) {
                if (nivelActual.titulo === 'Tronco') {
                  const yaExiste = prevTextoLargo.some(item => item.trim().toLowerCase() === 'tronco');
                  const filtrado = prevTextoLargo.filter(item => !contieneOpciones(item));
                  if (!yaExiste) {
                    return [...filtrado, 'tronco'];
                  } else {
                    return filtrado;
                  }
                } else if (nivelActual.titulo === 'Cordones') {
                  const yaExiste = prevTextoLargo.some(item => item.trim().toLowerCase() === 'cordón');
                  const filtrado = prevTextoLargo.filter(item => !contieneOpciones(item));
                  if (!yaExiste) {
                    return [...filtrado, 'cordón'];
                  } else {
                    return filtrado;
                  }
                } else {
                  return prevTextoLargo.filter(item => !contieneOpciones(item));
                }
              }
              /*if (nuevo.length === 0) {
                return prevTextoLargo.filter(item =>
                  {if (nivelActual.titulo === 'Tronco') {
                    return !item.includes('superior') && !item.includes('medio') && !item.includes('inferior');
                  }else if (nivelActual.titulo === 'Cordones') {
                    return !item.includes('lateral') && !item.includes('medio') && !item.includes('posterior');
                  }else{
                    return !item.includes('C5') && !item.includes('C6') && !item.includes('C7') && !item.includes('C8') && !item.includes('T1');
                  }}
                  // quitamos lo que antes era la frase de troncos
                  //!item.includes('superior') && !item.includes('medio') && !item.includes('inferior')
                );
              }*/

              //Singular/plural
              let baseTronco = (nivelActual.titulo === 'Tronco') ? (nuevo.length === 1 ? 'tronco' : 'troncos') : '';
              let baseCordon = (nivelActual.titulo === 'Cordones') ? (nuevo.length === 1 ? 'cordón' : 'cordones') : '';

              // Si hay seleccionadas → generamos el texto actualizado
              let opcionTxt = joinConY(nuevo.map(n => n.toLowerCase()));
              let opcionTxtM = joinConY(nuevo.map(n => n.toUpperCase()));

              /*/ Reemplazar si ya existía una entrada de troncos
              const contieneOpciones = (txt: string) =>
                {if (nivelActual.titulo === 'Tronco') {
                  return txt.includes('superior') || txt.includes('medio') || txt.includes('inferior');
                }else if (nivelActual.titulo === 'Cordones'){
                  return txt.includes('lateral') || txt.includes('medio') || txt.includes('posterior');
                }else{
                  return txt.includes('C5') || txt.includes('C6') || txt.includes('C7') || txt.includes('C8') || txt.includes('C1');
                }}*/
                //txt.includes('superior') || txt.includes('medio') || txt.includes('inferior');
              if (nivelActual.titulo === 'Preganglionar parcial' || nivelActual.titulo === 'Divisiones') {
                if (prevTextoLargo.some(contieneOpciones)) {
                  return prevTextoLargo.map(item =>
                    contieneOpciones(item) ? opcionTxtM : item
                  );
                } else {
                  return [...prevTextoLargo, opcionTxtM];
                }
              } else if (nivelActual.titulo === 'Tronco') {
                if (prevTextoLargo.some(contieneOpciones)) {
                  return prevTextoLargo.map(item =>
                    contieneOpciones(item) ? `${baseTronco} ${opcionTxt}` : item
                  );
                } else {
                  return [...prevTextoLargo, `${baseTronco} ${opcionTxt}`];
                }
              } else if (nivelActual.titulo === 'Cordones') {
                if (prevTextoLargo.some(contieneOpciones)) {
                  return prevTextoLargo.map(item =>
                    contieneOpciones(item) ? `${baseCordon} ${opcionTxt}` : item
                  );
                } else {
                  return [...prevTextoLargo, `${baseCordon} ${opcionTxt}`];
                }
              } else {
                if (prevTextoLargo.some(contieneOpciones)) {
                  return prevTextoLargo.map(item =>
                    contieneOpciones(item) ? opcionTxtM : item
                  );
                } else {
                  return [...prevTextoLargo, opcionTxtM];
                }
              }
            });

          }
        } else {
        const nuevaEntrada = `${nivelActual.titulo}: ${joinConY(nuevo)}`;
  
        let actualizado = [...resumen];
  
        // Verifica si ya existe una entrada para esta categoría
        const indexExistente = resumen.findIndex(entry =>
          entry.startsWith(`${nivelActual.titulo}:`)
        );
  
        if (indexExistente !== -1) {
          // Reemplaza la entrada existente
          actualizado[indexExistente] = nuevaEntrada;
        } else {
          // Agrega la nueva entrada
          actualizado.push(nuevaEntrada);
        }
  
        setResumen(actualizado);
      }
        return nuevo;
      });
      } else {
        // Si la opción tiene imagen overlay, la agregamos a zonasFijas - manejar array de imagenes
        const imgKey = opcion.ImgValue || opcion.nombre;
        const imgValue = imagenesOverlay[imgKey];

        if (imgValue) {
          setZonasFijas((prev) => {
            //Para array de imagenes (ej. Bilateral)
            if (Array.isArray(imgValue)){
              let nuevas = [...prev];
              imgValue.forEach(img => {
                if (!nuevas.includes(img)) {nuevas.push(img)};
              });
              //Alert.alert('img', JSON.stringify(nuevas));
              return nuevas;
            } else {
              //Una imagen
              if (prev.includes(imgKey)) return prev;
              return [...prev, imgKey];
            }
          });
        }

        /*if (imagenesOverlay[imgKey]) {
          setZonasFijas((prev) => {
            if (prev.includes(imgKey)) return prev;
            return [...prev, imgKey];
          });
        }*/

        // Si estamos en "Pronóstico" y es uno de los tres botones finales, ir al paso final
        if (
          nivelActual.titulo === 'Pronóstico' &&
          ['Recuperación completa', 'Recuperación parcial', 'Pobre no funcional','Recuperación nulo'].includes(opcion.nombre)
        ) {
          // Guarda la selección en el resumen
          const nuevaEntrada = `${nivelActual.titulo}: ${opcion.nombre}`;
          const indexExistente = resumen.findIndex(entry =>
            entry.startsWith(`${nivelActual.titulo}:`)
          );
          let actualizado = [...resumen];
          if (indexExistente !== -1) {
            actualizado[indexExistente] = nuevaEntrada;
          } else {
            actualizado.push(nuevaEntrada);
          }
          setResumen(actualizado);
  
          // ACTUALIZA resumenTextoLargo TAMBIÉN
          const pasoPorReinervacion = resumen.some(entry => entry.startsWith('Reinervación:'));
          const nuevaEntradaTexto = pasoPorReinervacion ? (opcion.texto || '') : (opcion.textoLista || '');
          //const nuevaEntradaTexto = opcion.texto || '';
          let actualizadoTexto = [...resumenTextoLargo];
          if (indexExistente !== -1) {
            actualizadoTexto[indexExistente] = nuevaEntradaTexto;
          } else {
            actualizadoTexto.push(nuevaEntradaTexto);
          }
          setResumenTextoLargo(actualizadoTexto);
  
          // Ir al paso final (Pronóstico finalizada)
          setDistribucionFinalizada(true);
          // ...
          return;
        }
  
        if (opcion.siguiente) {
          setRuta([...ruta, opcion.siguiente]);
  
          if (nivelActual.titulo === 'Ubicacion') {
            actualizarResumenLargo(opcion);
            const base = opcion.nombre;
            const baseLine = `Ubicación: ${base}`;
            const idx = resumen.findIndex(r => r.startsWith('Ubicación:'));
            let actualizado = [...resumen];
            if (idx !== -1) actualizado[idx] = baseLine; else actualizado.push(baseLine);
            setResumen(actualizado);
          } else if (nivelActual.titulo === 'Postganglionar parcial' && (opcion.nombre.startsWith('Troncos') || opcion.nombre.startsWith('Divisiones')) || opcion.nombre.startsWith('Cordones')) {
            actualizarResumenLargo(opcion);
            const idx = resumen.findIndex(r => r.startsWith('Ubicación:'));
            if (idx !== -1) {
              let actualizado = [...resumen];
              if (opcion.nombre.toLowerCase().startsWith('tronco')) {actualizado[idx] = resumen[idx] + ' a nivel de troncos'}
              if (opcion.nombre.toLowerCase().startsWith('divisiones')) {actualizado[idx] = resumen[idx] + ' a nivel de divisiones'}
              if (opcion.nombre.toLowerCase().startsWith('cordones')) {actualizado[idx] = resumen[idx] + ' a nivel de cordones'}
              setResumen(actualizado);
            }
          }else
          // NUEVA LÓGICA
          if (
            (nivelActual.titulo === 'Axonal completa' || nivelActual.titulo === 'Axonal incompleta' || nivelActual.titulo === 'Mixta' || nivelActual.titulo === 'Desmielinizante'
            && ruta[ruta.length - 2]?.titulo === 'Tipo') || (nivelActual.titulo === 'Postganglionar parcial' && ruta[ruta.length - 2]?.titulo === 'Ubicacion')) {
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
              nuevaEntradaLista = `${nivelActual.titulo}: ${opcion.nombre}`;
            }
            let actualizado = [...resumen];
            const indexExistente = resumen.findIndex(entry =>
              entry.startsWith(`${nivelActual.titulo}:`)
            );
            if (indexExistente !== -1) {
              actualizado[indexExistente] = nuevaEntradaLista;
            } else {
              actualizado.push(nuevaEntradaLista);
            }
            setResumen(actualizado);
          }
  
  
          // Nuevo: guardar texto largo
          let nuevaEntradaTexto = opcion.texto || '';
    
          // 👇 Si estamos en Reinervación (o en otros títulos que quieras separar en párrafos)
          if (['Reinervación'].includes(nivelActual.titulo)) {
            nuevaEntradaTexto = '\n\n' + nuevaEntradaTexto;
          }
          let actualizadoTexto = [...resumenTextoLargo];
          const indexExistente = resumen.findIndex(entry =>
              entry.startsWith(`${nivelActual.titulo}:`)
            );
          if (indexExistente !== -1) {
            actualizadoTexto[indexExistente] = nuevaEntradaTexto;
          } else {
            actualizadoTexto.push(nuevaEntradaTexto);
          }
          setResumenTextoLargo(actualizadoTexto);
          setSeleccionMultiple([]);
        }
      }
    };
// ⬇️ PÉGALO junto a avanzarNivel (antes o después está bien)
const handleSiguiente = () => {
  // Sólo aplica para pasos de selección múltiple
  if (!esPasoMultiple) return;

  // Si el paso exige al menos una selección, no avances vacío
  if (!puedeContinuar) return;

  // 1) Fijar overlays elegidos (incluye claves con arrays, p.ej. Bilateral)
  setZonasFijas((prev) => {
    const toAdd = seleccionMultiple.flatMap((n) => {
      const opt = (nivelActual.opciones || []).find((o: any) => o?.nombre === n) as any;
      const key = opt?.ImgValue || n;
      const val = (imagenesOverlay as any)[key];
      if (!val) return [];
      return Array.isArray(val) ? val : [key];
    });
    return Array.from(new Set([...prev, ...toAdd]));
  });

  // 2) Actualizar resumen (lista)
  if (seleccionMultiple.length > 0) {
    const linea = `${nivelActual.titulo}: ${joinConY(seleccionMultiple)}`;
    setResumen((prev) => {
      const idx = prev.findIndex((e) => e.startsWith(`${nivelActual.titulo}:`));
      const out = [...prev];
      if (idx !== -1) out[idx] = linea; else out.push(linea);
      return out;
    });
  }

  // 3) Actualizar texto largo (enunciado) SOLO si NO es uno de los 4 pasos especiales
  if (
    !['Tronco', 'Cordones', 'Preganglionar parcial', 'Divisiones'].includes(nivelActual.titulo) &&
    seleccionMultiple.length > 0
  ) {
    const raices = joinConY(seleccionMultiple);
    const nuevaEntradaTexto = ` ${raices}`;
    setResumenTextoLargo((prev) => {
      // IMPORTANTE: usa 'resumen' para ubicar la posición correspondiente
      const idx = resumen.findIndex((e) => e.startsWith(`${nivelActual.titulo}:`));
      const out = [...prev];
      if (idx !== -1) out[idx] = nuevaEntradaTexto; else out.push(nuevaEntradaTexto);
      return out;
    });
  }

  // 4) Avanzar al siguiente nivel disponible
  const next =
    (nivelActual as any).siguiente ||
    ((nivelActual.opciones?.[0] as any)?.siguiente ?? null);

  if (next) {
    setRuta((prev) => [...prev, next]);
  }

  // 5) Limpiar selección para el siguiente paso
  setSeleccionMultiple([]);
};

// Saltar para pasos single-choice marcados como opcionales
const handleSaltarSingle = () => {
  const next =
    (nivelActual as any).siguiente ||
    ((nivelActual.opciones?.[0] as any)?.siguiente ?? null);

  if (next) setRuta(prev => [...prev, next]);

  // No tocamos resumen / overlays / texto largo
};


  const retrocederNivel = () => {
    if (nivelActual.titulo === 'Pronóstico' && distribucionFinalizada) {
      // Solo volver a mostrar las opciones de Recuperación
      setDistribucionFinalizada(false);
      setNombrePaciente('');
      return;
    }

    // Limpia zonasFijas si vas a regresar al paso anterior a la multiselección
    if (
      ruta.length > 1 &&
      ruta[ruta.length - 2].titulo === 'Pronóstico'
    ) {
      setZonasFijas([]);
    }

    if (ruta.length > 1) {
      const nuevaRuta = ruta.slice(0, -1);
      setRuta(nuevaRuta);
      setResumen(resumen.slice(0, -1));
      setResumenTextoLargo(resumenTextoLargo.slice(0, -1));
      setSeleccionMultiple([]);
      setNombrePaciente('');
    }
  };

  const reiniciar = () => {
    setRuta([estructuraJerarquica]);
    setResumen([]);
    setResumenTextoLargo([]);
    setSeleccionMultiple([]);
    setNombrePaciente('');
    setZonasFijas([]);
    setComentarioLista('');
    setFiguras([]); // Limpia las figuras si usas imágenes movibles
    setDistribucionFinalizada(false); // Vuelve al flujo inicial
    setImgListaSrc(null);
    setExportKey((prev) => prev + 1);
  };

  useEffect(() => {
    if (
      (nivelActual.opciones.length > 2 || resumen.length > 1) &&
      scrollPrincipalRef.current
    ) {
      setTimeout(() => {
        scrollPrincipalRef.current?.scrollToEnd({ animated: true });
      }, 200); // Delay para asegurarse de que todo haya sido renderizado
    }
  }, [nivelActual, resumen]);

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

  const [zonasFijas, setZonasFijas] = useState<string[]>([]);
  // const zonasSeleccionadas = nivelActual.titulo === 'Recuperación' ? seleccionMultiple : zonasFijas;
  const zonasSeleccionadas = [...seleccionMultiple, ...zonasFijas]; 
  const [modoReporte, setModoReporte] = useState<'enunciado' | 'lista' | 'GenerarLink'>('enunciado');  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showComentarioModal, setShowComentarioModal] = useState(false);

  return (
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

      <Animated.ScrollView contentContainerStyle={{ flexGrow: 1, }} keyboardShouldPersistTaps="handled"
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={activeStyles.principalReporte}>
          <View style={activeStyles.leftPanel}>
            {/* Imagen */}
            <View   ref={leftCanvasRef}
            style={[activeStyles.imageContainer, {aspectRatio: BASE_AR}]}
            collapsable={false}
            renderToHardwareTextureAndroid
            needsOffscreenAlphaCompositing
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;
              setLimitesContenedor({ width, height });
            }}
            >
              <Image source={imagenCuerpo} style={activeStyles.baseImage} />
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
                  ocultarBoton={exporting}
                />
              ))}
              {zonasSeleccionadas.map((zona, index) => (
                <View
                  key={index}
                  style={[
                    activeStyles.overlay,
                    zonasOverlay[zona as keyof typeof zonasOverlay],
                  ]}
                />
              ))}

            {zonasSeleccionadas.map((zona, index) => {
              const overlay = zonasOverlay[zona as keyof typeof zonasOverlay];
              const imagenes = imagenesOverlay[zona as keyof typeof imagenesOverlay];

              if (!overlay || !imagenes) return null;

              // Si es un array, renderiza todas las imágenes
              if (Array.isArray(imagenes)) {
                return imagenes.map((img: any, idx: number) => (
                  <Image
                    key={`overlay-img-${index}-${idx}`}
                    source={img}
                    style={{
                      position: 'absolute',
                      height: '100%',
                      width: '100%',
                      left: 0,
                      right: 0,
                      resizeMode: 'contain',
                    
                    }}
                  />
                ));
              }

              // Si es solo una imagen
              return (
                <Image
                  key={`overlay-img-${index}`}
                  source={imagenes}
                  style={{
                    position: 'absolute',
                    height: '100%',
                    width: '100%',
                    left: 0,
                    right: 0,
                    resizeMode: 'contain',
                    
                  }}
                />
              );
            })}

            </View>
          </View>

          <View style={activeStyles.rightPanel}>
            {/* Sección de opciones jerárquicas */}
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
                       
                      </TouchableOpacity>
                    )}
                    {['Preganglionar parcial', 'Divisiones','Cordones', 'Tronco'].includes(nivelActual.titulo) && 
                    (
                      <TouchableOpacity 
                        onPress={() => {
                          // Si el nivel tiene siguiente, avanza normalmente
                          if ('siguiente' in nivelActual && nivelActual.siguiente) {
                            setRuta([...ruta, nivelActual.siguiente as typeof estructuraJerarquica]);
                          } else if (nivelActual.opciones && nivelActual.opciones.length > 0 && nivelActual.opciones[0].siguiente) {
                            setRuta([...ruta, nivelActual.opciones[0].siguiente]);
                          }

                          // ACTUALIZA resumenTextoLargo con las selecciones actuales
                          if (!['Tronco', 'Cordones', 'Preganglionar parcial', 'Divisiones'].includes(nivelActual.titulo)) {
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
                          }
                        }}
                      >
                      </TouchableOpacity>
                    )}
                    {nivelActual.titulo === 'Pronóstico' && distribucionFinalizada ? (
                      <TouchableOpacity style={[activeStyles.iconCircle, activeStyles.printButton]} onPress={handleExportRequest}
                        activeOpacity={0.8}>
                        <ImageBackground
                          source={require('../../../assets/03_Íconos/03_02_PNG/I_Document.png')}
                          style={activeStyles.iconBackground}
                          imageStyle={{
                            width: '90%',
                            height: '90%',
                            tintColor: '#fff',
                          }}
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
            onGenerateLink={generateShareLink}
            onRequestTemplate={requestTemplateForLink}
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
                  nivelActual.titulo === 'Pronóstico ' && { width: '63%', marginRight: 120 }
                ]} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                  {nivelActual.opciones.map((opcion: any, index: number) => (
                    <TouchableOpacity
                      key={index}
                      style={[activeStyles.category, { backgroundColor: '#222' },
                        (nivelActual.seleccionMultiple && seleccionMultiple.includes(opcion.nombre))
                        ? { backgroundColor: 'orange' }
                        : { backgroundColor: '#222' },
                      ]}
                      onPress={() => avanzarNivel(opcion)}
                    >
                      <Text style={activeStyles.categoryText}>{opcion.nombre}</Text>
                    </TouchableOpacity>
                  ))}
                  
  {/* ⬇️ ESTE ES EL BOTÓN NARANJA */}
  {esPasoMultiple && (
    <TouchableOpacity
      onPress={handleSiguiente}
      disabled={!puedeContinuar}
      style={[
        estilosLocales.btnNaranja,
        !puedeContinuar && estilosLocales.btnNaranjaDisabled,
      ]}
    >
      <Text style={estilosLocales.btnNaranjaTxt}>{textoBotonNaranja}</Text>
    </TouchableOpacity>
  )}
  {/* ⬇️ Agrega esto: Saltar para single-choice opcional */}
{!esPasoMultiple && esOpcional && (
  <TouchableOpacity
    onPress={handleSaltarSingle}
    style={[estilosLocales.btnNaranja, { marginTop: 6 }]}
  >
    <Text style={estilosLocales.btnNaranjaTxt}>Saltar ➔</Text>
  </TouchableOpacity>
)}
                </ScrollView>
                )}
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 10 }}>
              <TouchableOpacity
                style={[
                  { padding: 10, borderRadius: 8, marginHorizontal: 5, backgroundColor: modoReporte === 'enunciado' ? '#ff4500' : '#222' }
                ]}
                onPress={() => setModoReporte('enunciado')}
              >
                <Text style={{ color: '#fff' }}>Reporte</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  { padding: 10, borderRadius: 8, marginHorizontal: 5, backgroundColor: modoReporte === 'lista' ? '#ff4500' : '#222' }
                ]}
                onPress={() => setModoReporte('lista')}
              >
                <Text style={{ color: '#fff' }}>Lista</Text>
              </TouchableOpacity>
              
  <TouchableOpacity
    style={[{ padding:10, borderRadius:8, marginHorizontal:5, backgroundColor: modoReporte==='GenerarLink' ? '#ff4500' : '#222' }]}
    onPress={() => setModoReporte('GenerarLink')}
  >
    <Text style={{ color:'#fff' }}>GenerarLink</Text>
  </TouchableOpacity>
            </View>

            {/* Reporte generado */}
            <View style={activeStyles.reporteContainer}>
              <Text style={activeStyles.reporteTitle}>Plexopatía</Text>
              {nombrePaciente.trim() !== '' && (
                <Text style={[activeStyles.reporteTexto, { fontWeight: 'bold', marginBottom: 5 }]}>
                  Paciente: {nombrePaciente}
                </Text>
              )}
             {modoReporte === 'lista'
              ? resumen
                  .filter((linea) => !/^\s*Tronco\s*:/i.test(linea)) // ❌ omite líneas "Tronco: ..."
                  .map((linea, index) => (
                    <Text key={index} style={activeStyles.reporteTextoLista}>
                      {linea}
                    </Text>
                  ))
                : (
                    <View>
                      <Text style={[activeStyles.reporteTexto, { color: '#fff', fontSize: 14, lineHeight: 20, fontFamily: 'LuxoraGrotesk-Light', textAlign: 'justify' }]}>
                        {textoReporte}
                      </Text>
                      {/* Botón para abrir modal de edición */}
                      <TouchableOpacity
                        style={{
                          marginTop: 10,
                          padding: 10,
                          backgroundColor:'#222',
                          borderRadius: 5,
                          alignItems: 'center',
                        }}
                        onPress={() => setShowEditModal(true)}
                      >
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                          Editar
                        </Text>
                      </TouchableOpacity>
                  </View>
                  )
              }
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
                                key={`export1_${exportKey}`}
                                ref={exportRef}
                                style={{
                                  position: 'absolute', left: 0, top: 0, zIndex: -1,
                                  width: pageWpx, height: pageHpx, backgroundColor: exportBgColor, pointerEvents: 'none',
                                  padding: pad, flexDirection: 'column',
                                  borderWidth: pdfCfg.debug ? 1 : 0, borderColor: 'rgba(255,255,255,1)'
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
                                  borderWidth: pdfCfg.debug ? 1 : 0, borderColor: 'rgba(255,255,255,1)'
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
                                          backgroundColor:'transparent', opacity: pdfCfg.header.logo.fogOpacity, borderRadius: px(10)
                                        }} />
                                        <Image
                                          source={{ uri: userData.imageUrl }}
                                          resizeMode="contain"
                                          style={{
                                            width: px(pdfCfg.header.logo.size),
                                            height: px(pdfCfg.header.logo.size),
                                            borderRadius: px(8),
                                            opacity: pdfCfg.header.logo.opacity
                                          }}
                                        />
                                      </View>
                                    )}
                                  </View>
                                </View>
                        
                                           {/* LÁMINA */}
                  {/* LÁMINA (usa la captura real si existe, si no, cae al CanvasView) */}
                 <View
                   style={{
                     width: laminaWpx,
                     height: laminaHpx,
                     alignSelf: 'center',
                     position: 'relative',
                     overflow: 'hidden',
                   }}
                   collapsable={false}
                   renderToHardwareTextureAndroid
                 >
                   <CanvasView
                     key={`canvas_export1_${exportKey}`}
                     w={laminaWpx}
                     h={laminaHpx}
                     transparentBg={plantillaId !== 'none'}
                   />
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
                    {textoReporte}
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
                  key={`export2_${exportKey}`}
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
                      <View style={{ flex: 1, marginRight: px(6), paddingVertical: px(10), paddingLeft: px(36), paddingRight: px(14),backgroundColor:'transparent'}}>
                        <Text style={{ fontWeight: '700', fontSize: px(12), marginBottom: px(6), color: '#000' }}>Plexopatía
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
                      <View style={{flex: 1, marginLeft: px(2), paddingVertical: px(10), paddingRight: px(24), paddingLeft: px(6),backgroundColor:'transparent' }}>
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
                    key={`img_lista_export_${exportKey}`}
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
                  <Text style={{ fontSize: px(10), color: '#666' }}></Text>
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
                {/* Modal de edición de diagnóstico */}
                <EditTextModal
                  visible={showEditModal}
                  title="Editar Diagnóstico"
                  initialText={textoReporte}
                  onSave={(newText) => {
                    // Actualizar el texto completo
                    setResumenTextoLargo([newText]);
                    setShowEditModal(false);
                  }}
                  onCancel={() => setShowEditModal(false)}
                />
                {/* Modal de comentario */}
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
    </View>
  );
}

export default ReporteScreen;

const ninth = (n:number)=>n; // pequeño hack para evitar warnings con px(9.2)


 const estilosLocales = StyleSheet.create({

  btnNaranja: {
  marginTop: 10,
  marginBottom: 10,
  paddingVertical: 10,
  paddingHorizontal: 14,
  borderRadius: 8,
  backgroundColor: '#ff4500',
  alignSelf: 'center',
},
btnNaranjaDisabled: { opacity: 0.5 },
btnNaranjaTxt: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 0.3 },


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
});