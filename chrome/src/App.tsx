import { useRef, useEffect } from 'react';
import './App.css';
import type { Engine } from '@igrep/toy-browser-on-browser-engine/src/to-chrome-facade';
import { StatusIndicator } from './StatusIndicator';

const BLANK_PAGE_URL = "toy-browser://blank";

function App({ engine }: { engine: Engine }) {
  const addressBarRef = useRef<HTMLSelectElement>(null);
  useEffect(() => {
    const { current } = addressBarRef;
    engine.visitPage(current?.value ?? BLANK_PAGE_URL);
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
      <div></div>
      <StatusIndicator engine={engine} />
    </>
  );
}

export default App
