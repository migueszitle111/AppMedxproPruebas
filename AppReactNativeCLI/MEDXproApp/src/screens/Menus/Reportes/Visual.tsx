// src/screens/reporte/ReporteViasVisualScreen.tsx
import React, { useState, useContext, createContext, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  TextInput,
  PermissionsAndroid,
  Platform,
  Alert,
  Keyboard,
  useWindowDimensions,
  PixelRatio,
  InteractionManager
} from 'react-native';
import FancyInput from '../../../components/FancyInput';
import { Circle } from 'react-native-animated-spinkit';
import AnimatedLetterText from 'react-native-animated-letter-text';
import { ImageBackground } from 'react-native';
import GaleriaEmergente from './GaleriaTb';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../../constants/config';
import Svg, { Path } from 'react-native-svg';
import type { ImageSourcePropType } from 'react-native'; 
import { Dimensions } from 'react-native';
import { decode as b64decode, encode as b64encode } from 'base64-arraybuffer';
import { initShareLink, completeShareLink } from '../../../services/shareLinks';
import { supabase } from '../../../lib/supabase';


import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import uuid from 'react-native-uuid';
import ComentarioModal from '../../../components/ComentarioModal';

import { captureRef } from 'react-native-view-shot';
import ReactNativeBlobUtil from 'react-native-blob-util';

import Header from '../../../components/Header';
import FiguraMovible, { FIGURA_SIZE } from '../../../components/FiguraMovibleVias';

/* ░░░ Íconos barra superior ░░░ */
import I_Regresar from '../../../assets/03_Íconos/03_02_PNG/I_Out2.png';
import I_Refrescar from '../../../assets/03_Íconos/03_02_PNG/I_Repeat2.png';

import I_Folder from '../../../assets/03_Íconos/03_02_PNG/I_Folder2.png';
import I_Imprimir from '../../../assets/03_Íconos/03_02_PNG/I_Document.png';
import { escanearImagen } from '../../../utils/EscanearImagen';
import LinkUploader, { type LinkUploaderProps } from '../../../components/LinkUploader';
import TemplatePickerModal, { type PlantillaId } from '../../../components/TemplatePickerModal';
export type { PlantillaId } from '../../../components/TemplatePickerModal';

//Componente
import {
  buildPdfWithTemplate,
  type PdfBuildConfig,
} from '../../../components/pdfLoadingTemplate';

//Modal de exito - Exportar pdf
import { ExportSuccessModal } from '../../../components/ExportSuccessModal';
import EditTextModal from '../../../components/EditTextModal';
import { text } from 'stream/consumers';

