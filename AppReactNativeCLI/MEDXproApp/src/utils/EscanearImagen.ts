import DocumentScanner, { ResponseType } from 'react-native-document-scanner-plugin';

export const escanearImagen = async (): Promise<string | null> => {
  try {
    const result = await DocumentScanner.scanDocument({
      maxNumDocuments: 1,
      responseType: ResponseType.ImageFilePath, // ✅ corregido
    });

    // ✅ Validamos que result.scannedImages exista y tenga al menos un elemento
    if (result.scannedImages && result.scannedImages.length > 0) {
      return result.scannedImages[0]; // ruta del archivo escaneado
    } else {
      console.warn('No se obtuvo imagen escaneada');
      return null;
    }
  } catch (error) {
    console.error('Error al escanear imagen:', error);
    return null;
  }
};
