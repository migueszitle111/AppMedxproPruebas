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

const imagenCuerpo = require('../../../assets/CuerpoPng/UnionMuscularIMG/BP_UnionMuscular.png');
const IMG_BASE_TRANSPARENT = require('../../../assets/CuerpoPng/UnionMuscularIMG/BP_UTR.png');
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

// === Bucket de storage (igual al de Unión) ===
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

// (opcional) deducir mime por extensión
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

  debug: boolean;            // pinta bordes guía
};

const DEFAULT_PDF: PdfConfig = {
  paper: 'A4',
  orientation: 'portrait',
  renderScale: 1,           // si quieres más nitidez, usa 2
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
      siguiente?: Jerarquia;
      texto?: string;
      } | Jerarquia)[];
      siguiente?: Jerarquia;
}

const Pronostico = {
      titulo: 'Recuperación',
      seleccionMultiple: false,
      opciones: [
      {nombre: 'Completo al reposo', texto: ' con recuperación completa al reposo.'},
      {nombre: 'Parcial al reposo', texto: ' con recuperación parcial al reposo.'},
      {nombre: 'Sin recuparación', texto: ' sin recuperación al reposo.'},
      ]
};


const Intensidad = {
      titulo: 'Intensidad',
      seleccionMultiple: false,
      opciones: [
      {nombre: 'Leve', texto: ' de intensidad leve', siguiente: Pronostico},
      {nombre: 'Moderada', texto: ' de intensidad moderada', siguiente: Pronostico},
      {nombre: 'Severa', texto: ' de intensidad severa', siguiente: Pronostico},
      ]
};

const Agregado = {
      titulo: 'Agregado (Opcional)',
      seleccionMultiple: false,
      opciones: [
      {nombre: 'Riesgo alto de compromiso repiratorio', texto: ' (alto compromiso respiratorio)', siguiente: Intensidad},
      {nombre: 'Riesgo bajo de compromiso repiratorio', texto: ' (bajo compromiso respiratorio)', siguiente: Intensidad},
      ]
};

const Distribucion = {
      titulo: 'Distribución',
      seleccionMultiple: true,
      opciones: [
      {nombre: 'Bulbar', texto: ' de distribución bulbar.', siguiente: Agregado},
      {nombre: 'Proximal', texto: ' de distribución proximal.', siguiente: Agregado},
      {nombre: 'Distal', texto: ' de distribución distal.', siguiente: Agregado},
      ]
};


const Fisiopatologia = {
      titulo: 'Fisiopatología',
      seleccionMultiple: false,
      opciones: [
      {nombre: 'Presináptico', textoR:'Tipo presináptico', texto: ' tipo presináptico', siguiente: Distribucion},
      {nombre: 'Postsináptico' , textoR:'Tipo postsináptico', texto: ' tipo postsináptico', siguiente: Distribucion},
      ]
};



const estructuraJerarquica: Jerarquia = {
      titulo: 'Clasificación',
      seleccionMultiple: false,
      opciones: [
      {nombre: 'Adquirida', texto: 'Bloqueo de la unión neuromuscular adquirida,', siguiente: Fisiopatologia},
      {nombre: 'Hereditaria' , texto: 'Bloqueo de la unión neuromuscular hereditaria,', siguiente: Fisiopatologia},
      ],
};


const zonasOverlay = {
  'Bulbar': { top: 10, height: 60 },
  'Proximal': { top: 10, height: 60 },
  'Distal': { top: 10, height: 60 },
  'Presináptico': { top: 10, height: 60 },
  'Postsináptico': { top: 10, height: 60 },
  
};

const imagenesOverlay: Record<string, any> = {
  'Bulbar': require('../../../assets/CuerpoPng/UnionMuscularIMG/UN_Bulbar.png'),
  'Proximal': require('../../../assets/CuerpoPng/UnionMuscularIMG/UN_Proximal.png'),
  'Distal': require('../../../assets/CuerpoPng/UnionMuscularIMG/UN_Distal.png'),
  'Presináptico': require('../../../assets/CuerpoPng/UnionMuscularIMG/UN_Presinaptico.png'),
  'Postsináptico': require('../../../assets/CuerpoPng/UnionMuscularIMG/UN_Postsinaptico.png'),
  
};


