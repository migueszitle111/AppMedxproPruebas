import { PDFDocument } from 'pdf-lib';
import { Alert } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode as b64decode, encode as b64encode } from 'base64-arraybuffer';
import BASE_URL from '../constants/config';
import type { PlantillaId } from '../components/TemplatePickerModal';

// ============================================
// TIPOS
// ============================================

export type PlantillaPdfDef = {
  url1: string;
  url2?: string;
};

export type PdfBuildConfig = {
  studyType: string;
  doctorName?: string;
  templateId?: PlantillaId | null;
  patientName?: string;
  Wpt: number;
  Hpt: number;
};

export type CapturedPages = {
  p1: string;  // base64
  p2: string | null;  // base64
};

// ============================================
// CONFIGURACIÓN DE PLANTILLAS
// ============================================

export const PLANTILLAS_PDF: Record<Exclude<PlantillaId, 'none'>, PlantillaPdfDef> = {
  A: {
    url1: `${BASE_URL}/plantillas/PLANTILLA_A_VERTICAL-1.pdf`,
    url2: `${BASE_URL}/plantillas/PLANTILLA_A_VERTICAL-2.pdf`,
  },
  B: {
    url1: `${BASE_URL}/plantillas/PLANTILLA_B_VERTICAL-1.pdf`,
    url2: `${BASE_URL}/plantillas/PLANTILLA_B_VERTICAL-2.pdf`,
  },
  C: {
    url1: `${BASE_URL}/plantillas/PLANTILLA_C_VERTICAL-1.pdf`,
    url2: `${BASE_URL}/plantillas/PLANTILLA_C_VERTICAL-2.pdf`,
  },
};

// ============================================
// SISTEMA DE CACHÉ LOCAL
// ============================================

