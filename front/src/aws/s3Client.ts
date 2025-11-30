import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import type { ListObjectsV2CommandInput } from "@aws-sdk/client-s3";

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

export const CLOUDFRONT_URL = import.meta.env
    .VITE_CLOUDFRONT_URL as string | undefined;

if (!AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    console.warn(
        "[S3 CONFIG] Faltan variables de entorno: revisa VITE_AWS_REGION, VITE_AWS_ACCESS_KEY_ID, VITE_AWS_SECRET_ACCESS_KEY"
    );
}

export interface VideoItem {
    key: string; // ruta en S3
    title: string;
    url: string; // URL de playback vía CloudFront
}

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

        const url = `${CLOUDFRONT_URL.replace(/\/$/, "")}/${key}`;

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
        const url = `${CLOUDFRONT_URL.replace(/\/$/, "")}/${key}`;
        return { key, title, url };
    });
}