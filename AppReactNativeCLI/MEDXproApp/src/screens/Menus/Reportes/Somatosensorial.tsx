// src/screens/reporte/ReporteViasSomatosensorialScreen.tsx
import React, { useState, useContext, createContext, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  TextInput,
  Platform,
  PermissionsAndroid,
  Alert,
  useWindowDimensions,
  Keyboard,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import uuid from 'react-native-uuid';
import ComentarioModal from '../../../components/ComentarioModal';
import { Asset } from 'expo-asset';        // para resolver assets PDF
import { captureRef } from 'react-native-view-shot';
import ReactNativeBlobUtil from 'react-native-blob-util';

// Servicio centralizado de plantillas PDF
import {
  buildPdfWithTemplate,
  type PdfBuildConfig,
} from '../../../components/pdfLoadingTemplate';

// Modal de exito - Exportar pdf
import { ExportSuccessModal } from '../../../components/ExportSuccessModal';
import EditTextModal from '../../../components/EditTextModal';
import Header from '../../../components/Header';
import FiguraMovible from '../../../components/FiguraMovibleVias';
import LinkUploader, { type LinkUploaderProps } from '../../../components/LinkUploader';
import TemplatePickerModal, { type PlantillaId } from '../../../components/TemplatePickerModal';
import FancyInput from '../../../components/FancyInput';
import type { ImageSourcePropType } from 'react-native';
import { InteractionManager } from 'react-native';
import * as FileSystem from 'expo-file-system';

// NUEVOS imports (sin duplicar)
import { ImageBackground } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, SUPABASE_ANON_KEY, SUPABASE_URL } from '../../../constants/config';
import { initShareLink, completeShareLink } from '../../../services/shareLinks';
import GaleriaEmergente from './GaleriaTb';
import { supabase } from '../../../lib/supabase';
import { decode as b64decode, encode as b64encode } from 'base64-arraybuffer';

export type { PlantillaId } from '../../../components/TemplatePickerModal';


const explainAxios = (err: any) => {
  try {
    if (err?.isAxiosError) {
      const url = err.config?.baseURL
        ? `${err.config.baseURL}${err.config.url || ''}`
        : (err.config?.url || '(sin url)');
      const data =
        typeof err.response?.data === 'string'
          ? err.response.data
          : JSON.stringify(err.response?.data);
      return `Axios ${err.config?.method?.toUpperCase() || ''} ${url} → ${err.response?.status} ${err.response?.statusText}\n${data || ''}`;
    }
  } catch {}
  return String(err);
};

// ⚠️ Cambia por el nombre de TU bucket
const BUCKET = 'report-packages'; 

// “24h” | “5d” → segundos (para URLs firmadas)
const expiryToSeconds = (e: '24h'|'5d') =>
  e === '24h' ? 60*60*24 : 60*60*24*5;

// Si tu bucket es PRIVADO, pon esto a true para usar createSignedUrl (download temporal).
// Si es público, déjalo en false y usaremos getPublicUrl (descarga pública).
const USE_SIGNED_URLS = true;

// Convierte string → Uint8Array (para subir HTML de landing)
const strToUint8 = (s: string) => {
  // RN moderno suele traer TextEncoder por el polyfill que ya tienes
  // (react-native-url-polyfill/auto). Si no, fallback manual.
  // @ts-ignore
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(s);
  const utf8 = unescape(encodeURIComponent(s));
  const arr = new Uint8Array(utf8.length);
  for (let i = 0; i < utf8.length; i++) arr[i] = utf8.charCodeAt(i);
  return arr;
};

// Asegura nombre de archivo “seguro”
const sanitizeFilename = (name: string) =>
  name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w.\- ]+/g, '')
      .replace(/\s+/g, '_');

