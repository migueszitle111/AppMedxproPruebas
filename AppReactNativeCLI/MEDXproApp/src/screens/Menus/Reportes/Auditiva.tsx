// src/screens/reporte/ReporteViasAuditivaScreen.tsx
// Flujo VÍA AUDITIVA (A, B, C1, CB, C2, D1, D2, E, E2, F, G, H, I, J, J2)

import React, {
  useState,
  useContext,
  createContext,
  useMemo,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ImageBackground,
  StyleSheet,
  Alert,
  PermissionsAndroid,
  Platform,
  Permission,
  useWindowDimensions,
  Keyboard,
} from 'react-native';

import type { ImageSourcePropType } from 'react-native';
import Header from '../../../components/Header';
import FancyInput from '../../../components/FancyInput';
import { Circle } from 'react-native-animated-spinkit';
import AnimatedLetterText from 'react-native-animated-letter-text';

// Link uploader + share link services + supabase (igual que Visual)
import LinkUploader, { type LinkUploaderProps } from '../../../components/LinkUploader';
import TemplatePickerModal, { type PlantillaId } from '../../../components/TemplatePickerModal';
import { initShareLink, completeShareLink } from '../../../services/shareLinks';
import { supabase } from '../../../lib/supabase';

// util arraybuffer/base64 y RN blob
import { decode as b64decode, encode as b64encode } from 'base64-arraybuffer';
import { InteractionManager } from 'react-native';


/* figuras arrastrables */
import FiguraMovible from '../../../components/FiguraMovibleVias';

/* cámara/galería */
import { launchImageLibrary } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import uuid from 'react-native-uuid';
import ComentarioModal from '../../../components/ComentarioModal';

/* exportación PDF / JPEG */
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

/* toolbar icons (como Visual) */
import I_Regresar from '../../../assets/03_Íconos/03_02_PNG/I_Out2.png';
import I_Refrescar from '../../../assets/03_Íconos/03_02_PNG/I_Repeat2.png';
import I_Imprimir from '../../../assets/03_Íconos/03_02_PNG/I_Document.png';

/* Galería emergente (igual que Visual) */
import GaleriaEmergente from './GaleriaTb';

/* Logo/usuario (igual que Visual) */
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../../constants/config';
/* PDF footer icons (igual que Visual) */
import Svg, { Path } from 'react-native-svg';
import { escanearImagen } from '../../../utils/EscanearImagen';

// PLANTILLAS_PDF ahora se importa desde pdfLoadingTemplate (servicio centralizado)

/* ───────── Imagen base ───────── */
const IMG_BASE = require('../../../assets/CuerpoPng/AuditivaIMG/AU_BASE_BLANCO.png');
const IMG_BASE_TRANSPARENT = require('../../../assets/CuerpoPng/AuditivaIMG/AU_BASE_TR.png');

const BASE_SRC = Image.resolveAssetSource(IMG_BASE);
const BASE_AR = BASE_SRC.width / BASE_SRC.height;

/* ───────── Overlays (OBJETO) ───────── */
const AUD_OV: Record<string, any | any[]> = {
  indemne: require('../../../assets/CuerpoPng/AuditivaIMG/AG.png'),
  alterada: require('../../../assets/CuerpoPng/AuditivaIMG/AG.png'),

  /* BASES BILATERALES (para alterada) - se colocan al inicio */
  base_bilateral_izquierdo: require('../../../assets/CuerpoPng/AuditivaIMG/AI.png'),
  base_bilateral_derecho: require('../../../assets/CuerpoPng/AuditivaIMG/AD.png'),

  // Lado INDEMNE
  derechoindemne: require('../../../assets/CuerpoPng/AuditivaIMG/AD.png'),
  izquierdoindemne: require('../../../assets/CuerpoPng/AuditivaIMG/AI.png'),
  bilateralindemne: [
    require('../../../assets/CuerpoPng/AuditivaIMG/AI.png'),
    require('../../../assets/CuerpoPng/AuditivaIMG/AD.png'),
  ],
};

/* Variantes por severidad (placeholders → base) */
[
  'coliculo_inferior',
  'lemnisco_lateral',
  'completo_olivar_trapezoide',
  'nucleo_coclear',
  'nervio_auditivo',
].forEach((nivel) => {
  (['derecho', 'izquierdo'] as const).forEach((lado) => {
    const baseKey = `${lado}${nivel}`;
    const src = AUD_OV[baseKey];
    if (src) {
      (['leve', 'moderado', 'severo'] as const).forEach((sev) => {
        AUD_OV[`${baseKey}Alterada_${sev}`] = src;
      });
    }
  });

  const izq = AUD_OV[`izquierdo${nivel}`];
  const der = AUD_OV[`derecho${nivel}`];
  if (izq && der) {
    (['leve', 'moderado', 'severo'] as const).forEach((sev) => {
      AUD_OV[`bilateral${nivel}Alterada_${sev}`] = Array.isArray(izq) || Array.isArray(der)
        ? [...(Array.isArray(izq) ? izq : [izq]), ...(Array.isArray(der) ? der : [der])]
        : [izq, der];
    });
  }
});

/* RUTAS reales por severidad */

// NIVEL V (colículo inferior)
AUD_OV.derechocoliculo_inferiorAlterada_leve = require('../../../assets/Viasneurologicas/Auditivo/ViaAfectada/Naranja/BP_Auditivo_Naranja_5.png');
AUD_OV.derechocoliculo_inferiorAlterada_moderado = require('../../../assets/Viasneurologicas/Auditivo/ViaAfectada/Rojo/AU_5.png');
AUD_OV.derechocoliculo_inferiorAlterada_severo = require('../../../assets/Viasneurologicas/Auditivo/ViaAfectada/Marron/BP_Auditivo_Marron_5.png');
AUD_OV.izquierdocoliculo_inferiorAlterada_leve = require('../../../assets/Viasneurologicas/Auditivo/ViaAfectada/Naranja/ViaDerecha/BP_Auditivo_Naranja_5-D.png');
AUD_OV.izquierdocoliculo_inferiorAlterada_moderado = require('../../../assets/Viasneurologicas/Auditivo/ViaAfectada/Rojo/ViaDerecha/AU_5-D.png');
AUD_OV.izquierdocoliculo_inferiorAlterada_severo = require('../../../assets/Viasneurologicas/Auditivo/ViaAfectada/Marron/ViaDerecha/BP_Auditivo_Marron_5-D.png');
AUD_OV.bilateralcoliculo_inferiorAlterada_leve = [AUD_OV.izquierdocoliculo_inferiorAlterada_leve, AUD_OV.derechocoliculo_inferiorAlterada_leve];
AUD_OV.bilateralcoliculo_inferiorAlterada_moderado = [AUD_OV.izquierdocoliculo_inferiorAlterada_moderado, AUD_OV.derechocoliculo_inferiorAlterada_moderado];
AUD_OV.bilateralcoliculo_inferiorAlterada_severo = [AUD_OV.izquierdocoliculo_inferiorAlterada_severo, AUD_OV.derechocoliculo_inferiorAlterada_severo];

// NIVEL IV (lemnisco lateral)
AUD_OV.derecholemnisco_lateralAlterada_leve = require('../../../assets/Viasneurologicas/Auditivo/ViaAfectada/Naranja/BP_Auditivo_Naranja_4.png');
AUD_OV.derecholemnisco_lateralAlterada_moderado = require('../../../assets/Viasneurologicas/Auditivo/ViaAfectada/Rojo/AU_4.png');
AUD_OV.derecholemnisco_lateralAlterada_severo = require('../../../assets/Viasneurologicas/Auditivo/ViaAfectada/Marron/BP_Auditivo_Marron_4.png');
AUD_OV.izquierdolemnisco_lateralAlterada_leve = require('../../../assets/Viasneurologicas/Auditivo/ViaAfectada/Naranja/ViaDerecha/BP_Auditivo_Naranja_4-D.png');
AUD_OV.izquierdolemnisco_lateralAlterada_moderado = require('../../../assets/Viasneurologicas/Auditivo/ViaAfectada/Rojo/ViaDerecha/AU_4-D.png');
AUD_OV.izquierdolemnisco_lateralAlterada_severo = require('../../../assets/Viasneurologicas/Auditivo/ViaAfectada/Marron/ViaDerecha/BP_Auditivo_Marron_4-D.png');
AUD_OV.bilaterallemnisco_lateralAlterada_leve = [AUD_OV.izquierdolemnisco_lateralAlterada_leve, AUD_OV.derecholemnisco_lateralAlterada_leve];
AUD_OV.bilaterallemnisco_lateralAlterada_moderado = [AUD_OV.izquierdolemnisco_lateralAlterada_moderado, AUD_OV.derecholemnisco_lateralAlterada_moderado];
AUD_OV.bilaterallemnisco_lateralAlterada_severo = [AUD_OV.izquierdolemnisco_lateralAlterada_severo, AUD_OV.derecholemnisco_lateralAlterada_severo];

// NIVEL III (complejo olivar sup. + cuerpo trapezoide)
AUD_OV.derechocompleto_olivar_trapezoideAlterada_leve = require('../../../assets/Viasneurologicas/Auditivo/ViaAfectada/Naranja/BP_Auditivo_Naranja_3.png');
AUD_OV.derechocompleto_olivar_trapezoideAlterada_moderado = require('../../../assets/Viasneurologicas/Auditivo/ViaAfectada/Rojo/AU_3.png');
AUD_OV.derechocompleto_olivar_trapezoideAlterada_severo = require('../../../assets/Viasneurologicas/Auditivo/ViaAfectada/Marron/BP_Auditivo_Marron_3.png');
AUD_OV.izquierdocompleto_olivar_trapezoideAlterada_leve = require('../../../assets/Viasneurologicas/Auditivo/ViaAfectada/Naranja/ViaDerecha/BP_Auditivo_Naranja_3-D.png');
AUD_OV.izquierdocompleto_olivar_trapezoideAlterada_moderado = require('../../../assets/Viasneurologicas/Auditivo/ViaAfectada/Rojo/ViaDerecha/AU_3-D.png');
AUD_OV.izquierdocompleto_olivar_trapezoideAlterada_severo = require('../../../assets/Viasneurologicas/Auditivo/ViaAfectada/Marron/ViaDerecha/BP_Auditivo_Marron_3-D.png');
AUD_OV.bilateralcompleto_olivar_trapezoideAlterada_leve = [AUD_OV.izquierdocompleto_olivar_trapezoideAlterada_leve, AUD_OV.derechocompleto_olivar_trapezoideAlterada_leve];
AUD_OV.bilateralcompleto_olivar_trapezoideAlterada_moderado = [AUD_OV.izquierdocompleto_olivar_trapezoideAlterada_moderado, AUD_OV.derechocompleto_olivar_trapezoideAlterada_moderado];
AUD_OV.bilateralcompleto_olivar_trapezoideAlterada_severo = [AUD_OV.izquierdocompleto_olivar_trapezoideAlterada_severo, AUD_OV.derechocompleto_olivar_trapezoideAlterada_severo];

