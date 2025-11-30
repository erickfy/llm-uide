import { useRef, useState } from "react";
import "./VideoUploadPage.css";

import { Upload } from "@aws-sdk/lib-storage";
import type { PutObjectCommandInput } from "@aws-sdk/client-s3";
import { s3Client, S3_INPUT_BUCKET } from "../aws/s3Client";

type StatusType = "idle" | "info" | "error" | "success";

// límite de tamaño en MB
const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function VideoUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>("");
  const [statusType, setStatusType] = useState<StatusType>("idle");
  const [isUploading, setIsUploading] = useState(false);

  // ref para limpiar el input file visualmente
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function updateStatus(message: string, type: StatusType) {
    setStatus(message);
    setStatusType(type);
  }

  async function handleUpload() {
    if (!file) {
      updateStatus("Selecciona un archivo de video primero.", "error");
      return;
    }

    // 🚨 Validación de tamaño: no más de 20 MB
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      updateStatus(
        `El archivo es demasiado grande (${sizeMb} MB). El máximo permitido es ${MAX_FILE_SIZE_MB} MB.`,
        "error"
      );
      return;
    }

    if (!s3Client || !S3_INPUT_BUCKET) {
      updateStatus(
        "Faltan variables de entorno o cliente S3 (revisa VITE_S3_INPUT_BUCKET_NAME).",
        "error"
      );
      return;
    }

    setIsUploading(true);
    setProgress(0);
    updateStatus("Preparando subida de video de origen a S3...", "info");

    try {
      const baseTitle = title.trim()
        ? title.trim().replace(/\s+/g, "-")
        : file.name;

      const dotIndex = file.name.lastIndexOf(".");
      const ext = dotIndex !== -1 ? file.name.substring(dotIndex) : ".mp4"; // fallback por si acaso

      // quitamos posible extensión del baseTitle para no duplicar
      const baseWithoutExt = baseTitle.replace(/\.[a-zA-Z0-9]+$/, "");

      const objectKey = `input/${Date.now()}-${baseWithoutExt}${ext}`;

      const params: PutObjectCommandInput = {
        Bucket: S3_INPUT_BUCKET,
        Key: objectKey,
        Body: file,
        ContentType: file.type || "video/mp4",
      };

      const upload = new Upload({
        client: s3Client,
        params,
        queueSize: 1, // SOLO 1 REQUEST
        partSize: 25 * 1024 * 1024,
        leavePartsOnError: false,
      });

      upload.on("httpUploadProgress", (evt: any) => {
        if (evt.total) {
          const percent = Math.round(((evt.loaded || 0) / evt.total) * 100);
          setProgress(percent);
          updateStatus(`Subiendo video... ${percent}%`, "info");
        }
      });

      await upload.done();

      // ✅ Subida OK
      setProgress(100);
      updateStatus(
        `Video subido correctamente como: ${objectKey}.
Visualización lista en la galería.`,
        "success"
      );

      // Limpieza de campos
      setFile(null);
      setTitle("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Después de 10 segundos, ocultar mensaje y resetear barra
      window.setTimeout(() => {
        setStatus("");
        setStatusType("idle");
        setProgress(0);
      }, 10_000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      console.error(err);
      setProgress(0);
      updateStatus(`Error durante la subida: ${message}`, "error");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="video-upload-page">
      <div className="video-upload-inner">
        <div className="vu-card">
          <h1>Subir video de origen a S3</h1>
          <p className="vu-description">
            Esta pantalla sube un archivo de video al{" "}
            <strong>bucket de entrada</strong> de S3. Ese objeto es la entrada
            para <strong>AWS Elemental MediaConvert</strong>, que generará las
            salidas HLS (varios bitrates) que luego se entregan con{" "}
            <strong>Amazon CloudFront</strong>.
          </p>

          <div className="vu-pill">
            <span className="vu-pill-dot" />
            <span>Entrada · Bucket S3 (origen del transcoding)</span>
          </div>

          <label className="vu-label" htmlFor="title">
            Título o versión del video (opcional)
          </label>
          <input
            id="title"
            className="vu-input"
            type="text"
            placeholder="Ej: clase-01, demo-hls-v1..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <label className="vu-label" htmlFor="file">
            Archivo de video
          </label>
          <span className="vu-note">(Máx. 20 MB)</span>
          <input
            id="file"
            ref={fileInputRef}
            className="vu-input"
            type="file"
            accept="video/*"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
              setProgress(0);
              setStatus("");
              setStatusType("idle");

              if (f && f.size > MAX_FILE_SIZE_BYTES) {
                const sizeMb = (f.size / (1024 * 1024)).toFixed(1);
                updateStatus(
                  `El archivo seleccionado pesa ${sizeMb} MB. El máximo permitido es ${MAX_FILE_SIZE_MB} MB.`,
                  "error"
                );
              }
            }}
          />

          <button
            type="button"
            className="vu-button"
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? "Subiendo..." : "Subir video a S3"}
          </button>

          <div className="vu-progress-wrap">
            <div
              className="vu-progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>

          {status && (
            <div className={`vu-status vu-status-${statusType}`}>{status}</div>
          )}

          <p className="vu-note">
            Flujo:
            <br />• El usuario sube el video al bucket de entrada.
            <br />• MediaConvert monitoriza ese bucket (o prefijo) y genera
            salidas HLS en el bucket de salida.
            <br />• CloudFront entrega las playlists HLS (archivos .m3u8) a los
            clientes, usando HTTP Live Streaming (HLS).
          </p>
        </div>
      </div>
    </section>
  );
}