// De tus URIs (content://, file://, ph://) a un path legible y lectura base64
const uriToReadablePath = async (rawUri: string) => {
  if (rawUri.startsWith('content://')) {
    try {
      const st = await ReactNativeBlobUtil.fs.stat(rawUri);
      if (st?.path) return decodeURIComponent(st.path.replace(/^file:\/\//, ''));
    } catch {}
    return rawUri; // último recurso
  }
  if (rawUri.startsWith('file://')) return decodeURIComponent(rawUri.replace('file://', ''));
  return decodeURIComponent(rawUri);
};

const readAsArrayBuffer = async (rawUri: string) => {
  const path = await uriToReadablePath(rawUri);
  const base64 = await ReactNativeBlobUtil.fs.readFile(path, 'base64');
  return b64decode(base64);
};

// Devuelve URL de descarga según el modo (público o firmado)
const makeDownloadUrl = async (path: string, expiry: '24h'|'5d') => {
  if (USE_SIGNED_URLS) {
    const { data, error } = await supabase
      .storage.from(BUCKET)
      .createSignedUrl(path, expiryToSeconds(expiry));
    if (error) throw error;
    return data.signedUrl;
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

// ── helpers NUEVOS ──────────────────────────────────────────────
const makeSupabaseAbsolute = (u: string) => {
  if (/^https?:\/\//i.test(u)) return u;
  const base = `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1`;
  if (u.startsWith('/storage/v1')) return `${SUPABASE_URL.replace(/\/$/, '')}${u}`;
  return `${base}${u.startsWith('/') ? '' : '/'}${u}`;
};
const resolveUploadData = async (rawUri: string) => {
  // content:// → intentamos path real, si no, usamos el content:// tal cual
  if (rawUri.startsWith('content://')) {
    try {
      const st = await ReactNativeBlobUtil.fs.stat(rawUri);
      if (st?.path) {
        const decoded = decodeURIComponent(st.path);
        const exists = await ReactNativeBlobUtil.fs.exists(decoded);
        if (exists) return ReactNativeBlobUtil.wrap(decoded);
      }
    } catch {}
    return ReactNativeBlobUtil.wrap(rawUri);
  }

  // file:// → quitar esquema y DECODIFICAR (acentos/espacios)
  if (rawUri.startsWith('file://')) {
    const decodedPath = decodeURIComponent(rawUri.replace('file://', ''));
    return ReactNativeBlobUtil.wrap(decodedPath);
  }

  // path “desnudo”
  return ReactNativeBlobUtil.wrap(decodeURIComponent(rawUri));
};



/* Loading */
import { Circle } from 'react-native-animated-spinkit';
import AnimatedLetterText from 'react-native-animated-letter-text';

/* Assets barra / toolbar */
import I_Regresar  from '../../../assets/03_Íconos/03_02_PNG/I_Out2.png';
import I_Refrescar from '../../../assets/03_Íconos/03_02_PNG/I_Repeat2.png';
import I_Imprimir  from '../../../assets/03_Íconos/03_02_PNG/I_Document.png';
import { escanearImagen } from '../../../utils/EscanearImagen';


/* Base (imagen somatosensorial) */
const IMG_BASE = require('../../../assets/CuerpoPng/SomatosensorialImg/SO_BASE_BLANCO.png');
const IMG_BASE_TRANSPARENT = require('../../../assets/CuerpoPng/SomatosensorialImg/SO_BASE_TR.png');
const BASE_SRC = Image.resolveAssetSource(IMG_BASE);
const BASE_AR  = BASE_SRC.width / BASE_SRC.height;

// PLANTILLAS_PDF ahora se importa desde pdfLoadingTemplate (servicio centralizado)

// ====== Ajustes rapidos para el PDF (cambialos aqui) ======
type PdfConfig = {
  paper: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  renderScale: number;
  pageMargin: number;
  header: {
    height: number; padH: number; padTop: number; padBottom: number;
    afterGap?: number;
    offsetDown?: number;
    patient: { labelSize: number; nameSize: number; weight: '400'|'600'|'700' };
    logo: { size: number; opacity: number; fogOpacity: number; fogPad: number };
  };
  lamina: { widthFrac: number; minHeight: number };
  diag: {
    minHeight: number; padH: number; padV: number;
    titleSize: number; textSize: number; lineHeight: number;
    pullUp: number; borderW: number; borderColor: string; radius: number;
    topGap?: number;
    offsetUp?: number;
  };
  footer: {
    height: number; padH: number; padV: number; opacity: number;
    itemGap: number; icon: number; text: number; iconTextGap: number;
    raise?: number;
    beforeGap?: number;
    marginTop?: number;
  };
  page1?: {
    shiftDown?: number;
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
    height: 56, padH: 70, padTop: 30, padBottom: 6, afterGap: 10, offsetDown: 12,
    patient: { labelSize: 12, nameSize: 12, weight: '700' },
    logo: { size: 48, opacity: 0.95, fogOpacity: 0.2, fogPad: 6 },
  },
  lamina: { widthFrac: 0.94, minHeight: 240 },
  diag: {
    minHeight: 130, padH: 64, padV: 12,
    titleSize: 11, textSize: 10.5, lineHeight: 17,
    pullUp: 10, borderW: 0, borderColor: 'transparent', radius: 10, topGap: 0, offsetUp: 12,
  },
  footer: {
    height: 54, padH: 12, padV: 8, opacity: 0.9,
    itemGap: 9, icon: 14, text: 7.5, iconTextGap: 4,
    raise: 0,
    beforeGap: 6,
    marginTop: 20,
  },
  page2: {
    shiftDown: 94,
  },
  debug: false,
};



/* ======  RUTAS ESTÁTICAS  ======  */
const IMG = {
SUPERIOR_DER      : require('../../../assets/CuerpoPng/SomatosensorialImg/SUPERIORIZQUIERDA.png'),
SUPERIOR_IZQ      : require('../../../assets/CuerpoPng/SomatosensorialImg/SUPERIORDERECHA.png'),
INFERIOR_DER      : require('../../../assets/Viasneurologicas/Somatos/Version2/Izquierda/inferior_izquierda.png'),
INFERIOR_IZQ      : require('../../../assets/CuerpoPng/SomatosensorialImg/INFERIORDERECHA.png'),

ALT_SUP_DER       : require('../../../assets/CuerpoPng/SomatosensorialImg/ViaAfectada/alteradaizquierdasuperior.png'),
ALT_SUP_IZQ       : require('../../../assets/CuerpoPng/SomatosensorialImg/ViaAfectada/ViaDerecha/alteradaderechasuperior.png'),
ALT_INF_DER       : require('../../../assets/CuerpoPng/SomatosensorialImg/ViaAfectada/alteradaizquierdainferior.png'),
ALT_INF_IZQ       : require('../../../assets/CuerpoPng/SomatosensorialImg/ViaAfectada/ViaDerecha/alteradaderechainferior.png'),

TRI_2             : require('../../../assets/CuerpoPng/SomatosensorialImg/TRI_1.png'),
TRI_1             : require('../../../assets/CuerpoPng/SomatosensorialImg/TRI_2.png'),
TRI_ALT_DER_LEV       : require('../../../assets/Viasneurologicas/SomatosensorialTrigemino/ViaAfectada/Naranja/TRI_Naranja_1.png'),
TRI_ALT_IZQ_LEV       : require('../../../assets/Viasneurologicas/SomatosensorialTrigemino/ViaAfectada/Naranja/TRI_Naranja_2.png'),
TRI_ALT_DER_MOD       : require('../../../assets/Viasneurologicas/SomatosensorialTrigemino/ViaAfectada/TR_1.png'),
TRI_ALT_IZQ_MOD       : require('../../../assets/Viasneurologicas/SomatosensorialTrigemino/ViaAfectada/TR_2.png'),
TRI_ALT_DER_SEV       : require('../../../assets/Viasneurologicas/SomatosensorialTrigemino/ViaAfectada/Marron/TRI_Marron_1.png'),
TRI_ALT_IZQ_SEV       : require('../../../assets/Viasneurologicas/SomatosensorialTrigemino/ViaAfectada/Marron/TRI_Marron_2.png'),

IZQ_SUP_CORT_LEVE   : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Naranja/SO_Naranja_9-D.png'),
DER_SUP_CORT_LEVE   : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Naranja/SO_Naranja_9.png'),
IZQ_SUP_CORT_MOD    : require('../../../assets/Viasneurologicas/Somatos/Version1/Viaafectada/ViaDerecha/SO_9-D.png'),
DER_SUP_CORT_MOD    : require('../../../assets/Viasneurologicas/Somatos/Version1/Viaafectada/SO_9.png'),
IZQ_SUP_CORT_SEV    : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Marron/SO_Marron_9-D.png'),
DER_SUP_CORT_SEV    : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Marron/SO_Marron_9.png'),

IZQ_SUP_SUB_LEVE    : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Naranja/SO_Naranja_8-D.png'),
DER_SUP_SUB_LEVE    : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Naranja/SO_Naranja_8.png'),
IZQ_SUP_SUB_MOD     : require('../../../assets/Viasneurologicas/Somatos/Version1/Viaafectada/ViaDerecha/SO_8-D.png'),
DER_SUP_SUB_MOD     : require('../../../assets/Viasneurologicas/Somatos/Version1/Viaafectada/SO_8.png'),
IZQ_SUP_SUB_SEV     : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Marron/SO_Marron_8-D.png'),
DER_SUP_SUB_SEV     : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Marron/SO_Marron_8.png'),

IZQ_SUP_CERV_LEVE   : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Naranja/SO_Naranja_7-D.png'),
DER_SUP_CERV_LEVE   : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Naranja/SO_Naranja_7.png'),
IZQ_SUP_CERV_MOD    : require('../../../assets/Viasneurologicas/Somatos/Version1/Viaafectada/ViaDerecha/SO_7-D.png'),
DER_SUP_CERV_MOD    : require('../../../assets/Viasneurologicas/Somatos/Version1/Viaafectada/SO_7.png'),
IZQ_SUP_CERV_SEV    : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Marron/SO_Marron_7-D.png'),
DER_SUP_CERV_SEV    : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Marron/SO_Marron_7.png'),

IZQ_SUP_PER_LEVE    : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Naranja/SO_Naranja_6-D.png'),
DER_SUP_PER_LEVE    : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Naranja/SO_Naranja_6.png'),
IZQ_SUP_PER_MOD     : require('../../../assets/Viasneurologicas/Somatos/Version1/Viaafectada/SO_R_6-D.png'),
DER_SUP_PER_MOD     : require('../../../assets/Viasneurologicas/Somatos/Version1/Viaafectada/SO_R_6.png'),
IZQ_SUP_PER_SEV     : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Marron/SO_Marron_6-D.png'),
DER_SUP_PER_SEV     : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Marron/SO_Marron_6.png'),

IZQ_INF_CORT_LEVE   : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Naranja/SO_Naranja_5-D.png'),
DER_INF_CORT_LEVE   : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Naranja/SO_Naranja_5.png'),
IZQ_INF_CORT_MOD    : require('../../../assets/Viasneurologicas/Somatos/Version1/Viaafectada/ViaDerecha/SO_5-D.png'),
DER_INF_CORT_MOD    : require('../../../assets/Viasneurologicas/Somatos/Version1/Viaafectada/SO_5.png'),
IZQ_INF_CORT_SEV    : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Marron/SO_Marron_5-D.png'),
DER_INF_CORT_SEV    : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Marron/SO_Marron_5.png'),

IZQ_INF_SUB_LEVE    : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Naranja/SO_Naranja_4-D.png'),
DER_INF_SUB_LEVE    : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Naranja/SO_Naranja_4.png'),

IZQ_INF_SUB_MOD     : require('../../../assets/Viasneurologicas/Somatos/Version1/Viaafectada/ViaDerecha/SO_4-D.png'),
DER_INF_SUB_MOD     : require('../../../assets/Viasneurologicas/Somatos/Version1/Viaafectada/SO_4.png'),
IZQ_INF_SUB_SEV     : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Marron/SO_Marron_4-D.png'),
DER_INF_SUB_SEV     : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Marron/SO_Marron_4.png'),

IZQ_INF_TOR_LEVE    : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Naranja/SO_Naranja_3-D.png'),
DER_INF_TOR_LEVE    : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Naranja/SO_Naranja_3.png'),
IZQ_INF_TOR_MOD     : require('../../../assets/Viasneurologicas/Somatos/Version1/Viaafectada/ViaDerecha/SO_3-D.png'),
DER_INF_TOR_MOD     : require('../../../assets/Viasneurologicas/Somatos/Version1/Viaafectada/SO_3.png'),
IZQ_INF_TOR_SEV     : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Marron/SO_Marron_3-D.png'),
DER_INF_TOR_SEV     : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Marron/SO_Marron_3.png'),

IZQ_INF_LUM_LEVE    : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Naranja/SO_Naranja_2-D.png'),
DER_INF_LUM_LEVE    : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Naranja/SO_Naranja_2.png'),
IZQ_INF_LUM_MOD     : require('../../../assets/Viasneurologicas/Somatos/Version1/Viaafectada/ViaDerecha/SO_2-D.png'),
DER_INF_LUM_MOD     : require('../../../assets/Viasneurologicas/Somatos/Version1/Viaafectada/SO_2.png'),
IZQ_INF_LUM_SEV     : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Marron/SO_Marron_2-D.png'),
DER_INF_LUM_SEV     : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Marron/SO_Marron_2.png'),

IZQ_INF_PER_LEVE    : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Naranja/SO_Naranja_1-D.png'),
DER_INF_PER_LEVE    : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Naranja/SO_Naranja_1.png'),
IZQ_INF_PER_MOD     : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Rojo/SO_Rojo_1-D.png'),
DER_INF_PER_MOD     : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Rojo/SO_Rojo_1.png'),
IZQ_INF_PER_SEV     : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Marron/SO_Marron_1-D.png'),
DER_INF_PER_SEV     : require('../../../assets/Viasneurologicas/Somatos/Version2/ViaAfectada/Marron/SO_Marron_1.png'),

BASE_CEREBRO      : require('../../../assets/CuerpoPng/SomatosensorialImg/Base_Cerebro.png'),
BASE_CEREBRO_TRANSPARENT: require('../../../assets/CuerpoPng/SomatosensorialImg/Base_Cerebro_TR.png'),

};

// ===== DERMATOMAS agrupados ===== (igual que tu versión original)
const DERM_SUP_IZQ_LEVE = [IMG.IZQ_SUP_CORT_LEVE, IMG.IZQ_SUP_SUB_LEVE, IMG.IZQ_SUP_CERV_LEVE, IMG.IZQ_SUP_PER_LEVE];
const DERM_SUP_DER_LEVE = [IMG.DER_SUP_CORT_LEVE, IMG.DER_SUP_SUB_LEVE, IMG.DER_SUP_CERV_LEVE, IMG.DER_SUP_PER_LEVE];
const DERM_SUP_IZQ_MOD  = [IMG.IZQ_SUP_CORT_MOD, IMG.IZQ_SUP_SUB_MOD, IMG.IZQ_SUP_CERV_MOD, IMG.IZQ_SUP_PER_MOD];
const DERM_SUP_DER_MOD  = [IMG.DER_SUP_CORT_MOD, IMG.DER_SUP_SUB_MOD, IMG.DER_SUP_CERV_MOD, IMG.DER_SUP_PER_MOD];
const DERM_SUP_IZQ_SEV  = [IMG.IZQ_SUP_CORT_SEV, IMG.IZQ_SUP_SUB_SEV, IMG.IZQ_SUP_CERV_SEV, IMG.IZQ_SUP_PER_SEV];
const DERM_SUP_DER_SEV  = [IMG.DER_SUP_CORT_SEV, IMG.DER_SUP_SUB_SEV, IMG.DER_SUP_CERV_SEV, IMG.DER_SUP_PER_SEV];

const DERM_INF_IZQ_LEVE = [IMG.IZQ_INF_CORT_LEVE, IMG.IZQ_INF_SUB_LEVE, IMG.IZQ_INF_TOR_LEVE, IMG.IZQ_INF_LUM_LEVE, IMG.IZQ_INF_PER_LEVE];
const DERM_INF_DER_LEVE = [IMG.DER_INF_CORT_LEVE, IMG.DER_INF_SUB_LEVE, IMG.DER_INF_TOR_LEVE, IMG.DER_INF_LUM_LEVE, IMG.DER_INF_PER_LEVE];
const DERM_INF_IZQ_MOD  = [IMG.IZQ_INF_CORT_MOD, IMG.IZQ_INF_SUB_MOD, IMG.IZQ_INF_TOR_MOD, IMG.IZQ_INF_LUM_MOD, IMG.IZQ_INF_PER_MOD];
const DERM_INF_DER_MOD  = [IMG.DER_INF_CORT_MOD, IMG.DER_INF_SUB_MOD, IMG.DER_INF_TOR_MOD, IMG.DER_INF_LUM_MOD, IMG.DER_INF_PER_MOD];
const DERM_INF_IZQ_SEV  = [IMG.IZQ_INF_CORT_SEV, IMG.IZQ_INF_SUB_SEV, IMG.IZQ_INF_TOR_SEV, IMG.IZQ_INF_LUM_SEV, IMG.IZQ_INF_PER_SEV];
const DERM_INF_DER_SEV  = [IMG.DER_INF_CORT_SEV, IMG.DER_INF_SUB_SEV, IMG.DER_INF_TOR_SEV, IMG.DER_INF_LUM_SEV, IMG.DER_INF_PER_SEV];

/* ---------- Overlays (con claves) ---------- */
const OVERLAYS_SOMATO: Record<string, any | any[]> = {
superiores_indemne : [IMG.SUPERIOR_IZQ, IMG.SUPERIOR_DER],
superiores_alterada: [IMG.ALT_SUP_IZQ, IMG.ALT_SUP_DER],
inferiores_indemne : [IMG.INFERIOR_IZQ, IMG.INFERIOR_DER],
inferiores_alterada: [IMG.ALT_INF_IZQ, IMG.ALT_INF_DER],

izquierdotrigeminoAlterada_leve    : IMG.TRI_ALT_IZQ_LEV,
derechotrigeminoAlterada_leve      : IMG.TRI_ALT_DER_LEV,
izquierdotrigeminoAlterada_moderado: IMG.TRI_ALT_IZQ_MOD,
derechotrigeminoAlterada_moderado  : IMG.TRI_ALT_DER_MOD,
izquierdotrigeminoAlterada_severo  : IMG.TRI_ALT_IZQ_SEV,
derechotrigeminoAlterada_severo    : IMG.TRI_ALT_DER_SEV,

superior_izq  : IMG.SUPERIOR_IZQ,
superior_der  : IMG.SUPERIOR_DER,
inferior_izq  : IMG.INFERIOR_IZQ,
inferior_der  : IMG.INFERIOR_DER,

izquierdo_mediano                : IMG.SUPERIOR_IZQ,
derecho_mediano                  : IMG.SUPERIOR_DER,
izquierdo_ulnar                  : IMG.SUPERIOR_IZQ,
derecho_ulnar                    : IMG.SUPERIOR_DER,
izquierdo_radial_superficial     : IMG.SUPERIOR_IZQ,
derecho_radial_superficial       : IMG.SUPERIOR_DER,
izquierdo_antebraqueal_cutaneo_lateral: IMG.SUPERIOR_IZQ,
derecho_antebraqueal_cutaneo_lateral  : IMG.SUPERIOR_DER,

izquierdo_tibial                 : IMG.INFERIOR_IZQ,
derecho_tibial                   : IMG.INFERIOR_DER,
izquierdo_peroneo                : IMG.INFERIOR_IZQ,
derecho_peroneo                  : IMG.INFERIOR_DER,
izquierdo_peroneo_superficial    : IMG.INFERIOR_IZQ,
derecho_peroneo_superficial      : IMG.INFERIOR_DER,
izquierdo_sural                  : IMG.INFERIOR_IZQ,
derecho_sural                    : IMG.INFERIOR_DER,
izquierdo_safeno                 : IMG.INFERIOR_IZQ,
derecho_safeno                   : IMG.INFERIOR_DER,
izquierdo_femorocutaneo_lateral  : IMG.INFERIOR_IZQ,
derecho_femorocutaneo_lateral    : IMG.INFERIOR_DER,
izquierdo_pudendo                : IMG.INFERIOR_IZQ,
derecho_pudendo                  : IMG.INFERIOR_DER,

izquierdocorticalsAlterada_leve     : IMG.IZQ_SUP_CORT_LEVE,
derechocorticalsAlterada_leve       : IMG.DER_SUP_CORT_LEVE,
izquierdocorticalsAlterada_moderado : IMG.IZQ_SUP_CORT_MOD,
derechocorticalsAlterada_moderado   : IMG.DER_SUP_CORT_MOD,
izquierdocorticalsAlterada_severo   : IMG.IZQ_SUP_CORT_SEV,
derechocorticalsAlterada_severo     : IMG.DER_SUP_CORT_SEV,

izquierdosubcorticalsAlterada_leve     : IMG.IZQ_SUP_SUB_LEVE,
derechosubcorticalsAlterada_leve       : IMG.DER_SUP_SUB_LEVE,
izquierdosubcorticalsAlterada_moderado : IMG.IZQ_SUP_SUB_MOD,
derechosubcorticalsAlterada_moderado   : IMG.DER_SUP_SUB_MOD,
izquierdosubcorticalsAlterada_severo   : IMG.IZQ_SUP_SUB_SEV,
derechosubcorticalsAlterada_severo     : IMG.DER_SUP_SUB_SEV,

izquierdocervicalsAlterada_leve     : IMG.IZQ_SUP_CERV_LEVE,
derechocervicalsAlterada_leve       : IMG.DER_SUP_CERV_LEVE,
izquierdocervicalsAlterada_moderado : IMG.IZQ_SUP_CERV_MOD,
derechocervicalsAlterada_moderado   : IMG.DER_SUP_CERV_MOD,
izquierdocervicalsAlterada_severo   : IMG.IZQ_SUP_CERV_SEV,
derechocervicalsAlterada_severo     : IMG.DER_SUP_CERV_SEV,

izquierdoperifericosAlterada_leve     : IMG.IZQ_SUP_PER_LEVE,
derechoperifericosAlterada_leve       : IMG.DER_SUP_PER_LEVE,
izquierdoperifericosAlterada_moderado : IMG.IZQ_SUP_PER_MOD,
derechoperifericosAlterada_moderado   : IMG.DER_SUP_PER_MOD,
izquierdoperifericosAlterada_severo   : IMG.IZQ_SUP_PER_SEV,
derechoperifericosAlterada_severo     : IMG.DER_SUP_PER_SEV,

izquierdocorticaliAlterada_leve     : IMG.IZQ_INF_CORT_LEVE,
derechocorticaliAlterada_leve       : IMG.DER_INF_CORT_LEVE,
izquierdocorticaliAlterada_moderado : IMG.IZQ_INF_CORT_MOD,
derechocorticaliAlterada_moderado   : IMG.DER_INF_CORT_MOD,
izquierdocorticaliAlterada_severo   : IMG.IZQ_INF_CORT_SEV,
derechocorticaliAlterada_severo     : IMG.DER_INF_CORT_SEV,

izquierdosubcorticaliAlterada_leve     : IMG.IZQ_INF_SUB_LEVE,
derechosubcorticaliAlterada_leve       : IMG.DER_INF_SUB_LEVE,
izquierdosubcorticaliAlterada_moderado : IMG.IZQ_INF_SUB_MOD,
derechosubcorticaliAlterada_moderado   : IMG.DER_INF_SUB_MOD,
izquierdosubcorticaliAlterada_severo   : IMG.IZQ_INF_SUB_SEV,
derechosubcorticaliAlterada_severo     : IMG.DER_INF_SUB_SEV,

izquierdotoracicoiAlterada_leve     : IMG.IZQ_INF_TOR_LEVE,
derechotoracicoiAlterada_leve       : IMG.DER_INF_TOR_LEVE,
izquierdotoracicoiAlterada_moderado : IMG.IZQ_INF_TOR_MOD,
derechotoracicoiAlterada_moderado   : IMG.DER_INF_TOR_MOD,
izquierdotoracicoiAlterada_severo   : IMG.IZQ_INF_TOR_SEV,
derechotoracicoiAlterada_severo     : IMG.DER_INF_TOR_SEV,

izquierdolumbosacroiAlterada_leve     : IMG.IZQ_INF_LUM_LEVE,
derecholumbosacroiAlterada_leve       : IMG.DER_INF_LUM_LEVE,
izquierdolumbosacroiAlterada_moderado : IMG.IZQ_INF_LUM_MOD,
derecholumbosacroiAlterada_moderado   : IMG.DER_INF_LUM_MOD,
izquierdolumbosacroiAlterada_severo   : IMG.IZQ_INF_LUM_SEV,
derecholumbosacroiAlterada_severo     : IMG.DER_INF_LUM_SEV,

izquierdoperifericoiAlterada_leve     : IMG.IZQ_INF_PER_LEVE,
derechoperifericoiAlterada_leve       : IMG.DER_INF_PER_LEVE,
izquierdoperifericoiAlterada_moderado : IMG.IZQ_INF_PER_MOD,
derechoperifericoiAlterada_moderado   : IMG.DER_INF_PER_MOD,
izquierdoperifericoiAlterada_severo   : IMG.IZQ_INF_PER_SEV,
derechoperifericoiAlterada_severo     : IMG.DER_INF_PER_SEV,

trigemino_izquierdo_indemne    : IMG.TRI_1,
trigemino_derecho_indemne      : IMG.TRI_2,
trigemino_bilateral_indemne    : [IMG.TRI_1 ,IMG.TRI_2],

ALT_SUP_IZQ_leve     : DERM_SUP_IZQ_LEVE,
ALT_SUP_DER_leve     : DERM_SUP_DER_LEVE,
ALT_SUP_IZQ_moderado : DERM_SUP_IZQ_MOD,
ALT_SUP_DER_moderado : DERM_SUP_DER_MOD,
ALT_SUP_IZQ_severo   : DERM_SUP_IZQ_SEV,
ALT_SUP_DER_severo   : DERM_SUP_DER_SEV,

ALT_INF_IZQ_leve     : DERM_INF_IZQ_LEVE,
ALT_INF_DER_leve     : DERM_INF_DER_LEVE,
ALT_INF_IZQ_moderado : DERM_INF_IZQ_MOD,
ALT_INF_DER_moderado : DERM_INF_DER_MOD,
ALT_INF_IZQ_severo   : DERM_INF_IZQ_SEV,
ALT_INF_DER_severo   : DERM_INF_DER_SEV,
};


/* ───────── Variante de Accordion controlado ───────── */
const ControlledAccordion: React.FC<{
title: string;
open: boolean;
onToggle: () => void;
children?: React.ReactNode;
}> = ({ title, open, onToggle, children }) => (
<View style={{ marginBottom: 8 }}>
<TouchableOpacity style={styles.accordionHeader} onPress={onToggle}>
<Text style={styles.accordionHeaderText}>{title}</Text>
</TouchableOpacity>
{open && <View style={styles.accordionContent}>{children}</View>}
</View>
);
/* ───────── Left content para cada tab (igual que Visual) ───────── */
const ExportLeftReporte: React.FC<{
isLandscape?: boolean;
manejarSeleccionImagen: (tipo: 'circle' | 'square') => void;
}> = ({ isLandscape = false, manejarSeleccionImagen }) => (
<View style={styles.tituloFiguras}>
<TouchableOpacity onPress={() => manejarSeleccionImagen('circle')}>
<Image
source={require('../../../assets/Figuras/circulo.png')}
style={[styles.imagenCirculo, isLandscape && styles.imagenCirculo_ls]}
/>
</TouchableOpacity>
<TouchableOpacity onPress={() => manejarSeleccionImagen('square')}>
<Image
source={require('../../../assets/Figuras/cuadrado.png')}
style={[styles.imagenCuadro, isLandscape && styles.imagenCuadro_ls]}
/>
</TouchableOpacity>
</View>
);


const ExportLeftLista: React.FC<{
onOpenGallery: () => void;
comentario: string;
onOpenModal: () => void;
selected: boolean;
preview?: ImageSourcePropType | null;
onClear?: () => void;
}> = ({ onOpenGallery, comentario, onOpenModal, selected, preview, onClear }) => {
return (
<View style={{ alignSelf: 'stretch' }}>
<TouchableOpacity onPress={onOpenGallery} style={styles.BotonReporte}>
<ImageBackground
source={require('../../../assets/tecnicas/Info/I_Tabla_Gris.png')}
style={styles.backgroundBoton}
imageStyle={styles.imagenFondoBoton}
/>
</TouchableOpacity>

{selected ? (
<View style={{ alignSelf:'center', alignItems:'center', marginBottom: 10 }}>
<Text style={{ color:'#4ade80', fontWeight:'600' }}>✓ Imagen seleccionada</Text>
{!!preview && (
<Image source={preview} style={{ width: 120, height: 70, marginTop: 6, borderRadius: 6 }} resizeMode="contain" />
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

<TouchableOpacity
style={styles.btnComentario}
onPress={onOpenModal}
>
<Text style={styles.btnComentarioText}>
{comentario ? 'Editar Comentario' : 'Agregar Comentario'}
</Text>
</TouchableOpacity>
</View>
);
};

const ExportLeftGenerarLink: React.FC<{
  onGenerateLink: LinkUploaderProps['onGenerateLink'];
  onRequestTemplate?: () => Promise<PlantillaId | null>;
  defaultTitle: string;
  defaultMessage: string;
  autoReportName?: string;     
}> = ({ onGenerateLink, onRequestTemplate, defaultTitle, defaultMessage, autoReportName }) => (
  <LinkUploader
    key={`lu-${defaultTitle}`}
    compact
    defaultTitle={defaultTitle}
    defaultMessage={defaultMessage}
    autoReportName={autoReportName}
    onGenerateLink={onGenerateLink}
    onRequestTemplate={onRequestTemplate}
  />
);



/* Contexto */
interface ConclusionItem { value:string; title:string }
interface ReportCtx {
conclusions: ConclusionItem[];
addConclusion: (c:ConclusionItem)=>void;
removeConclusion: (value:string)=>void;
}
const ReportContext = createContext<ReportCtx>({
conclusions:[], addConclusion:()=>{}, removeConclusion:()=>{},
});

/* ───────────────────── Tipos de paso ───────────────────── */
const steps = [
'ROOT',
'INDEMNE_ALTERADA',
'FISIOPATO',
'GRADO_RETARDO',
'RETARDO_SECUNDARIO',
'LADO',
'DERMATOMAS_LIST',
'ESTIMULO_SUP',
'ESTIMULO_INF',
'TOP_SUP',
'TOP_INF',
'TOP_DER',
'TOP_TRI',
'FIN',
] as const;
export type StepId = typeof steps[number];
export type Side   = 'izquierdo'|'derecho'|'bilateral'|'';
export type RootBranch = 'superiores'|'inferiores'|'trigemino'|'dermatomas'|null;
export type RootFlow   = 'indemne'|'alterada'|null;
export type Severity   = 'leve'|'moderado'|'severo'|null;
type Tab = 'reporte' | 'lista' | 'GenerarLink';


/* ===================== SOLO PARA MODO LISTA ===================== */
const SECTION_ORDER = [
  'Vía somatosensorial',
  'Fisiopatología',
  'Grado',
  'Lado',
  'Estímulo',
  'Topografía',
  'Dermatomas',
] as const;
export type Section = typeof SECTION_ORDER[number];

const getSection = (c: ConclusionItem): Section | null => {
  const v = c.value.toLowerCase();
  const t = c.title.toLowerCase();

  if (
    /vía somatosensorial/.test(t) ||
    v.endsWith('_indemne') || v.endsWith('_alterada') ||
    v === 'superior_indemne' || v === 'superior_alterada' ||
    v === 'inferior_indemne' || v === 'inferior_alterada' ||
    v === 'trigemino_indemne' || v === 'trigemino_alterada' ||
    v === 'dermatomas_indemne' || v === 'dermatomas_alterada'
  ) return 'Vía somatosensorial';

  if (
    v.includes('retardo_en_la_conduccion') ||
    v.includes('bloqueo_en_la_conduccion') ||
    v.includes('deficit_neuronal') ||
    v.includes('sin_respuesta') ||
    v.includes('perdida_axonal_secundaria') ||
    v.includes('retardo_secundario_en_la_conduccion') ||
    t.startsWith('por retardo') || t.startsWith(' por bloqueo') ||
    t.startsWith(' axonal') || t.startsWith(' por ausencia')
  ) return 'Fisiopatología';

  if (v === 'leve' || v === 'moderado' || v === 'severo') return 'Grado';

  if (v === 'izquierdo' || v === 'derecho' || v === 'bilateral' || /_(izquierdo|derecho|bilateral)$/.test(v)) return 'Lado';

  if (/nervio|trigémino|trigemino|median|ulnar|radial|axilar|musculocutaneo|braquial|antebraqueal|tibial|peroneo|sural|safeno|femoral|plantar|pudendo|femorocutaneo/.test(v))
    return 'Estímulo';

  if (/cortical|subcortical|cervical|periferic|toracic|lumbosacro|periferico/.test(v)) return 'Topografía';

  if (/c\d|t\d|l\d|s\d/.test(v)) return 'Dermatomas';

  return null;
};

/* ► Etiquetas cortas por value (para modo lista) */
const VALUE_LABELS: Record<string, string> = {
superiores_indemne: 'Superiores indemne',
superiores_alterada: 'Superiores alterada',
inferior_indemne: 'Inferiores indemne',
inferior_alterada: 'Inferiores alterada', 
trigemino_indemne: 'Trigémino indemne',
trigemino_alterada: 'Trigémino alterada',
dermatomas_indemne: 'Dermatomas indemne',
dermatomas_alterada: 'Dermatomas alterada',

retardo_en_la_conduccion: 'Retardo en la conducción',
bloqueo_en_la_conduccion: 'Bloqueo en la conducción',
deficit_neuronal: 'Déficit axonal',
sin_respuesta: 'Sin respuesta evocable',

leve: 'Leve',
moderado: 'Moderado',
severo: 'Severo',

perdida_axonal_secundaria: 'Pérdida axonal secundaria',
retardo_secundario_en_la_conduccion: 'Retardo secundario en la conducción',

izquierdo: 'Izquierdo',
derecho: 'Derecho',
bilateral: 'Bilateral',

izquierdo_corticals: 'Cortical',
izquierdo_subcorticals: 'Subcortical',
izquierdo_cervicals: 'Cervical',
izquierdo_perifericos: 'Periférico',
derecho_corticals: 'Cortical',
derecho_subcorticals: 'Subcortical',
derecho_cervicals: 'Cervical',
derecho_perifericos: 'Periférico',
bilateral_corticals: 'Cortical',
bilateral_subcorticals: 'Subcortical',
bilateral_cervicals: 'Cervical',
bilateral_perifericos: 'Periférico',

izquierdo_corticali: 'Cortical',
izquierdo_subcorticali: 'Subcortical',
izquierdo_toracicoi: 'Torácico',
izquierdo_lumbosacroi: 'Lumbosacro',
izquierdo_perifericoi: 'Periférico',
derecho_corticali: 'Cortical',
derecho_subcorticali: 'Subcortical',
derecho_toracicoi: 'Torácico',
derecho_lumbosacroi: 'Lumbosacro',
derecho_perifericoi: 'Periférico',
bilateral_corticali: 'Cortical',
bilateral_subcorticali: 'Subcortical',
bilateral_toracicoi: 'Torácico',
bilateral_lumbosacroi: 'Lumbosacro',
bilateral_perifericoi: 'Periférico',

mediano: 'Nervio mediano',
ulnar: 'Nervio ulnar',
radial_superficial: 'Nervio radial superficial',
antebraqueal_cutaneo_lateral: 'Nervio antebraqueal cutáneo lateral',

tibial: 'Nervio tibial',
peroneo: 'Nervio peroneo',
peroneo_superficial: 'Nervio peroneo superficial',
sural: 'Nervio sural',
safeno: 'Nervio safeno',
femorocutaneo_lateral: 'Nervio femorocutáneo lateral',
pudendo: 'Nervio pudendo',

izquierdo_trigemino: 'Trigémino izquierdo',
derecho_trigemino: 'Trigémino derecho',
bilateral_trigemino: 'Trigémino bilateral',

c4:'C4', c5:'C5', c6:'C6', c7:'C7', c8:'C8', t1:'T1',
t2:'T2', t3:'T3', t4:'T4', t5:'T5', t6:'T6', t7:'T7', t8:'T8',
t9:'T9', t10:'T10', t11:'T11', t12:'T12', l1:'L1', l2:'L2', l3:'L3',
l4:'L4', l5:'L5', s1:'S1', s2:'S2',
};

// Title Case (respeta acentos)
const titleCase = (s: string) =>
  s.replace(/\p{L}[\p{L}\p{M}]*/gu, w => w.charAt(0).toUpperCase() + w.slice(1));

// Normaliza "Nervio ..."
const prettifyStimulusLabel = (label: string) =>
  label.replace(/^nervio\s+(.*)$/i, (_, name) => 'Nervio ' + titleCase(name));

// Plurales para bilateral
const STIMULUS_PLURAL_SUF: Record<string,string> = {
  mediano: 'Mediano',
  ulnar: 'Ulnar',
  radial_superficial: 'Radial superficial',
  antebraqueal_cutaneo_lateral: 'Antebraqueal cutáneo lateral',
  tibial: 'Tibial',
  peroneo: 'Peroneo',
  peroneo_superficial: 'Peroneo superficial',
  sural: 'Sural',
  safeno: 'Safeno',
  femorocutaneo_lateral: 'Femorocutáneo lateral',
  pudendo: 'Pudendo',
};

const formatStimulusLabel = (key: string, side: Side) => {
  if (side === 'bilateral') {
    const plural = STIMULUS_PLURAL_SUF[key];
    if (plural) return `Nervio ${plural}`;
  }
  const base = VALUE_LABELS[key] ?? key.replace(/_/g, ' ');
  return prettifyStimulusLabel(base);
};

// ► Fisiopatología compacta (como en tu ejemplo)
const buildFisiopatologiaSomato = (cons: ConclusionItem[]): string => {
  const vals = new Set(cons.map(c => c.value));
  if (vals.has('retardo_en_la_conduccion')) {
    return vals.has('perdida_axonal_secundaria')
      ? 'Retardo en la conducción con pérdida axonal secundaria'
      : 'Retardo en la conducción';
  }
  if (vals.has('deficit_neuronal')) {
    return vals.has('retardo_secundario_en_la_conduccion')
      ? 'Déficit axonal con retardo secundario en la conducción'
      : 'Déficit axonal';
  }
  if (vals.has('bloqueo_en_la_conduccion')) return 'Bloqueo en la conducción';
  if (vals.has('sin_respuesta'))            return 'Sin respuesta evocable';
  return '';
};

// Etiqueta compacta para "Vía somatosensorial"
const VIA_LABEL_SOMATO = (vals: Set<string>) => {
  const altered =
    vals.has('superiores_alterada') || vals.has('inferiores_alterada') || vals.has('inferior_alterada') ||
    vals.has('trigemino_alterada')  || vals.has('dermatomas_alterada');

  const intact =
    vals.has('superiores_indemne') || vals.has('inferiores_indemne') || vals.has('inferior_indemne') ||
    vals.has('trigemino_indemne')  || vals.has('dermatomas_indemne');

  return altered ? 'Alterada' : intact ? 'Indemne' : '';
};

// helper: construir mapa en runtime
const getTopoMap = (): Record<string, string> => {
  const m: Record<string, string> = {};
  TOPO_SUP.forEach(i => { m[i.valueSuffix] = i.title; });
  TOPO_INF.forEach(i => { m[i.valueSuffix] = i.title; });
  return m;
};

// Topografía: versión "en línea" (sin punto final)
const topoSentenceInlineFromValue = (v: string): string => {
  const suffix = v.replace(/^(?:izquierdo|derecho|bilateral)_?/, '');
  const raw = getTopoMap()[suffix] || '';
  if (!raw) return '';
  const trimmed = raw.replace(/^\s+/, '');       // quita \n iniciales
  return trimmed.replace(/\.$\s*$/, '');         // sin punto final para lista
};


// ► Construye la LISTA final (clave/valor) para UI y PDF
type LineaLista = { k: string; v: string };

const buildListaSomato = (cons: ConclusionItem[], side: Side): LineaLista[] => {
  const vals = new Set(cons.map(c => c.value));
  const isTrigemino  = vals.has('trigemino_indemne')  || vals.has('trigemino_alterada');
  const isDermatomas = vals.has('dermatomas_indemne') || vals.has('dermatomas_alterada');

  const lines: LineaLista[] = [];

  // 1) Vía somatosensorial (siempre arriba, también para trigémino/dermatomas)
  const via = VIA_LABEL_SOMATO(vals); // 'Alterada' | 'Indemne' | ''
  if (via) lines.push({ k: 'Vía somatosensorial', v: via });

  // 2) Fisiopatología
  const fisio = buildFisiopatologiaSomato(cons);
  if (fisio) lines.push({ k: 'Fisiopatología', v: fisio });

  // 3) Grado
  const grado =
    vals.has('severo')   ? 'Severo'   :
    vals.has('moderado') ? 'Moderado' :
    vals.has('leve')     ? 'Leve'     : '';
  if (grado) lines.push({ k: 'Grado', v: grado });

  // 4) Lado
  const sideMap: Record<string,string> = { izquierdo:'Izquierdo', derecho:'Derecho', bilateral:'Bilateral' };
  const lado =
    side ? sideMap[side] :
    (Array.from(vals).some(v => /(^|_)izquierdo($|_)/.test(v)) ? 'Izquierdo' :
     Array.from(vals).some(v => /(^|_)derecho($|_)/.test(v))   ? 'Derecho'   :
     Array.from(vals).some(v => /(^|_)bilateral($|_)/.test(v)) ? 'Bilateral' : '');
  if (lado) lines.push({ k: 'Lado', v: lado });

  // 5) Estímulo (nervio) — normal (NO trigémino)
  if (!isTrigemino) {
    const estimulo = Array.from(vals).find(v =>
      /(mediano|ulnar|radial_superficial|antebraqueal_cutaneo_lateral|axilar|musculocutaneo|antebraqueal_cutaneo_medial|braquial_cutaneo_medial|radial_cutaneo_posterior|tibial|peroneo(_superficial)?|peroneo_profundo|sural|safeno|femoral|femorocutaneo_lateral|femorocutaneo_posterior|plantar_medial|pudendo)$/.test(v)
    );
    if (estimulo) {
      const key = estimulo.replace(/^(izquierdo|derecho|bilateral)_?/, '');
      const v = formatStimulusLabel(key, side);
      lines.push({ k: 'Estímulo', v });
    }
  }

  // 6) Topografía (última seleccionada)
  const topo = [...cons].reverse().find(c =>
    /(corticals?|subcorticals?|cervicals?|perifericos|corticali|subcorticali|toracicoi|lumbosacroi|perifericoi)$/.test(c.value)
  );
  if (topo) {
    const sentence = topoSentenceInlineFromValue(topo.value);
    if (sentence) lines.push({ k: 'Topografía', v: sentence });
  }

  // 7) Dermatomas (C/T/L/S)
  const dermCodes = cons
    .map(c => c.value.match(/(?:izquierdo|derecho|bilateral)(c\d|t\d|l\d|s\d)(?:di|da)$/i)?.[1]?.toUpperCase())
    .filter(Boolean) as string[];
  if (dermCodes.length) {
    const uniq = Array.from(new Set(dermCodes));
    lines.push({ k: 'Dermatomas', v: uniq.join('-') });
  }

  // 8) Estímulo específico para TRIGÉMINO al final
  if (isTrigemino) {
    lines.push({ k: 'Estímulo', v: 'Nervio trigémino' });
  }

  return lines;
};


const sanitizeTitle = (t:string) =>
t.replace(/^vía somatosensorial\s*(con)?\s*/i, '')
.replace(/^para lado\s*/i, '')
.replace(/^de forma\s*/i, '')
.replace(/^al\s+/i, '')
.replace(/^por\s+/i, '')
.replace(/^y\s+/i, '')
.replace(/[.,]\s*$/, '')
.trim();

/* Helpers UI */
const Accordion: React.FC<{title:string; children?: React.ReactNode}> = ({title, children}) => {
const [open,setOpen] = useState(false);
return (
<View style={{marginBottom:8}}>
<TouchableOpacity style={styles.accordionHeader} onPress={()=>setOpen(prev=>!prev)}>
<Text style={styles.accordionHeaderText}>{title}</Text>
</TouchableOpacity>
{open && <View style={styles.accordionContent}>{children}</View>}
</View>
);
};

const ConclusionBtn: React.FC<{
value:        string;
title:        string;
label:        string;
selected?:    boolean;
onPress?:     () => void;
onLongPress?: () => void;
}> = ({ value, title, label, selected, onPress, onLongPress }) => {
const { addConclusion } = useContext(ReportContext);
return (
<TouchableOpacity
style={[styles.conclusionBtn, selected && styles.conclusionBtnSelected]}
onPress={() => { addConclusion({ value, title }); onPress?.(); }}
onLongPress={onLongPress}
>
<Text style={styles.conclusionBtnText}>{label}</Text>
</TouchableOpacity>
);
};
const IconCircle: React.FC<{ onPress?:()=>void; disabled?:boolean; children:React.ReactNode }> =
({ onPress, disabled, children }) => (
<TouchableOpacity
style={[styles.iconCircle, styles.toolbarIcon, disabled && {opacity:0.5}]}
onPress={onPress}
disabled={disabled}
>
{children}
</TouchableOpacity>
);

const NavRow:React.FC<{
onBack:()=>void;
onFwd?:()=>void;
onReset?:()=>void;
onExport?:()=>void;
exporting?:boolean;
}> = ({onBack,onFwd,onReset,onExport,exporting}) => (
<View style={styles.navRow}>
{/* Regresar */}
<IconCircle onPress={onBack}>
<Image source={I_Regresar} style={styles.menuItemIcon} />
</IconCircle>

{/* Reset */}
{onReset && (
<IconCircle onPress={onReset}>
<Image source={I_Refrescar} style={styles.menuItemIcon} />
</IconCircle>
)}

{/* Exportar (solo si lo pasas) */}
{onExport && (
<IconCircle onPress={onExport} disabled={exporting}>
<Image source={I_Imprimir} style={styles.menuItemIcon} />
</IconCircle>
)}
</View>
);

const SkipButton: React.FC<{ onPress: () => void; label?: string }> = ({ onPress, label = 'Saltar  ➔' }) => (
  <TouchableOpacity style={styles.skipBtn} onPress={onPress}>
    <Text style={styles.skipTxt}>{label}</Text>
  </TouchableOpacity>
);
const NextButton: React.FC<{ onPress: () => void; label?: string; disabled?: boolean }> = ({
  onPress,
  label = 'Siguiente  ➔',
  disabled = false,
}) => (
 
  <TouchableOpacity
    style={[styles.nextBtn, disabled && { opacity: 0.5 }]}
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={styles.nextTxt}>{label}</Text>
  </TouchableOpacity>
);


/* ────────────── Datos dinámicos ────────────── */
const NERVIOS_SUP = [
{ value:'mediano', title:', a través de región medular posterior al estímulo de nervio Mediano.', label:'NERVIO MEDIANO' },
{ value:'ulnar', title:', a través de región medular posterior al estímulo de nervio Ulnar.', label:'NERVIO ULNAR' },
{ value:'radial_superficial', title:', a través de región medular posterior al estímulo de nervio Radial superficial.', label:'NERVIO RADIAL SUPERFICIAL' },
{ value:'antebraqueal_cutaneo_lateral', title:', a través de región medular posterior al estímulo de nervio Antebraqueal cutáneo lateral.', label:'NERVIO ANTEBRAQUEAL CUTÁNEO LATERAL' },
];

const NERVIOS_INF = [
{ value:'tibial', title:', a través de región medular posterior al estímulo de nervio Tibial.', label:'NERVIO TIBIAL' },
{ value:'peroneo', title:', a través de región medular posterior al estímulo de nervio Peroneo.', label:'NERVIO PERONEO' },
{ value:'peroneo_superficial', title:', a través de región medular posterior al estímulo de nervio Peroneo superficial.', label:'NERVIO PERONEO SUPERFICIAL' },
{ value:'sural', title:', a través de región medular posterior al estímulo de nervio Sural.', label:'NERVIO SURAL' },
{ value:'safeno', title:', a través de región medular posterior al estímulo de nervio Safeno.', label:'NERVIO SAFENO' },
{ value:'femorocutaneo_lateral', title:', a través de región medular posterior al estímulo de nervio Femorocutáneo lateral.', label:'NERVIO FEMOROCUTÁNEO LATERAL' },
{ value:'pudendo', title:', a través de región medular posterior al estímulo de nervio Pudendo.', label:'NERVIO PUDENDO' },
];

const TOPO_SUP = [
  {
    valueSuffix: 'corticals',
    label: 'CORTICAL',
    title: '\n\nTopográficamente a nivel cortical (N20-P25: Núcleo talámico - área somestésica primaria).',
  },
  {
    valueSuffix: 'subcorticals',
    label: 'SUBCORTICAL',
    title: '\n\nTopográficamente a nivel subcortical (P14-N18: Lemniso medial - núcleo tectal).',
  },
  {
    valueSuffix: 'cervicals',
    label: 'CERVICAL',
    title: '\n\nTopográficamente a nivel cervical (N11-N13: Raíces y astas dorsales - tracto cuneatus).',
  },
  {
    valueSuffix: 'perifericos',
    label: 'PERIFÉRICO',
    title: '\n\nTopográficamente a nivel periférico (N4-N9: Fibras nerviosas mielínicas - plexo braquial).',
  },
];

const TOPO_INF = [
  {
    valueSuffix: 'corticali',
    label: 'CORTICAL',
    title: '\n\nTopográficamente a nivel cortical (P37-N45: Núcleo talámico - área somestésica primaria).',
  },
  {
    valueSuffix: 'subcorticali',
    label: 'SUBCORTICAL',
    title: '\n\nTopográficamente a nivel subcortical (P31-N34: Núcleo gracilis - lemnisco medial).',
  },
  {
    valueSuffix: 'toracicoi',
    label: 'TORÁCICO',
    title: '\n\nTopográficamente a nivel torácico (N24: Astas dorsales - tracto gracilis).',
  },
  {
    valueSuffix: 'lumbosacroi',
    label: 'LUMBOSACRO',
    title: '\n\nTopográficamente a nivel lumbosacro (N20: Cono medular - raíces dorsales).',
  },
  {
    valueSuffix: 'perifericoi',
    label: 'PERIFÉRICO',
    title: '\n\nTopográficamente a nivel periférico (P9-N18: Fibras nerviosas mielínicas - plexo sacro).',
  },
];


const ORDER_SUP = ['corticals', 'subcorticals', 'cervicals', 'perifericos'] as const;
const ORDER_INF = ['corticali', 'subcorticali', 'toracicoi', 'lumbosacroi', 'perifericoi'] as const;

const DERM_LEVELS = {
cervical:  ['c4','c5','c6','c7','c8','t1'],
toracico:  ['t2','t3','t4','t5','t6','t7','t8','t9','t10','t11','t12'],
lumbosacro:['l1','l2','l3','l4','l5','s1','s2'],
} as const;

/* Helpers overlays topo/derm */
const buildTopographyKeys = (side: Side, suffix: string, order: readonly string[]): string[] => {
const idx = order.indexOf(suffix);
const prevSuf = order.slice(0, idx + 1);
if (side === 'bilateral') {
return prevSuf.flatMap(sfx => [`izquierdo${sfx}`, `derecho${sfx}`]);
}
return prevSuf.map(sfx => `${side}${sfx}`);
};

const getTrigeminoOverlayKeys = (side: Side, flow: RootFlow, severity: Severity): string[] => {
if (flow === 'indemne') {
if (side === 'bilateral') return ['trigemino_izquierdo_indemne', 'trigemino_derecho_indemne'];
return [`trigemino_${side}_indemne`];
}
const keysPorLado = (lado: 'izquierdo'|'derecho'): string[] => {
if (severity) {
const k = `${lado}trigeminoAlterada_${severity}`;
if (OVERLAYS_SOMATO[k]) return [k];
}
return [`trigemino_${lado}_alterada`];
};
if (side === 'bilateral') return [...keysPorLado('izquierdo'), ...keysPorLado('derecho')];
if (side === 'izquierdo' || side === 'derecho') return keysPorLado(side);
return [];
};

const getDermOverlayKeys = (
side: Side,
flow: RootFlow,
code: string,
severity: Severity
): string[] => {
const zone = /^c/i.test(code) || /^t1$/i.test(code) ? 'sup' : 'inf';
const M: Record<'indemne'|'alterada', Record<'sup'|'inf',
Record<'izquierdo'|'derecho'|'bilateral', string|string[]>>> = {
indemne : {
sup: { izquierdo:'superior_izq', derecho:'superior_der',
bilateral:['superior_izq','superior_der'] },
inf: { izquierdo:'inferior_izq', derecho:'inferior_der',
bilateral:['inferior_izq','inferior_der'] },
},
alterada: {
sup: { izquierdo:'ALT_SUP_IZQ', derecho:'ALT_SUP_DER',
bilateral:['ALT_SUP_IZQ','ALT_SUP_DER'] },
inf: { izquierdo:'ALT_INF_IZQ', derecho:'ALT_INF_DER',
bilateral:['ALT_INF_IZQ','ALT_INF_DER'] },
},
};
const safeSide: 'izquierdo' | 'derecho' | 'bilateral' =
(side === 'izquierdo' || side === 'derecho' || side === 'bilateral') ? side : 'izquierdo';
const base = M[flow ?? 'indemne'][zone][safeSide];
const bases = Array.isArray(base) ? base : [base];

if (flow !== 'alterada') return bases;

if (severity) {
const withGrade = bases.map(b => `${b}_${severity}`).filter(k => OVERLAYS_SOMATO[k]);
if (withGrade.length) return withGrade;
}
return bases;
};

/* 🟢 Figuras arrastrables */
type Figura = { id: string; tipo: 'circle' | 'square'; uri: string; posicion: { x:number; y:number } };

type FinalExportUISomatoProps = {
nombrePaciente: string;
setNombrePaciente: (v: string) => void;
isLandscape?: boolean;
manejarSeleccionImagen: (tipo:'circle'|'square') => void;
onToolbarBack: () => void;
onReset: () => void;
onExport: () => void;
exporting: boolean;
activeTab: Tab;
onOpenGallery: () => void;
comentarioLista: string;
onOpenComentarioModal: () => void;
imgListaSrc: ImageSourcePropType | null;
setImgListaSrc: (v: ImageSourcePropType | null) => void;
onGenerateLink: LinkUploaderProps['onGenerateLink'];
defaultLinkTitle: string;
defaultLinkMessage: string;
autoReportName?: string;
onRequestTemplate?: () => Promise<PlantillaId | null>;

};

// ✅ versión final del componente
const FinalExportUISomato: React.FC<FinalExportUISomatoProps> = React.memo(
({
  isLandscape = false,
  nombrePaciente,
  setNombrePaciente,
  manejarSeleccionImagen,
  onToolbarBack,
  onReset,
  onExport,
  exporting,
  activeTab,
  onOpenGallery,
  comentarioLista,
  onOpenComentarioModal,
  imgListaSrc,
  setImgListaSrc,
  onGenerateLink,
  defaultLinkTitle,
  defaultLinkMessage,
  autoReportName,
  onRequestTemplate

}) => {

  return (
    <View style={styles.figBlock}>
      {/* HEADER / TOOLBAR */}
      <View style={[styles.exportHeader, isLandscape && styles.exportHeader_ls]}>
        <View style={styles.toolbarRow}>

          <TouchableOpacity
            onPress={onToolbarBack}
            style={[styles.iconCircle, styles.toolbarIcon, isLandscape && styles.iconCircle_ls]}
          >
            <Image source={I_Regresar} style={[styles.menuItemIcon, isLandscape && styles.menuItemIcon_ls]} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onReset}
            style={[styles.iconCircle, styles.toolbarIcon, isLandscape && styles.iconCircle_ls]}
          >
            <Image source={I_Refrescar} style={[styles.menuItemIcon, isLandscape && styles.menuItemIcon_ls]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconCircle, styles.toolbarIcon, isLandscape && styles.iconCircle_ls]}
            onPress={onExport}
            disabled={exporting}
          >
            <Image source={I_Imprimir} style={[styles.menuItemIcon, isLandscape && styles.menuItemIcon_ls]} />
          </TouchableOpacity>

        
        </View>
      </View>

    

      {/* Contenido según TAB */}
      <View style={[styles.exportTwoCols, isLandscape && styles.exportTwoCols_ls]}>
        {activeTab === 'reporte' ? (
          <ExportLeftReporte isLandscape={isLandscape} manejarSeleccionImagen={manejarSeleccionImagen} />
        ) : activeTab === 'lista' ? (
          <ExportLeftLista
            onOpenGallery={onOpenGallery}
            comentario={comentarioLista}
            onOpenModal={onOpenComentarioModal}
            selected={!!imgListaSrc}
            preview={imgListaSrc}
            onClear={() => setImgListaSrc(null)}
          />
        ) : (
          <ExportLeftGenerarLink
            key={`gl-${nombrePaciente}`}           // re-monta el contenedor
            onGenerateLink={onGenerateLink}
            onRequestTemplate={onRequestTemplate}
            defaultTitle={defaultLinkTitle}
            defaultMessage={defaultLinkMessage}
            autoReportName={autoReportName}
          />
        )}
      </View>
    </View>
  );
});


const LeftColLandscapeFinalSomato: React.FC<{
onToolbarBack: () => void;
onReset: () => void;
onExport: () => void;
exporting: boolean;
manejarSeleccionImagen: (tipo:'circle'|'square') => void;

activeTab: Tab;
onOpenGallery: () => void;
comentarioLista: string;
onOpenComentarioModal: () => void;
imgListaSrc: ImageSourcePropType | null;
setImgListaSrc: (v: ImageSourcePropType | null) => void;

onGenerateLink: LinkUploaderProps['onGenerateLink'];
defaultLinkTitle: string;
defaultLinkMessage: string;
autoReportName?: string
onRequestTemplate?: () => Promise<PlantillaId | null>;
}> = ({ onToolbarBack, onReset, onExport, exporting, manejarSeleccionImagen,
activeTab, onOpenGallery, comentarioLista, onOpenComentarioModal, imgListaSrc, setImgListaSrc, onGenerateLink, defaultLinkTitle, defaultLinkMessage,autoReportName,onRequestTemplate }) => {
return (
<View style={[styles.landLeft, styles.landCol_ls]}>
<View style={styles.toolbarRow}>
<TouchableOpacity onPress={onToolbarBack} style={[styles.iconCircle, styles.toolbarIcon, styles.iconCircle_ls]}>
<Image source={I_Regresar} style={[styles.menuItemIcon, styles.menuItemIcon_ls]} />
</TouchableOpacity>
<TouchableOpacity onPress={onReset} style={[styles.iconCircle, styles.toolbarIcon, styles.iconCircle_ls]}>
<Image source={I_Refrescar} style={[styles.menuItemIcon, styles.menuItemIcon_ls]} />
</TouchableOpacity>

<TouchableOpacity style={[styles.iconCircle, styles.toolbarIcon, styles.iconCircle_ls]} onPress={onExport} disabled={exporting}>
<Image source={I_Imprimir} style={[styles.menuItemIcon, styles.menuItemIcon_ls]} />
</TouchableOpacity>
</View>

{activeTab === 'reporte' && (
<ExportLeftReporte isLandscape manejarSeleccionImagen={manejarSeleccionImagen} />
)}
{activeTab === 'lista' && (
<ExportLeftLista
onOpenGallery={onOpenGallery}
comentario={comentarioLista}
onOpenModal={onOpenComentarioModal}
selected={!!imgListaSrc}
preview={imgListaSrc}
onClear={() => setImgListaSrc(null)}
/>
)}
{activeTab === 'GenerarLink' && (
  <ExportLeftGenerarLink
    onGenerateLink={onGenerateLink}
    onRequestTemplate={onRequestTemplate}
    defaultTitle={defaultLinkTitle}
    defaultMessage={defaultLinkMessage}
    autoReportName={autoReportName}    // 👈 pasarla
  />
)}

</View>
);
};

type StepFinalSomatoProps = {
isLandscape?: boolean;
onBack: () => void;
onToolbarBack: () => void;
onReset: () => void;
onExport: () => void;
exporting: boolean;
nombrePaciente: string;
setNombrePaciente: (v: string) => void;
manejarSeleccionImagen: (tipo:'circle'|'square') => void;
activeTab: Tab;
onOpenGallery: () => void;
comentarioLista: string;
onOpenComentarioModal: () => void;
imgListaSrc: ImageSourcePropType | null;
setImgListaSrc: (v: ImageSourcePropType | null) => void;
onGenerateLink: LinkUploaderProps['onGenerateLink'];
defaultLinkTitle: string;
defaultLinkMessage: string;
autoReportName?: string
onRequestTemplate?: () => Promise<PlantillaId | null>;
};

const StepFinalSomato: React.FC<StepFinalSomatoProps> = React.memo(
({ isLandscape=false, onBack, onToolbarBack, onReset, onExport, exporting,nombrePaciente,setNombrePaciente, manejarSeleccionImagen,
activeTab, onOpenGallery, comentarioLista, onOpenComentarioModal, imgListaSrc, setImgListaSrc, onGenerateLink, defaultLinkTitle, defaultLinkMessage,autoReportName, onRequestTemplate }) => (
<View>
<FinalExportUISomato
isLandscape={isLandscape}
nombrePaciente={nombrePaciente}
setNombrePaciente={setNombrePaciente}
manejarSeleccionImagen={manejarSeleccionImagen}
onToolbarBack={onToolbarBack}
onReset={onReset}
onExport={onExport}
exporting={exporting}
activeTab={activeTab}
onOpenGallery={onOpenGallery}
comentarioLista={comentarioLista}
onOpenComentarioModal={onOpenComentarioModal}
imgListaSrc={imgListaSrc}
setImgListaSrc={setImgListaSrc}
onGenerateLink={onGenerateLink}
defaultLinkTitle={nombrePaciente ? `Potenciales Evocados — ${nombrePaciente}` : 'Potenciales Evocados'}
defaultLinkMessage="Saludos..."
autoReportName={autoReportName}
onRequestTemplate={onRequestTemplate}

  />
</View>
)
);


/* ───────────────────── Component ───────────────────── */
export default function ReporteViasSomatosensorialScreen(){
const { width, height } = useWindowDimensions();
const isLandscape = width > height;
// 🧠 qué conclusiones se agregaron en cada paso
const [conclusionStepHist, setConclusionStepHist] = useState<string[][]>([[]]);
// 🎨 marcador de overlays por paso (índice en overlayHistory)
const [overlayMarkers, setOverlayMarkers] = useState<number[]>([0]);
const [dermOpenZones, setDermOpenZones] = useState({ cervical:true, toracico:false, lumbosacro:false });
const [conclusions,setConclusions] = useState<ConclusionItem[]>([]);
const [nombrePaciente, setNombrePaciente] = useState('');
const [uploadingLink, setUploadingLink] = useState(false);
const [exportSuccess, setExportSuccess] = useState<{ filename: string; path: string } | null>(null);
const [exportKind, setExportKind] = useState<'pdf'|'jpeg'|null>(null);
const [plantillaId, setPlantillaId] = useState<PlantillaId>('none');
const exportBgColor = plantillaId === 'none' ? '#fff' : 'transparent';
const [templatePickerVisible, setTemplatePickerVisible] = useState(false);
const [templatePickerIntent, setTemplatePickerIntent] = useState<'export'|'link'|null>(null);
const templatePickerPromiseRef = React.useRef<((id: PlantillaId | null) => void) | null>(null);
const [pendingTemplateExport, setPendingTemplateExport] = useState<PlantillaId | null>(null);
const exportarPdfRef = React.useRef<() => Promise<void>>(async () => {});
// plantillaDef y loadPlantillaPdf eliminadas - ahora usa servicio centralizado

// === Nombres bonitos y consistentes ===
const STUDY_KEY = 'Somatosensorial';               // <- cambia esto en cada pantalla
const STUDY_PREFIX = `mEDXpro${STUDY_KEY}`;        // mEDXproSomatosensorial

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

// Si NO hay nombre de paciente, usamos un ordinal del "lote" actual (1)
const unnamedBatchOrdinalRef = React.useRef<number>(1);

/** Base: mEDXproSomatosensorial_<Paciente o N> */
const buildBaseName = (paciente: string | undefined | null): string => {
  const token = toSafeToken(paciente || '');
  const n = token || String(unnamedBatchOrdinalRef.current);
  return `${STUDY_PREFIX}_${n}`;
};


// Nombre de archivo “seguro”
const safe = (s: string) => s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
.replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '_');


// justo después del useState de nombrePaciente
useEffect(() => {
  (async () => {
    try {
      const last = await AsyncStorage.getItem('lastPacienteSomato');
      if (last && !nombrePaciente) setNombrePaciente(last);
    } catch {}
  })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

useEffect(() => {
  try {
    AsyncStorage.setItem('lastPacienteSomato', nombrePaciente || '');
  } catch {}
}, [nombrePaciente]);


const capturePages = async (format: 'png'|'jpg') => {
if (!exportRef.current) throw new Error('El lienzo no esta listo');
await flushBeforeCapture();
const quality = format === 'jpg' ? 0.95 : 1;
const bg = plantillaId === 'none' ? '#ffffff' : 'transparent';
const p1 = await captureRef(exportRef.current, { format, quality, result: 'base64', ...(format === 'png' ? { backgroundColor: bg } : {}) });
let p2: string | null = null;
if (exportRef2?.current) {
p2 = await captureRef(exportRef2.current, { format, quality, result: 'base64', ...(format === 'png' ? { backgroundColor: bg } : {}) });
}
return { p1, p2 };
};

const buildReportPdfArrayBuffer = async ({
  studyType,
  doctorName,
  templateId,
}: { studyType: string; doctorName?: string; templateId?: PlantillaId | null; }): Promise<ArrayBuffer> => {
  // 1. Capturar páginas
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

  // 3. Construir PDF usando el servicio centralizado
  return await buildPdfWithTemplate(capturedPages, config);
};

const reportFileName = () => {
  const base = buildBaseName(nombrePaciente);
  return `${base}.pdf`; // mEDXproSomatosensorial_<...>.pdf
};


const generateShareLink: LinkUploaderProps['onGenerateLink'] = async ({
  files, title, message, expiry, onFileProgress, templateId,
}) => {
  const studyType  = 'Vías Somatosensoriales';
  const doctorName =
    [userData?.name, userData?.lastname].filter(Boolean).join(' ') || undefined;

 const expSeconds = expiry === '24h' ? 60*60*24 : 60*60*24*5;

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
  const patientFolder = safe(nombrePaciente || 'Paciente');
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

  // 3) Subir los adjuntos del usuario (SOLO UNA VEZ)
  const processed = new Set<string>();
  for (const file of files || []) {
    if (!file || file.id === '__auto_report__' || processed.has(file.id)) continue;
    processed.add(file.id);

    const localUri  = (file as any).fileCopyUri || file.uri;
    const ab        = await readAsArrayBuffer(localUri);
    onFileProgress?.(file.id, 0);

    const safeName   = sanitizeFilename(file.name || `archivo_${Date.now()}`);
    const objectPath = `${patientFolder}/${uuid.v4()}_${safeName}`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, ab, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });
    if (error) throw new Error(`Error subiendo ${file.name}: ${error.message}`);
    onFileProgress?.(file.id, 1);

    uploadedForDB.push({
      name: safeName,
      mime_type: file.type || 'application/octet-stream',
      size_bytes: (file as any).size || ab.byteLength,
      storage_path: data.path,
    });
  }

  // 4) Completar el link
  const done = await completeShareLink({ linkId, files: uploadedForDB });
  if (!done.ok) throw new Error(done.error);
  return done.url;
};


const addConclusion = (c: ConclusionItem) => {
setConclusions(prev => prev.some(p => p.value === c.value) ? prev : [...prev, c]);
setConclusionStepHist(h => {
const nh = [...h];
const last = nh[nh.length - 1] ?? [];
nh[nh.length - 1] = Array.from(new Set([...last, c.value]));
return nh;
});
};
/* Canvas export que re-renderiza la lámina completa a tamaño PDF */
const CanvasView: React.FC<{ w?: number; h?: number; transparentBg?: boolean }> = ({
  w,
  h,
  transparentBg = false,
}) => {
  const size = w && h ? { w, h } : imgSize;
  if (!size) return null;

  const sx = limites.width ? size.w / limites.width : 1;
  const sy = limites.height ? size.h / limites.height : 1;
  const scale = Math.min(sx, sy);
  const offX = (size.w - limites.width * scale) / 2;
  const offY = (size.h - limites.height * scale) / 2;

  const figBaseCircle = 80;
  const figBaseSquare = 80;
  const figBorderWidth = 0.5;

  const baseForCanvas = transparentBg ? baseImageTransparent : baseImage;

  return (
    <View
      style={{
        width: size.w,
        height: size.h,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: transparentBg ? 'transparent' : '#FFFFFF',
      }}
      collapsable={false}
    >
      <Image
        source={baseForCanvas}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        resizeMode="contain"
      />
      {activeOverlays.map(key => {
        const overlaySrc = OVERLAYS_SOMATO[key];
        if (!overlaySrc) return null;
        const arr = Array.isArray(overlaySrc) ? overlaySrc : [overlaySrc];
        return arr.map((overlay, idx) => (
          <Image
            key={`${key}_${idx}`}
            source={overlay}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        ));
      })}
      {figuras.map(fig => {
        const base = fig.tipo === 'circle' ? figBaseCircle : figBaseSquare;
        const side = base * scale;
        const radius = fig.tipo === 'circle' ? side / 2 : 0;

        return (
          <View
            key={`fig_${fig.id}`}
            style={{
              position: 'absolute',
              left: offX + fig.posicion.x * scale,
              top: offY + fig.posicion.y * scale,
              width: side,
              height: side,
              borderRadius: radius,
              overflow: 'hidden',
              backgroundColor: 'transparent',
            }}
            renderToHardwareTextureAndroid
            needsOffscreenAlphaCompositing
          >
            <Image
              source={{ uri: fig.uri }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
                borderWidth: figBorderWidth,
                borderColor: 'gray',
                borderRadius: radius,
                borderStyle: 'solid',
              }}
            />
          </View>
        );
      })}
    </View>
  );
};

const removeConclusion = (value:string)=> setConclusions(prev=>prev.filter(p=>p.value!==value));

const [step, setStep]   = useState<StepId>('ROOT');
const [history, setHistory] = useState<StepId[]>(['ROOT']);

const [branch, setBranch] = useState<RootBranch>(null);
const [rootFlow, setRootFlow] = useState<RootFlow>(null);

const [side,setSide] = useState<Side>('');
const [severity, setSeverity] = useState<Severity>(null);

const [selectedNerve, setSelectedNerve] = useState<string|null>(null);

const [activeOverlays, setActiveOverlays] = useState<string[]>([]);
const [overlayHistory, setOverlayHistory] = useState<string[][]>([]);

const baseImage = branch === 'trigemino' ? IMG.BASE_CEREBRO : IMG_BASE;
const baseImageTransparent = branch === 'trigemino' ? IMG.BASE_CEREBRO_TRANSPARENT : IMG_BASE_TRANSPARENT;
const BASE_SRC_CUR = useMemo(()=> Image.resolveAssetSource(baseImage), [baseImage]);
const BASE_AR_CUR  = BASE_SRC_CUR.width / BASE_SRC_CUR.height;

/* Paciente + export */
const exportRef = React.useRef<View>(null);
const [imgSize, setImgSize] = useState<{ w:number; h:number } | null>(null);
const [exporting, setExporting] = useState(false);
const [rerenderKey, setRerenderKey] = useState(0);
useEffect(() => {
if (!exporting) return;
const id = setInterval(() => setRerenderKey(k => k + 1), 1000);
return () => clearInterval(id);
}, [exporting]);
const AnimatedLetters: any = AnimatedLetterText;

/* Figuras */
const [figuras, setFiguras] = useState<Figura[]>([]);
const [limites, setLimites] = useState({ width: 0, height: 0 });
const [imgListaAR, setImgListaAR] = useState<number | null>(null);

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

// ====== PDF runtime config ======
const [pdf, setPdf] = useState<PdfConfig>(DEFAULT_PDF);

// Tamanos base en puntos PDF
const PT = { A4: { W: 595, H: 842 }, Letter: { W: 612, H: 792 } };
const base = PT[pdf.paper] || PT.A4;
const Wpt = pdf.orientation === 'portrait' ? base.W : base.H;
const Hpt = pdf.orientation === 'portrait' ? base.H : base.W;

// Escala a px reales del canvas
const s = pdf.renderScale;
const px = (n: number) => Math.round(n * s);

const pageWpx = px(Wpt);
const pageHpx = px(Hpt);
const pad = px(pdf.pageMargin);
const innerW = pageWpx - pad * 2;
const innerH = pageHpx - pad * 2;
const footerReserveRawPx = Math.max(px(pdf.footer.raise ?? 0), 0);
const page1ShiftDownPx = Math.min(Math.max(px(pdf.page1?.shiftDown ?? 0), 0), footerReserveRawPx);
const layoutH = Math.max(innerH - footerReserveRawPx, 0);
const bottomReservePx = 0;

const headerHpx = px(pdf.header.height);
const headerOffsetDownPx = Math.max(px(pdf.header.offsetDown ?? 0), 0);
const headerTotalHpx = headerHpx + headerOffsetDownPx;
const headerGapPx = Math.max(px(pdf.header.afterGap ?? 0) - headerOffsetDownPx, 0);
const footerHpx = px(pdf.footer.height);
const diagTopGapPx = Math.max(px(pdf.diag.topGap ?? 0), 0);
const headerPadTopPx = px(pdf.header.padTop) + headerOffsetDownPx;
const headerPadBottomPx = px(pdf.header.padBottom);
const diagOffsetUpPx = Math.max(px(pdf.diag.offsetUp ?? 0), 0);
const footerBeforeGapPx = Math.max(px(pdf.footer.beforeGap ?? 0), 0);

let laminaWpx = Math.round(innerW * pdf.lamina.widthFrac);
let laminaHpx = Math.round(laminaWpx / BASE_AR_CUR);

const MIN_DIAG = px(pdf.diag.minHeight);
const MIN_LAMINA = px(pdf.lamina.minHeight);

let diagHpx = layoutH - headerTotalHpx - headerGapPx - diagTopGapPx - footerBeforeGapPx - laminaHpx - footerHpx;
if (diagHpx < MIN_DIAG) {
  const deficit = MIN_DIAG - diagHpx;
  laminaHpx = Math.max(MIN_LAMINA, laminaHpx - deficit);
  laminaWpx = Math.round(laminaHpx * BASE_AR_CUR);
  diagHpx   = layoutH - headerTotalHpx - headerGapPx - diagTopGapPx - footerBeforeGapPx - laminaHpx - footerHpx;
}

if (pdf.diag.pullUp > 0) {
  laminaHpx = Math.max(MIN_LAMINA, laminaHpx - px(pdf.diag.pullUp));
  diagHpx   = layoutH - headerTotalHpx - headerGapPx - diagTopGapPx - footerBeforeGapPx - laminaHpx - footerHpx;
}

// ====== Tabs (reporte/lista/GenerarLink) ======
const [activeTab, setActiveTab] = useState<Tab>('reporte');

// Lista (comentario + imagen)
const [comentarioLista, setComentarioLista] = useState('');
const [modalComentarioVisible, setModalComentarioVisible] = useState(false);
const [imgListaSrc, setImgListaSrc] = useState<ImageSourcePropType | null>(null);
const [mostrarGaleria, setMostrarGaleria] = useState(false);
const toImageSource = (src: string | ImageSourcePropType): ImageSourcePropType =>
typeof src === 'string' ? { uri: src } : src;

// Datos de usuario (logo/credenciales en PDF)
type UserData = { name:string; lastname:string; idprofessional:string; specialty:string; email:string; imageUrl:string; };
const [userData, setUserData] = useState<UserData | null>(null);

useEffect(() => {
  (async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const { data } = await axios.post(`${BASE_URL}/userdata`, { token });
      const ud = data?.data;
      if (ud) {
        setUserData(ud);
        if (ud.imageUrl) Image.prefetch(ud.imageUrl).catch(() => {});
      }
    } catch (e) {
      console.warn('POST /userdata FALLÓ:', explainAxios(e));
    }
  })();
}, []);



// Sincroniza layout antes de capturar
const flushBeforeCapture = async () => {
Keyboard.dismiss();
if (userData?.imageUrl) { try { await Image.prefetch(userData.imageUrl); } catch {} }
await new Promise<void>(r => InteractionManager.runAfterInteractions(() => r()));
await new Promise<void>(r => requestAnimationFrame(() => r()));
await new Promise<void>(r => setTimeout(r, 30));
};
const exportarPDF = async () => {
if (!exportRef.current) {
Alert.alert('Exportar', 'El lienzo del PDF no esta listo.');
return;
}
try {
setExportSuccess(null);
setExportKind('pdf');
setExporting(true);

const studyType = 'Vias Somatosensoriales';
const doctorName =
  [userData?.name, userData?.lastname].filter(Boolean).join(' ') || undefined;

const ab = await buildReportPdfArrayBuffer({ studyType, doctorName });
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
} catch (e:any) {
Alert.alert('Error', `No se pudo exportar el PDF.\n\n${e?.message ?? e}`);
} finally {
setExporting(false);
setExportKind(null);
}
};


// Capturar paginas ocultas
const exportRef2 = React.useRef<View>(null);
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


const addOverlays = (ids: string[]) => {
setActiveOverlays(prev => [...prev, ...ids.filter(id => !prev.includes(id))]);
setOverlayHistory(h => [...h, ids]);
};
const addOverlay = (id: string) => addOverlays([id]);
const removeOverlays = (ids:string[])=>{
setActiveOverlays(prev => prev.filter(k => !ids.includes(k)));
setOverlayHistory(prev =>
prev.map(grp => grp.filter(k => !ids.includes(k))).filter(grp => grp.length)
);
};
const removeLastOverlayGroup = () => {
setOverlayHistory(h => {
if (h.length === 0) return h;
const newHist = h.slice(0, -1);
const lastGroup = h[h.length - 1];
setActiveOverlays(prev => prev.filter(id => !lastGroup.includes(id)));
return newHist;
});
};
const resetOverlays = () => { setActiveOverlays([]); setOverlayHistory([]); };

const fmt = (s:string)=>{ const t=s.trim(); return t ? t[0].toUpperCase()+t.slice(1) : t; };
const [modo,setModo] = useState<'lista'|'enunciado'>('lista');

// ======== Enunciado ========
const hasVal = (v: string) => conclusions.some(c => c.value === v);
const pick   = (vals: string[]) => conclusions.find(c => vals.includes(c.value));
const NERVIO_LABELS_LC: Record<string,string> = Object.fromEntries(
[...NERVIOS_SUP, ...NERVIOS_INF].map(n => [n.value, n.label.toLowerCase()])
);
const TOPO_MAP: Record<string,string> = (() => {
const m: Record<string,string> = {};
TOPO_SUP.forEach(i => { m[i.valueSuffix] = i.title; });
TOPO_INF.forEach(i => { m[i.valueSuffix] = i.title; });
return m;
})();
// ✅ Conserva los \n\n iniciales
const getTopographySentence = () => {
const allVals = conclusions.map(c => c.value);
const re = /^(?:izquierdo|derecho|bilateral)_?(corticals|subcorticals|cervicals|perifericos|corticali|subcorticali|toracicoi|lumbosacroi|perifericoi)$/;
const hit = allVals.find(v => re.test(v));
if (!hit) return '';

const suffix = hit.replace(/^(?:izquierdo|derecho|bilateral)_?/, '');
const raw = TOPO_MAP[suffix] || '';
if (!raw) return '';

// 👇 solo recorta espacios del final; respeta \n iniciales
const t = raw.replace(/[ \t]+$/,'');
return /[.!?]$/.test(t) ? t : `${t}.`;
};

const getStimulusSentence = () => {
if (branch === 'superiores' || branch === 'inferiores') {
if (!selectedNerve) return '';

//Buscamos si hay conclusión con title para ese nervio
const conc = conclusions.find(c => c.value === selectedNerve);
if (conc?.title) return conc.title;

//Si no, usamos el label
const lbl = NERVIO_LABELS_LC[selectedNerve] || `nervio ${selectedNerve.replace(/_/g,' ').toLowerCase()}`;
return ` a través de región medular posterior al estímulo de ${lbl}.`;
}
if (branch === 'trigemino') return ' a través del tracto y núcleo mesencefálico al estímulo de nervio trigémino.';
if (branch === 'dermatomas') {
const codes = conclusions
.map(c => c.value)
.map(v => v.match(/(?:izquierdo|derecho|bilateral)(c\d|t\d|l\d|s\d)(?:di|da)$/i)?.[1]?.toUpperCase())
.filter(Boolean) as string[];
const uniq = Array.from(new Set(codes));
return uniq.length ? ` a través de región medular posterior al estímulo de dermatomas ${uniq.join('-')}.` : '';
}
return '';
};
// ✅ No metas un espacio si topo empieza con salto de línea
const buildEnunciado = () => {
const via = `Vía somatosensorial${rootFlow==='indemne'?' con integridad funcional':rootFlow==='alterada'?' con defecto':''}`;

let fisio=''; 
if (hasVal('retardo_en_la_conduccion')) fisio=' por retardo en la conducción';
else if (hasVal('bloqueo_en_la_conduccion')) fisio=' por bloqueo en la conducción';
else if (hasVal('deficit_neuronal')) fisio=' axonal';
else if (hasVal('sin_respuesta')) fisio=' por ausencia de respuesta evocable';

const gradoVal = pick(['leve','moderado','severo'])?.value;
const grado = gradoVal ? ` ${gradoVal}` : '';

let secund=''; 
if (hasVal('perdida_axonal_secundaria')) secund=' y pérdida axonal secundaria';
if (hasVal('retardo_secundario_en_la_conduccion')) secund=' y retardo secundario en la conducción';

let ladoTxt=''; 
if (side==='izquierdo') ladoTxt=' para lado izquierdo';
else if (side==='derecho') ladoTxt=' para lado derecho';
else if (side==='bilateral') ladoTxt=' de forma bilateral';

const estimulo = getStimulusSentence();

let s1 = `${via}${fisio}${grado}${secund}${ladoTxt}`.replace(/\s+/g,' ').trim();
s1 = s1 ? s1[0].toUpperCase() + s1.slice(1) : s1;
if (estimulo) s1 += estimulo; else if (!/[.!?]$/.test(s1)) s1 += '.';

const topo = getTopographySentence();
if (!topo) return s1;

// 👇 si topo arranca con \n, no metas espacio; si no, agrega uno
const needsSpace = !/^\s*\n/.test(topo);
return needsSpace ? `${s1} ${topo}` : `${s1}${topo}`;
};

const textoEnunciado = buildEnunciado();

const groupedSections = useMemo(() => {
const acc: Partial<Record<Section, string[]>> = {};
const dermCodes: string[] = [];
conclusions.forEach(c => {
if (c.title.trim() === '') return;
const m = c.value.match(/(?:izquierdo|derecho|bilateral)(c\d|t\d|l\d|s\d)(?:di|da)$/i);
if (m) { dermCodes.push(m[1].toUpperCase()); return; }
const sec = getSection(c); if (!sec) return;
const short = VALUE_LABELS[c.value] ?? sanitizeTitle(c.title);
const final = fmt(short); if (!final) return;
acc[sec] ??= []; if (!acc[sec]!.includes(final)) acc[sec]!.push(final);
});
if (dermCodes.length) {
const uniq = Array.from(new Set(dermCodes));
acc['Dermatomas'] = [`${uniq.join('-')}.`];
}
return acc;
}, [conclusions]);
// arriba, junto a otros useMemo/useState
const hasDermSelected = useMemo(
() => conclusions.some(c =>
/^(?:izquierdo|derecho|bilateral)(?:c\d|t\d|l\d|s\d)(?:di|da)$/i.test(c.value)
),
[conclusions]
);

// Lista “compacta” para Modo Lista (UI + PDF pág.2)
const listaSomato = useMemo(() => buildListaSomato(conclusions, side), [conclusions, side]);


const limpiarTextoReporte = (s: string): string => {
if (!s) return '';
// 1) Normaliza espacios sin tocar saltos de línea
//    - Colapsa espacios/tabs dentro de cada línea
//    - Limpia espacios alrededor de saltos de línea, manteniendo \n\n como “párrafo”
let t = s
.replace(/[ \t]+/g, ' ')       // espacios/tabs → 1 espacio
.replace(/ *\n+ */g, '\n\n')   // conserva saltos, quita espacios pegados al \n
.trim();

// 2) Ajustes suaves de puntuación por cada línea, sin cambiar mayúsculas/minúsculas
t = t
.split('\n')                   // trabaja línea por línea
.map(line => {
let l = line.replace(/\s*([,;:.])\s*/g, '$1 ');   // espacios alrededor de , ; : .
l = l.replace(/\s+$/,'').replace(/([.!?])\s*([.!?])+$/,'$1'); // punto doble al final
return l;
})
.join('\n');

// 3) Asegura punto final SOLO si el último párrafo no termina en . ! ?
if (!/[.!?]$/.test(t.trim())) t += '.';

return t;
};


// versión sanitizada del enunciado para mostrar/exportar
const textoReporte = useMemo(() => limpiarTextoReporte(textoEnunciado), [textoEnunciado]);

/* helpers top bar */
const handleBack = () => {
if (history.length <= 1) return;

// a) ¿a qué paso volveremos?
const nextStep = history[history.length - 2];

// b) quitar conclusiones agregadas en ESTE paso
setConclusionStepHist(h => {
const last = h[h.length - 1] ?? [];
last.forEach(v => removeConclusion(v));
const nh = h.slice(0, -1);
return nh.length ? nh : [[]];
});

// c) revertir overlays al marcador de entrada de ESTE paso
setOverlayMarkers(m => {
const nm = m.slice(0, -1);
const marker = nm[nm.length - 1] ?? 0;
setOverlayHistory(hh => {
const newH = hh.slice(0, marker);
setActiveOverlays(newH.flat());
return newH;
});
return nm.length ? nm : [0];
});

// d) volver un paso en el historial
setHistory(h => h.slice(0, -1));
setStep(nextStep);

// e) si volvimos al menú raíz → TODO vacío (sin texto/estímulo seleccionados)
if (nextStep === 'ROOT') {
// limpiar cualquier resto de conclusiones/overlays y estados de flujo
setConclusions([]);
setConclusionStepHist([[]]);

resetOverlays();
setOverlayMarkers([0]);

setSelectedNerve(null);
setSide('');
setSeverity(null);
setRootFlow(null);
setBranch(null);
}
};



const addBaseOverlayOnSide = (sideSel: Side) => {
if (branch !== 'superiores' && branch !== 'inferiores') return;

const keys =
branch === 'superiores'
? (sideSel === 'bilateral' ? ['superior_izq', 'superior_der']
: [sideSel === 'izquierdo' ? 'superior_izq' : 'superior_der'])
: (sideSel === 'bilateral' ? ['inferior_izq', 'inferior_der']
: [sideSel === 'izquierdo' ? 'inferior_izq' : 'inferior_der']);

addOverlays(keys);
};


const resetAll = () => {
setConclusions([]);
setStep('ROOT');
setHistory(['ROOT']);
setSide('');
setModo('lista');
setRootFlow(null);
setBranch(null);
setSelectedNerve(null);
setSeverity(null);
resetOverlays();
setNombrePaciente('');
setFiguras([]);
setComentarioLista(''); setMostrarGaleria(false); setImgListaSrc(null);
};

const goTo = (next: StepId) => {
setHistory(prev => [...prev, next]);
setStep(next);
// nuevo “bucket” para este paso
setConclusionStepHist(h => [...h, []]);
// guarda cuántos overlay-groups había al entrar a este paso
setOverlayMarkers(m => [...m, overlayHistory.length]);
};

const expandOverlay = (rawId: string): string[] => {
if (rawId.startsWith('bilateral_')) {
const base = rawId.replace('bilateral_', '');
return [`izquierdo_${base}`, `derecho_${base}`];
}
return [ rawId ];
};

const expandTopoOverlaysBySeverity = (sideSel: Side, suffix: string, order: readonly string[]): string[] => {
const baseKeys = buildTopographyKeys(sideSel, suffix, order);
if (rootFlow === 'alterada') {
if (!severity) return [];
return baseKeys.map(k => `${k}Alterada_${severity}`);
}
return baseKeys;
};

const pedirPermiso = async (): Promise<boolean> => {
if (Platform.OS !== 'android') return true;
try {
const req = [
PermissionsAndroid.PERMISSIONS.CAMERA,
Platform.Version >= 33
? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
: PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
];
const res = await PermissionsAndroid.requestMultiple(req);
const cam = res['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED;
const read = (Platform.Version >= 33
? res['android.permission.READ_MEDIA_IMAGES']
: res['android.permission.READ_EXTERNAL_STORAGE']) === PermissionsAndroid.RESULTS.GRANTED;
return cam && read;
} catch { return false; }
};
const agregarFigura = (tipo:'circle'|'square', uri:string) => {
  // Tamaño base de las figuras (debe coincidir con FIGURA_SIZE de FiguraMovibleVias)
  const figuraSize = 80;  // círculo y cuadrado usan el mismo tamaño base

  // Calcular posición central del contenedor
  const centerX = (limites.width / 2) - (figuraSize / 2);
  const centerY = (limites.height / 2) - (figuraSize / 2);

  setFiguras(p => [...p, {
    id: uuid.v4().toString(),
    tipo,
    uri,
    posicion: {
      x: centerX > 0 ? centerX : 0,  // ✅ Valida que no sea negativo
      y: centerY > 0 ? centerY : 0   // ✅ Valida que no sea negativo
    }
  }]);
};
const manejarSeleccionImagen = async (tipo:'circle'|'square') => {
if (!(await pedirPermiso())) return;
Alert.alert('Seleccionar imagen','¿Qué deseas hacer?',[
{ text:'Tomar foto', /*onPress:()=>launchCamera({mediaType:'photo',quality:1},r=>{
         if(r.assets?.[0]?.uri) agregarFigura(tipo, r.assets[0].uri!);
       })*/onPress: async () => { const imagenEscaneada = await escanearImagen();
if (imagenEscaneada) {agregarFigura(tipo, imagenEscaneada);} else {console.warn('No se pudo escanear la imagen');}},},
{ text:'Galería',
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
          if (res.assets?.[0]?.uri) {
            res.assets.forEach((asset) => {
              if (asset.uri) {
                agregarFigura(tipo, asset.uri);
              }
            });
          }
        });
      }
    } catch (err) {
      console.warn('Error en seleccionar imagen', err);
    }
  },
},
{text:'Cancelar',style:'cancel'},
]);
};
const actualizarPos = (id:string, x:number, y:number) =>
setFiguras(p => p.map(f => f.id === id ? { ...f, posicion:{x,y} } : f));
const eliminarFigura = (id:string) =>
setFiguras(p => p.filter(f => f.id !== id));