// ====== Ajustes rápidos para el PDF (cámbialos aquí) ======
// ====== Config del PDF (runtime) ======
type PdfConfig = {
  paper: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  renderScale: number;       // resolución del canvas oculto
  pageMargin: number;        // padding global de la página (px)
  header: {
    height: number; padH: number; padTop: number; padBottom: number;
    afterGap?: number;
    offsetDown?: number;
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
    offsetUp?: number;       // desplaza el bloque hacia arriba (margin)
    borderW: number; borderColor: string; radius: number;
    topGap?: number;
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

const BUCKET = 'report-packages';

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

/* ░░░ Imagen base ░░░ */
const IMG_BASE = require('../../../assets/CuerpoPng/VisualImg/VI_BASE_BLANCO.png');
const IMG_BASE_TRANSPARENT = require('../../../assets/CuerpoPng/VisualImg/VI_BASE_TR.png');
const BASE_SRC = Image.resolveAssetSource(IMG_BASE);
const BASE_AR = BASE_SRC.width / BASE_SRC.height;

/* ░░░ Overlays ░░░ */
const OVERLAYS_VISUAL: Record<string, any> = {
  indemne: require('../../../assets/CuerpoPng/VisualImg/VI_Gris_BASE.png'),
  alterada: require('../../../assets/CuerpoPng/VisualImg/VI_Gris_BASE.png'),

  /* BASES BILATERALES (para alterada) - se colocan al inicio */
  base_bilateral_izquierdo: require('../../../assets/CuerpoPng/VisualImg/VI_8.png'),
  base_bilateral_derecho: require('../../../assets/CuerpoPng/VisualImg/VI_7.png'),

  /* LED FLASH (indemne) */
  izquierdo_led_flash: require('../../../assets/CuerpoPng/VisualImg/VI_8.png'),
  derecho_led_flash: require('../../../assets/CuerpoPng/VisualImg/VI_7.png'),

  /* DAMERO TOTAL (indemne) */
  izquierdo_damero_total: require('../../../assets/CuerpoPng/VisualImg/VI_8.png'),
  derecho_damero_total: require('../../../assets/CuerpoPng/VisualImg/VI_7.png'),

  /* DAMERO HEMICAMPOS (indemne) */
  izquierdo_damero_hemicampos: require('../../../assets/CuerpoPng/VisualImg/VI_5.png'),
  derecho_damero_hemicampos: require('../../../assets/CuerpoPng/VisualImg/VI_6.png'),

  /* ====== VARIANTES POR SEVERIDAD ====== */
  izquierdo_led_flashAlterada_leve: require('../../../assets/Viasneurologicas/Visual/ViaAfectada/Naranja/VI_Naranja_5.png'),
  izquierdo_led_flashAlterada_moderado: require('../../../assets/Viasneurologicas/Visual/ViaAfectada/Rojo/VI_5.png'),
  izquierdo_led_flashAlterada_severo: require('../../../assets/Viasneurologicas/Visual/ViaAfectada/Marron/VI_Marron_5.png'),

  derecho_led_flashAlterada_leve: require('../../../assets/Viasneurologicas/Visual/ViaAfectada/Naranja/VI_Naranja_4.png'),
  derecho_led_flashAlterada_moderado: require('../../../assets/Viasneurologicas/Visual/ViaAfectada/Rojo/VI_4.png'),
  derecho_led_flashAlterada_severo: require('../../../assets/Viasneurologicas/Visual/ViaAfectada/Marron/VI_Marron_4.png'),

  izquierdo_nervio_opticoAlterada_leve: require('../../../assets/Viasneurologicas/Visual/ViaAfectada/Naranja/VI_Naranja_5.png'),
  izquierdo_nervio_opticoAlterada_moderado: require('../../../assets/Viasneurologicas/Visual/ViaAfectada/Rojo/VI_5.png'),
  izquierdo_nervio_opticoAlterada_severo: require('../../../assets/Viasneurologicas/Visual/ViaAfectada/Marron/VI_Marron_5.png'),

  derecho_nervio_opticoAlterada_leve: require('../../../assets/Viasneurologicas/Visual/ViaAfectada/Naranja/VI_Naranja_4.png'),
  derecho_nervio_opticoAlterada_moderado: require('../../../assets/Viasneurologicas/Visual/ViaAfectada/Rojo/VI_4.png'),
  derecho_nervio_opticoAlterada_severo: require('../../../assets/Viasneurologicas/Visual/ViaAfectada/Marron/VI_Marron_4.png'),

  izquierdo_quiasma_opticoAlterada_leve: require('../../../assets/Viasneurologicas/Visual/ViaAfectada/Naranja/VI_Naranja_6.png'),
  izquierdo_quiasma_opticoAlterada_moderado: require('../../../assets/Viasneurologicas/Visual/ViaAfectada/Rojo/VI_6.png'),
  izquierdo_quiasma_opticoAlterada_severo: require('../../../assets/Viasneurologicas/Visual/ViaAfectada/Marron/VI_Marron_6.png'),

  derecho_quiasma_opticoAlterada_leve: require('../../../assets/Viasneurologicas/Visual/ViaAfectada/Naranja/VI_Naranja_2.png'),
  derecho_quiasma_opticoAlterada_moderado: require('../../../assets/Viasneurologicas/Visual/ViaAfectada/Rojo/VI_2.png'),
  derecho_quiasma_opticoAlterada_severo: require('../../../assets/Viasneurologicas/Visual/ViaAfectada/Marron/VI_Marron_2.png'),

  izquierdo_tracto_opticoAlterada_leve: require('../../../assets/Viasneurologicas/Visual/ViaAfectada/Naranja/VI_Naranja_3.png'),
  izquierdo_tracto_opticoAlterada_moderado: require('../../../assets/Viasneurologicas/Visual/ViaAfectada/Rojo/VI_3.png'),
  izquierdo_tracto_opticoAlterada_severo: require('../../../assets/Viasneurologicas/Visual/ViaAfectada/Marron/VI_Marron_3.png'),

  derecho_tracto_opticoAlterada_leve: require('../../../assets/Viasneurologicas/Visual/ViaAfectada/Naranja/VI_Naranja_1.png'),
  derecho_tracto_opticoAlterada_moderado: require('../../../assets/Viasneurologicas/Visual/ViaAfectada/Rojo/VI_1.png'),
  derecho_tracto_opticoAlterada_severo: require('../../../assets/Viasneurologicas/Visual/ViaAfectada/Marron/VI_Marron_1.png'),

  izquierdo_nucleo_geniculadoAlterada_leve: require('../../../assets/CuerpoPng/VisualImg/ViaAfectada/NUCLEO_GENICULADO_IZQUIERDO.png'),
  izquierdo_nucleo_geniculadoAlterada_moderado: require('../../../assets/CuerpoPng/VisualImg/ViaAfectada/NUCLEO_GENICULADO_IZQUIERDO.png'),
  izquierdo_nucleo_geniculadoAlterada_severo: require('../../../assets/CuerpoPng/VisualImg/ViaAfectada/NUCLEO_GENICULADO_IZQUIERDO.png'),

  derecho_nucleo_geniculadoAlterada_leve: require('../../../assets/CuerpoPng/VisualImg/ViaAfectada/NUCLEO_GENICULADO_DERECHO.png'),
  derecho_nucleo_geniculadoAlterada_moderado: require('../../../assets/CuerpoPng/VisualImg/ViaAfectada/NUCLEO_GENICULADO_DERECHO.png'),
  derecho_nucleo_geniculadoAlterada_severo: require('../../../assets/CuerpoPng/VisualImg/ViaAfectada/NUCLEO_GENICULADO_DERECHO.png'),
};

/* ░░░ Contexto ░░░ */
interface ConclusionItem { value: string; title: string }
interface ReportCtx {
  conclusions: ConclusionItem[];
  addConclusion: (c: ConclusionItem) => void;
  removeConclusion: (value: string) => void;
}
const ReportContext = createContext<ReportCtx>({
  conclusions: [], addConclusion: () => { }, removeConclusion: () => { },
});

/* ░░░ Pasos y tipos ░░░ */
const steps = [
  'A', 'B', 'C1', 'C2', 'CB', 'D1', 'D2', 'E', 'E2',
  'F', 'F2', 'G1', 'G2', 'G12', 'G22', 'H',
] as const;

type StepId = typeof steps[number];
type Side = 'izquierdo' | 'derecho' | 'bilateral' | '';
type RootFlow = 'indemne' | 'alterada' | null;
type Severity = 'leve' | 'moderado' | 'severo' | null;
type Tab = 'reporte' | 'lista' | 'GenerarLink';

type UserData = {
  name: string;
  lastname: string;
  idprofessional: string;
  specialty: string;
  email: string;
  imageUrl: string;
};

/* ░░░ Modo lista ░░░ */
const SECTION_ORDER = [
  'Vía visual', 'Fisiopatología', 'Grado',
  'Retardo en la conducción', 'Axonal',
  'Lado', 'Estímulo', 'Topografía',
] as const;
type Section = typeof SECTION_ORDER[number];

const getSection = (c: ConclusionItem): Section | null => {
  const v = c.value.toLowerCase(), t = c.title.toLowerCase();
  if (v === 'indemne' || v === 'alterada' || t.includes('vía visual')) return 'Vía visual';
  if (v.includes('retardo_en_la_conduccion') || v.includes('bloqueo_en_la_conduccion') ||
    v.includes('deficit_neuronal') || v.includes('sin_respuesta') ||
    t.startsWith('por retardo') || t.startsWith('por bloqueo') ||
    t.startsWith('axonal ') || t.startsWith('por ausencia')) return 'Fisiopatología';
  if (v === 'leve' || v === 'moderado' || v === 'severo') return 'Grado';
  if (v.includes('perdida_axonal_secundaria')) return 'Retardo en la conducción';
  if (v.includes('retardo_secundario_en_la_conduccion')) return 'Axonal';
  if (v === 'izquierdo' || v === 'derecho' || v === 'bilateral') return 'Lado';
  if (/_led_flash|damero_/.test(v) || t.startsWith(' al estímulo') || t.startsWith(' al estimular'))
    return 'Estímulo';
  if (/_nervio_optico|_quiasma_optico|_tracto_optico|_nucleo_geniculado/.test(v) ||
    t.includes('topográficamente')) return 'Topografía';
  return null;
};

const VALUE_LABELS: Record<string, string> = {
  indemne: 'Integridad funcional', alterada: 'Defecto',
  retardo_en_la_conduccion: 'Retardo en la conducción',
  bloqueo_en_la_conduccion: 'Bloqueo en la conducción',
  deficit_neuronal: 'Déficit axonal', sin_respuesta: 'Sin respuesta evocable',
  leve: 'Leve', moderado: 'Moderado', severo: 'Severo',
  perdida_axonal_secundaria: 'Pérdida axonal secundaria',
  retardo_secundario_en_la_conduccion: 'Retardo secundario en la conducción',
  izquierdo: 'Izquierdo', derecho: 'Derecho', bilateral: 'Bilateral',
  izquierdo_led_flash: 'Estímulo luminoso', derecho_led_flash: 'Estímulo luminoso',
  izquierdo_led_flashAlterada: 'Estímulo luminoso', derecho_led_flashAlterada: 'Estímulo luminoso',
  damero_total: 'Damero total', damero_hemicampos: 'Damero hemicampos',
  izquierdo_damero_total: 'Damero total', derecho_damero_total: 'Damero total',
  bilateral_damero_total: 'Damero total',
  izquierdo_damero_hemicampos: 'Damero hemicampos', derecho_damero_hemicampos: 'Damero hemicampos',
  bilateral_damero_hemicampos: 'Damero hemicampos',
  izquierdo_nervio_optico: 'Nervio óptico', derecho_nervio_optico: 'Nervio óptico',
  izquierdo_quiasma_optico: 'Quiasma óptico', derecho_quiasma_optico: 'Quiasma óptico',
  izquierdo_tracto_optico: 'Tracto óptico', derecho_tracto_optico: 'Tracto óptico',
  izquierdo_nucleo_geniculado: 'Núcleo geniculado', derecho_nucleo_geniculado: 'Núcleo geniculado',
};

const sanitizeTitle = (t: string) => t
  .replace(/^vía visual con\s*/i, '')
  .replace(/^para lado\s*/i, '')
  .replace(/^de forma\s*/i, '')
  .replace(/^al\s+/i, '')
  .replace(/^y\s+/i, '')
  .replace(/[.,]\s*$/, '')
  .trim();

  // Normaliza y corrige el texto para Reporte/GenerarLinky PDF
const limpiarTextoReporte = (s: string): string => {
  if (!s) return '';
  let t = s;

  // Espacios
  t = t.replace(/\s+/g, ' ').trim();

  // Puntuación: 1 espacio después y ninguno antes
  t = t.replace(/\s*([,;:.])\s*/g, '$1 ');

  // Minúsculas generales
  t = t.toLowerCase();

  // Acrónimos
  t = t.replace(/\bled\b/g, 'LED');

  // Mayúscula inicial de oración (inicio y tras . ! ?)
  t = t.replace(/(^\s*[a-záéíóúñ])|([.!?]\s+[a-záéíóúñ])/g, (m) => m.toUpperCase());

  // Limpieza final intermedia
  t = t.replace(/\s+([,.:;])/g, ' $1').replace(/\s+([,.])$/g, '$1');

  // ✅ Correcciones clave para el final:
  // - quitar espacios finales
  t = t.replace(/\s+$/,'');
  // - comprimir puntuación duplicada al final: ". ." o ".." → "."
  t = t.replace(/([.!?])\s*([.!?])+$/,'$1');

  // - añadir punto final solo si hace falta
  if (!/[.!?]$/.test(t)) t += '.';

  return t;
};


/* ░░░ Figuras movibles ░░░ */
type Figura = {
  id: string;
  tipo: 'circle' | 'square';
  uri: string;
  posicion: { x: number; y: number };
};

/* ░░░ UI helpers ░░░ */
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

const IconCircle: React.FC<{ label?: string; img?: any; onPress?: () => void; disabled?: boolean }> =
  ({ label, img, onPress, disabled }) => (
    <TouchableOpacity style={[styles.iconCircle, disabled && { opacity: 0.9 }]}
      onPress={onPress} disabled={disabled}>
      {img
        ? <Image source={img} style={styles.menuItemIcon} />
        : <Text style={styles.iconText}>{label}</Text>}
    </TouchableOpacity>
  );

/* 🔹 AHORA SÍ: flechas ← y → en el menú de pasos */
/* 🔹 Nav con íconos: Regresar, Refrescar y (opcional) Adelantar */
const NavRow: React.FC<{ onBack: () => void; onReset: () => void; onFwd?: () => void }> =
  ({ onBack, onReset, onFwd }) => (
    <View style={styles.navRow}>
      <TouchableOpacity style={[styles.iconCircle, styles.toolbarIcon]} onPress={onBack}>
        <Image source={I_Regresar} style={styles.menuItemIcon} />
      </TouchableOpacity>

      <TouchableOpacity style={[styles.iconCircle, styles.toolbarIcon]} onPress={onReset}>
        <Image source={I_Refrescar} style={styles.menuItemIcon} />
      </TouchableOpacity>

     
    </View>
  );
const SkipButton: React.FC<{ onPress: () => void; label?: string }> = ({ onPress, label = 'Saltar  ➔' }) => (
  <TouchableOpacity style={styles.skipBtn} onPress={onPress}>
    <Text style={styles.skipTxt}>{label}</Text>
  </TouchableOpacity>
);

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

      {/* Check + mini preview */}
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



/* ========== Panel final (vertical) se mantiene para retrato ========== */
type FinalExportUIVisualProps = {
  isLandscape?: boolean;
  nombrePaciente: string;
  setNombrePaciente: (v: string) => void;
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


const FinalExportUIVisual: React.FC<FinalExportUIVisualProps> = React.memo(
  ({
   isLandscape = false,
    nombrePaciente, setNombrePaciente, manejarSeleccionImagen,
    onToolbarBack, onReset, onExport, exporting, activeTab,
    onOpenGallery, comentarioLista, setComentarioLista, onOpenComentarioModal, imgListaSrc, setImgListaSrc, onGenerateLink, defaultTitle, defaultMessage, autoReportName, onRequestTemplate
  }) => (
    <View style={styles.figBlock}>
      {/* HEADER */}
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
            onPress={() => { console.log('TAP export'); onExport(); }}  
            disabled={exporting}
          >
            <Image source={I_Imprimir} style={[styles.menuItemIcon, isLandscape && styles.menuItemIcon_ls]} />
          </TouchableOpacity>
        </View>
      </View>

     {/* Columna de exportacion (export UI) */}
<View style={[styles.exportColumna, isLandscape && styles.exportColumna_ls]}>
  {/* IZQUIERDA */}
{/* Centro: contenido según tab */}
{activeTab === 'reporte' ? (
  <ExportLeftReporte
    isLandscape
    manejarSeleccionImagen={manejarSeleccionImagen}
  />
) : activeTab === 'lista' ? (
   <ExportLeftLista
    onOpenGallery={onOpenGallery}
    comentario={comentarioLista}
    onOpenModal={onOpenComentarioModal}
    selected={!!imgListaSrc}
    preview={imgListaSrc}
    onClear={() => setImgListaSrc(null)}
  />
) : activeTab === 'GenerarLink' ? (                          // 👈 NUEVO
    <ExportLeftGenerarLink
      onGenerateLink={onGenerateLink}
      onRequestTemplate={onRequestTemplate}
      defaultTitle={defaultTitle}
      defaultMessage={defaultMessage}
      autoReportName={autoReportName}
    />
  ) : null}

  </View>
</View>  
  )
);

type StepHVisualProps = {
  isLandscape?: boolean;
  onBack: () => void;
  onToolbarBack: () => void;
  onReset: () => void;
  onExport: () => void;
  exporting: boolean;
  nombrePaciente: string;
  setNombrePaciente: (v: string) => void;
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

const StepHVisual: React.FC<StepHVisualProps> = React.memo(
  ({   isLandscape = false,
    onBack, onToolbarBack, onReset, onExport, exporting,
    nombrePaciente, setNombrePaciente, manejarSeleccionImagen, activeTab,
    onOpenGallery, comentarioLista, setComentarioLista, onOpenComentarioModal, imgListaSrc, setImgListaSrc, onGenerateLink, defaultTitle, defaultMessage, autoReportName, onRequestTemplate}) => (
    <View>
      <FinalExportUIVisual
        isLandscape={isLandscape}
        nombrePaciente={nombrePaciente}
        setNombrePaciente={setNombrePaciente}
        manejarSeleccionImagen={manejarSeleccionImagen}
        onToolbarBack={onToolbarBack}
        onReset={onReset}
        onExport={onExport}
        exporting={exporting}
        activeTab={activeTab}   // ← NUEVO
        onOpenGallery={onOpenGallery}
        comentarioLista={comentarioLista}
        setComentarioLista={setComentarioLista}
        onOpenComentarioModal={onOpenComentarioModal}
        imgListaSrc={imgListaSrc}                // ← NUEVO
        setImgListaSrc={setImgListaSrc}          // ← NUEVO
        onGenerateLink={onGenerateLink}
        defaultTitle={defaultTitle}
        defaultMessage={defaultMessage}
        autoReportName={autoReportName}
        onRequestTemplate={onRequestTemplate}
      />
    </View>
  )
);


/* ========== Columna izquierda en landscape SOLO para step H ========== */
const LeftColLandscapeFinal: React.FC<{
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
    // 👇 NUEVO: props para el generador de links
  onGenerateLink: LinkUploaderProps['onGenerateLink'];
  defaultTitle: string;
  defaultMessage: string;
  autoReportName?: string;
  onRequestTemplate?: () => Promise<PlantillaId | null>;
}> = ({
  onToolbarBack, onReset, onExport, exporting,
  manejarSeleccionImagen, activeTab,
  onOpenGallery, comentarioLista, setComentarioLista, onOpenComentarioModal, imgListaSrc, setImgListaSrc,
  onGenerateLink, defaultTitle, defaultMessage, autoReportName, onRequestTemplate
}) => {
  return (
    <View style={[styles.landLeft, styles.landCol_ls]}>
      {/* Arriba: toolbar */}
      <View style={styles.toolbarRow}>
        <TouchableOpacity onPress={onToolbarBack} style={[styles.iconCircle, styles.toolbarIcon, styles.iconCircle_ls]}>
          <Image source={I_Regresar} style={[styles.menuItemIcon, styles.menuItemIcon_ls]} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onReset} style={[styles.iconCircle, styles.toolbarIcon, styles.iconCircle_ls]}>
          <Image source={I_Refrescar} style={[styles.menuItemIcon, styles.menuItemIcon_ls]} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconCircle, styles.toolbarIcon, styles.iconCircle_ls]}>
          <Image source={I_Folder} style={[styles.menuItemIcon, styles.menuItemIcon_ls]} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconCircle, styles.toolbarIcon, styles.iconCircle_ls]}
          onPress={onExport}
          disabled={exporting}
        >
          <Image source={I_Imprimir} style={[styles.menuItemIcon, styles.menuItemIcon_ls]} />
        </TouchableOpacity>
      </View>

      {/* Centro: contenido según TAB */}
      {activeTab === 'reporte' && (
        <View style={styles.tituloFiguras}>
          <TouchableOpacity onPress={() => manejarSeleccionImagen('circle')}>
            <Image
              source={require('../../../assets/Figuras/circulo.png')}
              style={[styles.imagenCirculo, styles.imagenCirculo_ls]}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => manejarSeleccionImagen('square')}>
            <Image
              source={require('../../../assets/Figuras/cuadrado.png')}
              style={[styles.imagenCuadro, styles.imagenCuadro_ls]}
            />
          </TouchableOpacity>
        </View>
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
      defaultTitle={defaultTitle}
      defaultMessage={defaultMessage}
      autoReportName={autoReportName}
    />
  )}
    </View>
  );
};


