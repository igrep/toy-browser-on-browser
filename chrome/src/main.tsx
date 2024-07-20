import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { Engine } from '@igrep/toy-browser-on-browser-engine/src/to-chrome-facade.ts';

const worker = new Worker(new URL("../../engine/src/index.ts", import.meta.url), {
  type: "module",
  name: "web-worker",
});
const engine = new Engine(worker);

ReactDOM.createRoot(document.body.firstElementChild!).render(
  <React.StrictMode>
    <App engine={engine} />
  </React.StrictMode>,
)
