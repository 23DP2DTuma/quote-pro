import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import MasterPage from './pages/MasterPage'
import ClientPage from './pages/ClientPage'
import { isDemo } from './lib/api'

export default function App() {
  return (
    <BrowserRouter>
      <div className="topbar">
        <Link to="/" className="logo">Quote<span>Pro</span></Link>
        {isDemo && <span className="badge">демо-режим · без n8n</span>}
      </div>
      <Routes>
        <Route path="/" element={<MasterPage />} />
        <Route path="/q/:id" element={<ClientPage />} />
      </Routes>
    </BrowserRouter>
  )
}
