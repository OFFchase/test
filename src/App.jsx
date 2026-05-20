import { useState } from 'react';
import ParticipantTable from './components/ParticipantTable.jsx';
import {
  generateCertificate,
  generateBatchCertificate,
  printPdfBlob,
} from './utils/certificateGenerator.js';
import { config } from './config.js';
import { uuid } from './utils/uuid.js';
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
      id: uuid(),
      fio: '',
      breakAfterWord: config.defaultBreakAfterWord,
    },
  ];
}

export default function App() {
  const [participants, setParticipants] = useState(loadInitial);
  const [mode, setMode] = useState('full'); // 'full' | 'nameOnly'
  const [color, setColor] = useState(config.text.defaultColorByMode.full); // 'white' | 'dark'
  const [caseStyle, setCaseStyle] = useState(config.text.defaultCase); // 'upper' | 'capitalize'
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

  function changeMode(nextMode) {
    setMode(nextMode);
    // Reset color to the mode-appropriate default. User can still override after.
    setColor(config.text.defaultColorByMode[nextMode]);
  }

  async function handlePrintRow(p) {
    setError('');
    setBusy(true);
    try {
      const blob = await generateCertificate({
        fio: p.fio,
        breakAfterWord: p.breakAfterWord,
        mode,
        color,
        caseStyle,
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
        color,
        caseStyle,
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
        id: uuid(),
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
        <fieldset className="opt-group mode-toggle">
          <legend>Режим печати</legend>
          <label>
            <input
              type="radio"
              name="mode"
              value="full"
              checked={mode === 'full'}
              onChange={() => changeMode('full')}
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
              onChange={() => changeMode('nameOnly')}
            />
            <span>
              <strong>Только ФИО</strong>
              <em>Только имя, без шаблона (для готовых распечаток)</em>
            </span>
          </label>
        </fieldset>

        <fieldset className="opt-group">
          <legend>Цвет текста</legend>
          <div className="seg">
            <button
              type="button"
              className={`seg-btn ${color === 'white' ? 'active' : ''}`}
              onClick={() => setColor('white')}
            >
              <span className="swatch swatch-white" /> Белый
            </button>
            <button
              type="button"
              className={`seg-btn ${color === 'dark' ? 'active' : ''}`}
              onClick={() => setColor('dark')}
            >
              <span className="swatch swatch-dark" /> Тёмный
            </button>
          </div>
        </fieldset>

        <fieldset className="opt-group">
          <legend>Регистр</legend>
          <div className="seg">
            <button
              type="button"
              className={`seg-btn ${caseStyle === 'upper' ? 'active' : ''}`}
              onClick={() => setCaseStyle('upper')}
              title="ВИСИТОВ ИЗРАИЛ"
            >
              ВСЕ ЗАГЛАВНЫЕ
            </button>
            <button
              type="button"
              className={`seg-btn ${caseStyle === 'capitalize' ? 'active' : ''}`}
              onClick={() => setCaseStyle('capitalize')}
              title="Виситов Израил"
            >
              С Заглавной
            </button>
          </div>
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
        caseStyle={caseStyle}
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
