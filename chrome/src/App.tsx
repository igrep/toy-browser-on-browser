import { useRef, useEffect, useCallback } from 'react';
import './App.css';
import type { Engine } from '@igrep/toy-browser-on-browser-engine/src/to-chrome-facade';
import { StatusIndicator } from './StatusIndicator';

const BLANK_PAGE_URL = "toy-browser://blank";

function App({ engine }: { engine: Engine }) {

  const addressBarRef = useRef<HTMLSelectElement>(null);
  useEffect(() => {
    engine.visitPage(addressBarRef.current?.value ?? BLANK_PAGE_URL);
    return () => {
      engine.terminate();
    };
  }, [engine]);

  function onChange(event: React.ChangeEvent<HTMLSelectElement>) {
    engine.visitPage(event.target.value);
  }

  return (
    <>
      <label>{"URL: "}
        <select onChange={onChange} ref={addressBarRef}>
          <option>{BLANK_PAGE_URL}</option>
          <option>toy-browser://first-page</option>
          <option>toy-browser://second-page</option>
        </select>
      </label>
      <canvas
        width={800}
        height={600}
        ref={useCallback((canvas: HTMLCanvasElement) => {
          if (canvas == null) {
            engine.terminate();
            return;
          }
          engine.canvasReady(canvas.transferControlToOffscreen());
        }, [engine])}
      ></canvas>
      <StatusIndicator engine={engine} />
    </>
  );
}

export default App
