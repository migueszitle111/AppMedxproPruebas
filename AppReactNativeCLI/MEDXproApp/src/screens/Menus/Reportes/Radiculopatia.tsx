// ➜ src/screens/reporte/ReporteRadiculopatiaScreen.tsx
import React, { useState, useRef, useEffect , useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ImageStyle,
  Image,
  TextInput,
  ImageBackground,
  ImageSourcePropType,
  useWindowDimensions, 
  Keyboard,  
  ActivityIndicator,
  InteractionManager
} from 'react-native';
import Header from '../../../components/Header';
import AnimatedLetterText from 'react-native-animated-letter-text';
import { PermissionsAndroid, Platform, Permission, Alert } from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import {  launchImageLibrary } from 'react-native-image-picker';
import uuid from 'react-native-uuid';
import FiguraMovible from '../../../components/FiguraMovible';
import { Figura } from '../../../navigation/types';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../../../constants/config'; 
import Svg, { Path } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';
import { PDFDocument } from 'pdf-lib';
import ReactNativeBlobUtil from 'react-native-blob-util';
import FancyInput from '../../../components/FancyInput';
import GaleriaEmergente from './GaleriaTb';
//Link
import LinkUploader, { type LinkUploaderProps } from '../../../components/LinkUploader';
import { supabase } from '../../../lib/supabase';
import { initShareLink, completeShareLink } from '../../../services/shareLinks';
import { decode as b64decode, encode as b64encode } from 'base64-arraybuffer';

import TemplatePickerModal, { type PlantillaId } from '../../../components/TemplatePickerModalHorizontal';
export type { PlantillaId } from '../../../components/TemplatePickerModalHorizontal';

import {
  PLANTILLAS_PDF,
  buildPdfWithTemplate,
  type PdfBuildConfig,
} from '../../../components/pdfLoadingTemplateHorizontal';

//Modal de exito - Exportar pdf
import EditTextModal from '../../../components/EditTextModal';
import { ExportSuccessModal } from '../../../components/ExportSuccessModal';
import ComentarioModal from '../../../components/ComentarioModal';

const safeName = (s: string) =>
  (s || 'Paciente')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim().replace(/\s+/g, '_');

// === Bucket de storage
const BUCKET = 'report-packages';
const MIN_COMENTARIO_HEIGHT = 120;

// === Limpia nombre de archivo (para storage)
const sanitizeFilename = (name: string) =>
  name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w.\- ]+/g, '')
      .replace(/\s+/g, '_')
      .slice(0, 120);

