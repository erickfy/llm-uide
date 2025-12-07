import { useEffect, useState } from "react";
import {
  listHlsVideos,
  RAW_CLOUDFRONT_URL,
  type VideoItem,
} from "../aws/s3Client";
import { VideoPlayer } from "../components/VideoPlayer";
import { VideoList } from "../components/VideoList";
import "./VideoGalleryPage.css";

type Status = "idle" | "loading" | "error" | "ready";

const S3_WEBSITE_HOST = "uide-jarvis-front.s3-website-us-east-1.amazonaws.com";
const CLOUDFRONT_HOST = RAW_CLOUDFRONT_URL;

function normalizePlaybackUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  let u = url.trim();
  if (!u) return null;

  // Si viene con el host del website (http o https), lo cambiamos a CloudFront
  u = u.replace(
    new RegExp(`^https?://${S3_WEBSITE_HOST}`),
    `https://${CLOUDFRONT_HOST}`
  );

  // Por seguridad, cualquier http:// lo forzamos a https://
  if (u.toLowerCase().startsWith("http://")) {
    u = "https://" + u.slice("http://".length);
  }

  return u;
}

function FooterPlayer({
  activeVideo,
  playbackUrl,
  title,
}: {
  activeVideo: VideoItem | null;
  playbackUrl: string | null;
  title: string;
}) {
  const rawVideoUrl =
    normalizePlaybackUrl(playbackUrl ?? activeVideo?.url) ?? "";
  const hasVideoUrl = !!rawVideoUrl;
  const isHttpsPlayback = rawVideoUrl.startsWith("https://");

  // Solo exponemos videoUrl si existe
  const videoUrl = hasVideoUrl ? rawVideoUrl : undefined;

  // Solo construimos la URL de la demo HLS si la URL de playback es https
  const hlsUrl = isHttpsPlayback
    ? `https://hlsjs.video-dev.org/demo/?src=${encodeURIComponent(
        rawVideoUrl.replace("_low", "").replace("_high", "")
      )}&demoConfig=eyJlbmFibGVTdHJlYW1pbmciOnRydWUsImF1dG9SZWNvdmVyRXJyb3IiOnRydWUsInN0b3BPblN0YWxsIjpmYWxzZSwiZHVtcGZNUDQiOmZhbHNlLCJsZXZlbENhcHBpbmciOi0xLCJsaW1pdE1ldHJpY3MiOi0xfQ==`
    : undefined;

  return (
    <div className="vg-info-grid">
      <div>
        <div className="vg-info-label">Objeto en S3 (salida)</div>
        <div className="vg-info-value">{activeVideo?.key}</div>
      </div>
      <div>
        <div>
          <div className="vg-info-label">URL de playback</div>
          <div className="vg-info-value vg-info-url">
            {activeVideo && (
              <a
                href={videoUrl}
                className="vg-playback-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {videoUrl}
                <span className="vg-link-icon" aria-hidden="true">
                  ↗
                </span>
              </a>
            )}
          </div>
        </div>
        <div>
          <div className="vg-info-label">URL de HLS (demo hls.js)</div>
          <div className="vg-info-value vg-info-url">
            {activeVideo && (
              <>
                {hlsUrl ? (
                  // ✅ Habilitado cuando la URL es https
                  <a
                    href={hlsUrl}
                    className="vg-playback-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {title}
                    <span className="vg-link-icon" aria-hidden="true">
                      ↗
                    </span>
                  </a>
                ) : (
                  // ❌ "Deshabilitado" cuando no hay https
                  <span
                    className="vg-playback-link vg-playback-link--disabled"
                    aria-disabled="true"
                    title="La URL de playback debe empezar con https:// para probarla en la demo de hls.js"
                  >
                    No disponible (requiere HTTPS)
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function VideoGalleryPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // URL de playback efectiva (según calidad seleccionada)
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadVideos() {
      try {
        setStatus("loading");
        const items = await listHlsVideos();
        setVideos(items);
        const first = items[0] ?? null;
        setActiveVideo(first);
        setStatus("ready");

        if (first?.url) {
          setPlaybackUrl(normalizePlaybackUrl(first.url));
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        console.error("Error al listar objetos S3:", err);
        setErrorMsg(msg);
        setStatus("error");
      }
    }
    loadVideos();
  }, []);

  function handleSelectVideo(video: VideoItem) {
    setActiveVideo(video);
    setPlaybackUrl(normalizePlaybackUrl(video.url));
  }

  const headerTitle = (activeVideo?.title ?? "CloudFront HLS Studio").split(
    "-"
  )[0];

  return (
    <div className="vg-page">
      <header className="vg-header">
        <div className="vg-logo">
          <span className="vg-logo-icon" style={{ marginLeft: "4px" }}>
            🦸‍♂️
          </span>
          <span className="vg-logo-text">{headerTitle}</span>
        </div>
        <div className="vg-header-right">
          <span className="vg-badge">Actividad 2 · CloudFront + HLS</span>
        </div>
      </header>

      <main className="vg-main">
        <section className="vg-main-left">
          <VideoPlayer
            src={normalizePlaybackUrl(activeVideo?.url ?? null)}
            title={activeVideo?.title ?? ""}
            onSourceChange={(newSrc) => setPlaybackUrl(newSrc)}
          />

          <div className="vg-info">
            <h2>Detalles del streaming</h2>
            <p>
              Estás reproduciendo contenido HLS generado por{" "}
              <strong>Amazon Elemental MediaConverter</strong> y entregado
              mediante <strong>Amazon CloudFront (S3)</strong>.
            </p>
            {activeVideo && (
              <FooterPlayer
                activeVideo={activeVideo}
                playbackUrl={playbackUrl}
                title={activeVideo?.title ?? ""}
              />
            )}
          </div>
        </section>

        <aside className="vg-main-right">
          <h3 className="vg-list-title">Lista de videos (HLS)</h3>

          {status === "loading" && (
            <div className="vg-status">Cargando videos desde S3...</div>
          )}

          {status === "error" && (
            <div className="vg-status vg-status-error">
              Error al listar objetos del bucket: {errorMsg}
            </div>
          )}

          {status === "ready" && (
            <VideoList
              videos={videos}
              activeKey={activeVideo?.key ?? null}
              onSelect={handleSelectVideo}
            />
          )}
        </aside>
      </main>
    </div>
  );
}
