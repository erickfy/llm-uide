export type TabId = "llm" | "binary" | "video";

interface HeaderTabsProps {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
}

export function HeaderTabs({ activeTab, onChange }: HeaderTabsProps) {
  return (
    <header className="header-tabs">
      <button
        className={activeTab === "video" ? "tab active" : "tab"}
        onClick={() => onChange("video")}
      >
        Video S3 / CloudFront
      </button>

      <button
        className={activeTab === "llm" ? "tab active" : "tab"}
        onClick={() => onChange("llm")}
      >
        LLM
      </button>

      <button
        className={activeTab === "binary" ? "tab active" : "tab"}
        onClick={() => onChange("binary")}
      >
        Binary Search
      </button>
    </header>
  );
}
