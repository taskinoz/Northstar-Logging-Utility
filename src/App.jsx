import { useEffect, useMemo, useState } from 'react';
import { Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import FilterControls from './components/FilterControls';
import LogResults from './components/LogResults';
import LogUploader from './components/LogUploader';
import ThemeToggle from './components/ThemeToggle';
import { createLogDownloadUrl, filterParsedLog } from './helpers/logFilters';
import { parseLog } from './helpers/logParser';

const EMPTY_LOG = { matches: [], unmatchedEvents: [] };
const getInitialTheme = () => {
  const savedTheme = localStorage.getItem('northstar-theme');
  if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

function App() {
  const [logText, setLogText] = useState('');
  const [parsedLog, setParsedLog] = useState(EMPTY_LOG);
  const [fileName, setFileName] = useState('');
  const [filters, setFilters] = useState(new Set());
  const [error, setError] = useState('');
  const [status, setStatus] = useState('idle');
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('northstar-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!logText) return undefined;
    setStatus('parsing');
    if (typeof Worker === 'undefined') {
      const timer = setTimeout(() => {
        setParsedLog(parseLog(logText));
        setStatus('ready');
      }, 0);
      return () => clearTimeout(timer);
    }
    const worker = new Worker(new URL('./workers/logParser.worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => {
      setParsedLog(data);
      setStatus('ready');
      worker.terminate();
    };
    worker.onerror = () => {
      setError('The log could not be parsed.');
      setStatus('error');
      worker.terminate();
    };
    worker.postMessage(logText);
    return () => worker.terminate();
  }, [logText]);
  const results = useMemo(
    () => filterParsedLog(parsedLog, filters),
    [parsedLog, filters],
  );
  const downloadUrl = useMemo(() => {
    return createLogDownloadUrl(results);
  }, [results]);

  const handleFile = async (file) => {
    if (!file) return;
    try {
      setStatus('reading');
      setParsedLog(EMPTY_LOG);
      setLogText('');
      setFileName(file.name);
      setError('');
      setLogText(await file.text());
    } catch {
      setError('The selected log could not be read.');
      setLogText('');
      setFileName('');
      setStatus('error');
    }
  };

  const toggleFilter = (filterId, checked) => {
    setFilters((current) => {
      const next = new Set(current);
      if (checked) next.add(filterId);
      else next.delete(filterId);
      return next;
    });
  };

  return (
    <main className="app-shell">
      <Container>
        <header className="app-header py-4">
          <div className="header-copy text-center">
            <h1>Northstar Logging Utility</h1>
            <p className="text-secondary mb-0">Inspect activity by match and player.</p>
          </div>
          <ThemeToggle theme={theme} onToggle={() => setTheme((current) => current === 'light' ? 'dark' : 'light')} />
        </header>
        <LogUploader fileName={fileName} error={error} status={status} onFile={handleFile} />
        <FilterControls selected={filters} onToggle={toggleFilter} disabled={status === 'reading' || status === 'parsing'} />
        <LogResults
          hasFile={Boolean(fileName)}
          isLoading={status === 'reading' || status === 'parsing'}
          hasFilters={filters.size > 0}
          matches={results}
          downloadUrl={downloadUrl}
        />
      </Container>
    </main>
  );
}

export default App;
