import { PDFDocument } from 'pdf-lib';
import { Alert } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode as b64decode, encode as b64encode } from 'base64-arraybuffer';
import BASE_URL from '../constants/config';
import type { PlantillaId } from '../components/TemplatePickerModalHorizontal';

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
  p1: string;
  p2: string | null;
};

// ============================================
// CONFIGURACIÓN DE PLANTILLAS (HORIZONTAL)
// ============================================

export const PLANTILLAS_PDF: Record<Exclude<PlantillaId, 'none'>, PlantillaPdfDef> = {
  A: {
    url1: `${BASE_URL}/plantillas/PLANTILLA_A_HORIZONTAL-1.pdf`,
    url2: `${BASE_URL}/plantillas/PLANTILLA_A_HORIZONTAL-2.pdf`,
  },
  B: {
    url1: `${BASE_URL}/plantillas/PLANTILLA_B_HORIZONTAL-1.pdf`,
    url2: `${BASE_URL}/plantillas/PLANTILLA_B_HORIZONTAL-2.pdf`,
  },
  C: {
    url1: `${BASE_URL}/plantillas/PLANTILLA_C_HORIZONTAL-1.pdf`,
    url2: `${BASE_URL}/plantillas/PLANTILLA_C_HORIZONTAL-2.pdf`,
  },
};

// ============================================
// SISTEMA DE CACHÉ LOCAL (HORIZONTAL)
// ============================================

