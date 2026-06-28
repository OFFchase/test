import { useCallback, useEffect, useRef, useState } from 'react'
import { intro, flags, outro } from './slides'
import { NOTIFY } from './config'
import './App.css'

// Build the flat list of slides: intro, every green flag, then the outro.
const SLIDES = [intro, ...flags.map((f, i) => ({ type: 'flag', index: i, ...f })), outro]
const LAST = SLIDES.length - 1

// Teasing lines that cycle as she keeps pressing "мне надо подумать".
const TEASES = [
  'мне надо подумать',
  'точно подумать? 👀',
  'кнопка как будто не работает 😇',
  'давай ещё разок 🥺',
  'ну пожалуйста ☕',
]

export default function App() {
  const [current, setCurrent] = useState(0)
  const [dir, setDir] = useState('next') // controls enter/exit animation direction
  const [hearts, setHearts] = useState([])
  const [saidYes, setSaidYes] = useState(false)
  const [declines, setDeclines] = useState(0)
  const touchStart = useRef(null)
  const locked = useRef(false) // debounce rapid swipes/keys mid-transition
  const notified = useRef(false) // make sure we only ping once

  const go = useCallback((to, direction) => {
    if (to < 0 || to > LAST || locked.current || saidYes) return
    locked.current = true
    setDir(direction)
    setCurrent(to)
    setTimeout(() => { locked.current = false }, 480)
  }, [saidYes])

  const next = useCallback(() => go(current + 1, 'next'), [current, go])
  const prev = useCallback(() => go(current - 1, 'prev'), [current, go])

  // Keyboard nav (handy on desktop while testing, harmless on mobile)
  useEffect(() => {
    const onKey = (e) => {
      if (['ArrowDown', 'ArrowRight', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); next() }
      if (['ArrowUp', 'ArrowLeft'].includes(e.key)) { e.preventDefault(); prev() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev])

  // Touch swipe (vertical-first, like stories; also accepts horizontal)
  const onTouchStart = (e) => { touchStart.current = e.touches[0] }
  const onTouchEnd = (e) => {
    if (!touchStart.current) return
    const t = e.changedTouches[0]
    const dy = t.clientY - touchStart.current.clientY
    const dx = t.clientX - touchStart.current.clientX
    const THRESH = 45
    if (Math.abs(dy) > Math.abs(dx)) {
      if (dy < -THRESH) next()
      else if (dy > THRESH) prev()
    } else {
      if (dx < -THRESH) next()
      else if (dx > THRESH) prev()
    }
    touchStart.current = null
  }

  // Tapping the right 65% advances, left 35% goes back (story-style).
  // Disabled on the final slide so the buttons get the taps.
  const onTap = (e) => {
    if (current === LAST) return
    const x = e.clientX / window.innerWidth
    if (x < 0.35) prev()
    else next()
  }

  // Heart/confetti burst.
  const burstHearts = (count = 18) => {
    const seed = hearts.length
    const batch = Array.from({ length: count }, (_, i) => ({
      id: `${seed}-${i}-${current}`,
      left: ((i * 37) % 100),
      delay: (i % 6) * 0.12,
      dur: 1.6 + ((i * 13) % 14) / 10,
      scale: 0.7 + ((i * 7) % 11) / 10,
      char: ['💚', '💖', '✨', '🌿', '💘'][i % 5],
    }))
    setHearts((h) => [...h, ...batch])
    setTimeout(() => setHearts((h) => h.slice(batch.length)), 3400)
  }

  // Fire the ntfy.sh push exactly once.
  const notify = () => {
    if (notified.current) return
    notified.current = true
    try {
      fetch(`https://ntfy.sh/${NOTIFY.ntfyTopic}`, {
        method: 'POST',
        body: NOTIFY.message,
        headers: { Title: NOTIFY.title, Priority: 'high', Tags: 'green_heart,tada' },
      }).catch(() => {})
    } catch { /* offline / blocked — the on-screen celebration still happens */ }
  }

  const onYes = (e) => {
    e.stopPropagation()
    setSaidYes(true)
    notify()
    burstHearts(40)
    setTimeout(() => burstHearts(30), 600)
  }

  // The playful "no" button: dodges, shrinks, and teases.
  const onDecline = (e) => {
    e.stopPropagation()
    setDeclines((d) => d + 1)
  }

  const slide = SLIDES[current]

  return (
    <div
      className={`stage theme-${slide.theme}`}
      onClick={onTap}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* progress pips */}
      <div className="progress" onClick={(e) => e.stopPropagation()}>
        {SLIDES.map((_, i) => (
          <span key={i} className={`pip ${i === current ? 'on' : ''} ${i < current ? 'done' : ''}`} />
        ))}
      </div>

      <div key={current} className={`slide enter-${dir}`}>
        {slide.type === 'intro' && (
          <div className="card intro">
            <p className="kicker">{slide.kicker}</p>
            <h1 className="bigtitle">{slide.title}</h1>
            <p className="subtitle">{slide.subtitle}</p>
            <p className="hint pulse">{slide.hint}</p>
          </div>
        )}

        {slide.type === 'flag' && (
          <div className="card flag">
            <span className="badge">зелёный флаг #{slide.index + 1}</span>
            {slide.image
              ? <img className="guard-img float" src={slide.image} alt="кот-страж" />
              : <div className="emoji float">{slide.emoji}</div>}
            <h2 className="flagtitle">{slide.flag}</h2>
            <p className="detail">{slide.detail}</p>
          </div>
        )}

        {slide.type === 'outro' && !saidYes && (
          <div className="card outro" onClick={(e) => e.stopPropagation()}>
            <div className="emoji beat">{slide.emoji}</div>
            <h1 className="bigtitle">{slide.title}</h1>
            <p className="subtitle">{slide.subtitle}</p>
            <div className="choices">
              <button
                className="cta"
                style={{ transform: `scale(${1 + declines * 0.12})` }}
                onClick={onYes}
              >
                {slide.cta}
              </button>
              <button
                className="decline"
                style={{
                  transform: `scale(${Math.max(0.45, 1 - declines * 0.16)})`,
                  opacity: Math.max(0.4, 1 - declines * 0.12),
                  marginLeft: `${(declines % 2 ? 1 : -1) * Math.min(declines * 14, 42)}px`,
                }}
                onClick={onDecline}
              >
                {TEASES[Math.min(declines, TEASES.length - 1)]}
              </button>
            </div>
          </div>
        )}

        {slide.type === 'outro' && saidYes && (
          <div className="card outro" onClick={(e) => e.stopPropagation()}>
            <img className="guard-img float" src="/happy-cat.svg" alt="счастливый кот" />
            <p className="subtitle">{slide.thanksSub}</p>
          </div>
        )}
      </div>

      {/* floating hearts layer */}
      <div className="hearts" aria-hidden>
        {hearts.map((h) => (
          <span
            key={h.id}
            className="heart"
            style={{
              left: `${h.left}%`,
              animationDelay: `${h.delay}s`,
              animationDuration: `${h.dur}s`,
              fontSize: `${h.scale * 2}rem`,
            }}
          >
            {h.char}
          </span>
        ))}
      </div>

      {/* bottom nav arrows (hidden on the final slide) */}
      {!saidYes && current !== LAST && (
        <div className="nav" onClick={(e) => e.stopPropagation()}>
          <button className="navbtn" onClick={prev} disabled={current === 0} aria-label="previous">↑</button>
          <span className="counter">{current + 1} / {SLIDES.length}</span>
          <button className="navbtn" onClick={next} aria-label="next">↓</button>
        </div>
      )}
    </div>
  )
}
