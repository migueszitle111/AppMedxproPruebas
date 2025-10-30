import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  Share,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { launchImageLibrary, ImageLibraryOptions } from 'react-native-image-picker';
import type { DocumentPickerResponse } from 'react-native-document-picker';
import DocumentPicker, { types as DocTypes } from 'react-native-document-picker';
import Clipboard from '@react-native-clipboard/clipboard';
import uuid from 'react-native-uuid';

/* ============================================================
 * Tipos
 * ============================================================ */
export type UploadFile = {
  id: string;
  name: string;
  uri: string;
  type: string;
  size?: number;
  progress?: number;
  status?: 'pending' | 'uploading' | 'done' | 'error';
  thumbUri?: string | null;
  fileCopyUri?: string | null;
};

export type LinkUploaderProps = {
  compact?: boolean;
  initialFiles?: UploadFile[];
  defaultTitle?: string;
  defaultMessage?: string;
  onGenerateLink: (payload: {
    files: UploadFile[];
    title: string;
    message?: string;
    expiry: '24h' | '5d';
    onFileProgress: (id: string, p: number) => void;
    templateId?: string;
  }) => Promise<string>;
  maxFiles?: number;
  autoReportName?: string;

  /** Si TRUE exige por lo menos 1 adjunto del usuario (además del PDF). */
  requireUserFile?: boolean;

  /** Mostrar el toggle "Enviar sólo el PDF del diagnóstico". */
  allowJustReport?: boolean;

  /** Callback para solicitar una plantilla (opcional). */
  onRequestTemplate?: () => Promise<string | null>;
};

/* ============================================================
 * Helpers
 * ============================================================ */
const clamp01 = (x?: number) => (typeof x === 'number' ? Math.min(1, Math.max(0, x)) : 0);

const dedupeById = <T extends { id: string }>(arr: T[]) => {
  const map = new Map<string, T>();
  for (const item of arr) if (!map.has(item.id)) map.set(item.id, item);
  return Array.from(map.values());
};

const inferName = (uri: string) => {
  try {
    const clean = decodeURIComponent(uri);
    const parts = clean.split(/[\/\\]/);
    return parts[parts.length - 1] || `archivo_${Date.now()}`;
  } catch {
    return `archivo_${Date.now()}`;
  }
};

const guessMime = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (/\.(png|jpg|jpeg|heic|webp)$/.test(lower)) {
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.heic')) return 'image/heic';
    return 'image/jpeg';
  }
  if (lower.endsWith('.txt')) return 'text/plain';
  if (lower.endsWith('.csv')) return 'text/csv';
  if (lower.endsWith('.doc')) return 'application/msword';
  if (lower.endsWith('.docx'))
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  return 'application/octet-stream';
};

