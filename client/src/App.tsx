import { Routes, Route, NavLink } from 'react-router-dom'
import CellarPage from './pages/CellarPage'
import AddWinePage from './pages/AddWinePage'
import ScanLabelPage from './pages/ScanLabelPage'
import RecommendationsPage from './pages/RecommendationsPage'

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <span className="app-title">Wine Cellar</span>
        <nav>
          <NavLink to="/" end>Cellar</NavLink>
          <NavLink to="/add">Add Wine</NavLink>
          <NavLink to="/scan">Scan Label</NavLink>
          <NavLink to="/recommendations">Recommendations</NavLink>
        </nav>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<CellarPage />} />
          <Route path="/add" element={<AddWinePage />} />
          <Route path="/scan" element={<ScanLabelPage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
        </Routes>
      </main>
    </div>
  )
}
