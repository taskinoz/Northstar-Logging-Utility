import { Form } from 'react-bootstrap';
import { FILTER_OPTIONS } from '../helpers/logFilters';

function FilterControls({ selected, onToggle, disabled = false }) {
  return (
    <section className="filter-panel" aria-labelledby="filter-heading">
      <h2 id="filter-heading" className="h5">Log filters</h2>
      <div className="filter-grid">
        {FILTER_OPTIONS.map(({ id, label }) => (
          <Form.Check
            key={id}
            id={`${id}-check`}
            label={label}
            checked={selected.has(id)}
            disabled={disabled}
            onChange={(event) => onToggle(id, event.target.checked)}
          />
        ))}
      </div>
    </section>
  );
}

export default FilterControls;
