import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import LeaguesPage from './pages/LeaguesPage'
import BetPage from './pages/BetPage'
import MatchesPage from './pages/MatchesPage'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/leagues" element={<LeaguesPage />} />
        <Route path="/bet" element={<BetPage />} />
        <Route path="/matches" element={<MatchesPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
