// src/screens/reporte/ReporteViasCorticoespinalScreen.tsx
import React, { useState, useContext, createContext, useMemo, useRef, useEffect } from 'react';
import {
  View, Text,TextInput, TouchableOpacity, ScrollView, Image, ImageBackground, StyleSheet,
  PermissionsAndroid, Platform, Alert, useWindowDimensions, Keyboard, InteractionManager
} from 'react-native';
import { Dimensions } from 'react-native';
import { decode as b64decode, encode as b64encode } from 'base64-arraybuffer';
import { initShareLink, completeShareLink } from '../../../services/shareLinks';
import { supabase } from '../../../lib/supabase';
import LinkUploader, { type LinkUploaderProps } from '../../../components/LinkUploader';
import TemplatePickerModal, { type PlantillaId } from '../../../components/TemplatePickerModal';
import {
  buildPdfWithTemplate,
  type PdfBuildConfig,
} from '../../../components/pdfLoadingTemplate';
import DocumentPicker from 'react-native-document-picker';

//Modal de exito - Exportar pdf
import { ExportSuccessModal } from '../../../components/ExportSuccessModal';
import EditTextModal from '../../../components/EditTextModal';
export type { PlantillaId } from '../../../components/TemplatePickerModal';

// Tipos para plantillas PDF
export type PlantillaPdfDef = { src1: any; src2?: any };

// ===== Helpers de paths/archivos (mismos que Visual) =====
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

const sanitizeFilename = (name: string) =>
  name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w.\- ]+/g, '')
    .replace(/\s+/g, '_');

const safe = (s: string) =>
  s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim().replace(/\s+/g, '_');

