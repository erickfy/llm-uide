import { useState } from "react";
import "./App.css";
import { VideoUploadPage } from "./pages/VideoUploadPage";
import { VideoGalleryPage } from "./pages/VideoGalleryPage";

type TabId = "upload" | "gallery";

function App() {
  const [activeTab, setActiveTab] = useState<TabId>("gallery");

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-brand">
          <span className="app-logo">🎬</span>
          <span className="app-title">UIDE HLS Studio</span>
        </div>
        <nav className="app-tabs">
          <button
            className={`app-tab ${
              activeTab === "upload" ? "app-tab-active" : ""
            }`}
            onClick={() => setActiveTab("upload")}
          >
            Subir video
          </button>
          <button
            className={`app-tab ${
              activeTab === "gallery" ? "app-tab-active" : ""
            }`}
            onClick={() => setActiveTab("gallery")}
          >
            Galería HLS
          </button>
        </nav>
      </header>

      <main className="app-main">
        {activeTab === "upload" && <VideoUploadPage />}
        {activeTab === "gallery" && <VideoGalleryPage />}
      </main>
    </div>
  );
}

export default App;