const nextAfterLado = () => {
// ⛔️ En ALTERADA no metas el nervio (duplica la base). Solo en INDEMNE.
if (rootFlow === 'indemne' && selectedNerve) {
addOverlays(expandOverlay(`${side}_${selectedNerve}`));
}

if (branch === 'dermatomas') { goTo('DERMATOMAS_LIST'); return; }
if (rootFlow === 'indemne') { goTo('FIN'); return; }

switch (branch) {
case 'superiores': goTo('TOP_SUP'); break;
case 'inferiores': goTo('TOP_INF'); break;
case 'trigemino':  goTo('FIN');     break;
default:           goTo('FIN');
}
};


/* ─────────────────── Steps UI (sin cambios de lógica) ─────────────────── */
const StepROOT = () => (
<View>
<Text style={styles.stepTitle}>VÍA SOMATOSENSORIAL</Text>

<Accordion title="SUPERIORES">
{NERVIOS_SUP.map(n=> (
<ConclusionBtn key={n.value} value={n.value} title={n.title} label={n.label}
onPress={()=>{ setBranch('superiores'); setSelectedNerve(n.value); goTo('INDEMNE_ALTERADA'); }}/>
))}
</Accordion>

<Accordion title="INFERIORES">
{NERVIOS_INF.map(n=> (
<ConclusionBtn key={n.value} value={n.value} title={n.title} label={n.label}
onPress={()=>{ setBranch('inferiores'); setSelectedNerve(n.value); goTo('INDEMNE_ALTERADA'); }}/>
))}
</Accordion>

<TouchableOpacity
style={styles.conclusionBtn}
onPress={() => { setBranch('dermatomas'); setSelectedNerve(null); goTo('INDEMNE_ALTERADA'); }}
>
<Text style={styles.conclusionBtnText}>DERMATOMAS</Text>
</TouchableOpacity>
<ConclusionBtn
value="trigemino_indemne"
title="Vía somatosensorial, a través del tracto y núcleo mesencefálico al estímulo de nervio trigémino."
label="TRIGÉMINO"
onPress={()=>{ setBranch('trigemino'); setSelectedNerve(null); goTo('INDEMNE_ALTERADA'); }}
/>
</View>
);