const CACHE_DIR = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/plantillas_vertical`;
const CACHE_KEY_PREFIX = 'plantilla_vertical_cached_';

/**
 * Asegura que el directorio de caché exista
 */
const ensureCacheDir = async (): Promise<void> => {
  try {
    const exists = await ReactNativeBlobUtil.fs.exists(CACHE_DIR);
    if (!exists) {
      await ReactNativeBlobUtil.fs.mkdir(CACHE_DIR);
      // console.log('[Cache] Directorio creado:', CACHE_DIR);
    }
  } catch (error) {
    console.error('[Cache] Error creando directorio:', error);
  }
};

/**
 * Genera la clave y ruta del caché para una URL
 */
const getCacheInfo = (url: string) => {
  const filename = url.split('/').pop() || 'template.pdf';
  const cachePath = `${CACHE_DIR}/${filename}`;
  const cacheKey = `${CACHE_KEY_PREFIX}${filename}`;
  return { cachePath, cacheKey };
};

/**
 * Verifica si una plantilla está en caché
 */
const isCached = async (url: string): Promise<boolean> => {
  const { cachePath, cacheKey } = getCacheInfo(url);

  try {
    const fileExists = await ReactNativeBlobUtil.fs.exists(cachePath);
    const metaExists = await AsyncStorage.getItem(cacheKey);

    return fileExists && !!metaExists;
  } catch {
    return false;
  }
};

/**
 * Descarga y guarda una plantilla en caché
 */
const downloadAndCache = async (url: string): Promise<string> => {
  await ensureCacheDir();

  const { cachePath, cacheKey } = getCacheInfo(url);

  // console.log('[Cache] Descargando plantilla:', url);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  /*const base64 = btoa(
    new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );*/

  const base64 = b64encode(arrayBuffer);

  // Guardar archivo
  await ReactNativeBlobUtil.fs.writeFile(cachePath, base64, 'base64');

  // Guardar metadata
  await AsyncStorage.setItem(cacheKey, JSON.stringify({
    url,
    cachedAt: Date.now(),
    size: arrayBuffer.byteLength,
  }));

  // console.log('[Cache] ✅ Plantilla guardada:', cachePath);

  return cachePath;
};

/**
 * Lee una plantilla desde el caché
 */
const readFromCache = async (url: string): Promise<Uint8Array> => {
  const { cachePath } = getCacheInfo(url);

  // console.log('[Cache] 📂 Leyendo desde caché:', cachePath);

  if (!cachePath) {
    // console.log('[Cache] ❌ Archivo no encontrado en caché');
  }else {
    // console.log('[Cache] ✅ Archivo encontrado en caché');
  }
  const base64 = await ReactNativeBlobUtil.fs.readFile(cachePath, 'base64');

  /*/ Convertir base64 a Uint8Array
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;*/

  // Convertir base64 a Uint8Array
  const arrayBuffer = b64decode(base64);
  return new Uint8Array(arrayBuffer);
};

// ============================================
// FUNCIÓN: Cargar plantilla (con caché)
// ============================================

const loadPlantillaPdf = async (plantillaUrl: string): Promise<Uint8Array | null> => {
  try {
    // 1️⃣ Verificar si está en caché
    const cached = await isCached(plantillaUrl);

    if (cached) {
      return await readFromCache(plantillaUrl);
    }

    // 2️⃣ Descargar y guardar en caché
    await downloadAndCache(plantillaUrl);

    // 3️⃣ Leer desde caché
    return await readFromCache(plantillaUrl);

  } catch (error) {
    console.error('[Neuronopatia] ❌ Error cargando plantilla:', error);
    return null;
  }
};

// ============================================
// FUNCIÓN: Construir PDF con plantillas
// ============================================

export const buildPdfWithTemplate = async (
  capturedPages: CapturedPages,
  config: PdfBuildConfig
): Promise<ArrayBuffer> => {
  const { p1, p2 } = capturedPages;
  const { studyType, doctorName, templateId, patientName, Wpt, Hpt } = config;

  const plantillaForBuild =
    templateId && templateId !== 'none'
      ? PLANTILLAS_PDF[templateId as Exclude<PlantillaId, 'none'>]
      : null;

  let pdfDoc: PDFDocument;

  const drawImageFullPage = (page: any, image: any) => {
    const { width, height } = page.getSize?.() ?? { width: Wpt, height: Hpt };
    page.drawImage(image, { x: 0, y: 0, width, height });
  };

  if (plantillaForBuild) {
    try {

      // Cargar plantilla página 1
      const plantillaPdf1 = await loadPlantillaPdf(plantillaForBuild.url1);

      if (plantillaPdf1) {
        pdfDoc = await PDFDocument.load(plantillaPdf1);
        const [templatePage1] = pdfDoc.getPages();
        const img1 = await pdfDoc.embedPng(p1);
        drawImageFullPage(templatePage1, img1);

        if (p2 && plantillaForBuild.url2) {
          const plantillaPdf2 = await loadPlantillaPdf(plantillaForBuild.url2);

          if (plantillaPdf2) {
            const templateDoc2 = await PDFDocument.load(plantillaPdf2);
            const [copiedPage] = await pdfDoc.copyPages(templateDoc2, [0]);
            pdfDoc.addPage(copiedPage);
            const templatePage2 = pdfDoc.getPages()[1];
            const img2 = await pdfDoc.embedPng(p2);
            drawImageFullPage(templatePage2, img2);
          } else {
            // console.warn('[Neuronopatia] ⚠️ No se pudo cargar plantilla página 2');
            const page2 = pdfDoc.addPage([Wpt, Hpt]);
            const img2 = await pdfDoc.embedPng(p2);
            drawImageFullPage(page2, img2);
          }
        } else if (p2) {
          const page2 = pdfDoc.addPage([Wpt, Hpt]);
          const img2 = await pdfDoc.embedPng(p2);
          drawImageFullPage(page2, img2);
        }

      } else {
        throw new Error('No se pudo cargar plantilla página 1');
      }

    } catch (error) {

      // Alert.alert(
      //   'Aviso',
      //   'No se pudieron cargar las plantillas desde el servidor. Se generará un PDF sin plantilla.',
      //   [{ text: 'OK' }]
      // );

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

  // Metadatos del PDF
  try { pdfDoc.setTitle?.(`Reporte ${studyType} – ${patientName || 'Paciente'}`); } catch {}
  try { if (doctorName) pdfDoc.setAuthor?.(doctorName); } catch {}
  try { pdfDoc.setSubject?.(studyType); } catch {}
  try { pdfDoc.setCreationDate?.(new Date()); } catch {}

  const u8 = await pdfDoc.save();
  const ab = new ArrayBuffer(u8.byteLength);
  new Uint8Array(ab).set(u8);
  return ab;
};

// ============================================
// FUNCIONES DE GESTIÓN DE CACHÉ
// ============================================

/**
 * Limpia TODO el caché de plantillas verticales
 */
export const clearPlantillasCache = async (): Promise<void> => {
  try {

    // Eliminar archivos
    const exists = await ReactNativeBlobUtil.fs.exists(CACHE_DIR);
    if (exists) {
      await ReactNativeBlobUtil.fs.unlink(CACHE_DIR);
    }

    // Eliminar metadata
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);

    // console.log('[Cache] ✅ Caché limpiado');
    // Alert.alert('Éxito', 'Plantillas eliminadas. Se descargarán nuevamente cuando sean necesarias.');
  } catch (error) {
    console.error('[Cache] ❌ Error limpiando caché:', error);
    // Alert.alert('Error', 'No se pudo limpiar el caché de plantillas.');
  }
};

/**
 * Obtiene información del caché (para mostrar en UI)
 */
export const getCacheInformacion = async (): Promise<{
  totalFiles: number;
  totalSize: number;
  files: Array<{ name: string; size: number; cachedAt: number }>;
}> => {
  try {
    await ensureCacheDir();

    const files = await ReactNativeBlobUtil.fs.ls(CACHE_DIR);
    let totalSize = 0;
    const fileDetails = [];

    for (const file of files) {
      const path = `${CACHE_DIR}/${file}`;
      const stat = await ReactNativeBlobUtil.fs.stat(path);
      const cacheKey = `${CACHE_KEY_PREFIX}${file}`;
      const metaStr = await AsyncStorage.getItem(cacheKey);
      const meta = metaStr ? JSON.parse(metaStr) : null;

      const fileSize = parseInt(String(stat.size || '0'), 10);
      totalSize += fileSize;
      fileDetails.push({
        name: file,
        size: fileSize,
        cachedAt: meta?.cachedAt || 0,
      });
    }

    return {
      totalFiles: files.length,
      totalSize,
      files: fileDetails,
    };
  } catch (error) {
    console.error('[Cache] Error obteniendo info:', error);
    return { totalFiles: 0, totalSize: 0, files: [] };
  }
};

/**
 * Pre-descarga todas las plantillas (útil en configuración)
 */
export const predownloadAllTemplates = async (
  onProgress?: (current: number, total: number) => void
): Promise<void> => {
  const allUrls: string[] = [];

  Object.values(PLANTILLAS_PDF).forEach(def => {
    allUrls.push(def.url1);
    if (def.url2) allUrls.push(def.url2);
  });

  // console.log('[Cache] 📥 Pre-descargando', allUrls.length, 'plantillas...');

  for (let i = 0; i < allUrls.length; i++) {
    const url = allUrls[i];
    const cached = await isCached(url);

    if (!cached) {
      await downloadAndCache(url);
    }

    onProgress?.(i + 1, allUrls.length);
  }

  // console.log('[Cache] ✅ Todas las plantillas descargadas');
};
