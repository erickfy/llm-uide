import type { VideoItem } from "../aws/s3Client";

interface VideoListProps {
  videos: VideoItem[];
  activeKey: string | null;
  onSelect: (video: VideoItem) => void;
}

export function VideoList({ videos, activeKey, onSelect }: VideoListProps) {
  if (!videos.length) {
    return (
      <div className="vl-empty">
        No se encontraron videos HLS (.m3u8) en el bucket de salida.
      </div>
    );
  }

  return (
    <div className="vl-list">
      {videos.map((video) => {
        const isActive = video.key === activeKey;
        return (
          <button
            key={video.key}
            className={`vl-item ${isActive ? "vl-item-active" : ""}`}
            onClick={() => onSelect(video)}
          >
            <div className="vl-thumb">
              <span className="vl-thumb-icon">▶</span>
            </div>
            <div className="vl-meta">
              <div className="vl-title">{video.title}</div>
              <div className="vl-subtitle">{video.key}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
