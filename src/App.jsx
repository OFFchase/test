import { useState } from 'react';
import ParticipantTable from './components/ParticipantTable.jsx';
import {
  generateCertificate,
  generateBatchCertificate,
  printPdfBlob,
} from './utils/certificateGenerator.js';
import { config } from './config.js';
import './App.css';

const STORAGE_KEY = 'cert-gen.participants.v1';

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return [
    {
      id: crypto.randomUUID(),
      fio: '',
      breakAfterWord: config.defaultBreakAfterWord,
    },
  ];
}

export default function App() {
  const [participants, setParticipants] = useState(loadInitial);
  const [mode, setMode] = useState('full'); // 'full' | 'nameOnly'
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function persist(next) {
    setParticipants(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  async function handlePrintRow(p) {
    setError('');
    setBusy(true);
    try {
      const blob = await generateCertificate({
        fio: p.fio,
        breakAfterWord: p.breakAfterWord,
        mode,
      });
      printPdfBlob(blob);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handlePrintAll() {
    setError('');
    setBusy(true);
    try {
      const valid = participants.filter((p) => p.fio.trim());
      if (valid.length === 0) {
        setError('Add at least one participant with a name.');
        return;
      }
      const blob = await generateBatchCertificate({
        participants: valid,
        mode,
      });
      printPdfBlob(blob);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  function clearAll() {
    if (!confirm('Remove all participants?')) return;
    persist([
      {
        id: crypto.randomUUID(),
        fio: '',
        breakAfterWord: config.defaultBreakAfterWord,
      },
    ]);
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Генератор сертификатов</h1>
        <p className="subtitle">
          Введите ФИО участников и распечатайте сертификаты.
        </p>
      </header>

      <section className="controls">
        <fieldset className="mode-toggle">
          <legend>Режим печати</legend>
          <label>
            <input
              type="radio"
              name="mode"
              value="full"
              checked={mode === 'full'}
              onChange={() => setMode('full')}
            />
            <span>
              <strong>Полный шаблон</strong>
              <em>PDF целиком + ФИО</em>
            </span>
          </label>
          <label>
            <input
              type="radio"
              name="mode"
              value="nameOnly"
              checked={mode === 'nameOnly'}
              onChange={() => setMode('nameOnly')}
            />
            <span>
              <strong>Только ФИО</strong>
              <em>Для готовых распечатанных шаблонов</em>
            </span>
          </label>
        </fieldset>

        <div className="bulk-actions">
          <button
            className="btn primary"
            onClick={handlePrintAll}
            disabled={busy}
          >
            {busy ? 'Печать…' : 'Печать всех'}
          </button>
          <button className="btn ghost" onClick={clearAll} disabled={busy}>
            Очистить
          </button>
        </div>
      </section>

      {error && <div className="error">{error}</div>}

      <ParticipantTable
        participants={participants}
        onChange={persist}
        onPrintRow={handlePrintRow}
      />

      <footer className="app-footer">
        <p>
          Настройки позиции текста и шрифта — <code>src/config.js</code>.
          Файл шаблона — <code>public/template.pdf</code>.
        </p>
      </footer>
    </div>
  );
}