const formatSize = (n?: number) => {
  if (!n || n <= 0) return '—';
  const kb = n / 1024;
  const mb = kb / 1024;
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(kb)} KB`;
};

/* ============================================================
 * Subcomponentes UI
 * ============================================================ */
const Chip: React.FC<{ label: string; active?: boolean; onPress?: () => void }> = ({
  label,
  active,
  onPress,
}) => (
  <TouchableOpacity onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
    <Text style={active ? styles.chipTextActive : styles.chipText}>{label}</Text>
  </TouchableOpacity>
);

const FileRow: React.FC<{ file: UploadFile; onRemove?: () => void }> = ({ file, onRemove }) => {
  const pct = Math.round((file.progress ?? 0) * 100);
  const isDone = file.status === 'done';
  const isError = file.status === 'error';

  return (
    <View style={styles.fileRow}>
      <View style={styles.thumb}>
        {file.thumbUri ? (
          <Image style={styles.thumbImg} resizeMode="cover" source={{ uri: file.thumbUri }} />
        ) : (
          <View style={[styles.thumbImg, styles.thumbPlaceholder]}>
            <Text style={{ color: '#999', fontSize: 10 }}>FILE</Text>
          </View>
        )}
      </View>

      <View style={{ flex: 1, marginHorizontal: 10 }}>
        <Text numberOfLines={1} style={styles.fileName}>
          {file.name}
        </Text>
        <Text style={styles.fileMetaTxt}>
          {formatSize(file.size)} ·{' '}
          {isDone ? 'Completado' : isError ? 'Error' : file.status === 'uploading' ? `Subiendo ${pct}%` : 'Pendiente'}
        </Text>

        <View style={styles.progressBg}>
          <View style={[styles.progressBar, { width: `${pct}%` }]} />
        </View>
      </View>

      {!!onRemove && (
        <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
          <Text style={styles.removeBtnTxt}>Quitar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

/* ============================================================
 * Componente principal
 * ============================================================ */
const LinkUploader: React.FC<LinkUploaderProps> = ({
  compact = false,
  initialFiles = [],
  defaultTitle = '',
  defaultMessage = '',
  onGenerateLink,
  onRequestTemplate,
  maxFiles = 4,
  autoReportName = 'Diagnóstico.pdf',
  requireUserFile = false,
  allowJustReport = true,
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [title, setTitle] = useState(defaultTitle);
  const [message, setMessage] = useState(defaultMessage);
  const [expiry, setExpiry] = useState<'24h' | '5d'>('24h');
  const [generating, setGenerating] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [justReport, setJustReport] = useState(false);

  const haveFiles = files.length > 0;
  const atLimit = files.length >= maxFiles;
  const canGenerate = !generating && (!requireUserFile || justReport || haveFiles);

  // Hidrata archivos iniciales
  useEffect(() => {
    if (initialFiles?.length) {
      setFiles((prev) => {
        const uris = new Set(prev.map((f) => f.uri));
        const free = Math.max(0, maxFiles - prev.length);
        const fresh = initialFiles.filter((f) => !uris.has(f.uri)).slice(0, free);
        return dedupeById([...prev, ...fresh]);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialFiles), maxFiles]);

  const addFiles = (newOnes: UploadFile[]) => {
    setFiles((prev) => {
      const seen = new Set(prev.map((f) => f.uri));
      const free = Math.max(0, maxFiles - prev.length);
      const toAdd = newOnes.filter((f) => !seen.has(f.uri)).slice(0, free);
      return dedupeById([...prev, ...toAdd]);
    });
  };

  const updateFileProgress = useCallback((id: string, p: number) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, progress: clamp01(p), status: 'uploading' } : f)));
  }, []);

  const markDone = (ids: string[]) =>
    setFiles((prev) => prev.map((f) => (ids.includes(f.id) ? { ...f, progress: 1, status: 'done' } : f)));

  const markError = (id: string) => setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, status: 'error' } : f)));

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  // Galería
  const pickFromGallery = async () => {
    try {
      const opts: ImageLibraryOptions = { mediaType: 'mixed', selectionLimit: 0, quality: 1 };
      const r = await launchImageLibrary(opts);
      const arr: UploadFile[] = (r.assets || [])
        .filter((a) => !!a?.uri)
        .map((a) => ({
          id: uuid.v4().toString(),
          name: a.fileName || `gallery_${Date.now()}.jpg`,
          uri: a.uri!,
          type: a.type || 'image/jpeg',
          size: a.fileSize,
          thumbUri: a.uri || null,
          progress: 0,
          status: 'pending',
          fileCopyUri: null,
        }));
      addFiles(arr);
    } catch {
      // cancelado
    }
  };

  // Archivos (DocumentPicker)
  const pickFromFiles = async () => {
    try {
      const res = await DocumentPicker.pick({
        type: [
          DocTypes.pdf,
          DocTypes.images,
          'text/plain',
          'text/csv',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        allowMultiSelection: true,
        copyTo: 'cachesDirectory',
      });

      const mapped: UploadFile[] = res.map((f: DocumentPickerResponse) => ({
        id: uuid.v4().toString(),
        name: f.name ?? inferName(f.uri),
        uri: f.uri,
        type: f.type ?? guessMime(f.name ?? ''),
        size: f.size ?? undefined,
        progress: 0,
        status: 'pending',
        thumbUri: f.type?.startsWith('image/') ? f.fileCopyUri || f.uri : null,
        fileCopyUri: f.fileCopyUri ?? null,
      }));
      addFiles(mapped);
    } catch (e: unknown) {
      // @ts-ignore
      if (!DocumentPicker.isCancel?.(e)) {
        console.warn('DocPicker error', (e as any)?.message || e);
      }
    }
  };

  // Generar
  const handleGenerate = async () => {
    try {
      setLink(null);

      // 1) Solicitar plantilla si existe el callback (ANTES de mostrar "generando")
      let templateId: string | null = null;
      if (onRequestTemplate) {
        templateId = await onRequestTemplate();
        // Si el usuario canceló la selección de plantilla, abortar
        if (templateId === null) {
          return; // No hace falta setGenerating(false) porque nunca lo pusimos en true
        }
      }

      // 2) Ahora sí, mostrar overlay de "Generando link..."
      setGenerating(true);

      // 3) Limpiar cualquier archivo auto anterior para evitar duplicados
      const userFiles = files.filter(f => f.id !== '__auto_report__');

      // Fila virtual del PDF de diagnóstico
      const auto: UploadFile = {
        id: '__auto_report__',
        name: autoReportName,
        uri: 'virtual://auto-report',
        type: 'application/pdf',
        progress: 0,
        status: 'uploading',
        thumbUri: null,
        fileCopyUri: null,
      };

      // Para UI (mostrar progreso)
      const pendingList = justReport
        ? [auto]
        : [auto, ...userFiles.map((f) => ({ ...f, status: 'pending' as const, progress: 0 }))];
      setFiles(pendingList);

      // Para backend
      const listToSend = justReport ? [auto] : [auto, ...userFiles];

      const url = await onGenerateLink({
        files: listToSend,
        title: title.trim(),
        message: message.trim() || undefined,
        expiry,
        onFileProgress: updateFileProgress,
        templateId: templateId || undefined,
      });

      markDone(listToSend.map((f) => f.id));
      setLink(url || null);
    } catch (e) {
      console.warn(e);
      const first = [{ id: '__auto_report__' }, ...files].find(
        // @ts-ignore
        (f) => (f as any).status !== 'done',
      );
      if (first) {
        // @ts-ignore
        markError((first as any).id);
      }
    } finally {
      setGenerating(false);
    }
  };

  const copyLink = () => link && Clipboard.setString(link);
  const shareLink = () => link && Share.share({ message: link, url: link });

  /* ============================================================
   * Render
   * ============================================================ */
  return (
    <View style={[styles.wrap, compact && { paddingHorizontal: 0 }]}>
      <View style={[styles.card, compact && styles.cardCompact]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Generar link</Text>
          <Text style={styles.subtitle}>Comparte el diagnóstico y adjuntos de forma segura</Text>
        </View>

        {/* Toggle “Sólo PDF” */}
        {allowJustReport && (
          <TouchableOpacity
            onPress={() => setJustReport((v) => !v)}
            style={styles.toggleRow}
            activeOpacity={0.8}
          >
            <View style={[styles.toggleBox, justReport && styles.toggleBoxActive]}>
              {justReport && <Text style={styles.toggleCheck}>✓</Text>}
            </View>
            <Text style={styles.toggleText}>Enviar sólo el PDF del diagnóstico</Text>
          </TouchableOpacity>
        )}

        {/* Dropzone / Selección */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selecciona archivos</Text>

          <View
            style={{ opacity: justReport ? 0.4 : 1 }}
            pointerEvents={justReport ? 'none' : 'auto'}
          >
            <TouchableOpacity
              style={[styles.dropzone, atLimit && { opacity: 0.65 }]}
              onPress={pickFromFiles}
              activeOpacity={0.85}
              disabled={atLimit}
            >
              <View style={styles.dropIconCircle}>
                <Text style={styles.dropIconText}>+</Text>
              </View>
              <Text style={styles.dropTitle}>Toca para elegir</Text>
              <Text style={styles.dropHint}>
                Galería · Archivos {atLimit ? '(límite alcanzado)' : ''}
              </Text>
            </TouchableOpacity>

            <View style={styles.row}>
              <TouchableOpacity
                onPress={pickFromGallery}
                style={[styles.btn, styles.btnGhost, atLimit && { opacity: 0.5 }]}
                disabled={atLimit}
              >
                <Text style={styles.btnGhostText}>Galería</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={pickFromFiles}
                style={[styles.btn, styles.btnGhost, atLimit && { opacity: 0.5 }]}
                disabled={atLimit}
              >
                <Text style={styles.btnGhostText}>Archivos</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Lista de archivos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Archivos a subir</Text>

          {files.length ? (
            files.map((f) => <FileRow key={f.id} file={f} onRemove={() => removeFile(f.id)} />)
          ) : (
            <Text style={{ color: '#bbb', textAlign: 'center' }}>
              {justReport
                ? 'Se enviará únicamente el PDF del diagnóstico.'
                : 'Aún no hay archivos… (también puedes enviar sólo el PDF)'}
            </Text>
          )}
        </View>

        {/* Opciones del link */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Opciones del link</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Título</Text>
            <TextInput
              placeholder=""
              placeholderTextColor="#aaa"
              style={styles.input}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mensaje (opcional)</Text>
            <TextInput
              placeholder="Saludos..."
              placeholderTextColor="#aaa"
              style={[styles.input, styles.inputMultiline]}
              multiline
              value={message}
              onChangeText={setMessage}
            />
          </View>

          <Text style={[styles.label, { marginBottom: 8 }]}>Caducidad</Text>
          <View style={[styles.row, { marginTop: 0 }]}>
            <Chip label="24 h" active={expiry === '24h'} onPress={() => setExpiry('24h')} />
            <Chip label="5 días" active={expiry === '5d'} onPress={() => setExpiry('5d')} />
          </View>
        </View>

        {/* Acciones */}
        <View style={[styles.section, { alignItems: 'center' }]}>
          <TouchableOpacity
            onPress={handleGenerate}
            disabled={!canGenerate}
            style={[styles.ctaBtn, !canGenerate && { opacity: 0.5 }]}
          >
            <Text style={styles.ctaTxt}>{generating ? 'Generando…' : 'Generar link'}</Text>
          </TouchableOpacity>

          {!!link && (
            <View style={styles.linkBox}>
              <Text style={styles.linkLabel}>Link generado</Text>
              <View style={styles.linkRow}>
                <Text numberOfLines={2} style={styles.linkText}>
                  {link}
                </Text>
              </View>
              <View style={styles.row}>
                <TouchableOpacity onPress={copyLink} style={[styles.btn, styles.btnGhost]}>
                  <Text style={styles.btnGhostText}>Copiar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={shareLink} style={[styles.btn, styles.btnGhost]}>
                  <Text style={styles.btnGhostText}>Compartir</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Overlay de carga */}
        {generating && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#ff4500" />
              <Text style={styles.loadingTxt}>Generando link…</Text>
              <Text style={styles.loadingSub}>No cierres esta pantalla</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

export default LinkUploader;

/* ============================================================
 * Estilos
 * ============================================================ */
const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 16,
    padding: 16,
    position: 'relative',
  },
  cardCompact: { padding: 12, maxWidth: 520 },

  header: { alignItems: 'center', marginBottom: 10 },
  title: { color: 'orange', fontSize: 18, fontWeight: '800' },
  subtitle: { color: '#bbb', fontSize: 12, marginTop: 4, textAlign: 'center' },

  section: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  sectionTitle: { color: '#fff', fontWeight: '700', marginBottom: 10, textAlign: 'center' },

  /* Toggle sólo PDF */
  toggleRow: {
    marginTop: 8,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  toggleBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#666',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBoxActive: { backgroundColor: '#ff4500', borderColor: '#ff4500' },
  toggleCheck: { color: '#fff', fontWeight: '800', lineHeight: 18 },
  toggleText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  /* Dropzone */
  dropzone: {
    borderWidth: 1,
    borderColor: '#444',
    borderStyle: 'dashed',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    backgroundColor: '#151515',
  },
  dropIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 8,
  },
  dropIconText: { color: '#fff', fontSize: 24, fontWeight: '700', lineHeight: 24 },
  dropTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  dropHint: { color: '#999', fontSize: 12, marginTop: 4 },

  row: {
    marginTop: 10,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Botones */
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhost: { backgroundColor: '#161616', borderColor: '#333' },
  btnGhostText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  ctaBtn: {
    minWidth: 200,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#ff4500',
    borderWidth: 1,
    borderColor: '#ff4500',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },

  /* Inputs */
  inputGroup: { marginBottom: 12 },
  label: { color: '#bbb', marginBottom: 6, textAlign: 'left' },
  input: {
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: '#444',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.select({ ios: 12, android: 10 }),
    fontSize: 14,
  },
  inputMultiline: { minHeight: 90, textAlignVertical: 'top' },

  /* Chips */
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#1b1b1b',
    borderWidth: 1,
    borderColor: '#333',
  },
  chipActive: { backgroundColor: '#272015', borderColor: '#ff8a00' },
  chipText: { color: '#ddd', fontSize: 12 },
  chipTextActive: { color: '#ffb570', fontSize: 12, fontWeight: '800' },

  /* Listado de archivos */
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 8,
    marginBottom: 8,
  },
  thumb: {
    width: 56,
    height: 42,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: '#333',
  },
  thumbImg: { width: '100%', height: '100%' },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },

  fileName: { color: '#fff', fontSize: 13, fontWeight: '700' },
  fileMetaTxt: { color: '#aaa', fontSize: 12, marginTop: 2, marginBottom: 6 },

  progressBg: {
    height: 6,
    backgroundColor: '#222',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#ff4500',
  },

  removeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1a1a1a',
  },
  removeBtnTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },

  /* Link generado */
  linkBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#141414',
    gap: 10,
    alignSelf: 'stretch',
  },
  linkLabel: { color: '#bbb', fontSize: 12 },
  linkRow: {
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1b1b1b',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  linkText: { color: '#fff', fontSize: 13 },

  /* Overlay de carga */
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  loadingCard: {
    width: 240,
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: '#111',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    gap: 8,
  },
  loadingTxt: { color: '#fff', fontWeight: '800', marginTop: 6 },
  loadingSub: { color: '#bbb', fontSize: 12 },
});