// === content:// / file://  -> ruta legible
const uriToReadablePath = async (rawUri: string) => {
  try {
    if (rawUri.startsWith('content://')) {
      const st = await ReactNativeBlobUtil.fs.stat(rawUri);
      if (st?.path) return decodeURIComponent(st.path.replace(/^file:\/\//, ''));
      return rawUri;
    }
    if (rawUri.startsWith('file://')) return decodeURIComponent(rawUri.replace('file://', ''));
    return decodeURIComponent(rawUri);
  } catch {
    return rawUri;
  }
};

// === Lee archivo local como ArrayBuffer
const readAsArrayBuffer = async (rawUri: string) => {
  const path = await uriToReadablePath(rawUri);
  const base64 = await ReactNativeBlobUtil.fs.readFile(path, 'base64');
  return b64decode(base64);
};


const GPU = Platform.select({
  android: { renderToHardwareTextureAndroid: true, needsOffscreenAlphaCompositing: true } as const,
  ios:     { shouldRasterizeIOS: true } as const,
  default: {},
});

// ➜ FastImage wrapper
import FastImage from 'react-native-fast-image';
type AnySrc = string | number | { uri: string };

const toFISource = (src: AnySrc, isTransparent = false) => {
  if (typeof src === 'string') {
    return {
      uri: src,
      priority: isTransparent ? FastImage.priority.high : FastImage.priority.normal,
      cache: isTransparent ? FastImage.cacheControl.immutable : FastImage.cacheControl.web
    };
  }
  if (typeof src === 'number') return src; // require(...)
  if ((src as any)?.uri) {
    return {
      ...(src as any),
      cache: isTransparent ? FastImage.cacheControl.immutable : FastImage.cacheControl.web,
      priority: isTransparent ? FastImage.priority.high : (src as any).priority
    };
  }
  return src as any;
};

const FI = React.memo(function FI({
  source,
  style,
  resizeMode = 'contain',
  isTransparent = false,
  ...rest
}: {
  source: AnySrc;
  style?: any;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  isTransparent?: boolean;
} & Record<string, any>) {
  const rm =
    resizeMode === 'cover'  ? FastImage.resizeMode.cover  :
    resizeMode === 'stretch'? FastImage.resizeMode.stretch:
    resizeMode === 'center' ? FastImage.resizeMode.center :
                              FastImage.resizeMode.contain;

  // Props adicionales para mejorar transparencia
  const transparencyProps = isTransparent ? {
    ...GPU,
    needsOffscreenAlphaCompositing: true,
    ...(Platform.OS === 'android' ? {
      renderToHardwareTextureAndroid: true,
    } : {}),
  } : GPU;

  return (
    <FastImage
      source={toFISource(source, isTransparent)}
      style={style}
      resizeMode={rm}
      {...transparencyProps}
      {...rest}
    />
  );
});


type Size = { w: number; h: number };
const px = (n: number) => Math.round(n);
const FIG = {
  UI: 80,
  PDF: 80,
  INSET: 5,  // Margen interno para que los bordes siempre sean visibles en PDF
};

// Configuración base común para todas las plantillas
const pdfConfigBase = {
  header: {
    nameSize: 12,  // Reducido de 16 a 12
    logoW: 80,     // Aumentado de 70 a 80
    logoH: 45,     // Aumentado de 40 a 45
    padH: 20,      // Padding horizontal (mueve contenido a derecha/izquierda)
    padV: 2,       // Padding vertical (mueve header arriba/abajo)
    topOffset: 40, // Offset adicional para mover todo el header hacia abajo (valores positivos lo bajan)
  },
  footer: {
    icon: 11,            // Reducido de 14 a 11
    text: 9,             // Reducido de 12 a 9
    iconTextGap: 4,      // Reducido de 6 a 4
    itemGap: 10,         // Reducido de 14 a 10
    padV: 8,             // Reducido de 10 a 8
    lift: 12,            // Distancia desde el fondo (valores mayores suben el footer)
    boxH: 50,            // Reducido de 60 a 50
  },
  page1: {
    extraH: 250,
  },
};

// Configuraciones específicas de page2 según plantilla
const page2Configs = {
  A: {
    shiftDown: 100,     // Posición general del contenido
    contentPadH: 30,
    listaPadLeft: 80,
    listaPadRight: 100,
    listaFlex: 7,       // Proporción de ancho de la lista (MÁS ANGOSTO)
    comentarioPadLeft: -100,
    comentarioPadRight: 90,
    comentarioPadTop: -100,  // Offset negativo para subir el comentario clínico
    comentarioFlex: 13,   // Proporción de ancho del comentario (MÁS ANCHO)
    tableTopGap: 3,
    tableBottomGap: 0,
    tableWidth: '50%',  // Ancho de la tabla (imagen)
    tableTop: 290,      // Posición vertical fija de la tabla desde arriba
    headerTopOffset: undefined as number | undefined, // Sin offset adicional para plantilla A
  },
  B: {
    shiftDown: 100,     // Posición general del contenido
    contentPadH: 30,
    listaPadLeft: 80,
    listaPadRight: 100,
    listaFlex: 7,       // Proporción de ancho de la lista (MÁS ANGOSTO)
    comentarioPadLeft: -100,
    comentarioPadRight: 90,
    comentarioPadTop: -100,  // Offset negativo para subir el comentario clínico
    comentarioFlex: 13,   // Proporción de ancho del comentario (MÁS ANCHO)
    tableTopGap: 3,
    tableBottomGap: 0,
    tableWidth: '50%',  // Ancho de la tabla (imagen)
    tableTop: 290,      // Posición vertical fija de la tabla desde arriba
    headerTopOffset: undefined as number | undefined, // Sin offset adicional para plantilla A
  },
  C: {
    shiftDown: 135,
    contentPadH: 30,
    listaPadLeft: 20,
    listaPadRight: 110,
    listaFlex: 7,       // Proporción de ancho de la lista (MÁS ANGOSTO)
    comentarioPadLeft: 0,
    comentarioPadRight: 50,
    comentarioPadTop: 0,  // Sin offset adicional para el comentario en plantilla C
    comentarioFlex: 13,   // Proporción de ancho del comentario (MÁS ANCHO)
    tableTopGap: 3,
    tableBottomGap: 0,
    tableWidth: '50%',  // Ancho de la tabla (imagen)
    tableTop: 320,      // Posición vertical fija de la tabla desde arriba
    headerTopOffset: undefined as number | undefined, // Sin offset adicional para plantilla C
  },
  none: {
   shiftDown: 135,
    contentPadH: 30,
    listaPadLeft: 20,
    listaPadRight: 100,
    listaFlex: 7,       // Proporción de ancho de la lista (MÁS ANGOSTO)
    comentarioPadLeft: 0,
    comentarioPadRight: 50,
    comentarioPadTop: 0,  // Sin offset adicional para el comentario en plantilla none
    comentarioFlex: 13,   // Proporción de ancho del comentario (MÁS ANCHO)
    tableTopGap: 3,
    tableBottomGap: 0,
    tableWidth: '50%',  // Ancho de la tabla (imagen)
    tableTop: 320,      // Posición vertical fija de la tabla desde arriba
    headerTopOffset: undefined as number | undefined, // Sin offset adicional para plantilla none
  },
} as const;

// Función para obtener configuración PDF completa según plantilla
const getPdfConfig = (templateId: PlantillaId) => {
  const page2Config = page2Configs[templateId] || page2Configs.none;
  return {
    ...pdfConfigBase,
    header: {
      ...pdfConfigBase.header,
      topOffset: page2Config.headerTopOffset ?? pdfConfigBase.header.topOffset,
    },
    page2: page2Config,
  };
};

type UserData = {
  name: string;
  lastname: string;
  idprofessional: string;
  specialty: string;
  email: string;
  imageUrl: string;
};

const safe = (s: string) =>
  s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '') 
   .replace(/[^A-Za-z0-9\s-]/g, '')                  
   .trim()
   .replace(/\s+/g, '_');

function getDrawnRect(container: Size, base: ImageSourcePropType) {
  const { width: iw, height: ih } = Image.resolveAssetSource(base);
  const scale = Math.min(container.w / iw, container.h / ih);
  const w = iw * scale;
  const h = ih * scale;
  const x = (container.w - w) / 2;
  const y = (container.h - h) / 2;
  return { x, y, w, h, scale };
}


const keyForImg = (src: any, suffix = '') => {
  try {
    if (typeof src === 'number') {
      const resolved = Image.resolveAssetSource(src);
      return (resolved?.uri || String(src)) + suffix;
    }
    if (typeof src === 'string') return src + suffix;
    if (src?.uri) return src.uri + suffix;
  } catch {}
  return 'k_' + Math.random().toString(36).slice(2) + suffix;
};

/* ────────────────────────────────────────────────────────────────────────── */
// justo debajo de tus imports
const CROSS_IMG: Record<1 | 2 | 3 | 4, any> = {
  1: require('../../../assets/Cruces/S_Cruz1.png'),
  2: require('../../../assets/Cruces/S_Cruz2.png'),
  3: require('../../../assets/Cruces/S_Cruz3.png'),
  4: require('../../../assets/Cruces/S_Cruz4.png'),
};

// cruces rojas
const CROSS_RED_IMG: Record<1 | 2 | 3 | 4, any> = {
  1: require('../../../assets/Cruces/S_Cruz_Rojo01.png'),
  2: require('../../../assets/Cruces/S_Cruz_Rojo02.png'),
  3: require('../../../assets/Cruces/S_Cruz_Rojo03.png'),
  4: require('../../../assets/Cruces/S_Cruz_Rojo04.png'),
};

// 2) posición vertical base por nivel
const LEVEL_TOP: Record<string, number> = {
  C4: 0.045,
  C5: 0.065,
  C6: 0.085,
  C7: 0.095,
  C8: 0.120,
  T1: 0.135,
  
  L1: 0.478,
  L2: 0.510,
  L3: 0.545,
  L4: 0.578,
  L5: 0.610,
  S1: 0.649,
  S2: 0.680,
}

// 3) desplazamiento horizontal específico por [nivel][índice]
const OFFSET: Record<string, Record<1 | 2 | 3 | 4, number>> = {
  C4: { 1: 0.400 + 0.44 , 2: 0.385 + 0.44, 3: 0.372 + 0.44, 4: 0.360 + 0.438},
  C5: { 1: 0.400 + 0.44 , 2: 0.385 + 0.44, 3: 0.372 + 0.44, 4: 0.360 + 0.438 },
  C6: { 1: 0.400 + 0.44 , 2: 0.385 + 0.44, 3: 0.372 + 0.44, 4: 0.360 + 0.438 },
  C7: { 1: 0.400 + 0.44 , 2: 0.385 + 0.44, 3: 0.372 + 0.44, 4: 0.360 + 0.438 },
  C8: { 1: 0.400 + 0.44 , 2: 0.385 + 0.44, 3: 0.372 + 0.44, 4: 0.360 + 0.438 },
  T1: { 1: 0.400 + 0.44 , 2: 0.385 + 0.44, 3: 0.372 + 0.44, 4: 0.360 + 0.438 },

  L1: { 1: 0.385 + 0.44 , 2: 0.385 + 0.426, 3: 0.384 + 0.413, 4: 0.385 + 0.398 },
  L2: { 1: 0.385 + 0.44 , 2: 0.385 + 0.426, 3: 0.384 + 0.413, 4: 0.385 + 0.398 },
  L3: { 1: 0.385 + 0.44 , 2: 0.385 + 0.426, 3: 0.384 + 0.413, 4: 0.385 + 0.398 },
  L4: { 1: 0.385 + 0.44 , 2: 0.385 + 0.426, 3: 0.384 + 0.413, 4: 0.385 + 0.398 },
  L5: { 1: 0.385 + 0.44 , 2: 0.385 + 0.426, 3: 0.384 + 0.413, 4: 0.385 + 0.398 },

  S1: { 1: 0.385 + 0.44 , 2: 0.385 + 0.426, 3: 0.384 + 0.413, 4: 0.385 + 0.398 },
  S2: { 1: 0.385 + 0.44 , 2: 0.385 + 0.426, 3: 0.384 + 0.413, 4: 0.385 + 0.398 },
}

// 4) ajuste vertical adicional por [nivel][índice]
const V_DELTAS: Record<string, Record<1 | 2 | 3 | 4, number>> = {
  C4: { 1:  0.02 - 0.069, 2: +0.00 - 0.049,   3: -0.01 - 0.040,   4: +0.01 - 0.059 },
  C5: { 1: +0.03 - 0.070, 2: +0.01 - 0.050,   3: -0.02 - 0.020,   4: +0.00 - 0.040 },
  C6: { 1: +0.05 - 0.085, 2: +0.0125 - 0.048, 3: -0.02 - 0.016,   4: +0.02 - 0.055 },
  C7: { 1: +0.04 - 0.061, 2: +0.04   - 0.061, 3: -0.02 - 0.002,   4: +0.02 - 0.041  },
  C8: { 1: +0.03 - 0.050, 2: +0.03 - 0.050,   3: -0.01 - 0.010,   4: +0.00 - 0.019 },
  T1: { 1: +0.02 - 0.030, 2: +0.00 - 0.010,   3: -0.00 - 0.009,   4: +0.00 - 0.010 },

  L1: { 1: +0.01 + 0.065, 2: +0.01 + 0.065,   3: +0.01 + 0.065,   4: +0.01 + 0.065 },
  L2: { 1: +0.02 + 0.065, 2: +0.01 + 0.075,   3: +0.01 + 0.075,   4: +0.00 + 0.084 },
  L3: { 1: +0.03 + 0.065, 2: +0.02 + 0.074,   3: +0.02 + 0.074,   4: +0.01 + 0.085 },
  L4: { 1: +0.04 + 0.065, 2: +0.04 + 0.065,   3: +0.04 + 0.065,   4: +0.04 + 0.065 },
  L5: { 1: +0.05 + 0.065, 2: +0.03 + 0.084,   3: +0.03 + 0.085,   4: +0.03 + 0.085 },

  S1: { 1: +0.087  + 0.039, 2: +0.090 + 0.035 , 3: +0.090 + 0.036, 4: +0.090 + 0.036},
  S2: { 1: +0.03  + 0.109, 2: +0.090 + 0.048, 3: +0.090 + 0.049,  4: +0.090 + 0.049 },
}

/* ─── CrossMeta y getCrossMeta ─────────────────────────────────────────────── */
type CrossMeta = {
  key:    string
  src:    any
  topPct: number // 0–1
  offPct: number // 0–1
  side:   'L' | 'R'
}
/**
 * @param id 
 * @returns  
 */
const getCrossMeta = (id: string): CrossMeta | null => {
  const m = id.match(/^([CLTS]\d|T1)_(L|R)([1-4])$/i)
  if (!m) return null
  const [, lvlRaw, side, nStr] = m
  const lvl = lvlRaw.toUpperCase()
  const n   = Number(nStr) as 1 | 2 | 3 | 4
  const topBase = LEVEL_TOP[lvl]
  const offBase = OFFSET[lvl]?.[n]
  const delta   = V_DELTAS[lvl]?.[n] ?? 0

  if (topBase == null || offBase == null) return null

  return {
    key:    id,
    src:    CROSS_IMG[n],
    topPct: topBase + delta,
    offPct: offBase,
    side:   side as 'L' | 'R',
  }
}

const SIDE_ID_REGEX = /^([A-Za-z0-9-]+)_(L|R)[1-4]$/i;

type SideFlags = { L?: boolean; R?: boolean };

const toSideFlags = (ids: readonly string[]): Record<string, SideFlags> => {
  const out: Record<string, SideFlags> = {};
  ids.forEach(id => {
    const match = SIDE_ID_REGEX.exec(id);
    if (!match) return;
    const [, rawLvl, side] = match;
    const lvl = rawLvl.toUpperCase();
    const entry = (out[lvl] ||= {});
    const sideUpper = side.toUpperCase() as 'L' | 'R';
    entry[sideUpper] = true;
  });
  return out;
};

const mergeSideFlagMaps = (
  target: Record<string, SideFlags>,
  source?: Record<string, SideFlags> | null,
) => {
  if (!source) return;
  Object.entries(source).forEach(([lvl, flags]) => {
    if (!flags) return;
    const entry = (target[lvl] ||= {});
    if (flags.L) entry.L = true;
    if (flags.R) entry.R = true;
  });
};

/* -------------------------------------------------------------------------- */
/* Assets */
import I_Regresar  from '../../../assets/03_Íconos/03_02_PNG/I_Out2.png';
import I_Refrescar from '../../../assets/03_Íconos/03_02_PNG/I_Repeat2.png';
import I_Siguiente    from '../../../assets/03_Íconos/03_02_PNG/I_In2.png';
import I_Descargar  from '../../../assets/03_Íconos/03_02_PNG/I_Document.png';

/* ---------- overlays que agregaremos al abrir los acordeones ---------- */
import OV_CERV_POST  from '../../../assets/CuerpoPng/Radiculopatia/Multinivel/Columna_Cervical_I.png';
import OV_CERV_ANT   from '../../../assets/CuerpoPng/Radiculopatia/Multinivel/Columna_Cervical_D.png';
import OV_TORAX_POST from '../../../assets/CuerpoPng/Radiculopatia/Multinivel/Columna_Toracica_I.png';
import OV_TORAX_ANT  from '../../../assets/CuerpoPng/Radiculopatia/Multinivel/Columna_Toracica_D.png';
import OV_LUMBO_POST from '../../../assets/CuerpoPng/Radiculopatia/Multinivel/Columna_Lumbar_I.png';
import OV_LUMBO_ANT  from '../../../assets/CuerpoPng/Radiculopatia/Multinivel/Columna_Lumbar_D.png';

import { escanearImagen } from '../../../utils/EscanearImagen';

/* Musculos al marcar los checkboxes */
/* ════════════════════════════════════════════════════════════════════════ */
/* ░░  OVERLAYS SUBAGUDOS – C5-T1  y  L2-S1                                ░░ */
/* ════════════════════════════════════════════════════════════════════════ */
type Vista = 'post' | 'ant';
type Key   = 'L1'|'L2'|'L3'|'L4'|'R1'|'R2'|'R3'|'R4';

/**
 * Recibe 1 imagen por (vista, lado) y la replica para los 4 índices
 * -- de esta forma solo importas **4 PNG por nivel**, no 16.
 */
const tabla = (postL:any, postR:any, antL:any, antR:any) => ({
  post:{ L1:postL, L2:postL, L3:postL, L4:postL,
         R1:postR, R2:postR, R3:postR, R4:postR },
  ant :{ L1:antL , L2:antL , L3:antL , L4:antL ,
         R1:antR , R2:antR , R3:antR , R4:antR },
});

/* ------------------------------------------------------------------ */
/* 1.  CERVICALES  (C5 … T1)                                          */
/* ------------------------------------------------------------------ */

/* C5 – ya lo tenías, lo dejamos igual */
const C5 = tabla(
  require('../../../assets/CuerpoPng/Radiculopatia/C5_izquierdo_anterior.png'),                // post L
  require('../../../assets/CuerpoPng/Radiculopatia/C5_derecho_anterior.png'),              // post R
  require('../../../assets/CuerpoPng/Radiculopatia/RadiculopatiaPosteriorImg/C5C6izquierdoposterior.png'), // ant L
  require('../../../assets/CuerpoPng/Radiculopatia/RadiculopatiaPosteriorImg/C5C6derechoposterior.png'), // ant R
);

/* C6 – ajusta las rutas 🔄 a tus archivos reales */
const C6 = tabla(
  require('../../../assets/CuerpoPng/Radiculopatia/C6_izquierdo_anterior.png'),   
  require('../../../assets/CuerpoPng/Radiculopatia/C6_derecho_anterior.png'), 
  require('../../../assets/CuerpoPng/Radiculopatia/RadiculopatiaPosteriorImg/C5C6izquierdoposterior.png'), 
  require('../../../assets/CuerpoPng/Radiculopatia/RadiculopatiaPosteriorImg/C5C6derechoposterior.png'),
);

/* C7 */
const C7 = tabla(
  require('../../../assets/CuerpoPng/Radiculopatia/C7_izquierdo_anterior.png'),
  require('../../../assets/CuerpoPng/Radiculopatia/C7_derecho_anterior.png'),
  require('../../../assets/CuerpoPng/Radiculopatia/RadiculopatiaPosteriorImg/C7_izquierdo_posterior.png'),
  require('../../../assets/CuerpoPng/Radiculopatia/RadiculopatiaPosteriorImg/C7_derecho_posterior.png'), 
);

/* C8 */
const C8 = tabla(
  require('../../../assets/CuerpoPng/Radiculopatia/C8_izquierdo_anterior.png'),
  require('../../../assets/CuerpoPng/Radiculopatia/C8_derecho_anterior.png'),
  require('../../../assets/CuerpoPng/Radiculopatia/RadiculopatiaPosteriorImg/C8_izquierdo_posterior.png'),
  require('../../../assets/CuerpoPng/Radiculopatia/RadiculopatiaPosteriorImg/C8_derecho_posterior.png'), 
);

/* T1 */
const T1 = tabla(
  require('../../../assets/CuerpoPng/Radiculopatia/T1_izquierdo_anterior.png'),
  require('../../../assets/CuerpoPng/Radiculopatia/T1_derecho_anterior.png'),
  require('../../../assets/CuerpoPng/Radiculopatia/RadiculopatiaPosteriorImg/C8_izquierdo_posterior.png'), 
  require('../../../assets/CuerpoPng/Radiculopatia/RadiculopatiaPosteriorImg/C8_derecho_posterior.png'), // ant R
);

/* ------------------------------------------------------------------ */
/* 2.  LUMBO-SACRO  (L2 … S1)                                         */
/* ------------------------------------------------------------------ */

const L2 = tabla(
  require('../../../assets/CuerpoPng/Radiculopatia/L1-L2_izquierdo_anterior.png'),
  require('../../../assets/CuerpoPng/Radiculopatia/L1-L2_derecho_anterior.png'),
  null,  // ──  Izq (nada)
  null,  // ──  Der (nada)
);

const L3 = tabla(
  require('../../../assets/CuerpoPng/Radiculopatia/L1-L2_izquierdo_anterior.png'),
  require('../../../assets/CuerpoPng/Radiculopatia/L1-L2_derecho_anterior.png'),
  null,  // ──  Izq (nada)
  null,  // ──  Der (nada)
);

const L4 = tabla(
  require('../../../assets/CuerpoPng/Radiculopatia/L3-L4_izquierdo_anterior.png'),
  require('../../../assets/CuerpoPng/Radiculopatia/L3-L4_derecho_anterior.png'),
  null,  // ──  Izq (nada)
  null,  // ──  Der (nada)
);

const L5 = tabla(
  require('../../../assets/CuerpoPng/Radiculopatia/L5_izquierdo_anterior.png'),
  require('../../../assets/CuerpoPng/Radiculopatia/L5_derecho_anterior.png'),
  require('../../../assets/CuerpoPng/Radiculopatia/RadiculopatiaPosteriorImg/L5_izquierdo_posterior.png'), // ant L
  require('../../../assets/CuerpoPng/Radiculopatia/RadiculopatiaPosteriorImg/L5_derecho_posterior.png'), // ant R
);

const S1 = tabla(
  require('../../../assets/CuerpoPng/Radiculopatia/S1_izquierdo_anterior.png'),
  require('../../../assets/CuerpoPng/Radiculopatia/S1_derecho_anterior.png'),
  require('../../../assets/CuerpoPng/Radiculopatia/S1_izquierdo_posterior.png'),
  require('../../../assets/CuerpoPng/Radiculopatia/S1_derecho_posterior.png'),
);

const S2 = tabla(null, null, null, null);   

/* ------------------------------------------------------------------ */
/* 3.  OBJETO ÚNICO EXPORTADO                                         */
/* ------------------------------------------------------------------ */
export const OVERLAYS: Record<string, Record<Vista, Record<Key, any>>> = {
  /* Cervicales */
  C5, C6, C7, C8, T1,
  /* Lumbo-sacro */
  L2, L3, L4, L5, S1,S2,
} as const;
/* ════════════════════════════════════════════════════════════════════════ */

/* === bases para RADICULOPATÍA Multinivel === */
const IMG_POST = require('../../../assets/CuerpoPng/Radiculopatia/Multinivel/RA_Columna_1_FondoB.png');
const IMG_ANT  = require('../../../assets/CuerpoPng/Radiculopatia/Multinivel/RA_Columna_2_FondoB.png');

/* === bases TRANSPARENTES para RADICULOPATÍA Multinivel (para plantillas) === */
const IMG_POST_TR = require('../../../assets/CuerpoPng/Radiculopatia/Multinivel/RA_Columna_1_FondoB_TR.png');
const IMG_ANT_TR  = require('../../../assets/CuerpoPng/Radiculopatia/Multinivel/RA_Columna_2_FondoB_TR.png');

/* === bases para RADICULOPATÍA SENSITIVA === */
const IMG_POST_SENS = require('../../../assets/CuerpoPng/Radiculopatia/Columna/BASE_POSTERIOR.png');
const IMG_ANT_SENS  = require('../../../assets/CuerpoPng/Radiculopatia/Columna/BASE_ANTERIOR.png');

/* === bases TRANSPARENTES para RADICULOPATÍA SENSITIVA (para plantillas) === */
const IMG_POST_SENS_TR = require('../../../assets/CuerpoPng/Radiculopatia/Columna/BASE_POSTERIOR_TR.png');
const IMG_ANT_SENS_TR  = require('../../../assets/CuerpoPng/Radiculopatia/Columna/BASE_ANTERIOR_TR.png');

/* Imagenes sensitivas para los checkboxes */
/* ─── C6-C7 ─────────────────────────────────────────── */
const RS_C6C7_IZQ_POST = require('../../../assets/CuerpoPng/Radiculopatia/SENSITIVAS/C6-C7izquierdopos.png');
const RS_C6C7_DER_POST = require('../../../assets/CuerpoPng/Radiculopatia/SENSITIVAS/C6-C7derechopos.png');
const RS_C6C7_BILAT_POST = require('../../../assets/CuerpoPng/Radiculopatia/SENSITIVAS/C6-C7bilateralpos.png');


const RS_C6C7_IZQ_ANT  = require('../../../assets/CuerpoPng/Radiculopatia/RadiculopatiaPosteriorImg/C6s_anterior_izquierdo.png');
const RS_C6C7_DER_ANT  = require('../../../assets/CuerpoPng/Radiculopatia/RadiculopatiaPosteriorImg/C6s_anterior_derecho.png');

/* ─── S1 ────────────────────────────────────────────── */
const RS_S1_IZQ_POST   = require('../../../assets/CuerpoPng/Radiculopatia/SENSITIVAS/S1izquierdapos.png');
const RS_S1_DER_POST   = require('../../../assets/CuerpoPng/Radiculopatia/SENSITIVAS/S1derechapos.png');

const RS_S1_IZQ_ANT    = require('../../../assets/CuerpoPng/Radiculopatia/RadiculopatiaPosteriorImg/S1s_posterior_izquierdo.png');
const RS_S1_DER_ANT    = require('../../../assets/CuerpoPng/Radiculopatia/RadiculopatiaPosteriorImg/S1s_posterior_derecho.png');

type SensKey = 'Izquierda' | 'Derecha' | 'Bilateral';
export const SENS_OVERLAYS: Record<'C6-C7' | 'S1',
  Record<Vista, Record<SensKey, any>>> = {
  'C6-C7': {
    post : {
      Izquierda: RS_C6C7_IZQ_POST,
      Derecha:   RS_C6C7_DER_POST,
      Bilateral: RS_C6C7_BILAT_POST,  
    },
    ant  : {
      Izquierda: RS_C6C7_IZQ_ANT,
      Derecha:   RS_C6C7_DER_ANT,
      Bilateral: null,  
    },
  },
  S1: {
    post : {
      Izquierda: RS_S1_IZQ_POST,
      Derecha:   RS_S1_DER_POST,
      Bilateral: null, 
    },
    ant  : {
      Izquierda: RS_S1_IZQ_ANT,
      Derecha:   RS_S1_DER_ANT,
      Bilateral: null, 
    },
  },
};


/* -------------------------------------------------------------------------- */
/* Constantes generales */
const cervicalLevels    = ['C4', 'C5', 'C6', 'C7', 'C8', 'T1'];
const lumbosacralLevels = ['L1', 'L2', 'L3', 'L4', 'L5', 'S1', 'S2'];

/* === Sensitiva: niveles y lados === */
const sensitivaLevels = ['C6-C7', 'S1'];
const sensitivaSides  = ['Izquierda', 'Derecha', 'Bilateral'] as const;

const LEVEL_SEQUENCE = [...cervicalLevels, ...lumbosacralLevels];
const LEVEL_PRIORITY: Record<string, number> = LEVEL_SEQUENCE.reduce((acc, lvl, idx) => {
  acc[lvl] = idx;
  return acc;
}, {} as Record<string, number>);


/* -------------------------------------------------------------------------- */
/* Tipos */
interface OpcionJerarquia { nombre:string; texto:string; siguiente?:Jerarquia }
interface Jerarquia { titulo:string; seleccionMultiple:boolean; opciones:OpcionJerarquia[] }

/* -------------------------------------------------------------------------- */
/* 1) Nodos hoja */
const pasoE: Jerarquia = { titulo:'IMÁGENES Y EXPORTACIÓN', seleccionMultiple:false, opciones:[] };

/* -------------------------------------------------------------------------- */
/* 2) Flujos (Aguda / Subaguda / Crónica – resumidos) */
const pasoD_Aguda:Jerarquia = { titulo:'Pronóstico', seleccionMultiple:false, opciones:[
  { nombre:'Completa',           texto:'Pronóstico Recuperación completa',                 siguiente:pasoE },
  { nombre:'Parcial funcional',  texto:'Pronóstico Recuperación parcial funcional',        siguiente:pasoE },
  { nombre:'Pobre no funcional', texto:'Pronóstico Recuperación pobre no funcional',       siguiente:pasoE },
  { nombre:'Nula (secuela)',     texto:'Pronóstico Recuperación nula (en fase de secuela)', siguiente:pasoE },
]};
const pasoC_Aguda:Jerarquia = { titulo:'Intensidad', seleccionMultiple:false, opciones:[
  { nombre:'Leve (+/+)',    texto:'Intensidad leve (+/+)',    siguiente:pasoD_Aguda },
  { nombre:'Moderada (++)', texto:'Intensidad moderada (++)', siguiente:pasoD_Aguda },
  { nombre:'Severa (+++)',  texto:'Intensidad severa (+++)',  siguiente:pasoD_Aguda },
  { nombre:'Difusa (++++)', texto:'Intensidad difusa (++++)', siguiente:pasoD_Aguda },
]};
const pasoB_Aguda:Jerarquia = { titulo:'Nivel', seleccionMultiple:false, opciones:[
  { nombre:'Cervical',        texto:'Cervical',        siguiente:pasoC_Aguda },
  { nombre:'Torácica',        texto:'Torácica',        siguiente:pasoC_Aguda },
  { nombre:'Lumbosacro',      texto:'Lumbosacro',      siguiente:pasoC_Aguda },
  // { nombre:'Polisegmentario', texto:'Polisegmentaria', siguiente:pasoC_Aguda },
]};

/* -------- Subaguda -------- */
const pasoD_Subaguda:Jerarquia = { titulo:'Pronóstico', seleccionMultiple:false, opciones:[
  { nombre:'Completa',           texto:'Pronóstico Recuperación completa',                 siguiente:pasoE },
  { nombre:'Parcial funcional',  texto:'Pronóstico Recuperación parcial funcional',        siguiente:pasoE },
  { nombre:'Pobre no funcional', texto:'Pronóstico Recuperación pobre no funcional',       siguiente:pasoE },
  { nombre:'Nula (secuela)',     texto:'Pronóstico Recuperación nula (en fase de secuela)', siguiente:pasoE },
]};

const pasoReinervacion_Subaguda: Jerarquia = {
  titulo: 'Reinervación',
  seleccionMultiple: false,
  opciones: [
    { nombre:'Abundante', texto:'con reinervación colateral abundante', siguiente: pasoD_Subaguda },
    { nombre:'Mínima',    texto:'con reinervación colateral mínima',    siguiente: pasoD_Subaguda },
    { nombre:'Ausente',   texto:'sin reinervación colateral',           siguiente: pasoD_Subaguda },
  ],
};

const pasoC_Subaguda: Jerarquia = { titulo:'Intensidad', seleccionMultiple:false, opciones:[
  { nombre:'Leve (+/+)',    texto:'Intensidad leve (+/+)',    siguiente: pasoReinervacion_Subaguda },
  { nombre:'Moderada (++)', texto:'Intensidad moderada (++)', siguiente: pasoReinervacion_Subaguda },
  { nombre:'Severa (+++)',  texto:'Intensidad severa (+++)',  siguiente: pasoReinervacion_Subaguda },
  { nombre:'Difusa (++++)', texto:'Intensidad difusa (++++)', siguiente: pasoReinervacion_Subaguda },
]}
const pasoB2_Subaguda:Jerarquia = { titulo:'Nivel', seleccionMultiple:false, opciones:[
  { nombre:'Cervical', texto:'Cervical', siguiente:pasoC_Subaguda },
  { nombre:'Torácica', texto:'Torácica', siguiente:pasoC_Subaguda },
  { nombre:'Lumbosacro', texto:'Lumbosacro', siguiente:pasoC_Subaguda },
  // { nombre:'Polisegmentario', texto:'Polisegmentaria', siguiente:pasoC_Subaguda },
]} ;

/* -------- Sensitiva -------- */
const pasoE3_Sensitiva:Jerarquia = { titulo:'IMÁGENES Y EXPORTACIÓN', seleccionMultiple:false, opciones:[] };
const pasoS1_Sensitiva:Jerarquia = { titulo:'Nivel', seleccionMultiple:false, opciones:[{ nombre:'C6-C7', texto:'C6-C7', siguiente:pasoE3_Sensitiva },{ nombre:'S1',    texto:'S1',    siguiente:pasoE3_Sensitiva },]};
const pasoPatologia_Sensitiva:Jerarquia = {titulo:'Patología', seleccionMultiple:false,opciones:[{ nombre:'Bloqueo', texto:'Patología Bloqueo', siguiente: pasoS1_Sensitiva },{ nombre:'Retardo', texto:'Patología Retardo', siguiente: pasoS1_Sensitiva },],};
/* -------- Crónica -------- */
const pasoG_Cronica:Jerarquia = { titulo:'Pronóstico', seleccionMultiple:false, opciones:[
  { nombre:'Completa',           texto:'Pronóstico Recuperación completa',                 siguiente:pasoE },
  { nombre:'Parcial funcional',  texto:'Pronóstico Recuperación parcial funcional',        siguiente:pasoE },
  { nombre:'Pobre no funcional', texto:'Pronóstico Recuperación pobre no funcional',       siguiente:pasoE },
  { nombre:'Nula (secuela)',     texto:'Pronóstico Recuperación nula (en fase de secuela)', siguiente:pasoE },
]};
const pasoF_Cronica:Jerarquia = { titulo:'Reinervación', seleccionMultiple:false, opciones:[
  { nombre:'Abundante', texto:'con reinervación colateral abundante', siguiente:pasoG_Cronica },
  { nombre:'Mínima',    texto:'con reinervación colateral mínima',    siguiente:pasoG_Cronica },
  { nombre:'Ausente',   texto:'sin reinervación colateral',           siguiente:pasoG_Cronica },
]};
const pasoE1_Cronica:Jerarquia = { titulo:'Progresión', seleccionMultiple:false, opciones:[
  { nombre:'Con progresión', texto:'con progresión distal a miotomas', siguiente:pasoF_Cronica },
  { nombre:'Sin progresión', texto:'sin progresión distal a miotomas', siguiente:pasoF_Cronica },
]};
const pasoD1_Cronica:Jerarquia = { titulo:'Intensidad', seleccionMultiple:false, opciones:[
  { nombre:'Leve (+/+)',    texto:'Intensidad leve (+/+)',    siguiente:pasoE1_Cronica },
  { nombre:'Moderada (++)', texto:'Intensidad moderada (++)', siguiente:pasoE1_Cronica },
  { nombre:'Severa (+++)',  texto:'Intensidad severa (+++)',  siguiente:pasoE1_Cronica },
  { nombre:'Difusa (++++)', texto:'Intensidad difusa (++++)', siguiente:pasoE1_Cronica },
]};
const pasoB1_Cronica:Jerarquia = { titulo:'Nivel', seleccionMultiple:false, opciones:[
  { nombre:'Cervical', texto:'Cervical', siguiente:pasoD1_Cronica },
  { nombre:'Torácica', texto:'Torácica', siguiente:pasoD1_Cronica },
  { nombre:'Lumbosacro', texto:'Lumbosacro', siguiente:pasoD1_Cronica },
  // { nombre:'Polisegmentario', texto:'Polisegmentaria', siguiente:pasoD1_Cronica },
]};
const pasoC1_Cronica:Jerarquia = { titulo:'Fase', seleccionMultiple:false, opciones:[
  { nombre:'Activa',   texto:' Activa',   siguiente:pasoB1_Cronica },
  { nombre:'Inactiva', texto:' Inactiva', siguiente:pasoB1_Cronica },
  { nombre:'Antigua',  texto:' Antigua',  siguiente:pasoB1_Cronica },
  // { nombre:'Sensitiva', texto:' Sensitiva', siguiente:pasoS1_Sensitiva },
]};
 /* -------- Crónica agudizada -------- */
/**
 */
const pasoB1_CroAgu: Jerarquia = {
  titulo: 'Nivel',
  seleccionMultiple: false,
  opciones: [],                    
};

const pasoZ_CroAgu: Jerarquia = {
  titulo: 'Nivel',
  seleccionMultiple: false,
  opciones: pasoB1_CroAgu.opciones,   // ← ya existe, no hay error
};

pasoB1_CroAgu.opciones.push(
  { nombre:'Cervical',        texto:'Cervical',        siguiente: pasoZ_CroAgu },
  { nombre:'Torácica',        texto:'Torácica',        siguiente: pasoZ_CroAgu },
  { nombre:'Lumbosacro',      texto:'Lumbosacro',      siguiente: pasoZ_CroAgu },
  // { nombre:'Polisegmentario', texto:'Polisegmentaria', siguiente: pasoZ_CroAgu },
);
// ── Alias para que Crónica agudizada 
const pasoC1_CroAgu: Jerarquia = pasoB1_CroAgu;
/* -------------------------------------------------------------------------- */
/* 3) Raíz */
const arbolRaiz:Jerarquia = { titulo:'Evolución', seleccionMultiple:false, opciones:[
  { nombre:'Aguda',     texto:'Radiculopatía aguda',     siguiente:pasoB_Aguda },
  { nombre:'Subaguda',  texto:'Radiculopatía subaguda',  siguiente:pasoB2_Subaguda },
  { nombre:'Crónica',   texto:'Radiculopatía crónica',   siguiente:pasoC1_Cronica },
  { nombre:'Crónica agudizada', texto:'RADICULOPATÍA CRÓNICA', siguiente:pasoC1_CroAgu },
 { nombre:'Sensitiva', texto:'Radiculopatía sensitiva', siguiente: pasoPatologia_Sensitiva },]};

/* -------------------------------------------------------------------------- */
/* Hook para navegar en el árbol */
function useHierarchyFlow(initial: Jerarquia) {
  const [ruta, setRuta] = useState<Jerarquia[]>([initial]);

  const nivelActual = ruta[ruta.length - 1];

  /* avanzar un nodo */
  const avanzar = (op: OpcionJerarquia) => {
    if (op.siguiente) setRuta(prev => [...prev, op.siguiente!]);
  };
  const retroceder = () => {
    setRuta(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
  };
  const resetRuta = () => setRuta([initial]);
  return { nivelActual, avanzar, retroceder, resetRuta };
}

const ExportLeftLista: React.FC<{
  onOpenGallery: () => void;
  comentario: string;
  setComentario: (v: string) => void;
  selected: boolean;
  preview?: ImageSourcePropType | null;
  onClear?: () => void;
  ar?: number | null;
  comentarioHeight: number;
  setComentarioHeight: (h: number) => void;
  onOpenModal: () => void; // para abrir el modal de comentarios
}> = ({ onOpenGallery, comentario, setComentario, selected, preview, onClear, ar, comentarioHeight, setComentarioHeight, onOpenModal }) => (
  <View style={{ alignSelf: 'stretch'  }}>
    <TouchableOpacity onPress={onOpenGallery} style={styles.BotonReporte}>
      <FI
        source={require('../../../assets/tecnicas/Info/I_Tabla_Gris.png')}
        style={styles.backgroundBoton}
        imageStyle={styles.imagenFondoBoton}
         fadeDuration={0}
         {...GPU}
      />
    </TouchableOpacity>

    {selected ? (
      <View style={{ alignSelf:'center', alignItems:'center', marginBottom: 10 }}>
        <Text style={{ color:'#4ade80', fontWeight:'600' }}>✓ Imagen seleccionada</Text>
       {!!preview && (
        <Image
          source={preview}
          style={{
              width: 120,
              height: undefined,       
              aspectRatio: ar ?? 16/10, 
              marginTop: 6,
              borderRadius: 6
            }}
            resizeMode="contain" 
            {...GPU}
          />
        )}

        {!!onClear && (
          <TouchableOpacity onPress={onClear} style={{ marginTop: 6 }}>
            <Text style={{ color:'#ff7676' }}>Quitar imagen</Text>
          </TouchableOpacity>
        )}
      </View>
    ) : (
      <Text style={{ alignSelf:'center', color:'#bbb', marginBottom:10 }}>Sin imagen seleccionada</Text>
    )}
    <View style={{ marginBottom: 40, paddingHorizontal: 12 }}>
    {/* Vista previa del comentario con ScrollView */}
    {comentario && (
      <View style={{
        backgroundColor: '#2a2a2a',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#444',
        maxHeight: 110, //  Altura máxima para activar scroll
      }}>
        <ScrollView 
          style={{ maxHeight: 120 }}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={true}
        >
          <Text style={{
            color: '#bbb',
            fontSize: 13,
            lineHeight: 18,
            fontStyle: 'italic',
          }}>
            {comentario}
          </Text>
        </ScrollView>
      </View>
    )}
    {/* ✅ Botón para abrir el modal */}
    <TouchableOpacity
      onPress={onOpenModal}
      style={{
         backgroundColor: '#ff4500',
        paddingVertical: 12,
        width: '50%',
        alignSelf: 'center',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ff4500',
        alignItems: 'center',
        marginBottom: -30,
        marginTop: 18,
      }}
    >
      <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
        {comentario ? 'Editar Comentario' : 'Agregar Comentario'}
      </Text>
    </TouchableOpacity>
    </View>
  </View>
);

/* -------------------------------------------------------------------------- */
/* Componente principal */
export default function ReporteRadiculopatiaScreen():JSX.Element{
  const [isPendingProg, startTransition] = React.useTransition();
const exportRef = useRef<View>(null);
const [exporting, setExporting] = useState(false);
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

// Configuración PDF dinámica según plantilla seleccionada
const pdf = React.useMemo(() => getPdfConfig(plantillaId), [plantillaId]);

// 🔒 Polisegmentaria: overlays que deben persistir (POST/ANT)
const [polLock, setPolLock] = useState<{ post:any[]; ant:any[] }>({ post:[], ant:[] });
const { nivelActual, avanzar, retroceder, resetRuta } = useHierarchyFlow(arbolRaiz);  
const [imgSize, setImgSize] = useState<{w: number; h: number} | null>(null);
// estados del componente
const [pdfOrientation, setPdfOrientation] = useState<'landscape'|'portrait'>('landscape');
const [agudiTargetNivel, setAgudiTargetNivel] = useState<string | null>(null);
// debajo de otros useState del flujo
const [sensPatologia, setSensPatologia] = useState<'Bloqueo'|'Retardo'|null>(null);
type FiguraLocal = Figura & { vista: 'post' | 'ant' };
const [figuras, setFiguras] = useState<FiguraLocal[]>([]);
const [limitesContenedor, setLimitesContenedor] = useState({ width: 0, height: 0 });
const [nombrePaciente, setNombrePaciente] = useState('');
const [rerenderKey, setRerenderKey] = useState(0);
// ¿pintar músculos en Crónica agudizada?
const [croAguConProgresion, setCroAguConProgresion] = useState(false);
const [mostrarGaleria, setMostrarGaleria] = useState(false);
const [userData, setUserData] = useState<UserData | null>(null);
 const [imgListaAR, setImgListaAR] = useState<number | null>(null);
 const [ubicacionPreview, setUbicacionPreview] = useState<string | null>(null);
 const [mountExport, setMountExport] = useState(false);

 /** === Nombres bonitos y consistentes (Miopatía) === */
const STUDY_KEY = 'Radiculopatia';                 // sin acentos
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



 const waitForFiguresDecode = async (which: 'post'|'ant') => {
  const list = figuras.filter(f => f.vista === which);
  await Promise.all(
    list.map(f => new Promise<void>(resolve => {
      const uri = f.uri || '';
      const done = () => resolve();
      // remotas
      if (/^https?:\/\//.test(uri)) {
        Image.prefetch(uri).then(done).catch(done);
        setTimeout(done, 800); // red de respaldo
        return;
      }
      // locales (file:// o ruta)
      const p = uri.replace(/^file:\/\//, '');
      Image.getSize(p, () => done(), () => done());
      setTimeout(done, 300); // respaldo rápido
    }))
  );
};
const mountExportAnd = async (fn: () => Promise<void>) => {
  setMountExport(true);
  await new Promise<void>(r => requestAnimationFrame(() => r()));
  await new Promise<void>(r => setTimeout(r, 150)); // Aumentado para asegurar decodificación de imágenes
  try { await fn(); } finally { setMountExport(false); }
};

// ANTES: <Image ... />
// DESPUÉS:
const LockedMultiOverlay = React.memo(function LockedMultiOverlay({
  visible, layers,
}: { visible: boolean; layers: any[] }) {
  if (!visible || !layers?.length) return null;
  return (
    <>
      {layers.map((src, i) => (
        <FI key={i} source={src} style={styles.overlayImage} />
      ))}
    </>
  );
});



type Tab = 'reporte' | 'lista';
const INTENSITY_SIGNS: Record<'leve'|'moderada'|'severa'|'difusa', string> = {
  leve: '(+/+)',
  moderada: '(++)',
  severa: '(+++)',
  difusa: '(++++)',
};

// 🔎 devuelve "leve (+/+)" o "moderada (++)", etc., **conservando** cualquier texto que siga
const parseIntensidadConParentesis = (txt: string) => {
  const s = (txt || '').trim();
  const low = s.toLowerCase();
  const key =
    low.includes('leve')     ? 'leve'     :
    low.includes('moderada') ? 'moderada' :
    low.includes('severa')   ? 'severa'   :
    low.includes('difusa')   ? 'difusa'   :
    '';
  if (!key) return s;
  const yaTraeParens = /\(.+?\)/.test(low);
  const signos = yaTraeParens
    ? (s.match(/\(.+?\)/)?.[0] || INTENSITY_SIGNS[key as keyof typeof INTENSITY_SIGNS])
    : INTENSITY_SIGNS[key as keyof typeof INTENSITY_SIGNS];
  const tail = s.replace(new RegExp(`^\\s*(${key})\\s*(\\(.+?\\))?\\s*`, 'i'), '').trim();
  const base = `${key} ${signos}`;
  return tail ? `${base} ${tail}` : base;
};
// 🅰️ capitaliza primera letra (sin tocar paréntesis)
const capWord = (w: string) => w ? w.charAt(0).toUpperCase() + w.slice(1) : w;
            // helper para obtener AR según sea require(...) o uri
            const setImgLista = (src: string | ImageSourcePropType) => {
              const source = toImageSource(src);
              setImgListaSrc(source);
            
              try {
                if (typeof src === 'string') {
                  Image.getSize(src, (w, h) => setImgListaAR(w / h), () => setImgListaAR(null));
                } else {
                  const r = Image.resolveAssetSource(src);
                  if (r?.width && r?.height) setImgListaAR(r.width / r.height || null);
                  else setImgListaAR(null);
                }
              } catch { setImgListaAR(null); }
              setActiveTab('lista');
              setMostrarGaleria(false);
            };


useEffect(() => {
   (async () => {
    try {
      const token = await AsyncStorage.getItem('token'); // ← Asegúrate que es la misma key
      if (!token) return;
      const res = await axios.post(`${BASE_URL}/userdata`, { token });
      const ud = res?.data?.data;
      if (ud) {
        setUserData(ud);
        if (ud.imageUrl) {
          Image.prefetch(ud.imageUrl).catch(() => {});
        }
      }
    } catch (e) {
      console.warn('No se pudo obtener el usuario para el PDF', e);
    }
  })();
}, []);

useEffect(() => {
  // convier­te require(...) -> uri
  const asUri = (src: any) => {
    try {
      const r = Image.resolveAssetSource(src);
      return r?.uri ? { uri: r.uri, cache: FastImage.cacheControl.immutable, priority: FastImage.priority.low } : null;
    } catch { return null; }
  };

  const uniqBy = <T extends { uri: string }>(arr: T[]) => {
    const seen = new Set<string>(); const out: T[] = [];
    for (const it of arr) { if (it && !seen.has(it.uri)) { seen.add(it.uri); out.push(it); } }
    return out;
  };

  // 1) bases y overlays polisegmentarios
  const statics = [
    IMG_POST, IMG_ANT, IMG_POST_SENS, IMG_ANT_SENS,
    OV_CERV_POST, OV_CERV_ANT, OV_TORAX_POST, OV_TORAX_ANT, OV_LUMBO_POST, OV_LUMBO_ANT,
    ...Object.values(CROSS_IMG),
    ...Object.values(CROSS_RED_IMG),
  ];

  // 2) overlays por nivel (OVERLAYS.{lvl}.{post|ant}.{L1..R4})
  Object.values(OVERLAYS).forEach(m => {
    ['post','ant'].forEach((vista) => {
      Object.values((m as any)[vista] || {}).forEach((img: any) => { if (img) statics.push(img); });
    });
  });

  const preload = uniqBy(statics.map(asUri).filter(Boolean) as any[]);
  if (preload.length) FastImage.preload(preload);
}, []);


const flushBeforeCapture = async () => {
  Keyboard.dismiss();
  if (userData?.imageUrl) { try { await Image.prefetch(userData.imageUrl); } catch {} }

  // Precargar imágenes base para asegurar que se rendericen en el PDF
  try {
    const baseImages = [IMG_POST, IMG_ANT, IMG_POST_TR, IMG_ANT_TR, IMG_POST_SENS, IMG_ANT_SENS, IMG_POST_SENS_TR, IMG_ANT_SENS_TR];

    // Precarga especial para imágenes transparentes con FastImage
    const transparentImages = [IMG_POST_TR, IMG_ANT_TR, IMG_POST_SENS_TR, IMG_ANT_SENS_TR];
    const transparentSources = transparentImages.map(img => {
      const resolved = Image.resolveAssetSource(img);
      return resolved?.uri ? {
        uri: resolved.uri,
        priority: FastImage.priority.high,
        cache: FastImage.cacheControl.immutable
      } : null;
    }).filter(Boolean) as any[];

    if (transparentSources.length > 0) {
      FastImage.preload(transparentSources);
    }

    // Prefetch adicional con Image nativo para todas las bases
    await Promise.all(baseImages.map(img => {
      const resolved = Image.resolveAssetSource(img);
      return resolved?.uri ? Image.prefetch(resolved.uri).catch(() => {}) : Promise.resolve();
    }));
  } catch {}

  await new Promise<void>(r => InteractionManager.runAfterInteractions(() => r()));
  await new Promise<void>(r => requestAnimationFrame(() => r()));
  await new Promise<void>(r => requestAnimationFrame(() => r())); // 👈 extra rAF
  await new Promise<void>(r => requestAnimationFrame(() => r())); // 👈 extra rAF adicional
  await new Promise<void>(r => setTimeout(r, 200));                // 👈 aumentado a 200ms para dar tiempo a transparencias
};


  const FooterInfo: React.FC = () => (
  <View style={{ paddingVertical: px(pdf.footer.padV) }}>
    <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'center', flexWrap:'wrap' }}>
      {/* Usuario */}
      <View style={{ flexDirection:'row', alignItems:'center', marginHorizontal: px(pdf.footer.itemGap), marginVertical: 4 }}>
        <Svg width={px(pdf.footer.icon)} height={px(pdf.footer.icon)} viewBox="0 0 24 24" fill="#000">
          <Path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 
                   1.79-4 4 1.79 4 4 4zm0 2c-2.67 
                   0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </Svg>
        <Text numberOfLines={1} style={{ color:'#000', fontSize: px(pdf.footer.text), marginLeft: px(pdf.footer.iconTextGap) }}>
          {`${userData?.name || ''} ${userData?.lastname || ''}`.trim()}
        </Text>
      </View>

      {/* Email */}
      <View style={{ flexDirection:'row', alignItems:'center', marginHorizontal: px(pdf.footer.itemGap), marginVertical: 4 }}>
        <Svg width={px(pdf.footer.icon)} height={px(pdf.footer.icon)} viewBox="0 0 24 24" fill="#000">
          <Path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 
                   2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
        </Svg>
        <Text numberOfLines={1} style={{ color:'#000', fontSize: px(pdf.footer.text), marginLeft: px(pdf.footer.iconTextGap) }}>
          {userData?.email || ''}
        </Text>
      </View>

      {/* Especialidad */}
      <View style={{ flexDirection:'row', alignItems:'center', marginHorizontal: px(pdf.footer.itemGap), marginVertical: 4 }}>
        <Svg width={px(pdf.footer.icon)} height={px(pdf.footer.icon)} viewBox="0 0 90 90" fill="#000">
          <Path d="M45.12,61.02c0,0,0,7.32-4.79,7.32h-8.68c-1.82,0-3.29-1.47-3.29-3.29
                   c0,0-2.39-8.68-2.65-8.68l-2.88-1.21c-1.57-0.66-2.31-2.46-1.66-4.03l4.8-9.65v-0.67
                   c0-11.9,9.65-21.55,21.55-21.55s21.55,9.65,21.55,21.55c0,5.12-1.8,9.84-4.79,13.54v16.39" />
        </Svg>
        <Text numberOfLines={1} style={{ color:'#000', fontSize: px(pdf.footer.text), marginLeft: px(pdf.footer.iconTextGap) }}>
          {userData?.specialty || ''}
        </Text>
      </View>

      {/* Cédula */}
      <View style={{ flexDirection:'row', alignItems:'center', marginHorizontal: px(pdf.footer.itemGap), marginVertical: 4 }}>
        <Svg width={px(pdf.footer.icon)} height={px(pdf.footer.icon)} viewBox="0 0 24 24" fill="#000">
          <Path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 
                   0 2-.9 2-2V4c-1.1-.9-2-2-2-2zm-2 2l-6 3.99L6 4h12z"/>
        </Svg>
        <Text numberOfLines={1} style={{ color:'#000', fontSize: px(pdf.footer.text), marginLeft: px(pdf.footer.iconTextGap) }}>
          {userData?.idprofessional || ''}
        </Text>
      </View>
    </View>
  </View>
);

const exportRefP1 = useRef<View>(null); // ✅ HOJA 1 combinada (POST + ANT)
const exportRefP2 = useRef<View>(null); // ✅ HOJA 2 (dejamos ANT sola o detalles)

useEffect(() => {
  (async () => {
    try {
      // intenta leer del AsyncStorage (ajusta la clave si usas otra)
      const raw = await AsyncStorage.getItem('userData');
      if (raw) {
        setUserData(JSON.parse(raw));
      } else {
        setUserData(null);
      }
    } catch {
      setUserData(null);
    }
  })();
}, []);

// TAB "lista"
const [imgListaSrc, setImgListaSrc] = useState<ImageSourcePropType | null>(null);
const [comentarioLista, setComentarioLista] = useState('');
const [comentarioHeight, setComentarioHeight] = useState(MIN_COMENTARIO_HEIGHT);
const [exportKey, setExportKey] = useState(0);
const [exportSuccess, setExportSuccess] = useState<{ filename: string; path: string } | null>(null);

// Auto-ajustar altura del comentario cuando está vacío
useEffect(() => {
  if (comentarioLista.length === 0) {
    setComentarioHeight(MIN_COMENTARIO_HEIGHT);
  }
}, [comentarioLista]);

const fromGallery = (src: any): ImageSourcePropType | null => {
  if (!src) return null;
  if (typeof src === 'number') return src; // require(...)
  if (typeof src === 'string') return { uri: src };
  if (src?.uri)  return { uri: String(src.uri) };
  if (src?.path) return { uri: String(src.path) };
  return null;
};
// ✅ abre la galería embebida (GaleriaEmergente)
const onOpenGallery = () => setMostrarGaleria(true);

// en openExportMenu()
const openExportMenu = () => {
  if (exporting) return;
  handleExportRequest();
};
useEffect(() => {
  if (!exporting) return;                 
  const id = setInterval(() => {
    setRerenderKey(k => k + 1);          
  }, 1000);                               
  return () => clearInterval(id);         
}, [exporting]);

  /* --------------------------- Reporte --------------------------- */

  const [activeTab, setActiveTab] = useState<'reporte'|'lista'|'GenerarLink'>('reporte');
  const [resumenLista,setResumenLista] = useState<string[]>([]);
  const [resumenTexto,setResumenTexto] = useState<string>('');
  const [flowType,setFlowType]         = useState<string>(''); // Aguda / Subaguda / Crónica / Sensitiva
  const TITLE_EXPORT = 'IMÁGENES Y EXPORTACIÓN'

 
const reportFileName = () => {
  const base = buildBaseName(nombrePaciente);
  return `${base}.pdf`; // mEDXproMiopatia_<...>.pdf
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

const generateShareLink: LinkUploaderProps['onGenerateLink'] = async ({
  files, title, message, expiry, onFileProgress, templateId,
}) => {
  const studyType  = 'Radiculopatía';
  const doctorName = [userData?.name, userData?.lastname].filter(Boolean).join(' ') || undefined;
  const expSeconds = expiry === '24h' ? 60 * 60 * 24 : 60 * 60 * 24 * 5;

  const defaultTitle = `${studyType} – ${nombrePaciente || 'Paciente'}${doctorName ? ` – ${doctorName}` : ''}`;
  const finalTitle   = (title?.trim() || defaultTitle).slice(0, 140);
  const finalMessage = (message?.trim())
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
    patient: nombrePaciente || null,
    doctor:  doctorName || null,
    studyType,
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
  const patientFolder = safeName(nombrePaciente || 'Paciente');
  const reportPath = `${patientFolder}/${uuid.v4()}_${reportName}`;

  const up1 = await supabase.storage.from(BUCKET).upload(reportPath, reportAb, {
    contentType: 'application/pdf', upsert: false,
  });
  if (up1.error) throw new Error(`Error subiendo reporte: ${up1.error.message}`);
  onFileProgress?.('__auto_report__', 1);

  const uploadedForDB = [{
    name: reportName,
    mime_type: 'application/pdf',
    size_bytes: reportAb.byteLength,
    storage_path: up1.data.path,
  }];

  // 3) Adjuntos extra (si hubiese)
  const processed = new Set<string>();
  for (const file of files || []) {
    if (!file || file.id === '__auto_report__' || processed.has(file.id)) continue;
    processed.add(file.id);

    const local = (file as any).fileCopyUri || file.uri;
    const ab    = await readAsArrayBuffer(local);
    onFileProgress?.(file.id, 0);

    const safeNameFile = sanitizeFilename(file.name || `archivo_${Date.now()}`);
    const objectPath   = `${patientFolder}/${uuid.v4()}_${safeNameFile}`;

    const { data, error } = await supabase.storage.from(BUCKET).upload(objectPath, ab, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });
    if (error) throw new Error(`Error subiendo ${file.name}: ${error.message}`);
    onFileProgress?.(file.id, 1);

    uploadedForDB.push({
      name: safeNameFile,
      mime_type: file.type || 'application/octet-stream',
      size_bytes: (file as any).size || ab.byteLength,
      storage_path: data.path,
    });
  }

  // 4) Completar link y devolver URL
  const done = await completeShareLink({ linkId, files: uploadedForDB });
  if (!done.ok) throw new Error(done.error);
  return done.url;
};


    // si src es string -> { uri: string } ; si es require(...) -> tal cual
  const toImageSource = (src: string | ImageSourcePropType): ImageSourcePropType =>
    typeof src === 'string' ? { uri: src } : src;


// ── Pronóstico: canoniza cualquier variante a las 4 salidas pedidas
const canonicalizePrognosis = (raw: string): string => {
  const s = raw.toLowerCase();
  if (s.includes('complet')) return 'Recuperación completa';
  if (s.includes('parcial')) return 'Recuperación parcial funcional';
  if (s.includes('pobre'))   return 'Recuperación pobre no funcional';
  if (s.includes('nula') || s.includes('nulo')) return 'Recuperación nula (en fase de secuela)';
  return 'Recuperación completa'; // fallback razonable
};

// dentro de ReporteRadiculopatiaScreen(), debajo de helpers y antes del return
const exportarPDF = async (
  orient: 'landscape' | 'portrait' = 'landscape',
  setOrient = false
) => {

  try {
    await flushBeforeCapture();
    await waitForFiguresDecode('post');
    await waitForFiguresDecode('ant');
    setExporting(true);
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    await new Promise<void>((r) => setTimeout(r, 30));

    const studyType = 'Radiculopatía';
    const doctorName = [userData?.name, userData?.lastname].filter(Boolean).join(' ') || undefined;
    const ab = await buildReportPdfArrayBuffer({ studyType, doctorName, templateId: plantillaId });
    const pdfBase64 = b64encode(ab);

    // 3) Guardado (igual que ya tienes)
    const filename = reportFileName();  // mEDXproMiopatia_<...>.pdf

    if (Platform.OS === 'android' && Platform.Version <= 28) {
      const w = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
      if (w !== PermissionsAndroid.RESULTS.GRANTED) throw new Error('WRITE_EXTERNAL_STORAGE no otorgado');
    }

    const RNBU: any = ReactNativeBlobUtil;
    const tmpPath = `${RNBU.fs.dirs.CacheDir}/${filename}`;
    await RNBU.fs.writeFile(tmpPath, pdfBase64, 'base64');

    const outPath = Platform.OS === 'android'
      ? `${RNBU.fs.dirs.DownloadDir}/${filename}`
      : `${RNBU.fs.dirs.DocumentDir}/${filename}`;

    try { await RNBU.fs.cp(tmpPath, outPath); }
    catch { await RNBU.fs.writeFile(outPath, pdfBase64, 'base64'); }

    await RNBU.fs.scanFile([{ path: outPath, mime: 'application/pdf' }]);
    ReactNativeBlobUtil.android?.addCompleteDownload?.({
      title: filename, description: 'Reporte descargado', mime: 'application/pdf',
      path: outPath, showNotification: true,
    });

    // Mostrar modal de éxito
    setExportSuccess({ filename, path: outPath });
  } catch (e: any) {
    Alert.alert('Error', `No se pudo exportar el PDF.\n\n${e?.message || String(e)}`);
  } finally {
    setExporting(false);
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

const buildReportPdfArrayBuffer = async (
  { studyType, doctorName, templateId }: { 
    studyType: string; 
    doctorName?: string; 
    templateId?: PlantillaId | null 
  }
): Promise<ArrayBuffer> => {
  let out: ArrayBuffer | null = null;

  await mountExportAnd(async () => {
    if (!imgSize || !exportRefP1.current || !exportRefP2.current) {
      throw new Error('Las páginas de exportación no están listas.');
    }

    await flushBeforeCapture();
    await new Promise<void>(r => requestAnimationFrame(() => r()));
    await new Promise<void>(r => requestAnimationFrame(() => r()));

    // Precargar y esperar a que las bases se carguen completamente
    const basesToPreload = templateId && templateId !== 'none'
      ? [IMG_POST_TR, IMG_ANT_TR, IMG_POST_SENS_TR, IMG_ANT_SENS_TR]
      : [IMG_POST, IMG_ANT, IMG_POST_SENS, IMG_ANT_SENS];

    await Promise.all(basesToPreload.map(img => {
      const resolved = Image.resolveAssetSource(img);
      return resolved?.uri ? Image.prefetch(resolved.uri).catch(() => {}) : Promise.resolve();
    }));

    // Delay adicional para imágenes con transparencia (plantillas A, B, C)
    // Aumentado para asegurar que las bases se carguen completamente
    const delayTime = (templateId && templateId !== 'none') ? 500 : 300;
    await new Promise<void>(r => setTimeout(r, delayTime));

    // 1) Capturar ambas páginas con configuración optimizada
    const p1b64 = await captureRef(exportRefP1.current, {
      format: 'png',
      quality: 1,
      result: 'base64'
    });
    const p2b64 = await captureRef(exportRefP2.current, {
      format: 'png',
      quality: 1,
      result: 'base64'
    });

    // 2) Dimensiones A4 horizontal
    const A4W = 842;  // landscape width
    const A4H = 595;  // landscape height

    // 3) Configuración
    const config: PdfBuildConfig = {
      studyType,
      doctorName,
      templateId: templateId || plantillaId,
      patientName: nombrePaciente,
      Wpt: A4W,
      Hpt: A4H,
    };

    // 4) Construir PDF usando el servicio horizontal
    out = await buildPdfWithTemplate(
      { p1: p1b64, p2: p2b64 },
      config
    );
  });

  if (!out) throw new Error('No se pudo construir el PDF.');
  return out;
};


// Reemplaza TODO el componente FiguraExport por esta versión
// Reemplaza tu FiguraExport por esta versión
const FiguraExport: React.FC<{
  tipo: 'circle' | 'square';
  uri: string;
  x: number;
  y: number;
  size?: number;
  dx?: number;   // 👈 ajuste fino opcional
  dy?: number;   // 👈 ajuste fino opcional
}> = ({ tipo, uri, x, y, size, dx = 0, dy = 0 }) => {
  const uiBox = FIG.UI;             // tamaño con el que arrastraste
  const box   = size ?? FIG.PDF;    // tamaño con el que exportas
  const shift = (uiBox - box) / 2;  // centra si hay diferencia de tamaño

  // Agregar borde visible para que no se tape cuando está pegado al límite
  const borderWidth = 2;
  const borderColor = tipo === 'circle' ? 'transparent' : '#000';

  const left  = x + shift + dx;     // 👈 AHORA sí usamos left/top calculados
  const top   = y + shift + dy;
  const borderR = tipo === 'circle' ? box / 2 : 0;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left,
        top,
        width: box,
        height: box,
        borderRadius: borderR,
        borderWidth: borderWidth,
        borderColor: borderColor,
        overflow: 'hidden',
        backgroundColor: '#fff',
        // Agregar shadow para mayor visibilidad en los bordes
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
      }}
    >
      <Image
        source={{ uri }}
        style={{ width:'100%', height:'100%' }}
        resizeMode="cover"  // 'cover' asegura que la imagen llene el contenedor manteniéndose centrada
      />
    </View>
  );
};

const AutoFitDiagnostico: React.FC<{
  text: string; maxHeight: number; minSize?: number; maxSize?: number;
}> = ({ text, maxHeight, minSize = 9, maxSize = 13 }) => {
  const [size, setSize] = React.useState(maxSize);
  const [range, setRange] = React.useState<[number,number]>([minSize, maxSize]);
  const [done, setDone] = React.useState(false);

  const onTextLayout = (e: any) => {
    if (done) return;
    const lines = e?.nativeEvent?.lines?.length ?? 0;
    const lineH = Math.round(size * 1.25);
    const maxLines = Math.max(1, Math.floor(maxHeight / lineH));
    if (lines > maxLines) {
      // demasiado grande → baja mitad superior
      const [lo, hi] = range;
      const nextHi = size - 1;
      if (nextHi <= lo) return setDone(true);
      const mid = Math.floor((lo + nextHi) / 2);
      setRange([lo, nextHi]); setSize(mid);
    } else {
      // cabe → intenta subir un poco para apurar
      const [lo, hi] = range;
      const nextLo = size;
      if (nextLo >= hi) return setDone(true);
      const mid = Math.floor((nextLo + hi + 1) / 2);
      setRange([nextLo, hi]); setSize(mid);
    }
  };

  return (
    <Text onTextLayout={onTextLayout}
      style={[styles.exportReportTextBlack,{fontSize:size,lineHeight:Math.round(size*1.25)}]}>
      {text}
    </Text>
  );
};

// const PDF_FIX = { dxSquare: -45, dxCircle: -6, dy: 0 };
// Ajustes específicos por vista para corregir el renderizado en PDF
const PDF_FIX = {
  post: { dxSquare: 0, dxCircle: 0, dy: 0 },  // Base posterior: sin ajuste para mantener el cuadrado
  ant: { dxSquare: -20, dxCircle: 0, dy: 0 }  // Base anterior: ajuste original
};
const CanvasView = ({
  vistaForExport,
  includeFigures = false,   // por defecto NO pinta figuras
  transparentBg = false,     // usar imágenes con fondo transparente
}: {
  vistaForExport: 'post' | 'ant';
  includeFigures?: boolean;
  transparentBg?: boolean;
}) => {
  if (!imgSize) return null;

  // Base según flujo (Sensitiva o Multinivel) y vista exportada
  const base = (() => {
    if (vistaForExport === 'post') {
      if (flowType === 'Sensitiva') {
        return transparentBg ? IMG_POST_SENS_TR : IMG_POST_SENS;
      }
      return transparentBg ? IMG_POST_TR : IMG_POST;
    } else {
      if (flowType === 'Sensitiva') {
        return transparentBg ? IMG_ANT_SENS_TR : IMG_ANT_SENS;
      }
      return transparentBg ? IMG_ANT_TR : IMG_ANT;
    }
  })();

  // Área realmente dibujada (para alinear overlays/cruces)
  const drawn = useMemo(
    () => getDrawnRect(imgSize, base as ImageSourcePropType),
    [imgSize, base]
  );

  // Overlays SENSITIVOS calculados con la vista exportada
  const sensOverlaysForExport = useMemo(() => {
    if (flowType !== 'Sensitiva') return [];
    return (['C6-C7','S1'] as const).flatMap((lvl) => {
      const side = selectedSensitiva[lvl];
      if (!side) return [];
      const map = SENS_OVERLAYS[lvl as 'C6-C7'|'S1']?.[vistaForExport];
      if (!map) return [];
      if (side === 'Bilateral') {
        return map.Bilateral
          ? [{ key: `${lvl}_Bilat_${vistaForExport}`, src: map.Bilateral }]
          : [
              { key: `${lvl}_Izq_${vistaForExport}`, src: map.Izquierda },
              { key: `${lvl}_Der_${vistaForExport}`, src: map.Derecha   },
            ];
      }
      return [{ key: `${lvl}_${side}_${vistaForExport}`, src: map[side as 'Izquierda'|'Derecha'] }];
    }).filter(o => o.src);
  }, [flowType, selectedSensitiva, vistaForExport]);

  // 🔥 Lista única de capas por flujo, deduplicada por lado (L/R)

  const baseFlags = useMemo(() => {
    return toSideFlags([
      ...checkedLeftC,
      ...checkedRightC,
      ...checkedLeftL,
      ...checkedRightL,
    ]);
  }, [checkedLeftC, checkedRightC, checkedLeftL, checkedRightL]);

  const agudiFlags = useMemo(() => {
    return toSideFlags([
      ...checkedLeftC_A,
      ...checkedRightC_A,
      ...checkedLeftL_A,
      ...checkedRightL_A,
    ]);
  }, [checkedLeftC_A, checkedRightC_A, checkedLeftL_A, checkedRightL_A]);

  const uiFlags = useMemo(() => {
    const merged: Record<string, SideFlags> = {};
    mergeSideFlagMaps(merged, baseFlags);
    if (flowType === 'Crónica agudizada') {
      mergeSideFlagMaps(merged, agudiFlags);
    }
    return merged;
  }, [baseFlags, agudiFlags, flowType]);


const flowLayers = useMemo(() => {
  const layers: { key: string; src: any }[] = [];
  const push = (src: any, key: string) => { if (src) layers.push({ key, src }); };

  // Sensitiva: igual que ya tienes
  if (flowType === 'Sensitiva') {
    sensOverlaysForExport.forEach(({ src, key }) => push(src, key));
    return layers;
  }

  // Solo aplica a Subaguda / Crónica / Crónica agudizada
  if (flowType !== 'Subaguda' && flowType !== 'Crónica' && flowType !== 'Crónica agudizada') {
    return layers;
  }

  const combined: Record<string, SideFlags> = {};
  mergeSideFlagMaps(combined, uiFlags);
  if (flowType === 'Crónica' || flowType === 'Crónica agudizada') {
    mergeSideFlagMaps(combined, fullSide);
  }
  if (flowType === 'Crónica agudizada' && (croAguConProgresion || Object.keys(agudiFlags).length)) {
    mergeSideFlagMaps(combined, agudiFlags);
  }

  const sortedLevels = Object.keys(combined).sort((a, b) => {
    const pa = LEVEL_PRIORITY[a] ?? 999;
    const pb = LEVEL_PRIORITY[b] ?? 999;
    return pa - pb || a.localeCompare(b);
  });

  sortedLevels.forEach(lvl => {
    const flags    = combined[lvl];
    const primary  = OVERLAYS[lvl]?.[vistaForExport];
    const fallback = OVERLAYS[lvl]?.[vistaForExport === 'post' ? 'ant' : 'post'];

    // 👉 En ANTERIOR: NUNCA hacer fallback.
    // 👉 En POSTERIOR: puedes permitir fallback opcionalmente.
    const pick = (sideKey: Key) => {
      const prim = primary?.[sideKey] ?? null;
      if (vistaForExport === 'ant') return prim;               // sin fallback
      return prim ?? fallback?.[sideKey] ?? null;               // con fallback solo en 'post'
    };

    const srcL = pick('L1');
    const srcR = pick('R1');

    if (flags?.L && srcL) push(srcL, `${lvl}_L`);
    if (flags?.R && srcR) push(srcR, `${lvl}_R`);
  });

  return layers;
}, [
  flowType,
  vistaForExport,
  uiFlags,
  fullSide,
  croAguConProgresion,
  agudiFlags,
  sensOverlaysForExport,
]);


  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'visible',
        backgroundColor: transparentBg ? 'transparent' : '#fff'
      }}
      collapsable={false}
      removeClippedSubviews={false}
      needsOffscreenAlphaCompositing
      {...GPU}   // 👈 aquí
    >
      {/* Base */}
      <FI
        source={base}
        style={{ width:'100%', height:'100%', backgroundColor: 'transparent' }}
        imageStyle={{ resizeMode:'contain' }}
        resizeMode="contain"
        fadeDuration={0}
        defaultSource={base}
        priority="high"
        isTransparent={transparentBg}
        {...GPU}   // 👈 aquí
      />

      {/* Frame alineado al área dibujada */}
      <View
        pointerEvents="none"
        style={{ position:'absolute', left: drawn.x, top: drawn.y, width: drawn.w, height: drawn.h, overflow:'visible' }}
        removeClippedSubviews={false}
      >
        {showToracico && (
          <FI
            source={vistaForExport === 'post' ? OV_TORAX_POST : OV_TORAX_ANT}
            style={styles.overlayImage}
            fadeDuration={0}
            {...GPU}   // 👈 aquí
          />
        )}
       
  {showCervOverlay && (
    <FI
      source={vistaForExport === 'post' ? OV_CERV_POST : OV_CERV_ANT}
      style={styles.overlayImage}
      fadeDuration={0}
      {...GPU}   // 👈 aquí
    />
  )}

  {showLumboOverlay && (
    <FI
      source={vistaForExport === 'post' ? OV_LUMBO_POST : OV_LUMBO_ANT}
      style={styles.overlayImage}
      fadeDuration={0}
      {...GPU}   // 👈 aquí
    />
  )}
        {polLock && (
          <LockedMultiOverlay
            visible
            layers={vistaForExport === 'post' ? (polLock.post || []) : (polLock.ant || [])}
          />
        )}

        {/* 🔁 Overlays por flujo (YA deduplicados por lado) */}
      {flowLayers.map(({ key, src }) => (
   <MemoizedImage key={`ov_${vistaForExport}_${key}`} source={src} style={styles.overlayImage} />
 ))}

        {/* Cruces */}
        {[...activeCrossesBlack, ...activeCrossesRed]
          .filter(c => (vistaForExport === 'post' ? c.side === 'L' : c.side === 'R'))
          .map(({ key, src, topPct, offPct, side }) => {
            const topPx = topPct * drawn.h;
            const offPx = offPct * drawn.w;
            const style: ImageStyle = {
              position: 'absolute',
              top: topPx,
              [side === 'L' ? 'left' : 'right']: offPx,
              width: 60,
              height: 60,
              zIndex: 3,
              resizeMode: 'contain',
            } as any;
            return <FI key={`cv_${vistaForExport}_${key}`} source={src} style={style} />
          })}
      </View>

      {/* Figuras embebidas SOLO cuando se pida (exportación) */}
     {includeFigures && figuras
  .filter(f => f.vista === vistaForExport)
  .map(figura => {
    const ajustes = PDF_FIX[vistaForExport];  // Obtener ajustes específicos de la vista
    // Aplicar INSET para mantener los bordes visibles en el PDF
    const xWithInset = figura.posicion.x - drawn.x + FIG.INSET;
    const yWithInset = figura.posicion.y - drawn.y + FIG.INSET;
    return (
      <FiguraExport
        key={`exp_${figura.id}`}
        tipo={figura.tipo}
        uri={figura.uri}
        x={xWithInset}
        y={yWithInset}
        size={FIG.UI}
        dx={figura.tipo === 'square' ? ajustes.dxSquare : ajustes.dxCircle}
        dy={ajustes.dy}
      />
    );
  })
}
    </View>
  );
};

