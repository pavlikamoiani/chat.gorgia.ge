import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Provider } from 'react-redux'
import store from './store/store'
import { CallProvider } from './contexts/CallContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <CallProvider>
        <App />
      </CallProvider>
    </Provider>
  </StrictMode>,
)
