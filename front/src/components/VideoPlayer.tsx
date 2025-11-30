import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

interface VideoPlayerProps {
  src: string | null;
  title: string;
  // callback opcional para avisar al padre la URL efectiva de playback
  onSourceChange?: (url: string) => void;
}

type QualityValue = "auto" | number;

interface LevelInfo {
  index: number;
  label: string;
}

export function VideoPlayer({ src, title, onSourceChange }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [levels, setLevels] = useState<LevelInfo[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<QualityValue>("auto");
  const [qualityEnabled, setQualityEnabled] = useState(false);
  const [currentLabel, setCurrentLabel] = useState<string>("Auto");

  useEffect(() => {
    // 🔥 limpiar cualquier instancia previa
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    setLevels([]);
    setSelectedQuality("auto");
    setQualityEnabled(false);
    setCurrentLabel("Auto");

    if (!src || !videoRef.current) return;

    const video = videoRef.current;

    if (
      video.canPlayType("application/vnd.apple.mpegurl") &&
      !Hls.isSupported()
    ) {
      video.src = src;
      if (onSourceChange) onSourceChange(src);
      return;
    }

    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        const lvlInfos: LevelInfo[] = data.levels.map((level, index) => {
          const height = level.height || 0;
          const bitrateKbps = level.bitrate
            ? Math.round(level.bitrate / 1000)
            : null;

          let label = "";
          if (height) label = `${height}p`;
          if (bitrateKbps) {
            label = label
              ? `${label} (${bitrateKbps} kbps)`
              : `${bitrateKbps} kbps`;
          }
          if (!label) label = `Nivel ${index}`;

          return { index, label };
        });

        setLevels(lvlInfos);
        setSelectedQuality("auto");
        setQualityEnabled(lvlInfos.length > 0);
        setCurrentLabel("Auto");

        // console.log("[HLS] Manifest parsed. Levels:", lvlInfos);

        // Al inicio: playback = master playlist
        if (onSourceChange) onSourceChange(src);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
        const levelIndex = data.level;
        const level = hls.levels[levelIndex];

        const height = level.height || 0;
        const bitrateKbps = level.bitrate
          ? Math.round(level.bitrate / 1000)
          : null;

        let label = "";
        if (height) label = `${height}p`;
        if (bitrateKbps) {
          label = label
            ? `${label} (${bitrateKbps} kbps)`
            : `${bitrateKbps} kbps`;
        }
        if (!label) label = `Nivel ${levelIndex}`;

        setCurrentLabel(label);
        // console.log(
        //   "[HLS] LEVEL_SWITCHED →",
        //   label,
        //   "(index:",
        //   levelIndex,
        //   ")"
        // );
        // ⚠️ aquí NO llamamos a onSourceChange para evitar disparos extra.
        // La URL la actualizamos cuando el usuario cambia manualmente en el select.
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
        setLevels([]);
        setQualityEnabled(false);
        setCurrentLabel("Auto");
      };
    } else {
      // fallback simple
      video.src = src;
      if (onSourceChange) onSourceChange(src);
    }
    // 👇 SOLO depende de src → no entra en bucle con onSourceChange
  }, [src]);

  function handleQualityChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    const hls = hlsRef.current;

    if (!hls) {
      setSelectedQuality("auto");
      setCurrentLabel("Auto");
      if (onSourceChange && src) onSourceChange(src);
      return;
    }

    if (value === "auto") {
      setSelectedQuality("auto");
      setCurrentLabel("Auto");
      hls.currentLevel = -1;
      // console.log("[HLS] Calidad cambiada a Auto");
      if (onSourceChange && src) onSourceChange(src);
    } else {
      const levelIndex = Number(value);
      setSelectedQuality(levelIndex);
      hls.currentLevel = levelIndex;
      // console.log("[HLS] Usuario seleccionó nivel", levelIndex);

      const level = hls.levels[levelIndex];
      if (onSourceChange && level && level.url) {
        const rawUrl = Array.isArray(level.url) ? level.url[0] : level.url;
        if (rawUrl) {
          let resolved = rawUrl;
          if (src) {
            try {
              resolved = new URL(rawUrl, src).toString();
            } catch {
              // dejamos resolved = rawUrl
            }
          }
          onSourceChange(resolved);
        }
      }
      // El texto de calidad se actualiza en LEVEL_SWITCHED
    }
  }

  return (
    <div className="vp-wrapper">
      <div className="vp-player">
        {src ? (
          <video ref={videoRef} controls playsInline className="vp-video" />
        ) : (
          <div className="vp-video vp-video-placeholder">
            Selecciona un video de la lista
          </div>
        )}
      </div>

      <div className="vp-bottom-bar">
        <div className="vp-title">
          {title || "Sin título"}
          {qualityEnabled && (
            <span
              style={{
                marginLeft: "0.5rem",
                fontSize: "0.8rem",
                color: "#9ca3af",
              }}
            >
              · Resolución actual: {currentLabel}
            </span>
          )}
        </div>

        {qualityEnabled && levels.length > 0 && (
          <div className="vp-quality">
            <span className="vp-quality-label">Calidad</span>
            <select
              className="vp-quality-select"
              value={
                selectedQuality === "auto" ? "auto" : String(selectedQuality)
              }
              onChange={handleQualityChange}
            >
              <option value="auto">Auto</option>
              {levels.map((lvl) => (
                <option key={lvl.index} value={lvl.index}>
                  {lvl.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
