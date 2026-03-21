import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import StrainSense from './StrainSense.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StrainSense />
  </StrictMode>,
)