// NIVEL II (núcleo coclear)
AUD_OV.derechonucleo_coclearAlterada_leve = require('../../../assets/Viasneurologicas/Auditivo/ViaAfectada/Naranja/BP_Auditivo_Naranja_2.png');
AUD_OV.derechonucleo_coclearAlterada_moderado = require('../../../assets/Viasneurologicas/Auditivo/ViaAfectada/Rojo/AU_2.png');
AUD_OV.derechonucleo_coclearAlterada_severo = require('../../../assets/Viasneurologicas/Auditivo/ViaAfectada/Marron/BP_Auditivo_Marron_2.png');
AUD_OV.izquierdonucleo_coclearAlterada_leve = require('../../../assets/Viasneurologicas/Auditivo/ViaAfectada/Naranja/ViaDerecha/BP_Auditivo_Naranja_2-D.png');
AUD_OV.izquierdonucleo_coclearAlterada_moderado = require('../../../assets/Viasneurologicas/Auditivo/ViaAfectada/Rojo/ViaDerecha/AU_2-D.png');
AUD_OV.izquierdonucleo_coclearAlterada_severo = require('../../../assets/Viasneurologicas/Auditivo/ViaAfectada/Marron/ViaDerecha/BP_Auditivo_Marron_2-D.png');
AUD_OV.bilateralnucleo_coclearAlterada_leve = [AUD_OV.izquierdonucleo_coclearAlterada_leve, AUD_OV.derechonucleo_coclearAlterada_leve];
AUD_OV.bilateralnucleo_coclearAlterada_moderado = [AUD_OV.izquierdonucleo_coclearAlterada_moderado, AUD_OV.derechonucleo_coclearAlterada_moderado];
AUD_OV.bilateralnucleo_coclearAlterada_severo = [AUD_OV.izquierdonucleo_coclearAlterada_severo, AUD_OV.derechonucleo_coclearAlterada_severo];

// NIVEL I (nervio auditivo)
AUD_OV.derechonervio_auditivoAlterada_leve = require('../../../assets/Viasneurologicas/Auditivo/ViaAfectada/Naranja/BP_Auditivo_Naranja_1.png');
AUD_OV.derechonervio_auditivoAlterada_moderado = require('../../../assets/Viasneurologicas/Auditivo/ViaAfectada/Rojo/AU_1.png');
AUD_OV.derechonervio_auditivoAlterada_severo = require('../../../assets/Viasneurologicas/Auditivo/ViaAfectada/Marron/BP_Auditivo_Marron_1.png');
AUD_OV.izquierdonervio_auditivoAlterada_leve = require('../../../assets/Viasneurologicas/Auditivo/ViaAfectada/Naranja/ViaDerecha/BP_Auditivo_Naranja_1-D.png');
AUD_OV.izquierdonervio_auditivoAlterada_moderado = require('../../../assets/Viasneurologicas/Auditivo/ViaAfectada/Rojo/ViaDerecha/AU_1-D.png');
AUD_OV.izquierdonervio_auditivoAlterada_severo = require('../../../assets/Viasneurologicas/Auditivo/ViaAfectada/Marron/ViaDerecha/BP_Auditivo_Marron_1-D.png');
AUD_OV.bilateralnervio_auditivoAlterada_leve = [AUD_OV.izquierdonervio_auditivoAlterada_leve, AUD_OV.derechonervio_auditivoAlterada_leve];
AUD_OV.bilateralnervio_auditivoAlterada_moderado = [AUD_OV.izquierdonervio_auditivoAlterada_moderado, AUD_OV.derechonervio_auditivoAlterada_moderado];
AUD_OV.bilateralnervio_auditivoAlterada_severo = [AUD_OV.izquierdonervio_auditivoAlterada_severo, AUD_OV.derechonervio_auditivoAlterada_severo];

/* ───────── Contexto ───────── */
interface ConclusionItem { value: string; title: string }
interface ReportCtx {
  conclusions: ConclusionItem[];
  addConclusion: (c: ConclusionItem) => void;
  removeConclusion: (value: string) => void;
}
const ReportContext = createContext<ReportCtx>({
  conclusions: [], addConclusion: () => { }, removeConclusion: () => { },
});

/* ───────── Pasos / tipos ───────── */
const steps = ['A', 'B', 'C1', 'CB', 'C2', 'D1', 'D2', 'E', 'E2', 'F', 'G', 'H', 'I', 'J', 'J2'] as const;
type StepId = typeof steps[number];
type Side = 'izquierdo' | 'derecho' | 'bilateral' | '';
type RootFlow = 'indemne' | 'alterada' | null;
type Severity = 'leve' | 'moderado' | 'severo' | null;
type Tab = 'reporte' | 'lista' |'GenerarLink';


/* ====== PDF config (idéntico a Visual) ====== */
type PdfConfig = {
  paper: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  renderScale: number;
  pageMargin: number;
  header: {
    height: number; padH: number; padTop: number; padBottom: number;
    afterGap?: number; offsetDown?: number;
    patient: { labelSize: number; nameSize: number; weight: '400'|'600'|'700' };
    logo: { size: number; opacity: number; fogOpacity: number; fogPad: number };
  };
  lamina: { widthFrac: number; minHeight: number };
  diag: {
    minHeight: number; padH: number; padV: number;
    titleSize: number; textSize: number; lineHeight: number;
    pullUp: number; borderW: number; borderColor: string; radius: number;
    topGap?: number; offsetUp?: number;
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
    beforeGap: 20,
    marginTop: 20,
  },
  page1: {
    shiftDown: 10,
  },
  page2: {
    shiftDown: 66,
  },


  debug: false,
};

/* ---------- Helpers de texto ---------- */
const sanitizeTitle = (t: string) =>
  t
    .replace(/^vía auditiva con\s*/i, '')
    .replace(/^para lado\s*/i, '')
    .replace(/^de forma\s*/i, '')
    .replace(/^a través de\s*/i, '')
    .replace(/^al\s+/i, '')
    .replace(/^y\s+/i, '')
    .replace(/[.,]\s*$/, '')
    .trim();

// Normaliza y corrige el texto para Reporte/GenerarLink y PDF
const limpiarTextoReporte = (s: string): string => {
  if (!s) return '';
  let t = s;

  // 1) Normaliza espacios SIN tocar saltos de línea
  t = t.replace(/[ \t]+/g, ' ').trim();
  // Compacta espacios alrededor de \n
  t = t.replace(/[ \t]*\n[ \t]*/g, '\n');

  // 2) Puntuación pegada y un espacio después (no cruces líneas)
  t = t.replace(/[ \t]*([,;:.])[ \t]*/g, '$1 ');
  t = t.replace(/[ \t]+([,.:;])/g, ' $1');

  // 3) Minúsculas generales (lo subiremos donde toca)
  t = t.toLowerCase();

  // 4) Capitaliza inicio, después de . ! ? o \n
  t = t.replace(/(^|[.!?]\s+|\n)([a-záéíóúñ])/g, (_, p1, p2) => p1 + p2.toUpperCase());

  // 5) Limpiezas finales
  t = t.replace(/\s+([,.])$/g, '$1');      // sin espacio antes de coma/punto final
  t = t.replace(/\s+$/,'');                // sin espacios al final
  t = t.replace(/([.!?])\s*([.!?])+$/,'$1');

  // 6) Asegura punto final del TODO si no lo tiene
  if (!/[.!?]$/.test(t)) t += '.';

  return t;
};


/* ====== Modo lista (secciones) ====== */
const SECTION_ORDER = [
  'Vía auditiva', 'Fisiopatología', 'Grado',
  'Lado', 'Región', 'Nivel', 'Umbral auditivo', 'Tipo',
] as const;
type Section = typeof SECTION_ORDER[number];

const VALUE_LABELS_AUD: Record<string, string> = {
  indemne: 'Integridad funcional', alterada: 'Defecto',
  retardo_en_la_conduccion: 'Retardo en la conducción',
  bloqueo_en_la_conduccion: 'Bloqueo en la conducción',
  deficit_neuronal: 'Déficit axonal', sin_respuesta: 'Sin respuesta evocable',
  perdida_axonal_secundaria: 'Pérdida axonal secundaria',
  retardo_secundario_en_la_conduccion: 'Retardo secundario en la conducción',
  leve: 'Leve', moderado: 'Moderado', severo: 'Severo',
  izquierdo: 'Izquierdo', derecho: 'Derecho', bilateral: 'Bilateral',
  rostral: 'Rostral (III-V)', caudal: 'Caudal (I-III)', tallo_cerebral: 'Total (I-V)',
  normoacusia: 'Normoacusia',
  hipoacusia_leve: 'Hipoacusia leve',
  hipoacusia_moderada: 'Hipoacusia moderada',
  hipoacusia_severa: 'Hipoacusia severa',
  hipocusia_profunda: 'Hipoacusia profunda',
  neurosensorial: 'Neurosensorial', conductiva: 'Conductiva',
};

const getSection = (c: ConclusionItem): Section | null => {
  const v = c.value.toLowerCase(), t = c.title.toLowerCase();

  if (v === 'indemne' || v === 'alterada' || t.includes('vía auditiva')) return 'Vía auditiva';

  if (v.includes('retardo_en_la_conduccion') || v.includes('bloqueo_en_la_conduccion') ||
      v.includes('deficit_neuronal') || v.includes('sin_respuesta') ||
      t.startsWith('por retardo') || t.startsWith('por bloqueo') ||
      t.startsWith('axonal ') || t.startsWith('por ausencia'))
    return 'Fisiopatología';

  if (v === 'leve' || v === 'moderado' || v === 'severo') return 'Grado';

  if (v === 'izquierdo' || v === 'derecho' || v === 'bilateral' ||
      v.includes('izquierdoindemne') || v.includes('derechoindemne') || v.includes('bilateralindemne'))
    return 'Lado';

  if (v === 'rostral' || v === 'caudal' || v === 'tallo_cerebral') return 'Región';

  if (/nervio_auditivo|nucleo_coclear|completo_olivar_trapezoide|lemnisco_lateral|coliculo_inferior/.test(v) ||
      t.includes('topográficamente')) return 'Nivel';

  if (v === 'normoacusia' || v.startsWith('hipoacusia')) return 'Umbral auditivo';

  if (v === 'neurosensorial' || v === 'conductiva') return 'Tipo';

  return null;
};