const integrityKey = (b: RootBranch | null, f: RootFlow): string | null => {
if (!b || !f) return null;
const base =
b === 'superiores' ? 'superiores' :
b === 'inferiores' ? 'inferior'   :
b === 'trigemino'  ? 'trigemino'  :
b === 'dermatomas' ? 'dermatomas' : '';
return base ? `${base}_${f}` : null;
};

const dropOppositeIntegrity = (b: RootBranch | null, f: RootFlow) => {
const opp = f === 'indemne' ? 'alterada' : 'indemne';
const k = integrityKey(b, opp as RootFlow);
if (k) removeConclusion(k);
};


const StepINDEMNE_ALTERADA = () => (
<View>
<NavRow onBack={handleBack} onReset={resetAll}  />      
<Text style={styles.stepTitle}>INTEGRIDAD:</Text>
<ConclusionBtn
value={branch==='superiores'? 'superiores_indemne'
:branch==='inferiores'? 'inferior_indemne'
:branch==='trigemino'?  'trigemino_indemne'
:                       'dermatomas_indemne'}
title="Vía somatosensorial con integridad funcional "
label="INDEMNE"
onPress={() => {
setRootFlow('indemne');
setSeverity(null);
dropOppositeIntegrity(branch, 'indemne'); // 👈 limpia el '..._alterada' si estaba
goTo('LADO');
}}
/>

<ConclusionBtn
value={branch==='superiores'? 'superiores_alterada'
:branch==='inferiores'? 'inferior_alterada'
:branch==='trigemino'?  'trigemino_alterada'
:                       'dermatomas_alterada'}
title="Vía somatosensorial con defecto "
label="ALTERADA"
onPress={() => {
setRootFlow('alterada');
setSeverity(null);
dropOppositeIntegrity(branch, 'alterada'); // 👈 limpia el '..._indemne' si estaba (incluye el que se metía antes en ROOT)
goTo('FISIOPATO');
}}
/>

</View>
);

