'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const TOPPERS = [
  {
    name: 'Aarav Shah',
    photo: 'D:\\2026\\web\\SR_Classes\\src\\app\\school-boy-with-books-illustration-ai-generative-free-photo.jpg',
    score: '98.4%',
    exam: 'CBSE Class 12',
    batch: '2025–26',
    subject: 'Science Stream',
    quote: 'SR Classes gave me the structure and confidence I needed to crack boards.',
  },
  {
    name: 'Diya Patel',
    photo: '/toppers/diya.jpg',
    score: '99/100',
    exam: 'GSEB Class 10',
    batch: '2025–26',
    subject: 'All Subjects',
    quote: 'The weekly tests kept me on track throughout the entire year.',
  },
  {
    name: 'Rohan Mehta',
    photo: '/toppers/rohan.jpg',
    score: 'AIR 412',
    exam: 'IIT-JEE Advanced',
    batch: '2025–26',
    subject: 'Physics · Chem · Maths',
    quote: 'Best faculty I have ever studied under. Truly transformative experience.',
  },
  {
    name: 'Priya Desai',
    photo: '/toppers/priya.jpg',
    score: '680/720',
    exam: 'NEET UG',
    batch: '2025–26',
    subject: 'Biology · Chemistry',
    quote: 'Mock tests here are harder than the real exam — that is the secret.',
  },
  {
    name: 'Arjun Joshi',
    photo: '/toppers/arjun.jpg',
    score: '97.2%',
    exam: 'ICSE Class 10',
    batch: '2025–26',
    subject: 'Mathematics',
    quote: 'Sir explained every concept so clearly. I never had to memorise blindly.',
  },
]

