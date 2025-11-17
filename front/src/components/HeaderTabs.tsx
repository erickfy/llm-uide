type TabId = 'llm' | 'binary'

interface HeaderTabsProps {
  activeTab: TabId
  onChange: (tab: TabId) => void
}

export function HeaderTabs({ activeTab, onChange }: HeaderTabsProps) {
  return (
    <header className="app-header">
      <div className="app-header-left">
        <span className="app-logo-dot" />
        <span className="app-title">UIDE Jarvis</span>
        <span className="app-env-badge">local</span>
      </div>

      <nav className="app-tabs">
        <button
          className={`app-tab ${activeTab === 'llm' ? 'app-tab--active' : ''}`}
          onClick={() => onChange('llm')}
        >
          LLM
        </button>
        <button
          className={`app-tab ${
            activeTab === 'binary' ? 'app-tab--active' : ''
          }`}
          onClick={() => onChange('binary')}
        >
          Binary Search
        </button>
      </nav>
    </header>
  )
}