const StepFISIOPATO = () => (<View>
<NavRow onBack={handleBack}
onReset={resetAll}/>
<Text style={styles.stepTitle}>FISIOPATOLOGÍA:</Text>
<ConclusionBtn value="retardo_en_la_conduccion" title="Por retardo en la conducción " label="RETARDO EN LA CONDUCCIÓN" onPress={()=>goTo('GRADO_RETARDO')}/>
<ConclusionBtn value="bloqueo_en_la_conduccion" title=" Por bloqueo en la conducción" label="BLOQUEO EN LA CONDUCCIÓN" onPress={()=>goTo('GRADO_RETARDO')}/>
<ConclusionBtn value="deficit_neuronal" title=" Axonal" label="DÉFICIT AXONAL" onPress={()=>goTo('GRADO_RETARDO')}/>
<ConclusionBtn value="sin_respuesta" title=" Por ausencia de respuesta evocable" label="SIN RESPUESTA"onPress={()=>{ setSeverity('severo'); goTo('LADO')}}/>  
</View>);

const StepGRADO_RETARDO = () => (<View>
<NavRow onBack={handleBack}
onReset={resetAll}/>
<Text style={styles.stepTitle}>GRADO:</Text>
{(() => {
const isBloqueo = conclusions.some(c => c.value === 'bloqueo_en_la_conduccion');
const next = (grado: Severity) => {
setSeverity(grado);
if (isBloqueo) { goTo('LADO'); } else { goTo('RETARDO_SECUNDARIO'); }
};
return (
<>
<ConclusionBtn value="leve"     title=" Leve "     label="LEVE"     onPress={()=> next('leve')}/>
<ConclusionBtn value="moderado" title=" Moderado " label="MODERADO" onPress={()=> next('moderado')}/>
<ConclusionBtn value="severo"   title=" Severo "   label="SEVERO"   onPress={()=> next('severo')}/>
</>
);
})()}
</View>);

