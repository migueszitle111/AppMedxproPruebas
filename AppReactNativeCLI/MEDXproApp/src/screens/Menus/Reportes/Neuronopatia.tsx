/* src/screens/reporte/ReporteNeuronopatiaScreen.tsx */
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, ImageBackground,
  PermissionsAndroid, Platform, Permission, Alert, Animated, TextInput, ActivityIndicator,
  InteractionManager, Keyboard
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Header from '../../../components/Header';
import DocumentPicker from 'react-native-document-picker';
import { launchImageLibrary } from 'react-native-image-picker';
import uuid from 'react-native-uuid';
import FiguraMovible from '../../../components/FiguraMovible';
import { Figura } from '../../../navigation/types';
import { escanearImagen } from '../../../utils/EscanearImagen';
import Orientation, { OrientationType } from 'react-native-orientation-locker';
import styleReporte from '../../../styles/styleReporte';
import styleReporteHorizontal from '../../../styles/styleReporteHorizontal';
import FancyInput from '../../../components/FancyInput';
import GaleriaEmergente from './GaleriaTb';
import type { ImageSourcePropType } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../../../constants/config';

import { captureRef } from 'react-native-view-shot';
import { PDFDocument } from 'pdf-lib';
import ReactNativeBlobUtil from 'react-native-blob-util';

// Link y storage
import LinkUploader, { type LinkUploaderProps } from '../../../components/LinkUploader';
import TemplatePickerButton from '../../../components/TemplatePickerButton';
import { supabase } from '../../../lib/supabase';
import { initShareLink, completeShareLink } from '../../../services/shareLinks';
import { decode as b64decode, encode as b64encode } from 'base64-arraybuffer';
import TemplatePickerModal, { type PlantillaId } from '../../../components/TemplatePickerModal';

import {
  PLANTILLAS_PDF, buildPdfWithTemplate,
  type PdfBuildConfig,
} from '../../../components/pdfLoadingTemplate';

//Modal de exito - Exportar pdf
import { ExportSuccessModal } from '../../../components/ExportSuccessModal';
import EditTextModal from '../../../components/EditTextModal';
import ComentarioModal from '../../../components/ComentarioModal';

// Lamina base
const IMG_BASE = require('../../../assets/CuerpoPng/UnionMuscularIMG/BP_UnionMuscular.png');
const IMG_BASE_TRANSPARENT = require('../../../assets/CuerpoPng/UnionMuscularIMG/BP_UTR.png');
const BASE_SRC = Image.resolveAssetSource(IMG_BASE);
const BASE_AR = BASE_SRC.width / BASE_SRC.height;

/* Íconos barra */
const I_Out = require('../../../assets/03_Íconos/03_02_PNG/I_Out2.png');
const I_Repeat = require('../../../assets/03_Íconos/03_02_PNG/I_Repeat2.png');
const I_Doc = require('../../../assets/03_Íconos/03_02_PNG/I_Document.png');
const I_In = require('../../../assets/03_Íconos/03_02_PNG/I_In2.png');


// === Bucket de storage 
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
  renderScale: 1,
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
    pullUp: 90, borderW: 1, borderColor: '#ffffffff', radius: 10,
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

/* ====== Jerarquía y overlays ====== */
interface Jerarquia {
  titulo: string;
  seleccionMultiple: boolean;
  opciones: ({
    nombre: string;
    siguiente?: Jerarquia;
    texto?: string;
    ImgValue?: string;
  } | Jerarquia)[];
  siguiente?: Jerarquia;
}

const PronosticoB = {
  titulo: 'Pronóstico de recuperación',
  seleccionMultiple: false,
  opciones: [
    { nombre: 'Completo', texto: '\n\nPronóstico de recuperación completo.' },
    { nombre: 'Pobre', texto: '\n\nPronóstico de recuperación pobre no funcional.' },
    { nombre: 'Nulo', texto: '\n\nPronóstico de recuperación nulo.' },
    { nombre: 'Incierto', texto: '\n\nPronóstico de recuperación incierto.' },
  ],
};

const Pronostico = {
  titulo: 'Pronóstico de recuperación',
  seleccionMultiple: false,
  opciones: [
    { nombre: 'Completo', texto: 'pronóstico de recuperación completo.' },
    { nombre: 'Pobre', texto: 'pronóstico de recuperación pobre no funcional.' },
    { nombre: 'Nulo', texto: 'pronóstico de recuperación nulo.' },
    { nombre: 'Incierto', texto: 'pronóstico de recuperación incierto.' },
  ],
};

