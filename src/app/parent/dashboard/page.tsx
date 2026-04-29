'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// ─── TYPES ───────────────────────────────────────────────
interface Profile { id: string; name: string; email: string; phone?: string; role: string }
interface Batch { id: string; name: string; subject: string; schedule: string }
interface Student { id: string; user_id: string; parent_id: string; batch_id: string; roll_no: string; date_of_birth: string; is_active: boolean }
interface Test { id: string; batch_id: string; name: string; subject: string; total_marks: number; test_type: string; test_date: string }
interface Mark { id: string; student_id: string; test_id: string; subject: string; score: number }
interface Attendance { id: string; student_id: string; date: string; status: string }
interface Material { id: string; title: string; subject: string; batch_id: string; file_url: string; file_type: string; uploaded_at: string }
interface Notification { id: string; message: string; type: string; sent_at: string; is_read: boolean }

// ─── STYLES ──────────────────────────────────────────────
const S = {
  page: { minHeight: '100vh', background: '#FAFAF8', fontFamily: "'DM Sans', sans-serif" } as React.CSSProperties,
  nav: { position: 'sticky' as const, top: 0, zIndex: 100, background: 'rgba(250,250,248,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(26,58,92,0.08)', padding: '0 24px' },
  navInner: { maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 },
  logo: { fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: '#1A3A5C' } as React.CSSProperties,
  card: { background: '#fff', border: '1px solid rgba(26,58,92,0.08)', borderRadius: 4, padding: 24 } as React.CSSProperties,
  btn: { background: '#1A3A5C', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 3, fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 500, cursor: 'pointer' } as React.CSSProperties,
  btnGhost: { background: 'transparent', color: '#1A3A5C', border: '1.5px solid rgba(26,58,92,0.2)', padding: '9px 18px', borderRadius: 3, fontFamily: "'DM Sans',sans-serif", fontSize: 14, cursor: 'pointer' } as React.CSSProperties,
  badge: (color: string, bg: string) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 3, fontSize: 12, fontWeight: 500, color, background: bg } as React.CSSProperties),
  sectionTitle: { fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, color: '#1A2332', marginBottom: 4 } as React.CSSProperties,
}

function gradeFromScore(score: number, total: number) {
  const pct = (score / total) * 100
  if (pct >= 90) return 'A+'
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B+'
  if (pct >= 60) return 'B'
  if (pct >= 40) return 'C'
  return 'F'
}

function gradeColor(grade: string): [string, string] {
  const map: Record<string, [string, string]> = {
    'A+': ['#1C5D3B', '#E6F4ED'], 'A': ['#1C5D3B', '#E6F4ED'],
    'B+': ['#4A3500', '#FBF3E2'], 'B': ['#4A3500', '#FBF3E2'],
    'C': ['#0F4C75', '#E8F0F9'], 'F': ['#8B1A1A', '#FEF2F2'],
  }
  return map[grade] || ['#4A5568', '#F7F7F7']
}

// ─── SVG ATTENDANCE RING ─────────────────────────────────
function AttendanceRing({ present, absent, late, size = 160 }: { present: number; absent: number; late: number; size?: number }) {
  const total = present + absent + late
  const pct = total > 0 ? Math.round((present / total) * 100) : 0
  const r = 54
  const circ = 2 * Math.PI * r
  const fill = (pct / 100) * circ
  const color = pct >= 75 ? '#1C5D3B' : '#8B1A1A'
  const trackColor = pct >= 75 ? '#E6F4ED' : '#FEF2F2'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size} viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke={trackColor} strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dasharray 0.8s ease' }} />
        <text x="60" y="55" textAnchor="middle" fontSize="20" fontWeight="700"
          fontFamily="'Fraunces',serif" fill={color}>{pct}%</text>
        <text x="60" y="72" textAnchor="middle" fontSize="10"
          fontFamily="'DM Sans',sans-serif" fill="#718096">attendance</text>
      </svg>
      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
        {[
          { label: 'Present', value: present, color: '#1C5D3B' },
          { label: 'Absent', value: absent, color: '#8B1A1A' },
          { label: 'Late', value: late, color: '#4A3500' },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: s.color, fontFamily: "'Fraunces',serif" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#718096' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── BAR CHART ───────────────────────────────────────────
function BarChart({ data, color = '#1A3A5C', height = 140 }: { data: { label: string; value: number; max: number }[]; color?: string; height?: number }) {
  const maxVal = Math.max(...data.map(d => d.max), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height, paddingBottom: 24, position: 'relative' }}>
      {data.map((d, i) => {
        const barH = Math.max(4, (d.value / maxVal) * (height - 24))
        const pct = d.max > 0 ? Math.round((d.value / d.max) * 100) : 0
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}
            title={`${d.label}: ${d.value}/${d.max} (${pct}%)`}>
            <div style={{ fontSize: 10, color: '#718096', textAlign: 'center' }}>{d.value}</div>
            <div style={{ width: '100%', background: color, borderRadius: '2px 2px 0 0', height: barH, transition: 'height 0.6s ease', opacity: 0.85 + (i % 3) * 0.05 }} />
            <div style={{ fontSize: 9, color: '#718096', textAlign: 'center', position: 'absolute', bottom: 0, width: `${100 / data.length}%`, left: `${(i / data.length) * 100}%`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 2px' }}>{d.label}</div>
          </div>
        )
      })}
    </div>
  )
}