/* ---------- UI helpers ---------- */
const ConclusionBtn: React.FC<{ value: string; title: string; label: string; onPress?: () => void }> =
  ({ value, title, label, onPress }) => {
    const { addConclusion } = useContext(ReportContext);
    return (
      <TouchableOpacity style={styles.conclusionBtn}
        onPress={() => { addConclusion({ value, title }); onPress?.(); }}>
        <Text style={styles.conclusionBtnText}>{label}</Text>
      </TouchableOpacity>
    );
  };

/* Nav con íconos (igual a Visual) */
const NavRow: React.FC<{ onBack: () => void; onReset?: () => void; onFwd?: () => void }> =
  ({ onBack, onReset, onFwd }) => (
    <View style={styles.navRow}>
      <TouchableOpacity style={[styles.iconCircle, styles.toolbarIcon]} onPress={onBack}>
        <Image source={I_Regresar} style={styles.menuItemIcon} />
      </TouchableOpacity>
      {onReset && (
        <TouchableOpacity style={[styles.iconCircle, styles.toolbarIcon]} onPress={onReset}>
          <Image source={I_Refrescar} style={styles.menuItemIcon} />
        </TouchableOpacity>
      )}
     
    </View>
  );

  const SkipButton: React.FC<{ onPress: () => void; label?: string }> = ({ onPress, label = 'Saltar  ➔' }) => (
    <TouchableOpacity style={styles.skipBtn} onPress={onPress}>
      <Text style={styles.skipTxt}>{label}</Text>
    </TouchableOpacity>
  );
  

/* ========= figuras ========= */
type FiguraLocal = {
  id: string;
  tipo: 'circle' | 'square';
  uri: string;
  posicion: { x: number; y: number };
};

/* ========= Panel izquierdo del paso final (idéntico al Visual) ========= */
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
  defaultTitle: string;
  defaultMessage: string;
  autoReportName?: string;
  onRequestTemplate?: () => Promise<PlantillaId | null>;
}> = ({ onGenerateLink, defaultTitle, defaultMessage, autoReportName, onRequestTemplate }) => (
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


/* ========= Final UI contenedor ========= */
type FinalExportUIAuditivaProps = {
  isLandscape?: boolean;
  manejarSeleccionImagen: (tipo: 'circle' | 'square') => void;
  onToolbarBack: () => void;
  onReset: () => void;
  onExport: () => void;
  exporting: boolean;
  activeTab: Tab;
  onOpenGallery: () => void;
  comentarioLista: string;
  setComentarioLista: (v: string) => void;
  onOpenComentarioModal: () => void;
  imgListaSrc: ImageSourcePropType | null;
  setImgListaSrc: (v: ImageSourcePropType | null) => void;
  onGenerateLink: LinkUploaderProps['onGenerateLink'];
  defaultTitle: string;
  defaultMessage: string;
  autoReportName?: string;
  onRequestTemplate?: () => Promise<PlantillaId | null>;
};

const FinalExportUIAuditiva: React.FC<FinalExportUIAuditivaProps> = React.memo(
  ({
    isLandscape = false,
    manejarSeleccionImagen,
    onToolbarBack,
    onReset,
    onExport,
    exporting,
    activeTab,
    onOpenGallery,
    comentarioLista,
    setComentarioLista,
    onOpenComentarioModal,
    imgListaSrc,
    setImgListaSrc,
    onGenerateLink,    // ✅ añadir
    defaultTitle,      // ✅ añadir
    defaultMessage,    // ✅ añadir
    autoReportName,    // ✅ añadir
    onRequestTemplate,
  }) => (
    <View style={styles.figBlock}>
      {/* HEADER / TOOLBAR */}
      <View style={[styles.exportHeader, isLandscape && styles.exportHeader_ls]}>
        <View style={styles.toolbarRow}>
          <TouchableOpacity onPress={onToolbarBack} style={[styles.iconCircle, styles.toolbarIcon, isLandscape && styles.iconCircle_ls]}>
            <Image source={I_Regresar} style={[styles.menuItemIcon, isLandscape && styles.menuItemIcon_ls]} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onReset} style={[styles.iconCircle, styles.toolbarIcon, isLandscape && styles.iconCircle_ls]}>
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

      {/* Columna izquierda (según tab) */}
      <View style={[styles.exportTwoCols, isLandscape && styles.exportTwoCols_ls]}>
        <View style={[styles.exportLeft, isLandscape && styles.exportLeft_ls]}>
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
            defaultTitle={defaultTitle}
            defaultMessage={defaultMessage}
            autoReportName={autoReportName}
            onRequestTemplate={onRequestTemplate}
          />
        )}
        </View>

        
      </View>
    </View>
  )
);

/* ===== Paso final envuelto ===== */
type StepFinalAuditivaProps = {
  isLandscape?: boolean;
  onBack: () => void;
  onToolbarBack: () => void;
  onReset: () => void;
  onExport: () => void;
  exporting: boolean;
  manejarSeleccionImagen: (tipo: 'circle' | 'square') => void;
  activeTab: Tab;
  onOpenGallery: () => void;
  comentarioLista: string;
  setComentarioLista: (v: string) => void;
  onOpenComentarioModal: () => void;
  imgListaSrc: ImageSourcePropType | null;
  setImgListaSrc: (v: ImageSourcePropType | null) => void;
   onGenerateLink: LinkUploaderProps['onGenerateLink'];
  defaultTitle: string;
  defaultMessage: string;
  autoReportName?: string;
  onRequestTemplate?: () => Promise<PlantillaId | null>;
};

const StepFinalAuditiva: React.FC<StepFinalAuditivaProps> = React.memo(
  ({
    isLandscape = false,
    onBack, onToolbarBack, onReset, onExport, exporting,
    manejarSeleccionImagen,
    activeTab, onOpenGallery, comentarioLista, setComentarioLista, onOpenComentarioModal, imgListaSrc, setImgListaSrc,
    onGenerateLink, defaultTitle, defaultMessage, autoReportName, onRequestTemplate,
  }) => (
    <View>
      <FinalExportUIAuditiva
        isLandscape={isLandscape}
        manejarSeleccionImagen={manejarSeleccionImagen}
        onToolbarBack={onToolbarBack}
        onReset={onReset}
        onExport={onExport}
        exporting={exporting}
        activeTab={activeTab}
        onOpenGallery={onOpenGallery}
        comentarioLista={comentarioLista}
        setComentarioLista={setComentarioLista}
        onOpenComentarioModal={onOpenComentarioModal}
        imgListaSrc={imgListaSrc}
        setImgListaSrc={setImgListaSrc}
        onGenerateLink={onGenerateLink}
        defaultTitle={defaultTitle}
        defaultMessage={defaultMessage}
        autoReportName={autoReportName}
        onRequestTemplate={onRequestTemplate}
      />
    </View>
  )
);

/* ===== Helpers varios ===== */
type UserData = {
  name: string;
  lastname: string;
  idprofessional: string;
  specialty: string;
  email: string;
  imageUrl: string;
};

const toImageSource = (src: string | ImageSourcePropType): ImageSourcePropType =>
  typeof src === 'string' ? { uri: src } : src;

/* ───────────────────── Componente principal ───────────────────── */
export default function ReporteViasAuditivaScreen() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  /* -------------------- Estados -------------------- */
  const [conclusions, setConclusions] = useState<ConclusionItem[]>([]);
  const [conclusionStepHist, setConclusionStepHist] = useState<string[][]>([[]]);

  const addConclusion = (c: ConclusionItem) => {
    setConclusions(prev => prev.some(x => x.value === c.value) ? prev : [...prev, c]);
    setConclusionStepHist(h => {
      const nh = [...h];
      const last = nh[nh.length - 1] ?? [];
      nh[nh.length - 1] = Array.from(new Set([...last, c.value]));
      return nh;
    });
  };
  const removeConclusion = (v: string) =>
    setConclusions(p => p.filter(x => x.value !== v));

  const [step, setStep] = useState<StepId>('A');
  const [history, setHist] = useState<StepId[]>(['A']);

  const [side, setSide] = useState<Side>('');
  const [rootFlow, setRootFlow] = useState<RootFlow>(null);
  const [severity, setSeverity] = useState<Severity>(null);

  const [activeTab, setActiveTab] = useState<Tab>('reporte');

  // Galería / comentario (como Visual)
  const [mostrarGaleria, setMostrarGaleria] = useState(false);
  const [imgListaSrc, setImgListaSrc] = useState<ImageSourcePropType | null>(null);
  const [comentarioLista, setComentarioLista] = useState('');
  const [modalComentarioVisible, setModalComentarioVisible] = useState(false);

  // Nombre paciente / figuras
  const [nombrePaciente, setNombrePaciente] = useState('');
  const [figuras, setFiguras] = useState<FiguraLocal[]>([]);
  const [limitesContenedor, setLimitesContenedor] = useState({ width: 0, height: 0 });
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);

  // Export
  const exportRef = useRef<View>(null);
  const exportRef2 = useRef<View>(null);
  const [exporting, setExporting] = useState(false);
  const [exportKind, setExportKind] = useState<'pdf'|'jpeg'|null>(null);
  const [imgListaAR, setImgListaAR] = useState<number | null>(null);
  const [plantillaId, setPlantillaId] = useState<PlantillaId>('none');
  const exportBgColor = plantillaId === 'none' ? '#fff' : 'transparent';
  const [templatePickerVisible, setTemplatePickerVisible] = useState(false);
  const [templatePickerIntent, setTemplatePickerIntent] = useState<'export' | 'link' | null>(null);
  const templatePickerPromiseRef = useRef<((id: PlantillaId | null) => void) | null>(null);
  const [pendingTemplateExport, setPendingTemplateExport] = useState<PlantillaId | null>(null);
  const exportarPdfRef = useRef<() => Promise<void>>(async () => {});
  const [exportSuccess, setExportSuccess] = useState<{ filename: string; path: string } | null>(null);
  // plantillaDef y loadPlantillaPdf eliminadas - ahora usa servicio centralizado

  // === Nombres bonitos y consistentes ===