/* ───────────────────────────────────────────────────────────────── */
/*                         Componente principal                      */
/* ───────────────────────────────────────────────────────────────── */
export default function ReporteViasVisualScreen() {
// ====== Estado runtime de la config ======
const [pdf, setPdf] = useState<PdfConfig>(DEFAULT_PDF);
// Tamaños base en puntos PDF
const PT = { A4: { W: 595, H: 842 }, Letter: { W: 612, H: 792 } };
const base = PT[pdf.paper] || PT.A4;
const Wpt = pdf.orientation === 'portrait' ? base.W : base.H;
const Hpt = pdf.orientation === 'portrait' ? base.H : base.W;

// Helper de escala → px reales del canvas RN
const s = pdf.renderScale;
const px = (n: number) => Math.round(n * s);

// Página en px y área “interna” descontando margen
const pageWpx = px(Wpt);
const pageHpx = px(Hpt);
const pad = px(pdf.pageMargin);
const innerW = pageWpx - pad * 2;
const innerH = pageHpx - pad * 2;
const footerReserveRawPx = Math.max(px(pdf.footer.raise ?? 0), 0);
const page1ShiftDownPx = Math.min(Math.max(px(pdf.page1?.shiftDown ?? 0), 0), footerReserveRawPx);
const layoutH = Math.max(innerH - footerReserveRawPx, 0);
const bottomReservePx = 0;

// Header / Footer
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

// Lámina
let laminaWpx = Math.round(innerW * pdf.lamina.widthFrac);
let laminaHpx = Math.round(laminaWpx / BASE_AR);

// Reservas mínimas
const MIN_DIAG = px(pdf.diag.minHeight);
const MIN_LAMINA = px(pdf.lamina.minHeight);

// ── estado para el texto del overlay
const [exportKind, setExportKind] = useState<'pdf' | 'jpeg' | null>(null);
const [exportSuccess, setExportSuccess] = useState<{ filename: string; path: string } | null>(null);
// estado nuevo
const [imgListaAR, setImgListaAR] = useState<number | null>(null);

// ===== Plantillas PDF =====
const [plantillaId, setPlantillaId] = useState<PlantillaId>('none');
const exportBgColor = plantillaId === 'none' ? '#fff' : 'transparent';
const [templatePickerVisible, setTemplatePickerVisible] = useState(false);
const [templatePickerIntent, setTemplatePickerIntent] = useState<'export' | 'link' | null>(null);
const templatePickerPromiseRef = React.useRef<((id: PlantillaId | null) => void) | null>(null);
const [pendingTemplateExport, setPendingTemplateExport] = useState<PlantillaId | null>(null);
const exportarPdfRef = React.useRef<() => Promise<void>>(async () => {});



// === Nombres bonitos y consistentes ===
const STUDY_KEY = 'Visual';               // <- cambia esto en cada pantalla
const STUDY_PREFIX = `mEDXpro${STUDY_KEY}`;        // mEDXproVisual

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

// ——— helpers nuevos ———
const sanitizeFilename = (name: string) =>
  name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w.\- ]+/g, '')
      .replace(/\s+/g, '_');