function ReporteScreen(): React.JSX.Element {
  const leftCanvasRef = useRef<View>(null);     // contenedor visible de la lámina
  const [shot, setShot] = useState<string|null>(null); // base64 de la captura
  const [ruta, setRuta] = useState([estructuraJerarquica]);
  const [seleccionMultiple, setSeleccionMultiple] = useState<string[]>([]);
  const [resumen, setResumen] = useState<string[]>([]);
  const [figuras, setFiguras] = useState<Figura[]>([]);
  const scrollPrincipalRef = useRef<ScrollView>(null);
  const [mostrarMiniatura, setMostrarMiniatura] = useState(false);
  const [distribucionFinalizada, setDistribucionFinalizada] = useState(false);
  const [exportKey, setExportKey] = useState(0);
  const [nombrePaciente, setNombrePaciente] = useState('');
  const [imgListaSrc, setImgListaSrc] = useState<ImageSourcePropType | null>(null);
  const [comentarioLista, setComentarioLista] = useState('');
  const [comentarioHeight, setComentarioHeight] = useState(MIN_COMENTARIO_HEIGHT);
  const [suppressDim, setSuppressDim] = useState(false);
  const [resumenTextoLargo, setResumenTextoLargo] = useState<string[]>([]);
  const textoReporte = resumenTextoLargo.join(' ');
  const nivelActual = ruta[ruta.length - 1];
  // === Botón naranja: flags y texto ===
  const esPasoMultiple = !!nivelActual?.seleccionMultiple;
  const esOpcional = /Opcional/i.test(nivelActual?.titulo || '');
  const requiereMinimoUno = esPasoMultiple && !esOpcional;
  const puedeContinuar = esOpcional || !requiereMinimoUno || (seleccionMultiple.length > 0);
  /** Texto del botón naranja */
  const textoBotonNaranja = esPasoMultiple ? (esOpcional ? 'Saltar ➔' : 'Siguiente ➔') : 'Siguiente ➔';
  const [limitesContenedor, setLimitesContenedor] = useState({ width: 0, height: 0 });
  const [isHorizontal, setIsHorizontal] = useState(false);
  const [isCargaCerrar, setIsCargaCerrar] = useState(false);
  const [mostrarGaleria, setMostrarGaleria] = useState(false);

  useEffect(() => {
    if (comentarioLista.length === 0) {
      setComentarioHeight(MIN_COMENTARIO_HEIGHT);
    }
  }, [comentarioLista]);


  /** === Nombres bonitos y consistentes (Miopatía) === */
const STUDY_KEY = 'UnionNeuromuscular';                 // sin acentos
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


  // Nombre coherente para este estudio
const reportFileName = () => {
  const base = buildBaseName(nombrePaciente);
  return `${base}.pdf`; // mEDXproMiopatia_<...>.pdf
};


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
  files, title, message, expiry, onFileProgress,
}) => {
  const studyType  = 'Unión neuromuscular';
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
const reportAb   = await buildReportPdfArrayBuffer({ studyType, doctorName, templateId: plantillaId });
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


  // 4) Completar link y devolver URL
  const done = await completeShareLink({ linkId, files: uploadedForDB });
  if (!done.ok) throw new Error(done.error);

  return done.url;
};



    const exportRef = useRef<View>(null);
          const exportRef2 = useRef<View>(null);
          const [exporting, setExporting] = useState(false);
          const [exportKind, setExportKind] = useState<'pdf'|'jpeg'|null>(null);
          const [exportSuccess, setExportSuccess] = useState<{ filename: string; path: string } | null>(null);

          // Template-related states
          const [plantillaId, setPlantillaId] = useState<PlantillaId>('none');
          const [templatePickerVisible, setTemplatePickerVisible] = useState(false);
          const [templatePickerIntent, setTemplatePickerIntent] = useState<'export' | 'link' | null>(null);
          const templatePickerPromiseRef = useRef<((id: PlantillaId | null) => void) | null>(null);
          const [pendingTemplateExport, setPendingTemplateExport] = useState<PlantillaId | null>(null);
          const exportBgColor = plantillaId === 'none' ? '#fff' : 'transparent';
          const exportarPdfRef = useRef<() => Promise<void>>(async () => {});