const STUDY_KEY = 'Auditiva';               // <- cambia esto en cada pantalla
const STUDY_PREFIX = `mEDXpro${STUDY_KEY}`;        // mEDXproAuditiva

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

/** Base: mEDXproAuditiva_<Paciente o N> */
const buildBaseName = (paciente: string | undefined | null): string => {
  const token = toSafeToken(paciente || '');
  const n = token || String(unnamedBatchOrdinalRef.current);
  return `${STUDY_PREFIX}_${n}`;
};

  
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
  
  const BUCKET = 'report-packages';

const buildReportPdfArrayBuffer = async ({
  studyType,
  doctorName,
  templateId,
}: {
  studyType: string;
  doctorName?: string;
  templateId?: PlantillaId | null;
}): Promise<ArrayBuffer> => {
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

// Genera el PDF actual a archivo temporal y devuelve info básica para subirlo
const buildPdfTempFile = async (filename?: string) => {
  const studyType  = 'Vías Auditivas';
  const doctorName =
    [userData?.name, userData?.lastname].filter(Boolean).join(' ') || undefined;

  // Usa tu generador de ArrayBuffer ya existente
  const ab = await buildReportPdfArrayBuffer({ studyType, doctorName });

  // A base64 para grabarlo con BlobUtil
  const base64 = b64encode(ab);

  const RNBU: any = ReactNativeBlobUtil;
  const safeName =
    sanitizeFilename(
      filename || `ReporteViasAuditiva_${safe(nombrePaciente || 'Paciente')}.pdf`
    );

  const path = `${RNBU.fs.dirs.CacheDir}/${safeName}`;
  await RNBU.fs.writeFile(path, base64, 'base64');

  return {
    name: safeName,
    type: 'application/pdf',
    uri: `file://${path}`,
    path,
  };
};

const generateShareLink: LinkUploaderProps['onGenerateLink'] = async ({
  files,
  title,
  message,
  expiry,
  onFileProgress,
  templateId,
}) => {
  const studyType  = 'Vías Auditivas';

  // Si ya tienes userData en Visual, úsalo; si no, deja undefined
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
        (textoReporte || '').trim(),  // 👈 el enunciado/diagnóstico que ya generas
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

  // 3) Subir adjuntos seleccionados por el usuario
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

  // 4) Completar link y devolver URL
  const done = await completeShareLink({ linkId, files: uploadedForDB });
  if (!done.ok) throw new Error(done.error);
  return done.url;
};

// ── nom

// Normalizar file:// / content://
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

const readAsArrayBuffer = async (rawUri: string) => {
  const path = await uriToReadablePath(rawUri);
  const base64 = await ReactNativeBlobUtil.fs.readFile(path, 'base64');
  return b64decode(base64);
};

const safe = (s: string) =>
  s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim().replace(/\s+/g, '_');

const sanitizeFilename = (name: string) =>
  name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w.\- ]+/g, '')
    .replace(/\s+/g, '_');

// Reemplaza la versión actual por esta
const reportFileName = () => {
  const base = buildBaseName(nombrePaciente); // mEDXproAuditiva_<Paciente o N>
  return `${base}.pdf`;
};






  // PDF config (idéntico a Visual)
  const [pdf, setPdf] = useState<PdfConfig>(DEFAULT_PDF);
  const PT = { A4: { W: 595, H: 842 }, Letter: { W: 612, H: 792 } } as const;
  const base = PT[pdf.paper] || PT.A4;
  const Wpt = pdf.orientation === 'portrait' ? base.W : base.H;
  const Hpt = pdf.orientation === 'portrait' ? base.H : base.W;

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
  let laminaHpx = Math.round(laminaWpx / BASE_AR);

  const MIN_DIAG = px(pdf.diag.minHeight);
  const MIN_LAMINA = px(pdf.lamina.minHeight);

  let diagHpx =
    layoutH -
    headerTotalHpx -
    headerGapPx -
    diagTopGapPx -
    footerBeforeGapPx -
    laminaHpx -
    footerHpx -
    bottomReservePx;

  if (diagHpx < MIN_DIAG) {
    const deficit = MIN_DIAG - diagHpx;
    laminaHpx = Math.max(MIN_LAMINA, laminaHpx - deficit);
    laminaWpx = Math.round(laminaHpx * BASE_AR);
    diagHpx =
      layoutH -
      headerTotalHpx -
      headerGapPx -
      diagTopGapPx -
      footerBeforeGapPx -
      laminaHpx -
      footerHpx -
      bottomReservePx;
  }

  if (pdf.diag.pullUp > 0) {
    laminaHpx = Math.max(MIN_LAMINA, laminaHpx - px(pdf.diag.pullUp));
    diagHpx =
      layoutH -
      headerTotalHpx -
      headerGapPx -
      diagTopGapPx -
      footerBeforeGapPx -
      laminaHpx -
      footerHpx -
      bottomReservePx;
  }

  // Usuario/logo (igual que Visual)
  const [userData, setUserData] = useState<UserData | null>(null);
  const AnimatedLetters: any = AnimatedLetterText;

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

  /* ---------- Helpers de navegación centralizados ---------- */
  const goTo = (next: StepId) => {
    setHist(h => [...h, next]);
    setStep(next);
    setConclusionStepHist(h => [...h, []]);
  };

  const resetAll = () => {
    setConclusions([]);
    setConclusionStepHist([[]]);
    setStep('A');
    setHist(['A']);
    setSide('');
    setFiguras([]);
    setNombrePaciente('');
    setRootFlow(null);
    setSeverity(null);
    setActiveTab('reporte');
    setMostrarGaleria(false);
    setImgListaSrc(null);
    setComentarioLista('');
    setTextoEditadoManualmente(false);
  };

  const handleBack = () => {
    if (history.length <= 1) return;

    // 1) eliminar todo lo elegido en ESTE paso (último bucket)
    setConclusions(prev => {
      const lastBucket = conclusionStepHist[conclusionStepHist.length - 1] ?? [];
      return prev.filter(c => !lastBucket.includes(c.value));
    });
    setConclusionStepHist(h => (h.length > 1 ? h.slice(0, -1) : [[]]));

    // 2) actualizar historial y paso
    const newHist = history.slice(0, -1);
    setHist(newHist);
    setStep(newHist[newHist.length - 1]);

    // 3) resets efímeros
    const leaving = history[history.length - 1];
    if (['C1', 'CB', 'C2', 'D1', 'D2', 'E'].includes(leaving)) {
      setSeverity(null);
    }

    // 4) si volvemos a la RAÍZ
    if (newHist[newHist.length - 1] === 'A') {
      setConclusions(prev => prev.filter(c => c.value !== 'alterada' && c.value !== 'indemne'));
      setConclusionStepHist([[]]);
      setHist(['A']);
      setStep('A');
      setRootFlow(null);
      setSeverity(null);
      setSide('');
      setActiveTab('reporte');
    }
  };

  /* ---------- Texto “reporte” bonito ---------- */
  const textoReporte = useMemo(() => {
    const crudo = conclusions
      .filter(c => (c.title || '').trim() !== '')
      .map(c => c.title)
      .join(' ');
    return limpiarTextoReporte(crudo);
  }, [conclusions]);

  /* ---------- OVERLAYS con severidad ---------- */
  const isNivelExp = (v: string) =>
    /nervio_auditivo|nucleo_coclear|completo_olivar_trapezoide|lemnisco_lateral|coliculo_inferior/.test(v);

  const getOverlayImgs = (exp: string): any[] => {
    const esLado = (x: string) => x === 'izquierdo' || x === 'derecho' || x === 'bilateral';

    // Manejo especial para 'base_bilateral' (valor agregado en StepA al dar clic en ALTERADA)
    if (exp === 'base_bilateral') {
      const izq = AUD_OV['base_bilateral_izquierdo'];
      const der = AUD_OV['base_bilateral_derecho'];
      return [izq, der].filter(Boolean);
    }

    if (rootFlow === 'alterada' && esLado(exp)) {
      const baseKey = `${exp}indemne` as 'izquierdoindemne'|'derechoindemne'|'bilateralindemne';
      const base = AUD_OV[baseKey];
      return base ? (Array.isArray(base) ? base : [base]) : [];
    }

    if (rootFlow === 'alterada' && severity && isNivelExp(exp)) {
      const cand = `${exp}Alterada_${severity}`;
      let ov = AUD_OV[cand];

      if (!ov && exp.startsWith('bilateral')) {
        const nivel = exp.replace(/^bilateral/, '');
        const izq = AUD_OV[`izquierdo${nivel}Alterada_${severity}`];
        const der = AUD_OV[`derecho${nivel}Alterada_${severity}`];
        const arr = [izq, der].filter(Boolean);
        if (arr.length) return arr as any[];
      }

      if (ov) return Array.isArray(ov) ? ov : [ov];
      return [];
    }

    const base = AUD_OV[exp];
    return base ? (Array.isArray(base) ? base : [base]) : [];
  };

  const overlaySources = useMemo(() => {
    const imgs: any[] = [];
    conclusions.forEach(c => { imgs.push(...getOverlayImgs(c.value)); });
    return imgs;
  }, [conclusions, rootFlow, severity]);

  /* ---------- Lista (igual estilo Visual) ---------- */
  type LineaLista = { k: string; v: string };
  // Etiquetas cortas SOLO para "modo lista"
// Etiquetas cortas SOLO para "modo lista"
const NIVEL_LABELS: Record<string, string> = {
  nervio_auditivo: 'nervio auditivo (I)',
  nucleo_coclear: 'núcleo coclear (II)',
  completo_olivar_trapezoide: 'complejo olivar superior y cuerpo trapezoide (III)',
  lemnisco_lateral: 'lemnisco lateral (IV)',
  coliculo_inferior: 'colículo inferior (V)',
};