const ensureLocalFile = async (file: any) => {
  const name = file.name || 'archivo';
  const type = file.type || file.mime || guessMime(name) || 'application/octet-stream';

  // 1) Si viene con uri/path
  let uri: string | undefined = file.uri || file.path;
  if (uri) {
    try {
      if (uri.startsWith('content://')) {
        const st = await ReactNativeBlobUtil.fs.stat(uri);
        // st.path puede venir como file:///... o /storage/...
        const path = decodeURIComponent((st?.path || uri).replace(/^file:\/\//, ''));
        return { name, type, path, uri: 'file://' + path };
      }
      if (uri.startsWith('file://')) {
        const path = decodeURIComponent(uri.replace('file://', ''));
        return { name, type, path, uri: 'file://' + path };
      }
      // ruta “desnuda”
      const path = decodeURIComponent(uri);
      return { name, type, path, uri: 'file://' + path };
    } catch {
      // seguimos abajo a intentar con base64
    }
  }

  // 2) Si viene con base64 en file.data (o dataURI)
  if (file.data) {
    const base64 = String(file.data).startsWith('data:')
      ? String(file.data).split(',')[1]
      : String(file.data);

    const path = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${sanitizeFilename(name)}`;
    await ReactNativeBlobUtil.fs.writeFile(path, base64, 'base64');
    return { name, type, path, uri: 'file://' + path };
  }

  throw new Error('Archivo sin uri ni data');
};

const buildReportPdfArrayBuffer = async ({
  studyType,
  doctorName,
  templateId,
}: { studyType: string; doctorName?: string; templateId?: PlantillaId | null; }): Promise<ArrayBuffer> => {
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

  // 3. Construir PDF usando el servicio centralizado
  return await buildPdfWithTemplate(capturedPages, config);
};

// Genera el PDF actual a archivo temporal y devuelve info básica para subirlo
const buildPdfTempFile = async (filename?: string) => {
  const studyType  = 'Vías Visuales';
  const doctorName =
    [userData?.name, userData?.lastname].filter(Boolean).join(' ') || undefined;

  // Usa tu generador de ArrayBuffer ya existente
  const ab = await buildReportPdfArrayBuffer({ studyType, doctorName });

  // A base64 para grabarlo con BlobUtil
  const base64 = b64encode(ab);

  const RNBU: any = ReactNativeBlobUtil;
  const safeName =
    sanitizeFilename(
      filename || `ReporteViasVisual_${safe(nombrePaciente || 'Paciente')}.pdf`
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


const reportFileName = () => {
  const base = buildBaseName(nombrePaciente);
  return `${base}.pdf`; // mEDXproVisual_<...>.pdf
};




const generateShareLink: LinkUploaderProps['onGenerateLink'] = async ({
  files,
  title,
  message,
  expiry,
  onFileProgress,
  templateId,
}) => {
  const studyType  = 'Vías Visuales';

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
    templateId: (templateId as PlantillaId | null | undefined)
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


// ── nombre de archivo seguro (mover fuera de exportarPDF para reutilizar)
const safe = (s: string) =>
  s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim().replace(/\s+/g, '_');

// ── sincroniza layout y prefetchea el logo antes de capturar
const flushBeforeCapture = async () => {
  Keyboard.dismiss();
  if (userData?.imageUrl) { try { await Image.prefetch(userData.imageUrl); } catch {} }
  await new Promise<void>(r => InteractionManager.runAfterInteractions(() => r()));
  await new Promise<void>(r => requestAnimationFrame(() => r()));
  await new Promise<void>(r => setTimeout(r, 30));
};

// ── captura ambas páginas en el formato indicado
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
// Ajuste para que siempre haya MIN_DIAG
let diagHpx = layoutH - headerTotalHpx - headerGapPx - diagTopGapPx - footerBeforeGapPx - laminaHpx - footerHpx;
if (diagHpx < MIN_DIAG) {
  const deficit = MIN_DIAG - diagHpx;
  laminaHpx = Math.max(MIN_LAMINA, laminaHpx - deficit);
  laminaWpx = Math.round(laminaHpx * BASE_AR);
  diagHpx   = layoutH - headerTotalHpx - headerGapPx - diagTopGapPx - footerBeforeGapPx - laminaHpx - footerHpx;
}

// “pullUp”: sube diagnóstico recortando lámina (no usamos margin negativo)
  if (pdf.diag.pullUp > 0) {
    laminaHpx = Math.max(MIN_LAMINA, laminaHpx - px(pdf.diag.pullUp));
    diagHpx   = layoutH - headerTotalHpx - headerGapPx - diagTopGapPx - footerBeforeGapPx - laminaHpx - footerHpx;
  }

  const [mostrarGaleria, setMostrarGaleria] = useState(false);
  const [imgListaSrc, setImgListaSrc] = useState<ImageSourcePropType | null>(null);
  const [comentarioLista, setComentarioLista] = useState('');
  const [modalComentarioVisible, setModalComentarioVisible] = useState(false);
  const fmt = (s: string) => s.trim().replace(/^./, c => c.toUpperCase());
  /* 🔸 Conclusiones */
  const [conclusions, setConclusions] = useState<ConclusionItem[]>([]);
  const addConclusion = (c: ConclusionItem) =>
    setConclusions(p => p.some(x => x.value === c.value) ? p : [...p, c]);
  const removeConclusion = (value: string) =>
    setConclusions(p => p.filter(x => x.value !== value));

  /* 🔸 Navegación */
  const [step, setStep] = useState<StepId>('A');
  const [history, setHist] = useState<StepId[]>(['A']);
  const goTo = (n: StepId) => { setHist(p => [...p, n]); setStep(n); };
  const goBack = () => {
    if (history.length <= 1) return;
    const nh = history.slice(0, -1);
    setHist(nh); setStep(nh[nh.length - 1]);
    const last = conclusions[conclusions.length - 1];
    if (last) removeConclusion(last.value);
    removeLastOverlayGroup();
  };

  /* 🔸 Overlays */
  const [rootFlow, setRootFlow] = useState<RootFlow>(null);
  const [activeOv, setActiveOv] = useState<string[]>([]);
  const [ovHist, setOvHist] = useState<string[][]>([]);
  const addOverlays = (ids: string[]) => {
    setActiveOv(p => [...p, ...ids.filter(i => !p.includes(i))]);
    setOvHist(h => [...h, ids]);
  };
  const addOverlay = (id: string) => addOverlays([id]);
  const removeLastOverlayGroup = () => setOvHist(h => {
    if (!h.length) return h;
    const last = h[h.length - 1];
    setActiveOv(p => p.filter(k => !last.includes(k)));
    return h.slice(0, -1);
  });

  const resetOverlays = () => { setActiveOv([]); setOvHist([]); };
  

  /* 🔸 Severidad */
  const [severity, setSeverity] = useState<Severity>(null);

  /* 🔸 Otros estados */
  const [side, setSide] = useState<Side>('');
const [activeTab, setActiveTab] = useState<Tab>('reporte'); // ← AÑADIR


  const textoEnunciado = conclusions.map(c => fmt(c.title)).join(' ');

  // Texto corregido para mostrar en Reporte/GenerarLinky para el PDF
const textoReporte = React.useMemo(() => {
  const crudo = conclusions.map(c => (c.title || '').trim()).join(' ');
  return limpiarTextoReporte(crudo);
}, [conclusions]);


  /* 🔸 Figuras arrastrables */
  const [figuras, setFiguras] = useState<Figura[]>([]);
  const [limites, setLimites] = useState({ width: 0, height: 0 });
  const [figSel, setFigSel] = useState<'circle' | 'square' | null>(null);
  const [nombrePaciente, setNombrePaciente] = useState('');

  /* 🔸 Export */
  const exportRef = React.useRef<View>(null);
  const exportRef2 = React.useRef<View>(null);

  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [exporting, setExporting] = useState(false);
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

    return new Promise((resolve) => {
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

  /* 🔸 Dimensiones / orientación */
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // si src es string -> { uri: string } ; si es require(...) -> tal cual
const toImageSource = (src: string | ImageSourcePropType): ImageSourcePropType =>
  typeof src === 'string' ? { uri: src } : src;

  /* 🔸 Helpers */
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
    } catch (e) { console.warn(e); return false; }
  };

  const agregarFigura = (tipo: 'circle' | 'square', uri: string) => {
    // Tamaño base de las figuras (debe coincidir con FIGURA_SIZE de FiguraMovibleVias)
    const figuraSize = FIGURA_SIZE || 56;

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
      },
    }]);
  };

  const manejarSeleccionImagen = async (tipo: 'circle' | 'square') => {
    setFigSel(tipo);
    if (!(await pedirPermiso())) return;
    Alert.alert('Seleccionar imagen', '¿Qué deseas hacer?', [
      {
        text: 'Tomar foto',
        /*onPress: () => launchCamera({ mediaType: 'photo', quality: 1 }, r => {
          if (r.assets?.[0]?.uri) agregarFigura(tipo, r.assets[0].uri);
        }),*/
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

  const actualizarPos = (id: string, x: number, y: number) =>
    setFiguras(p => p.map(f => f.id === id ? { ...f, posicion: { x, y } } : f));
  const eliminarFigura = (id: string) => setFiguras(p => p.filter(f => f.id !== id));

  /* 🔸 Agrupación lista */
  const grouped = React.useMemo(() => {
    const acc: Partial<Record<Section, string[]>> = {};
    conclusions.forEach(c => {
      const sec = getSection(c); if (!sec) return;
      const short = VALUE_LABELS[c.value] ?? sanitizeTitle(c.title);
      const final = fmt(short);
      acc[sec] ??= [];
      if (!acc[sec]!.includes(final)) acc[sec]!.push(final);
    });
    return acc;
  }, [conclusions]);

  
// 🔹 Builder para el "modo lista" con el formato nuevo
const listaVisual = React.useMemo(() => {
  const vals = new Set(conclusions.map(c => c.value));

  const has = (needle: string) =>
    Array.from(vals).some(v => v === needle || v.includes(needle));

  const lines: Array<{ k: string; v: string }> = [];

  // 1) Vía Visual
  const via =
    vals.has('alterada') ? 'Afectada' :
    vals.has('indemne')  ? 'Indemne'  : '';
  if (via) lines.push({ k: 'Vía Visual', v: via });
// 2) Fisiopatología (unir con opcional cuando toque)
let fisio = '';
if (vals.has('retardo_en_la_conduccion')) {
  fisio = 'Retardo en la conducción';
  if (vals.has('perdida_axonal_secundaria')) {
    fisio += ' con pérdida axonal secundaria';
  }
} else if (vals.has('deficit_neuronal')) {
  // Antes: 'Axonal'
  fisio = 'Déficit axonal';
  if (vals.has('retardo_secundario_en_la_conduccion')) {
    fisio += ' con retardo secundario en la conducción';
  }
} else if (vals.has('bloqueo_en_la_conduccion')) {
  fisio = 'Bloqueo en la conducción';
} else if (vals.has('sin_respuesta')) {
  fisio = 'Sin respuesta evocable';
}
if (fisio) lines.push({ k: 'Fisiopatología', v: fisio });


  // 3) Grado
  const grado =
    vals.has('severo')   ? 'Severo'   :
    vals.has('moderado') ? 'Moderado' :
    vals.has('leve')     ? 'Leve'     : '';
  if (grado) lines.push({ k: 'Grado', v: grado });

  // 4) Lado (prefiere el estado side si existe)
  const sideMap: Record<string, string> = { izquierdo: 'Izquierdo', derecho: 'Derecho', bilateral: 'Bilateral' };
  const lado =
    side ? sideMap[side] :
    vals.has('izquierdo') ? 'Izquierdo' :
    vals.has('derecho')   ? 'Derecho'   :
    vals.has('bilateral') ? 'Bilateral' : '';
  if (lado) lines.push({ k: 'Lado', v: lado });

  // 5) Estímulo
  let estimulo = '';
  if (has('damero_total')) estimulo = 'Damero total';
  else if (has('damero_hemicampos')) estimulo = 'Damero hemicampos';
  else if (has('led_flash')) estimulo = 'LED FLASH';
  if (estimulo) lines.push({ k: 'Estímulo', v: estimulo });

  // 6) Ubicación (antes “Topografía”)
  const locs: string[] = [];
  if (has('nervio_optico'))      locs.push('nervio óptico');
  if (has('quiasma_optico'))     locs.push('quiasma óptico');
  if (has('tracto_optico'))      locs.push('tracto óptico');
  if (has('nucleo_geniculado'))  locs.push('núcleo geniculado');
  if (locs.length) {
    lines.push({ k: 'Ubicación', v: `Topográficamente a nivel de ${locs.join(', ')}` });
  }

  return lines;
}, [conclusions, side]);

 /* ─────────────────── Overlays con severidad + base indemne ─────────────────── */
const expandOverlay = (raw: string): string[] => {
  // 1) Normaliza a IDs con lado cuando llega "damero_total"/"damero_hemicampos" o "led_flash"
  const toSideIds = (token: string): string[] => {
    // Para damero y led_flash en modo ALTERADA: SIEMPRE bilateral (ambos lados)
    if (rootFlow === 'alterada' && (token === 'damero_total' || token === 'damero_hemicampos' || token.includes('led_flash'))) {
      const baseToken = token.replace(/^(izquierdo_|derecho_|bilateral_)/, '');
      return [`izquierdo_${baseToken}`, `derecho_${baseToken}`];
    }

    // Para damero en modo INDEMNE: respeta el lado seleccionado
    if (token === 'damero_total' || token === 'damero_hemicampos') {
      if (side === 'bilateral') return [`izquierdo_${token}`, `derecho_${token}`];
      if (side === 'izquierdo' || side === 'derecho') return [`${side}_${token}`];
      console.warn('[Damero] No hay lado seleccionado aún');
      return [];
    }

    if (token.startsWith('bilateral_')) {
      const b = token.replace('bilateral_', '');
      return [`izquierdo_${b}`, `derecho_${b}`];
    }

    return [token]; // ya viene con lado (p. ej. "izquierdo_nervio_optico")
  };

  // 2) Determina el ID alterado (según grado) si existe
  const chooseAltered = (id: string): string | null => {
    if (rootFlow !== 'alterada') return null;
    if (severity) {
      const cand = `${id}Alterada_${severity}`;
      if (OVERLAYS_VISUAL[cand]) return cand;
    }
    const cand2 = `${id}Alterada`;
    if (OVERLAYS_VISUAL[cand2]) return cand2;
    return null;
  };

  // 3) Genera la lista expandida
  const ids = toSideIds(raw);

  // INDEMNE: devuelve tal cual (solo base)
  if (rootFlow === 'indemne') {
    return ids.filter(id => OVERLAYS_VISUAL[id]);
  }

  // ALTERADA:
  // 1. Primero coloca SIEMPRE las bases bilaterales (izquierdo + derecho)
  // 2. Luego coloca las capas alteradas según el lado seleccionado
  const out: string[] = [];

  // Paso 1: Agregar SIEMPRE las bases bilaterales
  ids.forEach(id => {
    if (OVERLAYS_VISUAL[id]) out.push(id);  // base indemne bilateral
  });

  // Paso 2: Agregar las capas alteradas según el lado
  if (side === 'bilateral') {
    // Si es bilateral, agregar capas alteradas de AMBOS lados
    ids.forEach(id => {
      const alt = chooseAltered(id);
      if (alt && alt !== id) out.push(alt);
    });
  } else if (side === 'izquierdo' || side === 'derecho') {
    // Si es un solo lado, agregar SOLO la capa alterada de ese lado
    const relevantId = ids.find(id => id.startsWith(side));
    if (relevantId) {
      const alt = chooseAltered(relevantId);
      if (alt && alt !== relevantId) out.push(alt);
    }
  } else {
    // Fallback: si no hay lado definido, agregar bilateral
    ids.forEach(id => {
      const alt = chooseAltered(id);
      if (alt && alt !== id) out.push(alt);
    });
  }

  // Evita duplicados preservando el orden
  return Array.from(new Set(out));
};

  /* 🔸 Reset total */
  const resetAll = () => {
    setConclusions([]);
    setHist(['A']);
    setStep('A');
    setRootFlow(null);
    setSide('');
    resetOverlays();
    setFiguras([]);
    setNombrePaciente('');
    setFigSel(null);
    setSeverity(null);
    setActiveTab('reporte');
    setComentarioLista('');
    setMostrarGaleria(false);
    setImgListaSrc(null);
    setTextoEditadoManualmente(false);
  };

  const [rerenderKey, setRerenderKey] = useState(0);
  const [userData, setUserData] = useState<UserData | null>(null);
  const AnimatedLetters: any = AnimatedLetterText;

  /////////////////////
  const [textoVisual, setTextoVisual] = useState('');
  const [textoEditadoManualmente, setTextoEditadoManualmente] = useState(false);
 useEffect(() => {
    // cada vez que se recalcula textoReporte, actualiza el editable
    // solo actualiza si no se ha editado manualmente
    if (!textoEditadoManualmente) {
      setTextoVisual(textoReporte);
    }
  }, [textoReporte, textoEditadoManualmente]);

// ===== Defaults para la pestaña "Generar Link" =====
const linkDefaults = React.useMemo(() => {
  // Título personalizado según el tipo de estudio
  let tipoEstudio = 'Potenciales Evocados';

  // En Visual siempre es "Potenciales Evocados" (vías visuales)
  // pero mantenemos la estructura por consistencia con otros reportes

  const titulo = nombrePaciente
    ? `${tipoEstudio} — ${nombrePaciente}`
    : tipoEstudio;

  return {
    defaultTitle: titulo,
    defaultMessage: 'Saludos...',  // ✅ Siempre "Saludos..." por defecto
    autoReportName: reportFileName(),
  };
}, [nombrePaciente, textoVisual, textoReporte]);



// ===== Handler para generar el link =====
// Helper muy simple para deducir MIME por extensión
const guessMime = (name?: string) => {
  const ext = name?.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'webp': return 'image/webp';
    default: return undefined;
  }
};

const handleGenerateLink: LinkUploaderProps['onGenerateLink'] = async (payload) => {
  try {
    const uploadedIds: string[] = [];

    // Si no hay archivos en el payload, generamos el PDF actual:
    let files = payload.files || [];
 if (!files || files.length === 0) {
  const filename =
    linkDefaults.autoReportName ??
    `ReporteViasVisual_${safe(nombrePaciente || 'Paciente')}.pdf`;

  const auto = await buildPdfTempFile(filename);
  files = [{ id: 'auto-pdf', name: auto.name, type: auto.type, uri: auto.uri }];
}



    for (const f of files) {
      const nf = await ensureLocalFile(f);

      const form = new FormData();
      form.append('file', {
        // @ts-ignore RN FormData file
        uri: nf.uri,              // **SIEMPRE** file://...
        name: nf.name,
        type: nf.type,
      } as any);

      const resUp = await axios.post(`${BASE_URL}/upload`, form, {
        // No fuerces 'Content-Type': deja que axios ponga el boundary
        headers: { Accept: 'application/json' },
        transformRequest: d => d,   // importante en RN para FormData
        onUploadProgress: (e) => {
          const pct = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
          payload.onFileProgress(f.id, pct);
        },
      });

      const id = resUp.data?.id ?? resUp.data?.fileId;
      if (!id) throw new Error('Respuesta de subida inválida');
      uploadedIds.push(id);
    }

    const resLink = await axios.post(`${BASE_URL}/share-links`, {
      title: payload.title,
      message: payload.message ?? '',
      expiry: payload.expiry,   // '24h' | '5d'
      files: uploadedIds,
    });

    const url: string | undefined = resLink.data?.url ?? resLink.data?.link;
    if (!url) throw new Error('No se recibió la URL del link');

    return url;
  } catch (err: any) {
    // muestra algo legible
    const msg = err?.response
      ? `${err.response.status} ${err.response.statusText} — ${JSON.stringify(err.response.data)}`
      : (err?.message || String(err));
    Alert.alert('Error', `No se pudo generar el link.\n\n${msg}`);
    throw err;
  }
};



  useEffect(() => {
  (async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const res = await axios.post(`${BASE_URL}/userdata`, { token });
      const ud = res?.data?.data;
      if (ud) {
        setUserData(ud);
        if (ud.imageUrl) {
          // Prefetch para que el logo esté listo al capturar
          Image.prefetch(ud.imageUrl).catch(() => {});
        }
      }
    } catch (e) {
      console.warn('No se pudo obtener el usuario para el PDF', e);
    }
  })();
}, []);


  /* ─────────────────── Steps (igual que antes) ─────────────────── */
  const StepA = () => (
    <View>
      <Text style={styles.stepTitle}>VÍA VISUAL</Text>
      <ConclusionBtn value="indemne" title="Vía visual con integridad funcional " label="INDEMNE"
        onPress={() => { setRootFlow('indemne'); setSeverity(null); addOverlay('indemne'); goTo('E2'); }} />
      <ConclusionBtn value="alterada" title="Vía visual con defecto " label="ALTERADA"
        onPress={() => {
          setRootFlow('alterada');
          setSeverity(null);
          // Agregar inmediatamente las bases bilaterales VI_8 (izq) y VI_7 (der)
          addOverlays(['alterada', 'base_bilateral_izquierdo', 'base_bilateral_derecho']);
          goTo('B');
        }} />
    </View>
  );

  const StepB = () => {
    const { addConclusion } = useContext(ReportContext); // ← NUEVO
    return(
    <View>
      <NavRow
  onBack={() => {
    ['indemne','alterada','retardo_en_la_conduccion','bloqueo_en_la_conduccion','deficit_neuronal','sin_respuesta']
      .forEach(removeConclusion);
    setSeverity(null);
    setRootFlow(null);  // ← IMPORTANTE: resetear el rootFlow
    // Remover los overlays de base bilateral agregados en StepA
    removeLastOverlayGroup();  // remueve las bases bilaterales
    setStep('A');
  }}
  onReset={resetAll}
/>

      <Text style={styles.stepTitle}>FISIOPATOLOGÍA:</Text>
      <ConclusionBtn value="retardo_en_la_conduccion" title="Por retardo en la conducción " label="RETARDO EN LA CONDUCCIÓN" onPress={() => goTo('C1')} />
      <ConclusionBtn value="bloqueo_en_la_conduccion" title="Por bloqueo en la conducción " label="BLOQUEO EN LA CONDUCCIÓN" onPress={() => goTo('CB')} />  
      <ConclusionBtn value="deficit_neuronal" title="Axonal" label="DÉFICIT AXONAL" onPress={() => goTo('C2')} />
      <ConclusionBtn value="sin_respuesta" title="Por ausencia de respuesta evocable " label="SIN RESPUESTA" onPress={() => {setSeverity('severo'); addConclusion({ value: 'severo', title: 'Severo ' }); goTo('E');}}/>
    </View>
    )
  };

  const StepC1 = () => (
    <View>
<NavRow
  onBack={() => { ['leve','moderado','severo'].forEach(removeConclusion); setSeverity(null); setStep('B'); }}
onReset={resetAll}/>
      <Text style={styles.stepTitle}>GRADO:</Text>
      <ConclusionBtn value="leve" title="Leve " label="LEVE" onPress={() => { setSeverity('leve'); goTo('D1'); }} />
      <ConclusionBtn value="moderado" title="Moderado " label="MODERADO" onPress={() => { setSeverity('moderado'); goTo('D1'); }} />
      <ConclusionBtn value="severo" title="Severo " label="SEVERO" onPress={() => { setSeverity('severo'); goTo('D1'); }} />
    </View>
  );
const StepCB = () => (
  <View>
  <NavRow
  onBack={() => { ['leve','moderado','severo'].forEach(removeConclusion); setSeverity(null); setStep('B'); }}
onReset={resetAll}/>
    <Text style={styles.stepTitle}>GRADO:</Text>
    <ConclusionBtn
      value="leve"
      title="Leve "
      label="LEVE"
      onPress={() => { setSeverity('leve'); goTo('E'); }}  // ← luego sigue como estaba (LADO)
    />
    <ConclusionBtn
      value="moderado"
      title="Moderado "
      label="MODERADO"
      onPress={() => { setSeverity('moderado'); goTo('E'); }}
    />
    <ConclusionBtn
      value="severo"
      title="Severo "
      label="SEVERO"
      onPress={() => { setSeverity('severo'); goTo('E'); }}
    />
  </View>
);

  const StepC2 = () => (
    <View>
<NavRow
  onBack={() => { ['leve','moderado','severo'].forEach(removeConclusion); setSeverity(null); setStep('B'); }}
onReset={resetAll}/>
      <Text style={styles.stepTitle}>GRADO:</Text>
      <ConclusionBtn value="leve" title="Leve " label="LEVE" onPress={() => { setSeverity('leve'); goTo('D2'); }} />
      <ConclusionBtn value="moderado" title="Moderado " label="MODERADO" onPress={() => { setSeverity('moderado'); goTo('D2'); }} />
      <ConclusionBtn value="severo" title="Severo " label="SEVERO" onPress={() => { setSeverity('severo'); goTo('D2'); }} />
    </View>
  );

  const StepD1 = () => (
    <View>
      <NavRow
  onBack={() => {
    ['indemne','alterada','retardo_en_la_conduccion','bloqueo_en_la_conduccion','deficit_neuronal','sin_respuesta','perdida_axonal_secundaria']
      .forEach(removeConclusion);
    setSeverity(null);
    setStep('C1');
  }}
  onReset={resetAll}
  onFwd={() => goTo('E')}
/>

      <Text style={styles.stepTitle}>RETARDO EN CONDUCCIÓN:</Text>
      <ConclusionBtn value="perdida_axonal_secundaria" title=" y pérdida axonal secundaria " label="+ PÉRDIDA AXONAL" onPress={() => goTo('E')} />
     {/* 👇 botón de saltar abajo */}
    <SkipButton onPress={() => goTo('E')} />
    </View>
  );

  const StepD2 = () => (
    <View>
      <NavRow
  onBack={() => {
    ['indemne','alterada','retardo_en_la_conduccion','bloqueo_en_la_conduccion','deficit_neuronal','sin_respuesta','retardo_secundario_en_la_conduccion']
      .forEach(removeConclusion);
    setSeverity(null);
    setStep('C2');
  }}
onReset={resetAll}  onFwd={() => goTo('E')}
/>

      <Text style={styles.stepTitle}>AXONAL:</Text>
      <ConclusionBtn value="retardo_secundario_en_la_conduccion" title="y retardo secundario en la conducción " label="+ RETARDO EN LA CONDUCCIÓN" onPress={() => goTo('E')} />
    {/* 👇 botón de saltar abajo */}
    <SkipButton onPress={() => goTo('E')} />
    </View>
  );

  const StepE = () => (
    <View>
      <NavRow
  onBack={() => {
    ['perdida_axonal_secundaria','retardo_secundario_en_la_conduccion','leve','moderado','severo','izquierdo','derecho','bilateral']
      .forEach(removeConclusion);
    setSeverity(null);
    setStep('B');
  }}
onReset={resetAll}
/>

      <Text style={styles.stepTitle}>LADO:</Text>
      <ConclusionBtn value="izquierdo" title="Para lado izquierdo," label="IZQUIERDO" onPress={() => { setSide('izquierdo'); goTo('F'); }} />
      <ConclusionBtn value="derecho" title="Para lado derecho," label="DERECHO" onPress={() => { setSide('derecho'); goTo('F'); }} />
      <ConclusionBtn value="bilateral" title="De forma bilateral," label="BILATERAL" onPress={() => { setSide('bilateral'); goTo('F'); }} />
      {rootFlow === 'alterada' && severity && (
        <Text style={{ color: '#fff', textAlign: 'center', marginTop: 8 }}>Grado seleccionado: {severity.toUpperCase()}</Text>
      )}
    </View>
  );

  const StepE2 = () => (
    <View>
      <NavRow
  onBack={() => {
    [
      `${side}led_flash`, `${side}nervio_optico`, `${side}quiasma_optico`,
      `${side}tracto_optico`, `${side}nucleo_geniculado`,
      `${side}damero_total`, `${side}damero_hemicampos`,
      'indemne','izquierdo','derecho','bilateral'
    ].forEach(v => v && removeConclusion(v));
    setStep('A');
  }}
onReset={resetAll}
/>

      <Text style={styles.stepTitle}>LADO:</Text>
      <ConclusionBtn value="izquierdo" title="Para lado izquierdo," label="IZQUIERDO" onPress={() => { setSide('izquierdo'); goTo('F2'); }} />
      <ConclusionBtn value="derecho" title="Para lado derecho," label="DERECHO" onPress={() => { setSide('derecho'); goTo('F2'); }} />
      <ConclusionBtn value="bilateral" title="De forma bilateral," label="BILATERAL" onPress={() => { setSide('bilateral'); goTo('F2'); }} />
    </View>
  );

  const StepF = () => (
    <View>
      <NavRow
  onBack={() => {
    [
      `${side}led_flashAlterada`, 'damero_total', 'damero_hemicampos',
      `${side}nervio_optico`, `${side}quiasma_optico`,
      `${side}tracto_optico`, `${side}nucleo_geniculado`
    ].forEach(v => v && removeConclusion(v));
    setStep('E');
  }}
onReset={resetAll}
/>

      <Text style={styles.stepTitle}>ESTÍMULO:</Text>
      <ConclusionBtn value={`${side}led_flashAlterada`} title=" al estímulo luminoso." label="LED FLASH"
        onPress={() => { addOverlays(expandOverlay(`${side}_led_flash`)); goTo('H'); }} />
      <ConclusionBtn value="damero_total" title=" al estimular área prequiasmática" label="DAMERO TOTAL"
        onPress={() => { addOverlays(expandOverlay('damero_total')); goTo('G12'); }} />
      <ConclusionBtn value="damero_hemicampos" title=" al estimular área retroquiasmática" label="DAMERO HEMICAMPOS"
        onPress={() => { addOverlays(expandOverlay('damero_hemicampos')); goTo('G22'); }} />
      {rootFlow === 'alterada' && severity && (
        <Text style={{ color: '#fff', textAlign: 'center', marginTop: 8 }}>Grado: {severity.toUpperCase()}</Text>
      )}
    </View>
  );

  const StepF2 = () => (
    <View>
     <NavRow
  onBack={() => {
    [
      `${side}led_flash`, `${side}nervio_optico`, `${side}quiasma_optico`,
      `${side}tracto_optico`, `${side}nucleo_geniculado`,
      'damero_total', 'damero_hemicampos'
    ].forEach(v => v && removeConclusion(v));
    setStep('E2');
  }}
onReset={resetAll}
/>

      <Text style={styles.stepTitle}>ESTÍMULO:</Text>
      <ConclusionBtn value={`${side}led_flash`} title=" al estímulo luminoso." label="LED FLASH"
        onPress={() => { addOverlays(expandOverlay(`${side}_led_flash`)); goTo('H'); }} />
      <ConclusionBtn value={`${side}damero_total`} title=" al estimular área prequiasmática mediante campo completo." label="DAMERO TOTAL"
        onPress={() => { addOverlays(expandOverlay('damero_total')); goTo('H'); }} />
      <ConclusionBtn value={`${side}damero_hemicampos`} title=" al estimular área retroquiasmática mediante hemicampos." label="DAMERO HEMICAMPOS"
        onPress={() => { addOverlays(expandOverlay('damero_hemicampos')); goTo('H'); }} />
    </View>
  );

  const StepG1 = () => (
    <View>
      <NavRow
  onBack={() => {
    [`${side}nervio_optico`, `${side}quiasma_optico`].forEach(v => v && removeConclusion(v));
    setStep('F');
  }}
onReset={resetAll}/>

      <Text style={styles.stepTitle}>NIVEL PREQUIASMÁTICA:</Text>
      <ConclusionBtn value={`${side}nervio_optico`} title="; topográficamente a nivel de nervio óptico." label="NERVIO ÓPTICO"
        onPress={() => { addOverlays(expandOverlay(`${side}_nervio_optico`)); goTo('H'); }} />
    </View>
  );

  const StepG2 = () => (
    <View>
    <NavRow
  onBack={() => {
    [
      `${side}led_flash`, `${side}nervio_optico`, `${side}quiasma_optico`,
      `${side}tracto_optico`, `${side}nucleo_geniculado`
    ].forEach(v => v && removeConclusion(v));
    setStep('F');
  }}
onReset={resetAll}
/>

      <Text style={styles.stepTitle}>NIVEL RETROQUIASMÁTICA:</Text>
      <ConclusionBtn value={`${side}quiasma_optico`} title="; topográficamente a nivel de quiasma óptico." label="QUIASMA ÓPTICO"
        onPress={() => { addOverlays(expandOverlay(`${side}_quiasma_optico`)); goTo('H'); }} />
      <ConclusionBtn value={`${side}tracto_optico`} title="; topográficamente a nivel de tracto óptico." label="TRACTO ÓPTICO"
        onPress={() => { addOverlays(expandOverlay(`${side}_tracto_optico`)); goTo('H'); }} />
      <ConclusionBtn value={`${side}nucleo_geniculado`} title="; topográficamente a nivel de núcleo geniculado." label="NÚCLEO GENICULADO"
        onPress={() => { addOverlays(expandOverlay(`${side}_nucleo_geniculado`)); goTo('H'); }} />
    </View>
  );

  const StepG12 = () => (
    <View>
     <NavRow
  onBack={() => {
    [
      `${side}led_flash`, `${side}nervio_optico`, `${side}quiasma_optico`,
      `${side}tracto_optico`, `${side}nucleo_geniculado`
    ].forEach(v => v && removeConclusion(v));
    setStep('F2');
  }}
onReset={resetAll}/>

      <Text style={styles.stepTitle}>NIVEL PREQUIASMÁTICA:</Text>
      <ConclusionBtn value={`${side}nervio_optico`} title="; topográficamente a nivel de nervio óptico." label="NERVIO ÓPTICO"
        onPress={() => { addOverlays(expandOverlay(`${side}_nervio_optico`)); goTo('H'); }} />
    </View>
  );

  const StepG22 = () => (
    <View>
     <NavRow
  onBack={() => {
    [
      `${side}led_flash`, `${side}nervio_optico`, `${side}quiasma_optico`,
      `${side}tracto_optico`, `${side}nucleo_geniculado`
    ].forEach(v => v && removeConclusion(v));
    setStep('F2');
  }}
onReset={resetAll}
/>

      <Text style={styles.stepTitle}>NIVEL RETROQUIASMÁTICA:</Text>
      <ConclusionBtn value={`${side}quiasma_optico`} title="; topográficamente a nivel de quiasma óptico." label="QUIASMA ÓPTICO"
        onPress={() => { addOverlays(expandOverlay(`${side}_quiasma_optico`)); goTo('H'); }} />
      <ConclusionBtn value={`${side}tracto_optico`} title="; topográficamente a nivel de tracto óptico." label="TRACTO ÓPTICO"
        onPress={() => { addOverlays(expandOverlay(`${side}_tracto_optico`)); goTo('H'); }} />
      <ConclusionBtn value={`${side}nucleo_geniculado`} title="; topográficamente a nivel de núcleo geniculado." label="NÚCLEO GENICULADO"
        onPress={() => { addOverlays(expandOverlay(`${side}_nucleo_geniculado`)); goTo('H'); }} />
    </View>
  );

  /* ─────────── Export: Canvas virtual y función ─────────── */
// ACEPTA tamaño explícito para el export y reescala posiciones/figuras
const CanvasView: React.FC<{ w?: number; h?: number; transparentBg?: boolean }> = ({
  w,
  h,
  transparentBg = false,
}) => {
  const size = w && h ? { w, h } : imgSize;
  if (!size) return null;

  // límites de la lámina visible
  const vw = limites.width || 1;
  const vh = limites.height || 1;

  // escalas pantalla -> export
  const kx = size.w / vw;
  const ky = size.h / vh;
  const k  = Math.min(kx, ky);
  const ox = (size.w - vw * k) / 2;
  const oy = (size.h - vh * k) / 2;

  const figBaseCircle = FIGURA_SIZE;
  const figBaseSquare = FIGURA_SIZE;
  const figBorderPx = 1.2;
  const figBorderColor = '#808080';

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
      {/* Base y overlays ocupan TODO el canvas export (misma AR de la lámina) */}
      <Image
        source={baseImage}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: size.w,
          height: size.h,
        }}
        resizeMode="contain"
      />
      {activeOv.map(kOv => {
        const src = OVERLAYS_VISUAL[kOv];
        if (!src) return null;
        return (
          <Image
            key={`exp_${kOv}`}
            source={src}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: size.w,
              height: size.h,
            }}
            resizeMode="contain"
          />
        );
      })}

      {/* Figuras: misma escala (k) en X y Y + offsets para centrar */}
      {figuras.map(f => {
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
              borderWidth,
              borderColor: figBorderColor,
              overflow: 'hidden',
              backgroundColor: 'transparent',
            }}
          >
            <Image
              source={{ uri: f.uri }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>
        );
      })}
    </View>
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
    setExporting(true);

    // Generar PDF usando el servicio centralizado
    const studyType = 'Vías Visuales';
    const doctorName = [userData?.name, userData?.lastname].filter(Boolean).join(' ') || undefined;

    const ab = await buildReportPdfArrayBuffer({
      studyType,
      doctorName,
      templateId: plantillaId
    });

    const base64Pdf = b64encode(ab);

    const filename = reportFileName();

    // Permisos Android antiguos
    if (Platform.OS === 'android' && Platform.Version <= 28) {
      const w = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );
      if (w !== PermissionsAndroid.RESULTS.GRANTED) {
        throw new Error('WRITE_EXTERNAL_STORAGE no otorgado');
      }
    }

    // Guardado
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

  /* dispatcher */
  const currentStep = (): JSX.Element | null => {
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
      case 'F2': return <StepF2 />;
      case 'G1': return <StepG1 />;
      case 'G2': return <StepG2 />;
      case 'G12': return <StepG12 />;
      case 'G22': return <StepG22 />;
     case 'H':
  return (
    <StepHVisual
      isLandscape={isLandscape}
      onBack={goBack}
      onToolbarBack={goBack}
      onReset={resetAll}
      onExport={handleExportRequest}
      exporting={exporting}
      nombrePaciente={nombrePaciente}
      setNombrePaciente={setNombrePaciente}
      manejarSeleccionImagen={manejarSeleccionImagen}
      activeTab={activeTab}   // ← NUEVO
      onOpenGallery={() => setMostrarGaleria(true)}     // 👈 nuevo
      comentarioLista={comentarioLista}                 // 👈 nuevo
      setComentarioLista={setComentarioLista}           // 👈 nuevo
      onOpenComentarioModal={() => setModalComentarioVisible(true)}
      imgListaSrc={imgListaSrc}                  // ← NUEVO
      setImgListaSrc={setImgListaSrc}            // ← NUEVO
      onGenerateLink={generateShareLink}
      defaultTitle={linkDefaults.defaultTitle}
      defaultMessage={linkDefaults.defaultMessage}
      autoReportName={linkDefaults.autoReportName}
      onRequestTemplate={requestTemplateForLink}
    />
  );
      default: return null;
    }
  };

  //const [isEditingVisual, setIsEditingVisual] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  /* ─────────────────────────── UI ─────────────────────────── */
  return (
    <ReportContext.Provider value={{ conclusions, addConclusion, removeConclusion }}>
      <View style={styles.container}>

        {/* Barra superior: input de paciente */}
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

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {isLandscape ? (
            /* ========= HORIZONTAL: 3 columnas (30/40/30) ========= */
            <View style={styles.landRow}>

              {/* Columna IZQUIERDA */}
              <View style={[styles.landLeft, styles.landCol_ls]}>
                {step === 'H'
                  ? (
                    <LeftColLandscapeFinal
                     onToolbarBack={goBack}
                     onReset={resetAll}
                     onExport={handleExportRequest}
                     exporting={exporting}
                     manejarSeleccionImagen={manejarSeleccionImagen}
                     activeTab={activeTab}
                     onOpenGallery={() => setMostrarGaleria(true)}     // 👈 nuevo
                     comentarioLista={comentarioLista}                 // 👈 nuevo
                     setComentarioLista={setComentarioLista}           // 👈 nuevo
                     onOpenComentarioModal={() => setModalComentarioVisible(true)}
                     imgListaSrc={imgListaSrc}                 // ← NUEVO
                     setImgListaSrc={setImgListaSrc}           // ← NUEVO
                      // 👇 NUEVO: props para Generar Link
                    onGenerateLink={generateShareLink}
                    defaultTitle={linkDefaults.defaultTitle}
                    defaultMessage={linkDefaults.defaultMessage}
                    autoReportName={linkDefaults.autoReportName}
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
                  style={[styles.imageBox, styles.imageBoxLandscape, { aspectRatio: BASE_AR }]}
                  onLayout={e => {
                    const { width, height } = e.nativeEvent.layout;
                    setLimites({ width, height });
                    setImgSize({ w: width, h: height });
                  }}>
                  {!!nombrePaciente && <Text style={styles.pacienteBadge}>{nombrePaciente}</Text>}

                  <Image source={IMG_BASE} style={styles.layer} resizeMode="contain" />
                  {activeOv.map(k => {
                    const src = OVERLAYS_VISUAL[k]; if (!src) return null;
                    return <Image key={k} source={src} style={styles.layer} resizeMode="contain" />;
                  })}
                  {figuras.map(f => (
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

              {/* Columna DERECHA: modo + resumen */}
              <View style={[styles.landRight, styles.landCol_ls]}>
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


                <View style={[styles.repBox, styles.repBoxLandscape]}>
                  <Text style={styles.repTitle}>Vía Visual</Text>
                {activeTab === 'lista' ? (
  listaVisual.map(({ k, v }) => (
    <Text key={k} style={styles.repTxt}>
      <Text style={{ fontWeight: 'bold' }}>{k} - </Text>{v}
    </Text>
  ))
) : (
  // Para 'reporte' y 'GenerarLink' sigues mostrando el enunciado
  <Text style={[styles.repTxt, styles.justify]}>{textoReporte}</Text>
)}


                </View>
              </View>
            </View>
          ) : (
            /* ========= VERTICAL (layout original) ========= */
            <>
              {/* Imagen + overlays + figuras */}
              <View
                style={[styles.imageBox, { aspectRatio: BASE_AR }]}
                onLayout={e => {
                  const { width, height } = e.nativeEvent.layout;
                  setLimites({ width, height });
                  setImgSize({ w: width, h: height });
                }}>
                {!!nombrePaciente && <Text style={styles.pacienteBadge}>{nombrePaciente}</Text>}

                <Image source={IMG_BASE} style={styles.layer} resizeMode="contain" />
                {activeOv.map(k => {
                  const src = OVERLAYS_VISUAL[k]; if (!src) { console.warn('[Overlay faltante]', k); return null; }
                  return <Image key={k} source={src} style={styles.layer} resizeMode="contain" />;
                })}
                {figuras.map(f => (
                  <FiguraMovible
                    key={f.id}
                    id={f.id}
                    uri={f.uri}
                    tipo={f.tipo}
                    posicionInicial={f.posicion}
                    limitesContenedor={limites}
                    onActualizarPosicion={actualizarPos}
                    onEliminar={eliminarFigura}
                  />
                ))}
              </View>
              {/* Card del paso */}
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
                      <Text style={styles.modeTxt}>Generar Link</Text>
                    </TouchableOpacity> 
                  </View>
                  

              {/* Resumen */}
              <View style={styles.repBox}>
                <Text style={styles.repTitle}>Vía Visual</Text>
              {activeTab === 'lista' ? (
                listaVisual.map(({ k, v }) => (
                  <Text key={k} style={styles.repTxt}>
                    <Text style={{ fontWeight: 'bold' }}>{k} - </Text>{v}
                  </Text>
                ))
              ) : (
                // Para 'reporte' y 'GenerarLink' sigues mostrando el enunciado
                <View>
                  <Text style={[styles.repTxt, styles.justify]}>
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
      setMostrarGaleria(false);
      setActiveTab('lista');
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
    padding: pad,                     // 👈 margen de página aplicado aquí
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
    backgroundColor: 'transparent',
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
      {nombrePaciente || 'Sin especificar'}
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

  {headerGapPx > 0 && (
    <View style={{ height: headerGapPx }} />
  )}

{/* LÁMINA */}
<View style={{
  width: '100%',
  alignItems: 'center',
  backgroundColor: 'transparent',  // CanvasView aporta fondo blanco solo cuando no hay plantilla
}}>
  <CanvasView w={laminaWpx} h={laminaHpx} transparentBg={plantillaId !== 'none'} />
</View>

  {diagTopGapPx > 0 && (
    <View style={{ height: diagTopGapPx }} />
  )}

{/* DIAGNÓSTICO */}
<View style={{
  height: diagHpx,
  backgroundColor: 'transparent',
  justifyContent: 'flex-start',
  paddingHorizontal: px(pdf.diag.padH),
  paddingVertical: px(pdf.diag.padV),
  overflow:'hidden',
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


  {footerBeforeGapPx > 0 && (
    <View style={{ height: footerBeforeGapPx }} />
  )}

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
{/* ====== SEGUNDA HOJA (oculta) ====== */}
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
    padding: pad,              // mismo margen “visual” que la 1ª hoja
  }}
  collapsable={false}
  renderToHardwareTextureAndroid
  needsOffscreenAlphaCompositing
>
  {/* Layout en 2 filas: arriba (2 columnas) / abajo (imagen) */}
  <View style={{ flex: 1, flexDirection: 'column' }}>
    {/* arriba del contenido de la hoja 2 */}
    <View style={{ height: px(Math.max(0, (pdf.page2?.shiftDown ?? 0) - 5)) }} />
    <View style={{ flexDirection: 'row', flex: 1 }}>
      {/* Columna izquierda: LISTA */}
      <View style={{
        flex: 1,
        marginRight: px(6),
        paddingVertical: px(10),
        paddingLeft: px(50),
        paddingRight: px(14),
      }}>
        <Text style={{
          fontWeight: '700',
          fontSize: px(12),
          marginBottom: px(6),
          color: '#000',
        }}>
          
        </Text>

        {/* Render de la “lista” en el mismo formato que la UI */}
{listaVisual.length ? (
  listaVisual.map(({ k, v }) => (
    <Text
      key={k}
      style={{ fontSize: px(9.2), color: '#000', marginBottom: px(4), lineHeight: px(13) }}
    >
      <Text style={{ fontWeight: '700' }}>{k} - </Text>
      {v}
    </Text>
  ))
) : (
  <Text style={{ fontSize: px(9.2), color: '#666' }}>
    Sin datos de lista.
  </Text>
)}

      </View>

      {/* Columna derecha: COMENTARIO */}
      <View style={{
        flex: 1,
        marginLeft: px(2),
        paddingVertical: px(10),
        paddingRight: px(14),
        paddingLeft: px(8),
      }}>
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
  marginTop: px(30),            
  justifyContent: 'flex-start',    
}}>
  {imgListaSrc ? (
    <Image
      source={imgListaSrc as ImageSourcePropType}
      resizeMode="contain"
      style={{
        width: '100%',
        height: undefined,        
        aspectRatio: imgListaAR || 16/9,  
        maxHeight: '100%',         
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
      {/* Overlay de carga mientras se exporta */}
      {exporting && (
  <View style={styles.loadingOverlay}>
    <Circle size={40} color="#ff9100ff" />
    <AnimatedLetters
      value={exportKind === 'pdf' ? 'Exportando PDF' : exportKind === 'jpeg' ? 'Exportando JPEG' : 'Exportando…'}
      letterStyle={styles.loadingText}
      animationDirection="bottom-to-top"
      isSameAnimationDelay
      animateOnLoada
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

/* ░░░ Estilos ░░░ */
const styles = StyleSheet.create({
  justify: { textAlign: 'justify' },
  container: { flex: 1, backgroundColor: '#000' ,position: 'relative' },

  topBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 10
  },
  title: {
    color: '#fff', backgroundColor: '#222', paddingVertical: 4, paddingHorizontal: 12,
    borderRadius: 8, fontSize: 22, fontFamily: 'LuxoraGrotesk-Italic'
  },

  iconContainer: { flexDirection: 'row', width: 200, justifyContent: 'space-between' },
  iconText: { color: '#ff4500', fontWeight: 'bold' },

  /* Importante: hace que el row landscape se estire y no deje huecos */
  scrollContent: { padding: 10, flexGrow: 1 },

  imageBox: {
    width: '100%', backgroundColor: '#222', borderRadius: 20,
    overflow: 'hidden', marginBottom: 16, position: 'relative'       // ← antes 10, da más aire con el card

  },
  imageBoxLandscape: {
    marginBottom: 0,
    alignSelf: 'stretch',
  },
  layer: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },

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

  stepCard: {
    backgroundColor: '#000', borderWidth: 1, borderColor: '#fff',
    borderRadius: 12, padding: 12,  marginBottom: 16,        // ← separa del Selector modo

    
  },
  stepTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  conclusionBtn: { backgroundColor: '#111', borderRadius: 30, borderWidth: 1, borderColor: '#444', paddingVertical: 12, marginBottom: 8 },
  conclusionBtnText: { color: '#fff', textAlign: 'center', fontSize: 14 },

  navRow: { flexDirection: 'row', marginBottom: 10, justifyContent: 'center' },
  navBtn: { backgroundColor: '#000', borderRadius: 10, padding: 6, marginHorizontal: 6, borderWidth: 1, borderColor: '#fff' },
  navTxt: { color: '#fff', fontSize: 20 },

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
  nombrePacienteContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  labelPaciente: {
    fontSize: 14,
    color: '#fff',
  },
  inputPaciente: {
    paddingVertical: 6,
    paddingHorizontal: 7,
    backgroundColor: '#333',
    borderRadius: 6,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#666',
    width: '80%',
  },

  /* fig / paciente */
  figBlock: { marginTop: 10, alignItems: 'center'},

  // badge visible en la lámina (no en el canvas de export)
  pacienteBadge: {
    position: 'absolute',
    top: 8, left: 8, zIndex: 3,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12, fontWeight: '600'
  },

  /* Layout export en dos columnas (usado en retrato y en H dentro del panel final) */
  exportHeader: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },

  exportColumna: {
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
  topBarInputWrap: {
    flex: 1,
  },

  /* ====== Landscape: 3 columnas 30/40/30 ====== */
  landRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  landCenter: {
    flex: 4,                   // 40%
    paddingHorizontal: 6,
    minHeight: 0,
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  landRight: {
    flex: 3,                   // 30%
    paddingLeft: 0,
    minHeight: 0,
    overflow: 'hidden',
  },

  /* Landscape: columna izquierda completa */
  landLeft: {
    flex: 3,             // 30%
    paddingRight: 0,
    minHeight: 0,
    overflow: 'hidden',
    gap: 40,             // separación entre toolbar, figuras y espacio reservado
  },

  /* Toolbar horizontal */
  toolbarRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
  },
  toolbarIcon: {
    marginHorizontal: 8,
  },

  /* Íconos redondos */
  iconCircle: {
    width: 40, height: 40,
    borderRadius: 46,
    borderWidth: 1.5,
    borderColor: '#ff4500',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemIcon: { width: 30, height: 30, resizeMode: 'contain', tintColor: '#fff' },

  /* Figuras centradas */
  tituloFiguras: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  /* Abajo espacio reservado */
  leftBottomSpace: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
    minHeight: 60,
    justifyContent: 'center',
  },

  /* ===== Overrides SOLO HORIZONTAL (Landscape) ===== */
  landCol_ls: { alignSelf: 'stretch' },

  iconCircle_ls: { width: 44, height: 44, borderRadius: 18 },
  menuItemIcon_ls: { width: 36, height: 36 },

  imagenCirculo_ls: { width: 60, height: 60, borderRadius: 40 },
  imagenCuadro_ls: { width: 60, height: 60, marginLeft: 16 },

  // ====== Overrides SOLO para landscape del panel final ======
  exportHeader_ls: {
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  exportColumna_ls: {
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
  opacity: 0.9,
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

