import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const worker = new Worker(new URL("../../engine/src/index.ts", import.meta.url), {
  type: "module",
  name: "web-worker",
});
console.log(worker);

ReactDOM.createRoot(document.body.firstElementChild!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
