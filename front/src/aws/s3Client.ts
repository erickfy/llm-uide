import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import type { ListObjectsV2CommandInput } from "@aws-sdk/client-s3";

//
// ENV VARS
//

const AWS_REGION = import.meta.env.VITE_AWS_REGION as string | undefined;
const AWS_ACCESS_KEY_ID = import.meta.env
  .VITE_AWS_ACCESS_KEY_ID as string | undefined;
const AWS_SECRET_ACCESS_KEY = import.meta.env
  .VITE_AWS_SECRET_ACCESS_KEY as string | undefined;

export const S3_INPUT_BUCKET = import.meta.env
  .VITE_S3_INPUT_BUCKET_NAME as string | undefined;
export const S3_OUTPUT_BUCKET = import.meta.env
  .VITE_S3_OUTPUT_BUCKET_NAME as string | undefined;

const S3_HLS_PREFIX =
  (import.meta.env.VITE_S3_HLS_PREFIX as string | undefined) || "";

// Dominio público que verá el navegador (CloudFront)
const RAW_CLOUDFRONT_URL = import.meta.env
  .VITE_CLOUDFRONT_URL as string | undefined;

//
// HELPERS
//

/**
 * Normaliza y valida la URL de CloudFront:
 *  - trim
 *  - asegura https:// (si viene sin esquema o con http://)
 *  - quita slash final
 *  - avisa si alguien puso un endpoint de S3 en vez del dominio de CloudFront
 *
 * Ejemplos de entrada válidos:
 *  - dizdb3bht17kt.cloudfront.net
 *  - https://dizdb3bht17kt.cloudfront.net/
 *  - http://dizdb3bht17kt.cloudfront.net
 */
function normalizeCloudfrontUrl(raw?: string): string | undefined {
  if (!raw) return undefined;

  let u = raw.trim();
  if (!u) return undefined;

  // Si no empieza con http/https, asumimos https://
  if (!/^https?:\/\//i.test(u)) {
    u = "https://" + u.replace(/^\/+/, "");
  }

  // Forzar https si viene con http
  if (u.toLowerCase().startsWith("http://")) {
    console.warn(
      "[CloudFront CONFIG] VITE_CLOUDFRONT_URL usa http://; forzando https://"
    );
    u = "https://" + u.slice("http://".length);
  }

  // Quitar slashes al final
  u = u.replace(/\/+$/, "");

  // Avisar si alguien puso un origin de S3 en vez del dominio de CloudFront
  if (/s3-website-|\.s3\.amazonaws\.com/i.test(u)) {
    console.error(
      "[CloudFront CONFIG] VITE_CLOUDFRONT_URL apunta a un endpoint de S3. " +
        "Debes usar el dominio de CloudFront (por ejemplo: https://dizdb3bht17kt.cloudfront.net)"
    );
  }

  return u;
}

export const CLOUDFRONT_URL = normalizeCloudfrontUrl(RAW_CLOUDFRONT_URL);

if (!CLOUDFRONT_URL) {
  console.error(
    "[CloudFront CONFIG] VITE_CLOUDFRONT_URL no está definido o es inválido."
  );
}

if (!AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  console.warn(
    "[S3 CONFIG] Faltan variables de entorno: revisa VITE_AWS_REGION, VITE_AWS_ACCESS_KEY_ID, VITE_AWS_SECRET_ACCESS_KEY"
  );
}

//
// TIPOS
//

export interface VideoItem {
  key: string;   // ruta en S3 (ej: "output/1234/archivo.m3u8")
  title: string; // título amigable
  url: string;   // URL pública de playback vía CloudFront (https)
}

//
// CLIENT S3 (idealmente esto iría en backend, no en el navegador)
//

export const s3Client =
  AWS_REGION && AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY
    ? new S3Client({
        region: AWS_REGION,
        credentials: {
          accessKeyId: AWS_ACCESS_KEY_ID,
          secretAccessKey: AWS_SECRET_ACCESS_KEY,
        },
        
      })
    : null;

//
// LISTADO SIMPLE (sin filtrar variantes)
//

export async function listHlsVideosV0(): Promise<VideoItem[]> {
  if (!s3Client || !S3_OUTPUT_BUCKET || !CLOUDFRONT_URL) {
    console.error("Config S3/CloudFront incompleta");
    return [];
  }

  const params: ListObjectsV2CommandInput = {
    Bucket: S3_OUTPUT_BUCKET,
    Prefix: S3_HLS_PREFIX || undefined,
  };

  const result = await s3Client.send(new ListObjectsV2Command(params));
  const contents = result.Contents || [];

  const hlsObjects = contents.filter((obj) =>
    obj.Key?.toLowerCase().endsWith(".m3u8")
  );

  return hlsObjects.map((obj) => {
    const key = obj.Key!;
    const cleanKey = S3_HLS_PREFIX ? key.replace(S3_HLS_PREFIX, "") : key;
    const baseName = cleanKey.split("/").pop() || cleanKey;
    const title = baseName.replace(".m3u8", "").replace(/[-_]/g, " ");

    // Siempre salimos por CloudFront (https), nunca por el origin del bucket
    const url = `${CLOUDFRONT_URL}/${key}`;

    return { key, title, url };
  });
}

/**
 * Quita el timestamp inicial (1764537735599-) y deja un título bonito.
 *   "1764537735599-Intro-Heroe.m3u8" -> "Intro Heroe"
 */
function prettifyTitleFromKey(key: string): string {
  // Si hay prefijo tipo "output/", lo quitamos solo para el título
  const cleanKey = S3_HLS_PREFIX ? key.replace(S3_HLS_PREFIX, "") : key;
  // Nos quedamos con el último segmento después de la última "/"
  const baseName = cleanKey.split("/").pop() || cleanKey;
  // Quitamos extensión .m3u8 (en mayúsculas/minúsculas)
  const withoutExt = baseName.replace(/\.m3u8$/i, "");
  // Quitamos timestamp largo al inicio: 13 dígitos + guion
  const withoutPrefix = withoutExt.replace(/^\d{10,}-/, "");
  // Reemplazamos guiones/underscores por espacios
  return withoutPrefix.replace(/[-_]+/g, " ").trim();
}

//
// LISTADO PRINCIPAL (ignora *_high.m3u8 y *_low.m3u8)
//

export async function listHlsVideos(): Promise<VideoItem[]> {
  if (!s3Client || !S3_OUTPUT_BUCKET || !CLOUDFRONT_URL) {
    console.error("Config S3/CloudFront incompleta");
    return [];
  }

  const params: ListObjectsV2CommandInput = {
    Bucket: S3_OUTPUT_BUCKET,
    Prefix: S3_HLS_PREFIX || undefined,
  };

  const result = await s3Client.send(new ListObjectsV2Command(params));
  const contents = result.Contents || [];

  // 1) Nos quedamos solo con .m3u8
  // 2) Ignoramos las variantes *_high.m3u8 y *_low.m3u8
  const hlsObjects = contents.filter((obj) => {
    const key = obj.Key?.toLowerCase() || "";
    if (!key.endsWith(".m3u8")) return false;
    if (key.endsWith("_high.m3u8")) return false;
    if (key.endsWith("_low.m3u8")) return false;
    return true;
  });

  return hlsObjects.map((obj) => {
    const key = obj.Key!;
    const title = prettifyTitleFromKey(key);

    // Siempre CloudFront + https, sin slash extra
    const url = `${CLOUDFRONT_URL}/${key}`;

    return { key, title, url };
  });
}