// ─── DONUT CHART ─────────────────────────────────────────
function DonutChart({ segments, size = 120 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const total = segments.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <div style={{ width: size, height: size, background: '#F7F7F7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#718096' }}>No data</div>

  const r = 40
  const cx = size / 2
  const cy = size / 2
  let cumAngle = -90

  const slices = segments.filter(s => s.value > 0).map(s => {
    const angle = (s.value / total) * 360
    const startAngle = cumAngle
    cumAngle += angle
    const endAngle = cumAngle
    const start = polarToXY(cx, cy, r, startAngle)
    const end = polarToXY(cx, cy, r, endAngle)
    const largeArc = angle > 180 ? 1 : 0
    const path = `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`
    return { ...s, path, angle }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} stroke="#fff" strokeWidth="2" />)}
        <circle cx={cx} cy={cy} r={r * 0.55} fill="#fff" />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="14" fontWeight="700" fontFamily="'Fraunces',serif" fill="#1A2332">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fontFamily="'DM Sans',sans-serif" fill="#718096">total</text>
      </svg>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        {segments.filter(s => s.value > 0).map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: '#4A5568' }}>{s.label} ({s.value})</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

// ─── LINE SPARKLINE ──────────────────────────────────────
function Sparkline({ values, color = '#1A3A5C', width = 200, height = 48 }: { values: number[]; color?: string; width?: number; height?: number }) {
  if (values.length < 2) return null
  const max = Math.max(...values, 1)
  const min = Math.min(...values)
  const range = max - min || 1
  const pad = 4
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (width - pad * 2)
    const y = pad + ((max - v) / range) * (height - pad * 2)
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {values.map((v, i) => {
        const x = pad + (i / (values.length - 1)) * (width - pad * 2)
        const y = pad + ((max - v) / range) * (height - pad * 2)
        return <circle key={i} cx={x} cy={y} r="3" fill={color} />
      })}
    </svg>
  )
}
// ─── MAIN COMPONENT ──────────────────────────────────────
export default function ParentDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [student, setStudent] = useState<Student | null>(null)
  const [batch, setBatch] = useState<Batch | null>(null)
  const [activePage, setActivePage] = useState('overview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const [marks, setMarks] = useState<Mark[]>([])
  const [tests, setTests] = useState<Test[]>([])
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => { checkAuth() }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!prof || prof.role !== 'parent') { router.push('/'); return }
    setProfile(prof)

    const { data: stu } = await supabase.from('students').select('*').eq('parent_id', user.id).single()
    if (!stu) { setLoading(false); return }
    setStudent(stu)

    const { data: bat } = await supabase.from('batches').select('*').eq('id', stu.batch_id).single()
    if (bat) setBatch(bat)

    const [{ data: m }, { data: t }, { data: a }, { data: mat }, { data: n }] = await Promise.all([
      supabase.from('marks').select('*').eq('student_id', stu.id),
      supabase.from('tests').select('*').eq('batch_id', stu.batch_id),
      supabase.from('attendance').select('*').eq('student_id', stu.id).order('date', { ascending: false }),
      supabase.from('study_materials').select('*').or(`batch_id.eq.${stu.batch_id},batch_id.is.null`),
      supabase.from('notifications').select('*').eq('to_id', user.id).order('sent_at', { ascending: false }),
    ])
    if (m) setMarks(m)
    if (t) setTests(t)
    if (a) setAttendance(a)
    if (mat) setMaterials(mat)
    if (n) setNotifications(n)
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const navItems = [
    { id: 'overview', label: 'Overview', icon: '⊞' },
    { id: 'performance', label: 'Performance', icon: '📝' },
    { id: 'attendance', label: 'Attendance', icon: '✓' },
    { id: 'materials', label: 'Materials', icon: '📁' },
    { id: 'notices', label: 'Notices', icon: '🔔' },
  ]

  // Computed stats
  const avgScore = marks.length > 0 ? (marks.reduce((s, m) => s + m.score, 0) / marks.length).toFixed(1) : '—'
  const presentCount = attendance.filter(a => a.status === 'present').length
  const absentCount = attendance.filter(a => a.status === 'absent').length
  const lateCount = attendance.filter(a => a.status === 'late').length
  const totalAttendance = attendance.length
  const attendancePct = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAF8' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 32, color: '#1A3A5C', marginBottom: 12 }}>SR Classes</div>
        <div style={{ color: '#718096', fontSize: 15 }}>Loading your dashboard...</div>
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
        * { box-sizing: border-box; }
        input, select { font-family: 'DM Sans', sans-serif; }
        .nav-btn { background: none; border: none; cursor: pointer; padding: 8px 16px; border-radius: 3px; font-family: 'DM Sans', sans-serif; font-size: 14px; color: #4A5568; display: flex; align-items: center; gap: 8px; transition: all 0.15s; white-space: nowrap; }
        .nav-btn:hover { background: rgba(26,58,92,0.06); color: #1A3A5C; }
        .nav-btn.active { background: #E8F0F9; color: #1A3A5C; font-weight: 600; }
        .mob-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 998; }
        .mob-drawer { position: fixed; top: 0; left: 0; bottom: 0; width: 260px; background: #fff; z-index: 999; padding: 20px; overflow-y: auto; box-shadow: 4px 0 24px rgba(0,0,0,0.1); }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.4s ease forwards; }
        @media(max-width:900px) { .desktop-nav { display: none !important; } .ham-btn { display: flex !important; } }
        @media(max-width:768px) { .stats-grid { grid-template-columns: 1fr 1fr !important; } .two-col { grid-template-columns: 1fr !important; } .three-col { grid-template-columns: 1fr 1fr !important; } }
        @media(max-width:480px) { .stats-grid { grid-template-columns: 1fr !important; } .three-col { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* NAVBAR */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button className="ham-btn" onClick={() => setMobileMenuOpen(true)}
              style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', flexDirection: 'column', gap: 5, padding: 4 }}>
              <div style={{ width: 22, height: 2, background: '#1A3A5C' }} />
              <div style={{ width: 22, height: 2, background: '#1A3A5C' }} />
              <div style={{ width: 22, height: 2, background: '#1A3A5C' }} />
            </button>
            <div style={S.logo}>SR <span style={{ color: '#1C5D3B' }}>Classes</span></div>
          </div>
          <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {navItems.map(n => (
              <button key={n.id} className={`nav-btn ${activePage === n.id ? 'active' : ''}`}
                onClick={() => setActivePage(n.id)}>
                <span>{n.icon}</span><span>{n.label}</span>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#1A2332' }}>{profile?.name}</div>
              <div style={{ fontSize: 12, color: '#718096' }}>Parent</div>
            </div>
            <button onClick={handleLogout} style={{ ...S.btnGhost, fontSize: 13, padding: '7px 14px' }}>Logout</button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <>
          <div className="mob-overlay" onClick={() => setMobileMenuOpen(false)} />
          <div className="mob-drawer">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={S.logo}>SR Classes</div>
              <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            {navItems.map(n => (
              <button key={n.id} onClick={() => { setActivePage(n.id); setMobileMenuOpen(false) }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '14px 0', background: 'none', border: 'none', borderBottom: '1px solid rgba(26,58,92,0.06)', fontFamily: "'DM Sans',sans-serif", fontSize: 15, color: '#1A2332', cursor: 'pointer' }}>
                <span>{n.icon}</span><span>{n.label}</span>
              </button>
            ))}
            <button onClick={handleLogout} style={{ ...S.btnGhost, width: '100%', marginTop: 20 }}>Logout</button>
          </div>
        </>
      )}

      {/* PAGE CONTENT */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {activePage === 'overview' && (
          <OverviewPage
            profile={profile} student={student} batch={batch}
            marks={marks} tests={tests} attendance={attendance}
            notifications={notifications} avgScore={avgScore}
            presentCount={presentCount} absentCount={absentCount}
            lateCount={lateCount} attendancePct={attendancePct}
          />
        )}
        {activePage === 'performance' && (
          <PerformancePage marks={marks} tests={tests} />
        )}
        {activePage === 'attendance' && (
          <AttendancePage
            attendance={attendance} presentCount={presentCount}
            absentCount={absentCount} lateCount={lateCount}
            attendancePct={attendancePct}
          />
        )}
        {activePage === 'materials' && <MaterialsPage materials={materials} />}
        {activePage === 'notices' && <NoticesPage notifications={notifications} />}
      </main>
    </div>
  )
}

// ─── OVERVIEW PAGE ────────────────────────────────────────
// ─── OVERVIEW PAGE ────────────────────────────────────────
function OverviewPage({
  profile,
  student,
  batch,
  marks,
  tests,
  attendance,
  notifications,
  avgScore,
  presentCount,
  absentCount,
  lateCount,
  attendancePct,
}: any) {

  const recentTests = [...tests]
    .sort((a, b) =>
      new Date((b.test_date || b.created_at || "")).getTime() -
      new Date((a.test_date || a.created_at || "")).getTime()
    )
    .slice(0, 4)

  const recentNotices = notifications.slice(0, 4)


  // Subject scores for progress bars
  const subjectMap: Record<string, { total: number; count: number; maxTotal: number }> = {}
  marks.forEach((m: Mark) => {
    const test = tests.find((t: Test) => t.id === m.test_id)
    if (!test) return
    if (!subjectMap[m.subject]) subjectMap[m.subject] = { total: 0, count: 0, maxTotal: 0 }
    subjectMap[m.subject].total += m.score
    subjectMap[m.subject].count += 1
    subjectMap[m.subject].maxTotal += test.total_marks
  })

  const subjectStats = Object.entries(subjectMap).map(([subject, s]) => ({
    subject, avg: s.count > 0 ? (s.total / s.count).toFixed(1) : '0',
    pct: s.maxTotal > 0 ? Math.round((s.total / s.maxTotal) * 100) : 0
  })).sort((a, b) => b.pct - a.pct)

  const noticeTypeColors: Record<string, string> = {
    general: '#1A3A5C', exam: '#4A3500', attendance: '#8B1A1A',
    marks: '#1C5D3B', holiday: '#0F4C75', warning: '#8B1A1A'
  }

  return (
    <div className="fade-up">
      {/* Hero Card */}
      <div style={{ background: '#1A3A5C', borderRadius: 6, padding: '28px 32px', marginBottom: 28, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', fontFamily: "'Fraunces',serif", fontSize: 100, fontWeight: 700, color: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }}>SR</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>Welcome back, {profile?.name}</div>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 26, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
          {student ? (student as any).name || "Your Child's Dashboard" : 'Parent Dashboard'}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {batch && <span style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', padding: '5px 14px', borderRadius: 3, fontSize: 13 }}>📚 {batch.name}</span>}
          {student?.roll_no && <span style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', padding: '5px 14px', borderRadius: 3, fontSize: 13 }}>🎯 Roll No: {student.roll_no}</span>}
          <span style={{ background: student?.is_active ? 'rgba(28,93,59,0.6)' : 'rgba(139,26,26,0.6)', color: '#fff', padding: '5px 14px', borderRadius: 3, fontSize: 13 }}>
            {student?.is_active ? '✓ Active' : '✗ Inactive'}
          </span>
        </div>
      </div>

      {/* Alert Banners */}
      {attendancePct > 0 && attendancePct < 75 && (
        <div style={{ background: '#FEF2F2', border: '1px solid rgba(139,26,26,0.2)', borderLeft: '4px solid #8B1A1A', borderRadius: 4, padding: '12px 16px', marginBottom: 16, fontSize: 14, color: '#8B1A1A' }}>
          ⚠️ Attendance is <strong>{attendancePct}%</strong> — below the 75% minimum requirement. Please ensure regular attendance.
        </div>
      )}
      {avgScore !== '—' && Number(avgScore) < 50 && (
        <div style={{ background: '#FBF3E2', border: '1px solid rgba(74,53,0,0.2)', borderLeft: '4px solid #4A3500', borderRadius: 4, padding: '12px 16px', marginBottom: 16, fontSize: 14, color: '#4A3500' }}>
          📊 Average score is <strong>{avgScore}</strong> — below 50%. Consider extra coaching sessions.
        </div>
      )}

      {/* Stat Cards */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Average Score', value: avgScore, icon: '📝', color: '#1A3A5C', bg: '#E8F0F9' },
          { label: 'Attendance', value: `${attendancePct}%`, icon: '✓', color: attendancePct >= 75 ? '#1C5D3B' : '#8B1A1A', bg: attendancePct >= 75 ? '#E6F4ED' : '#FEF2F2' },
          { label: 'Tests Taken', value: tests.length, icon: '📋', color: '#4A3500', bg: '#FBF3E2' },
          { label: 'Notices', value: notifications.length, icon: '🔔', color: '#0F4C75', bg: '#E8F0F9' },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, borderRadius: 4, padding: '20px', borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: s.color, marginTop: 4, opacity: 0.8 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Subject Performance */}
        <div style={S.card}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1A2332', marginBottom: 4 }}>Subject Performance</div>
          <div style={{ fontSize: 13, color: '#718096', marginBottom: 20 }}>Average score per subject</div>
          {subjectStats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#718096', fontSize: 14 }}>No marks recorded yet</div>
          ) : subjectStats.map((s, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 13, color: '#1A2332', fontWeight: 500 }}>{s.subject}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: s.pct >= 75 ? '#1C5D3B' : s.pct >= 50 ? '#4A3500' : '#8B1A1A' }}>{s.pct}%</span>
              </div>
              <div style={{ background: '#F0F4F8', borderRadius: 3, height: 8, overflow: 'hidden' }}>
                <div style={{
                  height: 8, borderRadius: 3, transition: 'width 0.8s ease',
                  width: `${s.pct}%`,
                  background: s.pct >= 75 ? '#1C5D3B' : s.pct >= 50 ? '#4A3500' : '#8B1A1A'
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Attendance Ring */}
        <div style={{ ...S.card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1A2332', marginBottom: 4, alignSelf: 'flex-start' }}>Attendance Overview</div>
          <div style={{ fontSize: 13, color: '#718096', marginBottom: 20, alignSelf: 'flex-start' }}>Overall attendance this term</div>
          {attendance.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#718096', fontSize: 14 }}>No attendance recorded yet</div>
          ) : (
            <>
              <AttendanceRing present={presentCount} absent={absentCount} late={lateCount} size={160} />
              <div style={{ marginTop: 16, padding: '10px 20px', borderRadius: 3, background: attendancePct >= 75 ? '#E6F4ED' : '#FEF2F2', fontSize: 13, fontWeight: 500, color: attendancePct >= 75 ? '#1C5D3B' : '#8B1A1A' }}>
                {attendancePct >= 75 ? '✓ Attendance requirement met' : '⚠️ Below 75% minimum'}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Tests + Notices */}
      <div className="two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Recent Test Results */}
        <div style={S.card}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1A2332', marginBottom: 16 }}>Recent Test Results</div>
          {recentTests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#718096', fontSize: 14 }}>No tests yet</div>
          ) : recentTests.map((t: Test, i: number) => {
            const mark = marks.find((m: Mark) => m.test_id === t.id)
            const grade = mark ? gradeFromScore(mark.score, t.total_marks) : null
            const [gc, gb] = grade ? gradeColor(grade) : ['#718096', '#F7F7F7']
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < recentTests.length - 1 ? '1px solid rgba(26,58,92,0.06)' : 'none' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#1A2332' }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>{t.subject} · {t.test_date || '—'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {mark ? (
                    <>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2332' }}>{mark.score}/{t.total_marks}</div>
                      <span style={S.badge(gc, gb)}>{grade}</span>
                    </>
                  ) : <span style={S.badge('#718096', '#F7F7F7')}>Pending</span>}
                </div>
              </div>
            )
          })}
        </div>

        {/* Recent Notices */}
        <div style={S.card}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1A2332', marginBottom: 16 }}>Recent Notices</div>
          {recentNotices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#718096', fontSize: 14 }}>No notices yet</div>
          ) : recentNotices.map((n: Notification, i: number) => (
            <div key={i} style={{ borderLeft: `3px solid ${noticeTypeColors[n.type] || '#1A3A5C'}`, paddingLeft: 12, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={S.badge('#1A3A5C', '#E8F0F9')}>{n.type}</span>
                <span style={{ fontSize: 11, color: '#718096' }}>{new Date(n.sent_at).toLocaleDateString()}</span>
              </div>
              <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.5 }}>{n.message}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── PERFORMANCE PAGE ─────────────────────────────────────
function PerformancePage({ marks, tests }: any) {
  // Subject breakdown
  const subjectMap: Record<string, { scores: number[]; totals: number[] }> = {}
  marks.forEach((m: Mark) => {
    const test = tests.find((t: Test) => t.id === m.test_id)
    if (!test) return
    if (!subjectMap[m.subject]) subjectMap[m.subject] = { scores: [], totals: [] }
    subjectMap[m.subject].scores.push(m.score)
    subjectMap[m.subject].totals.push(test.total_marks)
  })

  const subjectStats = Object.entries(subjectMap).map(([subject, s]) => ({
    subject,
    avg: (s.scores.reduce((a, b) => a + b, 0) / s.scores.length).toFixed(1),
    pct: Math.round((s.scores.reduce((a, b) => a + b, 0) / s.totals.reduce((a, b) => a + b, 0)) * 100),
    count: s.scores.length,
    best: Math.max(...s.scores),
    worst: Math.min(...s.scores),
  }))

  // Grade distribution
  const gradeDist: Record<string, number> = { 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C': 0, 'F': 0 }
  marks.forEach((m: Mark) => {
    const test = tests.find((t: Test) => t.id === m.test_id)
    if (!test) return
    const g = gradeFromScore(m.score, test.total_marks)
    gradeDist[g] = (gradeDist[g] || 0) + 1
  })

  // Overall stats
  const allScores = marks.map((m: Mark) => m.score)
  const overallAvg = allScores.length > 0 ? (allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length).toFixed(1) : '—'
  const best = allScores.length > 0 ? Math.max(...allScores) : '—'
  const worst = allScores.length > 0 ? Math.min(...allScores) : '—'

  // Bar chart data — scores per test
  const barData = tests.slice(-8).map((t: Test) => {
    const m = marks.find((mk: Mark) => mk.test_id === t.id)
    return { label: t.name.substring(0, 8), value: m ? m.score : 0, max: t.total_marks }
  })

  // Sparkline — score trend over time
  const sortedMarks = [...marks].sort((a: Mark, b: Mark) => {
    const ta = tests.find((t: Test) => t.id === a.test_id)
    const tb = tests.find((t: Test) => t.id === b.test_id)
    return new Date(ta?.test_date || 0).getTime() - new Date(tb?.test_date || 0).getTime()
  })
  const sparkValues = sortedMarks.map((m: Mark) => {
    const test = tests.find((t: Test) => t.id === m.test_id)
    return test ? Math.round((m.score / test.total_marks) * 100) : 0
  })

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 24 }}>
        <div style={S.sectionTitle}>Performance</div>
        <div style={{ fontSize: 14, color: '#718096' }}>Detailed academic performance analysis</div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Average Score', value: overallAvg, color: '#1A3A5C', bg: '#E8F0F9' },
          { label: 'Best Score', value: best, color: '#1C5D3B', bg: '#E6F4ED' },
          { label: 'Lowest Score', value: worst, color: '#8B1A1A', bg: '#FEF2F2' },
          { label: 'Tests Taken', value: marks.length, color: '#4A3500', bg: '#FBF3E2' },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, borderRadius: 4, padding: '20px', borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: s.color, opacity: 0.8, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Bar Chart */}
        <div style={S.card}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1A2332', marginBottom: 4 }}>Scores per Test</div>
          <div style={{ fontSize: 13, color: '#718096', marginBottom: 16 }}>Last 8 tests</div>
          {barData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#718096', fontSize: 14 }}>No test data yet</div>
          ) : <BarChart data={barData} color="#1A3A5C" height={160} />}
        </div>

        {/* Grade Distribution Donut */}
        <div style={S.card}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1A2332', marginBottom: 4 }}>Grade Distribution</div>
          <div style={{ fontSize: 13, color: '#718096', marginBottom: 16 }}>Breakdown of all grades received</div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <DonutChart
              size={150}
              segments={[
                { label: 'A+', value: gradeDist['A+'], color: '#1C5D3B' },
                { label: 'A', value: gradeDist['A'], color: '#2E7D52' },
                { label: 'B+', value: gradeDist['B+'], color: '#4A3500' },
                { label: 'B', value: gradeDist['B'], color: '#7A5C00' },
                { label: 'C', value: gradeDist['C'], color: '#0F4C75' },
                { label: 'F', value: gradeDist['F'], color: '#8B1A1A' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Score Trend Sparkline */}
      {sparkValues.length >= 2 && (
        <div style={{ ...S.card, marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1A2332', marginBottom: 4 }}>Score Trend</div>
          <div style={{ fontSize: 13, color: '#718096', marginBottom: 16 }}>Performance trend over time (% score)</div>
          <div style={{ overflowX: 'auto' }}>
            <Sparkline values={sparkValues} color="#1A3A5C" width={Math.max(400, sparkValues.length * 60)} height={80} />
          </div>
        </div>
      )}

      {/* Subject Breakdown */}
      <div className="two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={S.card}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1A2332', marginBottom: 16 }}>Subject Breakdown</div>
          {subjectStats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#718096', fontSize: 14 }}>No data yet</div>
          ) : subjectStats.map((s, i) => (
            <div key={i} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: i < subjectStats.length - 1 ? '1px solid rgba(26,58,92,0.06)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#1A2332' }}>{s.subject}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: s.pct >= 75 ? '#1C5D3B' : s.pct >= 50 ? '#4A3500' : '#8B1A1A' }}>{s.pct}%</span>
              </div>
              <div style={{ background: '#F0F4F8', borderRadius: 3, height: 8, marginBottom: 6, overflow: 'hidden' }}>
                <div style={{ height: 8, borderRadius: 3, width: `${s.pct}%`, background: s.pct >= 75 ? '#1C5D3B' : s.pct >= 50 ? '#4A3500' : '#8B1A1A', transition: 'width 0.8s ease' }} />
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <span style={{ fontSize: 12, color: '#718096' }}>Tests: {s.count}</span>
                <span style={{ fontSize: 12, color: '#1C5D3B' }}>Best: {s.best}</span>
                <span style={{ fontSize: 12, color: '#8B1A1A' }}>Worst: {s.worst}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Full Marks Table */}
        <div style={S.card}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1A2332', marginBottom: 16 }}>All Test Results</div>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {marks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#718096', fontSize: 14 }}>No marks recorded yet</div>
            ) : [...marks].reverse().map((m: Mark, i: number) => {
              const test = tests.find((t: Test) => t.id === m.test_id)
              if (!test) return null
              const grade = gradeFromScore(m.score, test.total_marks)
              const [gc, gb] = gradeColor(grade)
              const pct = Math.round((m.score / test.total_marks) * 100)
              return (
                <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid rgba(26,58,92,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#1A2332' }}>{test.name}</div>
                      <div style={{ fontSize: 12, color: '#718096' }}>{test.subject} · {test.test_date || '—'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2332' }}>{m.score}/{test.total_marks}</div>
                      <span style={S.badge(gc, gb)}>{grade}</span>
                    </div>
                  </div>
                  <div style={{ background: '#F0F4F8', borderRadius: 2, height: 4, overflow: 'hidden' }}>
                    <div style={{ height: 4, borderRadius: 2, width: `${pct}%`, background: gc }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── ATTENDANCE PAGE ──────────────────────────────────────
function AttendancePage({ attendance, presentCount, absentCount, lateCount, attendancePct }: any) {
  const recent30 = attendance.slice(0, 30)

  // Weekly bar chart
  const weeks: Record<string, { present: number; total: number }> = {}
  attendance.forEach((a: Attendance) => {
    const d = new Date(a.date)
    const week = `W${Math.ceil(d.getDate() / 7)} ${d.toLocaleString('default', { month: 'short' })}`
    if (!weeks[week]) weeks[week] = { present: 0, total: 0 }
    weeks[week].total += 1
    if (a.status === 'present') weeks[week].present += 1
  })
  const weekData = Object.entries(weeks).slice(-6).map(([label, w]) => ({
    label, value: w.present, max: w.total
  }))

  const statusColor: Record<string, string> = { present: '#1C5D3B', absent: '#8B1A1A', late: '#4A3500' }
  const statusBg: Record<string, string> = { present: '#E6F4ED', absent: '#FEF2F2', late: '#FBF3E2' }

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 24 }}>
        <div style={S.sectionTitle}>Attendance</div>
        <div style={{ fontSize: 14, color: '#718096' }}>Detailed attendance records and analysis</div>
      </div>

      {attendancePct > 0 && attendancePct < 75 && (
        <div style={{ background: '#FEF2F2', border: '1px solid rgba(139,26,26,0.2)', borderLeft: '4px solid #8B1A1A', borderRadius: 4, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: '#8B1A1A' }}>
          ⚠️ Attendance is <strong>{attendancePct}%</strong> — below the 75% minimum. Need <strong>{Math.ceil(((0.75 * (attendance.length + 10)) - presentCount))} more</strong> present days to reach 75%.
        </div>
      )}

      <div className="two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Ring + Stats */}
        <div style={{ ...S.card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <AttendanceRing present={presentCount} absent={absentCount} late={lateCount} size={180} />
          <div style={{ width: '100%' }}>
            {[
              { label: 'Present', value: presentCount, color: '#1C5D3B', bg: '#E6F4ED' },
              { label: 'Absent', value: absentCount, color: '#8B1A1A', bg: '#FEF2F2' },
              { label: 'Late', value: lateCount, color: '#4A3500', bg: '#FBF3E2' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 13, color: '#1A2332', width: 60 }}>{s.label}</div>
                <div style={{ flex: 1, background: '#F0F4F8', borderRadius: 3, height: 8, overflow: 'hidden' }}>
                  <div style={{ height: 8, borderRadius: 3, background: s.color, width: `${attendance.length > 0 ? (s.value / attendance.length) * 100 : 0}%`, transition: 'width 0.8s ease' }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: s.color, width: 28, textAlign: 'right' }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Chart */}
        <div style={S.card}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1A2332', marginBottom: 4 }}>Weekly Attendance</div>
          <div style={{ fontSize: 13, color: '#718096', marginBottom: 16 }}>Present days per week</div>
          {weekData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#718096', fontSize: 14 }}>No data yet</div>
          ) : <BarChart data={weekData} color="#1C5D3B" height={160} />}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
            <div style={{ background: '#E8F0F9', borderRadius: 4, padding: '14px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 700, color: '#1A3A5C' }}>{attendance.length}</div>
              <div style={{ fontSize: 12, color: '#1A3A5C' }}>Total Days</div>
            </div>
            <div style={{ background: attendancePct >= 75 ? '#E6F4ED' : '#FEF2F2', borderRadius: 4, padding: '14px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 700, color: attendancePct >= 75 ? '#1C5D3B' : '#8B1A1A' }}>
                {attendancePct >= 75 ? `+${presentCount - Math.ceil(attendance.length * 0.75)}` : `-${Math.ceil(attendance.length * 0.75) - presentCount}`}
              </div>
              <div style={{ fontSize: 12, color: attendancePct >= 75 ? '#1C5D3B' : '#8B1A1A' }}>75% Gap</div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Log */}
      <div style={S.card}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#1A2332', marginBottom: 16 }}>Recent Attendance Log (Last 30 days)</div>
        {recent30.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#718096', fontSize: 14 }}>No attendance records yet</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
            {recent30.map((a: Attendance, i: number) => (
              <div key={i} style={{ background: statusBg[a.status] || '#F7F7F7', borderRadius: 3, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#4A5568' }}>{new Date(a.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: statusColor[a.status] || '#718096', textTransform: 'capitalize' }}>{a.status[0].toUpperCase()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── MATERIALS PAGE ───────────────────────────────────────
function MaterialsPage({ materials }: any) {
  const fileTypeIcon: Record<string, string> = { pdf: '📄', video: '🎥', image: '🖼️', doc: '📝', other: '📎' }

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 24 }}>
        <div style={S.sectionTitle}>Study Materials</div>
        <div style={{ fontSize: 14, color: '#718096' }}>{materials.length} materials available for your batch</div>
      </div>
      {materials.length === 0 ? (
        <div style={{ ...S.card, textAlign: 'center', padding: '48px', color: '#718096' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📁</div>
          <div>No study materials uploaded yet</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {materials.map((m: Material) => (
            <div key={m.id} style={S.card}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ background: '#E8F0F9', borderRadius: 3, padding: '10px', fontSize: 20, flexShrink: 0 }}>
                  {fileTypeIcon[m.file_type] || '📎'}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1A2332', marginBottom: 4 }}>{m.title}</div>
                  <div style={{ fontSize: 12, color: '#718096' }}>{m.subject}</div>
                  <div style={{ fontSize: 12, color: '#718096' }}>{new Date(m.uploaded_at).toLocaleDateString()}</div>
                </div>
              </div>
              {m.file_url ? (
                <a href={m.file_url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', textAlign: 'center', padding: '9px', background: '#E8F0F9', color: '#1A3A5C', borderRadius: 3, fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
                  Download / View
                </a>
              ) : (
                <div style={{ textAlign: 'center', padding: '9px', background: '#F7F7F7', color: '#718096', borderRadius: 3, fontSize: 13 }}>No link available</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── NOTICES PAGE ─────────────────────────────────────────
function NoticesPage({ notifications }: any) {
  const typeColor: Record<string, string> = {
    general: '#1A3A5C', exam: '#4A3500', attendance: '#8B1A1A',
    marks: '#1C5D3B', holiday: '#0F4C75', warning: '#8B1A1A'
  }
  const typeBg: Record<string, string> = {
    general: '#E8F0F9', exam: '#FBF3E2', attendance: '#FEF2F2',
    marks: '#E6F4ED', holiday: '#E8F0F9', warning: '#FEF2F2'
  }

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 24 }}>
        <div style={S.sectionTitle}>Notices</div>
        <div style={{ fontSize: 14, color: '#718096' }}>{notifications.length} notices received</div>
      </div>
      {notifications.length === 0 ? (
        <div style={{ ...S.card, textAlign: 'center', padding: '48px', color: '#718096' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔔</div>
          <div>No notices received yet</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {notifications.map((n: Notification, i: number) => (
            <div key={i} style={{ ...S.card, borderLeft: `4px solid ${typeColor[n.type] || '#1A3A5C'}`, padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                <span style={S.badge(typeColor[n.type] || '#1A3A5C', typeBg[n.type] || '#E8F0F9')}>{n.type}</span>
                <span style={{ fontSize: 12, color: '#718096' }}>
                  {new Date(n.sent_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div style={{ fontSize: 14, color: '#1A2332', lineHeight: 1.6 }}>{n.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}