const Reinervacion = {
  titulo: 'Reinervación',
  seleccionMultiple: false,
  opciones: [
    { nombre: 'Abundante', texto: '\n\nReinervación abundante;', siguiente: Pronostico },
    { nombre: 'Discreta',  texto: '\n\nReinervación discreta;',  siguiente: Pronostico },
    { nombre: 'Ausente',   texto: '\n\nSin reinervación;',       siguiente: Pronostico },
  ],
};

const TopografiaB = {
  titulo: 'Topografía',
  seleccionMultiple: false,
  opciones: [
    { nombre: 'Simétrica',  texto: ' simétrica. ',  siguiente: PronosticoB },
    { nombre: 'Asimétrica', texto: ' asimétrica. ', siguiente: PronosticoB },
  ],
};

const Topografia = {
  titulo: 'Topografía',
  seleccionMultiple: false,
  opciones: [
    { nombre: 'Simétrica',  texto: ' simétrica. ',  siguiente: Reinervacion },
    { nombre: 'Asimétrica', texto: ' asimétrica. ', siguiente: Reinervacion },
  ],
};

const DistribicionB = {
  titulo: 'Distribución',
  seleccionMultiple: false,
  opciones: [
    { nombre: 'Generalizada', texto: 'distribución generalizada', siguiente: TopografiaB },
    { nombre: 'Parcial',      texto: 'distribución parcial',      siguiente: TopografiaB },
  ],
};

const Distribuciones = {
  titulo: 'Distribución',
  seleccionMultiple: true,
  opciones: [
    { nombre: 'Bulbar',   texto: 'bulbar',   siguiente: Topografia, ImgValue: 'AsBulbar' },
    { nombre: 'Cervical', texto: 'cervical', siguiente: Topografia, ImgValue: 'AsCervical' },
    { nombre: 'Torácica', texto: 'torácica', siguiente: Topografia, ImgValue: 'AsTorácica' },
    { nombre: 'Lumbar',   texto: 'lumbar',   siguiente: Topografia, ImgValue: 'AsLumbar' },
  ],
};

const Denervacion = {
  titulo: 'Denervación',
  seleccionMultiple: false,
  opciones: [
    { nombre: 'Difusa Severa (++++)',       texto: 'con denervación difusa severa (++++)',        siguiente: Distribuciones },
    { nombre: 'Abundante Progresiva (+++)', texto: 'con denervación abundante progresiva (+++)',   siguiente: Distribuciones },
    { nombre: 'Activa Moderada (++)',       texto: 'con denervación activa moderada (++)',         siguiente: Distribuciones },
    { nombre: 'Leve (+/+)',                 texto: 'con denervación activa moderada (++)',         siguiente: Distribuciones },
    { nombre: 'Inactiva',                   texto: 'sin denervación activa',                        siguiente: Distribuciones },
  ],
};

const clasificacionB: Jerarquia = {
  titulo: 'Clasificación',
  seleccionMultiple: false,
  opciones: [
    { nombre: 'Hereditaria', texto: 'hereditaria,', siguiente: DistribicionB },
    { nombre: 'Adquirida',   texto: 'adquirida,',   siguiente: DistribicionB },
  ],
};

const clasificacion: Jerarquia = {
  titulo: 'Clasificación',
  seleccionMultiple: false,
  opciones: [
    { nombre: 'Hereditaria', texto: 'hereditaria,', siguiente: Denervacion },
    { nombre: 'Adquirida',   texto: 'adquirida,',   siguiente: Denervacion },
  ],
};

const estructuraJerarquica: Jerarquia = {
  titulo: 'Fibras',
  seleccionMultiple: false,
  opciones: [
    { nombre: 'Motora-Asta anterior medular', texto: 'Neuronopatía motora (asta anterior medular)', siguiente: clasificacion },
    { nombre: 'Sensitiva-Ganglio de la Raíz Dorsal', texto: 'Neuronopatía sensitiva (ganglio de la raíz dorsal)', siguiente: clasificacionB, ImgValue: 'AsSensitiva-Ganglio de la Raíz Dorsal' },
  ],
};

const zonasOverlay = {
  'Bulbar': { top: 10, height: 60 },
  'Cervical': { top: 10, height: 60 },
  'Torácica': { top: 10, height: 60 },
  'Lumbar': { top: 10, height: 60 },
  'Sensitiva-Ganglio de la Raíz Dorsal': { top: 10, height: 60 },
  'AsBulbar': { top: 10, height: 60 },
  'AsCervical': { top: 10, height: 60 },
  'AsTorácica': { top: 10, height: 60 },
  'AsLumbar': { top: 10, height: 60 },
  'AsSensitiva-Ganglio de la Raíz Dorsal': { top: 10, height: 60 },
} as const;