const MemoizedImage = React.memo(({ source, style }: { source: any; style: any }) => (
  <FI source={source} style={style} />
));

  // ───────────────────────── helpers globales ─────────────────────────
// >>> copiar/pegar tal cual (puedes extraerlos a un hook si quieres)
const pedirPermiso = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const permisos: Permission[] = [
        PermissionsAndroid.PERMISSIONS.CAMERA,
        Platform.Version >= 33
          ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
          : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      ];
      const granted = await PermissionsAndroid.requestMultiple(permisos);
      const camaraOk = granted['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED;
      const lecturaOk =
        Platform.Version >= 33
          ? granted['android.permission.READ_MEDIA_IMAGES'] === PermissionsAndroid.RESULTS.GRANTED
          : granted['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED;
      return camaraOk && lecturaOk;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true;
};

const manejarSeleccionImagen = async (tipo: 'circle' | 'square') => {
  const permiso = await pedirPermiso();
  if (!permiso) return;

  Alert.alert('Seleccionar Imagen', '¿Qué deseas hacer?', [
    {
      text: 'Tomar foto',
      onPress: async () => {
        const imagenEscaneada = await escanearImagen();
        if (imagenEscaneada) {
          agregarFigura(tipo, imagenEscaneada);
        } else {
          console.warn('No se pudo escanear la imagen');
        }
      },
    },
    {
      text: 'Galería',
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
    { text: 'Cancelar', style: 'cancel' },
  ]);
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
vista,
  };
  setFiguras((prev) => [...prev, nuevaFigura]);
};
const actualizarPosicion = React.useCallback((id: string, x: number, y: number) => {
  setFiguras(prev => prev.map(f => (f.id === id ? { ...f, posicion: { x, y } } : f)));
}, []);

const eliminarFigura = React.useCallback((id: string) => {
  setFiguras(prev => prev.filter(f => f.id !== id));
}, []);

/* Limpia TODOS los estados y vuelve a “Evolución” */
const resetAll = React.useCallback(() => {
 
  setPolLock({ post:[], ant:[] });   // limpia los locks polisegmentarios
  resetRuta();                
  setFlowType('');           
  setAgudiPhase(false);       
  setAgudiTargetNivel(null);   
  setCroAguConProgresion(false);
  setToracicoTxt(''); 
  setToracicoTxt_A('');         
  /* ④ resúmenes                                              */
  setResumenLista([]);
  setResumenTexto('');
  /* ⑤ selecciones cervicales                                */
  setCheckedLeftC([]);  setCheckedRightC([]);
  setCheckedLeftC_A([]);setCheckedRightC_A([]);
  /* ⑥ selecciones lumbares                                  */
  setCheckedLeftL([]);  setCheckedRightL([]);
  setCheckedLeftL_A([]);setCheckedRightL_A([]);
  /* ⑦ sensitiva                                             */
  setSelectedSensitiva({ 'C6-C7': null, S1: null });
  /* ⑧ polisegmentario / Torácica                            */
  setPolC(false); setPolT(false); setPolL(false);
  setToracicoTxt('');
  /* ⑨ UI                                                   */
  // setOverlayNivel(null);
  setExpandedNivel(null);
  setExpandedVertebraC(null);
  setExpandedVertebraL(null);
  setFullSide({});
  setNombrePaciente('');
  setMostrarGaleria(false);
  setComentarioLista('');
  setImgListaSrc(null);
  setFiguras([]);
  setIsEditingVisual(false);
  setTextoVisual('');
  // Incrementar el key para forzar re-render de las vistas de exportación
  setExportKey((prev) => prev + 1);

}, []);

/* Deshace SOLO lo que se marcó en el escalón actual y retrocede */
const handleBack = React.useCallback(() => {
  // 1) borro la última línea del listado
  setResumenLista(prev => prev.slice(0, -1));
  setResumenTexto(prev => prev.replace(/\s*\S+$/,'').trim());

  // 2) reseteo la selección asociada al paso donde estoy
  switch (nivelActual.titulo) {
    case 'Nivel':
      setCheckedLeftC([]);  setCheckedRightC([]);
      setCheckedLeftL([]);  setCheckedRightL([]);
   
      setSelectedSensitiva({ 'C6-C7': null, S1: null });
      setToracicoTxt('');
      // setOverlayNivel(null);
      setToracicoTxt('');
      setToracicoTxt_A('');          // ← nuevo
      break;
    case 'Progresión':
    setCroAguConProgresion(false);
    break;
    // otros títulos (“Intensidad”, “Pronóstico”…):
    // no requieren limpiezas extra
  }

  // 3) cierro paneles y retrocedo
  setExpandedNivel(null);
  retroceder();
}, [nivelActual, retroceder]);



const toNorm = (s: string) =>
  s
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

// Mantén vertebras en mayúsculas después de normalizar
const restoreLevels = (s: string) =>
  s.replace(/\b(c|t|l|s)(\d(?:-\d)?)\b/gi, (_m, letra, num) =>
    letra.toUpperCase() + num.toUpperCase()
  );

const normalizarToracico = (txt: string) =>
  txt
    // "niveles Torácicas: ..."
    .replace(/^niveles\s+tor[aá]cicas:\s*/i, '')
    // "con agudización nivel Torácica: ..."
    .replace(/^con\s+agudizaci[oó]n\s+nivel\s+tor[aá]cica:\s*/i, '')
    // fallback: "Torácica: ..."
    .replace(/^tor[aá]cica:\s*/i, '');


const stripNivel = (txt: string) =>
  txt
    .replace(/\bnivel\s+/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

/* ── helpers globales ───────────────────────────── */
function getPair(t: string): [string, string] | null {
  const low = t.toLowerCase();


   // ✅ Progresión (con/sin acento)
  if (low.startsWith('con progresión') || low.startsWith('con progresion') ||
      low.startsWith('sin progresión') || low.startsWith('sin progresion')) {
    return ['Progresión', t];
  }

  if (low.startsWith('progresión') || low.startsWith('progresion')) {
    return ['Progresión', t.replace(/^progres(ión|ion)\s+/i, '')];
  }

  // ✅ Mostrar como "Nivel – …" si por alguna razón quedó "Torácica: …"
  if (/^tor[aá]cica:\s*/i.test(t)) {
    return ['Nivel', t.replace(/^tor[aá]cica:\s*/i, '')];
  }
 // ✅ Polisegmentario → mostrar en lista como "Ubicación – (…)”
  if (low.startsWith('polisegmentario')) {
    // ej. "Polisegmentario Cervical, Torácica y Lumbosacro" → "Cervical, Torácica y Lumbosacro"
    return ['Ubicación', t.replace(/^polisegmentario\s*/i, '')];
  }


  // ✅ Torácica (primera pasada) → etiqueta "Nivel" y muestra SOLO lo del input
  if (/^niveles\s+tor[aá]cicas:\s*/i.test(t)) {
    return ['Nivel', t.replace(/^niveles\s+tor[aá]cicas:\s*/i, '')];
  }

  // ✅ Torácica (agudización) → etiqueta "Nivel de agudización" y muestra SOLO lo del input
  if (/^con\s+agudizaci[oó]n\s+nivel\s+tor[aá]cica:\s*/i.test(t)) {
    return ['Nivel de agudización', t.replace(/^con\s+agudizaci[oó]n\s+nivel\s+tor[aá]cica:\s*/i, '')];
  }

  if (low.startsWith('radiculopatía')) return ['Evolución', t];
  if (low.startsWith('fase'))          return ['Fase', t.replace(/^fase\s+/i, '')];
  if (low.startsWith('nivel') || low.includes('multinivel'))
                                       return ['Nivel', t.replace(/^nivel\s+/i, '')];
  if (low.includes('agudización nivel')) return ['Nivel de agudización', t.replace(/^con agudización nivel\s+/i, '')];
  if (low.startsWith('intensidad'))    return ['Intensidad', t.replace(/^intensidad\s+/i, '')];
  if (low.startsWith('con progresión') || low.startsWith('sin progresión'))
  return ['Progresión', t]; // si por alguna razón llega sin prefijo

  if (low.startsWith('progresión'))    return ['Progresión', t.replace(/^progresión\s+/i, '')];
  if (low.includes('reinervación'))    return ['Reinervación', t.replace(/^con\s+/i, '')];
  if (low.startsWith('pronóstico') || low.startsWith('pronostico')) {
    const canon = canonicalizePrognosis(t);
    return ['Pronóstico', canon];
  }

  return null;
}


/* ahora sí puedes usar getPair sin problemas */
const ORDER = [
  'Evolución',
  'Fase',
  'Patología',        // 👈 opcional
  'Nivel',
  'Ubicación',        
  'Nivel de agudización',
  'Intensidad',
  'Progresión',
  'Reinervación',
  'Pronóstico',
] as const;


// Helpers
const cap1 = (s:string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

// Construye el texto final del diagnóstico con la puntuación correcta
const buildDiagnostico = (items: string[]) => {
  const dict: Record<string,string> = {};
  items.forEach(t => { const p = getPair(t); if (p) dict[p[0]] = p[1]; });

  const evolucion = (dict['Evolución'] || 'Radiculopatía').replace(/^Radiculopatía/i,'Radiculopatía');
  const fase      = (dict['Fase'] || '').trim();  // Aguda / Subaguda / Crónica ...
  const nivel     = (dict['Nivel'] || '').trim();
  const nivelAgu  = (dict['Nivel de agudización'] || '').trim();
const intenRaw  = (dict['Intensidad'] || '').replace(/^Intensidad\s+/i,'').trim();
  const prog      = (dict['Progresión'] || '').trim();
  const reinRaw   = (dict['Reinervación'] || '').trim();
  const pronRaw   = (dict['Pronóstico'] || '').trim();
  const ubic      = (dict['Ubicación'] || '').trim(); // p.ej. "Cervical, Torácica y Lumbosacro"

  const faseMin = fase ? fase.toLowerCase() : '';
  const nivelCompuesto = nivelAgu ? `${nivel} con agudización ${nivelAgu}` : nivel;

  // ► Cabecera
  let head = `${evolucion} ${faseMin}`.replace(/\s+/g,' ').trim();

  // ✅ Si hay Ubicación (polisegmentaria), forzamos: “polisegmentaria a nivel …”
  if (ubic) {
    const uRep = ubicacionAplanadaParaReporte(ubic); // -> "cervical, torácica y lumbosacra"
    head += `${head ? ' ' : ''}polisegmentaria a nivel ${uRep}`;
  } else if (nivelCompuesto) {
    head += `${head ? ' ' : ''}${nivelCompuesto}`;
  }

if (intenRaw) {
  const inten = parseIntensidadConParentesis(intenRaw); // p.ej. "leve (+/+)"
  head += `${head ? ', ' : ''}intensidad ${inten}`;
}

  if (prog) head += ` ${prog}`;
  head = head.replace(/\s+/g,' ').trim() + '.';

  // ► Segunda oración (opcional)
  let rein = '';
  if (reinRaw) {
    let r = reinRaw.replace(/^con\s+/i,'').replace(/^sin\s+/i,'Sin ');
    r = r.replace(/^reinervación/i,'Reinervación');
    rein = r;
  }
  let pron = '';
  if (pronRaw) pron = `pronóstico de ${pronRaw.toLowerCase()}.`;

  let tail = '';
  if (rein && pron) tail = `${rein}; ${pron}`;
  else if (rein)    tail = `${rein}.`;
  else if (pron)    tail = pron.charAt(0).toUpperCase() + pron.slice(1);

  return tail ? `${head}\n${tail}` : head;
};

const titleCaseUbicacion = (s: string) =>
  s
    .split(',')
    .map(part =>
      part
        .trim()
        .replace(/^cervical$/i, 'Cervical')
        .replace(/^Torácica$/i, 'Torácica')
        .replace(/^toracico$/i, 'Torácica')   // por si llega sin acento
        .replace(/^lumbosacro$/i, 'Lumbosacro')
        .replace(/\s+bilateral$/i, ' bilateral') // conserva “bilateral” si alguna vez lo usas aquí
    )
    .join(', ');

// Convierte "Cervical, Torácica, Lumbosacro" -> "cervical y lumbosacra" (género y minúsculas para reporte)
// Convierte variantes como:
//  - "Cervical y Torácica y Lumbosacro"
//  - "Cervical, Torácica y Lumbosacro"
//  - "cervical, toracico y lumbosacro"
// a: "cervical, torácica y lumbosacra"
const ubicacionAplanadaParaReporte = (s: string) => {
  if (!s) return '';

  // 1) Normaliza a minúsculas y espacios
  let norm = s
    .toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '') // quita acentos para mapear
    .replace(/\s+/g, ' ')
    .trim();

  // 2) Unifica separadores: convierte cualquier " y " en coma
  norm = norm.replace(/\s+y\s+/g, ', ');

  // 3) Parte por comas, limpia, y mapea a los textos correctos (con acento/género)
  const mapPretty: Record<string,string> = {
    'cervical': 'cervical',
    'toracica': 'torácica',
    'toracico': 'torácica',
    'lumbosacro': 'lumbosacra',
    'lumbosacra': 'lumbosacra',
  };

  // preserva orden y evita duplicados
  const seen = new Set<string>();
  const partes = norm.split(',').map(p => p.trim()).filter(Boolean).map(p => mapPretty[p] || p)
    .filter(p => {
      if (seen.has(p)) return false;
      seen.add(p);
      return true;
    });

  if (!partes.length) return '';

  // 4) Une con comas y último “y”
  let txt = partes.join(', ');
  if (partes.length > 1) txt = txt.replace(/, ([^,]+)$/, ' y $1');

  return txt;
};

// Versión para la LISTA: "Polisegmentaria a nivel Cervical y Lumbosacra" (capitaliza cada palabra relevante)
const ubicacionParaLista = (s: string) => {
  if (!s) return '';
  let partes = s.split(',').map(p => p.trim().toLowerCase());
  partes = partes.map(p =>
    p.replace(/^Torácica$/i, 'torácica')
     .replace(/^toracico$/i, 'torácica')
     .replace(/^lumbosacro$/i, 'lumbosacra')
  );
  let txt = partes.join(', ');
  if (partes.length > 1) txt = txt.replace(/, ([^,]+)$/, ' y $1');
  // Capitaliza la primera letra de cada bloque separado por “ y ” o “, ”
  const cap = (w:string) => w.charAt(0).toUpperCase() + w.slice(1);
  txt = txt.split(/(, | y )/).map(seg => (seg.match(/, | y /) ? seg : cap(seg))).join('');
  return txt;
};

// Limpia intensidad → “leve / moderada / severa / difusa” (sin paréntesis)
const normalizarIntensidadSimple = (txt: string) => {
  const low = txt.toLowerCase();
  if (low.includes('leve'))     return 'leve';
  if (low.includes('moderada')) return 'moderada';
  if (low.includes('severa'))   return 'severa';
  if (low.includes('difusa'))   return 'difusa';
  return txt; // fallback
};

// SOLO para el modo lista
const formatLista = (label: string, rawTxt: string) => {
  const txt = rawTxt.trim();

  if (label === 'Evolución') {
    const t = txt.replace(/^Radiculopatía\s*/i, '').trim();
    const pretty = t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
    return { label: 'Evolución', txt: pretty };
  }

  if (label === 'Reinervación') {
    const t = txt.toLowerCase();
    if (t.includes('sin')) return { label: 'Reinervación', txt: 'Ausente' };
    if (t.includes('mínima') || t.includes('minima')) return { label: 'Reinervación', txt: 'Mínima' };
    if (t.includes('abundante')) return { label: 'Reinervación', txt: 'Abundante' };
    return { label: 'Reinervación', txt: 'Mínima' };
  }

  if (label === 'Progresión') {
    const t = txt.toLowerCase();
    if (t.startsWith('con progresión') || t.startsWith('con progresion'))
      return { label: 'Progresión', txt: 'Progresión distal a miotomas' };
    if (t.startsWith('sin progresión') || t.startsWith('sin progresion'))
      return { label: 'Progresión', txt: 'Sin progresión distal a miotomas' };
  }

  // ✅ ahora
if (label === 'Intensidad') {
  const withParen = parseIntensidadConParentesis(txt); // normaliza paréntesis si faltan
  const m = withParen.match(/^(leve|moderada|severa|difusa)\s*(\(.+?\))?/i);
  if (m) {
    const palabra = capWord(m[1].toLowerCase());           // Leve | Moderada | ...
    const signos  = m[2] || INTENSITY_SIGNS[m[1].toLowerCase() as keyof typeof INTENSITY_SIGNS];
    const suffix  = withParen.slice(m[0].length).trim();   // <- lo que venga después (p.ej. “con progresión …”)
    return {
      label: 'Intensidad',
      txt: `${palabra} ${signos}${suffix ? ` ${suffix}` : ''}`,
    };
  }
  return { label: 'Intensidad', txt: withParen };
}
  if (label === 'Fase') {
    return { label: 'Fase', txt: capWord(txt) }; // "Activa", "Inactiva", "Antigua"
  }

  if (label === 'Ubicación') {
    const u = ubicacionAplanadaParaReporte(txt); 
    return { label: 'Ubicación', txt: `Polisegmentaria a nivel ${u}` };
  }
if (label === 'Nivel') {
  return { label: 'Nivel', txt };
}


  return { label, txt };
};



const listaRender = useMemo(() => {
  const dict: Record<string, string> = {};

  resumenLista.forEach(t => {
    const pair = getPair(t);
    if (pair) {
      const [label, clean] = pair;
      dict[label] = clean;
      if (ubicacionPreview) {
      dict['Ubicación'] = ubicacionPreview; 
     }
    }
  });

// --- FUSIÓN Intensidad + Progresión en una sola línea ---
if (dict['Intensidad'] && dict['Progresión']) {
  // Normaliza la intensidad, conservando paréntesis
  const intenTxt = formatLista('Intensidad', dict['Intensidad']).txt;

  // Detecta si la progresión es "con" o "sin" (robusto a acentos)
  const rawProg = (dict['Progresión'] || '').toLowerCase().trim();
  const esSin = rawProg.startsWith('sin');
  const progNorm = esSin
    ? 'sin progresión distal a miotomas'
    : 'con progresión distal a miotomas';

  // → deja TODO en la línea de Intensidad
  dict['Intensidad'] = `${intenTxt} ${progNorm}`;

  // → y evita una línea aparte de "Progresión"
  delete dict['Progresión'];
}




  return ORDER
    .filter(lbl => dict[lbl])
    .map(lbl => ({ label: lbl, txt: dict[lbl] }));
}, [resumenLista, ubicacionPreview]);


// Inserta un "; " antes de cada frase de Intensidad y asegura punto final.
// No repite si ya está formateado.
const decorateIntensidad = (s: string) => {
  if (!s) return s;
  // Regex busca cada "Intensidad <palabra> (signos)" opcionalmente con punto final
  return s.replace(
    /(?:^|[\s,])(?:(; )?)Intensidad (leve \(\+\/\+\)|moderada \(\+\+\)|severa \(\+\+\+\)|difusa \(\+\+\+\+\))\.?/gi,
    (full, yaTiene, resto) => {
      // Detecta si ya venía con "; " justo antes
      const prefijo = full.match(/; +Intensidad/i) ? '' : '; ';
      return `${prefijo}Intensidad ${resto}.`;
    }
  );
};

// Altura reservada para la caja de diagnóstico en el PDF
// (la usamos solo como referencia visual; el alto real lo fijamos más abajo)
const REPORT_BOX_H = 160; // ajusta si lo necesitas

const addToReport = (txt: string) => {
 // ✅ Caso especial Torácica → NO normalizar a minúsculas antes; quita el prefijo solo para el enunciado
if (/^(niveles\s+tor[aá]cicas:|con\s+agudizaci[oó]n\s+nivel\s+tor[aá]cica:)/i.test(txt)) {
  const raw = txt.replace(/\s+/g, ' ').trim();        // conserva mayúsculas del usuario
  const limpio = normalizarToracico(raw);             // quita el prefijo para el enunciado
  setResumenLista(prev => (prev.includes(raw) ? prev : [...prev, raw]));
  setResumenTexto(prev => (prev.includes(limpio) ? prev : `${prev} ${limpio}`.trim()));
  return;
}

  // ⬇️ resto igual que antes
  const norm = toNorm(txt);
  let normFixed = norm.startsWith('radiculopatía')
    ? 'Radiculopatía' + norm.slice('radiculopatía'.length)
    : norm;

  normFixed = restoreLevels(normFixed);
  const limpio = normalizarToracico(normFixed);

  setResumenLista(prev =>
    prev.includes(normFixed) ? prev : [...prev, normFixed]
  );
  setResumenTexto(prev =>
    prev.includes(limpio) ? prev : `${prev} ${limpio}`.trim()
  );
};


const removeFromReport = (txt: string) => {
  const norm = toNorm(txt);
  const limpio = normalizarToracico(norm);
  setResumenLista(prev => prev.filter(t => t !== norm));
  setResumenTexto(prev => prev.replace(limpio, '').trim());
};

const handleNext = (op: OpcionJerarquia) => {

if (nivelActual.titulo === 'Evolución') setFlowType(op.nombre);

if (nivelActual.titulo === 'Patología') {
  const val = (op.nombre === 'Retardo') ? 'Retardo' : 'Bloqueo';
  setSensPatologia(val);

  // Quita cualquier “Patología …” previo y agrega el nuevo
  setResumenLista(prev => [
    ...prev.filter(t => !/^patología\s+/i.test(t)),
    `Patología ${val}`
  ]);

  // ✅ Primer texto sale aquí, no al pulsar el botón Sensitiva
  const frases = buildSensitivaFrasesWith(val);
  setTextoVisual(frases.length
    ? frases.join(' ')
    : (val === 'Retardo' ? 'Retardo aferente' : 'Bloqueo aferente')
  );

  avanzar(op);
  setAgudiPhase(false);
  return;
}



  if (nivelActual.titulo === 'Evolución' && op.nombre === 'Sensitiva') {
  setFlowType('Sensitiva');
  // 👉 Avanza normal sin agregar "Radiculopatía sensitiva" al resumen
  avanzar(op);
  setAgudiPhase(false);
  return;
  }

// ✅ Fase (solo Crónica): guarda como "Fase Activa / Inactiva / Antigua"
if (nivelActual.titulo === 'Fase') {
  const val  = (op.nombre || op.texto || '').trim();   // "Activa" | "Inactiva" | "Antigua"
  const full = `Fase ${val}`;                           // -> "Fase Activa"

  // Reemplaza cualquier "Fase ..." previa en el resumen
  setResumenLista(prev => [
    ...prev.filter(t => !/^fase\s+/i.test(t)),
    full,
  ]);

  addToReport(full);                                    // ahora getPair() la detecta como Fase
  avanzar({ ...op, texto: full });                      // propagamos texto normalizado
  setAgudiPhase(false);
  return;
}

  // ✅ Pronóstico: forzar texto canónico
  if (nivelActual.titulo === 'Pronóstico') {
    const canon = canonicalizePrognosis(op.nombre || op.texto);
    const full  = `Pronóstico ${canon}`;
    addToReport(full);
    avanzar({ ...op, texto: full });
    setAgudiPhase(false);
    return;
  }

  // ✅ Progresión: prefijar para que el modo lista/reporte lo reconozca
  if (nivelActual.titulo === 'Progresión') {
  const full = `Progresión ${op.texto}`;
  addToReport(full);

  if (flowType === 'Crónica agudizada') {
    const esCon = (op.nombre || op.texto).toLowerCase().includes('con');
    startTransition(() => {          // ✅ transición = menos bloqueo de UI
      setCroAguConProgresion(esCon);
    });
  }
  avanzar({ ...op, texto: full });
  setAgudiPhase(false);
  return;
}

  addToReport(op.texto);
  avanzar(op);
  setAgudiPhase(false);
};


const [vista, setVista] = useState<'post' | 'ant'>('post');

const toggleVista = React.useCallback(() => {
  setVista(v => (v === 'post' ? 'ant' : 'post'));
}, []);

  /* 🔸 Devuelve la imagen correcta según flujo y vista */
const baseImg = useMemo(() => {
  const sens = flowType === 'Sensitiva';
  if (vista === 'post') return sens ? IMG_POST_SENS : IMG_POST;
  return sens ? IMG_ANT_SENS : IMG_ANT;
}, [vista, flowType]);

// ratio estable: toma SIEMPRE la base POST del flujo actual
const stableBaseForRatio = useMemo(() => {
  const sens = flowType === 'Sensitiva';
  return sens ? IMG_POST_SENS : IMG_POST;
}, [flowType]);

const ratioSrc = useMemo(
  () => Image.resolveAssetSource(stableBaseForRatio as ImageSourcePropType),
  [stableBaseForRatio]
);

const dynamicRatio = ratioSrc.width / ratioSrc.height;

/* ░░░ IMPORTANTE: tamaño estable del contenedor ░░░ */
const { width: winW, height: winH } = useWindowDimensions();
const shortSide = Math.min(winW, winH);                  // lado corto (estable entre orientaciones)
const containerW = Math.round(shortSide * 0.95);         // 95% del lado corto
const containerH = Math.round(containerW / dynamicRatio); // mantiene ratio de la base

// ── ¿Podemos poner dos bases lado a lado sin cambiar su tamaño?
const isLandscape = winW > winH;
const canShowDual = isLandscape && (winW >= containerW * 2); // sin márgenes, pegadas

// usa ese tamaño para imgSize/limites (ya no dependas de onLayout)
useEffect(() => {
  setImgSize({ w: containerW, h: containerH });
  setLimitesContenedor({ width: containerW, height: containerH });
}, [containerW, containerH]);

  /* ----------------------- Estados Nivel ------------------------ */
  const [expandedNivel,setExpandedNivel] = useState<string|null>(null);

  /* ---- Cervical ---- */
  const [expandedVertebraC,setExpandedVertebraC] = useState<string|null>(null);
  const [checkedLeftC,setCheckedLeftC]   = useState<string[]>([]);
  const [checkedRightC,setCheckedRightC] = useState<string[]>([]);

  /* ---- Lumbosacro ---- */
  const [expandedVertebraL,setExpandedVertebraL] = useState<string|null>(null);
  const [checkedLeftL,setCheckedLeftL]   = useState<string[]>([]);
  const [checkedRightL,setCheckedRightL] = useState<string[]>([]);

  
  /* ====  fase de Agudización  ==== */
  const [agudiPhase, setAgudiPhase] = useState(false); // ¿segunda pasada?

  const effectiveTitulo = React.useMemo(() => {
  const isAgudi = (flowType === 'Crónica agudizada' && agudiPhase);
  // Solo sobreescribe el rótulo visual cuando el nodo es "Nivel"
  return (isAgudi && nivelActual.titulo === 'Nivel') ? 'Agudización' : nivelActual.titulo;
}, [flowType, agudiPhase, nivelActual.titulo]);


  /* selecciones rojas */
  const [checkedLeftC_A,  setCheckedLeftC_A ] = useState<string[]>([]);
  const [checkedRightC_A, setCheckedRightC_A] = useState<string[]>([]);
  const [checkedLeftL_A,  setCheckedLeftL_A ] = useState<string[]>([]);
  const [checkedRightL_A, setCheckedRightL_A] = useState<string[]>([]);

  const isAgudi = flowType === 'Crónica agudizada' && agudiPhase;
  /* === arrays que se usan PARA LEER, según la fase ==================== */
const readCheckedLeftC  = isAgudi ? checkedLeftC_A  : checkedLeftC;
const readCheckedRightC = isAgudi ? checkedRightC_A : checkedRightC;
const readCheckedLeftL  = isAgudi ? checkedLeftL_A  : checkedLeftL;
const readCheckedRightL = isAgudi ? checkedRightL_A : checkedRightL;



useEffect(() => {
  if (flowType === 'Crónica agudizada' && agudiPhase && agudiTargetNivel) {
    setExpandedNivel(agudiTargetNivel);         // <-- 4  NUEVO
  }
}, [flowType, agudiPhase, agudiTargetNivel]);

const AnimatedLetters: any = AnimatedLetterText;


  /* helpers para escoger el set correcto según la fase ------------------ */
const useSetC = isAgudi
  ? { L: setCheckedLeftC_A , R: setCheckedRightC_A }
  : { L: setCheckedLeftC   , R: setCheckedRightC   };

const useSetL = isAgudi
  ? { L: setCheckedLeftL_A , R: setCheckedRightL_A }
  : { L: setCheckedLeftL   , R: setCheckedRightL   };


  /*  botones “lado completo” – SOLO en CRÓNICA  */
const [fullSide, setFullSide] = useState<Record<string, SideFlags>>({});
const hasFullSide = (levels: string[]) =>
  levels.some(lvl => fullSide[lvl]?.L || fullSide[lvl]?.R);

const toggleFullSide = React.useCallback(
  (lvl: string, side: 'L' | 'R') =>
    setFullSide(prev => ({
      ...prev,
      [lvl]: { ...prev[lvl], [side]: !prev[lvl]?.[side] },
    })),
  []
);
  /* ----------  AHORA sí podemos calcular las cruces activas ---------- */
const buildMeta = (id: string, rojo = false): CrossMeta | null => {
  const base = getCrossMeta(id);
  if (!base) return null;
  if (rojo) {
    // mismo índice, pero usamos la versión roja
    const m = id.match(/_(?:L|R)([1-4])$/);
    if (!m) return null;
    const n = Number(m[1]) as 1 | 2 | 3 | 4;
    base.src = CROSS_RED_IMG[n];
  }
  return {
    ...base,
    key: rojo ? `${id}_R` : id,   
  };
};

/* ① Primera pasada (negras) */
// SOLUCIÓN: Agrega debounce y reduce dependencias
const activeCrossesBlack = useMemo<CrossMeta[]>(() => {
  const ids = [...checkedLeftC, ...checkedRightC, ...checkedLeftL, ...checkedRightL];
  return Array.from(new Set(ids))
    .map(id => buildMeta(id))
    .filter(Boolean) as CrossMeta[];
}, [checkedLeftC, checkedRightC, checkedLeftL, checkedRightL]);

/* ② Segunda pasada (rojas) – solo usa los arrays *_A */
const activeCrossesRed = useMemo<CrossMeta[]>(() => {
  const ids = [
    ...checkedLeftC_A,
    ...checkedRightC_A,
    ...checkedLeftL_A,
    ...checkedRightL_A,
  ];
  return Array.from(new Set(ids))
    .map(id => buildMeta(id, true))    // rojas
    .filter(Boolean) as CrossMeta[];
}, [checkedLeftC_A, checkedRightC_A, checkedLeftL_A, checkedRightL_A]);

/* (debug opcional) */
useEffect(() => {
  console.log('[DEBUG] black →', activeCrossesBlack);
  console.log('[DEBUG]   red →', activeCrossesRed);
}, [activeCrossesBlack, activeCrossesRed]);

/* ③ Unión de ambas listas para el resto del código  */
const activeCrosses = useMemo<CrossMeta[]>(() => (
  [...activeCrossesBlack, ...activeCrossesRed]
), [activeCrossesBlack, activeCrossesRed]);

/** Devuelve { C5:['L1','R2'…],  C6:[…], … } con los grupos marcados */
/**  Devuelve { C5:['L1','R2'…] … } en CRÓNICA  */

/** Grupos activos en CRÓNICA AGUDIZADA (solo si Con progresión) */
  /* ---- Sensitiva ---- */
  const [expandedSensitiva,setExpandedSensitiva] = useState<string|null>(null);
  const [selectedSensitiva,setSelectedSensitiva] = useState<Record<string,string|null>>({
    'C6-C7':null,'S1':null,
  });

  /* ---- Otros ---- */
  const [toracicoTxt,setToracicoTxt] = useState<string>('');
  const [toracicoTxt_A, setToracicoTxt_A] = useState<string>('');  
  const [polC,setPolC] = useState(false);
  const [polT,setPolT] = useState(false);
  const [polL,setPolL] = useState(false);

// debajo de tus useState de Torácica:
const showToracico = useMemo(() => {
  const val = (flowType === 'Crónica agudizada' && agudiPhase) ? toracicoTxt_A : toracicoTxt;
  return !!val?.trim() || polT;   // ← ahora también por toggle Polisegmentario
}, [flowType, agudiPhase, toracicoTxt, toracicoTxt_A, polT]);

// ⬇⬇⬇ NUEVO: prender overlays de CERVICAL y LUMBO al marcar cualquier checkbox del grupo
const showCervOverlay = useMemo(() => {
  // checkboxes marcados (fase normal o agudización)
  const anyChk = [...readCheckedLeftC, ...readCheckedRightC]
    .some(id => cervicalLevels.includes(id.split('_')[0]));
  // “lado completo” en Crónica también debe contar
  const anyFull = flowType === 'Crónica'
    ? cervicalLevels.some(lvl => fullSide[lvl]?.L || fullSide[lvl]?.R)
    : false;
  return anyChk || anyFull || polC; // polC (polisegmentario) también enciende
}, [readCheckedLeftC, readCheckedRightC, flowType, fullSide, polC]);

const showLumboOverlay = useMemo(() => {
  const anyChk = [...readCheckedLeftL, ...readCheckedRightL]
    .some(id => lumbosacralLevels.includes(id.split('_')[0]));
  const anyFull = flowType === 'Crónica'
    ? lumbosacralLevels.some(lvl => fullSide[lvl]?.L || fullSide[lvl]?.R)
    : false;
  return anyChk || anyFull || polL;
}, [readCheckedLeftL, readCheckedRightL, flowType, fullSide, polL]);


  useEffect(() => {
  if (expandedNivel !== 'Polisegmentario') {
    setUbicacionPreview(null);
    return;
  }

  const partes:string[] = [];
  if (polC) partes.push('Cervical');
  if (polT) partes.push('Torácica');
  if (polL) partes.push('Lumbosacro');

  if (!partes.length) { setUbicacionPreview(null); return; }

  // “Cervical, Torácica y Lumbosacro”
  let txt = partes.join(', ');
  if (partes.length > 1) txt = txt.replace(/, ([^,]+)$/, ' y $1');

  setUbicacionPreview(txt);
}, [expandedNivel, polC, polT, polL]);



  /* ----------------------- Helpers Nivel ------------------------ */

function toggleOnePerSide(prev: string[], id: string): string[] {
  if (prev.includes(id)) {
    // si pulsas de nuevo la misma, la quita
    return prev.filter(x => x !== id);
  }
  const [lvl, LRn] = id.split('_');
  const side = LRn[0];  
  const withoutSameSide = prev.filter(x => !x.startsWith(`${lvl}_${side}`));
  return [...withoutSameSide, id];
}

const finalizarCervicalMulti = () => {
  const lvlFromId = (id: string) => id.split('_')[0];
  const setL = new Set(readCheckedLeftC .map(lvlFromId));
  const setR = new Set(readCheckedRightC.map(lvlFromId));

  const left: string[] = [];
  const bilateral: string[] = [];
  const right: string[] = [];

  cervicalLevels.forEach(v => {
    const l = setL.has(v);
    const r = setR.has(v);
    if (l && r) bilateral.push(v);
    else if (l) left.push(v);
    else if (r) right.push(v);
  });

  if (!left.length && !right.length && !bilateral.length) return;

  const segmentos: string[] = [];
  if (left.length)      segmentos.push(`${left.join(', ')} izquierda`);
  if (right.length)     segmentos.push(`${right.join(', ')} derecha`);
  if (bilateral.length) segmentos.push(`${bilateral.join(', ')} bilateral`);

  let resumen = segmentos.join(', ');
  if (segmentos.length > 1) resumen = resumen.replace(/, ([^,]+)$/, ' Y $1');

  // ⬇️ NUEVO: contar niveles distintos y agregar (multinivel) si son 3+
  const totalNiveles = left.length + right.length + bilateral.length;
  const isAgudiPhase = (flowType === 'Crónica agudizada' && agudiPhase);
  const baseTxt = isAgudiPhase ? `con agudización nivel ${resumen}` : `nivel ${resumen}`;
  const withSuffix = totalNiveles >= 3 ? `${baseTxt} (multinivel)` : baseTxt;

  const textoNivel = restoreLevels(toNorm(withSuffix));

  setResumenLista(prev => isAgudiPhase
    ? [...prev, textoNivel]
    : [...prev.filter(t => !/^nivel /.test(t)), textoNivel]
  );
  addToReport(textoNivel);

  const siguiente =
    flowType === 'Crónica agudizada'
      ? (agudiPhase ? pasoD1_Cronica : pasoZ_CroAgu)
      : flowType === 'Crónica'
        ? pasoD1_Cronica
        : flowType === 'Subaguda'
          ? pasoC_Subaguda
          : pasoC_Aguda;

  if (flowType === 'Crónica agudizada' && !agudiPhase) {
    setAgudiPhase(true);
    setAgudiTargetNivel('Cervical');
  }

  avanzar({ nombre: 'Cervical', texto: textoNivel, siguiente });

  setExpandedNivel(null);
  setExpandedVertebraC(null);
};



const finalizarLumboMulti = () => {
  const lvlFromId = (id: string) => id.split('_')[0];
  const setL = new Set(readCheckedLeftL .map(lvlFromId));
  const setR = new Set(readCheckedRightL.map(lvlFromId));

  const left: string[] = [];
  const bilateral: string[] = [];
  const right: string[] = [];

  lumbosacralLevels.forEach(v => {
    const l = setL.has(v);
    const r = setR.has(v);
    if (l && r)       bilateral.push(v);
    else if (l)       left.push(v);
    else if (r)       right.push(v);
  });

  if (!left.length && !right.length && !bilateral.length) return;

  const segmentos: string[] = [];
  if (left.length)      segmentos.push(`${left.join(', ')} izquierda`);
  if (right.length)     segmentos.push(`${right.join(', ')} derecha`);
  if (bilateral.length) segmentos.push(`${bilateral.join(', ')} bilateral`);

  let resumen = segmentos.join(', ');
  if (segmentos.length > 1) resumen = resumen.replace(/, ([^,]+)$/, ' Y $1');

  // ⬇️ NUEVO: sufijo (multinivel) si hay 3+ niveles distintos
  const totalNiveles = left.length + right.length + bilateral.length;
  const isAgudiPhase = (flowType === 'Crónica agudizada' && agudiPhase);
  const baseTxt = isAgudiPhase ? `con agudización nivel ${resumen}` : `nivel ${resumen}`;
  const withSuffix = totalNiveles >= 3 ? `${baseTxt} (multinivel)` : baseTxt;

  const textoNivel = restoreLevels(toNorm(withSuffix));

  setResumenLista(prev => isAgudiPhase
    ? [...prev, textoNivel]
    : [...prev.filter(t => !/^nivel /.test(t)), textoNivel]
  );
  addToReport(textoNivel);

  const siguiente =
    flowType === 'Crónica agudizada'
      ? (agudiPhase ? pasoD1_Cronica : pasoZ_CroAgu)
      : flowType === 'Crónica'
        ? pasoD1_Cronica
        : flowType === 'Subaguda'
          ? pasoC_Subaguda
          : pasoC_Aguda;

  if (flowType === 'Crónica agudizada' && !agudiPhase) {
    setAgudiPhase(true);
    setAgudiTargetNivel('Lumbosacro');
  }

  avanzar({ nombre: 'Lumbosacro', texto: textoNivel, siguiente });

  setExpandedNivel(null);
  setExpandedVertebraL(null);
};


/* ------------------------------------------------------------------ */
/* helper para terminar Polisegmentario ------------------------------ */
const finalizarPolisegmentario = () => {
  /* 1. componer texto */
  const partes:string[] = [];
  if (polC) partes.push('Cervical');
  if (polT) partes.push('Torácica');
  if (polL) partes.push('Lumbosacro');
  if (!partes.length) return;                      

  let resumen = `Polisegmentario ${partes.join(', ')}`;
  if (partes.length > 1) resumen = resumen.replace(/, ([^,]+)$/, ' y $1');

  addToReport(resumen);

  /* 2. decidir siguiente paso */
  const siguiente =
    flowType === 'Crónica agudizada'
      ? (agudiPhase ? pasoD1_Cronica : pasoZ_CroAgu)
      : flowType === 'Crónica'
        ? pasoD1_Cronica
        : flowType === 'Subaguda'
          ? pasoC_Subaguda
          : pasoC_Aguda;        // Aguda

  avanzar({ nombre:'Polisegmentario', texto:resumen, siguiente });

  /* 3. cerrar panel */
  setExpandedNivel(null);
};
// buildSensitivaFrases: si no hay Patología, no devuelve frases
const buildSensitivaFrases = React.useCallback((): string[] => {
  if (!sensPatologia) return [];   // 👈 evita “Bloqueo aferente” por defecto
  const mapSide: Record<'Izquierda'|'Derecha'|'Bilateral', string> = {
    Izquierda: 'izquierdo', Derecha: 'derecho', Bilateral: 'bilateral',
  };
  const base = sensPatologia === 'Retardo' ? 'Retardo aferente' : 'Bloqueo aferente';
  const out: string[] = [];
  (['C6-C7','S1'] as const).forEach((lvl) => {
    const side = selectedSensitiva[lvl as 'C6-C7' | 'S1'] as ('Izquierda'|'Derecha'|'Bilateral') | null;
    if (!side) return;
    out.push(`${base} ${lvl} ${mapSide[side]}.`);
  });
  return out;
}, [selectedSensitiva, sensPatologia]);




// debajo de buildSensitivaFrases, agrega:
const buildSensitivaFrasesWith = (
  pat: 'Bloqueo' | 'Retardo'
): string[] => {
  const mapSide: Record<'Izquierda'|'Derecha'|'Bilateral', string> = {
    Izquierda: 'izquierdo',
    Derecha:   'derecho',
    Bilateral: 'bilateral',
  };
  const base = pat === 'Retardo' ? 'Retardo aferente' : 'Bloqueo aferente';

  const out: string[] = [];
  (['C6-C7','S1'] as const).forEach((lvl) => {
    const side = selectedSensitiva[lvl as 'C6-C7' | 'S1'] as ('Izquierda'|'Derecha'|'Bilateral') | null;
    if (!side) return;
    out.push(`${base} ${lvl} ${mapSide[side]}.`);
  });
  return out;
};

const finalizarSensitiva = () => {
  const frases = buildSensitivaFrases();
  if (!frases.length) return;

  // 👉 borra cualquier rastro previo (bloqueo o retardo)
setResumenLista(prev =>
  prev.filter(t =>
    !/^nivel (c6-c7|s1)/i.test(t) &&
    !/^(bloqueo|retardo)\s+aferente\b/i.test(t)     // \b por si no traía punto
  )
);


  // escribe el texto visible y vuelve a agregar las frases correctas
  setTextoVisual(frases.join(' '));
  frases.forEach(f => addToReport(f));

  avanzar({ nombre:'Sensitiva', texto:'Sensitiva', siguiente: pasoE3_Sensitiva });
  setExpandedSensitiva(null);
};


  // ──────────────────────────────────────────────────────────
//  Filtro de opciones en la 2.ª pasada de “Crónica agudizada”
// ──────────────────────────────────────────────────────────
const isAgudiPhase = flowType === 'Crónica agudizada' && agudiPhase;

const opcionesNivel = React.useMemo(() => {
  return isAgudiPhase && agudiTargetNivel
    ? nivelActual.opciones.filter(o => o.nombre === agudiTargetNivel)
    : nivelActual.opciones;
}, [isAgudiPhase, agudiTargetNivel, nivelActual.opciones]);

//Pasar el prop para header//
const [isCargaCerrar, setIsCargaCerrar] = useState(false);
const [textoVisual, setTextoVisual] = useState('');


const [isEditingVisual, setIsEditingVisual] = useState(false);
const [showEditModal, setShowEditModal] = useState(false);
const [showComentarioModal, setShowComentarioModal] = useState(false);

  // Texto final del diagnóstico (modo "reporte" / enunciado)
const resumenEnunciado = useMemo(() => {
  if (flowType === 'Sensitiva') {
  const frases = buildSensitivaFrases();
  return frases.length ? frases.join(' ') : '';
}


  return buildDiagnostico([
    ...resumenLista,
    ...(ubicacionPreview ? [`Polisegmentario ${ubicacionPreview}`] : []),
  ]);
}, [flowType, selectedSensitiva, resumenLista, ubicacionPreview, sensPatologia]);

useEffect(() => {
  if (flowType === 'Sensitiva' && !isEditingVisual) {
    const frases = buildSensitivaFrases();
    if (frases.length) {
      setTextoVisual(frases.join(' '));
    } else {
      setTextoVisual('');
    }
  }
}, [flowType, sensPatologia, selectedSensitiva, isEditingVisual, buildSensitivaFrases]);

 // 👇 Dentro del componente
const textoReporte = (textoVisual || resumenEnunciado || '').trim();

const linkDefaults = React.useMemo(() => {
  // Título personalizado según el tipo de estudio
  let tipoEstudio = 'Radiculopatía';

  // Determinar si es Electroneuromiografía basado en el flowType
  if (flowType && flowType !== '') {
    // Si es cualquier tipo de radiculopatía (Aguda, Subaguda, Crónica, etc.)
    tipoEstudio = 'Electroneuromiografía';
  }

  const titulo = nombrePaciente
    ? `${tipoEstudio} — ${nombrePaciente}`
    : tipoEstudio;

  return {
    defaultTitle: titulo,
    defaultMessage: 'Saludos...',  // ✅ Siempre "Saludos..." por defecto
    autoReportName: reportFileName(),
  };
}, [nombrePaciente, flowType]);



useEffect(() => {
  if (!isEditingVisual) {
    setTextoVisual(resumenEnunciado);
  }
}, [resumenEnunciado, isEditingVisual]);

  /* ------------------------------ Render ------------------------------ */
  return (
    
    
    <View style={styles.container}>
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

      <Header onStartLogout={() => setIsCargaCerrar(true)} onLogoutFinish={() => setIsCargaCerrar(false)}/>

     {/* ---------------- Top Bar ---------------- */}
<View style={styles.topBar}>
  {/* Nombre del paciente – movido aquí */}
  <View style={styles.nombrePacienteContainerTop}>
 <FancyInput
      label="Nombre del paciente"
      placeholder="Nombre del paciente"
      value={nombrePaciente}
      onChangeText={setNombrePaciente}
    />
  </View>
</View>


      <ScrollView contentContainerStyle={styles.scrollContent}
      scrollEnabled={!mostrarGaleria}
      pointerEvents={mostrarGaleria ? 'none' : 'auto'}
         removeClippedSubviews   // ✅ true por defecto si lo pasas sin valor
      >
     
{canShowDual ? (
  // ── Dos bases “pegadas”, mismo tamaño que en vertical ──
  <View
    style={{
      flexDirection: 'row',
      width: containerW * 2,
      height: containerH,
      alignSelf: 'center',
      overflow: 'hidden',
      borderRadius: 20,
      backgroundColor: '#222',
      marginBottom: 8,
    }}
  >
    <View style={{ width: containerW, height: containerH }}>
      <CanvasView vistaForExport="post"  includeFigures/>
    </View>
    <View style={{ width: containerW, height: containerH }}>
      <CanvasView vistaForExport="ant"  includeFigures/>
    </View>
  </View>
) : (
  <View
    style={[
      styles.imageSection,
      {
        width: containerW,
        height: containerH,
        alignSelf: 'center',
        position: 'relative',
      },
    ]}
    
   
     removeClippedSubviews={false}           
  >
    {/* POSTERIOR siempre montado; solo cambio opacidad */}
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFillObject,
        { opacity: vista === 'post' ? 1 : 0 },
      ]}
        removeClippedSubviews={false}           
  collapsable={false}
    >
      <CanvasView vistaForExport="post" />
    </View>

    {/* ANTERIOR siempre montado; solo cambio opacidad */}
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFillObject,
        { opacity: vista === 'ant' ? 1 : 0 },
      ]}
        removeClippedSubviews={false}           // 👈
  collapsable={false}
    >
      <CanvasView vistaForExport="ant" />
    </View>

    {/* Figuras movibles de la vista activa */}
    {figuras
      .filter(f => f.vista === vista)
      .map(figura => (
        <FiguraMovible
          key={figura.id}
          id={figura.id}
          tipo={figura.tipo}
          uri={figura.uri}
          posicionInicial={figura.posicion}
          onEliminar={eliminarFigura}
          onActualizarPosicion={actualizarPosicion}
          limitesContenedor={limitesContenedor}
        />
      ))}

    {/* Indicador POST | ANT */}
    <View style={styles.dotBar}>
      <View style={[styles.dot, vista === 'post' && styles.dotActive]} />
      <View style={[styles.dot, vista === 'ant' && styles.dotActive]} />
    </View>
  </View>
)
}
{/* ───────── NAV POST | ANT (debajo de la base) ───────── */}
{!canShowDual && (
  <View style={styles.galleryNavRow}>
    <TouchableOpacity
      style={[styles.galleryArrowBtn, vista === 'post' && styles.galleryArrowDisabled]}
      onPress={() => setVista('post')}
      disabled={vista === 'post'}
      accessibilityLabel="Ver base Posterior"
    >
      <Image source={I_Regresar} style={styles.menuItemIcon} fadeDuration={0} {...GPU}/>
    </TouchableOpacity>

    <View style={styles.galleryCenter}>
      <Text style={styles.galleryLabel}>
        {vista === 'post' ? 'Posterior' : 'Anterior'}
      </Text>
      <View style={styles.galleryDots}>
        <View style={[styles.dot, vista === 'post' && styles.dotActive]} />
        <View style={[styles.dot,  vista === 'ant'  && styles.dotActive]} />
      </View>
    </View>

    <TouchableOpacity
      style={[styles.galleryArrowBtn, vista === 'ant' && styles.galleryArrowDisabled]}
      onPress={() => setVista('ant')}
      disabled={vista === 'ant'}
      accessibilityLabel="Ver base Anterior"
    >
      <Image source={I_Siguiente} style={styles.menuItemIcon}fadeDuration={0} {...GPU} />
    </TouchableOpacity>
  </View>
)}

  {/* ---------------- Opciones ---------------- */}
  <View style={styles.optionsSection}>
    <ScrollView style={styles.categoryContainer}>
     {nivelActual.titulo !== TITLE_EXPORT && (
  <Text style={[styles.titleText, { marginBottom: 10, textAlign: 'center' }]}>
    {effectiveTitulo}
  </Text>
)}

   <View style={styles.exportWrapper}>
    {/* HEADER centrado sobre ambas columnas */}
    <View style={styles.exportHeader}>
      <View style={styles.toolbarRow}>
        {/* Regresar */}
        <TouchableOpacity onPress={handleBack} style={styles.iconCircle}>
          <Image source={I_Regresar} style={styles.menuItemIcon}fadeDuration={0} {...GPU}/>
        </TouchableOpacity>

        {/* Refrescar */}
        <TouchableOpacity onPress={resetAll} style={styles.iconCircle}>
          <Image source={I_Refrescar} style={styles.menuItemIcon}fadeDuration={0} {...GPU}/>
        </TouchableOpacity>

      
        {/* Imprimir */}
        {nivelActual.titulo === TITLE_EXPORT && (
           <TouchableOpacity
    style={styles.iconCircle}
    onPress={openExportMenu}   // 👈 abre opciones PDF / JPEG
    disabled={exporting}
  >
    <Image source={I_Descargar} style={styles.menuItemIcon}fadeDuration={0} {...GPU}/>
  </TouchableOpacity>
        )}
    

      </View>
      
    </View>

    {nivelActual.titulo === TITLE_EXPORT && (

<View style={styles.exportLeft}>
  {/* Toolbar */}
  <View style={styles.toolbarRow}>
  </View>
  {activeTab === 'reporte' && (
    <View style={styles.tituloFiguras}>
      <TouchableOpacity onPress={() => manejarSeleccionImagen('circle')}>
        <Image
          source={require('../../../assets/Figuras/circulo.png')}
          style={styles.imagenCirculo}
          {...GPU}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => manejarSeleccionImagen('square')}>
        <Image
          source={require('../../../assets/Figuras/cuadrado.png')}
          style={styles.imagenCuadro}
          {...GPU}
        />
      </TouchableOpacity>
    </View>
  )}

 {activeTab === 'lista' && (
  <ExportLeftLista
    onOpenGallery={onOpenGallery}
    comentario={comentarioLista}
    setComentario={setComentarioLista}
    selected={!!imgListaSrc}
    preview={imgListaSrc}
    onClear={() => setImgListaSrc(null)}
    ar={imgListaAR}
    comentarioHeight={comentarioHeight}
    setComentarioHeight={setComentarioHeight}
    onOpenModal={() => setShowComentarioModal(true)}
  />
)}
 {activeTab === 'GenerarLink' && (
  <LinkUploader
    key={`${nombrePaciente}|${textoReporte}`}
    onGenerateLink={generateShareLink}
    defaultTitle={linkDefaults.defaultTitle}
    defaultMessage={linkDefaults.defaultMessage}
    autoReportName={linkDefaults.autoReportName}
    onRequestTemplate={requestTemplateForLink}
  />
)}

  

</View>
    )}
  </View>
            {/* Nivel */}
            {nivelActual.titulo==='Nivel' ? (
              flowType==='Sensitiva' ? (
                /* ====== Sensitiva ====== */
                <>
                  {sensitivaLevels.map(lvl=>(
                    <View key={lvl}>
                      <TouchableOpacity
                        style={styles.category}
                        onPress={()=>setExpandedSensitiva(prev=>prev===lvl?null:lvl)}
                      >
                        <Text style={styles.categoryText}>
                          {lvl}{'  '}{expandedSensitiva===lvl?'-':'+'}
                        </Text>
                      </TouchableOpacity>

                      {expandedSensitiva===lvl && (
                        <View style={styles.expandBlock}>
                          {sensitivaSides.map(side=>(
                            <TouchableOpacity
                              key={side}
                              style={styles.checkItem}
                              onPress={()=>setSelectedSensitiva(prev=>({
                                ...prev,
                                [lvl]:prev[lvl]===side?null:side,
                              }))}
                            >
                              <View style={[
                                styles.fakeCheckbox,
                                selectedSensitiva[lvl]===side && styles.fakeCheckboxChecked,
                              ]}/>
                              <Text style={styles.checkboxLabel}>{side}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}

                  {Object.values(selectedSensitiva).some(Boolean) && (
                    <TouchableOpacity style={styles.nextButton} onPress={finalizarSensitiva}>
                      <Text style={styles.nextButtonText}>Siguiente</Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                /* ====== Aguda / Subaguda / Crónica ====== */
                opcionesNivel.map(cat=>(
                  <View key={cat.nombre}>
                    <TouchableOpacity
                      style={styles.category}
                      onPress={()=>{
                        setExpandedNivel(prev=>prev===cat.nombre?null:cat.nombre);
                        // 🔸 Si se abre Cervical o Lumbosacro, guardo qué overlay mostrar
                        if (cat.nombre === 'Cervical' || cat.nombre === 'Lumbosacro') {
                          // setOverlayNivel(cat.nombre);
                        }
                      }}
                    >
                      <Text style={styles.categoryText}>
                        {cat.texto}{'  '}
                        {expandedNivel===cat.nombre?'-':'+'}
                      </Text>
                    </TouchableOpacity>

                    {/* ———— Cervical ———— */}
                    {cat.nombre === 'Cervical' && expandedNivel === 'Cervical' && (
                      <View style={styles.expandBlock}>
                       

                        {cervicalLevels.map(v=>(
                          <React.Fragment key={v}>
                            <TouchableOpacity
                              style={styles.subCategory}
                              onPress={()=>setExpandedVertebraC(prev=>prev===v?null:v)}
                            >
                              <Text style={styles.categoryText}>
                                {v}{'  '}{expandedVertebraC===v?'-':'+'}
                              </Text>
                            </TouchableOpacity>

                            {expandedVertebraC===v && (
                              <View style={styles.expandBlock}>
                                <Text style={styles.sideLabel}>Izquierdo</Text>
                                <View style={styles.checkboxRow}>
                                  {[1,2,3,4].map(i => {
                                    const id = `${v}_L${i}`;
                                    const checked = readCheckedLeftC.includes(id);
                                    return (
                                      <TouchableOpacity
                                        key={id}
                                        style={styles.checkItem}
                                        onPress={() => useSetC.L(prev => toggleOnePerSide(prev, id))}
                                        onLongPress={() => useSetC.L(prev => prev.filter(x => x !== id))}
                                      >
                                        <View style={[styles.fakeCheckbox, checked && styles.fakeCheckboxChecked]} />
                                        <Text style={styles.checkboxLabel}>{i}</Text>
                                      </TouchableOpacity>
                                    );
                                  })}
                                </View>

                                <Text style={styles.sideLabel}>Derecho</Text>
                                <View style={styles.checkboxRow}>
                                  {[1,2,3,4].map(i => {
                                    const id = `${v}_R${i}`;
                                    const checked = readCheckedRightC.includes(id);
                                    return (
                                      <TouchableOpacity
                                        key={id}
                                        style={styles.checkItem}
                                        onPress={() => useSetC.R(prev => toggleOnePerSide(prev, id))}
                                        onLongPress={() =>useSetC.R(prev => prev.filter(x => x !== id))}
                                      >
                                        <View style={[styles.fakeCheckbox, checked && styles.fakeCheckboxChecked]} />
                                        <Text style={styles.checkboxLabel}>{i}</Text>
                                      </TouchableOpacity>
                                    );
                                  })}
                                </View>

                                {/*  botones lado-completo  */}
                                {flowType === 'Crónica' && (
                                  <View style={{ flexDirection:'row', marginTop:4 }}>
                                    <TouchableOpacity
                                      style={[
                                        styles.sideBtn,
                                        fullSide[v]?.L && styles.sideBtnActive
                                      ]}
                                      onPress={() => toggleFullSide(v, 'L')}
                                    >
                                      <Text style={styles.sideBtnTxt}>Todo Izq.</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                      style={[
                                        styles.sideBtn,
                                        fullSide[v]?.R && styles.sideBtnActive
                                      ]}
                                      onPress={() => toggleFullSide(v, 'R')}
                                    >
                                      <Text style={styles.sideBtnTxt}>Todo Der.</Text>
                                    </TouchableOpacity>
                                  </View>
                                )}

                              </View>
                            )}
                          </React.Fragment>
                        ))}
                        {(checkedLeftC.length>0 || checkedRightC.length>0 || (flowType === 'Crónica' && hasFullSide(cervicalLevels))) && (
                          <TouchableOpacity style={styles.nextButton} onPress={finalizarCervicalMulti}>
                            <Text style={styles.nextButtonText}>Siguiente</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                    {expandedNivel==='Torácica' && cat.nombre==='Torácica' && (
             <View style={styles.expandBlock}>
               {(() => {
                 const isAgudiTor = (flowType === 'Crónica agudizada' && agudiPhase);
                 const value       = isAgudiTor ? toracicoTxt_A : toracicoTxt;
                 const onChange    = isAgudiTor ? setToracicoTxt_A : setToracicoTxt;
                 const placeholder = isAgudiTor
                   ? 'Describe niveles de agudización Torácicas...'
                   : 'Describe nivel Torácica...';

                 return (
                   <>
                     <TextInput
                       style={styles.textInput}
                       placeholder={placeholder}
                       placeholderTextColor="#888"
                       multiline
                       value={value}
                       onChangeText={onChange}
                     />

                     {value.trim().length > 0 && (
                       <TouchableOpacity
                         style={styles.nextButton}
                        onPress={() => {
             let sig: Jerarquia;
             if (flowType === 'Crónica agudizada') {
               if (!agudiPhase) { setAgudiPhase(true); setAgudiTargetNivel('Torácica'); sig = pasoZ_CroAgu; }
               else { sig = pasoD1_Cronica; }
             } else {
               sig = (flowType === 'Crónica') ? pasoD1_Cronica
                   : (flowType === 'Subaguda') ? pasoC_Subaguda
                   : pasoC_Aguda;
             }

             // ✅ NUEVO (del snippet anterior)
             const value = (isAgudiTor ? toracicoTxt_A : toracicoTxt).trim();
             if (value) {
               if (isAgudiTor) {
                 const raw = `con agudización nivel Torácica: ${value}`;
                 setResumenLista(prev => [
                   ...prev.filter(t => !/^con agudización nivel Torácica:/i.test(t)),
        raw,
      ]);
      addToReport(raw);
    } else {
      const raw = `niveles Torácicas: ${value}`;
      setResumenLista(prev => [
        ...prev.filter(t => !/^niveles Torácicas:/i.test(t)),
        raw,
      ]);
      addToReport(raw);
    }
  }

  // Etiqueta visual del chip (no impacta en reporte)
  const textoPaso = isAgudiTor
    ? `con agudización nivel Torácica: ${value}`
    : `Torácica: ${value}`;

  avanzar({ nombre: 'Torácica', texto: textoPaso, siguiente: sig });
  setExpandedNivel(null);
}}

            >
              <Text style={styles.nextButtonText}>Siguiente</Text>
            </TouchableOpacity>
          )}
        </>
      );
    })()}
  </View>
)}
                    {/* ---------- Lumbosacro ---------- */}
                    {cat.nombre === 'Lumbosacro' && expandedNivel === 'Lumbosacro' && (
                      <View style={styles.expandBlock}>
                   

                        {lumbosacralLevels.map(v=>(
                          <React.Fragment key={v}>
                            <TouchableOpacity
                              style={styles.subCategory}
                              onPress={()=>setExpandedVertebraL(prev=>prev===v?null:v)}
                            >
                              <Text style={styles.categoryText}>
                                {v}{'  '}{expandedVertebraL===v?'-':'+'}
                              </Text>
                            </TouchableOpacity>
                            {expandedVertebraL===v && (
                              <View style={styles.expandBlock}>
                                <Text style={styles.sideLabel}>Izquierdo</Text>
                                <View style={styles.checkboxRow}>
                                  {[1,2,3,4].map(i => {
                                    const id = `${v}_L${i}`;
                                    const checked = readCheckedLeftL.includes(id);
                                    return (
                                      <TouchableOpacity
                                        key={id}
                                        style={styles.checkItem}
                                        onPress={() => useSetL.L(prev => toggleOnePerSide(prev, id))}
                                        onLongPress={() => useSetL.L(prev => prev.filter(x => x !== id))}
                                      >
                                        <View style={[styles.fakeCheckbox, checked && styles.fakeCheckboxChecked]} />
                                        <Text style={styles.checkboxLabel}>{i}</Text>
                                      </TouchableOpacity>
                                    );
                                  })}
                                </View>
                                <Text style={styles.sideLabel}>Derecho</Text>
                                <View style={styles.checkboxRow}>
                                  {[1,2,3,4].map(i => {
                                    const id = `${v}_R${i}`;
                                    const checked = readCheckedRightL.includes(id);
                                    return (
                                      <TouchableOpacity
                                        key={id}
                                        style={styles.checkItem}
                                        onPress={() => useSetL.R(prev => toggleOnePerSide(prev, id))}
                                        onLongPress={() => useSetL.R(prev => prev.filter(x => x !== id))}
                                      >
                                        <View style={[styles.fakeCheckbox, checked && styles.fakeCheckboxChecked]} />
                                        <Text style={styles.checkboxLabel}>{i}</Text>
                                      </TouchableOpacity>
                                    );
                                  })}
                                </View>
                                {flowType === 'Crónica' && (
                                  <View style={{ flexDirection:'row', marginTop:4 }}>
                                    <TouchableOpacity
                                      style={[
                                        styles.sideBtn,
                                        fullSide[v]?.L && styles.sideBtnActive
                                      ]}
                                      onPress={() => toggleFullSide(v, 'L')}
                                    >
                                      <Text style={styles.sideBtnTxt}>Todo Izq.</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                      style={[
                                        styles.sideBtn,
                                        fullSide[v]?.R && styles.sideBtnActive
                                      ]}
                                      onPress={() => toggleFullSide(v, 'R')}
                                    >
                                      <Text style={styles.sideBtnTxt}>Todo Der.</Text>
                                    </TouchableOpacity>
                                  </View>
                                )}
                              </View>
                            )}
                          </React.Fragment>
                        ))}
                      {(checkedLeftL.length>0 ||
   checkedRightL.length>0 ||
   (flowType === 'Crónica' && hasFullSide(lumbosacralLevels))
 ) &&  (
                          <TouchableOpacity style={styles.nextButton} onPress={finalizarLumboMulti}>
                            <Text style={styles.nextButtonText}>Siguiente</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}

                    {/* ---------- Polisegmentario ---------- */}
                    {expandedNivel==='Polisegmentario' && cat.nombre==='Polisegmentario' && (
                      <View style={styles.expandBlock}>
                        {/* toggles */}
                      {/* Cervical */}
<TouchableOpacity
  style={[styles.toggleButton, polC && styles.toggleActive]}
  onPress={() => {
    setPolC(prev => {
      const next = !prev;
      setPolLock(l => ({
        post: next
          ? [...l.post.filter(x => x !== OV_CERV_POST), OV_CERV_POST]
          : l.post.filter(x => x !== OV_CERV_POST),
        ant:  next
          ? [...l.ant.filter(x => x !== OV_CERV_ANT),  OV_CERV_ANT]
          : l.ant.filter(x => x !== OV_CERV_ANT),
      }));
      return next;
    });
  }}
>
  <Text style={styles.toggleText}>Cervical</Text>
</TouchableOpacity>

{/* Torácica */}
<TouchableOpacity
  style={[styles.toggleButton, polT && styles.toggleActive]}
  onPress={() => {
    setPolT(prev => {
      const next = !prev;
      setPolLock(l => ({
        post: next
          ? [...l.post.filter(x => x !== OV_TORAX_POST), OV_TORAX_POST]
          : l.post.filter(x => x !== OV_TORAX_POST),
        ant:  next
          ? [...l.ant.filter(x => x !== OV_TORAX_ANT),  OV_TORAX_ANT]
          : l.ant.filter(x => x !== OV_TORAX_ANT),
      }));
      return next;
    });
  }}
>
  <Text style={styles.toggleText}>Torácica</Text>
</TouchableOpacity>

{/* Lumbosacro */}
<TouchableOpacity
  style={[styles.toggleButton, polL && styles.toggleActive]}
  onPress={() => {
    setPolL(prev => {
      const next = !prev;
      setPolLock(l => ({
        post: next
          ? [...l.post.filter(x => x !== OV_LUMBO_POST), OV_LUMBO_POST]
          : l.post.filter(x => x !== OV_LUMBO_POST),
        ant:  next
          ? [...l.ant.filter(x => x !== OV_LUMBO_ANT),  OV_LUMBO_ANT]
          : l.ant.filter(x => x !== OV_LUMBO_ANT),
      }));
      return next;
    });
  }}
>
  <Text style={styles.toggleText}>Lumbosacro</Text>
</TouchableOpacity>


                        {/* ► botón “Siguiente” solo cuando hay algo marcado */}
                        {(polC || polT || polL) && (
                          <TouchableOpacity
                            style={styles.nextButton}
                            onPress={finalizarPolisegmentario}
                          >
                            <Text style={styles.nextButtonText}>Siguiente</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                ))
              )
            ) : (
              /* NIVEL no es el título actual */
              nivelActual.opciones.map(op=>(
                <TouchableOpacity
                  key={op.nombre}
                  style={styles.category}
                  onPress={()=>handleNext(op)}
                >
                  <Text style={styles.categoryText}>{op.nombre}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
{/* Selector modo */}
<View style={styles.modeSelector}>
  {(['reporte','lista'] as const).map(tab => (
    <TouchableOpacity
      key={tab}
      style={[styles.modeButton, activeTab === tab && styles.modeButtonActive]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={styles.modeText}>
        {tab === 'reporte' ? 'Reporte' : 'Lista'}
      </Text>
    </TouchableOpacity>
  ))}


  {/* ➜ Nuevo botón: Generar Link */}
  <TouchableOpacity
    style={[styles.modeButton, activeTab === 'GenerarLink' && styles.modeButtonActive]}
    onPress={() => setActiveTab('GenerarLink')}      // <-- aquí el cambio
  >
    <Text style={styles.modeText}>Generar Link</Text>
  </TouchableOpacity>
</View>

{/* Resumen */}
<View style={styles.reporteContainer}>
  <Text style={styles.reporteTitle}>Radiculopatía</Text>
{activeTab === 'lista' ? (
  flowType === 'Sensitiva' ? (
     <View style={{ alignSelf:'stretch' }}>
     <Text
  style={[
    styles.reporteTexto,
    { textAlign:'center', alignSelf:'stretch' },
  ]}
>
  <Text style={styles.boldLabel}>Fibras</Text> {'\u2013'} Sensitiva
</Text>
      {/* Línea 1: Patología */}
      <Text
        style={[
          styles.reporteTexto,
          { textAlign:'center', alignSelf:'stretch' },
        ]}
      >
                <Text style={styles.boldLabel}>Patología</Text> {'\u2013'} {sensPatologia}
      </Text>

      {/* Línea(s) 2: Nivel – <nivel> <lado> */}
      {(['C6-C7','S1'] as const).map((lvl) => {
        const side = selectedSensitiva[lvl];
        if (!side) return null;
        const sideTxt =
          side === 'Izquierda' ? 'izquierdo' :
          side === 'Derecha'   ? 'derecho'   :
                                 'bilateral';

        return (
          <Text
            key={`nivel-${lvl}`}
            style={[styles.reporteTexto, { textAlign:'center', alignSelf:'stretch' }]}
          >
            <Text style={styles.boldLabel}>Nivel</Text> {'\u2013'} {lvl} {sideTxt}
          </Text>
        );
      })}
    </View>
  ) : (
   
    <View style={{ alignSelf: 'stretch' }}>
      {listaRender.map(({ label, txt }) => {
        const { label: L, txt: T } = formatLista(label, txt);
        return (
          <Text key={L} style={[styles.reporteTexto, { textAlign:'center', alignSelf:'stretch' }]}>
            <Text style={styles.boldLabel}>{L}</Text> {'\u2013'} {T}
          </Text>
        );
      })}
    </View>
  )
) : (
    <View>
      <Text style={[styles.reporteTexto, styles.justify]}>
        {textoVisual || ''}
      </Text>
      {/* Botón para abrir modal de edición */}
      <TouchableOpacity
        style={{
          marginTop: 10,
          padding: 10,
          backgroundColor: '#222',
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
  )}
</View>
      </ScrollView>
      
{mountExport && imgSize && (
  <View
    key={`export_p1_${exportKey}`}
    ref={exportRefP1}
    style={{
      position: 'absolute',
      left: -10000, top: -10000, zIndex: -1,
      width: pdfOrientation === 'portrait' ? imgSize.w : imgSize.w * 2,
      height: pdfOrientation === 'portrait'
        ? (imgSize.h * 2 + (pdf.page1?.extraH || 200))
        : (imgSize.h + (pdf.page1?.extraH || 200)),
      backgroundColor: plantillaId === 'none' ? '#fff' : 'transparent',
      pointerEvents: 'none',
      paddingBottom: px((pdf.footer.boxH || 60) + (pdf.footer.lift || 12)),
    }}
    collapsable={false}
    removeClippedSubviews={false}
  >
    {/* HEADER HOJA 1 */}
    <View style={{
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: px(pdf.header.padH),
      paddingTop: px(pdf.header.padV),
      marginTop: px(pdf.header.topOffset || 0),  // Offset adicional para mover el header
      marginBottom: -px(pdf.header.topOffset || 0),  // Margen negativo para NO empujar el contenido
    }}>
      <Text style={{ color:'#000', fontSize: px(pdf.header.nameSize), fontWeight:'700', marginTop: -25, flex: 1 }}>
        {nombrePaciente || ''}
      </Text>
      {!!userData?.imageUrl && (
        <View style={{ borderWidth: 0, overflow: 'visible' }}>
          <Image
            source={{ uri: userData.imageUrl }}
            style={{
              width: px(pdf.header.logoW),
              height: px(pdf.header.logoH),
              borderWidth: 0,
              borderColor: 'transparent',
              borderRadius: 0,
              position: 'relative',
              top: -37,
              right: 70
            }}
            resizeMode="contain"
            fadeDuration={0}
            {...GPU}
          />
        </View>
      )}
    </View>

    {/* IMÁGENES: lado a lado en landscape / apiladas en portrait */}
    <View style={{
      flexDirection: pdfOrientation === 'portrait' ? 'column' : 'row',
      width: '100%',
      height: pdfOrientation === 'portrait' ? imgSize.h * 2  : imgSize.h ,
      overflow: 'visible',
      alignItems: 'center',
      justifyContent: 'center',
    }}
    removeClippedSubviews={false}
    collapsable={false}
    >
      <View
        key="export-post-view"
        style={{
          width: pdfOrientation === 'portrait' ? '100%' : imgSize.w ,
          height: imgSize.h ,
          overflow: 'visible',
        }}
        removeClippedSubviews={false}
        collapsable={false}
        >
        <CanvasView key="canvas-post" vistaForExport="post" includeFigures transparentBg={plantillaId !== 'none'} />
      </View>
      <View
        key="export-ant-view"
        style={{
          width: pdfOrientation === 'portrait' ? '100%' : imgSize.w ,
          height: imgSize.h,
          overflow: 'visible',
        }}
        removeClippedSubviews={false}
        collapsable={false}
        >
        <CanvasView key="canvas-ant" vistaForExport="ant" includeFigures transparentBg={plantillaId !== 'none'} />
      </View>
    </View>
   {/* DIAGNÓSTICO (limitado en alto para no empujar el footer) */}
{(() => {
  const canvasH = pdfOrientation === 'portrait'
  ? (imgSize.h * 2 + (pdf.page1?.extraH || 200))
  : (imgSize.h + (pdf.page1?.extraH || 200));
  const headerH = px(pdf.header.logoH) + px(pdf.header.padV) + 8;
  const imgsH   = pdfOrientation === 'portrait' ? imgSize.h * 2 : imgSize.h;
  const footerRes = px((pdf.footer.boxH || 60) + (pdf.footer.lift || 12));
  const diagMaxH = Math.max(80, canvasH - headerH - imgsH - footerRes - 16);
  const diagTxt = (textoVisual || resumenEnunciado || '').trim();
  const diagMargin = Math.max(12, footerRes / 2);
  const usableH = Math.max(48, diagMaxH - 24);

  return (
    <View
      style={[
        styles.exportReportBoxWhite,
        {
          borderTopWidth: 0,
          paddingTop: 24,
          maxHeight: diagMaxH,
          marginBottom: diagMargin,
          backgroundColor: 'transparent'
        },
      ]}
    >
      <Text style={[styles.exportReportTitleBlack, { fontSize: 11 }]}>Diagnóstico</Text>
      {/* 👇 Auto-encoge hasta que quepa en la hoja 1 */}
      <AutoFitDiagnostico
        text={diagTxt}
        maxHeight={usableH}
        maxSize={10}
        minSize={7}
      />
    </View>
  );
})()}
    <View style={{
      position: 'absolute',
      left: 0, right: 0,
      bottom: px(pdf.footer.lift || 12),
    }}>
      <FooterInfo />
    </View>
  </View>
)}

{mountExport && (
<View
  key={`export_p2_${exportKey}`}
  ref={exportRefP2}
  style={{
    position: 'absolute',
    left: -10000,   // 👈 fuera de pantalla
    top: -10000,    // 👈 fuera de pantalla
    zIndex: -1,
    width: imgSize ? imgSize.w * 2 : 1,
    height: imgSize ? imgSize.h + 180 : 1,
    backgroundColor: plantillaId === 'none' ? '#fff' : 'transparent',
    pointerEvents: 'none',
    paddingBottom: 10,
  }}
  collapsable={false}
  shouldRasterizeIOS

>
  {/* HEADER */}
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: px(pdf.header.padH),
      paddingTop: px(pdf.header.padV),
    }}
  >
   
  </View>
 {/* ⬇⬇⬇ SPACER para bajar todo el contenido real */}
  <View style={{ height: px(pdf.page2?.shiftDown || 0) }} />
  {/* DOS COLUMNAS */}
  <View
    style={{
      flexDirection: 'row',
      paddingHorizontal: px(pdf.page2.contentPadH),
      paddingTop: 8,
      width: '100%',
      alignItems: 'flex-start',
      gap: 16,
    }}
  >
    {/* IZQUIERDA más angosta: LISTA */}
    <View style={{ flex: pdf.page2.listaFlex || 5, paddingLeft: px(pdf.page2.listaPadLeft), paddingRight: px(pdf.page2.listaPadRight) }}>
      <View style={{ marginBottom: 14 }}>
        <Text style={{ color: '#000', fontSize: 10, fontWeight: 'bold', marginBottom: 6 }}>
          Radiculopatía
        </Text>

 {flowType === 'Sensitiva' ? (
  /* ======== LISTA ESPECIAL PARA SENSITIVA (HOJA 2) ======== */
 <View style={{ width: '100%' }}>
    {/* Línea 0: Evolución */}
    <Text style={{ color:'#000', fontSize:8, lineHeight:12, marginBottom:2, width: '100%' }}>
      <Text style={{ fontWeight:'bold' }}>Evolución</Text> {'\u2013'} Sensitiva
    </Text>
    {/* Línea 1: Patología */}
    {!!sensPatologia && (
      <Text style={{ color: '#000', fontSize: 8, lineHeight: 12, marginBottom: 2, width: '100%' }}>
        <Text style={{ fontWeight: 'bold' }}>Patología</Text> {'\u2013'} {sensPatologia}
      </Text>
    )}
    {/* Líneas 2..n: Nivel – <C6-C7|S1> <izquierdo|derecho|bilateral> */}
    {(['C6-C7','S1'] as const).map((lvl) => {
      const side = selectedSensitiva[lvl];
      if (!side) return null;
      // "Izquierda"→"izquierdo", "Derecha"→"derecho", "Bilateral"→"bilateral"
      const sideTxt =
        side === 'Izquierda' ? 'izquierdo' :
        side === 'Derecha'   ? 'derecho'   :
                               'bilateral';
      return (
        <Text
          key={`nivel-${lvl}`}
          style={{ color: '#000', fontSize: 8, lineHeight: 12, marginBottom: 2, width: '100%' }}
        >
          <Text style={{ fontWeight: 'bold' }}>Nivel</Text> {'\u2013'} {lvl} {sideTxt}
        </Text>
      );
    })}
  </View>
) : (
  /* ======== LISTA GENERAL PARA EL RESTO DE FLUJOS ======== */
  (listaRender.length === 0 ? (
    <Text style={{ color: '#000', fontSize: 8, lineHeight: 12 }} />
  ) : (
    listaRender.map(({ label, txt }) => {
      const { label: L, txt: T } = formatLista(label, txt);
      return (
        <Text
          key={L}
          style={{ color: '#000', fontSize: 8, lineHeight: 12, marginBottom: 2, width: '100%' }}
        >
          <Text style={{ fontWeight: 'bold' }}>{L}</Text> {'\u2013'} {T}
        </Text>
      );
    })
  ))
)}
      </View>
    </View>

    {/* DERECHA más ancha: COMENTARIO CLÍNICO */}
    <View style={{ flex: pdf.page2.comentarioFlex || 8, paddingLeft: px(pdf.page2.comentarioPadLeft), paddingRight: px(pdf.page2.comentarioPadRight), paddingTop: px(pdf.page2.comentarioPadTop || 0) }}>
      <View
        style={{
          width: '100%',
          borderRadius: 8,
          backgroundColor: 'transparent',
          paddingRight: 12,
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 0,
        }}
      >
        <Text style={{
          color: '#000',
          fontSize: 8,
          lineHeight: 12,
          textAlign: 'justify',
          width: '100%'
        }}>
          {comentarioLista?.trim() ? comentarioLista.trim() : ''}
        </Text>
      </View>
    </View>
  </View>

 {/* TABLA SELECCIONADA — posición absoluta para que siempre esté fija */}
 {imgListaSrc && (
   <View
     style={{
       position: 'absolute',
       top: px(pdf.page2.tableTop || 420),
       left: 0,
       right: 0,
       alignItems: 'center',
       zIndex: 10,
     }}
   >
     <View
       style={{
         width: pdf.page2.tableWidth || '60%',
       }}
     >
     <Text
       style={{
         color: '#000',
         fontSize: 14,
         fontWeight: 'bold',
         textAlign: 'center',
         marginBottom: 6,
       }}
     >

     </Text>
     <Image
       source={imgListaSrc}
       style={{
         width: '100%',
         height: undefined,
         aspectRatio: imgListaAR || 16 / 10,
         backgroundColor: 'transparent',
         borderRadius: 8,
       }}
       resizeMode="contain"
       {...GPU}
     />
     </View>
   </View>
 )}
</View>
)}
            {/* Overlay de carga mientras se exporta */}
      {exporting && (
  <View style={styles.loadingOverlay}>
    <ActivityIndicator size="large" color="#ff4500" />
    <AnimatedLetters
      key={rerenderKey}
      value="Exportando..."
      letterStyle={styles.loadingText}
      animationDirection="bottom-to-top"
      isSameAnimationDelay
      animateOnLoad
    />
  </View>
)}
      {isCargaCerrar && (
        <View style={styles.logoutOverlay}>
          <Text style={styles.logoutText}>Cerrando sesión...</Text>
          <ActivityIndicator size="large" color="#E65800" />
        </View>
      )}

      <TemplatePickerModal
        visible={templatePickerVisible}
        onSelect={handleTemplatePicked}
        onClose={handleTemplatePickerClose}
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
        initialText={textoVisual}
        onSave={(newText) => {
          setTextoVisual(newText);
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
/* -------------------------------------------------------------------------- */
/* Estilos */
const styles = StyleSheet.create({
  /* --- chips ----------------------------------------------------- */
  tagBar:{
    flexDirection:'row',
    marginBottom:8,
    paddingVertical:2,
  },
  justify: { textAlign: 'justify' },
  tag:{
    backgroundColor:'#222',
    paddingVertical:4,
    paddingHorizontal:12,
    borderRadius:14,
    marginRight:6,
  },
  tagOrange:{
    backgroundColor:'#ff4500',
  },
  tagText:{
    color:'#fff',
    fontSize:12,
  },
  //Estilos para el spinner de cargado de cerrar sesion
  logoutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  logoutText: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'LuxoraGrotesk-Light',
  },
  container:{flex:1,backgroundColor:'#000'},
  title:{color:'#fff',fontSize:22,backgroundColor:'#222',paddingVertical:6,paddingHorizontal:12,borderRadius:8 , fontFamily: 'LuxoraGrotesk-Italic',
},
  iconContainer:{flexDirection:'row',width:200,justifyContent:'space-between'},
  iconCircle:{width:44,height:44,borderRadius:22,borderWidth:1.5,borderColor:'#ff4500',backgroundColor:'black',alignItems:'center',justifyContent:'center'},
  menuItemIcon:{width:24,height:24,tintColor:'#fff',resizeMode:'contain'},
  scrollContent:{padding:7,flexGrow:1},
  imageSection:{backgroundColor:'#222',borderRadius:20,overflow:'visible',marginBottom:8},
  fullImage:{flex:1,width:'100%',height:'100%'},
  imageRadius:{borderRadius:20},
  modeSelector:{flexDirection:'row',justifyContent:'center',marginBottom:12,marginTop:17},
  modeButton:{padding:8,borderRadius:6,backgroundColor:'#222',marginHorizontal:6},
  modeButtonActive:{backgroundColor:'#ff4500'},
  modeText:{color:'#fff',fontSize:14},
  reporteContainer: {
    marginTop: 4,
    backgroundColor: '#111',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reporteTexto:{color:'#fff',fontSize:14,lineHeight:20},
  optionsSection: {
    flexDirection: 'row',       
    backgroundColor: '#000000ff',
    borderRadius: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: '#fff',
    marginTop: 10,
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
  },
  categoryContainer:{flex:1},
  category:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',backgroundColor:'#222',padding:15,borderRadius:20,marginBottom:6, marginLeft:40,marginRight:40},
  subCategory:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',backgroundColor:'#333',padding:10,borderRadius:16,marginBottom:2},
  expandBlock:{paddingHorizontal:12,marginBottom:12},
  sideLabel:{color:'#fff',fontSize:14,marginTop:8,marginBottom:4},
  checkboxRow:{flexDirection:'row',flexWrap:'wrap',marginBottom:8},
  checkItem:{flexDirection:'row',alignItems:'center',marginRight:16,marginBottom:8},
  fakeCheckbox:{width:20,height:20,borderWidth:1,borderColor:'#fff',borderRadius:4,marginRight:6},
  fakeCheckboxChecked:{backgroundColor:'#ff4500'},
  checkboxLabel:{color:'#fff',fontSize:16},
  toggleButton:{backgroundColor:'#222',padding:10,borderRadius:8,marginVertical:4,alignItems:'center'},
  toggleActive:{backgroundColor:'#ff4500'},
  toggleText:{color:'#fff',fontSize:16},
  textInput:{backgroundColor:'#222',color:'#fff',borderRadius:8,padding:10,minHeight:60},
  nextButton:{alignSelf:'flex-end',backgroundColor:'#ff4500',paddingVertical:8,paddingHorizontal:16,borderRadius:8,marginTop:8},
  nextButtonText:{color:'#fff',fontSize:16},
  cross: {position: 'absolute',width: 40, height: 40, zIndex: 3, resizeMode: 'contain'},
  overlayImage: { position: 'absolute', top: 0,left: 0,width: '100%',height: '100%',zIndex: 2,resizeMode: 'contain',},
  sideBtn: {flex:1,backgroundColor:'#222', paddingVertical:6, marginHorizontal:4, borderRadius:8, alignItems:'center',},
  sideBtnActive:{ backgroundColor:'#ff4500' },
  sideBtnTxt:{ color:'#fff', fontSize:14 },

  // ─── Nuevo estilo para el título del reporte ─────
  reporteTitle: {
    fontSize: 18,
    color: 'orange',
    fontWeight: 'bold',
    marginBottom: 8,
  },

  titleText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryText: {
    color: 'white',
    fontSize: 16,
  },

  //
exportTwoCols: {
  flexDirection: 'row',
  width: '100%',
  marginTop: 15,
},

exportLeft: {
  flex: 1,
  paddingRight: 12,
  borderRightWidth: 1,
  borderRightColor: '#444', // ajusta tono si la quieres más visible
},

exportRight: {
  flex: 1,
  paddingLeft: 12,
  minHeight: 120,            // asegura algo de alto aunque esté vacío
  justifyContent: 'flex-start',
},
  tituloFiguras:{
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center',
    marginBottom:30,
    marginTop:30
  },
  imagenCirculo:{
    width:60,
    height:60,
    borderRadius:40,
    borderWidth:2,
    borderColor:'#fff',
  },
  imagenCuadro:{
    width:60,
    height:60,
    borderWidth:2,
    borderColor:'#fff',
    marginLeft:20,
  },
  nombrePacienteContainer:{
    flexDirection:'column',
    alignItems:'center',
    gap:8,
    marginTop:10,
  },
  labelPaciente:{
    fontSize:14,
    color:'#fff',
  },

  exportReportBoxWhite: { backgroundColor:'#fff', borderTopWidth:1, borderTopColor:'#ddd', paddingHorizontal:16, paddingVertical:12 },
  exportReportTitleBlack: { color:'#000', fontSize:14, fontWeight:'bold', marginBottom:6 },
  exportReportTextBlack: { color:'#000', fontSize:13, lineHeight:19 },
   loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },

  // Top Bar ahora centra SOLO el input
topBar: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 12,
  backgroundColor: '#000',
},

// Input en Top Bar (nuevo contenedor)
nombrePacienteContainerTop: {
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
  width: '100%',
},

// Wrapper de la sección de export
exportWrapper: {
  width: '100%',
  marginTop: 15,
},

// Header centrado encima de ambas columnas
exportHeader: {
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 12,
},

// Fila de botones (centrados, con separación y wrap si hace falta)
toolbarRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,         // si tu RN no soporta gap, usa marginRight en cada icono
  flexWrap: 'wrap',
},
  placeholderBox: {
  backgroundColor: '#111',
  borderRadius: 10,
  borderWidth: 1,
  borderColor: '#333',
  padding: 12,
  marginTop: 6,
  alignSelf: 'stretch',
},
placeholderTitle: {
  color: '#fff',
  fontSize: 16,
  fontWeight: '700',
  textAlign: 'center',
  marginBottom: 6,
},
placeholderText: {
  color: '#bbb',
  fontSize: 12,
  textAlign: 'center',
},
BotonReporte: {
  height:90,
  overflow: 'hidden',
  marginBottom: 10,
  justifyContent:'center',
  alignContent:'center',
  marginLeft:60,
  marginRight:60,
  padding:7

},
backgroundBoton: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
},
imagenFondoBoton: {
  resizeMode: 'cover',
  opacity: 0.9,
  borderRadius: 10,
},
inputReporte: {
  backgroundColor: '#111',
  borderWidth: 1,
  borderColor: '#333',
  color: '#fff',
  borderRadius: 10,
  justifyContent:'center',
  height:40,
  marginBottom:10,
  marginTop:10,
  left:5,
  textAlign: 'center',
},

galleryNavRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,              
  paddingVertical: 8,
  marginTop: 6,
  marginBottom: 10,      
},
galleryArrowBtn: {
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: '#222',
  borderWidth: 1,
  borderColor: '#ff4500',
  alignItems: 'center',
  justifyContent: 'center',
},
galleryArrowDisabled: {
  opacity: 0.4,
},
galleryCenter: {
  minWidth: 140,
  alignItems: 'center',
  justifyContent: 'center',
},
galleryLabel: {
  color: '#fff',
  fontSize: 14,
  fontWeight: '600',
  marginBottom: 4,
},
galleryDots: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
},
dot: {
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: '#555',
},
dotActive: {
  backgroundColor: '#ff4500',
},

dotBar: {
  position: 'absolute',
  bottom: 8,
  left: 0,
  right: 0,
  flexDirection: 'row',
  justifyContent: 'center',
  gap: 8,
},
boldLabel: {
  fontWeight: 'bold',
},
});
