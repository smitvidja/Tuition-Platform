'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// ─── TYPES ───────────────────────────────────────────────
interface Profile { id: string; name: string; email: string; role: string }
interface Batch { id: string; name: string; subject: string; schedule: string }
interface Student { id: string; user_id: string; batch_id: string; roll_no: string; is_active: boolean; profiles?: Profile }
interface Test { id: string; batch_id: string; name: string; subject: string; total_marks: number; test_type: string; test_date: string }
interface Mark { id: string; student_id: string; test_id: string; subject: string; score: number }
interface AttendanceRecord { id: string; student_id: string; batch_id: string; date: string; status: string }

// ─── STYLES ──────────────────────────────────────────────
const S = {
  page: { minHeight: '100vh', background: '#F0FAF4', fontFamily: "'DM Sans', sans-serif" } as React.CSSProperties,
  nav: { position: 'sticky' as const, top: 0, zIndex: 100, background: 'rgba(240,250,244,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(28,93,59,0.1)', padding: '0 24px' },
  navInner: { maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 },
  logo: { fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: '#1C5D3B' } as React.CSSProperties,
  card: { background: '#fff', border: '1px solid rgba(28,93,59,0.1)', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' } as React.CSSProperties,
  btn: { background: '#1C5D3B', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
  btnGhost: { background: 'transparent', color: '#1C5D3B', border: '1.5px solid rgba(28,93,59,0.25)', padding: '9px 18px', borderRadius: 8, fontFamily: "'DM Sans',sans-serif", fontSize: 14, cursor: 'pointer' } as React.CSSProperties,
  btnDanger: { background: '#fff', color: '#dc2626', border: '1.5px solid #fecaca', padding: '7px 14px', borderRadius: 8, fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
  inp: { width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: 'none', background: '#fff', color: '#0f172a' } as React.CSSProperties,
  label: { fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 } as React.CSSProperties,
  modalBg: { position: 'fixed' as const, inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: 16 },
  modal: { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' as const, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', borderTop: '4px solid #1C5D3B' },
  sectionTitle: { fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 4 } as React.CSSProperties,
  badge: (color: string, bg: string) => ({ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, color, background: bg, whiteSpace: 'nowrap' as const }),
}

const SUBJECTS = ['Mathematics','Physics','Chemistry','Biology','English','Hindi','Social Science','Computer Science','Accounts','Economics','Other']
const TEST_TYPES = ['unit','weekly','quarterly','midterm','final']

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
    'A+': ['#166534','#dcfce7'], 'A': ['#166534','#dcfce7'],
    'B+': ['#92400e','#fef3c7'], 'B': ['#92400e','#fef3c7'],
    'C': ['#1e40af','#dbeafe'], 'F': ['#991b1b','#fee2e2'],
  }
  return map[grade] || ['#374151','#f3f4f6']
}

// ─── MAIN COMPONENT ──────────────────────────────────────
export default function FacultyDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [activePage, setActivePage] = useState('attendance')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const [students, setStudents] = useState<Student[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [marks, setMarks] = useState<Mark[]>([])
  const [tests, setTests] = useState<Test[]>([])

  useEffect(() => { checkAuth() }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!prof || prof.role !== 'assistant') { router.push('/'); return }
    setProfile(prof)
    await loadAllData()
    setLoading(false)
  }

  async function loadAllData() {
    const [{ data: s }, { data: b }, { data: m }, { data: t }] = await Promise.all([
      supabase.from('students').select('*, profiles!students_user_id_fkey(id,name,email)'),
      supabase.from('batches').select('*'),
      supabase.from('marks').select('*'),
      supabase.from('tests').select('*'),
    ])
    if (s) setStudents(s)
    if (b) setBatches(b)
    if (m) setMarks(m)
    if (t) setTests(t)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const navItems = [
    { id: 'attendance', label: 'Attendance', icon: '✓' },
    { id: 'marks', label: 'Marks', icon: '📝' },
  ]

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0FAF4' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 32, color: '#1C5D3B', marginBottom: 12 }}>SR Classes</div>
        <div style={{ color: '#6b7280', fontSize: 15 }}>Loading faculty portal...</div>
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      <style href="faculty-styles" precedence="default">{`
        * { box-sizing: border-box; }
        input, select, textarea { font-family: 'DM Sans', sans-serif; }
        input:focus, select:focus, textarea:focus { outline: none; border-color: #1C5D3B !important; }
        .nav-btn { background: none; border: none; cursor: pointer; padding: 10px 20px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; color: #4b5563; display: flex; align-items: center; gap: 8px; transition: all 0.15s; }
        .nav-btn:hover { background: rgba(28,93,59,0.08); color: #1C5D3B; }
        .nav-btn.active { background: #dcfce7; color: #166534; font-weight: 600; }
        .row-hover:hover { background: #f0fdf4 !important; }
        .mob-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 998; }
        .mob-drawer { position: fixed; top: 0; left: 0; bottom: 0; width: 260px; background: #fff; z-index: 999; padding: 24px; box-shadow: 4px 0 24px rgba(0,0,0,0.1); }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.35s ease forwards; }
        @media(max-width:900px) { .desktop-nav { display: none !important; } .ham-btn { display: flex !important; } }
        @media(max-width:768px) { .stats-grid { grid-template-columns: 1fr 1fr !important; } .two-col { grid-template-columns: 1fr !important; } .modal-inner { position: fixed; bottom: 0; left: 0; right: 0; max-width: 100% !important; border-radius: 16px 16px 0 0; max-height: 85vh; } }
        @media(max-width:480px) { .stats-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* NAVBAR */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button className="ham-btn" onClick={() => setMobileMenuOpen(true)}
              style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', flexDirection: 'column', gap: 5, padding: 4 }}>
              <div style={{ width: 22, height: 2, background: '#1C5D3B' }} />
              <div style={{ width: 22, height: 2, background: '#1C5D3B' }} />
              <div style={{ width: 22, height: 2, background: '#1C5D3B' }} />
            </button>
            <div style={S.logo}>SR <span style={{ color: '#0f172a' }}>Classes</span></div>
          </div>
          <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {navItems.map(n => (
              <button key={n.id} className={`nav-btn ${activePage === n.id ? 'active' : ''}`}
                onClick={() => setActivePage(n.id)}>
                <span>{n.icon}</span><span>{n.label}</span>
              </button>
            ))}
            <div style={{ marginLeft: 8, background: '#dcfce7', border: '1px solid rgba(28,93,59,0.2)', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600, color: '#166534' }}>
              ✓ Attendance · Marks
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{profile?.name}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Faculty</div>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <div style={S.logo}>SR Classes</div>
              <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {navItems.map(n => (
                <button key={n.id} onClick={() => { setActivePage(n.id); setMobileMenuOpen(false) }}
                  style={{ background: activePage === n.id ? '#dcfce7' : '#f0fdf4', border: '1px solid rgba(28,93,59,0.1)', borderRadius: 10, padding: '16px 8px', cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{n.icon}</div>
                  <div style={{ fontSize: 13, color: '#0f172a', fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>{n.label}</div>
                </button>
              ))}
            </div>
            <div style={{ background: '#dcfce7', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#166534', fontWeight: 500, marginBottom: 20 }}>
              ✓ Access: Attendance & Marks only
            </div>
            <button onClick={handleLogout} style={{ ...S.btnGhost, width: '100%' }}>Logout</button>
          </div>
        </>
      )}

      {/* PAGE CONTENT */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ background: '#dcfce7', border: '1px solid rgba(28,93,59,0.2)', borderRadius: 10, padding: '12px 18px', marginBottom: 24, fontSize: 13, color: '#166534', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🔒</span>
          <span>You have access to <strong>Attendance</strong> and <strong>Marks</strong> only. Contact the owner for other sections.</span>
        </div>
        {activePage === 'attendance' && <AttendancePage students={students} batches={batches} profile={profile} reload={loadAllData} />}
        {activePage === 'marks' && <MarksPage students={students} batches={batches} tests={tests} marks={marks} profile={profile} reload={loadAllData} />}
      </main>
    </div>
  )
}

// ─── ATTENDANCE PAGE ──────────────────────────────────────
function AttendancePage({ students, batches, profile, reload }: any) {
  const [selectedBatch, setSelectedBatch] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [attendance, setAttendance] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<AttendanceRecord[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const batchStudents = students.filter((s: Student) => s.batch_id === selectedBatch && s.is_active)

  useEffect(() => {
    if (selectedBatch && selectedDate) loadAttendance()
  }, [selectedBatch, selectedDate])

  async function loadAttendance() {
    const ids = batchStudents.map((s: Student) => s.id)
    if (ids.length === 0) { setAttendance({}); return }
    const { data } = await supabase.from('attendance').select('*').in('student_id', ids).eq('date', selectedDate)
    const map: Record<string, string> = {}
    data?.forEach((a: any) => { map[a.student_id] = a.status })
    setAttendance(map)
  }

  async function loadHistory() {
    if (!selectedBatch) return
    setHistoryLoading(true)
    const ids = batchStudents.map((s: Student) => s.id)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const { data } = await supabase.from('attendance').select('*')
      .in('student_id', ids)
      .gte('date', sevenDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false })
    if (data) setHistory(data)
    setHistoryLoading(false)
  }

  function markAll(status: string) {
    const map: Record<string, string> = {}
    batchStudents.forEach((s: Student) => { map[s.id] = status })
    setAttendance(map)
  }

  async function handleSave() {
    setSaving(true)
    const rows = batchStudents.map((s: Student) => ({
      student_id: s.id,
      batch_id: selectedBatch,
      date: selectedDate,
      status: attendance[s.id] || 'absent',
      marked_by: profile?.id,
    }))
    await supabase.from('attendance').upsert(rows, { onConflict: 'student_id,date' })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    await reload()
  }

  async function toggleHistory() {
    if (!showHistory) await loadHistory()
    setShowHistory(!showHistory)
  }

  const present = batchStudents.filter((s: Student) => attendance[s.id] === 'present').length
  const absent = batchStudents.filter((s: Student) => attendance[s.id] === 'absent').length
  const late = batchStudents.filter((s: Student) => attendance[s.id] === 'late').length

  // Group history by date
  const historyByDate: Record<string, AttendanceRecord[]> = {}
  history.forEach(a => {
    if (!historyByDate[a.date]) historyByDate[a.date] = []
    historyByDate[a.date].push(a)
  })

  return (
    <div className="fade-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={S.sectionTitle}>Attendance</div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Mark daily attendance for your batch</div>
        </div>
        {selectedBatch && (
          <button style={{ ...S.btnGhost, fontSize: 13 }} onClick={toggleHistory}>
            {showHistory ? '← Back to Marking' : '📋 View History (7 days)'}
          </button>
        )}
      </div>

      {/* Selectors */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <select style={{ ...S.inp, maxWidth: 240 }} value={selectedBatch}
          onChange={e => { setSelectedBatch(e.target.value); setShowHistory(false) }}>
          <option value="">Select Batch</option>
          {batches.map((b: Batch) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        {!showHistory && (
          <input style={{ ...S.inp, maxWidth: 180 }} type="date" value={selectedDate}
            max={new Date().toISOString().split('T')[0]}
            onChange={e => setSelectedDate(e.target.value)} />
        )}
      </div>

      {selectedBatch && !showHistory && (
        <>
          {/* Summary Cards */}
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total', value: batchStudents.length, color: '#1C5D3B', bg: '#dcfce7' },
              { label: 'Present', value: present, color: '#166534', bg: '#bbf7d0' },
              { label: 'Absent', value: absent, color: '#dc2626', bg: '#fee2e2' },
              { label: 'Late', value: late, color: '#92400e', bg: '#fef3c7' },
            ].map((s, i) => (
              <div key={i} style={{ background: s.bg, borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontFamily: "'Fraunces',serif", fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 13, color: s.color, fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Mark All Shortcuts */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>Mark all as:</span>
            {[
              { status: 'present', color: '#166534', bg: '#dcfce7' },
              { status: 'absent', color: '#dc2626', bg: '#fee2e2' },
              { status: 'late', color: '#92400e', bg: '#fef3c7' },
            ].map(s => (
              <button key={s.status} onClick={() => markAll(s.status)}
                style={{ background: s.bg, color: s.color, border: 'none', padding: '7px 16px', borderRadius: 8, fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>
                {s.status}
              </button>
            ))}
          </div>

          {/* Student List */}
          <div style={S.card}>
            {batchStudents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', fontSize: 14 }}>No active students in this batch</div>
            ) : batchStudents.map((s: Student, i: number) => (
              <div key={s.id} className="row-hover" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 12px', borderBottom: i < batchStudents.length - 1 ? '1px solid #f1f5f9' : 'none', borderRadius: 8, transition: 'background 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#166534', flexShrink: 0 }}>
                    {((s.profiles as any)?.name || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{(s.profiles as any)?.name || '—'}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>Roll: {s.roll_no || '—'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { status: 'present', label: 'P', activeColor: '#166534', activeBg: '#dcfce7' },
                    { status: 'absent', label: 'A', activeColor: '#dc2626', activeBg: '#fee2e2' },
                    { status: 'late', label: 'L', activeColor: '#92400e', activeBg: '#fef3c7' },
                  ].map(btn => (
                    <button key={btn.status} onClick={() => setAttendance({ ...attendance, [s.id]: btn.status })}
                      style={{
                        width: 38, height: 38, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                        background: attendance[s.id] === btn.status ? btn.activeBg : '#f8fafc',
                        color: attendance[s.id] === btn.status ? btn.activeColor : '#9ca3af',
                        transition: 'all 0.15s',
                        boxShadow: attendance[s.id] === btn.status ? `0 0 0 2px ${btn.activeColor}40` : 'none',
                      }}>
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleSave} disabled={saving}
              style={{ ...S.btn, minWidth: 180, background: saved ? '#166534' : '#1C5D3B', transition: 'background 0.3s' }}>
              {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </>
      )}

      {/* History View */}
      {selectedBatch && showHistory && (
        <div>
          {historyLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Loading history...</div>
          ) : Object.keys(historyByDate).length === 0 ? (
            <div style={{ ...S.card, textAlign: 'center', padding: '40px', color: '#6b7280' }}>No attendance records in the last 7 days</div>
          ) : Object.entries(historyByDate).map(([date, records]) => {
            const presentCount = records.filter(r => r.status === 'present').length
            const absentCount = records.filter(r => r.status === 'absent').length
            const lateCount = records.filter(r => r.status === 'late').length
            return (
              <div key={date} style={{ ...S.card, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                    {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short' })}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={S.badge('#166534', '#dcfce7')}>P: {presentCount}</span>
                    <span style={S.badge('#dc2626', '#fee2e2')}>A: {absentCount}</span>
                    <span style={S.badge('#92400e', '#fef3c7')}>L: {lateCount}</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: 8 }}>
                  {records.map((r, i) => {
                    const stu = students.find((s: Student) => s.id === r.student_id)
                    const statusColors: Record<string, [string, string]> = {
                      present: ['#166534', '#dcfce7'],
                      absent: ['#dc2626', '#fee2e2'],
                      late: ['#92400e', '#fef3c7'],
                    }
                    const [sc, sbg] = statusColors[r.status] || ['#374151', '#f3f4f6']
                    return (
                      <div key={i} style={{ background: sbg, borderRadius: 8, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>{(stu?.profiles as any)?.name || '—'}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: sc, textTransform: 'capitalize' }}>{r.status[0].toUpperCase()}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── MARKS PAGE ───────────────────────────────────────────
function MarksPage({ students, batches, tests, marks, profile, reload }: any) {
  const [selectedBatch, setSelectedBatch] = useState('')
  const [selectedTest, setSelectedTest] = useState<Test | null>(null)
  const [showCreateTest, setShowCreateTest] = useState(false)
  const [showMarks, setShowMarks] = useState(false)
  const [testForm, setTestForm] = useState({ name: '', subject: '', total_marks: '100', test_type: 'unit', test_date: '', batch_id: '' })
  const [marksForm, setMarksForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Test | null>(null)

  const batchTests = tests.filter((t: Test) => !selectedBatch || t.batch_id === selectedBatch)
  const testStudents = selectedTest ? students.filter((s: Student) => s.batch_id === selectedTest.batch_id && s.is_active) : []

  function openMarks(t: Test) {
    setSelectedTest(t)
    const existing: Record<string, string> = {}
    marks.filter((m: Mark) => m.test_id === t.id).forEach((m: Mark) => { existing[m.student_id] = String(m.score) })
    setMarksForm(existing)
    setShowMarks(true)
  }

  async function handleCreateTest() {
    if (!testForm.name || !testForm.subject || !testForm.batch_id) return
    setSaving(true)
    await supabase.from('tests').insert({ ...testForm, total_marks: Number(testForm.total_marks) })
    await reload()
    setShowCreateTest(false)
    setSaving(false)
    setTestForm({ name: '', subject: '', total_marks: '100', test_type: 'unit', test_date: '', batch_id: '' })
  }

  async function handleSaveMarks() {
    if (!selectedTest) return
    setSaving(true)
    const rows = testStudents.map((s: Student) => ({
      student_id: s.id,
      test_id: selectedTest.id,
      subject: selectedTest.subject,
      score: Number(marksForm[s.id] || 0),
      graded_by: profile?.id,
    }))
    await supabase.from('marks').upsert(rows, { onConflict: 'student_id,test_id,subject' })
    await reload()
    setShowMarks(false)
    setSaving(false)
  }

  async function handleDeleteTest(t: Test) {
    await supabase.from('marks').delete().eq('test_id', t.id)
    await supabase.from('tests').delete().eq('id', t.id)
    setDeleteConfirm(null)
    await reload()
  }

  return (
    <div className="fade-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={S.sectionTitle}>Marks</div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>{tests.length} tests · Click a test to enter marks</div>
        </div>
        <button style={S.btn} onClick={() => setShowCreateTest(true)}>+ Create Test</button>
      </div>

      <select style={{ ...S.inp, maxWidth: 240, marginBottom: 20 }} value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
        <option value="">All Batches</option>
        {batches.map((b: Batch) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>

      {batchTests.length === 0 ? (
        <div style={{ ...S.card, textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📝</div>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>No tests yet</div>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>Create your first test to start entering marks</div>
          <button style={S.btn} onClick={() => setShowCreateTest(true)}>+ Create Test</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {batchTests.map((t: Test) => {
            const testMarks = marks.filter((m: Mark) => m.test_id === t.id)
            const avg = testMarks.length > 0
              ? (testMarks.reduce((s: number, m: Mark) => s + m.score, 0) / testMarks.length).toFixed(1)
              : null
            const batchName = batches.find((b: Batch) => b.id === t.batch_id)?.name || '—'
            return (
              <div key={t.id} style={{ ...S.card, cursor: 'pointer', borderTop: '3px solid #1C5D3B', transition: 'transform 0.15s, box-shadow 0.15s' }}
                onClick={() => openMarks(t)}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(28,93,59,0.12)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 700, color: '#0f172a', flex: 1, marginRight: 8 }}>{t.name}</div>
                  <span style={S.badge('#92400e', '#fef3c7')}>{t.test_type}</span>
                </div>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>{t.subject} · {batchName}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: '#374151' }}>Total: <strong>{t.total_marks}</strong> marks</span>
                  {avg
                    ? <span style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>Avg: {avg}</span>
                    : <span style={{ fontSize: 12, color: '#9ca3af' }}>No marks yet</span>}
                </div>
                {t.test_date && (
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>
                    📅 {new Date(t.test_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>{testMarks.length} students marked</span>
                  <button style={S.btnDanger} onClick={e => { e.stopPropagation(); setDeleteConfirm(t) }}>Delete</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Test Modal */}
      {showCreateTest && (
        <div style={S.modalBg} onClick={e => { if (e.target === e.currentTarget) setShowCreateTest(false) }}>
          <div style={S.modal} className="modal-inner">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Create Test</h2>
              <button onClick={() => setShowCreateTest(false)} style={{ width: 32, height: 32, borderRadius: 8, background: '#f1f5f9', border: 'none', cursor: 'pointer', fontSize: 16, color: '#64748b' }}>✕</button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={S.label}>Test Name *</label>
                  <input style={S.inp} placeholder="e.g. Unit Test 1" value={testForm.name} onChange={e => setTestForm({ ...testForm, name: e.target.value })} />
                </div>
                <div>
                  <label style={S.label}>Batch *</label>
                  <select style={S.inp} value={testForm.batch_id} onChange={e => setTestForm({ ...testForm, batch_id: e.target.value })}>
                    <option value="">Select batch</option>
                    {batches.map((b: Batch) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Subject *</label>
                  <select style={S.inp} value={testForm.subject} onChange={e => setTestForm({ ...testForm, subject: e.target.value })}>
                    <option value="">Select subject</option>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Test Type</label>
                  <select style={S.inp} value={testForm.test_type} onChange={e => setTestForm({ ...testForm, test_type: e.target.value })}>
                    {TEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Total Marks</label>
                  <input style={S.inp} type="number" value={testForm.total_marks} onChange={e => setTestForm({ ...testForm, total_marks: e.target.value })} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={S.label}>Test Date</label>
                  <input style={S.inp} type="date" value={testForm.test_date} onChange={e => setTestForm({ ...testForm, test_date: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                <button style={S.btnGhost} onClick={() => setShowCreateTest(false)}>Cancel</button>
                <button style={S.btn} onClick={handleCreateTest} disabled={saving}>{saving ? 'Creating...' : 'Create Test'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enter Marks Modal */}
      {showMarks && selectedTest && (
        <div style={S.modalBg} onClick={e => { if (e.target === e.currentTarget) setShowMarks(false) }}>
          <div style={S.modal} className="modal-inner">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{selectedTest.name}</h2>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{selectedTest.subject} · Total: {selectedTest.total_marks} marks</div>
              </div>
              <button onClick={() => setShowMarks(false)} style={{ width: 32, height: 32, borderRadius: 8, background: '#f1f5f9', border: 'none', cursor: 'pointer', fontSize: 16, color: '#64748b' }}>✕</button>
            </div>
            <div style={{ padding: 24 }}>
              {testStudents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#6b7280', fontSize: 14 }}>No active students in this batch</div>
              ) : testStudents.map((s: Student, i: number) => {
                const score = Number(marksForm[s.id] || 0)
                const grade = gradeFromScore(score, selectedTest.total_marks)
                const [gc, gb] = gradeColor(grade)
                const pct = Math.round((score / selectedTest.total_marks) * 100)
                return (
                  <div key={s.id} style={{ padding: '12px 0', borderBottom: i < testStudents.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#166534', flexShrink: 0 }}>
                        {((s.profiles as any)?.name || '?')[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{(s.profiles as any)?.name || '—'}</div>
                      <input style={{ ...S.inp, width: 80, textAlign: 'center', padding: '8px' }} type="number" min={0} max={selectedTest.total_marks}
                        value={marksForm[s.id] || ''}
                        onChange={e => setMarksForm({ ...marksForm, [s.id]: e.target.value })} />
                      <span style={{ ...S.badge(gc, gb), minWidth: 36, justifyContent: 'center' }}>{grade}</span>
                    </div>
                    {marksForm[s.id] && (
                      <div style={{ marginLeft: 44 }}>
                        <div style={{ background: '#f1f5f9', borderRadius: 3, height: 4, overflow: 'hidden' }}>
                          <div style={{ height: 4, borderRadius: 3, width: `${pct}%`, background: gc, transition: 'width 0.3s ease' }} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                <button style={S.btnGhost} onClick={() => setShowMarks(false)}>Cancel</button>
                <button style={S.btn} onClick={handleSaveMarks} disabled={saving}>{saving ? 'Saving...' : 'Save Marks'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div style={S.modalBg}>
          <div style={{ ...S.modal, maxWidth: 400 }} className="modal-inner">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Delete Test?</h2>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ color: '#4b5563', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                This will permanently delete <strong>{deleteConfirm.name}</strong> and all marks recorded for it. This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button style={S.btnGhost} onClick={() => setDeleteConfirm(null)}>Cancel</button>
                <button style={{ ...S.btn, background: '#dc2626' }} onClick={() => handleDeleteTest(deleteConfirm)}>Delete Test</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}