import { describe, expect, it } from 'vitest';
import { createLogDownloadUrl, createMatchDownloadName, filterEvents, filterParsedLog, formatFilteredLog } from './logFilters';

const command = { categories: ['command'], line: 'status', timestamp: '2026-01-01 10:00:00' };
const chatCommand = { categories: ['chat', 'chat-command'], line: 'Alice: !restart', timestamp: '' };

describe('logFilters helpers', () => {
  it('matches events in any selected category without duplicates', () => {
    expect(filterEvents([command, chatCommand], new Set(['chat', 'chat-command']))).toEqual([chatCommand]);
  });

  it('adds matching outside-match events and retains player-only matches', () => {
    const result = filterParsedLog({
      matches: [{ id: 1, map: 'mp_test', players: ['Alice'], events: [] }],
      unmatchedEvents: [command],
    }, new Set(['command']));
    expect(result.map(({ id }) => id)).toEqual(['outside', 1]);
  });

  it('formats grouped output for download', () => {
    const match = { id: 1, map: 'MP Test!', players: ['Alice'], events: [command] };
    const output = formatFilteredLog([match]);
    expect(output).toContain('=== MP Test! ===');
    expect(output).toContain('Players: Alice');
    expect(output).toContain('[2026-01-01 10:00:00] status');
    expect(decodeURIComponent(createLogDownloadUrl([match]))).toContain('Players: Alice');
    expect(createMatchDownloadName(match)).toBe('northstar-mp-test-1.txt');
  });
});