const imagenesOverlay: Record<string, any> = {
  'Bulbar': require('../../../assets/CuerpoPng/Neuronopatia/Bulbar.png'),
  'Cervical': require('../../../assets/CuerpoPng/Neuronopatia/Cervical.png'),
  'Torácica': require('../../../assets/CuerpoPng/Neuronopatia/Toracico.png'),
  'Lumbar': require('../../../assets/CuerpoPng/Neuronopatia/Lumbar.png'),
  'Sensitiva-Ganglio de la Raíz Dorsal': require('../../../assets/CuerpoPng/Neuronopatia/Sensitiva.png'),
  'AsBulbar': require('../../../assets/CuerpoPng/Neuronopatia/Asimetrica_bulbar.png'),
  'AsCervical': require('../../../assets/CuerpoPng/Neuronopatia/Asimetrica_cervical.png'),
  'AsTorácica': require('../../../assets/CuerpoPng/Neuronopatia/Asimetrica_toracico.png'),
  'AsLumbar': require('../../../assets/CuerpoPng/Neuronopatia/Asimetrica_lumbar.png'),
  'AsSensitiva-Ganglio de la Raíz Dorsal': require('../../../assets/CuerpoPng/Neuronopatia/Asimetrica_sensitiva.png'),
};

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

/* ====== Componente principal ====== */
function ReporteScreen(): React.JSX.Element {
  /* ─── Estados ─── */
  const leftCanvasRef = useRef<View>(null);
  const [shot, setShot] = useState<string | null>(null); // base64 de la captura
  const [suppressDim, setSuppressDim] = useState(false); // para ocultar capa oscura al capturar
  const [ruta, setRuta] = useState([estructuraJerarquica]);
  const [seleccionMultiple, setSeleccionMultiple] = useState<string[]>([]);
  const [resumen, setResumen] = useState<string[]>([]);
  const [figuras, setFiguras] = useState<Figura[]>([]);
  const scrollPrincipalRef = useRef<ScrollView>(null);
  const [mostrarMiniatura, setMostrarMiniatura] = useState(false);
  const [distribucionFinalizada, setDistribucionFinalizada] = useState(false);
  const [exportKey, setExportKey] = useState(0);
  const [nombrePaciente, setNombrePaciente] = useState('');
  const [resumenTextoLargo, setResumenTextoLargo] = useState<string[]>([]);
  const nivelActual = ruta[ruta.length - 1];
  const tituloActual = (nivelActual?.titulo || '').trim();
  const [modoPrincipal, setModoPrincipal] = useState<'reporte' | 'lista' | 'filtros'>('reporte');
  type Tab = 'reporte' | 'lista' | 'filtros';
  const [activeTab, setActiveTab] = useState<Tab>('reporte'); // ← AÑADIR
  const [imgListaAR, setImgListaAR] = useState<number | null>(null);
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


  /** === Nombres bonitos y consistentes (Miopatía) === */
const STUDY_KEY = 'Neuronopatia';                 // sin acentos
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




  // Texto final del reporte que ya muestras en UI
const textoReporte = resumenTextoLargo.join(' ');


// Nombre coherente de archivo
const reportFileName = () => {
  const base = buildBaseName(nombrePaciente);
  return `${base}.pdf`; // mEDXproMiopatia_<...>.pdf
};


// Valores por defecto del uploader
const linkDefaults = React.useMemo(() => {
  // Título personalizado según el tipo de estudio
  let tipoEstudio = 'Neuronopatía';
  if (resumenTextoLargo.length > 0) {
    const textoCompleto = resumenTextoLargo.join(' ').toLowerCase();
    if (textoCompleto.includes('motora') || textoCompleto.includes('sensitiva')) {
      tipoEstudio = 'Electroneuromiografía';
    } else if (textoCompleto.includes('potencial') || textoCompleto.includes('evocado')) {
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
  const studyType  = 'Neuronopatía';
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

  // 1) Crear link (BD)
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

  // 2) Subir PDF autogenerado (a Storage)
  onFileProgress?.('__auto_report__', 0);
  const reportAb   = await buildReportPdfArrayBuffer({ studyType, doctorName, templateId: templateId as PlantillaId | null | undefined });
  const reportName = reportFileName();

  // carpeta por paciente (o base si no hay nombre)
  const basePretty = buildBaseName(nombrePaciente);
  const patientFolder = safeName(nombrePaciente || basePretty);
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

  // 3) Subir adjuntos extra (si el usuario añadió)
  const processed = new Set<string>();
  for (const file of files || []) {
    if (!file || file.id === '__auto_report__' || processed.has(file.id)) continue;
    processed.add(file.id);

    const local = (file as any).fileCopyUri || file.uri;
    const ab    = await readAsArrayBuffer(local);
    onFileProgress?.(file.id, 0);

    const safeNameFile = sanitizeFilename(file.name || `archivo_${Date.now()}`);
    const objectPath   = `${patientFolder}/${uuid.v4()}_${safeNameFile}`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, ab, {
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

  // 4) Completar link y retornar URL
  const done = await completeShareLink({ linkId, files: uploadedForDB });
  if (!done.ok) throw new Error(done.error);
  return done.url;
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

  const [limitesContenedor, setLimitesContenedor] = useState({ width: 0, height: 0 });
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);

  const [isHorizontal, setIsHorizontal] = useState(false);
  const [isCargaCerrar, setIsCargaCerrar] = useState(false);

  /* 2ª hoja: galería + comentario */
  const [mostrarGaleria, setMostrarGaleria] = useState(false);
  const [imgListaSrc, setImgListaSrc] = useState<ImageSourcePropType | null>(null);
  const [comentarioLista, setComentarioLista] = useState('');
  const [comentarioHeight, setComentarioHeight] = useState(MIN_COMENTARIO_HEIGHT);

  useEffect(() => {
    if (comentarioLista.length === 0) {
      setComentarioHeight(MIN_COMENTARIO_HEIGHT);
    }
  }, [comentarioLista]);

  const [zonasFijas, setZonasFijas] = useState<string[]>([]);

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setMostrarMiniatura(offsetY > 200);
  };
  // si src es string -> { uri: string } ; si es require(...) -> tal cual
const toImageSource = (src: string | ImageSourcePropType): ImageSourcePropType =>
  typeof src === 'string' ? { uri: src } : src;

  /* Permisos */
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
        const camOk = granted['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED;
        const readOk = (Platform.Version >= 33
          ? granted['android.permission.READ_MEDIA_IMAGES']
          : granted['android.permission.READ_EXTERNAL_STORAGE']) === PermissionsAndroid.RESULTS.GRANTED;
        return camOk && readOk;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const manejarSeleccionImagen = async (tipo: 'circle' | 'square') => {
    const permiso = await pedirPermiso();
    if (!permiso) {
      console.warn('Permiso denegado para usar la cámara o galería');
      return;
    }
    try {
      Alert.alert(
        'Seleccionar Imagen:',
        '¿Qué deseas hacer?',
        [
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
          { text: 'Cancelar', style: 'cancel' },
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
    setFiguras((prev) => prev.map((fig) => fig.id === id ? { ...fig, posicion: { x, y } } : fig));
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

  /* Avance de niveles */
  const avanzarNivel = (opcion: any) => {
    // Ajuste simetría / asimetría
    if (opcion.nombre === 'Asimétrica') {
      const zonasAsimetricas = zonasFijas.map(zona => {
        const nuevaZona = `As${zona.charAt(0).toUpperCase()}${zona.slice(1)}`;
        return imagenesOverlay[nuevaZona as keyof typeof imagenesOverlay] ? nuevaZona : zona;
      });
      setZonasFijas(zonasAsimetricas);
    } else if (opcion.nombre === 'Simétrica') {
      const zonasSimetricas = zonasFijas.map(zona => zona.startsWith('As') ? zona.substring(2) : zona);
      setZonasFijas(zonasSimetricas);
    }

    if (nivelActual.seleccionMultiple) {
      setSeleccionMultiple((prev) => {
        const nuevo = prev.includes(opcion.nombre)
          ? prev.filter((nombre) => nombre !== opcion.nombre)
          : [...prev, opcion.nombre];

        setZonasFijas((prevZonas) => {
          if (imagenesOverlay[opcion.nombre]) {
            if (prev.includes(opcion.nombre)) {
              return prevZonas.filter(z => z !== opcion.nombre);
            } else {
              if (!prevZonas.includes(opcion.nombre)) {
                return [...prevZonas, opcion.nombre];
              }
            }
          }
          return prevZonas;
        });

        const nuevaEntrada = `${nivelActual.titulo} - ${joinConY(nuevo)}`;
        let actualizado = [...resumen];
        const indexExistente = resumen.findIndex(entry => entry.startsWith(`${nivelActual.titulo} -`));
        if (indexExistente !== -1) actualizado[indexExistente] = nuevaEntrada;
        else actualizado.push(nuevaEntrada);
        setResumen(actualizado);
        return nuevo;
      });
    } else {
      if (opcion.ImgValue) {
        setZonasFijas([opcion.ImgValue]);
      } else if (imagenesOverlay[opcion.nombre]) {
        setZonasFijas((prev) => prev.includes(opcion.nombre) ? prev : [...prev, opcion.nombre]);
      }

      if (tituloActual === 'Pronóstico de recuperación' && ['Completo', 'Pobre', 'Nulo', 'Incierto'].includes(opcion.nombre)) {
        const nuevaEntrada = `${nivelActual.titulo} - ${opcion.nombre}`;
        const indexExistente = resumen.findIndex(entry => entry.startsWith(`${nivelActual.titulo} -`));
        let actualizado = [...resumen];
        if (indexExistente !== -1) actualizado[indexExistente] = nuevaEntrada;
        else actualizado.push(nuevaEntrada);
        setResumen(actualizado);

        const nuevaEntradaTexto = opcion.texto || '';
        let actualizadoTexto = [...resumenTextoLargo];
        if (indexExistente !== -1) actualizadoTexto[indexExistente] = nuevaEntradaTexto;
        else actualizadoTexto.push(nuevaEntradaTexto);
        setResumenTextoLargo(actualizadoTexto);
        setDistribucionFinalizada(true);
        return;
      }

      if (opcion.siguiente) {
        setRuta([...ruta, opcion.siguiente]);
        const nuevaEntrada = `${nivelActual.titulo} - ${opcion.nombre}`;
        const indexExistente = resumen.findIndex(entry => entry.startsWith(`${nivelActual.titulo} -`));
        let actualizado = [...resumen];
        if (indexExistente !== -1) actualizado[indexExistente] = nuevaEntrada;
        else actualizado.push(nuevaEntrada);
        setResumen(actualizado);

        const nuevaEntradaTexto = opcion.texto || '';
        let actualizadoTexto = [...resumenTextoLargo];
        if (indexExistente !== -1) actualizadoTexto[indexExistente] = nuevaEntradaTexto;
        else actualizadoTexto.push(nuevaEntradaTexto);
        setResumenTextoLargo(actualizadoTexto);
        setSeleccionMultiple([]);
      }
    }
  };

  /* Siguiente explícito para niveles de selección múltiple (p.ej. Distribución) */
/* Reemplaza tu handleSiguiente por este */
const handleSiguiente = () => {
  const titulo = nivelActual.titulo;
  const esMultiple = !!nivelActual.seleccionMultiple;
  const esOpcionalPaso = /Opcional/i.test(titulo || '');

  // 1) Si NO es multiselección, no hace nada aquí
  if (!esMultiple) return;

  // 2) Si es opcional y no hay selección → SALTAR sin tocar overlays ni resumen
  if (esOpcionalPaso && seleccionMultiple.length === 0) {
    const next = (nivelActual as any).siguiente || ((nivelActual.opciones?.[0] as any)?.siguiente ?? null);
    if (next) setRuta((prev) => [...prev, next]);
    setSeleccionMultiple([]);
    return;
  }


  // 3) Consolidar overlays elegidos (evita duplicados)
  if (seleccionMultiple.length > 0) {
    setZonasFijas((prev) => {
      const toAdd = seleccionMultiple
        .map(n => {
          const match = nivelActual.opciones?.find(o => (o as any).nombre === n) as any;
          return match?.ImgValue || n;
        })
        .filter(k => !!imagenesOverlay[k as keyof typeof imagenesOverlay]);
      return Array.from(new Set([...prev, ...toAdd]));
    });
  }

  // 4) Actualizar RESUMEN (líneas tipo "Título - a, b y c")
  const listado = seleccionMultiple.length > 0 ? joinConY(seleccionMultiple) : '—';
  const linea = `${titulo} - ${listado}`;
  setResumen((prev) => {
    const idx = prev.findIndex(e => e.startsWith(`${titulo} -`));
    const out = [...prev];
    if (idx !== -1) out[idx] = linea; else out.push(linea);
    return out;
  });

  // 5) Actualizar TEXTO LARGO (misma info que el UI muestra en "reporte")
  setResumenTextoLargo((prev) => {
    const idxResumen = resumen.findIndex(e => e.startsWith(`${titulo} -`)); // intento de reutilizar posición
    const texto = seleccionMultiple.length > 0 ? ` ${listado}` : '';
    const out = [...prev];
    if (idxResumen !== -1) out[idxResumen] = texto; else out.push(texto);
    return out;
  });

  // 6) Avanzar al siguiente nivel disponible
  const next = (nivelActual as any).siguiente || ((nivelActual.opciones?.[0] as any)?.siguiente ?? null);
  if (next) setRuta((prev) => [...prev, next]);

  // 7) Limpiar selección para el próximo paso
  setSeleccionMultiple([]);
};

  const retrocederNivel = () => {
    if (tituloActual === 'Recuperación' && distribucionFinalizada) {
      setDistribucionFinalizada(false);
      setNombrePaciente('');
      return;
    }
    if (ruta.length > 1 && ruta[ruta.length - 2].titulo === 'Recuperación') {
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
    setFiguras([]);
    setDistribucionFinalizada(false);
    setComentarioLista('');
    setImgListaSrc(null);
    // Incrementar el key para forzar re-render de las vistas de exportación
    setExportKey((prev) => prev + 1);
  };

  /* Auto-scroll */
  useEffect(() => {
    if ((nivelActual.opciones.length > 2 || resumen.length > 1) && scrollPrincipalRef.current) {
      setTimeout(() => {
        scrollPrincipalRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [nivelActual, resumen]);

  /* Orientación */
  useEffect(() => {
    Orientation.getDeviceOrientation((orientation) => {
      if (orientation === 'LANDSCAPE-LEFT' || orientation === 'LANDSCAPE-RIGHT') setIsHorizontal(true);
      else setIsHorizontal(false);
    });
    const listener = (orientation: OrientationType) => {
      if (orientation === 'LANDSCAPE-LEFT' || orientation === 'LANDSCAPE-RIGHT') setIsHorizontal(true);
      else setIsHorizontal(false);
    };
    Orientation.addDeviceOrientationListener(listener);
    return () => Orientation.removeDeviceOrientationListener(listener);
  }, []);

  const activeStyles = isHorizontal ? styleReporteHorizontal : styleReporte;
  const zonasSeleccionadas = [...seleccionMultiple, ...zonasFijas];
  const [modoReporte, setModoReporte] = useState<'enunciado' | 'lista' | 'GenerarLink'>('enunciado');

  

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

    const handleSaltarClasificacion = () => {
  if (nivelActual?.titulo !== 'Clasificación') return;

  // Toma el "siguiente" del primer hijo (Hereditaria), que en cada rama
  // apunta a Denervación (clasificacion) o a Distribición (clasificacionB)
  const next =
    ((nivelActual.opciones?.[0] as any)?.siguiente) ||
    (nivelActual as any).siguiente ||
    null;

  if (next) {
    setRuta((prev) => [...prev, next]);
  }
  // Limpia selección múltiple por si venías de un paso anterior
  setSeleccionMultiple([]);
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

  const exportRef = useRef<View>(null);
  const exportRef2 = useRef<View>(null);
  const [exporting, setExporting] = useState(false);
  const [exportKind, setExportKind] = useState<'pdf'|'jpeg'|null>(null);
  const [exportSuccess, setExportSuccess] = useState<{ filename: string; path: string } | null>(null);

  const flushBeforeCapture = async () => {
    Keyboard.dismiss();
    if (userData?.imageUrl) { try { await Image.prefetch(userData.imageUrl); } catch {} }
    await new Promise<void>(r => InteractionManager.runAfterInteractions(() => r()));
    await new Promise<void>(r => requestAnimationFrame(() => r()));
    // Dar más tiempo para asegurar que las figuras se actualicen en las vistas de exportación
    await new Promise<void>(r => requestAnimationFrame(() => r()));
    await new Promise<void>(r => setTimeout(r, 150));
  };
  const capturePages = async (format: 'png' | 'jpg') => {
    if (!exportRef.current) throw new Error('El lienzo no está listo');
    await flushBeforeCapture();
    const quality = format === 'jpg' ? 0.95 : 1;
    const bg = plantillaId === 'none' ? '#ffffff' : 'transparent';
    const base = { format, quality, result: 'base64' as const };
    const opts = format === 'png' ? { ...base, backgroundColor: bg } : base;

    const p1 = await captureRef(exportRef.current, opts);
    let p2: string | null = null;
    if (exportRef2?.current) {
      p2 = await captureRef(exportRef2.current, opts);
    }
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

      const studyType = 'Neuronopatía';
      const doctorName = [userData?.name, userData?.lastname].filter(Boolean).join(' ') || undefined;
      const ab = await buildReportPdfArrayBuffer({ studyType, doctorName, templateId: plantillaId });
      const base64Pdf = b64encode(ab);
      const filename = reportFileName();  // mEDXproMiopatia_<...>.pdf

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

    const baseImage = transparentBg ? IMG_BASE_TRANSPARENT : IMG_BASE;

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

  /* ====== Render principal ====== */
  const activeZonas = [...seleccionMultiple, ...zonasFijas];

  const esPasoMultiple = !!nivelActual?.seleccionMultiple;
const esOpcional = /Opcional/i.test(tituloActual || '');
const requiereMinimoUno = esPasoMultiple && !esOpcional;
const puedeContinuar = esOpcional || !requiereMinimoUno || (seleccionMultiple.length > 0);
const esPasoClasificacion = tituloActual === 'Clasificación';

/** Texto del botón naranja */
const textoBotonNaranja = esOpcional ? 'Saltar ➔' : 'Siguiente ➔';


  // estilos locales para botón Siguiente e input comentario
  const estilosLocales = StyleSheet.create({
    // ✅ ÚNICO estilosLocales (fuera del componente)
  barraBotonesInline: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
  },
  btnSiguiente: {
    backgroundColor: '#ff4500',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  btnTxt: { color: '#fff', textAlign: 'center', fontWeight: '600' },

  // Pila vertical para modo lista
  listaStack: {
    alignSelf: 'stretch',
    width: '100%',
    flexDirection: 'column',
  },
  botonGaleria: {
    bottom:60,
    alignSelf: 'center',
    marginBottom: 0,
  },
  estadoImagenOk: {
    color: '#4ade80',
    textAlign: 'center',
   bottom:75,
  },
  estadoImagenVacia: {
    color: '#bbb',
    textAlign: 'center',
    bottom:75,
  },
btnNaranja: {
   marginTop: 10,
   marginBottom:10,
  padding: 8, borderRadius: 5,backgroundColor: '#ff4500',
  alignSelf: 'center', // ← en lugar de 'flex-start'
},
btnNaranjaDisabled: { opacity: 0.5 },
btnNaranjaTxt: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 0.3 },


  // Input base
  inputComentario: {
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    backgroundColor: '#111',
    textAlignVertical: 'top',
    fontSize: 14,
    bottom:60,
  },
  // Altura dinámica que crece sin límite para mostrar todo el contenido
  inputComentarioFijo: {
    minHeight: 80,
    // Sin maxHeight para que crezca indefinidamente
  },
});

  const [showEditModal, setShowEditModal] = useState(false); // Estado para habilitar/deshabilitar edición
  const [showComentarioModal, setShowComentarioModal] = useState(false);

  return (
    <View style={activeStyles.container}>
      {!isHorizontal && <Header onStartLogout={() => setIsCargaCerrar(true)} onLogoutFinish={() => setIsCargaCerrar(false)} />}

      <View style={activeStyles.topBar}>
        <View style={activeStyles.nombrePacienteContainerTop}>
          <FancyInput
            label=""
            placeholder="Nombre del paciente"
            value={nombrePaciente}
            onChangeText={setNombrePaciente}
          />
        </View>
      </View>

      <Animated.ScrollView contentContainerStyle={{ flexGrow: 1 }}  onScroll={handleScroll} scrollEventThrottle={16}>
        <View style={activeStyles.principalReporte}>

          {/* IZQUIERDA: lámina */}
          <View style={activeStyles.leftPanel}>
            <View
              ref={leftCanvasRef}
              style={[activeStyles.imageContainer, {aspectRatio: BASE_AR}]}
              collapsable={false}
              renderToHardwareTextureAndroid
              needsOffscreenAlphaCompositing
              onLayout={(event) => {
                const { width, height } = event.nativeEvent.layout;
                setLimitesContenedor({ width, height });
                setImgSize({ w: width, h: height });
              }}
            >
              <Image source={IMG_BASE} style={activeStyles.baseImage} />
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

              {activeZonas.map((zona, index) => {
                const imagenes = imagenesOverlay[zona as keyof typeof imagenesOverlay];
                if (!imagenes) return null;
                return (
                  <Image
                    key={`overlay-img-${index}`}
                    source={imagenes}
                    style={{ position: 'absolute', height: '100%', width: '100%', left: 0, right: 0, resizeMode: 'contain' }}
                  />
                );
              })}
            </View>
          </View>

          {/* DERECHA: opciones + resumen */}
          <View style={activeStyles.rightPanel}>
            <View style={activeStyles.optionsSection}>
              <View style={activeStyles.ContenedorSeccion}>
                <View style={activeStyles.iconContainer}>
                  <TouchableOpacity style={activeStyles.iconCircle} onPress={retrocederNivel}>
                    <ImageBackground source={I_Out} style={activeStyles.iconBackground} imageStyle={{ width:'90%', height:'90%' }} />
                  </TouchableOpacity>
                  <TouchableOpacity style={activeStyles.iconCircle} onPress={reiniciar}>
                    <ImageBackground source={I_Repeat} style={activeStyles.iconBackground} imageStyle={{ width:'90%', height:'90%' }} />
                  </TouchableOpacity>

                  {tituloActual === 'Pronóstico de recuperación' && distribucionFinalizada ? (
                    <TouchableOpacity style={[activeStyles.iconCircle, activeStyles.printButton]} onPress={handleExportRequest}>
                      <ImageBackground source={I_Doc} style={activeStyles.iconBackground} imageStyle={{ width:'90%', height:'90%', tintColor:'#fff' }} />
                    </TouchableOpacity>
                  ) : null}
                </View>

                {!(tituloActual === 'Pronóstico de recuperación' && distribucionFinalizada) && (
                  <Text style={[activeStyles.titleText, { marginBottom: 10 }]}>{nivelActual.titulo}</Text>
                )}

                {/* Cuando terminas y estás en Recuperación, herramientas finales */}
                {tituloActual === 'Pronóstico de recuperación' && distribucionFinalizada ? (
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
                <ScrollView style={[activeStyles.categoryContainer, tituloActual === 'Recuperación' && { width:'63%', marginRight:12 }]}>

  {nivelActual.opciones.map((opcion: any, index: number) => (
    <TouchableOpacity
      key={index}
      style={[
        activeStyles.category,
        { backgroundColor: (nivelActual.seleccionMultiple && seleccionMultiple.includes(opcion.nombre)) ? 'orange' : '#222' },
      ]}
      onPress={() => avanzarNivel(opcion)}
    >
      <Text style={activeStyles.categoryText}>{opcion.nombre}</Text>
    </TouchableOpacity>

    
  ))}

  
  {/* --- Botón naranja grande --- */}
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

  {/* ➕ Botón SALTAR exclusivo para el paso "Clasificación" */}
  {esPasoClasificacion && (
    <TouchableOpacity
      onPress={handleSaltarClasificacion}
      style={[estilosLocales.btnNaranja]}
    >
      <Text style={estilosLocales.btnNaranjaTxt}>Saltar ➔</Text>
    </TouchableOpacity>
  )}
</ScrollView>

                )}
              </View>
            </View>

            {/* Selector modo */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10, }}>
              <TouchableOpacity
                style={[{ padding: 10, borderRadius: 8, marginHorizontal: 5, backgroundColor: modoReporte === 'enunciado' ? '#ff4500' : '#222' }]}
                onPress={() => setModoReporte('enunciado')}
              >
                <Text style={{ color: '#fff' }}>Reporte</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[{ padding: 10, borderRadius: 8, marginHorizontal: 5, backgroundColor: modoReporte === 'lista' ? '#ff4500' : '#222' }]}
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

            {/* Reporte generado (UI): EXACTO como tu versión */}
            <View style={activeStyles.reporteContainer}>
              <Text style={activeStyles.reporteTitle}>Neuronopatía</Text>
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

      {/* Overlay cerrar sesión */}
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
              {nombrePaciente}
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
                  backgroundColor:'#fff', opacity: pdfCfg.header.logo.fogOpacity, borderRadius: px(10)
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
          height: footerHpx, paddingHorizontal: px(pdfCfg.footer.padH), paddingVertical: px(pdfCfg.footer.padV),
          backgroundColor:'transparent', opacity: pdfCfg.footer.opacity,
          justifyContent:'center',
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

      {/* 2ª HOJA (igual que Neuronopatia) */}
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
           <View style={{ height: px(Math.max(0, (pdfCfg.page2?.shiftDown ?? 0) - 5)) }} />
          <View style={{ flexDirection: 'row', flex: 1 }}>
            {/* LISTA */}
            <View style={{ flex: 1, marginRight: px(6), paddingVertical: px(10), paddingLeft: px(36), paddingRight: px(14) }}>
              <Text style={{ fontWeight: '700', fontSize: px(12), marginBottom: px(6), color: '#000' }}>Neuronopatía
              </Text>
              {resumen.map((line, idx) => (
                <Text key={`li_${idx}`} style={{ fontSize: px(9.2), color:'#000', marginBottom: px(4), lineHeight: px(13) }}>
                  <Text style={{ fontWeight: '700' }}>• </Text>{line}
                </Text>
              ))}
              {resumen.length === 0 && (
                <Text style={{ fontSize: px(9.2), color:'#666' }}>Sin datos de lista.</Text>
              )}
            </View>
            {/* COMENTARIO */}
            <View style={{ flex: 1, marginLeft: px(2), paddingVertical: px(10), paddingRight: px(24), paddingLeft: px(6), }}>
              <Text style={{ fontWeight: '700', fontSize: px(12), marginBottom: px(6), color: '#000' }}>
              </Text>
              <Text style={{ fontSize: px(ninth(9.2) as any), color:'#000', lineHeight: px(13), textAlign: 'justify' }}>
                {comentarioLista?.trim() ? limpiarTextoLibre(comentarioLista) : '—'}
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
      {/* Modal selector de plantilla */}
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

/* ====== Helpers locales ====== */
const ninth = (n:number)=>n; // pequeño hack para evitar warnings con px(9.2)