// === Bucket de storage (igual al de Miopatía/Visual)
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

// (opcional) deducir mime por extensión
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

// Asegurar archivo local “file://” (si algún adjunto viene en .data)
const ensureLocalFile = async (file: any) => {
  const name = file.name || 'archivo';
  const type = file.type || file.mime || guessMime(name) || 'application/octet-stream';
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
          await new Promise<void>(r => requestAnimationFrame(() => r()));
          await new Promise<void>(r => setTimeout(r, 30));
          setSuppressDim(false);                      // 🔵 vuelve a encender
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


  // Template handler functions
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



  // Helper function to load template PDF
  const loadPlantillaPdf = async (plantillaSrc: any): Promise<Uint8Array | null> => {
    try {
      const resolved = Image.resolveAssetSource(plantillaSrc);
      if (!resolved?.uri) {
        console.warn('[UnionNeuroMuscular] No se pudo resolver la plantilla PDF');
        return null;
      }

      const response = await fetch(resolved.uri);
      if (!response.ok) {
        console.warn('[UnionNeuroMuscular] Falló la carga de la plantilla PDF', response.status);
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (error) {
      console.error('[UnionNeuroMuscular] Error al cargar plantilla PDF:', error);
      return null;
    }
  };




// (opcional) si necesitas un archivo temporal local
const buildPdfTempFile = async (filename?: string) => {
  const studyType  = 'Unión neuromuscular';
  const doctorName =
    [userData?.name, userData?.lastname].filter(Boolean).join(' ') || undefined;

  const ab = await buildReportPdfArrayBuffer({ studyType, doctorName });
  const base64 = b64encode(ab);
  const RNBU: any = ReactNativeBlobUtil;
  const safe = sanitizeFilename(filename || reportFileName());
  const path = `${RNBU.fs.dirs.CacheDir}/${safe}`;
  await RNBU.fs.writeFile(path, base64, 'base64');

  return { name: safe, type: 'application/pdf', uri: `file://${path}`, path };
};

  const handleExport = () => {
    handleExportRequest();
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

      const studyType = 'Unión neuromuscular';
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
      setExporting(false);
      setExportKind(null);
    }
  };
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
      return nuevo;
    });
    } else {
      // Si la opción tiene imagen overlay, la agregamos a zonasFijas
      if (imagenesOverlay[opcion.nombre]) {
        setZonasFijas((prev) => {
          // Evita duplicados
          if (prev.includes(opcion.nombre)) return prev;
          return [...prev, opcion.nombre];
        });
      }
  
      // Si estamos en "Recuperación" y es uno de los tres botones finales, ir al paso final
      if (
        nivelActual.titulo === 'Recuperación' &&
        ['Completo al reposo', 'Parcial al reposo', 'Sin recuparación'].includes(opcion.nombre)
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
        const nuevaEntradaTexto = opcion.texto || '';
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

        // Nuevo: guardar texto largo
        const nuevaEntradaTexto = opcion.texto || '';
        let actualizadoTexto = [...resumenTextoLargo];
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


  
  const retrocederNivel = () => {
    if (nivelActual.titulo === 'Recuperación' && distribucionFinalizada) {
      // Solo volver a mostrar las opciones de distribución
      setDistribucionFinalizada(false);
      setNombrePaciente('');
      return;
    }

    // Limpia zonasFijas si vas a regresar al paso anterior a la multiselección
    if (
      ruta.length > 1 &&
      ruta[ruta.length - 2].titulo === 'Recuperación'
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
  // === Siguiente / Saltar para pasos de selección múltiple (Distribución) ===
const handleSiguiente = () => {
  if (!esPasoMultiple) return;

  const titulo = nivelActual.titulo;

  // Saltar limpio si el paso es (Opcional) y no hay selección (por si en el futuro hay multi-opcional)
  if (esOpcional && seleccionMultiple.length === 0) {
    const next = (nivelActual as any).siguiente || ((nivelActual.opciones?.[0] as any)?.siguiente ?? null);
    if (next) setRuta(prev => [...prev, next]);
    setSeleccionMultiple([]);
    return;
  }

  // Consolidar overlays elegidos (usa nombre o ImgValue si existiera)
  if (seleccionMultiple.length > 0) {
    setZonasFijas(prev => {
      const toAdd = seleccionMultiple
        .map(n => {
          const match = (nivelActual.opciones as any[])?.find(o => (o as any).nombre === n) as any;
          return match?.ImgValue || n;
        })
        .filter(k => !!imagenesOverlay[k as keyof typeof imagenesOverlay]);
      return Array.from(new Set([...prev, ...toAdd]));
    });
  }

  // Actualizar RESUMEN tipo "Distribución: Bulbar y Distal"
  const listado = seleccionMultiple.length > 0 ? joinConY(seleccionMultiple) : '—';
  const linea = `${titulo}: ${listado}`;
  setResumen(prev => {
    const idx = prev.findIndex(e => e.startsWith(`${titulo}:`));
    const out = [...prev];
    if (idx !== -1) out[idx] = linea; else out.push(linea);
    return out;
  });

  // Actualizar TEXTO LARGO (lo que muestras en "Reporte")
  setResumenTextoLargo(prev => {
    const idx = resumen.findIndex(e => e.startsWith(`${titulo}:`));
    const texto = seleccionMultiple.length > 0 ? ` ${listado}` : '';
    const out = [...prev];
    if (idx !== -1) out[idx] = texto; else out.push(texto);
    return out;
  });

  // Avanzar al siguiente nivel disponible (Agregado)
  const next = (nivelActual as any).siguiente || ((nivelActual.opciones?.[0] as any)?.siguiente ?? null);
  if (next) setRuta(prev => [...prev, next]);

  // Limpiar selección para el próximo paso
  setSeleccionMultiple([]);
};

// Saltar para single-choice opcional (p.ej. "Agregado (Opcional)")
const handleSaltarSingle = () => {
  const next = (nivelActual as any).siguiente || ((nivelActual.opciones?.[0] as any)?.siguiente ?? null);
  if (next) setRuta(prev => [...prev, next]);
  // No tocamos resumen ni resumenTextoLargo
};


  const reiniciar = () => {
    setRuta([estructuraJerarquica]);
    setResumen([]);
    setResumenTextoLargo([]);
    setSeleccionMultiple([]);
    setNombrePaciente('');
    setZonasFijas([]);
    setFiguras([]); // Limpia las figuras si usas imágenes movibles
    setDistribucionFinalizada(false); // Vuelve al flujo inicial
    setComentarioLista('');
    setImgListaSrc(null);
    setComentarioHeight(MIN_COMENTARIO_HEIGHT);
    setExportSuccess(null);
    setExportKey((prev) => prev + 1);
  };

  exportarPdfRef.current = exportarPDF;

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

  // Handle pendingTemplateExport (export with selected template)
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

  // Cambia el style activo dependiendo de la orientación
  const activeStyles = isHorizontal ? styleReporteHorizontal : styleReporte;

  const [zonasFijas, setZonasFijas] = useState<string[]>([]);
  // const zonasSeleccionadas = nivelActual.titulo === 'Recuperación' ? seleccionMultiple : zonasFijas;
  const zonasSeleccionadas = [...seleccionMultiple, ...zonasFijas];
  const [modoReporte, setModoReporte] = useState<'lista' | 'enunciado' | 'GenerarLink'>('enunciado');
  const [Filtro, setFiltro] = useState<'Filtros'>();
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

      <Animated.ScrollView contentContainerStyle={{ flexGrow: 1, }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={activeStyles.principalReporte}>
          <View style={activeStyles.leftPanel}>
            {/* Imagen */}
            <View      
            ref={leftCanvasRef}
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
                      <TouchableOpacity  onPress={() => { if ('siguiente' in nivelActual && nivelActual.siguiente)
                        {
                          setZonasFijas((prev) => {
                            const nuevas = seleccionMultiple.filter(z => !prev.includes(z));
                            return [...prev, ...nuevas];
                          });
                      }
                      }}>
                    
                      </TouchableOpacity>
                    )}
                    {['Clasificación', 'Agregado (Opcional)','Distribución'].includes(nivelActual.titulo) && 
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
                    
                      </TouchableOpacity>
                    )}
                    {nivelActual.titulo === 'Recuperación' && distribucionFinalizada ? (
                      <TouchableOpacity style={[activeStyles.iconCircle, activeStyles.printButton]}onPress={handleExport}
                        activeOpacity={0.8}>
                        <ImageBackground
                          source={require('../../../assets/03_Íconos/03_02_PNG/I_Document.png')} // Cambia la ruta a tu imagen
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
                {!(nivelActual.titulo === 'Recuperación' && distribucionFinalizada) && (
                  <Text style={[activeStyles.titleText, { marginBottom: 10 }]}>{nivelActual.titulo}</Text>
                )}


             


                {nivelActual.titulo === 'Recuperación' && distribucionFinalizada ? (
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
                : <Text style={activeStyles.estadoImagenVacia}></Text>
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
                  nivelActual.titulo === 'Recuperación ' && { width: '63%', marginRight: 120 }
                ]} >
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

                  {/* Botón naranja para pasos multiselección (Distribución) */}
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
                style={[{ padding: 10, borderRadius: 8, marginHorizontal: 5, backgroundColor: modoReporte === 'GenerarLink' ? '#ff4500' : '#222'}]}
                onPress={() => setModoReporte('GenerarLink')}
              >
                <Text style={{ color: '#fff' }}>GenerarLink</Text>
              </TouchableOpacity>

              </View>

              {/* Reporte generado */}
              <View style={activeStyles.reporteContainer}>
                <Text style={activeStyles.reporteTitle}>Unión neuromuscular</Text>
                {nombrePaciente.trim() !== '' && (
                  <Text style={[activeStyles.reporteTexto, { fontWeight: 'bold', marginBottom: 5 }]}>
                    Paciente: {nombrePaciente}
                  </Text>
                )}
                {modoReporte === 'lista'
                  ? resumen.map((linea, index) => (
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
                          {nombrePaciente }
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
                        <View style={{ flex: 1, marginRight: px(6), paddingVertical: px(10), paddingLeft: px(36), paddingRight: px(14),backgroundColor:'transparent' }}>
                          <Text style={{ fontWeight: '700', fontSize: px(12), marginBottom: px(6), color: '#000' }}>Unión Neuromuscular
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
   btnNaranja: {
    marginTop: 10,
    marginBottom: 10,
    padding: 8,
    borderRadius: 5,
    backgroundColor: '#ff4500',
    alignSelf: 'center',
  },
  btnNaranjaDisabled: { opacity: 0.5 },
  btnNaranjaTxt: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 0.3 },

  
GenerarLinkWrap: {
    alignSelf: 'stretch',   // ← se pega al ancho disponible del padre
    width: '100%',
    minHeight: 0,           // ← evita desbordes en Android dentro de flex
    paddingHorizontal: 0,   // el padding lo da la ‘Card’ para no sumar con el padre
    paddingVertical: 8,
    gap: 10,
  },
  GenerarLinkTitulo: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  GenerarLinkCard: {
    alignSelf: 'stretch',
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    padding: 10,
    overflow: 'hidden',     // ← si el hijo intenta salirse, lo recorta
  },

  card: {
  alignSelf: 'stretch',
  width: '100%',        // 👈 fuerza a ocupar el ancho del contenedor
  maxWidth: '100%',     // 👈 evita que crezca más allá
  flexShrink: 1,        // 👈 si el padre es row/center, no se desborda
  backgroundColor: '#111',
  borderWidth: 1,
  borderColor: '#333',
  borderRadius: 12,
  padding: 12,
},
});
