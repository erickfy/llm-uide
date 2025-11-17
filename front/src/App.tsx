import { useState } from 'react'
import './App.css'
import { HeaderTabs } from './components/HeaderTabs'
import { LlmPage } from './pages/LlmPage'
import { BinarySearchPage } from './pages/BinarySearchPage'

type TabId = 'llm' | 'binary'

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('llm')

  return (
    <div className="app">
      <HeaderTabs activeTab={activeTab} onChange={setActiveTab} />

      <main className="app-main">
        {activeTab === 'llm' && <LlmPage />}
        {activeTab === 'binary' && <BinarySearchPage />}
      </main>
    </div>
  )
}

export default App