const StepRETARDO_SECUNDARIO = () => (
<View>
<NavRow
onBack={handleBack}
onReset={resetAll}
onFwd={()=> goTo('LADO')}
/>
<Text style={styles.stepTitle}>{/retardo_en_la_conduccion/.test(conclusions.map(c=>c.value).join(',')) ? 'RETARDO EN CONDUCCIÓN:' : 'AXONAL:'}</Text>
{(/retardo_en_la_conduccion/).test(conclusions.map(c=>c.value).join(',')) && (
<ConclusionBtn value="perdida_axonal_secundaria" title=", y pérdida axonal secundaria " label="+ PÉRDIDA AXONAL" onPress={()=>goTo('LADO')}/>
)}
{(/deficit_neuronal/).test(conclusions.map(c=>c.value).join(',')) && (
<ConclusionBtn value="retardo_secundario_en_la_conduccion" title=", y retardo secundario en la conducción " label="+ RETARDO EN LA CONDUCCIÓN" onPress={()=>goTo('LADO')}/>
)}
{(!/retardo_en_la_conduccion|deficit_neuronal/.test(conclusions.map(c=>c.value).join(','))) && (
<Text style={styles.reporteTexto}>No aplica extra. Continúa.</Text>
)}

<SkipButton onPress={() => goTo('LADO')} label="Saltar  ➔" />
</View>
);