const CACHE_DIR = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/plantillas_horizontal`;
const CACHE_KEY_PREFIX = 'plantilla_horizontal_cached_';

const ensureCacheDir = async (): Promise<void> => {
  try {
    const exists = await ReactNativeBlobUtil.fs.exists(CACHE_DIR);
    if (!exists) {
      await ReactNativeBlobUtil.fs.mkdir(CACHE_DIR);
      console.log('[Cache Horizontal] Directorio creado:', CACHE_DIR);
    }
  } catch (error) {
    console.error('[Cache Horizontal] Error creando directorio:', error);
  }
};

const getCacheInfo = (url: string) => {
  const filename = url.split('/').pop() || 'template.pdf';
  const cachePath = `${CACHE_DIR}/${filename}`;
  const cacheKey = `${CACHE_KEY_PREFIX}${filename}`;
  return { cachePath, cacheKey };
};

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

const downloadAndCache = async (url: string): Promise<string> => {
  await ensureCacheDir();

  const { cachePath, cacheKey } = getCacheInfo(url);

  // Alert.alert('[Cache Horizontal] Descargando plantilla:', url);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  /*const base64 = btoa(
    new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );*/

  const base64 = b64encode(arrayBuffer);

  await ReactNativeBlobUtil.fs.writeFile(cachePath, base64, 'base64');

  await AsyncStorage.setItem(cacheKey, JSON.stringify({
    url,
    cachedAt: Date.now(),
    size: arrayBuffer.byteLength,
  }));

  // Alert.alert('[Cache Horizontal] ✅ Plantilla guardada:', cachePath);

  return cachePath;
};

const readFromCache = async (url: string): Promise<Uint8Array> => {
  const { cachePath } = getCacheInfo(url);

  // Alert.alert('[Cache Horizontal] 📂 Leyendo desde caché:', cachePath);

  const base64 = await ReactNativeBlobUtil.fs.readFile(cachePath, 'base64');

  /*const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
    return bytes;*/

  const arrayBuffer = b64decode(base64);
  return new Uint8Array(arrayBuffer);
};

// ============================================
// FUNCIÓN: Cargar plantilla (con caché)
// ============================================

const loadPlantillaPdf = async (plantillaUrl: string): Promise<Uint8Array | null> => {
  try {
    const cached = await isCached(plantillaUrl);

    if (cached) {
      // Alert.alert('[Radiculopatia] 💾 Usando plantilla en caché');
      return await readFromCache(plantillaUrl);
    }

    // Alert.alert('[Radiculopatia] 🔥 Descargando plantilla desde:', plantillaUrl);
    await downloadAndCache(plantillaUrl);

    return await readFromCache(plantillaUrl);

  } catch (error) {
    console.error('[Radiculopatia] ❌ Error cargando plantilla:', error);
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

  const drawImageCentered = (page: any, image: any) => {
    const { width: pageW, height: pageH } = page.getSize?.() ?? { width: Wpt, height: Hpt };

    const imgW = image.width;
    const imgH = image.height;

    const scaleW = pageW / imgW;
    const scaleH = pageH / imgH;
    const scale = Math.min(scaleW, scaleH);

    const finalW = imgW * scale;
    const finalH = imgH * scale;

    const x = (pageW - finalW) / 2;
    const y = (pageH - finalH) / 2;

    page.drawImage(image, { x, y, width: finalW, height: finalH });
  };

  if (plantillaForBuild) {
    try {
      // Alert.alert('[Radiculopatia] ===== CARGANDO PLANTILLA', templateId + '=====');

      const plantillaPdf1 = await loadPlantillaPdf(plantillaForBuild.url1);

      if (plantillaPdf1) {
        // Alert.alert('[Radiculopatia] ✅ Plantilla página 1 cargada');
        pdfDoc = await PDFDocument.load(plantillaPdf1);
        const [templatePage1] = pdfDoc.getPages();
        const img1 = await pdfDoc.embedPng(p1);
        drawImageCentered(templatePage1, img1);

        if (p2 && plantillaForBuild.url2) {
          const plantillaPdf2 = await loadPlantillaPdf(plantillaForBuild.url2);

          if (plantillaPdf2) {
            // Alert.alert('[Radiculopatia] ✅ Plantilla página 2 cargada');
            const templateDoc2 = await PDFDocument.load(plantillaPdf2);
            const [copiedPage] = await pdfDoc.copyPages(templateDoc2, [0]);
            pdfDoc.addPage(copiedPage);
            const templatePage2 = pdfDoc.getPages()[1];
            const img2 = await pdfDoc.embedPng(p2);
            drawImageCentered(templatePage2, img2);
          } else {
            console.warn('[Radiculopatia] ⚠️ No se pudo cargar plantilla página 2');
            const page2 = pdfDoc.addPage([Wpt, Hpt]);
            const img2 = await pdfDoc.embedPng(p2);
            drawImageCentered(page2, img2);
          }
        } else if (p2) {
          const page2 = pdfDoc.addPage([Wpt, Hpt]);
          const img2 = await pdfDoc.embedPng(p2);
          drawImageCentered(page2, img2);
        }

        // Alert.alert('[Radiculopatia] ===== PLANTILLA APLICADA =====');
      } else {
        throw new Error('No se pudo cargar plantilla página 1');
      }

    } catch (error) {
      console.error('[Radiculopatia] ===== ERROR CON PLANTILLA =====', error);

      // Alert.alert(
      //   'Aviso',
      //   'No se pudieron cargar las plantillas desde el servidor. Se generará un PDF sin plantilla.',
      //   [{ text: 'OK' }]
      // );

      pdfDoc = await PDFDocument.create();
      const page1 = pdfDoc.addPage([Wpt, Hpt]);
      const img1 = await pdfDoc.embedPng(p1);
      drawImageCentered(page1, img1);

      if (p2) {
        const page2 = pdfDoc.addPage([Wpt, Hpt]);
        const img2 = await pdfDoc.embedPng(p2);
        drawImageCentered(page2, img2);
      }
    }
  } else {
    pdfDoc = await PDFDocument.create();
    const page1 = pdfDoc.addPage([Wpt, Hpt]);
    const img1 = await pdfDoc.embedPng(p1);
    drawImageCentered(page1, img1);

    if (p2) {
      const page2 = pdfDoc.addPage([Wpt, Hpt]);
      const img2 = await pdfDoc.embedPng(p2);
      drawImageCentered(page2, img2);
    }
  }

  try { pdfDoc.setTitle?.(`Reporte ${studyType} – ${patientName || 'Paciente'}`); } catch {}
  try { if (doctorName) {pdfDoc.setAuthor?.(doctorName);} } catch {}
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

export const clearPlantillasCache = async (): Promise<void> => {
  try {
    // Alert.alert('[Cache Horizontal] 🗑️ Limpiando caché...');

    const exists = await ReactNativeBlobUtil.fs.exists(CACHE_DIR);
    if (exists) {
      await ReactNativeBlobUtil.fs.unlink(CACHE_DIR);
    }

    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);

    // Alert.alert('[Cache Horizontal] ✅ Caché limpiado');
    // Alert.alert('Éxito', 'Plantillas horizontales eliminadas.');
  } catch (error) {
    // console.error('[Cache Horizontal] ❌ Error limpiando caché:', error);
    // Alert.alert('Error', 'No se pudo limpiar el caché.');
  }
};

export const predownloadAllTemplates = async (
  onProgress?: (current: number, total: number) => void
): Promise<void> => {
  const allUrls: string[] = [];

  Object.values(PLANTILLAS_PDF).forEach(def => {
    allUrls.push(def.url1);
    if (def.url2) {allUrls.push(def.url2);}
  });

  // Alert.alert('[Cache Horizontal] 📥 Pre-descargando', allUrls.length + 'plantillas...');

  for (let i = 0; i < allUrls.length; i++) {
    const url = allUrls[i];
    const cached = await isCached(url);

    if (!cached) {
      await downloadAndCache(url);
    }

    onProgress?.(i + 1, allUrls.length);
  }

  // Alert.alert('[Cache Horizontal] ✅ Todas las plantillas descargadas');
};
