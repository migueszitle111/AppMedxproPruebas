// services/shareLinks.ts
import { SHARE_API_BASE_URL } from '../../../MEDXproApp/src/constants/config';

type InitPayload = {
  title: string;
  message?: string;
  expiresInSeconds?: number;
  patient?: string | null;
  doctor?: string | null;
  studyType?: string | null; // tu app lo llama así
  meta?: Record<string, unknown>;
};
type InitResponse = { ok: true; linkId: string; slug: string } | { ok: false; error: string };
type CompleteFile = { name: string; mime_type: string; size_bytes?: number; storage_path: string };
type CompletePayload = { linkId: string; files: CompleteFile[] };
type CompleteResponse = { ok: true; url: string } | { ok: false; error: string };

// Util
const compact = <T extends Record<string, any>>(obj: T) =>
  Object.fromEntries(Object.entries(obj).filter(([_, v]) =>
    v !== undefined && v !== null && v !== ''
  )) as Partial<T>;

async function parseJsonSafe(res: Response, ctx: string) {
  const text = await res.text();
  if (!res.ok) {
    try {
      const j = text ? JSON.parse(text) : null;
      throw new Error(j?.error || `${ctx} HTTP ${res.status}`);
    } catch {
      throw new Error(`${ctx} HTTP ${res.status} ${text || ''}`);
    }
  }
  if (!text) throw new Error(`${ctx} devolvió cuerpo vacío`);
  try { return JSON.parse(text); }
  catch { throw new Error(`${ctx} respondió no-JSON: ${text.slice(0, 200)}`); }
}

const BASE = (SHARE_API_BASE_URL || '').replace(/\/+$/, ''); // sin '/' final

export async function initShareLink(p: InitPayload): Promise<InitResponse> {
  // Normaliza title/message y empaqueta TODO en meta (como espera tu UI)
  const safeTitle = (p.title || '').slice(0, 120); // por si tu columna es VARCHAR(120)
  const safeMsg   = (p.message?.trim() ?? '');

  // meta.study es lo que muestra tu /s/[slug], así que derive de studyType
  const meta = compact({
    ...(p.meta || {}),
    patient:   p.patient ?? (p.meta as any)?.patient ?? undefined,
    doctor:    p.doctor  ?? (p.meta as any)?.doctor  ?? undefined,
    study:     p.studyType ?? (p.meta as any)?.study ?? undefined, // <— clave para la vista
  });

  // Enviar SOLO los campos que el backend necesita
  const body = compact({
    title: safeTitle,
    message: safeMsg,
    expiresInSeconds: p.expiresInSeconds, // si es undefined, ni viaja
    meta,
    // Si más adelante quieres también aceptar raíz en tu backend,
    // podrías mandar patient/doctor/studyType aquí, pero no es necesario.
  });

  const res = await fetch(`${BASE}/api/share/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const j = await parseJsonSafe(res, 'initShareLink');
  const linkId = j?.linkId ?? j?.data?.linkId;
  const slug   = j?.slug   ?? j?.data?.slug;
  if (!linkId || !slug) return { ok: false, error: 'Respuesta inesperada de /init' };
  return { ok: true, linkId, slug };
}

export async function completeShareLink(p: CompletePayload): Promise<CompleteResponse> {
  const res = await fetch(`${BASE}/api/share/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(p),
  });
  const j = await parseJsonSafe(res, 'completeShareLink');
  const url = j?.url ?? j?.shareUrl ?? (j?.slug ? `${BASE}/s/${j.slug}` : null);
  if (!url) return { ok: false, error: 'Respuesta inesperada de /complete' };
  return { ok: true, url };
}
