import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/global.css'

// Deliberately not wrapped in StrictMode: its double-invoked effects would
// start the frame download twice in development.
createRoot(document.getElementById('root')).render(<App />)
