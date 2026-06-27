import { useCallback, useEffect, useRef, useState } from 'react'
import { intro, flags, outro } from './slides'
import './App.css'

// Build the flat list of slides: intro, every green flag, then the outro.
const SLIDES = [intro, ...flags.map((f, i) => ({ type: 'flag', index: i, ...f })), outro]
const LAST = SLIDES.length - 1

export default function App() {
  const [current, setCurrent] = useState(0)
  const [dir, setDir] = useState('next') // controls enter/exit animation direction
  const [hearts, setHearts] = useState([])
  const touchStart = useRef(null)
  const locked = useRef(false) // debounce rapid swipes/keys mid-transition

  const go = useCallback((to, direction) => {
    if (to < 0 || to > LAST || locked.current) return
    locked.current = true
    setDir(direction)
    setCurrent(to)
    setTimeout(() => { locked.current = false }, 480)
  }, [])

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

  // Tapping the right 65% advances, left 35% goes back (story-style)
  const onTap = (e) => {
    const x = e.clientX / window.innerWidth
    if (x < 0.35) prev()
    else next()
  }

  // Confetti hearts when the final CTA is pressed
  const burstHearts = (e) => {
    e.stopPropagation()
    const batch = Array.from({ length: 18 }, (_, i) => ({
      id: Date.now() + i,
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      dur: 1.6 + Math.random() * 1.4,
      scale: 0.7 + Math.random() * 1.1,
      char: ['💚', '💖', '✨', '🌿', '💘'][i % 5],
    }))
    setHearts((h) => [...h, ...batch])
    setTimeout(() => setHearts((h) => h.slice(batch.length)), 3200)
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
            <span className="badge">green flag #{slide.index + 1}</span>
            <div className="emoji float">{slide.emoji}</div>
            <h2 className="flagtitle">{slide.flag}</h2>
            <p className="detail">{slide.detail}</p>
          </div>
        )}

        {slide.type === 'outro' && (
          <div className="card outro">
            <div className="emoji beat">{slide.emoji}</div>
            <h1 className="bigtitle">{slide.title}</h1>
            <p className="subtitle">{slide.subtitle}</p>
            <button className="cta" onClick={burstHearts}>{slide.cta}</button>
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

      {/* footer nav arrows for the un-swipey */}
      <div className="nav" onClick={(e) => e.stopPropagation()}>
        <button className="navbtn" onClick={prev} disabled={current === 0} aria-label="previous">↑</button>
        <span className="counter">{current + 1} / {SLIDES.length}</span>
        <button className="navbtn" onClick={next} disabled={current === LAST} aria-label="next">↓</button>
      </div>
    </div>
  )
}
