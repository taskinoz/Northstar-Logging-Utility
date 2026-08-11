export const FILTER_OPTIONS = [
  { id: 'chat', label: 'Chat' },
  { id: 'chat-command', label: 'Chat commands' },
  { id: 'command', label: 'Commands' },
  { id: 'spew', label: 'Spew messages' },
  { id: 'script', label: 'Script messages' },
  { id: 'warning', label: 'Warnings' },
  { id: 'connections', label: 'Connections' },
];

export const filterEvents = (events, selected) => {
  if (!selected.size) return [];
  return events.filter((event) => event.categories.some((category) => selected.has(category)));
};

export const filterParsedLog = (parsedLog, selected) => {
  if (!selected.size) return [];
  const result = parsedLog.matches
    .map((match) => ({ ...match, events: filterEvents(match.events, selected) }))
    .filter((match) => match.events.length || match.players.length);
  const unmatched = filterEvents(parsedLog.unmatchedEvents, selected);
  if (unmatched.length) {
    result.unshift({ id: 'outside', map: 'Outside matches', startedAt: '', endedAt: '', players: [], events: unmatched });
  }
  return result;
};

export const formatFilteredLog = (matches) => matches.flatMap((match) => [
  `=== ${match.map} ===`,
  match.players.length ? `Players: ${match.players.join(', ')}` : 'Players: none detected',
  ...match.events.map((event) => event.timestamp ? `[${event.timestamp}] ${event.line}` : event.line),
  '',
]).join('\n');

export const createLogDownloadUrl = (matches) => {
  if (!matches.length) return '';
  return `data:text/plain;charset=utf-8,${encodeURIComponent(formatFilteredLog(matches))}`;
};

export const createMatchDownloadName = (match) => {
  const safeMap = match.map.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-|-$/g, '');
  return `northstar-${safeMap || 'match'}-${match.id}.txt`;
};