// ✅ Formatea "Nivel" para modo lista SIN tocar mayúsculas/minúsculas ni romanos
const formatNivelLista = (label: string) => {
  return `Topográficamente a nivel de ${label}`;
};


  const buildLista = (cons: ConclusionItem[], s: Side): LineaLista[] => {
    const vals = new Set(cons.map(c => c.value));
    const has = (needle: string) =>
      Array.from(vals).some(v => v === needle || v.includes(needle));

    const lines: LineaLista[] = [];

    const via = vals.has('alterada') ? 'Afectada' :
                vals.has('indemne')  ? 'Indemne'  : '';
    if (via) lines.push({ k: 'Vía Auditiva', v: via });

    let fisio = '';
    if (vals.has('retardo_en_la_conduccion')) {
      fisio = 'Retardo en la conducción';
      if (vals.has('perdida_axonal_secundaria')) {
        fisio += ' con pérdida axonal secundaria';
      }
    } else if (vals.has('deficit_neuronal')) {
      fisio = 'Axonal';
      if (vals.has('retardo_secundario_en_la_conduccion')) {
        fisio += ' con retardo secundario en la conducción';
      }
    } else if (vals.has('bloqueo_en_la_conduccion')) {
      fisio = 'Bloqueo en la conducción';
    } else if (vals.has('sin_respuesta')) {
      fisio = 'Sin respuesta evocable';
    }
    if (fisio) lines.push({ k: 'Fisiopatología', v: fisio });

    const grado =
      vals.has('severo')   ? 'Severo'   :
      vals.has('moderado') ? 'Moderado' :
      vals.has('leve')     ? 'Leve'     : '';
    if (grado) lines.push({ k: 'Grado', v: grado });

    const sideMap: Record<string, string> = { izquierdo: 'Izquierdo', derecho: 'Derecho', bilateral: 'Bilateral' };
    const lado =
      s ? sideMap[s] :
      (vals.has('izquierdo') || vals.has('izquierdoindemne')) ? 'Izquierdo' :
      (vals.has('derecho')   || vals.has('derechoindemne'))   ? 'Derecho'   :
      (vals.has('bilateral') || vals.has('bilateralindemne')) ? 'Bilateral' : '';
    if (lado) lines.push({ k: 'Lado', v: lado });

    let region = '';
    if (vals.has('rostral')) region = 'Rostral (III-V)';
    else if (vals.has('caudal')) region = 'Caudal (I-III)';
    else if (vals.has('tallo_cerebral')) region = 'Total (I-V)';
    if (region) lines.push({ k: 'Región', v: region });
// --- Nivel (solo el seleccionado) ---
const nivelSel = cons.find(c =>
  /nervio_auditivo|nucleo_coclear|completo_olivar_trapezoide|lemnisco_lateral|coliculo_inferior/.test(c.value) &&
  (c.title ?? '').trim() !== ''
);

if (nivelSel) {
  const nivelKey = nivelSel.value.replace(/^(izquierdo|derecho|bilateral)/, '');
  const nivelLabel = NIVEL_LABELS[nivelKey];
  if (nivelLabel) {
    // 👉 Aplica el prefijo solicitado solo para MODO LISTA
    const nivelLista = formatNivelLista(nivelLabel);
    lines.push({ k: 'Nivel', v: nivelLista });
  }
}



    let umbral = '';
    if (vals.has('normoacusia')) umbral = 'Normoacusia';
    else if (vals.has('hipoacusia_leve')) umbral = 'Hipoacusia leve';
    else if (vals.has('hipoacusia_moderada')) umbral = 'Hipoacusia moderada';
    else if (vals.has('hipoacusia_severa')) umbral = 'Hipoacusia severa';
    else if (vals.has('hipocusia_profunda')) umbral = 'Hipoacusia profunda';
    if (umbral) lines.push({ k: 'Umbral auditivo', v: umbral });

    let tipo = '';
    if (vals.has('neurosensorial')) tipo = 'Neurosensorial';
    else if (vals.has('conductiva')) tipo = 'Conductiva';
    if (tipo) lines.push({ k: 'Tipo', v: tipo });

    return lines;
  };

  const lista = useMemo(() => buildLista(conclusions, side), [conclusions, side]);

  /* ====== Agrupación para PDF página 2 (igual a Visual) ====== */
  const grouped = useMemo(() => {
    const acc: Partial<Record<Section, string[]>> = {};
    conclusions.forEach(c => {
      const sec = getSection(c); if (!sec) return;
      const short = VALUE_LABELS_AUD[c.value] ?? sanitizeTitle(c.title);
      const final = short.charAt(0).toUpperCase() + short.slice(1);
      acc[sec] ??= [];
      if (!acc[sec]!.includes(final)) acc[sec]!.push(final);
    });
    return acc;
  }, [conclusions]);

  /* ========= selección figuras ========= */
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

  const agregarFigura = (tipo: 'circle' | 'square', uri: string) => {
    // Tamaño base de las figuras (debe coincidir con FIGURA_SIZE de FiguraMovibleVias)
    const figuraSize = 80;  // círculo y cuadrado usan el mismo tamaño base

    // Calcular posición central del contenedor
    const centerX = (limitesContenedor.width / 2) - (figuraSize / 2);
    const centerY = (limitesContenedor.height / 2) - (figuraSize / 2);

    setFiguras(prev => [
      ...prev,
      {
        id: uuid.v4().toString(),
        tipo,
        uri,
        posicion: {
          x: centerX > 0 ? centerX : 0,  // ✅ Valida que no sea negativo
          y: centerY > 0 ? centerY : 0   // ✅ Valida que no sea negativo
        }
      }
    ]);
  };
  const manejarSeleccionImagen = async (tipo: 'circle' | 'square') => {
    const permiso = await pedirPermiso();
    if (!permiso) return;

    Alert.alert('Seleccionar imagen', '¿Qué deseas hacer?', [
      {
        text: 'Tomar foto',
        /*onPress: () => {
          launchCamera({ mediaType: 'photo', quality: 1 }, (res) => {
            if (res.assets?.[0]?.uri) agregarFigura(tipo, res.assets[0].uri!);
          });
        },*/
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
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };
  const actualizarPosicion = (id: string, x: number, y: number) => {
    setFiguras(prev => prev.map(f => f.id === id ? { ...f, posicion: { x, y } } : f));
  };
  const eliminarFigura = (id: string) => {
    setFiguras(prev => prev.filter(f => f.id !== id));
  };

  const flushBeforeCapture = async () => {
    Keyboard.dismiss();
    if (userData?.imageUrl) { try { await Image.prefetch(userData.imageUrl); } catch {} }
    await new Promise<void>(r => requestAnimationFrame(() => r()));
    await new Promise<void>(r => setTimeout(r, 30));
  };

  const capturePages = async (format: 'png' | 'jpg') => {
    if (!exportRef.current) throw new Error('El lienzo no está listo');
    await flushBeforeCapture();
    const quality = format === 'jpg' ? 0.95 : 1;
    // Siempre usar fondo blanco para que las imágenes PNG transparentes se vean correctamente
    const bg = '#ffffff';

    const p1 = await captureRef(exportRef.current, {
      format,
      quality,
      result: 'base64',
      ...(format === 'png' ? { backgroundColor: bg } : {}),
    });
    let p2: string | null = null;
    if (exportRef2?.current) {
      p2 = await captureRef(exportRef2.current, {
        format,
        quality,
        result: 'base64',
        ...(format === 'png' ? { backgroundColor: bg } : {}),
      });
    }
    return { p1, p2 };
  };

  const exportarPDF = async () => {
    try {
      setExportSuccess(null);
      setExportKind('pdf');
      setExporting(true);

      const studyType = 'Vías Auditivas';
      const doctorName =
        [userData?.name, userData?.lastname].filter(Boolean).join(' ') || undefined;

      const ab = await buildReportPdfArrayBuffer({ studyType, doctorName });
      const base64Pdf = b64encode(ab);
      const filename = reportFileName();

      if (Platform.OS === 'android' && Platform.Version <= 28) {
        const w = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        );
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
      setExporting(false);
      setExportKind(null);
    }
  };

  exportarPdfRef.current = exportarPDF;

  const exportarJPEG = async () => {
    try {
      setExportKind('jpeg');
      setExporting(true);

      const { p1, p2 } = await capturePages('jpg');

      if (Platform.OS === 'android' && Platform.Version <= 28) {
        const w = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
        if (w !== PermissionsAndroid.RESULTS.GRANTED) throw new Error('WRITE_EXTERNAL_STORAGE no otorgado');
      }
      const RNBU: any = ReactNativeBlobUtil;
      const baseName = `ReporteViasAuditiva_${safe(nombrePaciente || 'Paciente')}`;

      const saveJpeg = async (b64: string, suffix: string) => {
        const filename = `${baseName}${suffix}.jpg`;
        const outPath = Platform.OS === 'android'
          ? `${RNBU.fs.dirs.DownloadDir}/${filename}`
          : `${RNBU.fs.dirs.DocumentDir}/${filename}`;

        await RNBU.fs.writeFile(outPath, b64, 'base64');
        if (Platform.OS === 'android') {
          await RNBU.fs.scanFile([{ path: outPath, mime: 'image/jpeg' }]);
          RNBU.android?.addCompleteDownload?.({
            title: filename, description: 'Imagen exportada', mime: 'image/jpeg',
            path: outPath, showNotification: true,
          });
        }
        return filename;
      };

      const f1 = await saveJpeg(p1, '_p1');
      let msg = `Se guardó: ${f1}`;
      if (p2) {
        const f2 = await saveJpeg(p2, '_p2');
        msg = `Se guardaron:\n${f1}\n${f2}`;
      }
      Alert.alert('Listo', msg);
    } catch (e: any) {
      Alert.alert('Error', `No se pudo exportar JPEG.\n\n${e?.message ?? e}`);
    } finally {
      setExporting(false);
      setExportKind(null);
    }
  };

  useEffect(() => {
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

  /* ========= Canvas de exportación con reescala (como Visual) ========= */
  const CanvasView: React.FC<{ w?: number; h?: number; transparentBg?: boolean }> = ({
    w,
    h,
    transparentBg = false,
  }) => {
    const size = w && h ? { w, h } : imgSize;
    if (!size) return null;

    const sx = limitesContenedor.width ? size.w / limitesContenedor.width : 1;
    const sy = limitesContenedor.height ? size.h / limitesContenedor.height : 1;
    const figBaseCircle = 80;
    const figBaseSquare = 80;
    const baseImage = transparentBg ? IMG_BASE_TRANSPARENT : IMG_BASE;

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
          source={baseImage}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: size.w,
            height: size.h
          }}
          resizeMode="contain"
        />

        {overlaySources.map((src, i) => (
          <Image
            key={`exp_${i}`}
            source={src}
            style={{ position: 'absolute', top: 0, left: 0, width: size.w, height: size.h }}
            resizeMode="contain"
          />
        ))}
    {figuras.map(f => {
      const base  = f.tipo === 'circle' ? figBaseCircle : figBaseSquare;
      const k     = Math.min(sx, sy);        // misma idea que tu 'k'
      const side  = base * k;                // tamaño final
      const br    = f.tipo === 'circle' ? side / 2 : 0;
    
      // Grosor del borde: evita 0.5 (se pierde en el PDF)
      const bw    = 0.5;
    
      return (
        <View
          key={`fig_${f.id}`}
          style={{
            position: 'absolute',
            left: f.posicion.x * sx,
            top: f.posicion.y * sy,
    
            width: side,
            height: side,
            borderRadius: br,
            overflow: 'hidden',              // recorta la imagen dentro de la forma
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
          borderWidth: bw,
          borderColor: 'gray',
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

  /* -------------------- Pasos -------------------- */
  const StepA = () => {
    const { addConclusion } = useContext(ReportContext);
    return (
      <View>
        <Text style={styles.stepTitle}>VÍA AUDITIVA</Text>
        <ConclusionBtn
          value="indemne" title="Vía auditiva con integridad funcional "
          label="INDEMNE"
          onPress={() => {
            setRootFlow('indemne');
            setSeverity(null);
            goTo('E2');
          }}
        />
        <ConclusionBtn
          value="alterada" title="Vía auditiva con defecto "
          label="ALTERADA"
          onPress={() => {
            setRootFlow('alterada');
            setSeverity(null);
            // Agregar inmediatamente las bases bilaterales AI.png (izq) y AD.png (der)
            addConclusion({ value: 'base_bilateral', title: '' });
            goTo('B');
          }}
        />
      </View>
    );
  };

  const StepB = () => {
    const { addConclusion } = useContext(ReportContext);
    return (
      <View>
        <NavRow onBack={handleBack} onReset={resetAll} />
        <Text style={styles.stepTitle}>FISIOPATOLOGÍA:</Text>

        <ConclusionBtn value="retardo_en_la_conduccion" title="Por retardo en la conducción "
          label="RETARDO EN LA CONDUCCIÓN" onPress={() => goTo('C1')} />

        <ConclusionBtn value="bloqueo_en_la_conduccion" title="Por bloqueo en la conducción "
          label="BLOQUEO EN LA CONDUCCIÓN" onPress={() => goTo('CB')} />

        <ConclusionBtn value="deficit_neuronal" title="Axonal "
          label="DÉFICIT AXONAL" onPress={() => goTo('C2')} />

        <ConclusionBtn value="sin_respuesta" title="Por ausencia de respuesta evocable "
          label="SIN RESPUESTA"
          onPress={() => {
            setSeverity('severo');
            addConclusion({ value: 'severo', title: 'Severo ' });
            goTo('E');
          }}
        />
      </View>
    );
  };

  const StepC1 = () => (
    <View>
      <NavRow onBack={handleBack} onReset={resetAll} />
      <Text style={styles.stepTitle}>GRADO:</Text>
      <ConclusionBtn value="leve" title="Leve " label="LEVE" onPress={() => { setSeverity('leve'); goTo('D1'); }} />
      <ConclusionBtn value="moderado" title="Moderado " label="MODERADO" onPress={() => { setSeverity('moderado'); goTo('D1'); }} />
      <ConclusionBtn value="severo" title="Severo " label="SEVERO" onPress={() => { setSeverity('severo'); goTo('D1'); }} />
    </View>
  );

  const StepCB = () => (
    <View>
      <NavRow onBack={handleBack} onReset={resetAll} />
      <Text style={styles.stepTitle}>GRADO:</Text>
      <ConclusionBtn value="leve" title="Leve " label="LEVE" onPress={() => { setSeverity('leve'); goTo('E'); }} />
      <ConclusionBtn value="moderado" title="Moderado " label="MODERADO" onPress={() => { setSeverity('moderado'); goTo('E'); }} />
      <ConclusionBtn value="severo" title="Severo " label="SEVERO" onPress={() => { setSeverity('severo'); goTo('E'); }} />
    </View>
  );

  const StepC2 = () => (
    <View>
      <NavRow onBack={handleBack} onReset={resetAll} />
      <Text style={styles.stepTitle}>GRADO:</Text>
      <ConclusionBtn value="leve" title="Leve " label="LEVE" onPress={() => { setSeverity('leve'); goTo('D2'); }} />
      <ConclusionBtn value="moderado" title="Moderado " label="MODERADO" onPress={() => { setSeverity('moderado'); goTo('D2'); }} />
      <ConclusionBtn value="severo" title="Severo " label="SEVERO" onPress={() => { setSeverity('severo'); goTo('D2'); }} />
    </View>
  );

  const StepD1 = () => (
    <View>
      <NavRow onBack={handleBack} onReset={resetAll} onFwd={() => goTo('E')} />
      <Text style={styles.stepTitle}>RETARDO EN CONDUCCIÓN:</Text>
      <ConclusionBtn value="perdida_axonal_secundaria" title=" y pérdida axonal secundaria "
        label="+ PÉRDIDA AXONAL" onPress={() => goTo('E')} />
         <SkipButton onPress={() => goTo('E')} />
    </View>
  );

  const StepD2 = () => (
    <View>
      <NavRow onBack={handleBack} onReset={resetAll} />
      <Text style={styles.stepTitle}>AXONAL:</Text>
      <ConclusionBtn value="retardo_secundario_en_la_conduccion" title="y retardo secundario en la conducción "
        label="+ RETARDO EN LA CONDUCCIÓN" onPress={() => goTo('E')} />
         <SkipButton onPress={() => goTo('E')} />
    </View>
  );

  const StepE = () => (
    <View>
      <NavRow onBack={handleBack} onReset={resetAll} />
      <Text style={styles.stepTitle}>LADO:</Text>
      <ConclusionBtn value="izquierdo" title="Para lado izquierdo "
        label="IZQUIERDO" onPress={() => { setSide('izquierdo'); goTo('F'); }} />
      <ConclusionBtn value="derecho" title="Para lado derecho "
        label="DERECHO" onPress={() => { setSide('derecho'); goTo('F'); }} />
      <ConclusionBtn value="bilateral" title="De forma bilateral,"
        label="BILATERAL" onPress={() => { setSide('bilateral'); goTo('F'); }} />
      {rootFlow === 'alterada' && severity && (
        <Text style={{ color: '#fff', textAlign: 'center', marginTop: 8 }}>Grado seleccionado: {severity.toUpperCase()}</Text>
      )}
    </View>
  );

  const StepE2 = () => (
    <View>
      <NavRow onBack={handleBack} onReset={resetAll} />
      <Text style={styles.stepTitle}>LADO:</Text>
      <ConclusionBtn value="izquierdoindemne" title="Para lado izquierdo a través del tallo cerebral."
        label="IZQUIERDO" onPress={() => { setSide('izquierdo'); goTo('J2'); }} />
      <ConclusionBtn value="derechoindemne" title="Para lado derecho a través del tallo cerebral."
        label="DERECHO" onPress={() => { setSide('derecho'); goTo('J2'); }} />
      <ConclusionBtn value="bilateralindemne" title="De forma bilateral a través del tallo cerebral."
        label="BILATERAL" onPress={() => { setSide('bilateral'); goTo('J2'); }} />
    </View>
  );

  const StepF = () => (
    <View>
      <NavRow onBack={handleBack} onReset={resetAll} />
      <Text style={styles.stepTitle}>REGIÓN:</Text>
      <ConclusionBtn value="rostral" title=" A través de región rostral del tallo cerebral"
        label="ROSTRAL (III-V)" onPress={() => goTo('G')} />
      <ConclusionBtn value="caudal" title=" A través de región caudal del tallo cerebral"
        label="CAUDAL (I-III)" onPress={() => goTo('G')} />
      <ConclusionBtn value="tallo_cerebral" title=" A través del tallo cerebral"
        label="TOTAL (I-V)" onPress={() => goTo('G')} />
      {rootFlow === 'alterada' && severity && (
        <Text style={{ color: '#fff', textAlign: 'center', marginTop: 8 }}>Grado: {severity.toUpperCase()}</Text>
      )}
    </View>
  );

  const StepG = () => {
    const { addConclusion, removeConclusion } = useContext(ReportContext);
    const levels = [
      { v: `${side}nervio_auditivo`, t: '; topográficamente a nivel de nervio auditivo.', l: 'NERVIO AUDITIVO (I)' },
      { v: `${side}nucleo_coclear`, t: '; topográficamente a nivel de núcleo coclear.', l: 'NÚCLEO COCLEAR (II)' },
      { v: `${side}completo_olivar_trapezoide`, t: '; topográficamente a nivel de complejo olivar superior y cuerpo trapezoide.', l: 'COMPLEJO OLIVAR SUP. Y CUERPO TRAPEZOIDE (III)' },
      { v: `${side}lemnisco_lateral`, t: '; topográficamente a nivel de lemnisco lateral.', l: 'LEMNISCO LATERAL (IV)' },
      { v: `${side}coliculo_inferior`, t: '; topográficamente a nivel de colículo inferior.', l: 'COLÍCULO INFERIOR (V)' },
    ];

    const handlePress = (idx: number) => {
      levels.forEach(lvl => removeConclusion(lvl.v));
      for (let i = idx; i < levels.length; i++) {
        addConclusion({ value: levels[i].v, title: i === idx ? levels[i].t : '' });
      }
      goTo('H');
    };

    return (
      <View>
        <NavRow onBack={handleBack} onReset={resetAll} />
        <Text style={styles.stepTitle}>NIVEL:</Text>
        {levels.map((item, idx) => (
          <TouchableOpacity key={item.v} style={styles.conclusionBtn} onPress={() => handlePress(idx)}>
            <Text style={styles.conclusionBtnText}>{item.l}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const StepH = () => (
    <View>
      <NavRow onBack={handleBack} onReset={resetAll} />
      <Text style={styles.stepTitle}>UMBRAL AUDITIVO:</Text>
      <ConclusionBtn value="normoacusia" title={'\n\nUmbral para tonos altos compatible con normoacusia'}
        label="NORMOACUSIA" onPress={() => goTo('I')} />
      <ConclusionBtn value="hipoacusia_leve" title={'\n\nUmbral para tonos altos compatible con hipoacusia leve'}
        label="HIPOACUSIA LEVE" onPress={() => goTo('I')} />
      <ConclusionBtn value="hipoacusia_moderada" title={'\n\nUmbral para tonos altos compatible con hipoacusia moderada'}
        label="HIPOACUSIA MODERADA" onPress={() => goTo('I')} />
      <ConclusionBtn value="hipoacusia_severa" title={'\n\nUmbral para tonos altos compatible con hipoacusia severa'}
        label="HIPOACUSIA SEVERA" onPress={() => goTo('I')} />
      <ConclusionBtn value="hipocusia_profunda" title={'\n\nUmbral para tonos altos compatible con hipoacusia profunda'}
        label="HIPOACUSIA PROFUNDA" onPress={() => goTo('I')} />
    </View>
  );

  const StepI = () => (
    <View>
      <NavRow onBack={handleBack} onReset={resetAll} />
      <Text style={styles.stepTitle}>TIPO:</Text>
      <ConclusionBtn value="neurosensorial" title=" De tipo neurosensorial."
        label="NEUROSENSORIAL" onPress={() => goTo('J')} />
      <ConclusionBtn value="conductiva" title=" De tipo conductiva."
        label="CONDUCTIVA" onPress={() => goTo('J')} />
    </View>
  );

  const currentStep = () => {
    switch (step) {
      case 'A': return <StepA />;
      case 'B': return <StepB />;
      case 'C1': return <StepC1 />;
      case 'CB': return <StepCB />;
      case 'C2': return <StepC2 />;
      case 'D1': return <StepD1 />;
      case 'D2': return <StepD2 />;
      case 'E': return <StepE />;
      case 'E2': return <StepE2 />;
      case 'F': return <StepF />;
      case 'G': return <StepG />;
      case 'H': return <StepH />;
      case 'I': return <StepI />;
      case 'J':
      case 'J2':
        return (
          <StepFinalAuditiva
            isLandscape={isLandscape}
            onBack={handleBack}
            onToolbarBack={handleBack}
            onReset={resetAll}
            onExport={handleExportRequest}
            exporting={exporting}
            manejarSeleccionImagen={manejarSeleccionImagen}
            activeTab={activeTab}
            onOpenGallery={() => setMostrarGaleria(true)}
            comentarioLista={comentarioLista}
            setComentarioLista={setComentarioLista}
            onOpenComentarioModal={() => setModalComentarioVisible(true)}
            imgListaSrc={imgListaSrc}
            setImgListaSrc={setImgListaSrc}
           onGenerateLink={generateShareLink}              // ✅ existe
  defaultTitle={nombrePaciente ? `Potenciales Evocados — ${nombrePaciente}` : 'Potenciales Evocados'}
  defaultMessage="Saludos..."
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

  /* -------------------- UI -------------------- */
  return (
    <ReportContext.Provider value={{ conclusions, addConclusion, removeConclusion }}>
      <View style={styles.container}>

        {/* Barra superior: INPUT nombre paciente */}
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

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {isLandscape ? (
            /* ========= HORIZONTAL: 3 columnas (30/40/30) ========= */
            <View style={styles.landRow}>
              {/* Columna IZQUIERDA */}
              <View style={[styles.landLeft, styles.landCol_ls]}>
                {(step === 'J' || step === 'J2')
                  ? (
                    <StepFinalAuditiva
                      isLandscape={isLandscape}
                      onBack={handleBack}
                      onToolbarBack={handleBack}
                      onReset={resetAll}
                      onExport={handleExportRequest}
                      exporting={exporting}
                      manejarSeleccionImagen={manejarSeleccionImagen}
                      activeTab={activeTab}
                      onOpenGallery={() => setMostrarGaleria(true)}
                      comentarioLista={comentarioLista}
                      setComentarioLista={setComentarioLista}
                      onOpenComentarioModal={() => setModalComentarioVisible(true)}
                      imgListaSrc={imgListaSrc}
                      setImgListaSrc={setImgListaSrc}
                      onGenerateLink={generateShareLink}              // ✅ existe
  defaultTitle={nombrePaciente ? `Potenciales Evocados — ${nombrePaciente}` : 'Potenciales Evocados'}
  defaultMessage="Saludos..."
  autoReportName={reportFileName()}
  onRequestTemplate={requestTemplateForLink}
                    />
                  )
                  : (
                    <View style={styles.stepCard}>
                      {currentStep()}
                    </View>
                  )
                }
              </View>

              {/* Columna CENTRO: lámina */}
              <View style={[styles.landCenter, styles.landCol_ls]}>
                <View
                  style={[styles.imageBox, { aspectRatio: BASE_AR }]}
                  onLayout={e => {
                    const { width, height } = e.nativeEvent.layout;
                    setImgSize({ w: width, h: height });
                    setLimitesContenedor({ width, height });
                  }}
                >
                  {!!nombrePaciente && <Text style={styles.pacienteBadge}>{nombrePaciente}</Text>}

                  <Image source={IMG_BASE} style={styles.layer} resizeMode="contain" />
                  {overlaySources.map((src, i) => (
                    <Image key={i} source={src} style={styles.layer} resizeMode="contain" />
                  ))}

                  {figuras.map(figura => (
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
                </View>
              </View>

              {/* Columna DERECHA: tabs + resumen */}
              <View style={[styles.landRight, styles.landCol_ls]}>
                {/* Selector modo */}
                <View style={styles.modeSelector}>
                <TouchableOpacity
                  style={[styles.modeBtn, activeTab === 'reporte' && styles.modeBtnActive]}
                  onPress={() => setActiveTab('reporte')}
                >
                  <Text style={styles.modeTxt}>Reporte</Text>
                </TouchableOpacity>
              
                <TouchableOpacity
                  style={[styles.modeBtn, activeTab === 'lista' && styles.modeBtnActive]}
                  onPress={() => setActiveTab('lista')}
                >
                  <Text style={styles.modeTxt}>Lista</Text>
                </TouchableOpacity>
              
                <TouchableOpacity
                  style={[styles.modeBtn, activeTab === 'GenerarLink' && styles.modeBtnActive]}
                  onPress={() => setActiveTab('GenerarLink')}
                >
                  <Text style={styles.modeTxt}>Generar Link</Text>
                </TouchableOpacity>
              </View>
                {/* Resumen */}
                <View style={[styles.reporteContainer, styles.repBoxLandscape]}>
                  <Text style={styles.reporteTitle}>Vía Auditiva</Text>

                  {activeTab === 'lista' ? (
                    lista.map(({ k, v }) => (
                      <Text key={k} style={styles.reporteTexto}>
                        <Text style={{ fontWeight: 'bold' }}>{k}: </Text>{v}
                      </Text>
                    ))
                  ) : activeTab === 'reporte' ? (
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
                  ) : (
  <ExportLeftGenerarLink
    onGenerateLink={generateShareLink}
    defaultTitle={nombrePaciente ? `Potenciales Evocados — ${nombrePaciente}` : 'Potenciales Evocados'}
    defaultMessage="Saludos..."
    autoReportName={reportFileName()}
    onRequestTemplate={requestTemplateForLink}
  />                  )}
                </View>
              </View>
            </View>
          ) : (
            /* ========= VERTICAL ========= */
            <>
              {/* Lámina */}
              <View
                style={[styles.imageBox, { aspectRatio: BASE_AR }]}
                onLayout={e => {
                  const { width, height } = e.nativeEvent.layout;
                  setImgSize({ w: width, h: height });
                  setLimitesContenedor({ width, height });
                }}
              >
                {!!nombrePaciente && <Text style={styles.pacienteBadge}>{nombrePaciente}</Text>}

                <Image source={IMG_BASE} style={styles.layer} resizeMode="contain" />
                {overlaySources.map((src, i) => (
                  <Image key={i} source={src} style={styles.layer} resizeMode="contain" />
                ))}

                {figuras.map(figura => (
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
              </View>

              {/* Paso actual */}
              <View style={styles.stepCard}>{currentStep()}</View>

              {/* Selector modo */}
              <View style={styles.modeSelector}>
                <TouchableOpacity
                  style={[styles.modeBtn, activeTab === 'reporte' && styles.modeBtnActive]}
                  onPress={() => setActiveTab('reporte')}
                >
                  <Text style={styles.modeTxt}>Reporte</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modeBtn, activeTab === 'lista' && styles.modeBtnActive]}
                  onPress={() => setActiveTab('lista')}
                >
                  <Text style={styles.modeTxt}>Lista</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modeBtn, activeTab === 'GenerarLink' && styles.modeBtnActive]}
                  onPress={() => setActiveTab('GenerarLink')}
                >
                  <Text style={styles.modeTxt}>GenerarLink</Text>
                </TouchableOpacity> 
              </View>

              {/* Resumen */}
              <View style={styles.reporteContainer}>
                <Text style={styles.reporteTitle}>Vía Auditiva</Text>

                {activeTab === 'lista' ? (
                  lista.map(({ k, v }) => (
                    <Text key={k} style={styles.reporteTexto}>
                      <Text style={{ fontWeight: 'bold' }}>{k}: </Text>{v}
                    </Text>
                  ))
                ) : activeTab === 'reporte' ? (
                  <View>
                  <Text style={[styles.reporteTexto, styles.justify]}>
                    {textoVisual || textoReporte}
                  </Text>
                
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
   setImgLista(src)
   setMostrarGaleria(false);
   setActiveTab('lista');
 }}
  />
)}

        {/* ====== PÁGINA 1 (oculta) ====== */}
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
            borderWidth: pdf.debug ? 1 : 0,
            borderColor: 'rgba(255,255,255,1)',
          }}
          collapsable={false}
          renderToHardwareTextureAndroid
          needsOffscreenAlphaCompositing
        >
          {page1ShiftDownPx > 0 && <View style={{ height: page1ShiftDownPx }} />}

          {/* HEADER */}
          <View style={{
            height: headerTotalHpx,
            backgroundColor: 'transparent',
            paddingHorizontal: px(pdf.header.padH),
            paddingTop: headerPadTopPx,
            paddingBottom: headerPadBottomPx,
            justifyContent: 'center',
          }}>
            <View style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between'}}>
              <Text numberOfLines={1} style={{
                color:'#000',
                fontWeight: pdf.header.patient.weight,
                fontSize: px(pdf.header.patient.nameSize)
              }}>
                <Text style={{ fontSize: px(pdf.header.patient.labelSize)}}></Text>{nombrePaciente || 'Sin especificar'}
              </Text>

              {!!userData?.imageUrl && (
                <View style={{
                  position:'relative',
                  width: px(pdf.header.logo.size + pdf.header.logo.fogPad*2),
                  height: px(pdf.header.logo.size + pdf.header.logo.fogPad*2),
                  justifyContent:'center',
                  alignItems:'center',
                  marginLeft: px(8),
                }}>
                  <View style={{
                    position:'absolute', width:'100%', height:'100%',
                    backgroundColor:'#fff', opacity: pdf.header.logo.fogOpacity, borderRadius: px(10)
                  }} />
                  <Image
                    source={{ uri: userData.imageUrl }}
                    resizeMode="contain"
                    style={{ width: px(pdf.header.logo.size), height: px(pdf.header.logo.size), borderRadius: px(8), opacity: pdf.header.logo.opacity }}
                  />
                </View>
              )}
            </View>
          </View>

          {headerGapPx > 0 && <View style={{ height: headerGapPx }} />}

          {/* LÁMINA */}
          <View style={{ width: '100%', alignItems: 'center', borderWidth: pdf.debug ? 1 : 0, borderColor:'rgba(255,255,255,1)', backgroundColor: 'transparent' }}>
            <CanvasView
              w={laminaWpx}
              h={laminaHpx}
              transparentBg={plantillaId !== 'none'}
            />
          </View>

          {diagTopGapPx > 0 && <View style={{ height: diagTopGapPx }} />}

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

          {footerBeforeGapPx > 0 && <View style={{ height: footerBeforeGapPx }} />}

          {/* FOOTER */}
          <View style={{
            height: footerHpx,
            paddingHorizontal: px(pdf.footer.padH),
            paddingVertical: px(pdf.footer.padV),
            backgroundColor: 'transparent',
            opacity: pdf.footer.opacity,
            justifyContent: 'center',
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

        {/* ====== PÁGINA 2 (oculta) ====== */}
        <View
          ref={exportRef2}
          style={{
            position: 'absolute',
            left: 0, top: 0,
            zIndex: -1,
            width: pageWpx,
            height: pageHpx,
            backgroundColor: exportBgColor,
            pointerEvents: 'none',
            padding: pad,
          }}
          collapsable={false}
          renderToHardwareTextureAndroid
          needsOffscreenAlphaCompositing
        >
          <View style={{ flex: 1, flexDirection: 'column' }}>
            {/* Fila superior (dos columnas) */}
            <View style={{ height: px(Math.max(0, (pdf.page2?.shiftDown ?? 0) - 5)) }} />
            <View style={{ flexDirection: 'row', flex: 1 }}>
              {/* Columna izquierda: LISTA */}
              <View
                style={{
                  flex: 1,
                  marginRight: px(6),
                  paddingVertical: px(10),
                  paddingLeft: px(50),
                  paddingRight: px(14),
                }}
              >
                <Text style={{ fontWeight: '700', fontSize: px(12), marginBottom: px(6), color: '#000' }}>
                  
                </Text>

                {lista.length ? (
                  lista.map(({ k, v }) => (
                    <Text
                      key={k}
                      style={{
                        fontSize: px(9.2),
                        color: '#000',
                        marginBottom: px(4),
                        lineHeight: px(13),
                      }}
                    >
                      <Text style={{ fontWeight: 'bold' }}>{k}: </Text>
                      {v}
                    </Text>
                  ))
                ) : (
                  <Text style={{ fontSize: px(9.2), color: '#666' }}>Sin datos de lista.</Text>
                )}
              </View>

              {/* Columna derecha: COMENTARIO */}
              <View
                style={{
                  flex: 1,
                  paddingVertical: px(10),
                  paddingRight: px(14),
                  paddingLeft: px(8),
                  marginLeft: px(2),
                }}
              >
                <Text style={{
                  fontWeight: '700',
                  fontSize: px(12),
                  marginBottom: px(6),
                  color: '#000',
                }}>
                </Text>

                <Text style={{ fontSize: px(9.2), color: '#000', lineHeight: px(13), textAlign: 'justify' }}>
                  {comentarioLista?.trim() ? limpiarTextoReporte(comentarioLista) : '—'}
                </Text>
              </View>
            </View>

           {/* Fila inferior: IMAGEN COMPLETA (anclada arriba) */}
           <View style={{
             flex: 1.3,
             padding: px(40),
             alignItems: 'stretch',           
             marginTop: px(70),            
             justifyContent: 'flex-start',  
           }}>
             {imgListaSrc ? (
               <Image
                 source={imgListaSrc as ImageSourcePropType}
                 resizeMode="contain"
                 style={{
                    width: '100%',
                    height: undefined,         // 👈 deja que calcule el alto
                    aspectRatio: imgListaAR || 16 / 9,  // 👈 alto natural; fallback
                    maxHeight: '100%',         // 👈 no se salga del bloque
                    alignSelf: 'stretch',
                 }}
               />
             ) : (
               <Text style={{ fontSize: px(10), color: '#666' }}>Sin imagen seleccionada.</Text>
             )}
           </View>
          </View>
        </View>
      </View>

      {/* Overlay de carga mientras se exporta */}
      {exporting && (
        <View style={styles.loadingOverlay}>
          <Circle size={40} color="#ff9100ff" />
          <AnimatedLetters
            value={exportKind === 'pdf' ? 'Exportando PDF' : exportKind === 'jpeg' ? 'Exportando JPEG' : 'Exportando…'}
            letterStyle={styles.loadingText}
            animationDirection="bottom-to-top"
            isSameAnimationDelay
            animateOnLoad
          />
        </View>
      )}
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

/* ───────────── Estilos ───────────── */
const styles = StyleSheet.create({
  justify: { textAlign: 'justify' },
  container: { flex: 1, backgroundColor: '#000' },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10
  },
  topBarInputWrap: { flex: 1 },

  scrollContent: { padding: 10, flexGrow: 1 },

  imageBox: {
    width: '100%',
    backgroundColor: '#222',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 10,
    position: 'relative'
  },
  layer: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },

  pacienteBadge: {
    position: 'absolute',
    top: 8, left: 8, zIndex: 3,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12, fontWeight: '600'
  },

  /* Selector Tabs */
  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  modeBtn: {
    paddingVertical: 8, paddingHorizontal: 18, backgroundColor: '#222',
    borderRadius: 8, marginHorizontal: 6, marginBottom: 6
  },
  modeBtnActive: { backgroundColor: '#ff4500' },
  modeTxt: { color: '#fff', fontSize: 14 },

  /* Resumen */
  reporteContainer: {
    backgroundColor: '#111', borderRadius: 10, padding: 15, borderWidth: 1,
    borderColor: '#333', marginBottom: 10
  },
  repBoxLandscape: { alignSelf: 'stretch', width: '100%' },
  reporteTitle: {
    color: 'orange', fontSize: 18, fontWeight: 'bold', marginBottom: 8,
    textAlign: 'center'
  },
  reporteTexto: {
    color: '#fff', fontSize: 14, lineHeight: 20,
    flexShrink: 1,
  },

  /* Paso */
  stepCard: {
    backgroundColor: '#000', borderWidth: 1, borderColor: '#fff',
    borderRadius: 12, padding: 12, marginBottom: 16,
  },
  stepTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  conclusionBtn: { backgroundColor: '#111', borderRadius: 30, borderWidth: 1, borderColor: '#444', paddingVertical: 12, marginBottom: 8 },
  conclusionBtnText: { color: '#fff', textAlign: 'center', fontSize: 14 },

  /* Nav con íconos */
  navRow: { flexDirection: 'row', marginBottom: 10, justifyContent: 'center' },
  iconCircle: {
    width: 40, height: 40,
    borderRadius: 46,
    borderWidth: 1.5,
    borderColor: '#ff4500',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarIcon: { marginHorizontal: 8 },
  menuItemIcon: { width: 30, height: 30, resizeMode: 'contain', tintColor: '#fff' },
  iconCircle_ls: { width: 44, height: 44, borderRadius: 18 },
  menuItemIcon_ls: { width: 36, height: 36 },

  // ===== figuras =====
  figBlock: { marginTop: 10, alignItems: 'center' },

  tituloFiguras: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  imagenCirculo: {
    width: 60,
    height: 60,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'gray',
  },
  imagenCuadro: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: 'gray',
    marginLeft: 20,
  },

  /* Export layout */
  exportHeader: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  exportTwoCols: {
    flexDirection: 'row',
    justifyContent:'center',
    width: '100%',
    marginTop: 30,
    marginBottom:30,
  },
  exportLeft: {
    flex: 1,
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: '#444',
  },
  exportRight: {
    flex: 1,
    paddingLeft: 12,
    minHeight: 120,
    justifyContent: 'flex-start',
  },
  rightHint: {
    color: '#777',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 8,
  },

  /* ====== Landscape: 3 columnas 30/40/30 ====== */
  landRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  landLeft: {
    flex: 3,
    paddingRight: 0,
    minHeight: 0,
    overflow: 'hidden',
  },
  landCenter: {
    flex: 4,
    paddingHorizontal: 6,
    minHeight: 0,
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  landRight: {
    flex: 3,
    paddingLeft: 0,
    minHeight: 0,
    overflow: 'hidden',
  },
  landCol_ls: { alignSelf: 'stretch' },

  /* Toolbar horizontal */
  toolbarRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
  },
  toolbarIcon_ls: { marginHorizontal: 8 },

  // Overrides imagen figuras landscape
  imagenCirculo_ls: { width: 60, height: 60, borderRadius: 40 },
  imagenCuadro_ls: { width: 60, height: 60, marginLeft: 16 },

  // ====== Overrides SOLO para landscape del panel final ======
  exportHeader_ls: {
    alignItems: 'flex-start',
    marginBottom: 12,
  },
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

  // Botón Galería + input (como Visual)
  BotonReporte: {
    width: 120,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#444',
    backgroundColor: '#222',
    alignSelf: 'center',
    marginBottom: 12,
  },
  backgroundBoton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagenFondoBoton: {
    resizeMode: 'cover',
    opacity: 1,
  },

  // GenerarLink placeholder
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

  /* Loading overlay */
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
  inputReporte: {
  alignSelf: 'stretch',
  backgroundColor: '#222',
  borderWidth: 1,
  borderColor: '#444',
  borderRadius: 8,
  color: '#fff',
  paddingHorizontal: 12,
  paddingVertical: 10,
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

});
