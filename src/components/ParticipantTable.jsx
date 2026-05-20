import { useMemo } from 'react';
import { config } from '../config.js';
import { splitName } from '../utils/certificateGenerator.js';

function BreakSelector({ fio, value, onChange }) {
  const words = useMemo(
    () => (fio || '').trim().split(/\s+/).filter(Boolean),
    [fio],
  );

  if (words.length < 2) {
    return <span className="muted">—</span>;
  }

  const options = [];
  for (let i = 1; i < words.length; i++) options.push(i);

  return (
    <select
      className="break-select"
      value={Math.min(value, words.length - 1)}
      onChange={(e) => onChange(Number(e.target.value))}
    >
      {options.map((n) => (
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
        id: crypto.randomUUID(),
        fio: '',
        breakAfterWord: config.defaultBreakAfterWord,
      },
    ]);
  }

  function handleKeyDown(e, id) {
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
                    placeholder="Виситов Израил Алмирзаевич"
                    onChange={(e) => updateRow(p.id, { fio: e.target.value })}
                    onKeyDown={(e) => handleKeyDown(e, p.id)}
                    autoFocus={idx === participants.length - 1 && !p.fio}
                  />
                </td>
                <td className="col-preview">
                  {p.fio.trim() ? (
                    <div className="preview-block">
                      {lines.map((l, i) => (
                        <div key={i}>
                          {config.text.uppercase ? l.toUpperCase() : l}
                        </div>
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