const ensureLocalFile = async (file: any) => {
  const name = file.name || 'archivo';
  const type = file.type || file.mime || 'application/octet-stream';

  let uri: string | undefined = file.uri || file.path;
  if (uri) {
    try {
      if (uri.startsWith('content://')) {
        const st = await ReactNativeBlobUtil.fs.stat(uri);
        const path = decodeURIComponent((st?.path || uri).replace(/^file:\/\//, ''));
        return { name, type, path, uri: 'file://' + path };
      }
      if (uri.startsWith('file://')) {
        const path = decodeURIComponent(uri.replace('file://', ''));
        return { name, type, path, uri: 'file://' + path };
      }
      const path = decodeURIComponent(uri);
      return { name, type, path, uri: 'file://' + path };
    } catch {}
  }
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

// Sincroniza layout antes de capturar
const flushBeforeCapture = async (userLogoUrl?: string) => {
  Keyboard.dismiss();
  if (userLogoUrl) { try { await Image.prefetch(userLogoUrl); } catch {} }
  await new Promise<void>(r => InteractionManager.runAfterInteractions(() => r()));
  await new Promise<void>(r => requestAnimationFrame(() => r()));
  await new Promise<void>(r => setTimeout(r, 30));
};

// Captura ambas páginas
const capturePages = async (
  exportRef: React.RefObject<View>,
  exportRef2: React.RefObject<View>,
  format: 'png'|'jpg',
  userLogoUrl?: string
) => {
  if (!exportRef.current) throw new Error('El lienzo no está listo');
  await flushBeforeCapture(userLogoUrl);
  const quality = format === 'jpg' ? 0.95 : 1;
  const p1 = await captureRef(exportRef.current, { format, quality, result: 'base64' });
  let p2: string | null = null;
  if (exportRef2?.current) {
    p2 = await captureRef(exportRef2.current, { format, quality, result: 'base64' });
  }
  return { p1, p2 };
};


/* Cámara / galería */
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import uuid from 'react-native-uuid';
import ComentarioModal from '../../../components/ComentarioModal';

/* Export / PDF */
import { captureRef } from 'react-native-view-shot';
import ReactNativeBlobUtil from 'react-native-blob-util';

/* UI base */
import Header from '../../../components/Header';
import FiguraMovible from '../../../components/FiguraMovibleVias';
import FancyInput from '../../../components/FancyInput';

/* Loading overlay */
import { Circle } from 'react-native-animated-spinkit';
import AnimatedLetterText from 'react-native-animated-letter-text';

/* Assets toolbar */
import I_Regresar  from '../../../assets/03_Íconos/03_02_PNG/I_Out2.png';
import I_Refrescar from '../../../assets/03_Íconos/03_02_PNG/I_Repeat2.png';
import I_Imprimir  from '../../../assets/03_Íconos/03_02_PNG/I_Document.png';

/* Galería emergente (igual que Visual) */
import GaleriaEmergente from './GaleriaTb';
import type { ImageSourcePropType } from 'react-native';

/* Logo/usuario para PDF */
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../../constants/config';
import Svg, { Path } from 'react-native-svg';
import { escanearImagen } from '../../../utils/EscanearImagen';



/* ===================== BASE ===================== */
const IMG_BASE = require('../../../assets/CuerpoPng/CorticoespinalImg/BP_Motores_page-0001.jpg');
const IMG_BASE_TRANSPARENT = require('../../../assets/CuerpoPng/CorticoespinalImg/BP_Motores_TR.png');

const BASE_SRC = Image.resolveAssetSource(IMG_BASE);
const BASE_AR  = BASE_SRC.width / BASE_SRC.height;


/* ======  RUTAS ESTÁTICAS PARA OVERLAYS  ====== */
const IMG = {
  INF_D: require('../../../assets/CuerpoPng/CorticoespinalImg/INFERIORD.png'),
  INF_I: require('../../../assets/CuerpoPng/CorticoespinalImg/INFERIORI.png'),

  VS_SUP_D: require('../../../assets/CuerpoPng/CorticoespinalImg/ViasAfectadas/SUPERIORD.png'),
  VS_SUP_I: require('../../../assets/CuerpoPng/CorticoespinalImg/ViasAfectadas/SUPERIORI.png'),
  VS_INF_D: require('../../../assets/CuerpoPng/CorticoespinalImg/ViasAfectadas/INFERIORD.png'),
  VS_INF_I: require('../../../assets/CuerpoPng/CorticoespinalImg/ViasAfectadas/INFERIORI.png'),
};

/* ===================== OVERLAYS ===================== */
const OVERLAYS_CE: Record<string, any> = {
  /* ===== INDEMNE (base gris) ===== */
  izquierdo_indemne : IMG.INF_D,
  derecho_indemne   : IMG.INF_I,
  bilateral_indemne : [IMG.INF_D, IMG.INF_I],

  izquierdo_cortical   : IMG.VS_SUP_D,
  derecho_cortical     : IMG.VS_SUP_I,
  bilateral_cortical   : [IMG.VS_SUP_D, IMG.VS_SUP_I],

  izquierdo_cervical   : IMG.VS_SUP_D,
  derecho_cervical     : IMG.VS_SUP_I,
  bilateral_cervical   : [IMG.VS_SUP_D, IMG.VS_SUP_I],

  izquierdo_lumbasacro : IMG.VS_INF_D,
  derecho_lumbasacro   : IMG.VS_INF_I,
  bilateral_lumbasacro : [IMG.VS_INF_D, IMG.VS_INF_I],

  /* ===== ALTERADA (base sin severidad) ===== */
  izquierdo_corticalAlterada   : IMG.VS_SUP_D,
  derecho_corticalAlterada     : IMG.VS_SUP_I,
  izquierdo_cervicalAlterada   : IMG.VS_SUP_D,
  derecho_cervicalAlterada     : IMG.VS_SUP_I,
  izquierdo_lumbasacroAlterada : IMG.VS_INF_D,
  derecho_lumbasacroAlterada   : IMG.VS_INF_I,

  /* ===== ALTERADA (por severidad) ===== */
  // CORTICAL
  izquierdo_corticalAlterada_leve     : require('../../../assets/Viasneurologicas/Motores/ViaAfectada/Naranja/BP_Motores_Naranja_1-D.png'),
  derecho_corticalAlterada_leve       : require('../../../assets/Viasneurologicas/Motores/ViaAfectada/Naranja/BP_Motores_Naranja_1.png'),
  izquierdo_corticalAlterada_moderado : require('../../../assets/Viasneurologicas/Motores/ViaAfectada/Rojo/VersionDerecha/MO_1-D.png'),
  derecho_corticalAlterada_moderado   : require('../../../assets/Viasneurologicas/Motores/ViaAfectada/Rojo/MO_1.png'),
  izquierdo_corticalAlterada_severo   : require('../../../assets/Viasneurologicas/Motores/ViaAfectada/Marron/BP_Motores_Marron_1-D.png'),
  derecho_corticalAlterada_severo     : require('../../../assets/Viasneurologicas/Motores/ViaAfectada/Marron/BP_Motores_Marron_1.png'),

  // CERVICAL
  izquierdo_cervicalAlterada_leve     : require('../../../assets/Viasneurologicas/Motores/ViaAfectada/Naranja/BP_Motores_Naranja_1-D.png'),
  derecho_cervicalAlterada_leve       : require('../../../assets/Viasneurologicas/Motores/ViaAfectada/Naranja/BP_Motores_Naranja_1.png'),
  izquierdo_cervicalAlterada_moderado : require('../../../assets/Viasneurologicas/Motores/ViaAfectada/Rojo/VersionDerecha/MO_1-D.png'),
  derecho_cervicalAlterada_moderado   : require('../../../assets/Viasneurologicas/Motores/ViaAfectada/Rojo/MO_1.png'),
  izquierdo_cervicalAlterada_severo   : require('../../../assets/Viasneurologicas/Motores/ViaAfectada/Marron/BP_Motores_Marron_1-D.png'),
  derecho_cervicalAlterada_severo     : require('../../../assets/Viasneurologicas/Motores/ViaAfectada/Marron/BP_Motores_Marron_1.png'),

  // LUMBOSACRO
  izquierdo_lumbasacroAlterada_leve     : require('../../../assets/Viasneurologicas/Motores/ViaAfectada/Naranja/BP_Motores_Naranja_2-D.png'),
  derecho_lumbasacroAlterada_leve       : require('../../../assets/Viasneurologicas/Motores/ViaAfectada/Naranja/BP_Motores_Naranja_2.png'),
  izquierdo_lumbasacroAlterada_moderado : require('../../../assets/Viasneurologicas/Motores/ViaAfectada/Rojo/VersionDerecha/MO_2-D.png'),
  derecho_lumbasacroAlterada_moderado   : require('../../../assets/Viasneurologicas/Motores/ViaAfectada/Rojo/MO_2.png'),
  izquierdo_lumbasacroAlterada_severo   : require('../../../assets/Viasneurologicas/Motores/ViaAfectada/Marron/BP_Motores_Marron_2-D.png'),
  derecho_lumbasacroAlterada_severo     : require('../../../assets/Viasneurologicas/Motores/ViaAfectada/Marron/BP_Motores_Marron_2.png'),
};

/* ===================== CONTEXTO ===================== */
interface ConclusionItem { value:string; title:string }
interface ReportCtx {
  conclusions: ConclusionItem[];
  addConclusion: (c:ConclusionItem)=>void;
  removeConclusion: (value:string)=>void;
}
const ReportContext = createContext<ReportCtx>({
  conclusions:[], addConclusion:()=>{}, removeConclusion:()=>{},
});

/* ===================== PASOS ===================== */
const steps = ['A','B','C1','C2','D1','D2','E','E2','F','F2','G','H'] as const;
type StepId = typeof steps[number];
type Side   = 'izquierdo'|'derecho'|'bilateral'|'';
type RootFlow = 'indemne' | 'alterada' | null;
type Severity = 'leve'|'moderado'|'severo'|null;
type Tab = 'reporte'|'lista'|'GenerarLink';

/* ===================== Helpers reporte ===================== */
const sanitizeTitle = (t:string) =>
  t
    .replace(/^vía corticoespinal con\s*/i, '')
    .replace(/^para lado\s*/i, '')
    .replace(/^de forma\s*/i, '')
    .replace(/^al\s+/i, '')
    .replace(/^y\s+/i, '')
    .replace(/[.,]\s*$/, '')
    .trim();

// Normaliza, corrige y deja punto final
const limpiarTextoReporte = (s: string): string => {
  if (!s) return '';
  let t = s;
  t = t.replace(/\s+/g, ' ').trim();
  t = t.replace(/\s*([,;:.])\s*/g, '$1 ');
  t = t.toLowerCase();
  t = t.replace(/(^\s*[a-záéíóúñ])|([.!?]\s+[a-záéíóúñ])/g, (m) => m.toUpperCase());
  t = t.replace(/\s+([,.:;])/g, ' $1').replace(/\s+([,.])$/g, '$1');
  t = t.replace(/\s+$/,'');
  t = t.replace(/([.!?])\s*([.!?])+$/,'$1');
  if (!/[.!?]$/.test(t)) t += '.';
  return t;
};

/* ===================== “Modo lista” MOTOR ===================== */
const buildListaMotor = (conclusions: ConclusionItem[], side: Side) => {
  const vals = new Set(conclusions.map(c => c.value));
  const has = (needle: string) => Array.from(vals).some(v => v === needle || v.includes(needle));
  const lines: Array<{ k: string; v: string }> = [];

  // 1) Vía
  const via = vals.has('alterada') ? 'Afectada' : (vals.has('indemne') ? 'Indemne' : '');
  if (via) lines.push({ k: 'Vía Corticoespinal', v: via });

  // 2) Fisiopatología  usa "Déficit axonal"
  let fisio = '';
  if (vals.has('retardo_en_la_conduccion')) {
    fisio = 'Retardo en la conducción';
    if (vals.has('perdida_axonal_secundaria')) fisio += ' con pérdida axonal secundaria';
  } else if (vals.has('deficit_neuronal')) {
    fisio = 'Déficit axonal';
    if (vals.has('retardo_secundario_en_la_conduccion')) fisio += ' con retardo secundario en la conducción';
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

  // 4) Lado
  const sideMap: Record<string, string> = { izquierdo: 'Izquierdo', derecho: 'Derecho', bilateral: 'Bilateral' };
  const lado =
    side ? sideMap[side] :
    (vals.has('izquierdo') || vals.has('izquierdo_alterada') || vals.has('izquierdo_indemne')) ? 'Izquierdo' :
    (vals.has('derecho')   || vals.has('derecho_alterada')   || vals.has('derecho_indemne'))   ? 'Derecho'   :
    (vals.has('bilateral') || vals.has('bilateral_alterada') || vals.has('bilateral_indemne')) ? 'Bilateral' : '';
  if (lado) lines.push({ k: 'Lado', v: lado });

  // 5) Región  mapea a los textos solicitados
  let region = '';
  if (has('cortical'))        region = 'Corteza motora primaria';
  else if (has('cervical'))   region = 'Astas anteriores y raíces cervicales';
  else if (has('lumbasacro')) region = 'Astas anteriores y raíces lumbosacras';
  if (region) lines.push({ k: 'Región', v: region });

  return lines;
};


/* 🔹 Figuras arrastrables */
type Figura = { id: string; tipo: 'circle' | 'square'; uri: string; posicion: { x:number; y:number } };

/* ===================== UI HELPERS ===================== */
const ConclusionBtn:React.FC<{value:string;title:string;label:string;onPress?:()=>void}> =
({ value,title,label,onPress })=>{
  const { addConclusion } = useContext(ReportContext);
  return(
    <TouchableOpacity style={styles.conclusionBtn}
      onPress={()=>{ addConclusion({value, title}); onPress?.(); }}>
      <Text style={styles.conclusionBtnText}>{label}</Text>
    </TouchableOpacity>
  );
};

const IconCircle:React.FC<{img:any;onPress?:()=>void;disabled?:boolean}> =
({img,onPress,disabled})=>(
  <TouchableOpacity style={[styles.iconCircle, disabled && {opacity:0.5}]} onPress={onPress} disabled={disabled}>
    <Image source={img} style={styles.menuItemIcon}/>
  </TouchableOpacity>
);

/* Nav con íconos (igual Visual) */
const NavRow:React.FC<{onBack:()=>void; onReset:()=>void; onFwd?:()=>void}> =
({onBack,onReset,onFwd})=>(
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


/* ======= Columna izquierda final (landscape) ======= */
const ExportLeftReporte: React.FC<{ isLandscape?: boolean; manejarSeleccionImagen: (tipo:'circle'|'square')=>void; }> = ({ isLandscape=false, manejarSeleccionImagen }) => (
  <View style={styles.tituloFiguras}>
    <TouchableOpacity onPress={() => manejarSeleccionImagen('circle')}>
      <Image source={require('../../../assets/Figuras/circulo.png')} style={[styles.imagenCirculo, isLandscape && styles.imagenCirculo_ls]} />
    </TouchableOpacity>
    <TouchableOpacity onPress={() => manejarSeleccionImagen('square')}>
      <Image source={require('../../../assets/Figuras/cuadrado.png')} style={[styles.imagenCuadro, isLandscape && styles.imagenCuadro_ls]} />
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
  onFocusComentario: () => void;
  onBlurComentario: () => void;
}> = ({ onOpenGallery, comentario, onOpenModal, selected, preview, onClear, onFocusComentario,
  onBlurComentario}) => {
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

/* Placeholder "GenerarLink" */
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

/* ======= Panel final con toolbar ======= */
// ⬇️ Reemplaza TODO tu FinalExportUICortico por esto
type FinalExportUICorticoProps = {
  isLandscape?: boolean;
  manejarSeleccionImagen: (tipo:'circle'|'square') => void;
  onToolbarBack: () => void;
  onReset: () => void;
  onExport: () => void;
  exporting: boolean;
  activeTab: 'reporte'|'lista'|'GenerarLink';
  onOpenGallery: () => void;
  comentarioLista: string;
  setComentarioLista: (v:string)=>void;
  imgListaSrc: ImageSourcePropType | null;
  setImgListaSrc: (v: ImageSourcePropType | null) => void;
  onFocusComentario: () => void;
  onBlurComentario: () => void;
  onOpenComentarioModal: () => void;
  //  NUEVO (requerido por el tab GenerarLink)
  onGenerateLink: LinkUploaderProps['onGenerateLink'];
  onRequestTemplate?: () => Promise<PlantillaId | null>;
  defaultTitle: string;
  defaultMessage: string;
  autoReportName?: string;
};

const FinalExportUICortico: React.FC<FinalExportUICorticoProps> = React.memo(
  ({
    isLandscape = false,
    manejarSeleccionImagen,
    onToolbarBack, onReset, onExport, exporting,
    activeTab,
    onOpenGallery,
    comentarioLista, setComentarioLista,
    imgListaSrc, setImgListaSrc,
    onFocusComentario, onBlurComentario, onOpenComentarioModal, onGenerateLink,
    onRequestTemplate,
    defaultTitle,
    defaultMessage,
    autoReportName,
  }) => (
    <View style={styles.figBlock}>
      {/* HEADER (toolbar) */}
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

      {/* COLUMNA de contenido (mismo patrón que Visual) */}
      <View style={[styles.exportColumna, isLandscape && styles.exportColumna_ls]}>
        {activeTab === 'reporte' ? (
          <ExportLeftReporte isLandscape manejarSeleccionImagen={manejarSeleccionImagen} />
        ) : activeTab === 'lista' ? (
          <ExportLeftLista
            onOpenGallery={onOpenGallery}
            comentario={comentarioLista}
            onOpenModal={onOpenComentarioModal}
            selected={!!imgListaSrc}
            preview={imgListaSrc}
            onClear={() => setImgListaSrc(null)}
            onFocusComentario={onFocusComentario}   // ⬅️ NUEVO
            onBlurComentario={onBlurComentario}     // ⬅️ NUEVO
            
          />
      ) : activeTab === 'GenerarLink' && (
  <ExportLeftGenerarLink
    onGenerateLink={onGenerateLink}
    onRequestTemplate={onRequestTemplate}
    defaultTitle={defaultTitle}
    defaultMessage={defaultMessage}
    autoReportName={autoReportName}
  />
)}
</View>

    </View>
  )
);


// ⬇️ Reemplaza TODO tu LeftColLandscapeFinal por esto
const LeftColLandscapeFinal: React.FC<{
  onToolbarBack: () => void;
  onReset: () => void;
  onExport: () => void;
  exporting: boolean;
  manejarSeleccionImagen: (tipo:'circle'|'square') => void;
  activeTab: 'reporte'|'lista'|'GenerarLink';
  onOpenGallery: () => void;
  comentarioLista: string;
  setComentarioLista: (v: string) => void;
  imgListaSrc: ImageSourcePropType | null;
  setImgListaSrc: (v: ImageSourcePropType | null) => void;
  onFocusComentario: () => void;
  onBlurComentario: () => void;
  onOpenComentarioModal: () => void;
  onGenerateLink: LinkUploaderProps['onGenerateLink'];
  onRequestTemplate?: () => Promise<PlantillaId | null>;
  defaultTitle: string;
  defaultMessage: string;
  autoReportName?: string;
}> = ({
  onToolbarBack, onReset, onExport, exporting,
  manejarSeleccionImagen, activeTab,
  onOpenGallery, comentarioLista, setComentarioLista,
  imgListaSrc, setImgListaSrc, onFocusComentario, onBlurComentario, onOpenComentarioModal, onGenerateLink, onRequestTemplate, defaultTitle, defaultMessage, autoReportName
}) => {
  return (
    <View style={[styles.landLeft, styles.landCol_ls]}>
      {/* Toolbar arriba */}
      <View style={styles.toolbarRow}>
        <TouchableOpacity onPress={onToolbarBack} style={[styles.iconCircle, styles.toolbarIcon, styles.iconCircle_ls]}>
          <Image source={I_Regresar} style={[styles.menuItemIcon, styles.menuItemIcon_ls]} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onReset} style={[styles.iconCircle, styles.toolbarIcon, styles.iconCircle_ls]}>
          <Image source={I_Refrescar} style={[styles.menuItemIcon, styles.menuItemIcon_ls]} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconCircle, styles.toolbarIcon, styles.iconCircle_ls]}
          onPress={onExport}
          disabled={exporting}
        >
          <Image source={I_Imprimir} style={[styles.menuItemIcon, styles.menuItemIcon_ls]} />
        </TouchableOpacity>
      </View>

      {/* Contenido según TAB */}
      {activeTab === 'reporte' && (
        <View style={styles.tituloFiguras}>
          <TouchableOpacity onPress={() => manejarSeleccionImagen('circle')}>
            <Image source={require('../../../assets/Figuras/circulo.png')} style={[styles.imagenCirculo, styles.imagenCirculo_ls]} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => manejarSeleccionImagen('square')}>
            <Image source={require('../../../assets/Figuras/cuadrado.png')} style={[styles.imagenCuadro, styles.imagenCuadro_ls]} />
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
          onFocusComentario={onFocusComentario}   // ⬅️ NUEVO
          onBlurComentario={onBlurComentario}     // ⬅️ NUEVO
        />
      )}

{activeTab === 'GenerarLink' && (  <ExportLeftGenerarLink
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


/* ===================== PDF CONFIG (igual Visual) ===================== */
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

/* ===================== COMPONENTE PRINCIPAL ===================== */
export default function ReporteViasCorticoespinalScreen(){
  const [isLandscape, setIsLandscape] = useState(
  Dimensions.get('screen').width > Dimensions.get('screen').height
);
const [evitarRelayoutPorTeclado, setEvitarRelayoutPorTeclado] = useState(false);
const [textoVisual, setTextoVisual] = useState('');


useEffect(() => {
  const sub = Dimensions.addEventListener('change', ({ screen }) => {
    setIsLandscape(screen.width > screen.height);
  });
  return () => sub?.remove?.();
}, []);

  
  /* conclusiones */
  const [conclusions,setConclusions] = useState<ConclusionItem[]>([]);
  const addConclusion = (c:ConclusionItem)=> setConclusions(prev=> prev.some(p=>p.value===c.value) ? prev : [...prev,c]);
  const removeConclusion = (value:string)=> setConclusions(prev=>prev.filter(p=>p.value!==value));

  /* navegación */
  const [step, setStep]   = useState<StepId>('A');
  const [history, setHistory] = useState<StepId[]>(['A']);

  /* raíz y severidad */
  const [rootFlow, setRootFlow] = useState<RootFlow>(null);
  const [severity, setSeverity] = useState<Severity>(null);

  /* overlays */
  const [activeOverlays, setActiveOverlays] = useState<string[]>([]);
  const [overlayHistory, setOverlayHistory] = useState<string[][]>([]);

// === Nombres bonitos y consistentes ===
const STUDY_KEY = 'Motoracorticoespinal';               // <- cambia esto en cada pantalla
const STUDY_PREFIX = `mEDXpro${STUDY_KEY}`;        // mEDXproMotoracorticoespinal

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

/** Base: mEDXproMotoracorticoespinal_<Paciente o N> */
const buildBaseName = (paciente: string | undefined | null): string => {
  const token = toSafeToken(paciente || '');
  const n = token || String(unnamedBatchOrdinalRef.current);
  return `${STUDY_PREFIX}_${n}`;
};



  const addOverlays = (ids: string[]) => {
    setActiveOverlays(prev => [...prev, ...ids.filter(id => !prev.includes(id))]);
    setOverlayHistory(h => [...h, ids]);
  };
  const addOverlay = (id: string) => addOverlays([id]);
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

  /* side */
  const [side,setSide] = useState<Side>('');

  /* tabs */
  const [activeTab, setActiveTab] = useState<Tab>('reporte');

  /* comentario + galería */
  const [mostrarGaleria, setMostrarGaleria] = useState(false);
  const [imgListaSrc, setImgListaSrc] = useState<ImageSourcePropType | null>(null);
  const [comentarioLista, setComentarioLista] = useState('');
  const [modalComentarioVisible, setModalComentarioVisible] = useState(false);
  const toImageSource = (src: string | ImageSourcePropType): ImageSourcePropType => typeof src === 'string' ? { uri: src } : src;

  /* Texto reporte */
  const textoReporte = useMemo(() => {
    const crudo = conclusions.map(c => (c.title || '').trim()).join(' ');
    return limpiarTextoReporte(crudo);
  }, [conclusions]);

  /* ====== Figuras y export ====== */
  const [figuras, setFiguras] = useState<Figura[]>([]);
  const [limites, setLimites] = useState({ width: 0, height: 0 });
  const [nombrePaciente, setNombrePaciente] = useState('');
  const exportRef = useRef<View>(null);
  const exportRef2 = useRef<View>(null);
  const [imgSize, setImgSize] = useState<{ w:number; h:number } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportKind, setExportKind] = useState<'pdf'|'jpeg'|null>(null);
  const [imgListaAR, setImgListaAR] = useState<number | null>(null);

  /* Template picker */
  const [templatePickerVisible, setTemplatePickerVisible] = useState(false);
  const [templatePickerIntent, setTemplatePickerIntent] = useState<'export' | 'link' | null>(null);
  const templatePickerPromiseRef = useRef<((v: PlantillaId | null) => void) | null>(null);
  const [plantillaId, setPlantillaId] = useState<PlantillaId>('none');
  const [pendingTemplateExport, setPendingTemplateExport] = useState<PlantillaId | null>(null);
  const exportarPdfRef = useRef<() => Promise<void>>(async () => {});
  const [exportSuccess, setExportSuccess] = useState<{ filename: string; path: string } | null>(null);
 
   const exportBgColor = plantillaId === 'none' ? '#fff' : 'transparent';
 
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

  /* PDF runtime config (igual Visual) */
  const [pdf, setPdf] = useState<PdfConfig>(DEFAULT_PDF);
  const PT = { A4: { W: 595, H: 842 }, Letter: { W: 612, H: 792 } };
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

  // Cálculos de gaps y offsets (igual que Visual.tsx)
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

  // Cálculo de lámina y diagnóstico
  let laminaWpx = Math.round(innerW * pdf.lamina.widthFrac);
  let laminaHpx = Math.round(laminaWpx / BASE_AR);
  const MIN_DIAG = px(pdf.diag.minHeight);
  const MIN_LAMINA = px(pdf.lamina.minHeight);

  let diagHpx = layoutH - headerTotalHpx - headerGapPx - diagTopGapPx - footerBeforeGapPx - laminaHpx - footerHpx;
  if (diagHpx < MIN_DIAG) {
    const deficit = MIN_DIAG - diagHpx;
    laminaHpx = Math.max(MIN_LAMINA, laminaHpx - deficit);
    laminaWpx = Math.round(laminaHpx * BASE_AR);
    diagHpx = layoutH - headerTotalHpx - headerGapPx - diagTopGapPx - footerBeforeGapPx - laminaHpx - footerHpx;
  }
  if (pdf.diag.pullUp > 0) {
    laminaHpx = Math.max(MIN_LAMINA, laminaHpx - px(pdf.diag.pullUp));
    diagHpx = layoutH - headerTotalHpx - headerGapPx - diagTopGapPx - footerBeforeGapPx - laminaHpx - footerHpx;
  }

  /* Usuario (logo/credenciales) para PDF */
  type UserData = { name:string; lastname:string; idprofessional:string; specialty:string; email:string; imageUrl:string };
  const [userData, setUserData] = useState<UserData | null>(null);
  useEffect(() => { (async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const res = await axios.post(`${BASE_URL}/userdata`, { token });
      const ud = res?.data?.data;
      if (ud) { setUserData(ud); if (ud.imageUrl) Image.prefetch(ud.imageUrl).catch(()=>{}); }
    } catch (e) { /* noop */ }
  })(); }, []);

  /* ======= Overlays: expand (solo en ALTERADA con severidad) ======= */
  const expandOverlay = (rawId: string): string[] => {
    const exists = (key:string) => Boolean((OVERLAYS_CE as any)[key]);
    if (rootFlow !== 'alterada') return []; // en INDEMNE no pintamos capas de severidad

    // Si no hay severidad, usar imágenes base de alterada sin severidad
    if (!severity) {
      if (rawId.startsWith('bilateral_')) {
        const base = rawId.replace('bilateral_', '');
        const perSide = [`izquierdo_${base}`, `derecho_${base}`];
        return perSide.map(sr => `${sr}Alterada`).filter(exists);
      }
      const baseKey = `${rawId}Alterada`;
      return exists(baseKey) ? [baseKey] : [];
    }

    // Con severidad, usar imágenes con grado específico
    if (rawId.startsWith('bilateral_')) {
      const base = rawId.replace('bilateral_', '');
      const perSide = [`izquierdo_${base}`, `derecho_${base}`];
      return perSide.map(sr => `${sr}Alterada_${severity}`).filter(exists);
    }
    const key = `${rawId}Alterada_${severity}`;
    return exists(key) ? [key] : [];
  };

  /* Helpers */
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
    // Tamaño base de las figuras (debe coincidir con FIGURA_SIZE de FiguraMovibleVias: 80px)
    const figuraSize = 80;
    const centerX = (limites.width / 2) - (figuraSize / 2);
    const centerY = (limites.height / 2) - (figuraSize / 2);
    setFiguras(p => [...p, {
      id: uuid.v4().toString(),
      tipo,
      uri,
      posicion: {
        x: centerX > 0 ? centerX : 0,
        y: centerY > 0 ? centerY : 0
      }
    }]);
  };
  const manejarSeleccionImagen = async (tipo:'circle'|'square') => {
    if (!(await pedirPermiso())) return;
    Alert.alert('Seleccionar imagen','¿Qué deseas hacer?',[
      { text:'Tomar foto',
        onPress: async () => {
          const imagenEscaneada = await escanearImagen();
          if (imagenEscaneada) {
            agregarFigura(tipo, imagenEscaneada);
          } else {
            console.warn('No se pudo escanear la imagen');
          }
        },
      },
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
      { text:'Cancelar', style:'cancel' },
    ]);
  };
  const actualizarPos = (id:string, x:number, y:number) =>
    setFiguras(p => p.map(f => f.id === id ? { ...f, posicion:{x,y} } : f));
  const eliminarFigura = (id:string) => setFiguras(p => p.filter(f => f.id !== id));

  /* ====== CanvasView export (w/h opcional + escalado) ====== */
  const CanvasView: React.FC<{ w?: number; h?: number; transparentBg?: boolean }> = ({ w, h, transparentBg = false }) => {
    const size = w && h ? { w, h } : imgSize;
    if (!size) return null;
    const sx = limites.width  ? size.w / limites.width  : 1;
    const sy = limites.height ? size.h / limites.height : 1;
    const figBaseCircle = 80;
    const figBaseSquare = 80;
    const baseImage = transparentBg ? IMG_BASE_TRANSPARENT : IMG_BASE;

    const flatOverlays = activeOverlays.flatMap(k => {
      const src = (OVERLAYS_CE as any)[k];
      return Array.isArray(src) ? src : [src];
    }).filter(Boolean);

    return (
      <View style={{ width: size.w, height: size.h, position:'relative', overflow:'hidden', backgroundColor: transparentBg ? 'transparent' : '#FFFFFF' }} collapsable={false}>
        <Image source={baseImage} style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', opacity: 1 }} resizeMode="contain" />
        {flatOverlays.map((imgSrc:any, idx:number) => (
          <Image key={`exp_${idx}`} source={imgSrc} style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%' }} resizeMode="contain" />
        ))}
        {figuras.map(f=>{
          const base = f.tipo === 'circle' ? figBaseCircle : figBaseSquare;
          //const wFig = base * sx, hFig = base * sy;
          //const br = f.tipo === 'circle' ? Math.min(wFig, hFig) / 2 : 8 * Math.min(sx, sy);
          const k = Math.min(sx, sy);
          const side = base * k;
          const br = f.tipo === 'circle' ? side / 2 : 0; // cuadrado puro
          return (
            <Image
              key={`fig_${f.id}`} source={{ uri: f.uri }}
              style={{
                position:'absolute',
                left: f.posicion.x * sx,
                top:  f.posicion.y * sy,
                width: side,
                height: side,
                borderRadius: br,
              }}
              resizeMode="cover"
            />
          );
        })}
      </View>
    );
  };

  /* ====== LISTA (pantalla & PDF) ====== */
  const listaMotor = useMemo(() => buildListaMotor(conclusions, side), [conclusions, side]);

  /* ====== Export helpers (igual Visual) ====== */
  const flushBeforeCapture = async () => {
    Keyboard.dismiss();
    if (userData?.imageUrl) { try { await Image.prefetch(userData.imageUrl); } catch {} }
    await new Promise<void>(r => InteractionManager.runAfterInteractions(() => r()));
    await new Promise<void>(r => requestAnimationFrame(() => r()));
    await new Promise<void>(r => setTimeout(r, 30));
  };
  const capturePages = async (format: 'png'|'jpg') => {
    if (!exportRef.current) throw new Error('El lienzo no está listo');
    await flushBeforeCapture();
    const quality = format === 'jpg' ? 0.95 : 1;
    const p1 = await captureRef(exportRef.current, { format, quality, result: 'base64' });
    let p2: string | null = null;
    if (exportRef2?.current) p2 = await captureRef(exportRef2.current, { format, quality, result: 'base64' });
    return { p1, p2 };
  };
  const handleExportRequest = () => {
    if (exporting) return;
    templatePickerPromiseRef.current = null;
    setTemplatePickerIntent('export');
    setTemplatePickerVisible(true);
  };
  
  // Títulos por defecto
const defaultTitle   = React.useMemo(
  () => nombrePaciente ? `Potenciales Evocados — ${nombrePaciente}` : 'Potenciales Evocados',
  [nombrePaciente]
);
const defaultMessage = React.useMemo(
  () => 'Saludos...',
  []
);
const autoReportName = React.useMemo(() => {
  const safe = (s:string)=> s.normalize('NFKD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^\p{L}\p{N}\s-]/gu,'')
    .trim().replace(/\s+/g,'_').toLowerCase();
  return `reporte_corticoespinal_${safe(nombrePaciente || 'paciente')}_${new Date().toISOString().slice(0,10)}.pdf`;
}, [nombrePaciente]);

// ───────────────────────── helpers de archivo ─────────────────────────
const slug = (s: string) =>
  s.normalize('NFKD')
   .replace(/[\u0300-\u036f]/g, '')
   .replace(/[^\p{L}\p{N}\s-]/gu, '')
   .trim()
   .replace(/\s+/g, '_');

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

const buildReportPdfArrayBuffer = async ({
  studyType,
  doctorName,
  templateId,
}: { studyType: string; doctorName?: string; templateId?: PlantillaId | null; }): Promise<ArrayBuffer> => {
  const { p1, p2 } = await capturePages('png');
  const capturedPages = { p1, p2 };

  const config: PdfBuildConfig = {
    studyType,
    doctorName,
    templateId: templateId || plantillaId,
    patientName: nombrePaciente,
    Wpt,
    Hpt,
  };

  return await buildPdfWithTemplate(capturedPages, config);
};

const reportFileName = () => {
  const base = buildBaseName(nombrePaciente);
  return `${base}.pdf`; // mEDXproMotoracorticoespinal_<...>.pdf
};


const buildPdfTempFile = async (filename?: string) => {
  const studyType  = 'Vía Corticoespinal';
  const doctorName = [userData?.name, userData?.lastname].filter(Boolean).join(' ') || undefined;

  const ab = await buildReportPdfArrayBuffer({ studyType, doctorName });
  const base64 = b64encode(ab);

  const RNBU: any = ReactNativeBlobUtil;
  const safeName = sanitizeFilename(filename || reportFileName());
  const path = `${RNBU.fs.dirs.CacheDir}/${safeName}`;
  await RNBU.fs.writeFile(path, base64, 'base64');

  return { name: safeName, type: 'application/pdf', uri: `file://${path}`, path };
};


const generateShareLink: LinkUploaderProps['onGenerateLink'] = async ({
  files, title, message, expiry, onFileProgress, templateId,
}) => {
  const studyType  = 'Vías Corticoespinales';

  // Si ya tienes userData en Corticoespinal, úsalo; si no, deja undefined
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
  const reportAb   = await buildReportPdfArrayBuffer({ studyType, doctorName, templateId: templateId as PlantillaId | null | undefined });
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


  const exportarPDF = async () => {
    try {
      setExportSuccess(null);
      setExportKind('pdf');
      setExporting(true);

      // Generar PDF usando el servicio centralizado
      const studyType = 'Vías Motoras Corticoespinales';
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
        const w = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
        if (w !== PermissionsAndroid.RESULTS.GRANTED) throw new Error('WRITE_EXTERNAL_STORAGE no otorgado');
      }

      const RNBU: any = ReactNativeBlobUtil;
      const tmp = `${RNBU.fs.dirs.CacheDir}/${filename}`;
      await RNBU.fs.writeFile(tmp, base64Pdf, 'base64');

      let out = tmp;
      if (Platform.OS === 'android') {
        out = `${RNBU.fs.dirs.DownloadDir}/${filename}`;
        try {
          await RNBU.fs.cp(tmp, out);
        } catch {
          await RNBU.fs.writeFile(out, base64Pdf, 'base64');
        }
        await RNBU.fs.scanFile([{ path: out, mime: 'application/pdf' }]);
        RNBU.android?.addCompleteDownload?.({
          title: filename,
          description: 'Reporte descargado',
          mime: 'application/pdf',
          path: out,
          showNotification: true
        });
      } else {
        out = `${RNBU.fs.dirs.DocumentDir}/${filename}`;
        await RNBU.fs.writeFile(out, base64Pdf, 'base64');
      }

      setExportSuccess({ filename, path: out });
    } catch (e: any) {
      Alert.alert('Error', `No se pudo exportar el PDF.\n\n${e?.message ?? e}`);
    } finally {
      setExporting(false);
      setExportKind(null);
    }
  };

  exportarPdfRef.current = exportarPDF;

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



  /* handlers navegación */
  const goTo = (next: StepId) => { setHistory(prev => [...prev, next]); setStep(next); };
  const handleBack = () => {
    if (history.length <= 1) return;
    const newHistory = history.slice(0, -1);
    const prevStep   = newHistory[newHistory.length - 1];
    setHistory(newHistory); setStep(prevStep);
    const last = conclusions[conclusions.length - 1];
    if (last) removeConclusion(last.value);
    removeLastOverlayGroup();
  };
  const resetAll = () => {
    setConclusions([]); setStep('A'); setHistory(['A']);
    setSide(''); setRootFlow(null); setSeverity(null);
    resetOverlays(); setFiguras([]);
    setNombrePaciente('');
    setActiveTab('reporte');
    setComentarioLista(''); setMostrarGaleria(false); setImgListaSrc(null);
    setTextoEditadoManualmente(false);
  };

  /* Animated loading */
  const [rerenderKey, setRerenderKey] = useState(0);
  useEffect(() => { if (!exporting) return; const id = setInterval(() => setRerenderKey(k => k + 1), 1000); return () => clearInterval(id); }, [exporting]);
  const AnimatedLetters:any = AnimatedLetterText;

  /* ===================== STEPS ===================== */
  const StepA =()=>(<View>
    <Text style={styles.stepTitle}>VÍA CORTICOESPINAL</Text>

    <ConclusionBtn
      value="indemne"
      title="Vía corticoespinal con integridad funcional "
      label="INDEMNE"
      onPress={()=>{ setRootFlow('indemne'); setSeverity(null); addOverlay('bilateral_indemne'); goTo('E2'); }}
    />

    <ConclusionBtn
      value="alterada"
      title="Vía corticoespinal con defecto "
      label="ALTERADA"
      onPress={()=>{ setRootFlow('alterada'); setSeverity(null); goTo('B'); }}
    />
  </View>);

  const StepB =()=>(<View>
    <NavRow onBack={()=>{
      ['indemne','alterada','retardo_en_la_conduccion','bloqueo_en_la_conduccion','deficit_neuronal','sin_respuesta']
        .forEach(removeConclusion);
      setSeverity(null);
      setStep('A');
    }} onReset={resetAll}/>
    <Text style={styles.stepTitle}>FISIOPATOLOGÍA:</Text>

    <ConclusionBtn value="retardo_en_la_conduccion" title="Por retardo en la conducción " label="RETARDO EN LA CONDUCCIÓN" onPress={()=>goTo('C1')}/>
    <ConclusionBtn value="bloqueo_en_la_conduccion" title="Por bloqueo en la conducción " label="BLOQUEO EN LA CONDUCCIÓN" onPress={()=>goTo('E')}/>
    <ConclusionBtn value="deficit_neuronal"        title="Axonal "                         label="DÉFICIT AXONAL"         onPress={()=>goTo('C2')}/>
    <ConclusionBtn value="sin_respuesta"           title="Por ausencia de respuesta evocable " label="SIN RESPUESTA"
      onPress={()=>{ setSeverity('severo'); addConclusion({ value:'severo', title:'Severo ' }); goTo('E'); }} />
  </View>);

  const StepC1 =()=>(<View>
    <NavRow onBack={()=>{ ['leve','moderado','severo'].forEach(removeConclusion); setSeverity(null); setStep('B'); }} onReset={resetAll}/>
    <Text style={styles.stepTitle}>GRADO:</Text>
    <ConclusionBtn value="leve"     title="Leve "     label="LEVE"     onPress={()=>{ setSeverity('leve');     goTo('D1'); }}/>
    <ConclusionBtn value="moderado" title="Moderado " label="MODERADO" onPress={()=>{ setSeverity('moderado'); goTo('D1'); }}/>
    <ConclusionBtn value="severo"   title="Severo "   label="SEVERO"   onPress={()=>{ setSeverity('severo');   goTo('D1'); }}/>
  </View>);

  const StepC2 =()=>(<View>
    <NavRow onBack={()=>{ ['leve','moderado','severo'].forEach(removeConclusion); setSeverity(null); setStep('B'); }} onReset={resetAll}/>
    <Text style={styles.stepTitle}>GRADO:</Text>
    <ConclusionBtn value="leve"     title="Leve "     label="LEVE"     onPress={()=>{ setSeverity('leve');     goTo('D2'); }}/>
    <ConclusionBtn value="moderado" title="Moderado " label="MODERADO" onPress={()=>{ setSeverity('moderado'); goTo('D2'); }}/>
    <ConclusionBtn value="severo"   title="Severo "   label="SEVERO"   onPress={()=>{ setSeverity('severo');   goTo('D2'); }}/>
  </View>);

  const StepD1 =()=>(<View>
    <NavRow onBack={()=>{ [
      'indemne','alterada','retardo_en_la_conduccion','bloqueo_en_la_conduccion','deficit_neuronal','sin_respuesta','perdida_axonal_secundaria'
    ].forEach(removeConclusion); setSeverity(null); setStep('C1'); }} onReset={resetAll} onFwd={()=>goTo('E')}/>
    <Text style={styles.stepTitle}>RETARDO EN CONDUCCIÓN:</Text>
    <ConclusionBtn value="perdida_axonal_secundaria" title=" y pérdida axonal secundaria " label="+ PÉRDIDA AXONAL" onPress={()=>goTo('E')}/>
    <SkipButton onPress={() => goTo('E')} label="Saltar  ➔" />
  </View>);

  const StepD2 =()=>(<View>
    <NavRow onBack={()=>{ [
      'indemne','alterada','retardo_en_la_conduccion','bloqueo_en_la_conduccion','deficit_neuronal','sin_respuesta','retardo_secundario_en_la_conduccion'
    ].forEach(removeConclusion); setSeverity(null); setStep('C2'); }} onReset={resetAll} onFwd={()=>goTo('E')}/>
    <Text style={styles.stepTitle}>AXONAL:</Text>
    <ConclusionBtn value="retardo_secundario_en_la_conduccion" title="y retardo secundario en la conducción " label="+ RETARDO EN LA CONDUCCIÓN" onPress={()=>goTo('E')}/>
     <SkipButton onPress={() => goTo('E')} label="Saltar  ➔" />

  </View>);

  const StepE = () => (
    <View>
      <NavRow onBack={()=>{
        [
          'perdida_axonal_secundaria','retardo_secundario_en_la_conduccion','leve','moderado','severo',
          'izquierdo','derecho','bilateral','izquierdo_alterada','derecho_alterada','bilateral_alterada'
        ].forEach(removeConclusion);
        setSeverity(null); removeLastOverlayGroup(); setStep('B');
      }} onReset={resetAll}/>
      <Text style={styles.stepTitle}>LADO:</Text>

      <ConclusionBtn value="izquierdo_alterada" title="Para lado izquierdo," label="IZQUIERDO"
        onPress={()=>{ setSide('izquierdo'); removeLastOverlayGroup(); addOverlay('izquierdo_indemne'); goTo('F'); }} />
      <ConclusionBtn value="derecho_alterada" title="Para lado derecho," label="DERECHO"
        onPress={()=>{ setSide('derecho'); removeLastOverlayGroup(); addOverlay('derecho_indemne');   goTo('F'); }} />
      <ConclusionBtn value="bilateral_alterada" title="De forma bilateral," label="BILATERAL"
        onPress={()=>{ setSide('bilateral'); removeLastOverlayGroup(); addOverlays(['izquierdo_indemne','derecho_indemne']); goTo('F'); }} />

      {rootFlow==='alterada' && severity && (
        <Text style={{color:'#fff', textAlign:'center', marginTop:8}}>Grado seleccionado: {severity.toUpperCase()}</Text>
      )}
    </View>
  );

  const StepE2 = () => (
    <View>
      <NavRow onBack={()=>{
        [
          `${side}cortical`, `${side}cervical`, `${side}lumbasacro`,
          'cortical','cervical','lumbasacro','indemne','izquierdo_indemne','derecho_indemne','bilateral_indemne'
        ].forEach(v => v && removeConclusion(v));
        removeLastOverlayGroup();
        setStep('A');
      }} onReset={resetAll}/>
      <Text style={styles.stepTitle}>LADO:</Text>
      <ConclusionBtn value="izquierdo_indemne" title="Para lado izquierdo," label="IZQUIERDO"
        onPress={() => { setSide('izquierdo'); addOverlay('izquierdo_indemne'); goTo('F2'); }}/>
      <ConclusionBtn value="derecho_indemne" title="Para lado derecho," label="DERECHO"
        onPress={() => { setSide('derecho'); addOverlay('derecho_indemne');   goTo('F2'); }}/>
      <ConclusionBtn value="bilateral_indemne" title="De forma bilateral," label="BILATERAL"
        onPress={() => { setSide('bilateral'); addOverlays(['izquierdo_indemne','derecho_indemne']); goTo('F2'); }}/>
    </View>
  );

  const StepF =()=>(<View>
    <NavRow onBack={()=>{
      [`${side}cortical`,`${side}cervical`,`${side}lumbasacro`].forEach(v=>v&&removeConclusion(v));
      removeLastOverlayGroup(); setStep('E');
    }} onReset={resetAll}/>
    <Text style={styles.stepTitle}>REGIÓN / ESTÍMULO:</Text>
    <ConclusionBtn value={`${side}cortical`} title=" a través de región medular anterolateral al estímulo en corteza motora primaria." label="CORTICAL"
      onPress={()=>{ addOverlays(expandOverlay(`${side}_cortical`)); goTo('G'); }} />
    <ConclusionBtn value={`${side}cervical`} title=" a través de región medular anterolateral al estímulo en astas y raíces cervicales." label="CERVICAL"
      onPress={()=>{ addOverlays(expandOverlay(`${side}_cervical`)); goTo('G'); }} />
    <ConclusionBtn value={`${side}lumbasacro`} title=" a través de región medular anterolateral al estímulo en astas y raíces lumbosacras." label="LUMBOSACRO"
      onPress={()=>{ addOverlays(expandOverlay(`${side}_lumbasacro`)); goTo('G'); }} />
    {rootFlow==='alterada' && severity && (
      <Text style={{color:'#fff', textAlign:'center', marginTop:8}}>Grado: {severity.toUpperCase()}</Text>
    )}
  </View>);

  const StepF2 = () => (
    <View>
      <NavRow onBack={()=>{
        ['cortical','cervical','lumbasacro'].forEach(v => v && removeConclusion(v));
        setStep('E2');
      }} onReset={resetAll}/>
      <Text style={styles.stepTitle}>REGIÓN / ESTÍMULO:</Text>
      <ConclusionBtn value="cortical"   title=" a través de región medular anterolateral al estímulo en corteza motora primaria." label="CORTICAL"   onPress={()=>goTo('G')} />
      <ConclusionBtn value="cervical"   title=" a través de región medular anterolateral al estímulo en astas y raíces cervicales."                 label="CERVICAL"   onPress={()=>goTo('G')} />
      <ConclusionBtn value="lumbasacro" title=" a través de región medular anterolateral al estímulo en astas y raíces lumbosacras."               label="LUMBOSACRO" onPress={()=>goTo('G')} />
    </View>
  );



  const currentStepComponent = ()=>{ switch(step){
    case 'A':return <StepA/>; case 'B':return <StepB/>; case 'C1':return <StepC1/>;
    case 'C2':return <StepC2/>; case 'D1':return <StepD1/>; case 'D2':return <StepD2/>;
    case 'E':return <StepE/>; case 'E2':return <StepE2/>; case 'F':return <StepF/>; case 'F2':return <StepF2/>;
    case 'G':  case 'H':
      return (
        <View>
          <FinalExportUICortico
            isLandscape={isLandscape}
            manejarSeleccionImagen={manejarSeleccionImagen}
            onToolbarBack={handleBack}
            onReset={resetAll}
            onExport={handleExportRequest}
            exporting={exporting}
            activeTab={activeTab}
            onOpenGallery={()=>setMostrarGaleria(true)}
            comentarioLista={comentarioLista}
            setComentarioLista={setComentarioLista}
            imgListaSrc={imgListaSrc}
            setImgListaSrc={setImgListaSrc}
            onFocusComentario={() => setEvitarRelayoutPorTeclado(true)}
            onBlurComentario={() => setEvitarRelayoutPorTeclado(false)}
            onOpenComentarioModal={() => setModalComentarioVisible(true)}
            onGenerateLink={generateShareLink}
            onRequestTemplate={requestTemplateForLink}
            defaultTitle={defaultTitle}
            defaultMessage={defaultMessage}
            autoReportName={autoReportName}
          />
        </View>
      );
    default:return null; }};

  const [showEditModal, setShowEditModal] = useState(false);
  const [textoEditadoManualmente, setTextoEditadoManualmente] = useState(false);

 useEffect(() => {
    // cada vez que se recalcula textoReporte, actualiza el editable
    // solo actualiza si no se ha editado manualmente
    if (!textoEditadoManualmente) {
      setTextoVisual(textoReporte);
    }
  }, [textoReporte, textoEditadoManualmente]);
  
  /* ===================== UI WRAPPER ===================== */
  return (
    <ReportContext.Provider value={{conclusions,addConclusion,removeConclusion}}>
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

        <ScrollView contentContainerStyle={styles.scrollContent}
  keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
  keyboardShouldPersistTaps="always"
  removeClippedSubviews={false}>
          {isLandscape ? (
            /* ========= HORIZONTAL: 3 columnas (30/40/30) ========= */
            <View style={styles.landRow}>
              {/* IZQUIERDA */}
              <View style={[styles.landLeft, styles.landCol_ls]}>
                {(step === 'G' || step === 'H')
                  ? (
                    <LeftColLandscapeFinal
                      onToolbarBack={handleBack}
                      onReset={resetAll}
                      onExport={handleExportRequest}
                      exporting={exporting}
                      manejarSeleccionImagen={manejarSeleccionImagen}
                      activeTab={activeTab}
                      onOpenGallery={()=>setMostrarGaleria(true)}
                      comentarioLista={comentarioLista}
                      setComentarioLista={setComentarioLista}
                      imgListaSrc={imgListaSrc}
                      setImgListaSrc={setImgListaSrc}
                      onFocusComentario={() => setEvitarRelayoutPorTeclado(true)}
                      onBlurComentario={() => setEvitarRelayoutPorTeclado(false)}
                      onOpenComentarioModal={() => setModalComentarioVisible(true)}
                      onGenerateLink={generateShareLink}
                      onRequestTemplate={requestTemplateForLink}
                      defaultTitle={defaultTitle}
                      defaultMessage={defaultMessage}
                      autoReportName={autoReportName}
                    />
                  )
                  : (
                    <View style={styles.stepCard}>
                      {/* Nav con íconos en pasos intermedios */}
                      {currentStepComponent()}
                    </View>
                  )
                }
              </View>

              {/* CENTRO: lámina */}
              <View style={[styles.landCenter, styles.landCol_ls]}>
                <View
                  style={[styles.imageBox, { aspectRatio: BASE_AR }]}
                  onLayout={e=>{
                  if (evitarRelayoutPorTeclado) return; //  evita recomponer mientras el input tiene foco
  const { width, height } = e.nativeEvent.layout;
  setLimites(prev => (prev.width === width && prev.height === height) ? prev : { width, height });
  setImgSize(prev => (prev?.w === width && prev?.h === height) ? prev : { w: width, h: height });
                  }}
                >
                  {!!nombrePaciente && <Text style={styles.pacienteBadge}>{nombrePaciente}</Text>}
                  <Image source={IMG_BASE} style={styles.layer} resizeMode="contain" />
                  {activeOverlays
                    .flatMap(key => {
                      const src = (OVERLAYS_CE as any)[key];
                      if (!src) { console.warn('[Overlay no encontrado]', key); return []; }
                      return Array.isArray(src) ? src : [src];
                    })
                    .map((imgSrc, idx) => (
                      <Image key={`ov${idx}`} source={imgSrc} style={styles.layer} resizeMode="contain"/>
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

              {/* DERECHA: tabs + resumen */}
              <View style={[styles.landRight, styles.landCol_ls]}>
                <View style={styles.modeSelector}>
                  <TouchableOpacity
                    style={[styles.modeBtn, activeTab==='reporte' && styles.modeBtnActive]}
                    onPress={()=>setActiveTab('reporte')}>
                    <Text style={styles.modeTxt}>Reporte</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modeBtn, activeTab==='lista' && styles.modeBtnActive]}
                    onPress={()=>setActiveTab('lista')}>
                    <Text style={styles.modeTxt}>Lista</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modeBtn, activeTab==='GenerarLink' && styles.modeBtnActive]}
                    onPress={()=>setActiveTab('GenerarLink')}>
                    <Text style={styles.modeTxt}>GenerarLink</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.reporteContainer, styles.repBoxLandscape]}>
                  <Text style={styles.reporteTitle}>Vía Corticoespinal</Text>
                  {activeTab === 'lista'
                    ? listaMotor.map(({k, v}) => (
                        <Text key={k} style={styles.reporteTexto}>
                          <Text style={{fontWeight:'bold'}}>{k} - </Text>{v}
                        </Text>
                      ))
                    : <Text style={[styles.reporteTexto, { textAlign:'justify' }]}>{textoReporte}</Text>}
                </View>
              </View>
            </View>
          ) : (
            /* ========= VERTICAL ========= */
            <>
              {/* Lámina */}
              <View
                style={[styles.imageBox, { aspectRatio: BASE_AR }]}
                onLayout={e=>{
                  if (evitarRelayoutPorTeclado) return; // evita recomponer mientras el input tiene foco
  const { width, height } = e.nativeEvent.layout;
  setLimites(prev => (prev.width === width && prev.height === height) ? prev : { width, height });
  setImgSize(prev => (prev?.w === width && prev?.h === height) ? prev : { w: width, h: height });
                }}
              >
                {!!nombrePaciente && <Text style={styles.pacienteBadge}>{nombrePaciente}</Text>}
                <Image source={IMG_BASE} style={styles.layer} resizeMode="contain" />
                {activeOverlays
                  .flatMap(key => {
                    const src = (OVERLAYS_CE as any)[key];
                    if (!src) { console.warn('[Overlay no encontrado]', key); return []; }
                    return Array.isArray(src) ? src : [src];
                  })
                  .map((imgSrc, idx) => (
                    <Image key={`ov${idx}`} source={imgSrc} style={styles.layer} resizeMode="contain"/>
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

              {/* Paso actual + nav con íconos */}
              <View style={styles.stepCard}>
                {currentStepComponent()}
              </View>

              {/* Selector tabs */}
              <View style={styles.modeSelector}>
                <TouchableOpacity style={[styles.modeBtn, activeTab==='reporte' && styles.modeBtnActive]} onPress={()=>setActiveTab('reporte')}>
                  <Text style={styles.modeTxt}>Reporte</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modeBtn, activeTab==='lista' && styles.modeBtnActive]} onPress={()=>setActiveTab('lista')}>
                  <Text style={styles.modeTxt}>Lista</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modeBtn, activeTab==='GenerarLink' && styles.modeBtnActive]} onPress={()=>setActiveTab('GenerarLink')}>
                  <Text style={styles.modeTxt}>GenerarLink</Text>
                </TouchableOpacity>
              </View>

              {/* Resumen */}
              <View style={styles.reporteContainer}>
                <Text style={styles.reporteTitle}>Vía Corticoespinal</Text>
                {activeTab === 'lista'
                  ? listaMotor.map(({k, v}) => (
                      <Text key={k} style={styles.reporteTexto}>
                        <Text style={{fontWeight:'bold'}}>{k} - </Text>{v}
                      </Text>
                    ))
                  :                       
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
                  </View>}
              </View>
            </>
          )}
        </ScrollView>

        {/* ====== GALERÍA emergente ====== */}
        {mostrarGaleria && (
          <GaleriaEmergente
            visible={mostrarGaleria}
            onClose={() => setMostrarGaleria(false)}
            onImagenSeleccionada={(src) => {
              setImgListaSrc(toImageSource(src));
              setMostrarGaleria(false);
              setActiveTab('lista');
            }}
          />
        )}

        {/* ====== EXPORT: HOJA 1 (oculta) ====== */}
        <View
          ref={exportRef}
          style={{
            position:'absolute', left:0, top:0, zIndex:-1,
            width: pageWpx, height: pageHpx, backgroundColor: exportBgColor, pointerEvents:'none',
            padding: pad, flexDirection:'column',
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
            height: headerTotalHpx, backgroundColor:'transparent',
            paddingHorizontal: px(pdf.header.padH),
            paddingTop: headerPadTopPx,
            paddingBottom: headerPadBottomPx,
            justifyContent:'center',
          }}>
            <View style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between'}}>
              <Text numberOfLines={1} style={{ color:'#000', fontWeight: pdf.header.patient.weight, fontSize: px(pdf.header.patient.nameSize) }}>
                <Text style={{ fontSize: px(pdf.header.patient.labelSize) }}></Text>
                {nombrePaciente || 'Sin especificar'}
              </Text>

              {!!userData?.imageUrl && (
                <View style={{
                  position:'relative',
                  width: px(pdf.header.logo.size + pdf.header.logo.fogPad*2),
                  height: px(pdf.header.logo.size + pdf.header.logo.fogPad*2),
                  justifyContent:'center', alignItems:'center', marginLeft: px(8),
                }}>
                  <View style={{ position:'absolute', width:'100%', height:'100%', backgroundColor:'#fff', opacity: pdf.header.logo.fogOpacity, borderRadius: px(10) }} />
                  <Image source={{ uri: userData.imageUrl }} resizeMode="contain"
                    style={{ width: px(pdf.header.logo.size), height: px(pdf.header.logo.size), borderRadius: px(8), opacity: pdf.header.logo.opacity }}/>
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
            backgroundColor: 'transparent',
          }}>
            <CanvasView w={laminaWpx} h={laminaHpx} transparentBg={plantillaId !== 'none'}/>
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
            paddingVertical: px(pdf.footer.padV),
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

        {/* ====== EXPORT: HOJA 2 (oculta) ====== */}
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
          {/* Layout en 2 filas: arriba (2 columnas) / abajo (imagen) */}
          <View style={{ flex: 1, flexDirection: 'column' }}>
            {/* arriba del contenido de la hoja 2 */}
            <View style={{ height: px(Math.max(0, (pdf.page2?.shiftDown ?? 0) - 5)) }} />
            <View style={{ flexDirection:'row', flex:1 }}>
             {/* LISTA (debe coincidir con pantalla) */}
<View style={{ flex: 1,
        marginRight: px(6),
        paddingVertical: px(10),
        paddingLeft: px(50),
        paddingRight: px(14),  }}>
  <Text style={{ fontWeight:'700', fontSize: px(12), marginBottom: px(2), color:'#000' }}>{' '}</Text>
  {listaMotor.map(({k, v}) => (
    <Text key={k} style={{ fontSize: px(9.2), color:'#000', marginBottom: px(4), lineHeight: px(13) }}>
      <Text style={{ fontWeight:'700' }}>{k} - </Text>{v}
    </Text>
  ))}
</View>


              {/* COMENTARIO */}
              <View style={{ flex:1, borderWidth:1, borderColor:'transparent', padding: px(10), marginLeft: px(6) }}>
                <Text style={{ fontWeight:'700', fontSize: px(12), marginBottom: px(6), color:'#000' }} >{' '}</Text>
                <Text style={{ fontSize: px(9.2), color:'#000', lineHeight: px(13), textAlign: 'justify' }}>
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
                   height: undefined,         //  deja que calcule el alto
                   aspectRatio: imgListaAR || 16/9,  //  alto natural; fallback
                   maxHeight: '100%',         //  no se salga del bloque
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

      {/* Overlay de carga export */}
      {exporting && (
        <View style={styles.loadingOverlay}>
          <Circle size={40} color="#ff9100ff" />
          <AnimatedLetters
            key={rerenderKey}
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

/* ===================== ESTILOS ===================== */
const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:'#000'},
  justify: { textAlign: 'justify' },
  topBar:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:10},
  topBarInputWrap:{flex:1},

  scrollContent:{padding:10, flexGrow:1},

  imageBox:{width:'100%',backgroundColor:'#222',borderRadius:20,overflow:'hidden',marginBottom:10,position:'relative'},
  layer:{position:'absolute',top:0,left:0,width:'100%',height:'100%'},
  pacienteBadge:{
    position:'absolute', top:8, left:8, zIndex:3,
    color:'#fff', backgroundColor:'rgba(0,0,0,0.6)',
    paddingHorizontal:6, paddingVertical:2, borderRadius:4, fontSize:12, fontWeight:'600'
  },

  /* Tabs */
  modeSelector:{flexDirection:'row',justifyContent:'center',marginBottom:10, flexWrap:'wrap'},
  modeBtn:{paddingVertical:8,paddingHorizontal:18,backgroundColor:'#222',borderRadius:8,marginHorizontal:6, marginBottom:6},
  modeBtnActive:{backgroundColor:'#ff4500'},
  modeTxt:{color:'#fff',fontSize:14},

  /* Resumen */
  reporteContainer:{backgroundColor:'#111',borderRadius:10,padding:15,borderWidth:1,borderColor:'#333',marginBottom:10},
  repBoxLandscape:{alignSelf:'stretch', width:'100%'},
  reporteTitle:{color:'orange',fontSize:18,fontWeight:'bold',marginBottom:8, textAlign:'center'},
  reporteTexto:{color:'#fff',fontSize:14,lineHeight:20, flexShrink:1},

  /* Paso */
  stepCard:{backgroundColor:'#000',borderWidth:1,borderColor:'#fff',borderRadius:12,padding:12,marginBottom: 16},
  stepTitle:{color:'#fff',fontSize:18,fontWeight:'bold',textAlign:'center',marginBottom:10},
  conclusionBtn:{backgroundColor:'#111',borderRadius:30,borderWidth:1,borderColor:'#444',paddingVertical:12,marginBottom:8},
  conclusionBtnText:{color:'#fff',textAlign:'center',fontSize:14},

  /* Nav toolbar-style */
  navRow:{flexDirection:'row',marginBottom:10,justifyContent:'center'},
  toolbarRow:{flexDirection:'row',justifyContent:'center',alignItems:'center',marginBottom:0},
  toolbarIcon:{marginHorizontal:8},
  iconCircle:{width:40,height:40,borderRadius:46,borderWidth:1.5,borderColor:'#ff4500',alignItems:'center',justifyContent:'center'},
  iconCircle_ls:{width:44,height:44,borderRadius:18},
  menuItemIcon:{width:30,height:30,resizeMode:'contain',tintColor:'#fff'},
  menuItemIcon_ls:{width:36,height:36},

  // ===== figuras =====
  figBlock:{marginTop:10,alignItems:'center'},
  tituloFiguras:{flexDirection:'row',alignItems:'center',justifyContent:'center',marginBottom:10},
  imagenCirculo:{width:60,height:60,borderRadius:40,borderWidth:2,borderColor:'#fff'},
  imagenCuadro:{width:60,height:60,borderWidth:2,borderColor:'#fff',marginLeft:20},
  imagenCirculo_ls:{width:60,height:60,borderRadius:40},
  imagenCuadro_ls:{width:60,height:60,marginLeft:16},

  /* ====== Layout export estilo Visual ====== */
  exportHeader:{width:'100%',alignItems:'center',marginBottom:8},
  exportTwoCols:{flexDirection:'row',width:'100%',marginTop:10 ,justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10},
  exportTwoCols_ls:{gap:12},
  exportLeft_ls:{flex:2,paddingRight:10,borderRightWidth:1,borderRightColor:'#333'},
  exportRight_ls:{flex:1,paddingLeft:10},

  /* ====== Landscape: 3 columnas 30/40/30 ====== */
  landRow:{width:'100%',flexDirection:'row',alignItems:'stretch'},
  landLeft:{flex:3, paddingRight:0, minHeight:0, overflow:'hidden', gap:20},
  landCenter:{flex:4, paddingHorizontal:6, minHeight:0, overflow:'hidden', justifyContent:'flex-start'},
  landRight:{flex:3, paddingLeft:0, minHeight:0, overflow:'hidden'},
  landCol_ls:{alignSelf:'stretch'},

  /* Export box (blanco/negro) */
  exportReportBoxWhite:{ backgroundColor:'#fff', borderTopWidth:1, borderTopColor:'#ddd', paddingHorizontal:16, paddingVertical:12 },

  /* Loading overlay */
  loadingOverlay:{ ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', alignItems:'center', zIndex:9999 },
  loadingText:{ marginTop:12, fontSize:16, color:'#fff', fontWeight:'600' },

  /* Placeholders / Entrada “Lista” */
  placeholderBox:{ backgroundColor:'#111', borderRadius:10, borderWidth:1, borderColor:'#333', padding:12, marginTop:6, alignSelf:'stretch' },
  placeholderTitle:{ color:'#fff', fontSize:16, fontWeight:'700', textAlign:'center', marginBottom:6 },
  placeholderText:{ color:'#bbb', fontSize:12, textAlign:'center' },

  BotonReporte:{    width: 120,
    height: 80, borderRadius:12, overflow:'hidden', borderWidth:1, borderColor:'#444', backgroundColor:'#222', alignSelf:'center', marginBottom:12 },
  backgroundBoton:{ flex:1, alignItems:'center', justifyContent:'center' },
  imagenFondoBoton:{ resizeMode:'cover', opacity:0.9 },
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
   exportHeader_ls: {
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  // Agrega estas dos reglas a tus estilos (si no existen)
exportColumna: {
  flexDirection: 'row',
  justifyContent: 'center',
  width: '100%',
  marginTop: 30,
  marginBottom: 30,
},
exportColumna_ls: {
  gap: 12,
},

inputReporteMultiline: {
  minHeight: 110,
  maxHeight: 110,
  lineHeight: 18,
  paddingTop: 10,
  paddingBottom: 10,
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


});
