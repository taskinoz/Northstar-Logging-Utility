import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';

const sampleLog = [
  '[2026-07-17] [19:42:47] [SCRIPT UI] [info] UICodeCallback_LevelLoadingStarted: mp_colony02',
  '[2026-07-17] [19:43:02] [SCRIPT SV] [info] Player connect started: entity (1: player shadPS4 [1])---UID:1',
  '[2026-07-17] [19:43:17] [SCRIPT SV] [info] Player connect started: entity (2: player The taskinoz [2])---UID:2',
  '[2026-07-17] [19:44:00] [SCRIPT SV] [info] CommandString: ClientStatus was called',
  '[2026-07-17] [19:53:32] [SCRIPT CL] [info] Match Complete',
].join('\n');

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-bs-theme');
  });

  it('toggles and persists the colour theme', () => {
    render(<App />);

    expect(document.documentElement).toHaveAttribute('data-bs-theme', 'light');
    fireEvent.click(screen.getByRole('button', { name: /switch to dark mode/i }));

    expect(document.documentElement).toHaveAttribute('data-bs-theme', 'dark');
    expect(localStorage.getItem('northstar-theme')).toBe('dark');
    expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument();
  });

  it('uploads, filters, and groups a log by match and player', async () => {
    render(<App />);
    const file = new File([sampleLog], 'northstar.txt', { type: 'text/plain' });
    file.text = () => Promise.resolve(sampleLog);

    fireEvent.change(screen.getByLabelText(/select your northstar log/i), { target: { files: [file] } });
    expect(await screen.findByText(/reading log/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/loaded northstar.txt/i)).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText(/^commands$/i));

    expect(await screen.findByText('Match 1: mp_colony02')).toBeInTheDocument();
    expect(screen.getByText('shadPS4')).toBeInTheDocument();
    expect(screen.getByText('The taskinoz')).toBeInTheDocument();
    expect(screen.getByText('ClientStatus was called')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download match/i })).toHaveAttribute('download', 'northstar-mp_colony02-1.txt');
    expect(screen.getByRole('button', { name: /download all/i })).toHaveAttribute('download', 'northstar-parsed-log.txt');
  });
});