const BRAND = {
  phone: '+91 98765 43210',
  email: 'info@srclasses.com',
  address: 'Ahmedabad, Gujarat',
  ticker: [
    'Admissions Open for 2026–27',
    '95% Students Scored Above 90% in Board Exams',
    'New Batch Starting May 2026',
    'Special Coaching for IIT-JEE & NEET',
    'Free Demo Class Available — Enroll Today',
  ],
  stats: [
    { value: 500, suffix: '+', label: 'Students Enrolled' },
    { value: 12, suffix: '+', label: 'Years Experience' },
    { value: 95, suffix: '%', label: 'Success Rate' },
    { value: 20, suffix: '+', label: 'Expert Faculty' },
  ],
  boards: [
    { name: 'CBSE', sub: 'Class 6–12' },
    { name: 'ICSE', sub: 'Class 6–12' },
    { name: 'GSEB', sub: 'Gujarat Board' },
    { name: 'IIT-JEE', sub: 'Mains & Advanced' },
    { name: 'NEET', sub: 'Medical Entrance' },
    { name: 'SAT', sub: 'International' },
  ],
  whyUs: [
    { icon: '🎯', num: '01', title: 'Result Oriented Teaching', desc: 'Focused curriculum engineered for maximum marks and deep conceptual clarity in every subject.' },
    { icon: '👨‍🏫', num: '02', title: 'Expert Faculty', desc: 'Experienced teachers with proven track records across board exams and competitive entrances.' },
    { icon: '📊', num: '03', title: 'Regular Assessments', desc: 'Weekly and monthly tests to track progress, identify gaps, and keep students exam-ready.' },
    { icon: '👨‍👩‍👧', num: '04', title: 'Parent Partnership', desc: 'Transparent communication with parents through regular updates and a dedicated parent portal.' },
    { icon: '📱', num: '05', title: 'Digital Access', desc: 'Study materials and attendance records accessible 24/7 via our secure online platform.' },
    { icon: '🏆', num: '06', title: 'Proven Track Record', desc: '500+ students placed in top colleges and universities across India over 12+ years.' },
  ],
  testimonials: [
    { name: 'Priya Sharma', initials: 'PS', batch: 'Class 12 Science · Parent', text: "SR Classes transformed my daughter's performance. She scored 94% in boards — something we didn't think was possible a year ago.", avatarBg: '#1E6FBF' },
    { name: 'Rahul Patel', initials: 'RP', batch: 'IIT-JEE Batch · Parent', text: 'Best faculty in Ahmedabad. My son cleared JEE with their guidance. The structured approach and mock tests made all the difference.', avatarBg: '#0F4C7A' },
    { name: 'Meena Shah', initials: 'MS', batch: 'Class 10 CBSE · Parent', text: 'Very disciplined environment and excellent study material. My daughter feels confident and motivated — something she lacked before joining.', avatarBg: '#145A8A' },
  ],
}

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        let s = 0
        const step = value / (1400 / 16)
        const timer = setInterval(() => {
          s += step
          if (s >= value) { setCount(value); clearInterval(timer) }
          else setCount(Math.floor(s))
        }, 16)
      }
    }, { threshold: 0.6 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [value])
  return <div ref={ref}>{count}{suffix}</div>
}

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none' }}>
      <div style={{
        background: dark ? 'rgba(255,255,255,0.15)' : '#0B2545',
        borderRadius: 8,
        padding: '7px 10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 15,
          fontWeight: 700,
          color: '#fff',
          lineHeight: 1,
          letterSpacing: '-0.5px',
        }}>SR</span>
        <div style={{ width: 18, height: 1.5, background: '#4AA8FF', borderRadius: 2, marginTop: 3 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 19,
          fontWeight: 700,
          color: dark ? '#fff' : '#0B2545',
          letterSpacing: '-0.5px',
          lineHeight: 1.1,
        }}>SR Classes</span>
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 9.5,
          fontWeight: 500,
          color: '#4AA8FF',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
        }}>Excellence in Education</span>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'Owner' | 'Faculty' | 'Parent' | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // Topper carousel state
  const [topperIdx, setTopperIdx] = useState(0)
  const [topperKey, setTopperKey] = useState(0)
  const topperTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({})

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)

  const goToTopper = useCallback((idx: number) => {
    setTopperIdx(idx)
    setTopperKey(k => k + 1)
  }, [])

  const nextTopper = useCallback(() => {
    setTopperIdx(prev => {
      const next = (prev + 1) % TOPPERS.length
      setTopperKey(k => k + 1)
      return next
    })
  }, [])

  // Auto-shuffle toppers
  useEffect(() => {
    topperTimerRef.current = setInterval(nextTopper, 4000)
    return () => { if (topperTimerRef.current) clearInterval(topperTimerRef.current) }
  }, [nextTopper])

  // Scroll events
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20)
      const ids = ['home', 'boards', 'why', 'testimonials', 'cta']
      let current = 'home'
      ids.forEach(id => {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= 90) current = id
      })
      setActiveSection(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Canvas particles
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)
    const particles = Array.from({ length: 48 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.4,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      alpha: Math.random() * 0.35 + 0.08,
    }))
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(74,168,255,${p.alpha})`
        ctx.fill()
      })
      particles.forEach((p, i) => {
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j]
          const d = Math.hypot(p.x - q.x, p.y - q.y)
          if (d < 110) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(q.x, q.y)
            ctx.strokeStyle = `rgba(74,168,255,${0.07 * (1 - d / 110)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      })
      animFrameRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMobileMenuOpen(false)
  }

  const handleLogin = async () => {
    if (!selectedRole) { setLoginError('Please select your role first.'); return }
    if (!email || !password) { setLoginError('Please enter your email and password.'); return }
    setLoginLoading(true)
    setLoginError('')
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setLoginError(error.message); setLoginLoading(false); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
      const dbRole = profile?.role
      const uiRole = selectedRole === 'Faculty' ? 'assistant' : selectedRole.toLowerCase()
      if (dbRole !== uiRole) {
        await supabase.auth.signOut()
        setLoginError('Role does not match. Please select the correct role.')
        setLoginLoading(false)
        return
      }
      if (dbRole === 'owner') router.push('/owner/dashboard')
      else if (dbRole === 'assistant') router.push('/faculty/dashboard')
      else if (dbRole === 'parent') router.push('/parent/dashboard')
    } catch {
      setLoginError('Something went wrong. Please try again.')
      setLoginLoading(false)
    }
  }

  const topper = TOPPERS[topperIdx]
  const initials = topper.name.split(' ').map(w => w[0]).join('')
  const showFallback = imgErrors[topperIdx]

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'boards', label: 'Boards' },
    { id: 'why', label: 'Why Us' },
    { id: 'testimonials', label: 'Testimonials' },
    { id: 'cta', label: 'Contact' },
  ]

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#0B1829', background: '#fff' }}>

      {/* ─── GLOBAL STYLES ─── */}
      <style precedence="default" href="landing-page-styles">{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        @keyframes marquee   { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes livepulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.5; transform:scale(1.6); } }
        @keyframes fadeUp    { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes modalIn   { from { opacity:0; transform:scale(.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes tcSlide   { from { opacity:0; transform:translateX(22px); } to { opacity:1; transform:translateX(0); } }
        @keyframes tcBar     { from { width:0%; } to { width:100%; } }

        .f1 { animation: fadeUp .6s .10s ease both; }
        .f2 { animation: fadeUp .6s .22s ease both; }
        .f3 { animation: fadeUp .6s .34s ease both; }
        .f4 { animation: fadeUp .6s .46s ease both; }
        .f5 { animation: fadeUp .6s .58s ease both; }

        /* ticker */
        .ticker-track { display:flex; width:max-content; animation:marquee 35s linear infinite; }
        .ticker-track:hover { animation-play-state:paused; }

        /* nav active indicator */
        .nav-active { color:#0B2545 !important; }
        .nav-active::after { content:''; position:absolute; bottom:4px; left:50%; transform:translateX(-50%); width:16px; height:2px; background:#4AA8FF; border-radius:2px; }

        /* stat hover */
        .stat-cell { transition:background .25s; cursor:default; position:relative; overflow:hidden; }
        .stat-cell::after { content:''; position:absolute; bottom:0; left:50%; transform:translateX(-50%) scaleX(0); width:36px; height:2px; background:#4AA8FF; border-radius:2px; transition:transform .3s; }
        .stat-cell:hover { background:#EEF5FF; }
        .stat-cell:hover::after { transform:translateX(-50%) scaleX(1); }

        /* cards */
        .board-card { transition:transform .25s, box-shadow .25s, border-color .25s; cursor:default; }
        .board-card:hover { transform:translateY(-4px); box-shadow:0 12px 32px rgba(11,37,69,.10); border-color:rgba(74,168,255,.35) !important; }
        .why-card { transition:transform .3s, box-shadow .3s, border-color .3s; cursor:default; }
        .why-card:hover { transform:translateY(-5px); box-shadow:0 16px 40px rgba(11,37,69,.08); border-color:rgba(74,168,255,.25) !important; }
        .why-card:hover .why-icon { transform:scale(1.1); }
        .why-icon { transition:transform .3s; }
        .testi-card { transition:transform .3s, background .3s; cursor:default; }
        .testi-card:hover { transform:translateY(-4px); background:rgba(255,255,255,.09) !important; }

        /* topper carousel */
        .tc-card { animation: tcSlide .45s cubic-bezier(.22,1,.36,1) both; }
        .tc-bar  { animation: tcBar 4s linear forwards; }
        .tc-dot  { border:none; cursor:pointer; border-radius:9999px; padding:0; transition:width .25s, background .25s; }

        /* class row */
        .class-row { transition:background .2s; }
        .class-row:hover { background:rgba(255,255,255,.05); }

        /* buttons */
        .btn-solid  { transition:background .2s, transform .2s, box-shadow .2s; }
        .btn-solid:hover  { background:#6BB8FF !important; transform:translateY(-2px); box-shadow:0 8px 24px rgba(74,168,255,.3); }
        .btn-ghost  { transition:background .2s; }
        .btn-ghost:hover  { background:rgba(255,255,255,.15) !important; }
        .btn-navy   { transition:background .2s, transform .2s, box-shadow .2s; }
        .btn-navy:hover   { background:#06172E !important; transform:translateY(-2px); box-shadow:0 8px 24px rgba(11,37,69,.25); }
        .btn-outline-light { transition:background .2s, color .2s; }
        .btn-outline-light:hover { background:#0B2545 !important; color:#fff !important; border-color:#0B2545 !important; }
        .login-nav  { transition:background .2s, transform .2s; }
        .login-nav:hover  { background:#06172E !important; transform:translateY(-1px); }
        .submit-btn { transition:background .2s; }
        .submit-btn:hover:not(:disabled) { background:#06172E !important; }

        /* role tile */
        .role-tile { transition:border-color .2s, background .2s; cursor:pointer; }
        .role-tile:hover { border-color:#1A3A5C !important; background:#EEF5FF !important; }
        .role-tile.sel { border-color:#0B2545 !important; background:#EEF5FF !important; }

        /* field */
        .field-inp:focus { border-color:#0B2545 !important; outline:none; }

        /* mobile drawer animation */
        @keyframes slideIn { from { transform:translateX(100%); } to { transform:translateX(0); } }
        .mob-drawer { animation:slideIn .25s ease; }

        /* responsive grid helpers */
        .hero-grid    { display:grid; grid-template-columns:1fr 1fr; gap:56px; align-items:center; }
        .stats-grid   { display:grid; grid-template-columns:repeat(4,1fr); }
        .boards-grid  { display:grid; grid-template-columns:repeat(6,1fr); gap:14px; }
        .why-grid     { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
        .testi-grid   { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
        .contact-flex { display:flex; justify-content:center; gap:48px; flex-wrap:wrap; }
        .cta-btns     { display:flex; justify-content:center; gap:16px; flex-wrap:wrap; }
        .hero-cta     { display:flex; gap:14px; flex-wrap:wrap; }

        @media (max-width:960px) {
          .hero-grid   { grid-template-columns:1fr !important; }
          .stats-grid  { grid-template-columns:repeat(2,1fr) !important; }
          .boards-grid { grid-template-columns:repeat(3,1fr) !important; }
          .why-grid    { grid-template-columns:repeat(2,1fr) !important; }
          .testi-grid  { grid-template-columns:1fr !important; }
          .desk-nav    { display:none !important; }
          .ham-btn     { display:flex !important; }
          .hero-h1     { font-size:38px !important; }
          .sec-title   { font-size:30px !important; }
          .cta-title   { font-size:30px !important; }
        }
        @media (max-width:600px) {
          .hero-h1     { font-size:28px !important; }
          .boards-grid { grid-template-columns:repeat(2,1fr) !important; }
          .why-grid    { grid-template-columns:1fr !important; }
          .stats-grid  { grid-template-columns:repeat(2,1fr) !important; }
          .hero-cta    { flex-direction:column !important; }
          .hero-cta button, .hero-cta a button { width:100% !important; }
          .cta-btns    { flex-direction:column !important; align-items:stretch !important; }
          .sec-inner   { padding-left:16px !important; padding-right:16px !important; }
          .cta-title   { font-size:26px !important; }
          .sec-title   { font-size:26px !important; }
        }
      `}</style>

      {/* ─── NAVBAR ─── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 200,
        background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        boxShadow: scrolled ? '0 1px 0 rgba(11,37,69,0.08)' : 'none',
        transition: 'background .3s, box-shadow .3s',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo />
          {/* Desktop links */}
          <div className="desk-nav" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {navLinks.map(l => (
              <button key={l.id} onClick={() => scrollTo(l.id)}
                className={activeSection === l.id ? 'nav-active' : ''}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 500, color: activeSection === l.id ? '#0B2545' : '#4A6080', padding: '8px 14px', borderRadius: 8, position: 'relative', transition: 'color .2s' }}>
                {l.label}
              </button>
            ))}
            <button className="login-nav"
              onClick={() => setLoginOpen(true)}
              style={{ background: '#0B2545', color: '#fff', border: 'none', padding: '9px 22px', borderRadius: 8, fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 600, cursor: 'pointer', marginLeft: 8 }}>
              Login
            </button>
          </div>
          {/* Hamburger */}
          <button className="ham-btn"
            onClick={() => setMobileMenuOpen(true)}
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 8, flexDirection: 'column', gap: 5, alignItems: 'center' }}>
            {[0, 1, 2].map(i => <div key={i} style={{ width: 22, height: 2, background: '#0B2545', borderRadius: 2 }} />)}
          </button>
        </div>
      </nav>

      {/* ─── TICKER ─── */}
      <div style={{ background: '#0B2545', overflow: 'hidden', padding: '9px 0' }}>
        <div className="ticker-track">
          {[...BRAND.ticker, ...BRAND.ticker].map((t, i) => (
            <span key={i} style={{ whiteSpace: 'nowrap', padding: '0 40px', color: 'rgba(255,255,255,0.75)', fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>
              <span style={{ color: '#4AA8FF', marginRight: 8 }}>●</span>{t}
            </span>
          ))}
        </div>
      </div>

      {/* ─── HERO ─── */}
      <section id="home" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(160deg,#0B2545 0%,#1A3A5C 55%,#0F2A3D 100%)', padding: '80px 24px 100px', minHeight: 620, display: 'flex', alignItems: 'center' }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />
        {/* ambient blobs */}
        <div style={{ position: 'absolute', width: 500, height: 500, background: 'rgba(74,168,255,0.07)', borderRadius: '50%', filter: 'blur(80px)', top: -100, right: -100, pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'absolute', width: 300, height: 300, background: 'rgba(30,111,191,0.09)', borderRadius: '50%', filter: 'blur(60px)', bottom: 0, left: -80, pointerEvents: 'none', zIndex: 0 }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>
          <div className="hero-grid">

            {/* LEFT */}
            <div>
              <div className="f1" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(74,168,255,0.15)', border: '1px solid rgba(74,168,255,0.3)', color: '#4AA8FF', padding: '6px 16px', borderRadius: 100, fontSize: 13, fontWeight: 500, marginBottom: 24 }}>
                <span style={{ width: 7, height: 7, background: '#4ADE80', borderRadius: '50%', display: 'inline-block', animation: 'livepulse 1.5s infinite', flexShrink: 0 }} />
                Ahmedabad&apos;s #1 Tuition Centre
              </div>

              <h1 className="f2 hero-h1" style={{ fontFamily: "'Fraunces', serif", fontSize: 50, fontWeight: 700, color: '#fff', lineHeight: 1.12, marginBottom: 20, letterSpacing: '-1px' }}>
                Unlock Your Child&apos;s True{' '}
                <em style={{ color: '#4AA8FF', fontStyle: 'italic' }}>Potential</em>
              </h1>

              <p className="f3" style={{ fontSize: 17, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, marginBottom: 36, fontWeight: 300 }}>
                Expert coaching for Classes 6–12, IIT-JEE &amp; NEET. Personalised attention, proven results, and a nurturing environment for every student.
              </p>

              <div className="f4 hero-cta">
                <button className="btn-solid"
                  onClick={() => scrollTo('cta')}
                  style={{ background: '#4AA8FF', color: '#0B2545', border: 'none', padding: '14px 28px', borderRadius: 10, fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                  Enroll Now →
                </button>
                <button className="btn-ghost"
                  onClick={() => scrollTo('why')}
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '14px 28px', borderRadius: 10, fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
                  See How We Teach
                </button>
              </div>
            </div>

            {/* RIGHT — Topper Carousel */}
            <div className="f5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 28, backdropFilter: 'blur(10px)', position: 'relative', overflow: 'hidden' }}>
              {/* header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: 15, color: 'rgba(255,255,255,0.85)' }}>Our Toppers</span>
                <span style={{ fontSize: 11, color: '#4AA8FF', fontFamily: "'DM Sans',sans-serif", fontWeight: 500, letterSpacing: '0.06em', background: 'rgba(74,168,255,0.12)', padding: '3px 10px', borderRadius: 100 }}>
                  2025–26 Batch
                </span>
              </div>

              {/* card — key forces remount & re-animation on change */}
              <div className="tc-card" key={topperKey}>
                {/* photo + name row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
                  {!showFallback && topper.photo ? (
                    <img
                      src={topper.photo}
                      alt={topper.name}
                      onError={() => setImgErrors(prev => ({ ...prev, [topperIdx]: true }))}
                      style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(74,168,255,0.5)', flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{ width: 72, height: 72, borderRadius: '50%', border: '2px solid rgba(74,168,255,0.5)', background: 'rgba(74,168,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Fraunces',serif", fontSize: 24, fontWeight: 700, color: '#4AA8FF', flexShrink: 0 }}>
                      {initials}
                    </div>
                  )}
                  <div>
                    <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1.15 }}>{topper.name}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 3, fontFamily: "'DM Sans',sans-serif" }}>{topper.subject}</div>
                  </div>
                </div>

                {/* score + exam */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 18 }}>
                  <div style={{ background: 'rgba(74,168,255,0.15)', border: '1px solid rgba(74,168,255,0.3)', borderRadius: 8, padding: '6px 16px' }}>
                    <span style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, color: '#4AA8FF', lineHeight: 1 }}>{topper.score}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{topper.exam}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Batch {topper.batch}</div>
                  </div>
                </div>

                {/* quote */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.65, fontStyle: 'italic', fontFamily: "'Fraunces', serif", fontWeight: 400 }}>
                    &ldquo;{topper.quote}&rdquo;
                  </p>
                </div>
              </div>

              {/* dot nav */}
              <div style={{ display: 'flex', gap: 6, marginTop: 20, justifyContent: 'center' }}>
                {TOPPERS.map((_, i) => (
                  <button key={i} className="tc-dot"
                    onClick={() => { goToTopper(i); if (topperTimerRef.current) { clearInterval(topperTimerRef.current); topperTimerRef.current = setInterval(nextTopper, 4000) } }}
                    style={{ width: i === topperIdx ? 20 : 6, height: 6, background: i === topperIdx ? '#4AA8FF' : 'rgba(255,255,255,0.2)' }} />
                ))}
              </div>

              {/* progress bar */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.05)' }}>
                <div className="tc-bar" key={topperKey} style={{ height: '100%', background: '#4AA8FF', borderRadius: 2 }} />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── STATS STRIP ─── */}
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(11,37,69,0.06)' }}>
        <div className="stats-grid" style={{ maxWidth: 1200, margin: '0 auto' }}>
          {BRAND.stats.map((s, i) => (
            <div key={i} className="stat-cell" style={{ padding: '32px 20px', textAlign: 'center', borderRight: i < 3 ? '1px solid rgba(11,37,69,0.06)' : 'none' }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 36, fontWeight: 700, color: '#0B2545', lineHeight: 1 }}>
                <Counter value={s.value} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: 13, color: '#8BA3BE', marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── BOARDS ─── */}
      <section id="boards" style={{ padding: '80px 24px', background: '#EEF5FF' }}>
        <div className="sec-inner" style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4AA8FF', marginBottom: 12 }}>Curriculum</div>
            <h2 className="sec-title" style={{ fontFamily: "'Fraunces', serif", fontSize: 38, fontWeight: 700, color: '#0B1829', marginBottom: 14 }}>Boards &amp; Exams We Cover</h2>
            <p style={{ fontSize: 16, color: '#4A6080', maxWidth: 520, margin: '0 auto' }}>Comprehensive coaching for every major board and competitive examination</p>
          </div>
          <div className="boards-grid">
            {BRAND.boards.map((b, i) => (
              <div key={i} className="board-card" style={{ background: '#fff', border: '1px solid rgba(11,37,69,0.08)', borderRadius: 12, padding: '24px 16px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: '#0B2545', marginBottom: 4 }}>{b.name}</div>
                <div style={{ fontSize: 11, color: '#8BA3BE' }}>{b.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHY US ─── */}
      <section id="why" style={{ padding: '80px 24px', background: '#fff' }}>
        <div className="sec-inner" style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ marginBottom: 52 }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4AA8FF', marginBottom: 12 }}>Our Approach</div>
            <h2 className="sec-title" style={{ fontFamily: "'Fraunces', serif", fontSize: 38, fontWeight: 700, color: '#0B1829', marginBottom: 14 }}>Why SR Classes?</h2>
            <p style={{ fontSize: 16, color: '#4A6080', maxWidth: 520 }}>Everything your child needs to succeed, under one roof — designed around results.</p>
          </div>
          <div className="why-grid">
            {BRAND.whyUs.map((w, i) => (
              <div key={i} className="why-card" style={{ background: '#fff', border: '1px solid rgba(11,37,69,0.07)', borderRadius: 14, padding: 28, position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 40, fontWeight: 700, color: 'rgba(11,37,69,0.04)', position: 'absolute', top: 16, right: 18, lineHeight: 1, userSelect: 'none' }}>{w.num}</div>
                <div className="why-icon" style={{ width: 44, height: 44, background: '#EEF5FF', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 18 }}>{w.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#0B1829', marginBottom: 8 }}>{w.title}</div>
                <div style={{ fontSize: 14, color: '#4A6080', lineHeight: 1.65 }}>{w.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section id="testimonials" style={{ padding: '80px 24px', background: '#0B2545' }}>
        <div className="sec-inner" style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(74,168,255,0.9)', marginBottom: 12 }}>Testimonials</div>
            <h2 className="sec-title" style={{ fontFamily: "'Fraunces', serif", fontSize: 38, fontWeight: 700, color: '#fff', marginBottom: 14 }}>What Parents Say</h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', maxWidth: 480, margin: '0 auto' }}>Real results from real families across Ahmedabad</p>
          </div>
          <div className="testi-grid">
            {BRAND.testimonials.map((t, i) => (
              <div key={i} className="testi-card" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 28 }}>
                <div style={{ color: '#F4A623', fontSize: 14, marginBottom: 16, letterSpacing: 2 }}>★★★★★</div>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: 20, fontStyle: 'italic' }}>&ldquo;{t.text}&rdquo;</p>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: t.avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: '#fff', flexShrink: 0 }}>{t.initials}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{t.batch}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section id="cta" style={{ padding: '90px 24px', background: '#EEF5FF', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 400, height: 400, background: 'rgba(74,168,255,0.1)', borderRadius: '50%', filter: 'blur(60px)', top: -60, right: -80, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 300, height: 300, background: 'rgba(11,37,69,0.04)', borderRadius: '50%', filter: 'blur(50px)', bottom: -40, left: -60, pointerEvents: 'none' }} />
        <div className="sec-inner" style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4AA8FF', marginBottom: 12 }}>Get Started</div>
          <h2 className="cta-title" style={{ fontFamily: "'Fraunces', serif", fontSize: 42, fontWeight: 700, color: '#0B1829', marginBottom: 16 }}>Ready to Begin?</h2>
          <p style={{ fontSize: 17, color: '#4A6080', lineHeight: 1.7, marginBottom: 40 }}>
            Join 500+ students already achieving their academic goals. Book a free demo class today — no commitment needed.
          </p>
          <div className="cta-btns">
            <button className="btn-navy"
              onClick={() => setLoginOpen(true)}
              style={{ background: '#0B2545', color: '#fff', border: 'none', padding: '15px 32px', borderRadius: 10, fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              Login to Portal
            </button>
            <a href={`tel:${BRAND.phone}`} style={{ textDecoration: 'none' }}>
              <button className="btn-outline-light"
                style={{ background: 'transparent', color: '#0B2545', border: '1.5px solid rgba(11,37,69,0.2)', padding: '14px 32px', borderRadius: 10, fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 500, cursor: 'pointer', width: '100%' }}>
                📞 {BRAND.phone}
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* ─── CONTACT BAR ─── */}
      <div style={{ background: '#0B2545', padding: '32px 24px' }}>
        <div className="contact-flex" style={{ maxWidth: 1200, margin: '0 auto' }}>
          {[
            { icon: '📍', text: BRAND.address },
            { icon: '📞', text: BRAND.phone },
            { icon: '✉️', text: BRAND.email },
          ].map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
              <div style={{ width: 34, height: 34, background: 'rgba(74,168,255,0.12)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{c.icon}</div>
              <span>{c.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <footer style={{ background: '#060E1A', padding: '28px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <Logo dark />
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', marginTop: 8 }}>
          © {new Date().getFullYear()} SR Classes, Ahmedabad. All rights reserved.
        </div>
      </footer>

      {/* ─── MOBILE DRAWER ─── */}
      {mobileMenuOpen && (
        <>
          <div onClick={() => setMobileMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(6,14,26,0.45)', zIndex: 998, backdropFilter: 'blur(2px)' }} />
          <div className="mob-drawer" style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 280, background: '#fff', zIndex: 999, padding: 24, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <Logo />
              <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#4A6080', lineHeight: 1 }}>✕</button>
            </div>
            {navLinks.map(l => (
              <button key={l.id} onClick={() => scrollTo(l.id)}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '14px 0', background: 'none', border: 'none', borderBottom: '1px solid rgba(11,37,69,0.06)', fontFamily: "'DM Sans',sans-serif", fontSize: 16, color: '#0B2545', cursor: 'pointer' }}>
                {l.label}
              </button>
            ))}
            <button className="btn-navy"
              onClick={() => { setMobileMenuOpen(false); setLoginOpen(true) }}
              style={{ width: '100%', marginTop: 24, background: '#0B2545', color: '#fff', border: 'none', padding: 14, borderRadius: 10, fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              Login
            </button>
          </div>
        </>
      )}

      {/* ─── LOGIN MODAL ─── */}
      {loginOpen && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setLoginOpen(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(6,14,26,0.65)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 40, width: '100%', maxWidth: 440, position: 'relative', animation: 'modalIn .25s ease both', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setLoginOpen(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: '#F4F7FB', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 15, color: '#4A6080', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>✕</button>

            <Logo />
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: '#0B1829', marginTop: 18, marginBottom: 4 }}>Welcome Back</div>
            <div style={{ fontSize: 14, color: '#4A6080', marginBottom: 28 }}>Login to your SR Classes portal</div>

            <div style={{ fontSize: 12, fontWeight: 600, color: '#4A6080', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Select Your Role</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 24 }}>
              {(['Owner', 'Faculty', 'Parent'] as const).map(role => (
                <div key={role}
                  className={`role-tile${selectedRole === role ? ' sel' : ''}`}
                  onClick={() => setSelectedRole(role)}
                  style={{ border: `1.5px solid ${selectedRole === role ? '#0B2545' : 'rgba(11,37,69,0.1)'}`, borderRadius: 12, padding: '16px 10px', textAlign: 'center', background: selectedRole === role ? '#EEF5FF' : '#fff' }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{role === 'Owner' ? '👑' : role === 'Faculty' ? '👨‍🏫' : '👨‍👩‍👧'}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#0B1829' }}>{role}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#4A6080', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email Address</label>
              <input className="field-inp"
                type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{ width: '100%', padding: '11px 14px', border: '1.5px solid rgba(11,37,69,0.12)', borderRadius: 10, fontFamily: "'DM Sans',sans-serif", fontSize: 15, color: '#0B2545', background: '#fff' }} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#4A6080', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input className="field-inp"
                  type={showPassword ? 'text' : 'password'} placeholder="Enter your password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  style={{ width: '100%', padding: '11px 48px 11px 14px', border: '1.5px solid rgba(11,37,69,0.12)', borderRadius: 10, fontFamily: "'DM Sans',sans-serif", fontSize: 15, color: '#0B2545', background: '#fff' }} />
                <button onClick={() => setShowPassword(p => !p)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {loginError && (
              <div style={{ background: '#FFF1F1', border: '1px solid rgba(220,38,38,0.2)', color: '#B91C1C', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
                {loginError}
              </div>
            )}

            <button className="submit-btn"
              onClick={handleLogin} disabled={loginLoading}
              style={{ width: '100%', padding: 14, background: '#0B2545', color: '#fff', border: 'none', borderRadius: 10, fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 600, cursor: loginLoading ? 'not-allowed' : 'pointer', opacity: loginLoading ? 0.6 : 1 }}>
              {loginLoading ? 'Logging in…' : 'Login'}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}