const StepLADO = () => (
<View>
<NavRow
onBack={handleBack}
onReset={resetAll}
/>
<Text style={styles.stepTitle}>LADO:</Text>

{/* IZQUIERDO */}
<ConclusionBtn
value="izquierdo"
title=" Para lado izquierdo "
label="IZQUIERDO"
onPress={() => {
setSide('izquierdo');

// Base (siempre) según branch
if (branch === 'superiores') addOverlays(['superior_izq']);
else if (branch === 'inferiores') addOverlays(['inferior_izq']);

// Trigémino mantiene su overlay propio
if (branch === 'trigemino') {
addOverlays(getTrigeminoOverlayKeys('izquierdo', rootFlow, severity));
}

nextAfterLado();
}}
/>

{/* DERECHO */}
<ConclusionBtn
value="derecho"
title=" Para lado derecho "
label="DERECHO"
onPress={() => {
setSide('derecho');

// Base (siempre) según branch
if (branch === 'superiores') addOverlays(['superior_der']);
else if (branch === 'inferiores') addOverlays(['inferior_der']);

if (branch === 'trigemino') {
addOverlays(getTrigeminoOverlayKeys('derecho', rootFlow, severity));
}

nextAfterLado();
}}
/>

{/* BILATERAL */}
<ConclusionBtn
value="bilateral"
title=" De forma bilateral,"
label="BILATERAL"
onPress={() => {
setSide('bilateral');

// Base (siempre) según branch
if (branch === 'superiores') addOverlays(['superior_izq', 'superior_der']);
else if (branch === 'inferiores') addOverlays(['inferior_izq', 'inferior_der']);

if (branch === 'trigemino') {
addOverlays(getTrigeminoOverlayKeys('bilateral', rootFlow, severity));
}

nextAfterLado();
}}
/>
</View>
);

const StepDERMATOMAS = () => (
<View>
<NavRow 
onBack={handleBack}
onReset={resetAll}
onFwd={hasDermSelected ? () => goTo('FIN') : undefined}
/>
<Text style={styles.stepTitle}>DERMATOMAS</Text>
<Text style={styles.reporteTexto}>Selecciona los dermatomas estimulados:</Text>

{(['cervical','toracico','lumbosacro'] as const).map(zone => {
const open = dermOpenZones[zone];
const toggle = () => setDermOpenZones(prev => ({ ...prev, [zone]: !prev[zone] }));
return (
<ControlledAccordion key={zone} title={zone.toUpperCase()} open={open} onToggle={toggle}>
<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
{DERM_LEVELS[zone].map(code => {
const valueNow = `${side}${code}${rootFlow === 'indemne' ? 'di' : 'da'}`;
const titleTxt = `A través de región medular posterior al estímulo de dermatomas ${code.toUpperCase()}`;
const isSel    = conclusions.some(c => c.value === valueNow);

const toggleDerm = () => {
const value = `${side}${code}${rootFlow === 'indemne' ? 'di' : 'da'}`; // <- AHORA aquí
const ovKeys = getDermOverlayKeys(side, rootFlow, code, severity);
if (conclusions.some(c => c.value === value)) { 
removeConclusion(value); 
removeOverlays(ovKeys); 
} else { 
addConclusion({ value, title: titleTxt }); 
addOverlays(ovKeys); 
}
};

return (
<ConclusionBtn
key={code}
value={valueNow}
title={titleTxt}
label={code.toUpperCase()}
selected={isSel}
onPress={toggleDerm}
onLongPress={toggleDerm}
/>
);
})}

</View>
</ControlledAccordion>

);
})}

    <NextButton onPress={() => goTo('FIN')} disabled={!hasDermSelected} />

</View>
);
const StepTOP_SUP = () => (
<View>
<NavRow
onBack={handleBack}
onReset={resetAll}

/>

<Text style={styles.stepTitle}>NIVEL SUPERIOR:</Text>
{TOPO_SUP.map(item => {
const valueKey = side === 'bilateral' ? `bilateral_${item.valueSuffix}` : `${side}${item.valueSuffix}`;
return (
<ConclusionBtn
key={item.valueSuffix}
value={valueKey}
title={item.title}
label={item.label}
onPress={() => {
const keys = expandTopoOverlaysBySeverity(side, item.valueSuffix, ORDER_SUP);
addOverlays(keys);
goTo('FIN');
}}
/>
);
})}
</View>
);


const StepTOP_INF = () => (
<View>
<NavRow
onBack={handleBack}
onReset={resetAll}
/>
<Text style={styles.stepTitle}>NIVEL INFERIOR:</Text>
{TOPO_INF.map(item => {
const valueKey = side === 'bilateral' ? `bilateral_${item.valueSuffix}` : `${side}${item.valueSuffix}`;
return (
<ConclusionBtn
key={item.valueSuffix}
value={valueKey}
title={item.title}
label={item.label}
onPress={() => {
const keys = expandTopoOverlaysBySeverity(side, item.valueSuffix, ORDER_INF);
addOverlays(keys);
goTo('FIN');
}}
/>
);
})}
</View>
);

const currentStep = () => {
switch(step){
case 'ROOT':              return <StepROOT/>;
case 'INDEMNE_ALTERADA':  return <StepINDEMNE_ALTERADA/>;
case 'FISIOPATO':         return <StepFISIOPATO/>;
case 'GRADO_RETARDO':     return <StepGRADO_RETARDO/>;
case 'RETARDO_SECUNDARIO':return <StepRETARDO_SECUNDARIO/>;
case 'LADO':              return <StepLADO/>;
case 'DERMATOMAS_LIST':   return <StepDERMATOMAS/>;
case 'TOP_SUP':           return <StepTOP_SUP/>;
case 'TOP_INF':           return <StepTOP_INF/>;
case 'FIN':
return (
<StepFinalSomato
isLandscape={isLandscape}
onBack={handleBack}
onToolbarBack={handleBack}
onReset={resetAll}
      onExport={handleExportRequest}
exporting={exporting}
nombrePaciente={nombrePaciente}
setNombrePaciente={setNombrePaciente}
manejarSeleccionImagen={manejarSeleccionImagen}
activeTab={activeTab}
onOpenGallery={() => setMostrarGaleria(true)}
comentarioLista={comentarioLista}
onOpenComentarioModal={() => setModalComentarioVisible(true)}
  imgListaSrc={imgListaSrc}
  setImgListaSrc={setImgListaSrc}
  onGenerateLink={generateShareLink}
  defaultLinkTitle={nombrePaciente ? `Potenciales Evocados — ${nombrePaciente}` : 'Potenciales Evocados'}
  defaultLinkMessage="Saludos..."
  autoReportName={reportFileName()}
  onRequestTemplate={requestTemplateForLink}

  />
);
default: return null;
}
};

const [textoVisual, setTextoVisual] = useState('');
const [showEditModal, setShowEditModal] = useState(false);
const [textoEditadoManualmente, setTextoEditadoManualmente] = useState(false);
useEffect(() => {
  // cada vez que se recalcula textoReporte, actualiza el editable
  // solo actualiza si no se ha editado manualmente
  if (!textoEditadoManualmente) {
    setTextoVisual(textoReporte);
  }
}, [textoReporte, textoEditadoManualmente]);

/* UI principal */
return (
<ReportContext.Provider value={{conclusions,addConclusion,removeConclusion}}>
<View style={styles.container}>

{/* Barra superior: input del paciente (igual que Visual) */}
<View style={styles.topBar}>
<View style={styles.topBarInputWrap}>
<FancyInput
label="Nombre del paciente"
placeholder="Nombre del paciente"
value={nombrePaciente}
onChangeText={setNombrePaciente}
autoCapitalize="words"
autoCorrect={false}
returnKeyType="done"
blurOnSubmit
/>
</View>
</View>


<ScrollView contentContainerStyle={styles.scrollContent}>
{isLandscape ? (
/* ====== HORIZONTAL: 3 columnas (30/40/30) ====== */
<View style={styles.landRow}>
{/* IZQUIERDA */}
{(step === 'FIN')
? (
<LeftColLandscapeFinalSomato
onToolbarBack={handleBack}
onReset={resetAll}
onExport={handleExportRequest}
exporting={exporting}
manejarSeleccionImagen={manejarSeleccionImagen}
activeTab={activeTab}
onOpenGallery={() => setMostrarGaleria(true)}
comentarioLista={comentarioLista}
onOpenComentarioModal={() => setModalComentarioVisible(true)}
imgListaSrc={imgListaSrc}
setImgListaSrc={setImgListaSrc}
onGenerateLink={generateShareLink}
defaultLinkTitle={nombrePaciente ? `Potenciales Evocados — ${nombrePaciente}` : 'Potenciales Evocados'}
defaultLinkMessage="Saludos..."
autoReportName={reportFileName()}
onRequestTemplate={requestTemplateForLink}
/>
)
: (
<View style={[styles.landLeft, styles.landCol_ls]}>
<View style={styles.stepCard}>{currentStep()}</View>
</View>
)
}

{/* CENTRO: lámina */}
<View style={[styles.landCenter, styles.landCol_ls]}>
<View
style={[styles.imageBox, { aspectRatio: BASE_AR_CUR }]}
onLayout={e=>{
const {width: w, height: h} = e.nativeEvent.layout;
setImgSize({ w, h });
setLimites({ width: w, height: h });
}}
>
{!!nombrePaciente && <Text style={styles.pacienteBadge}>{nombrePaciente}</Text>}

<Image source={baseImage} style={styles.layer} resizeMode="contain" />
{activeOverlays
.flatMap(key => {
const src = OVERLAYS_SOMATO[key];
if (!src) return [];
return Array.isArray(src) ? src : [src];
})
.map((imgSrc, idx) => (
<Image key={`ov${idx}`} source={imgSrc} style={styles.layer} resizeMode="contain" />
))}
{figuras.map(f=>(
<FiguraMovible
key={f.id}
id={f.id}
uri={f.uri}
tipo={f.tipo}
posicionInicial={f.posicion}
limitesContenedor={limites}
onActualizarPosicion={actualizarPos}
onEliminar={eliminarFigura}
ocultarBoton={exporting}
/>
))}
</View>
</View>

{/* Columna DERECHA (landscape): selector de modo + resumen */}
<View style={[styles.landRight, styles.landCol_ls]}>
{/* Selector de modo */}
<View style={styles.modeSelector}>
<TouchableOpacity style={[styles.modeBtn, activeTab === 'reporte' && styles.modeBtnActive]} onPress={()=>setActiveTab('reporte')}>
<Text style={styles.modeTxt}>Reporte</Text>
</TouchableOpacity>
<TouchableOpacity style={[styles.modeBtn, activeTab === 'lista' && styles.modeBtnActive]} onPress={()=>setActiveTab('lista')}>
<Text style={styles.modeTxt}>Lista</Text>
</TouchableOpacity>
<TouchableOpacity style={[styles.modeBtn, activeTab === 'GenerarLink' && styles.modeBtnActive]} onPress={()=>setActiveTab('GenerarLink')}>
<Text style={styles.modeTxt}>Generar Link</Text>
</TouchableOpacity>
</View>

{/* Resumen */}
<View style={[styles.repBox, styles.repBoxLandscape]}>
<Text style={styles.repTitle}>Vía Somatosensorial</Text>

{activeTab === 'lista' ? (
  listaSomato.map((ln, i) => (
    <Text key={`${ln.k}-${i}`} style={styles.repTxt}>
      <Text style={{ fontWeight:'bold' }}>{ln.k} - </Text>{ln.v}
    </Text>
  ))
) : (
<Text style={[styles.repTxt, styles.justify]}>{textoReporte}</Text>
)}
</View>
</View>

</View>
) : (
/* ====== VERTICAL ====== */
<>
{/* Lámina */}
<View
style={[styles.imageBox, { aspectRatio: BASE_AR_CUR }]}
onLayout={e=>{
const {width: w, height: h} = e.nativeEvent.layout;
setImgSize({ w, h });
setLimites({ width: w, height: h });
}}
>
{!!nombrePaciente && <Text style={styles.pacienteBadge}>{nombrePaciente}</Text>}

<Image source={baseImage} style={styles.layer} resizeMode="contain" />
{activeOverlays
.flatMap(key => {
const src = OVERLAYS_SOMATO[key];
if (!src) return [];
return Array.isArray(src) ? src : [src];
})
.map((imgSrc, idx) => (
<Image key={`ov${idx}`} source={imgSrc} style={styles.layer} resizeMode="contain" />
))}
{figuras.map(f=>(
<FiguraMovible
key={f.id}
id={f.id}
uri={f.uri}
tipo={f.tipo}
posicionInicial={f.posicion}
limitesContenedor={limites}
onActualizarPosicion={actualizarPos}
onEliminar={eliminarFigura}
ocultarBoton={exporting}
/>
))}
</View>

{/* Paso actual */}
<View style={styles.stepCard}>{currentStep()}</View>
{/* Selector Lista / Reporte */}
{/* Selector modo (portrait) */}
<View style={styles.modeSelector}>
<TouchableOpacity style={[styles.modeBtn, activeTab === 'reporte' && styles.modeBtnActive]} onPress={()=>setActiveTab('reporte')}>
<Text style={styles.modeTxt}>Reporte</Text>
</TouchableOpacity>
<TouchableOpacity style={[styles.modeBtn, activeTab === 'lista' && styles.modeBtnActive]} onPress={()=>setActiveTab('lista')}>
<Text style={styles.modeTxt}>Lista</Text>
</TouchableOpacity>
<TouchableOpacity style={[styles.modeBtn, activeTab === 'GenerarLink' && styles.modeBtnActive]} onPress={()=>setActiveTab('GenerarLink')}>
<Text style={styles.modeTxt}>GenerarLink</Text>
</TouchableOpacity>
</View>

{/* Resumen (portrait) */}
<View style={styles.repBox}>
<Text style={styles.repTitle}>Vía Somatosensorial</Text>
{activeTab === 'lista' ? (
  listaSomato.map((ln, i) => (
    <Text key={`${ln.k}-${i}`} style={styles.repTxt}>
      <Text style={{ fontWeight:'bold' }}>{ln.k} - </Text>{ln.v}
    </Text>
  ))
) : (
<View>
<Text style={[styles.reporteTexto, styles.justify]}>
  {textoVisual || textoReporte}
</Text>

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
)}
</View>


</>
)}
</ScrollView>

{mostrarGaleria && (
<GaleriaEmergente
visible={mostrarGaleria}
onClose={() => setMostrarGaleria(false)}
onImagenSeleccionada={(src) => {
setImgLista(src);
}}
/>
)}
{/* ====== LIENZO DE EXPORTACIÓN (oculto) ====== */}
<View
ref={exportRef}
style={{
position: 'absolute',
left: 0, top: 0,
zIndex: -1,
width: pageWpx,
height: pageHpx,
backgroundColor: exportBgColor,
pointerEvents: 'none',
padding: pad,
flexDirection: 'column',
}}
collapsable={false}
renderToHardwareTextureAndroid
needsOffscreenAlphaCompositing
>
{page1ShiftDownPx > 0 && (
<View style={{ height: page1ShiftDownPx }} />
)}
{/* ======= HEADER PDF ======= */}
{/* HEADER */}
<View style={{
height: headerTotalHpx,
backgroundColor:'transparent',
paddingHorizontal: px(pdf.header.padH),
paddingTop: headerPadTopPx,
paddingBottom: headerPadBottomPx,
justifyContent:'center',
}}>
<View style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between'}}>
<Text numberOfLines={1} style={{
color:'#000',
fontWeight: pdf.header.patient.weight,
fontSize: px(pdf.header.patient.nameSize)
}}>
<Text style={{ fontSize: px(pdf.header.patient.labelSize) }}> </Text>
{nombrePaciente || ''}
</Text>

{!!userData?.imageUrl && (
<View style={{
position:'relative',
width: px(pdf.header.logo.size + pdf.header.logo.fogPad*2),
height: px(pdf.header.logo.size + pdf.header.logo.fogPad*2),
justifyContent:'center',
alignItems:'center',
// transform: [{ translateX: px(8) }],   // ← añade esto (ajusta 8 a tu gusto)
marginLeft: px(8),
}}>
<View style={{
position:'absolute', width:'100%', height:'100%',
backgroundColor:'#fff', opacity: pdf.header.logo.fogOpacity, borderRadius: px(10)
}} />
<Image
source={{ uri: userData.imageUrl }}
onError={(e) => console.warn('No cargó logo', e.nativeEvent?.error)}
resizeMode="contain"
style={{ width: px(pdf.header.logo.size), height: px(pdf.header.logo.size), borderRadius: px(8), opacity: pdf.header.logo.opacity }}
/>

</View>
)}

</View>
</View>

{/* LÁMINA */}
<View style={{
width: '100%',
alignItems: 'center',
backgroundColor: 'transparent',
}}>
<CanvasView w={laminaWpx} h={laminaHpx} transparentBg={plantillaId === 'none' ? false : true} />
</View>

{/* DIAGNÓSTICO */}
<View style={{
  height: diagHpx,
  backgroundColor: 'transparent',
  justifyContent: 'flex-start',
  paddingHorizontal: px(pdf.diag.padH),
  paddingVertical: px(pdf.diag.padV),
  overflow: 'hidden',
  marginTop: diagOffsetUpPx ? -diagOffsetUpPx : 0,
}}>
<Text style={{ color:'#000', fontSize: px(pdf.diag.titleSize), fontWeight:'700', marginBottom: px(26) }}>
Diagnóstico
</Text>
<Text style={{
color:'#000',
fontSize: px(pdf.diag.textSize),
lineHeight: px(pdf.diag.lineHeight),
textAlign:'justify',
}}>
{textoVisual || textoReporte}
</Text>
</View>


{/* FOOTER */}
<View style={{
height: footerHpx,
paddingHorizontal: px(pdf.footer.padH),
paddingVertical:   px(pdf.footer.padV),
backgroundColor: 'transparent',
opacity: pdf.footer.opacity,
justifyContent:'center',
marginTop: px(pdf.footer.marginTop ?? 0),
}}>
<View style={{ flexDirection:'row', alignItems:'center', justifyContent:'center' }}>
{/* Usuario */}
<View style={{ flexDirection:'row', alignItems:'center', marginHorizontal: px(pdf.footer.itemGap) }}>
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
<View style={{ flexDirection:'row', alignItems:'center', marginHorizontal: px(pdf.footer.itemGap) }}>
<Svg width={px(pdf.footer.icon)} height={px(pdf.footer.icon)} viewBox="0 0 24 24" fill="#000">
<Path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 
                      2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
</Svg>
<Text numberOfLines={1} style={{ color:'#000', fontSize: px(pdf.footer.text), marginLeft: px(pdf.footer.iconTextGap) }}>
{userData?.email || ''}
</Text>
</View>

{/* Especialidad */}
<View style={{ flexDirection:'row', alignItems:'center', marginHorizontal: px(pdf.footer.itemGap) }}>
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
<View style={{ flexDirection:'row', alignItems:'center', marginHorizontal: px(pdf.footer.itemGap) }}>
<Svg width={px(pdf.footer.icon)} height={px(pdf.footer.icon)} viewBox="0 0 24 24" fill="#000">
<Path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 
                      0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 2l-6 3.99L6 4h12z"/>
</Svg>
<Text numberOfLines={1} style={{ color:'#000', fontSize: px(pdf.footer.text), marginLeft: px(pdf.footer.iconTextGap) }}>
{userData?.idprofessional || ''}
</Text>
</View>
</View>
</View>
</View>

{/* ====== HOJA 2 (oculta) ====== */}
<View
ref={exportRef2}
style={{
position:'absolute', left:0, top:0, zIndex:-1,
width: pageWpx, height: pageHpx, backgroundColor: exportBgColor,
pointerEvents:'none', padding: pad,
}}
collapsable={false}
renderToHardwareTextureAndroid
needsOffscreenAlphaCompositing
>
<View style={{ flex:1, flexDirection:'column' }}>
<View style={{ height: px(Math.max(0, (pdf.page2?.shiftDown ?? 0) - 5)) }} />
{/* Fila superior (LISTA / COMENTARIO) */}
<View style={{ flexDirection:'row', flex:1 }}>
<View style={{
        flex: 1,
        marginRight: px(6),
        paddingVertical: px(10),
        paddingLeft: px(50),
        paddingRight: px(14), 
        }}>
<Text style={{ fontWeight:'700', fontSize: px(12), marginBottom: px(6), color:'#000' }}></Text>
{listaSomato.length ? (
  listaSomato.map(({ k, v }) => (
    <Text
      key={k}
      style={{ fontSize: px(9.2), color:'#000', marginBottom: px(4), lineHeight: px(13) }}
    >
      <Text style={{ fontWeight:'700' }}>{k}</Text>
      {`: ${v}`}
    </Text>
  ))
) : (
  <Text style={{ fontSize: px(9.2), color:'#666' }}>
    Sin datos de lista.
  </Text>
)}

</View>

<View style={{ flex:1, marginLeft: px(2), paddingVertical: px(10), paddingRight: px(14), paddingLeft: px(8) }}>
<Text style={{ fontWeight:'700', fontSize: px(12), marginBottom: px(6), color:'#000' }} />
<Text style={{ fontSize: px(9.2), color:'#000', lineHeight: px(13), textAlign:'justify' }}>
{comentarioLista?.trim() ? limpiarTextoReporte(comentarioLista) : '—'}
</Text>
</View>
</View>

{/* Fila inferior: IMAGEN COMPLETA (anclada arriba) */}
<View style={{
 flex: 1.3,
  padding: px(40),
  alignItems: 'stretch',           
  marginTop: px(30),            
  justifyContent: 'flex-start',   
}}>

{imgListaSrc ? (
<Image
source={imgListaSrc as ImageSourcePropType}
resizeMode="contain"
style={{
width: '100%',
height: undefined,         // 👈 deja que calcule el alto
aspectRatio: imgListaAR || 16/9,  // 👈 alto natural; fallback
maxHeight: '100%',         // 👈 no se salga del bloque
alignSelf: 'stretch',
}}
/>
) : (
<Text style={{ fontSize: px(10), color: '#666' }}></Text>
)}
</View>
</View>
</View>

</View>

{/* Overlay de carga durante export */}
{exporting && (
<View style={styles.loadingOverlay}>
    <Circle size={40} color="#ff9100ff" />
<AnimatedLetters
key={rerenderKey}
value="Exportando PDF"
letterStyle={styles.loadingText}
animationDirection="bottom-to-top"
isSameAnimationDelay
animateOnLoad
/>


</View>
)}
{/* Modal de éxito - Ahora como componente */}
<ExportSuccessModal
  exportSuccess={exportSuccess}
  onClose={() => setExportSuccess(null)}
/>

<TemplatePickerModal
visible={templatePickerVisible}
onClose={handleTemplatePickerClose}
onSelect={handleTemplatePicked}
/>
{/* Modal de edición de diagnóstico */}
<EditTextModal
  visible={showEditModal}
  title="Editar Diagnóstico"
  initialText={textoEditadoManualmente ? textoVisual : textoReporte}
  onSave={(newText) => {
    // Actualizar el texto completo
    setTextoVisual(newText);
    setTextoEditadoManualmente(true);
    setShowEditModal(false);
  }}
  onCancel={() => setShowEditModal(false)}
/>

      {/* Modal de comentario */}
      <ComentarioModal
        visible={modalComentarioVisible}
        initialComentario={comentarioLista}
        onSave={(newComentario) => {
          setComentarioLista(newComentario);
          setModalComentarioVisible(false);
        }}
        onCancel={() => setModalComentarioVisible(false)}
      />
</ReportContext.Provider>
);
}

