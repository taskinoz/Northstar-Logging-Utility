import { describe, expect, it } from 'vitest';
import { classifyLine, extractMapName, extractPlayerNames, normalizePlayerName, parseLog } from './logParser';

describe('logParser helpers', () => {
  it('extracts map markers without treating the lobby as a match', () => {
    expect(extractMapName('[SCRIPT UI] UICodeCallback_LevelLoadingStarted: mp_colony02')).toBe('mp_colony02');
    expect(extractMapName('[SCRIPT SV] admin changed the map to mp_angel_city.---UID:1')).toBe('mp_angel_city');
    expect(extractMapName('[2022-08-06 11:08:04.169] [info] MountVPK vpk/client_mp_glitch.bsp')).toBe('mp_glitch');
    expect(extractMapName('[info] MountVPK vpk/client_mp_common.bsp')).toBeNull();
  });

  it('extracts and de-duplicates player names, including spaces', () => {
    const line = 'Victim: entity (2: player The taskinoz [2]) hit player The taskinoz [2]';
    expect(extractPlayerNames(line)).toEqual(['The taskinoz']);
    expect(extractPlayerNames('Player shadPS4 disconnected: "timed out"')).toEqual(['shadPS4']);
    expect(extractPlayerNames('Setting player "player SarahBriggsSimp [1]" predicted model')).toEqual(['SarahBriggsSimp']);
  });

  it('normalizes quoted engine entity labels', () => {
    expect(normalizePlayerName('"player GlassFire64')).toBe('GlassFire64');
    expect(normalizePlayerName('AgentOink48')).toBe('AgentOink48');
  });

  it('classifies commands and preserves their useful content', () => {
    expect(classifyLine('[2026-01-01] [10:20:30] [SCRIPT SV] [info] CommandString: ClientStatus was called')).toEqual({
      categories: ['command'],
      line: 'ClientStatus was called',
      timestamp: '2026-01-01 10:20:30',
    });
  });

  it('classifies chat commands as both chat and chat-command', () => {
    const event = classifyLine('[SCRIPT SV] Received message from entity (1: player Alice Smith [1]): !restart now');
    expect(event.categories).toEqual(['chat', 'chat-command']);
    expect(event.line).toBe('Alice Smith: !restart now');
  });

  it('parses chat and timestamps from legacy logs with player UIDs', () => {
    const event = classifyLine('[2022-08-06 11:16:11.048] [info] [SERVER SCRIPT] Received message from entity (1: player SarahBriggsSimp [1])(1010007013606): !dropship');
    expect(event).toEqual({
      categories: ['chat', 'chat-command'],
      line: 'SarahBriggsSimp: !dropship',
      timestamp: '2022-08-06 11:16:11.048',
    });
  });
});

describe('parseLog', () => {
  it('groups events and players into separate matches in one log', () => {
    const parsed = parseLog([
      '[2026-07-17] [19:42:47] [SCRIPT UI] [info] UICodeCallback_LevelLoadingStarted: mp_colony02',
      '[2026-07-17] [19:43:02] [SCRIPT SV] [info] Player connect started: entity (1: player Alice [1])',
      '[2026-07-17] [19:44:00] [SCRIPT SV] [info] CommandString: first',
      '[2026-07-17] [19:53:32] [SCRIPT CL] [info] Match Complete',
      '[2026-07-17] [20:00:00] [SCRIPT UI] [info] UICodeCallback_LevelLoadingStarted: mp_angel_city',
      '[2026-07-17] [20:00:01] [SCRIPT SV] [info] Player connect started: entity (2: player Bob Jones [2])',
      '[2026-07-17] [20:00:02] [SCRIPT SV] [info] CommandString: second',
    ].join('\n'));

    expect(parsed.matches).toHaveLength(2);
    expect(parsed.matches[0]).toMatchObject({ map: 'mp_colony02', players: ['Alice'] });
    expect(parsed.matches[0].events[0].line).toBe('first');
    expect(parsed.matches[1]).toMatchObject({ map: 'mp_angel_city', players: ['Bob Jones'] });
  });

  it('keeps filtered events outside match boundaries available', () => {
    const parsed = parseLog('[2026-01-01] [10:00:00] [SCRIPT SV] [info] CommandString: lobby command');
    expect(parsed.matches).toEqual([]);
    expect(parsed.unmatchedEvents[0].line).toBe('lobby command');
  });
});
