import { useEffect, useState } from "react";
import { listHlsVideos, type VideoItem } from "../aws/s3Client";
import { VideoPlayer } from "../components/VideoPlayer";
import { VideoList } from "../components/VideoList";
import "./VideoGalleryPage.css";

type Status = "idle" | "loading" | "error" | "ready";

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
          setPlaybackUrl(first.url);
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
    setPlaybackUrl(video.url);
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
            src={activeVideo?.url ?? null}
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
              <div className="vg-info-grid">
                <div>
                  <div className="vg-info-label">Objeto en S3 (salida)</div>
                  <div className="vg-info-value">{activeVideo.key}</div>
                </div>
                <div>
                  <div className="vg-info-label">URL de playback</div>
                  <div className="vg-info-value vg-info-url">
                    {activeVideo && (
                      <a
                        href={playbackUrl ?? activeVideo.url}
                        className="vg-playback-link"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {playbackUrl ?? activeVideo.url}
                        <span className="vg-link-icon" aria-hidden="true">
                          ↗
                        </span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
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