/* Estilos */
const styles = StyleSheet.create({
container:{flex:1,backgroundColor:'#000'},
justify: { textAlign: 'justify' },
repBox: {
backgroundColor: '#111', borderRadius: 10, padding: 15, borderWidth: 1,
borderColor: '#333', marginBottom: 10
},
repBoxLandscape: {
alignSelf: 'stretch',
width: '100%',
},
repTitle: {
color: 'orange', fontSize: 18, fontWeight: 'bold', marginBottom: 8,
textAlign: 'center'
},
repTxt: {
color: '#fff', fontSize: 14, lineHeight: 20,
flexShrink: 1,
},
/* Top bar: solo input (como Auditiva) */
topBar:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:10},
topBarInputWrap:{flex:1},
inputPacienteTop:{
paddingVertical:8, paddingHorizontal:12, backgroundColor:'#222', borderRadius:8,
color:'#fff', borderWidth:1, borderColor:'#333', fontSize:16,
},

scrollContent:{padding:10, flexGrow:1},

imageBox:{width:'100%',backgroundColor:'#222',borderRadius:20,overflow:'hidden',marginBottom:10,position:'relative'},
layer:{position:'absolute',top:0,left:0,width:'100%',height:'100%'},
pacienteBadge:{
position:'absolute', top:8, left:8, zIndex:3,
color:'#fff', backgroundColor:'rgba(0,0,0,0.6)',
paddingHorizontal:6, paddingVertical:2, borderRadius:4,
fontSize:12, fontWeight:'600'
},

modeSelector:{flexDirection:'row',justifyContent:'center',marginBottom:10, flexWrap:'wrap'},
modeBtn:{paddingVertical:8,paddingHorizontal:18,backgroundColor:'#222',borderRadius:8,marginHorizontal:6, marginBottom:6},
modeBtnActive:{backgroundColor:'#ff4500'},
modeTxt:{color:'#fff',fontSize:14},

reporteContainer:{backgroundColor:'#111',borderRadius:10,padding:15,borderWidth:1,borderColor:'#333',marginBottom:10},
reporteTitle:{color:'orange',fontSize:18,fontWeight:'bold',marginBottom:8, textAlign:'center'},
reporteTexto:{color:'#fff',fontSize:14,lineHeight:20, flexShrink:1},

stepCard:{backgroundColor:'#000',borderWidth:1,borderColor:'#fff',borderRadius:12,padding:12,marginBottom: 16, },
stepTitle:{color:'#fff',fontSize:18,fontWeight:'bold',textAlign:'center',marginBottom:10},
conclusionBtn:{backgroundColor:'#111',borderRadius:30,borderWidth:1,borderColor:'#444',paddingVertical:12,marginBottom:8,paddingHorizontal:8},
conclusionBtnText:{color:'#fff',textAlign:'center',fontSize:14},
conclusionBtnSelected: { backgroundColor: '#333' },

navRow:{flexDirection:'row',marginBottom:10,justifyContent:'center'},
navBtn:{backgroundColor:'#000',borderRadius:10,padding:6,marginHorizontal:6,borderWidth:1,borderColor:'#fff'},
navTxt:{color:'#fff',fontSize:18},

accordionHeader:{backgroundColor:'#111',borderRadius:8,paddingVertical:10,paddingHorizontal:12,borderWidth:1,borderColor:'#444'},
accordionHeaderText:{color:'#fff',fontSize:16,fontWeight:'bold'},
accordionContent:{paddingLeft:12,marginTop:4},

/* Figuras */
figBlock:{marginTop:10,alignItems:'center'},
tituloFiguras:{ flexDirection:'row', alignItems:'center', justifyContent:'center', marginBottom:10 },
imagenCirculo:{ width:60, height:60, borderRadius:40, borderWidth:2, borderColor:'gray' },
imagenCuadro:{ width:60, height:60, borderWidth:2, borderColor:'gray', marginLeft:20 },

// ====== Layout export estilo Auditiva ======
exportHeader:{ width:'100%', alignItems:'center', marginBottom:8 },
exportHeader_ls:{ alignItems:'flex-start', marginBottom:12 },
toolbarRow:{ flexDirection:'row', justifyContent:'center', alignItems:'center', marginBottom:0 },
toolbarIcon:{ marginHorizontal:8 },

iconCircle:{ width:40, height:40, borderRadius:46, borderWidth:1.5, borderColor:'#ff4500', alignItems:'center', justifyContent:'center' },
iconCircle_ls:{ width:44, height:44, borderRadius:18 },
menuItemIcon:{ width:30, height:30, resizeMode:'contain', tintColor:'#fff' },
menuItemIcon_ls:{ width:36, height:36 },

imagenCirculo_ls:{ width:60, height:60, borderRadius:40 },
imagenCuadro_ls:{ width:60, height:60, marginLeft:16 },

rightHint:{ color:'#777', fontSize:12, textAlign:'center', paddingVertical:8 },

// ====== Landscape: 3 columnas 30/40/30 ======
landRow:{ width:'100%', flexDirection:'row', alignItems:'stretch' },
landLeft:{ flex:3, paddingRight:0, minHeight:0, overflow:'hidden', gap:40 },
landCenter:{ flex:4, paddingHorizontal:6, minHeight:0, overflow:'hidden', justifyContent:'flex-start' },
landRight:{ flex:3, paddingLeft:0, minHeight:0, overflow:'hidden' },
landCol_ls:{ alignSelf:'stretch' },

// ====== Export (blanco/negro) ======
exportReportBoxWhite:{ backgroundColor:'#fff', borderTopWidth:1, borderTopColor:'#ddd', paddingHorizontal:16, paddingVertical:12 },
exportReportTitleBlack:{ color:'#000', fontSize:14, fontWeight:'bold', marginBottom:6 },
exportReportTextBlack:{ color:'#000', fontSize:13, lineHeight:19 },

/* Loading overlay */
loadingOverlay:{
...StyleSheet.absoluteFillObject,
backgroundColor:'rgba(0,0,0,0.5)',
justifyContent:'center',
alignItems:'center',
zIndex:9999,
},
loadingText:{ marginTop:12, fontSize:16, color:'#fff', fontWeight:'600' },

/* Espacio reservado izquierda */
leftBottomSpace:{ padding:10, borderTopWidth:1, borderTopColor:'#333', minHeight:60, justifyContent:'center' },
exportTwoCols:{flexDirection:'row',width:'100%',marginTop:30, marginBottom:30,justifyContent:'center'},
exportLeft:{flex:1,paddingRight:12,borderRightWidth:1,borderRightColor:'#444'},
exportRight:{flex:1,paddingLeft:12,minHeight:120,justifyContent:'flex-start'},

exportTwoCols_ls: {
gap: 12,
},
exportLeft_ls: {
flex: 2,
paddingRight: 10,
borderRightWidth: 1,
borderRightColor: '#333',
},
exportRight_ls: {
flex: 1,
paddingLeft: 10,
},


placeholderBox: {
backgroundColor:'#111', borderRadius:10, borderWidth:1, borderColor:'#333',
padding:12, marginTop:6, alignSelf:'stretch',
},
placeholderTitle: { color:'#fff', fontSize:16, fontWeight:'700', textAlign:'center', marginBottom:6 },
placeholderText: { color:'#bbb', fontSize:12, textAlign:'center' },

BotonReporte: {
   width: 120,
    height: 80, borderRadius: 12, overflow: 'hidden', borderWidth: 1,
borderColor: '#444', backgroundColor: '#222', alignSelf: 'center', marginBottom: 12,
},
backgroundBoton: { flex:1, alignItems:'center', justifyContent:'center' },
imagenFondoBoton: { resizeMode:'cover', opacity:0.9 },
inputReporte: {
alignSelf:'stretch', backgroundColor:'#222', borderWidth:1, borderColor:'#444',
borderRadius:8, color:'#fff', paddingHorizontal:12, paddingVertical:10,
},

skipBtn: {
  marginTop: 10,
  alignSelf: 'center',
  backgroundColor: '#ff4500',
  paddingVertical: 9,
  paddingHorizontal: 20,
  borderRadius: 8,
},
skipTxt: {
  color: '#fff',
  fontWeight: '400',
  fontSize: 14,
},
nextBtn: {
  marginTop: 10,
  alignSelf: 'center',
  backgroundColor: '#ff4500',
  paddingVertical: 9,
  paddingHorizontal: 20,
  borderRadius: 8,
},
nextTxt: {
  color: '#fff',
  fontWeight: '400',
  fontSize: 14,
},
btnComentario: {
  backgroundColor: '#ff4500',
  paddingVertical: 10,
  paddingHorizontal: 20,
  borderRadius: 10,
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 8,
  alignSelf: 'stretch',
},
btnComentarioText: {
  color: '#fff',
  fontSize: 14,
  fontWeight: 'bold',
},

plantillaRow: {
  flexDirection:'row',
  justifyContent:'center',
  flexWrap:'wrap',
  gap: 8,
  marginBottom: 6,
},
plantillaBtn: {
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 8,
  backgroundColor: '#222',
  borderWidth: 1,
  borderColor: '#444',
},
plantillaBtnActive: {
  backgroundColor: '#B54B00', // tu naranja MEDXpro
  borderColor: '#B54B00',
},
plantillaTxt: {
  color:'#fff',
  fontSize: 12,
  fontWeight: '700',
},

});
