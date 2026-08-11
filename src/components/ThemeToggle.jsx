import { Button } from 'react-bootstrap';

function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';
  const nextTheme = isDark ? 'light' : 'dark';

  return (
    <Button
      className="theme-toggle"
      variant="outline-secondary"
      size="sm"
      onClick={onToggle}
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
    >
      <span aria-hidden="true">{isDark ? '☀️' : '🌙'}</span>
      <span>{isDark ? 'Light' : 'Dark'}</span>
    </Button>
  );
}

export default ThemeToggle;
