import { Badge, Button, Card } from 'react-bootstrap';
import { createLogDownloadUrl, createMatchDownloadName } from '../helpers/logFilters';

const MAX_VISIBLE_EVENTS = 500;

function MatchResult({ match, number }) {
  const visibleEvents = match.events.slice(0, MAX_VISIBLE_EVENTS);
  const hiddenCount = match.events.length - visibleEvents.length;
  const downloadUrl = createLogDownloadUrl([match]);
  return (
    <Card className="match-card">
      <Card.Header className="match-header">
        <div>
          <strong>{match.id === 'outside' ? match.map : `Match ${number}: ${match.map}`}</strong>
          {match.startedAt && <span className="match-time">{match.startedAt}{match.endedAt ? ` – ${match.endedAt}` : ''}</span>}
        </div>
        <Button
          variant="outline-primary"
          size="sm"
          href={downloadUrl}
          download={createMatchDownloadName(match)}
        >
          Download match
        </Button>
      </Card.Header>
      <Card.Body>
        <div className="players" aria-label="Players">
          <span className="text-secondary me-2">Players:</span>
          {match.players.length
            ? match.players.map((player) => <Badge bg="secondary" key={player}>{player}</Badge>)
            : <span className="text-secondary">none detected</span>}
        </div>
        {match.events.length > 0 && (
          <div className="log-lines">
            {visibleEvents.map((event, index) => (
              <p key={`${event.timestamp}-${index}`}>
                {event.timestamp && <time>{event.timestamp}</time>}{event.line}
              </p>
            ))}
            {hiddenCount > 0 && (
              <p className="truncated-message">
                {hiddenCount.toLocaleString()} more entries are available in the download.
              </p>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

function LogResults({ hasFile, hasFilters, matches, downloadUrl, isLoading }) {
  if (!hasFile) return <p className="empty-state">Upload a log to begin.</p>;
  if (isLoading) return <p className="empty-state">Processing the log…</p>;
  if (!hasFilters) return <p className="empty-state">Choose one or more filters to view parsed entries.</p>;

  return (
    <section aria-live="polite" className="results">
      <div className="results-toolbar">
        <h2 className="h4 mb-0">Parsed matches</h2>
        {downloadUrl && <Button href={downloadUrl} download="northstar-parsed-log.txt">Download all</Button>}
      </div>
      {matches.length
        ? matches.map((match, index) => <MatchResult key={match.id} match={match} number={index + 1} />)
        : <p className="empty-state">No entries matched the selected filters.</p>}
    </section>
  );
}

export default LogResults;
