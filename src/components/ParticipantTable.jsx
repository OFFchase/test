import { useMemo } from 'react';
import { config } from '../config.js';
import { splitName, transformCase } from '../utils/certificateGenerator.js';
import { uuid } from '../utils/uuid.js';

function BreakSelector({ fio, value, onChange }) {
  const words = useMemo(
    () => (fio || '').trim().split(/\s+/).filter(Boolean),
    [fio],
  );

  if (words.length < 2) {
    return <span className="muted">—</span>;
  }

  // Normalize stored value: if it points past the last word, treat as no-break.
  const normalized = value > 0 && value < words.length ? value : 0;

  return (
    <select
      className="break-select"
      value={normalized}
      onChange={(e) => onChange(Number(e.target.value))}
    >
      <option value={0}>no break ({words.join(' ')})</option>
      {Array.from({ length: words.length - 1 }, (_, i) => i + 1).map((n) => (
        <option key={n} value={n}>
          after word {n} ({words.slice(0, n).join(' ')} |{' '}
          {words.slice(n).join(' ')})
        </option>
      ))}
    </select>
  );
}

export default function ParticipantTable({
  participants,
  caseStyle,
  onChange,
  onPrintRow,
}) {
  function updateRow(id, patch) {
    onChange(participants.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function removeRow(id) {
    onChange(participants.filter((p) => p.id !== id));
  }

  function addRow() {
    onChange([
      ...participants,
      {
        id: uuid(),
        fio: '',
        breakAfterWord: config.defaultBreakAfterWord,
      },
    ]);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addRow();
    }
  }

  return (
    <div className="table-wrap">
      <table className="excel-table">
        <thead>
          <tr>
            <th className="col-num">#</th>
            <th className="col-fio">ФИО</th>
            <th className="col-preview">Preview</th>
            <th className="col-break">Line break</th>
            <th className="col-actions"></th>
          </tr>
        </thead>
        <tbody>
          {participants.map((p, idx) => {
            const lines = splitName(p.fio, p.breakAfterWord);
            return (
              <tr key={p.id}>
                <td className="col-num">{idx + 1}</td>
                <td className="col-fio">
                  <input
                    type="text"
                    value={p.fio}
                    placeholder="ФИО"
                    onChange={(e) => updateRow(p.id, { fio: e.target.value })}
                    onKeyDown={handleKeyDown}
                    autoFocus={idx === participants.length - 1 && !p.fio}
                  />
                </td>
                <td className="col-preview">
                  {p.fio.trim() ? (
                    <div className="preview-block">
                      {lines.map((l, i) => (
                        <div key={i}>{transformCase(l, caseStyle)}</div>
                      ))}
                    </div>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td className="col-break">
                  <BreakSelector
                    fio={p.fio}
                    value={p.breakAfterWord}
                    onChange={(n) => updateRow(p.id, { breakAfterWord: n })}
                  />
                </td>
                <td className="col-actions">
                  <button
                    className="btn small"
                    disabled={!p.fio.trim()}
                    onClick={() => onPrintRow(p)}
                    title="Print this certificate"
                  >
                    Print
                  </button>
                  <button
                    className="btn small ghost"
                    onClick={() => removeRow(p.id)}
                    title="Remove row"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <button className="btn add-row" onClick={addRow}>
        + Add participant
      </button>
    </div>
  );
}
