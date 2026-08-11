import { Alert, Form, ProgressBar } from 'react-bootstrap';

function LogUploader({ fileName, error, status, onFile }) {
  const isLoading = status === 'reading' || status === 'parsing';
  return (
    <section className="upload-panel">
      <Form.Group controlId="log-file">
        <Form.Label>Select your Northstar log</Form.Label>
        <Form.Control
          type="file"
          accept=".log,.txt,text/plain"
          disabled={isLoading}
          onChange={(event) => onFile(event.target.files?.[0])}
        />
        {fileName && status === 'ready' && <Form.Text>Loaded {fileName}</Form.Text>}
      </Form.Group>
      {isLoading && (
        <div className="mt-3" role="status" aria-live="polite">
          <div className="d-flex justify-content-between mb-1">
            <span>{status === 'reading' ? 'Reading log…' : 'Parsing matches and players…'}</span>
            <span>{fileName}</span>
          </div>
          <ProgressBar animated now={100} aria-label="Log processing" />
        </div>
      )}
      {error && <Alert variant="danger" className="mt-3 mb-0">{error}</Alert>}
    </section>
  );
}

export default LogUploader;
