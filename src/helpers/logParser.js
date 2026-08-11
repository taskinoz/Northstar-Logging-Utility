const MODERN_TIMESTAMP_PATTERN = /^\[([^\]]+)] \[([^\]]+)]/;
const LEGACY_TIMESTAMP_PATTERN = /^\[(\d{4}-\d{2}-\d{2}) ([^\]]+)]/;
const PLAYER_ENTITY_PATTERN = /\bplayer\s+(.+?)\s+\[\d+]/g;
const PLAYER_DISCONNECT_PATTERN = /\bPlayer\s+(.+?)\s+disconnected:/i;
const CHAT_MARKER = 'Received message from entity';

export const normalizePlayerName = (name) => name
  .trim()
  .replace(/^"?player\s+/i, '')
  .replace(/^"|"$/g, '')
  .trim();

const extractTimestamp = (line) => {
  const match = LEGACY_TIMESTAMP_PATTERN.exec(line) || MODERN_TIMESTAMP_PATTERN.exec(line);
  return match ? `${match[1]} ${match[2]}` : '';
};

export const extractMapName = (line) => {
  let match = null;
  if (line.includes('UICodeCallback_LevelLoadingStarted:')) {
    match = line.match(/UICodeCallback_LevelLoadingStarted:\s*(mp_[\w]+)/i);
  } else if (line.includes('changed the map to')) {
    match = line.match(/\bchanged the map to\s+(mp_[\w]+)/i);
  } else if (line.startsWith('Map:')) {
    match = line.match(/^Map:\s*(mp_[\w]+)/i);
  } else if (line.includes('MountVPK vpk/client_mp_')) {
    match = line.match(/MountVPK\s+vpk\/client_(mp_(?!common\b)[\w]+)\.bsp/i);
  }
  return match?.[1] ?? null;
};

export const extractPlayerNames = (line) => {
  const players = new Set();
  let match;
  PLAYER_ENTITY_PATTERN.lastIndex = 0;
  while ((match = PLAYER_ENTITY_PATTERN.exec(line))) {
    const name = normalizePlayerName(match[1]);
    if (name) players.add(name);
  }
  const disconnected = normalizePlayerName(PLAYER_DISCONNECT_PATTERN.exec(line)?.[1] ?? '');
  if (disconnected) players.add(disconnected);
  return [...players];
};

const extractChat = (line) => {
  const markerIndex = line.indexOf(CHAT_MARKER);
  if (markerIndex === -1) return null;
  const player = extractPlayerNames(line)[0] ?? 'Unknown player';
  const messageMatch = line.slice(markerIndex).match(/\)(?:\([^)]*\))?:\s*(.*)$/);
  const message = messageMatch?.[1] ?? line.slice(markerIndex + CHAT_MARKER.length);
  return { player, message: message.trim() };
};

export const classifyLine = (line) => {
  const categories = [];
  let text = null;
  const chat = extractChat(line);

  if (chat) {
    categories.push('chat');
    if (chat.message.startsWith('!')) categories.push('chat-command');
    text = `${chat.player}: ${chat.message}`;
  } else if (line.includes('CommandString:')) {
    categories.push('command');
    text = line.slice(line.indexOf('CommandString:') + 14).trim();
  } else if (line.includes('[SERVER SPEW_MESSAGE]')) {
    categories.push('spew');
    text = line.split('[SERVER SPEW_MESSAGE]')[1].trim();
  } else if (line.includes('[SERVER SCRIPT]')) {
    categories.push('script');
    text = line.split('[SERVER SCRIPT]')[1].trim();
  } else if (line.includes('[SERVER SPEW_WARNING]')) {
    categories.push('warning');
    text = line.split('[SERVER SPEW_WARNING]')[1].trim();
  } else if (/\s#\s\d/.test(line) || line.includes('[::')) {
    categories.push('connections');
    text = line.trim();
  }

  if (!categories.length) return null;
  return { categories, line: text || line.trim(), timestamp: extractTimestamp(line) };
};

const createMatch = (id, map, line) => ({
  id,
  map,
  startedAt: extractTimestamp(line),
  endedAt: '',
  players: new Set(),
  events: [],
});

export const parseLog = (text) => {
  if (!text) return { matches: [], unmatchedEvents: [] };
  const matches = [];
  const unmatchedEvents = [];
  let currentMatch = null;
  let matchId = 0;
  let start = 0;

  for (let index = 0; index <= text.length; index += 1) {
    if (index !== text.length && text.charCodeAt(index) !== 10) continue;
    const line = text.slice(start, index).replace(/\r$/, '');
    start = index + 1;

    const map = extractMapName(line);
    if (map === 'mp_lobby') {
      if (currentMatch) currentMatch.endedAt ||= extractTimestamp(line);
      currentMatch = null;
    } else if (map && currentMatch?.map !== map) {
      if (currentMatch) currentMatch.endedAt ||= extractTimestamp(line);
      currentMatch = createMatch(++matchId, map, line);
      matches.push(currentMatch);
    }

    if (currentMatch && (line.includes('player ') || line.includes('Player '))) {
      for (const player of extractPlayerNames(line)) currentMatch.players.add(player);
    }

    const event = classifyLine(line);
    if (event) (currentMatch ? currentMatch.events : unmatchedEvents).push(event);

    if (currentMatch && line.includes('Match Complete')) {
      currentMatch.endedAt = extractTimestamp(line);
      currentMatch = null;
    }
  }

  return {
    matches: matches.map((match) => ({ ...match, players: [...match.players] })),
    unmatchedEvents,
  };
};
