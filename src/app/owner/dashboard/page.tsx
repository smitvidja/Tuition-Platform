'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// ─── TYPES ───────────────────────────────────────────────
interface Profile { id: string; name: string; email: string; phone?: string; role: string }
interface Batch { id: string; name: string; subject: string; schedule: string; created_at: string }
interface Student { id: string; user_id: string; parent_id: string; batch_id: string; roll_no: string; date_of_birth: string; address: string; is_active: boolean; profiles?: Profile }
interface Test { id: string; batch_id: string; name: string; subject: string; total_marks: number; test_type: string; test_date: string }
interface Mark { id: string; student_id: string; test_id: string; subject: string; score: number; graded_by: string }
interface Material { id: string; title: string; subject: string; batch_id: string; file_url: string; file_type: string; uploaded_at: string }
interface Notification { id: string; from_id: string; to_id: string; message: string; type: string; sent_at: string }
interface Fee { id: string; student_id: string; amount_paid: number; total_fees: number; payment_date: string; payment_mode: string; note: string }
interface Assistant { id: string; name: string; email: string; phone?: string }

// ─── STYLES ──────────────────────────────────────────────
const S = {
  page: { minHeight: '100vh', background: '#FAFAF8', fontFamily: "'DM Sans', sans-serif" } as React.CSSProperties,
  nav: { position: 'sticky' as const, top: 0, zIndex: 100, background: 'rgba(250,250,248,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(26,58,92,0.08)', padding: '0 24px' },
  navInner: { maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 },
  logo: { fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: '#1A3A5C' },
  card: { background: '#fff', border: '1px solid rgba(26,58,92,0.08)', borderRadius: 4, padding: 24 },
  statCard: { background: '#fff', border: '1px solid rgba(26,58,92,0.08)', borderRadius: 4, padding: 24 },
  btn: { background: '#1A3A5C', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 3, fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 500, cursor: 'pointer' },
  btnGreen: { background: '#1C5D3B', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 3, fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 500, cursor: 'pointer' },
  btnGhost: { background: 'transparent', color: '#1A3A5C', border: '1.5px solid rgba(26,58,92,0.2)', padding: '9px 18px', borderRadius: 3, fontFamily: "'DM Sans',sans-serif", fontSize: 14, cursor: 'pointer' },
  btnDanger: { background: '#8B1A1A', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 3, fontFamily: "'DM Sans',sans-serif", fontSize: 13, cursor: 'pointer' },
  inp: { width: '100%', padding: '10px 12px', border: '1.5px solid rgba(26,58,92,0.2)', borderRadius: 3, fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: 'none', background: '#fff', color: '#1A2332' },
  label: { fontSize: 13, fontWeight: 500, color: '#4A5568', display: 'block', marginBottom: 6 },
  modalBg: { position: 'fixed' as const, inset: 0, background: 'rgba(15,24,40,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { background: '#fff', borderRadius: 4, padding: 32, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' as const, borderTop: '3px solid #1A3A5C' },
  sectionTitle: { fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, color: '#1A2332', marginBottom: 4 },
  badge: (color: string, bg: string) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 3, fontSize: 12, fontWeight: 500, color, background: bg }),
}

const SUBJECTS = ['Mathematics','Physics','Chemistry','Biology','English','Hindi','Social Science','Computer Science','Accounts','Economics','Other']
const BATCH_SUBJECT_OPTIONS = ['All subjects', 'Other']
const TEST_TYPES = ['unit','weekly','quarterly','midterm','final']
const PAYMENT_MODES = ['cash','upi','bank transfer','cheque','card']
const NOTIF_TYPES = ['general','exam','attendance','marks','holiday','warning']
const FILE_TYPES = ['pdf','video','image','doc','other']
const SCHEDULE_PRESETS = ['Mon-Wed-Fri 7:00-8:30 AM','Tue-Thu-Sat 7:00-8:30 AM','Mon-Wed-Fri 4:00-5:30 PM','Tue-Thu-Sat 4:00-5:30 PM','Daily 7:00-8:00 AM','Daily 4:00-5:00 PM','Sat-Sun 9:00-11:00 AM']

function gradeFromScore(score: number, total: number) {
  const pct = (score / total) * 100
  if (pct >= 90) return 'A+'
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B+'
  if (pct >= 60) return 'B'
  if (pct >= 40) return 'C'
  return 'F'
}

function gradeColor(grade: string) {
  const map: Record<string, [string, string]> = {
    'A+': ['#1C5D3B','#E6F4ED'], 'A': ['#1C5D3B','#E6F4ED'],
    'B+': ['#4A3500','#FBF3E2'], 'B': ['#4A3500','#FBF3E2'],
    'C': ['#0F4C75','#E8F0F9'], 'F': ['#8B1A1A','#FEF2F2'],
  }
  return map[grade] || ['#4A5568','#F7F7F7']
}
// ─── MAIN COMPONENT ──────────────────────────────────────
export default function OwnerDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [activePage, setActivePage] = useState('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Data state
  const [students, setStudents] = useState<Student[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [marks, setMarks] = useState<Mark[]>([])
  const [tests, setTests] = useState<Test[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [fees, setFees] = useState<Fee[]>([])
  const [assistants, setAssistants] = useState<Assistant[]>([])
  const [parents, setParents] = useState<Profile[]>([])

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!prof || prof.role !== 'owner') { router.push('/'); return }
    setProfile(prof)
    await loadAllData()
    setLoading(false)
  }

  async function loadAllData() {
    const [
      { data: s }, { data: b }, { data: m }, { data: t },
      { data: mat }, { data: n }, { data: f }, { data: a }, { data: p }
    ] = await Promise.all([
      supabase.from('students').select('*, profiles!students_user_id_fkey(id,name,email,phone)'),
      supabase.from('batches').select('*'),
      supabase.from('marks').select('*'),
      supabase.from('tests').select('*'),
      supabase.from('study_materials').select('*'),
      supabase.from('notifications').select('*'),
      supabase.from('fees').select('*'),
      supabase.from('profiles').select('*').eq('role', 'assistant'),
      supabase.from('profiles').select('*').eq('role', 'parent'),
    ])
    if (s) setStudents(s)
    if (b) setBatches(b)
    if (m) setMarks(m)
    if (t) setTests(t)
    if (mat) setMaterials(mat)
    if (n) setNotifications(n)
    if (f) setFees(f)
    if (a) setAssistants(a)
    if (p) setParents(p)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '⊞' },
    { id: 'students', label: 'Students', icon: '👤' },
    { id: 'batches', label: 'Batches', icon: '📚' },
    { id: 'attendance', label: 'Attendance', icon: '✓' },
    { id: 'marks', label: 'Marks', icon: '📝' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'materials', label: 'Materials', icon: '📁' },
    { id: 'notifications', label: 'Notices', icon: '🔔' },
    { id: 'fees', label: 'Fees', icon: '💰' },
    { id: 'assistants', label: 'Faculty', icon: '👨‍🏫' },
  ]

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAF8' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 32, color: '#1A3A5C', marginBottom: 12 }}>SR Classes</div>
        <div style={{ color: '#718096', fontSize: 15 }}>Loading dashboard...</div>
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
        *{box-sizing:border-box;}
        input,select,textarea{font-family:'DM Sans',sans-serif;}
        input:focus,select:focus,textarea:focus{outline:none;border-color:#1A3A5C !important;}
        .nav-btn{background:none;border:none;cursor:pointer;padding:8px 14px;border-radius:3px;font-family:'DM Sans',sans-serif;font-size:14px;color:#4A5568;display:flex;align-items:center;gap:8px;transition:all 0.15s;white-space:nowrap;}
        .nav-btn:hover{background:rgba(26,58,92,0.06);color:#1A3A5C;}
        .nav-btn.active{background:#E8F0F9;color:#1A3A5C;font-weight:600;}
        .row:hover{background:#F7F9FC !important;}
        .action-tile{background:#fff;border:1px solid rgba(26,58,92,0.08);border-radius:4px;padding:20px;cursor:pointer;transition:all 0.2s;text-align:center;}
        .action-tile:hover{border-color:#1A3A5C;background:#E8F0F9;transform:translateY(-2px);}
        .mob-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:998;}
        .mob-drawer{position:fixed;top:0;left:0;bottom:0;width:260px;background:#fff;z-index:999;padding:20px;overflow-y:auto;box-shadow:4px 0 24px rgba(0,0,0,0.1);}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .fade-up{animation:fadeUp 0.4s ease forwards;}
        @media(max-width:900px){.desktop-nav{display:none !important;}.ham-btn{display:flex !important;}}
        @media(max-width:768px){.stats-grid{grid-template-columns:1fr 1fr !important;}.two-col{grid-template-columns:1fr !important;}.modal-inner{position:fixed;bottom:0;left:0;right:0;max-width:100% !important;border-radius:12px 12px 0 0;max-height:85vh;}.add-student-modal{position:relative !important;bottom:auto !important;left:auto !important;right:auto !important;max-width:900px !important;max-height:calc(100vh - 72px) !important;border-radius:4px !important;}}
        @media(max-width:480px){.stats-grid{grid-template-columns:1fr !important;}}
      `}</style>

      {/* NAVBAR */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Hamburger */}
            <button className="ham-btn" onClick={() => setMobileMenuOpen(true)}
              style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', flexDirection: 'column', gap: 5, padding: 4 }}>
              <div style={{ width: 22, height: 2, background: '#1A3A5C' }} />
              <div style={{ width: 22, height: 2, background: '#1A3A5C' }} />
              <div style={{ width: 22, height: 2, background: '#1A3A5C' }} />
            </button>
            <div style={S.logo}>SR <span style={{ color: '#1C5D3B' }}>Classes</span></div>
          </div>
          {/* Desktop Nav */}
          <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 2, overflowX: 'auto' }}>
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
              <div style={{ fontSize: 12, color: '#718096' }}>Administrator</div>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {navItems.map(n => (
                <button key={n.id} onClick={() => { setActivePage(n.id); setMobileMenuOpen(false) }}
                  style={{ background: activePage === n.id ? '#E8F0F9' : '#F7F9FC', border: '1px solid rgba(26,58,92,0.08)', borderRadius: 4, padding: '12px 8px', cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{n.icon}</div>
                  <div style={{ fontSize: 11, color: '#1A2332', fontFamily: "'DM Sans',sans-serif" }}>{n.label}</div>
                </button>
              ))}
            </div>
            <button onClick={handleLogout} style={{ ...S.btnGhost, width: '100%', marginTop: 20 }}>Logout</button>
          </div>
        </>
      )}

      {/* PAGE CONTENT */}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px' }}>
        {activePage === 'dashboard' && <DashboardHome profile={profile} students={students} batches={batches} tests={tests} assistants={assistants} fees={fees} marks={marks} setActivePage={setActivePage} />}
        {activePage === 'students' && <StudentsPage students={students} batches={batches} reload={loadAllData} />}
        {activePage === 'batches' && <BatchesPage batches={batches} reload={loadAllData} />}
        {activePage === 'attendance' && <AttendancePage students={students} batches={batches} profile={profile} />}
        {activePage === 'marks' && <MarksPage students={students} batches={batches} tests={tests} marks={marks} profile={profile} reload={loadAllData} />}
        {activePage === 'analytics' && <AnalyticsPage students={students} batches={batches} tests={tests} marks={marks} />}
        {activePage === 'materials' && <MaterialsPage materials={materials} batches={batches} profile={profile} reload={loadAllData} />}
        {activePage === 'notifications' && <NotificationsPage notifications={notifications} parents={parents} profile={profile} reload={loadAllData} />}
        {activePage === 'fees' && <FeesPage fees={fees} students={students} batches={batches} profile={profile} reload={loadAllData} />}
        {activePage === 'assistants' && <AssistantsPage assistants={assistants} reload={loadAllData} />}
      </main>
    </div>
  )
}
// ─── DASHBOARD HOME ───────────────────────────────────────
function DashboardHome({ profile, students, batches, tests, assistants, fees, marks, setActivePage }: any) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'

  const totalCollected = fees.reduce((sum: number, f: Fee) => sum + (f.amount_paid || 0), 0)
  const totalPending = fees.reduce((sum: number, f: Fee) => sum + Math.max(0, (f.total_fees || 0) - (f.amount_paid || 0)), 0)

  const recentTests = [...tests].sort((a, b) => new Date(b.created_at || b.test_date).getTime() - new Date(a.created_at || a.test_date).getTime()).slice(0, 5)

  return (
    <div className="fade-up">
      {/* Hero Banner */}
      <div style={{ background: '#1A3A5C', borderRadius: 6, padding: '32px 36px', marginBottom: 28, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: 32, top: '50%', transform: 'translateY(-50%)', fontFamily: "'Fraunces',serif", fontSize: 120, fontWeight: 700, color: 'rgba(255,255,255,0.04)', lineHeight: 1, pointerEvents: 'none' }}>SR</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>{greeting}</div>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{profile?.name}</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>Administrator · SR Classes Ahmedabad</div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Students', value: students.length, icon: '👤', color: '#E8F0F9', textColor: '#1A3A5C' },
          { label: 'Active Batches', value: batches.length, icon: '📚', color: '#E6F4ED', textColor: '#1C5D3B' },
          { label: 'Tests Created', value: tests.length, icon: '📝', color: '#FBF3E2', textColor: '#4A3500' },
          { label: 'Faculty Members', value: assistants.length, icon: '👨‍🏫', color: '#E8F0F9', textColor: '#0F4C75' },
        ].map((s, i) => (
          <div key={i} style={{ ...S.statCard, borderTop: `3px solid ${s.textColor}` }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 32, fontWeight: 700, color: s.textColor }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#718096', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ ...S.card, marginBottom: 28 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#1A2332', marginBottom: 16 }}>Quick Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12 }}>
          {[
            { icon: '👤', label: 'Add Student', page: 'students' },
            { icon: '📚', label: 'New Batch', page: 'batches' },
            { icon: '✓', label: 'Attendance', page: 'attendance' },
            { icon: '📝', label: 'Add Marks', page: 'marks' },
            { icon: '💰', label: 'Record Fee', page: 'fees' },
            { icon: '🔔', label: 'Send Notice', page: 'notifications' },
          ].map((a, i) => (
            <div key={i} className="action-tile" onClick={() => setActivePage(a.page)}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{a.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#1A2332' }}>{a.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Recent Tests */}
        <div style={S.card}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1A2332', marginBottom: 16 }}>Recent Tests</div>
          {recentTests.length === 0 ? (
            <div style={{ color: '#718096', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>No tests yet</div>
          ) : recentTests.map((t: Test, i: number) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < recentTests.length - 1 ? '1px solid rgba(26,58,92,0.06)' : 'none' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#1A2332' }}>{t.name}</div>
                <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>{t.subject} · {batches.find((b: Batch) => b.id === t.batch_id)?.name || 'Unknown'}</div>
              </div>
              <span style={S.badge('#4A3500', '#FBF3E2')}>{t.test_type}</span>
            </div>
          ))}
        </div>

        {/* Fees Overview */}
        <div style={S.card}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1A2332', marginBottom: 16 }}>Fees Overview</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div style={{ background: '#E6F4ED', borderRadius: 4, padding: 16 }}>
              <div style={{ fontSize: 12, color: '#1C5D3B', marginBottom: 4 }}>Collected</div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 700, color: '#1C5D3B' }}>₹{totalCollected.toLocaleString()}</div>
            </div>
            <div style={{ background: '#FEF2F2', borderRadius: 4, padding: 16 }}>
              <div style={{ fontSize: 12, color: '#8B1A1A', marginBottom: 4 }}>Pending</div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 700, color: '#8B1A1A' }}>₹{totalPending.toLocaleString()}</div>
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#1A2332', marginBottom: 10 }}>Recent Payments</div>
          {fees.slice(-4).reverse().map((f: Fee, i: number) => {
            const student = students.find((s: Student) => s.id === f.student_id)
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 3 ? '1px solid rgba(26,58,92,0.06)' : 'none' }}>
                <div style={{ fontSize: 13, color: '#1A2332' }}>{(student?.profiles as any)?.name || 'Unknown'}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1C5D3B' }}>₹{f.amount_paid?.toLocaleString()}</div>
              </div>
            )
          })}
          {fees.length === 0 && <div style={{ color: '#718096', fontSize: 14, textAlign: 'center', padding: '16px 0' }}>No payments yet</div>}
        </div>
      </div>
    </div>
  )
}

// ─── STUDENTS PAGE ────────────────────────────────────────
function StudentsPage({ students, batches, reload }: any) {
  const [search, setSearch] = useState('')
  const [batchFilter, setBatchFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [deleting, setDeleting] = useState<Student | null>(null)
  const [editing, setEditing] = useState<Student | null>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', roll_no: '', batch_id: '', date_of_birth: '', address: '', parent_name: '', parent_email: '', parent_phone: '', parent_password: '' })
  const [editForm, setEditForm] = useState({ name: '', phone: '', roll_no: '', batch_id: '', date_of_birth: '', address: '', is_active: true })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const addStudentModalRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!showAdd) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (addStudentModalRef.current) addStudentModalRef.current.scrollTop = 0

    return () => { document.body.style.overflow = previousOverflow }
  }, [showAdd])

  const filtered = students.filter((s: Student) => {
    const name = (s.profiles as any)?.name?.toLowerCase() || ''
    const matchSearch = name.includes(search.toLowerCase()) || s.roll_no?.includes(search)
    const matchBatch = batchFilter === 'all' || s.batch_id === batchFilter
    return matchSearch && matchBatch
  })

  async function handleAdd() {
    if (!form.name || !form.email || !form.password || !form.parent_email || !form.parent_password) {
      setError('Please fill all required fields'); return
    }
    setSaving(true); setError('')
    const res = await fetch('/api/add-student', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const result = await res.json()
    if (result.success) {
      setShowAdd(false)
      setForm({ name: '', email: '', password: '', phone: '', roll_no: '', batch_id: '', date_of_birth: '', address: '', parent_name: '', parent_email: '', parent_phone: '', parent_password: '' })
      await reload()
    } else {
      setError(result.message || 'Failed to add student')
    }
    setSaving(false)
  }

  async function handleDelete(student: Student) {
    const { data: siblings } = await supabase.from('students').select('id').eq('parent_id', student.parent_id)
    const isOnlyChild = !siblings || siblings.length <= 1
    await supabase.from('students').delete().eq('id', student.id)
    if (isOnlyChild && student.parent_id) {
      await fetch('/api/delete-user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: student.user_id, parent_id: student.parent_id }) })
    } else {
      await fetch('/api/delete-user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: student.user_id }) })
    }
    setDeleting(null)
    await reload()
  }

  function openEdit(student: Student) {
    setEditing(student)
    setEditForm({
      name: (student.profiles as any)?.name || '',
      phone: (student.profiles as any)?.phone || '',
      roll_no: student.roll_no || '',
      batch_id: student.batch_id || '',
      date_of_birth: student.date_of_birth || '',
      address: student.address || '',
      is_active: student.is_active ?? true,
    })
  }

  async function handleUpdateStudent() {
    if (!editing || !editForm.name.trim()) return
    setSaving(true)
    await supabase
      .from('profiles')
      .update({ name: editForm.name.trim(), phone: editForm.phone.trim() || null })
      .eq('id', editing.user_id)
    await supabase
      .from('students')
      .update({
        roll_no: editForm.roll_no.trim() || null,
        batch_id: editForm.batch_id || null,
        date_of_birth: editForm.date_of_birth || null,
        address: editForm.address.trim() || null,
        is_active: editForm.is_active,
      })
      .eq('id', editing.id)
    setSaving(false)
    setEditing(null)
    await reload()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={S.sectionTitle}>Students</div>
          <div style={{ fontSize: 14, color: '#718096' }}>{students.length} total students</div>
        </div>
        <button style={S.btn} onClick={() => setShowAdd(true)}>+ Add Student</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input style={{ ...S.inp, maxWidth: 280 }} placeholder="Search by name or roll no..." value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ ...S.inp, maxWidth: 200 }} value={batchFilter} onChange={e => setBatchFilter(e.target.value)}>
          <option value="all">All Batches</option>
          {batches.map((b: Batch) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {/* Batch chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {batches.map((b: Batch) => (
          <span key={b.id} style={{ background: '#E8F0F9', color: '#1A3A5C', padding: '4px 12px', borderRadius: 3, fontSize: 13 }}>
            {b.name}: {students.filter((s: Student) => s.batch_id === b.id).length}
          </span>
        ))}
      </div>

      {/* Table */}
      <div style={S.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid rgba(26,58,92,0.08)' }}>
              {['Name', 'Roll No', 'Batch', 'Email', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#718096', fontSize: 14 }}>No students found</td></tr>
            ) : filtered.map((s: Student) => (
              <tr key={s.id} className="row" style={{ borderBottom: '1px solid rgba(26,58,92,0.05)' }}>
                <td style={{ padding: '12px' }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#1A2332' }}>{(s.profiles as any)?.name || '—'}</div>
                  <div style={{ fontSize: 12, color: '#718096' }}>{(s.profiles as any)?.phone || ''}</div>
                </td>
                <td style={{ padding: '12px', fontSize: 14, color: '#4A5568' }}>{s.roll_no || '—'}</td>
                <td style={{ padding: '12px' }}>
                  <span style={S.badge('#1A3A5C', '#E8F0F9')}>{batches.find((b: Batch) => b.id === s.batch_id)?.name || '—'}</span>
                </td>
                <td style={{ padding: '12px', fontSize: 13, color: '#4A5568' }}>{(s.profiles as any)?.email || '—'}</td>
                <td style={{ padding: '12px' }}>
                  <span style={s.is_active ? S.badge('#1C5D3B', '#E6F4ED') : S.badge('#8B1A1A', '#FEF2F2')}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={S.btnGhost} onClick={() => openEdit(s)}>Edit</button>
                    <button style={S.btnDanger} onClick={() => setDeleting(s)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Student Modal */}
      {showAdd && (
        <div
          style={{ ...S.modalBg, alignItems: 'flex-start', justifyContent: 'center', overflow: 'hidden', padding: '72px 16px 16px' }}
          onClick={e => { if (e.target === e.currentTarget) setShowAdd(false) }}
        >
          <div
            style={{
              ...S.modal,
              margin: 0,
              width: '100%',
              maxWidth: 900,
              maxHeight: 'calc(100vh - 88px)',
              overflowY: 'auto',
            }}
            ref={addStudentModalRef}
            className="modal-inner add-student-modal"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, color: '#1A2332' }}>Add New Student</div>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#718096' }}>✕</button>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1A3A5C', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              {[
                { label: 'Full Name *', key: 'name', type: 'text' },
                { label: 'Email *', key: 'email', type: 'email' },
                { label: 'Password *', key: 'password', type: 'password' },
                { label: 'Phone', key: 'phone', type: 'text' },
                { label: 'Roll No', key: 'roll_no', type: 'text' },
                { label: 'Date of Birth', key: 'date_of_birth', type: 'date' },
              ].map(f => (
                <div key={f.key}>
                  <label style={S.label}>{f.label}</label>
                  <input style={S.inp} type={f.type} value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Batch</label>
              <select style={S.inp} value={form.batch_id} onChange={e => setForm({ ...form, batch_id: e.target.value })}>
                <option value="">Select batch</option>
                {batches.map((b: Batch) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>Address</label>
              <textarea style={{ ...S.inp, height: 72, resize: 'vertical' }} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1A3A5C', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Parent / Guardian Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Parent Name', key: 'parent_name', type: 'text' },
                { label: 'Parent Phone', key: 'parent_phone', type: 'text' },
                { label: 'Parent Email *', key: 'parent_email', type: 'email' },
                { label: 'Parent Password *', key: 'parent_password', type: 'password' },
              ].map(f => (
                <div key={f.key}>
                  <label style={S.label}>{f.label}</label>
                  <input style={S.inp} type={f.type} value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                </div>
              ))}
            </div>
            {error && <div style={{ background: '#FEF2F2', color: '#8B1A1A', padding: '10px 14px', borderRadius: 3, fontSize: 13, marginBottom: 16 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button style={S.btnGhost} onClick={() => setShowAdd(false)}>Cancel</button>
              <button style={S.btn} onClick={handleAdd} disabled={saving}>{saving ? 'Adding...' : 'Add Student'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleting && (
        <div style={S.modalBg}>
          <div style={{ ...S.modal, maxWidth: 400 }} className="modal-inner">
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, color: '#1A2332', marginBottom: 12 }}>Delete Student?</div>
            <p style={{ color: '#4A5568', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              This will permanently delete <strong>{(deleting.profiles as any)?.name}</strong> and their attendance/marks records. If this is the parent&apos;s only child, the parent account will also be deleted.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button style={S.btnGhost} onClick={() => setDeleting(null)}>Cancel</button>
              <button style={S.btnDanger} onClick={() => handleDelete(deleting)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editing && (
        <div style={S.modalBg} onClick={e => { if (e.target === e.currentTarget) setEditing(null) }}>
          <div style={{ ...S.modal, maxWidth: 700 }} className="modal-inner">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, color: '#1A2332' }}>Edit Student</div>
              <button onClick={() => setEditing(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#718096' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={S.label}>Full Name *</label>
                <input style={S.inp} value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Phone</label>
                <input style={S.inp} value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Roll No</label>
                <input style={S.inp} value={editForm.roll_no} onChange={e => setEditForm({ ...editForm, roll_no: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Date of Birth</label>
                <input style={S.inp} type="date" value={editForm.date_of_birth} onChange={e => setEditForm({ ...editForm, date_of_birth: e.target.value })} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Batch</label>
              <select style={S.inp} value={editForm.batch_id} onChange={e => setEditForm({ ...editForm, batch_id: e.target.value })}>
                <option value="">Select batch</option>
                {batches.map((b: Batch) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Address</label>
              <textarea style={{ ...S.inp, height: 72, resize: 'vertical' }} value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ ...S.label, marginBottom: 8 }}>Status</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  style={editForm.is_active ? S.btnGreen : S.btnGhost}
                  onClick={() => setEditForm({ ...editForm, is_active: true })}
                >
                  Active
                </button>
                <button
                  type="button"
                  style={!editForm.is_active ? S.btnDanger : S.btnGhost}
                  onClick={() => setEditForm({ ...editForm, is_active: false })}
                >
                  Inactive
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button style={S.btnGhost} onClick={() => setEditing(null)}>Cancel</button>
              <button style={S.btn} onClick={handleUpdateStudent} disabled={saving}>{saving ? 'Updating...' : 'Update Student'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── BATCHES PAGE ─────────────────────────────────────────
function BatchesPage({ batches, reload }: any) {
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Batch | null>(null)
  const [deleting, setDeleting] = useState<Batch | null>(null)
  const [customSchedule, setCustomSchedule] = useState(false)
  const [subjectOption, setSubjectOption] = useState('')
  const [otherSubjectInput, setOtherSubjectInput] = useState('')
  const [otherSubjects, setOtherSubjects] = useState<string[]>([])
  const [form, setForm] = useState({ name: '', subject: '', schedule: '' })
  const [saving, setSaving] = useState(false)

  function openAdd() {
    setForm({ name: '', subject: '', schedule: '' })
    setSubjectOption('')
    setOtherSubjectInput('')
    setOtherSubjects([])
    setEditing(null)
    setShowAdd(true)
  }

  function openEdit(b: Batch) {
    setForm({ name: b.name, subject: b.subject, schedule: b.schedule })
    if (b.subject === 'All subjects') {
      setSubjectOption('All subjects')
      setOtherSubjects([])
    } else {
      setSubjectOption('Other')
      setOtherSubjects(b.subject.split(',').map(s => s.trim()).filter(Boolean))
    }
    setOtherSubjectInput('')
    setEditing(b)
    setShowAdd(true)
  }

  function addOtherSubject() {
    const next = otherSubjectInput.trim()
    if (!next) return
    if (otherSubjects.some(s => s.toLowerCase() === next.toLowerCase())) {
      setOtherSubjectInput('')
      return
    }
    const updated = [...otherSubjects, next]
    setOtherSubjects(updated)
    setOtherSubjectInput('')
    setForm({ ...form, subject: updated.join(', ') })
  }

  function removeOtherSubject(subjectToRemove: string) {
    const updated = otherSubjects.filter(s => s !== subjectToRemove)
    setOtherSubjects(updated)
    setForm({ ...form, subject: updated.join(', ') })
  }

  async function handleSave() {
    if (!form.name || !form.subject || !form.schedule) return
    setSaving(true)
    if (editing) {
      await supabase.from('batches').update(form).eq('id', editing.id)
    } else {
      await supabase.from('batches').insert(form)
    }
    await reload(); setShowAdd(false); setSaving(false)
  }

  async function handleDelete(b: Batch) {
    await supabase.from('batches').delete().eq('id', b.id)
    setDeleting(null); await reload()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={S.sectionTitle}>Batches</div>
          <div style={{ fontSize: 14, color: '#718096' }}>{batches.length} active batches</div>
        </div>
        <button style={S.btn} onClick={openAdd}>+ New Batch</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 20 }}>
        {batches.length === 0 ? (
          <div style={{ ...S.card, gridColumn: '1/-1', textAlign: 'center', padding: '48px', color: '#718096' }}>No batches yet. Create your first batch.</div>
        ) : batches.map((b: Batch) => (
          <div key={b.id} style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: '#1A2332' }}>{b.name}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={S.btnGhost} onClick={() => openEdit(b)}>Edit</button>
                <button style={S.btnDanger} onClick={() => setDeleting(b)}>Delete</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {b.subject.split(',').map(sub => sub.trim()).filter(Boolean).map(sub => (
                <span key={sub} style={S.badge('#1A3A5C', '#E8F0F9')}>{sub}</span>
              ))}
              <span style={S.badge('#4A3500', '#FBF3E2')}>{b.schedule}</span>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div style={S.modalBg} onClick={e => { if (e.target === e.currentTarget) setShowAdd(false) }}>
          <div style={S.modal} className="modal-inner">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700 }}>{editing ? 'Edit Batch' : 'New Batch'}</div>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Batch Name *</label>
              <input style={S.inp} placeholder="e.g. Class 10 Science A" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Subject *</label>
              <select
                style={S.inp}
                value={subjectOption}
                onChange={e => {
                  const value = e.target.value
                  setSubjectOption(value)
                  if (value === 'All subjects') {
                    setOtherSubjects([])
                    setOtherSubjectInput('')
                    setForm(prev => ({ ...prev, subject: 'All subjects' }))
                  }
                  if (value === 'Other') {
                    setForm(prev => ({
                      ...prev,
                      subject: otherSubjects.length > 0
                        ? otherSubjects.join(', ')
                        : (prev.subject === 'All subjects' ? '' : prev.subject),
                    }))
                  }
                }}
              >
                <option value="">Select subject</option>
                {BATCH_SUBJECT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {subjectOption === 'Other' && (
                <>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <input
                      style={S.inp}
                      placeholder="Enter subject name"
                      value={otherSubjectInput}
                      onChange={e => setOtherSubjectInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOtherSubject() } }}
                    />
                    <button type="button" style={S.btnGhost} onClick={addOtherSubject}>Add</button>
                  </div>
                  {otherSubjects.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                      {otherSubjects.map(s => (
                        <span key={s} style={{ ...S.badge('#1A3A5C', '#E8F0F9'), display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          {s}
                          <button
                            type="button"
                            onClick={() => removeOtherSubject(s)}
                            style={{ background: 'none', border: 'none', color: '#1A3A5C', cursor: 'pointer', padding: 0, fontSize: 13, lineHeight: 1 }}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={S.label}>Schedule *</label>
                <button onClick={() => setCustomSchedule(!customSchedule)} style={{ background: 'none', border: 'none', fontSize: 12, color: '#1A3A5C', cursor: 'pointer' }}>{customSchedule ? 'Use preset' : 'Custom'}</button>
              </div>
              {customSchedule ? (
                <input style={S.inp} placeholder="e.g. Mon-Fri 5:00-6:30 PM" value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })} />
              ) : (
                <select style={S.inp} value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })}>
                  <option value="">Select schedule</option>
                  {SCHEDULE_PRESETS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button style={S.btnGhost} onClick={() => setShowAdd(false)}>Cancel</button>
              <button style={S.btn} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Create Batch'}</button>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div style={S.modalBg}>
          <div style={{ ...S.modal, maxWidth: 400 }} className="modal-inner">
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Delete Batch?</div>
            <p style={{ color: '#4A5568', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>Delete <strong>{deleting.name}</strong>? Students in this batch will be unassigned.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button style={S.btnGhost} onClick={() => setDeleting(null)}>Cancel</button>
              <button style={S.btnDanger} onClick={() => handleDelete(deleting)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── ATTENDANCE PAGE ──────────────────────────────────────
function AttendancePage({ students, batches, profile }: any) {
  const [selectedBatch, setSelectedBatch] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [attendance, setAttendance] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const batchStudents = students.filter((s: Student) => s.batch_id === selectedBatch && s.is_active)

  useEffect(() => {
    if (selectedBatch && selectedDate) loadAttendance()
  }, [selectedBatch, selectedDate])

  async function loadAttendance() {
    const ids = batchStudents.map((s: Student) => s.id)
    if (ids.length === 0) return
    const { data } = await supabase.from('attendance').select('*').in('student_id', ids).eq('date', selectedDate)
    const map: Record<string, string> = {}
    data?.forEach((a: any) => { map[a.student_id] = a.status })
    setAttendance(map)
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
  }

  const present = batchStudents.filter((s: Student) => attendance[s.id] === 'present').length
  const absent = batchStudents.filter((s: Student) => attendance[s.id] === 'absent').length
  const late = batchStudents.filter((s: Student) => attendance[s.id] === 'late').length

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={S.sectionTitle}>Attendance</div>
        <div style={{ fontSize: 14, color: '#718096' }}>Mark daily attendance for each batch</div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <select style={{ ...S.inp, maxWidth: 240 }} value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
          <option value="">Select Batch</option>
          {batches.map((b: Batch) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <input style={{ ...S.inp, maxWidth: 180 }} type="date" value={selectedDate} max={new Date().toISOString().split('T')[0]} onChange={e => setSelectedDate(e.target.value)} />
      </div>

      {selectedBatch && (
        <>
          {/* Summary */}
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total', value: batchStudents.length, color: '#1A3A5C', bg: '#E8F0F9' },
              { label: 'Present', value: present, color: '#1C5D3B', bg: '#E6F4ED' },
              { label: 'Absent', value: absent, color: '#8B1A1A', bg: '#FEF2F2' },
              { label: 'Late', value: late, color: '#4A3500', bg: '#FBF3E2' },
            ].map((s, i) => (
              <div key={i} style={{ background: s.bg, borderRadius: 4, padding: '16px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Fraunces',serif", fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 13, color: s.color, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Mark All */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <span style={{ fontSize: 13, color: '#718096', alignSelf: 'center' }}>Mark all:</span>
            {['present', 'absent', 'late'].map(s => (
              <button key={s} onClick={() => markAll(s)} style={{ ...S.btnGhost, fontSize: 13, padding: '6px 14px', textTransform: 'capitalize' }}>{s}</button>
            ))}
          </div>

          {/* Students */}
          <div style={S.card}>
            {batchStudents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#718096' }}>No students in this batch</div>
            ) : batchStudents.map((s: Student, i: number) => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < batchStudents.length - 1 ? '1px solid rgba(26,58,92,0.06)' : 'none' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#1A2332' }}>{(s.profiles as any)?.name || '—'}</div>
                  <div style={{ fontSize: 12, color: '#718096' }}>Roll: {s.roll_no || '—'}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['present', 'absent', 'late'].map(status => (
                    <button key={status} onClick={() => setAttendance({ ...attendance, [s.id]: status })}
                      style={{
                        width: 36, height: 36, borderRadius: 3, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                        background: attendance[s.id] === status
                          ? status === 'present' ? '#1C5D3B' : status === 'absent' ? '#8B1A1A' : '#4A3500'
                          : 'rgba(26,58,92,0.06)',
                        color: attendance[s.id] === status ? '#fff' : '#718096',
                      }}>
                      {status[0].toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
            <button style={{ ...S.btn, background: saved ? '#1C5D3B' : '#1A3A5C', minWidth: 160 }} onClick={handleSave} disabled={saving}>
              {saved ? '✓ Attendance Saved' : saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── MARKS PAGE ───────────────────────────────────────────
function MarksPage({ students, batches, tests, marks, profile, reload }: any) {
  const [selectedTest, setSelectedTest] = useState<Test | null>(null)
  const [selectedBatch, setSelectedBatch] = useState('')
  const [showCreateTest, setShowCreateTest] = useState(false)
  const [showMarks, setShowMarks] = useState(false)
  const [testForm, setTestForm] = useState({ name: '', subject: '', total_marks: '100', test_type: 'unit', test_date: '', batch_id: '' })
  const [marksForm, setMarksForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

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
    await reload(); setShowCreateTest(false); setSaving(false)
    setTestForm({ name: '', subject: '', total_marks: '100', test_type: 'unit', test_date: '', batch_id: '' })
  }

  async function handleSaveMarks() {
    if (!selectedTest) return
    setSaving(true)
    const rows = testStudents.map((s: Student) => ({
      student_id: s.id, test_id: selectedTest.id,
      subject: selectedTest.subject, score: Number(marksForm[s.id] || 0),
      graded_by: profile?.id,
    }))
    await supabase.from('marks').upsert(rows, { onConflict: 'student_id,test_id,subject' })
    await reload(); setShowMarks(false); setSaving(false)
  }

  async function handleDeleteTest(t: Test) {
    await supabase.from('marks').delete().eq('test_id', t.id)
    await supabase.from('tests').delete().eq('id', t.id)
    await reload()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={S.sectionTitle}>Marks</div>
          <div style={{ fontSize: 14, color: '#718096' }}>{tests.length} tests created</div>
        </div>
        <button style={S.btn} onClick={() => setShowCreateTest(true)}>+ Create Test</button>
      </div>

      <select style={{ ...S.inp, maxWidth: 240, marginBottom: 20 }} value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
        <option value="">All Batches</option>
        {batches.map((b: Batch) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
        {batchTests.length === 0 ? (
          <div style={{ ...S.card, gridColumn: '1/-1', textAlign: 'center', padding: '48px', color: '#718096' }}>No tests yet. Create your first test.</div>
        ) : batchTests.map((t: Test) => {
          const testMarks = marks.filter((m: Mark) => m.test_id === t.id)
          const avg = testMarks.length > 0 ? (testMarks.reduce((s: number, m: Mark) => s + m.score, 0) / testMarks.length).toFixed(1) : null
          return (
            <div key={t.id} style={{ ...S.card, cursor: 'pointer', borderTop: '3px solid #1A3A5C' }} onClick={() => openMarks(t)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 700, color: '#1A2332' }}>{t.name}</div>
                <span style={S.badge('#4A3500', '#FBF3E2')}>{t.test_type}</span>
              </div>
              <div style={{ fontSize: 13, color: '#718096', marginBottom: 8 }}>{t.subject} · {batches.find((b: Batch) => b.id === t.batch_id)?.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, color: '#4A5568' }}>Total: {t.total_marks} marks</div>
                {avg && <div style={{ fontSize: 13, fontWeight: 500, color: '#1C5D3B' }}>Avg: {avg}</div>}
              </div>
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                <button style={S.btnDanger} onClick={e => { e.stopPropagation(); handleDeleteTest(t) }}>Delete</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Create Test Modal */}
      {showCreateTest && (
        <div style={S.modalBg} onClick={e => { if (e.target === e.currentTarget) setShowCreateTest(false) }}>
          <div style={S.modal} className="modal-inner">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700 }}>Create Test</div>
              <button onClick={() => setShowCreateTest(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
      )}

      {/* Enter Marks Modal */}
      {showMarks && selectedTest && (
        <div style={S.modalBg} onClick={e => { if (e.target === e.currentTarget) setShowMarks(false) }}>
          <div style={S.modal} className="modal-inner">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700 }}>{selectedTest.name}</div>
              <button onClick={() => setShowMarks(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ fontSize: 13, color: '#718096', marginBottom: 20 }}>{selectedTest.subject} · Total: {selectedTest.total_marks} marks</div>
            {testStudents.map((s: Student) => {
              const score = Number(marksForm[s.id] || 0)
              const grade = gradeFromScore(score, selectedTest.total_marks)
              const [gc, gb] = gradeColor(grade)
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(26,58,92,0.06)' }}>
                  <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#1A2332' }}>{(s.profiles as any)?.name || '—'}</div>
                  <input style={{ ...S.inp, width: 80, textAlign: 'center' }} type="number" min={0} max={selectedTest.total_marks}
                    value={marksForm[s.id] || ''} onChange={e => setMarksForm({ ...marksForm, [s.id]: e.target.value })} />
                  <span style={{ ...S.badge(gc, gb), minWidth: 32, textAlign: 'center' }}>{grade}</span>
                </div>
              )
            })}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
              <button style={S.btnGhost} onClick={() => setShowMarks(false)}>Cancel</button>
              <button style={S.btn} onClick={handleSaveMarks} disabled={saving}>{saving ? 'Saving...' : 'Save Marks'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── ANALYTICS PAGE ───────────────────────────────────────
function AnalyticsPage({ students, batches, tests, marks }: any) {
  const [selectedBatch, setSelectedBatch] = useState('')

  const batchStudents = students.filter((s: Student) => !selectedBatch || s.batch_id === selectedBatch)
  const batchTests = tests.filter((t: Test) => !selectedBatch || t.batch_id === selectedBatch)
  const batchMarks = marks.filter((m: Mark) => batchStudents.some((s: Student) => s.id === m.student_id))

  const avgScore = batchMarks.length > 0 ? (batchMarks.reduce((s: number, m: Mark) => s + m.score, 0) / batchMarks.length).toFixed(1) : '—'

  const studentRankings = batchStudents.map((s: Student) => {
    const sm = batchMarks.filter((m: Mark) => m.student_id === s.id)
    const avg = sm.length > 0 ? sm.reduce((a: number, m: Mark) => a + m.score, 0) / sm.length : 0
    return { ...s, avg: avg.toFixed(1), count: sm.length }
  }).sort((a: any, b: any) => b.avg - a.avg)

  const subjectStats = SUBJECTS.map(sub => {
    const sm = batchMarks.filter((m: Mark) => m.subject === sub)
    if (sm.length === 0) return null
    const avg = sm.reduce((a: number, m: Mark) => a + m.score, 0) / sm.length
    return { subject: sub, avg: avg.toFixed(1), count: sm.length }
  }).filter(Boolean)

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={S.sectionTitle}>Analytics</div>
        <div style={{ fontSize: 14, color: '#718096' }}>Performance insights across batches</div>
      </div>

      <select style={{ ...S.inp, maxWidth: 240, marginBottom: 24 }} value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
        <option value="">All Batches</option>
        {batches.map((b: Batch) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Students', value: batchStudents.length, color: '#1A3A5C' },
          { label: 'Tests', value: batchTests.length, color: '#1C5D3B' },
          { label: 'Marks Recorded', value: batchMarks.length, color: '#4A3500' },
          { label: 'Average Score', value: avgScore, color: '#0F4C75' },
        ].map((s, i) => (
          <div key={i} style={S.statCard}>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#718096', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Student Rankings */}
        <div style={S.card}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1A2332', marginBottom: 16 }}>Student Rankings</div>
          {studentRankings.length === 0 ? (
            <div style={{ color: '#718096', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>No data yet</div>
          ) : studentRankings.slice(0, 10).map((s: any, i: number) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(26,58,92,0.05)' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: i < 3 ? '#1A3A5C' : '#E8F0F9', color: i < 3 ? '#fff' : '#1A3A5C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1, fontSize: 14, color: '#1A2332' }}>{(s.profiles as any)?.name || '—'}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1C5D3B' }}>{s.avg}</div>
            </div>
          ))}
        </div>

        {/* Subject Averages */}
        <div style={S.card}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1A2332', marginBottom: 16 }}>Subject Averages</div>
          {subjectStats.length === 0 ? (
            <div style={{ color: '#718096', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>No data yet</div>
          ) : (subjectStats as any[]).map((s, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: '#1A2332' }}>{s.subject}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1A3A5C' }}>{s.avg}</span>
              </div>
              <div style={{ background: '#E8F0F9', borderRadius: 2, height: 6 }}>
                <div style={{ background: '#1A3A5C', height: 6, borderRadius: 2, width: `${Math.min(100, (Number(s.avg) / 100) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── MATERIALS PAGE ───────────────────────────────────────
function MaterialsPage({ materials, batches, profile, reload }: any) {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title: '', subject: '', batch_id: '', file_url: '', file_type: 'pdf' })
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    if (!form.title || !form.subject) return
    setSaving(true)
    await supabase.from('study_materials').insert({ ...form, uploaded_by: profile?.id, batch_id: form.batch_id || null })
    await reload(); setShowAdd(false); setSaving(false)
    setForm({ title: '', subject: '', batch_id: '', file_url: '', file_type: 'pdf' })
  }

  async function handleDelete(id: string) {
    await supabase.from('study_materials').delete().eq('id', id)
    await reload()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={S.sectionTitle}>Study Materials</div>
          <div style={{ fontSize: 14, color: '#718096' }}>{materials.length} materials uploaded</div>
        </div>
        <button style={S.btn} onClick={() => setShowAdd(true)}>+ Add Material</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
        {materials.length === 0 ? (
          <div style={{ ...S.card, gridColumn: '1/-1', textAlign: 'center', padding: '48px', color: '#718096' }}>No materials yet. Add your first study material.</div>
        ) : materials.map((m: Material) => (
          <div key={m.id} style={S.card}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ background: '#E8F0F9', color: '#1A3A5C', borderRadius: 3, padding: '8px 10px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', flexShrink: 0 }}>{m.file_type}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1A2332', marginBottom: 4 }}>{m.title}</div>
                <div style={{ fontSize: 12, color: '#718096' }}>{m.subject} · {batches.find((b: Batch) => b.id === m.batch_id)?.name || 'All Batches'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {m.file_url && <a href={m.file_url} target="_blank" rel="noopener noreferrer" style={{ ...S.btnGhost, fontSize: 13, textDecoration: 'none', padding: '7px 14px' }}>Download</a>}
              <button style={S.btnDanger} onClick={() => handleDelete(m.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div style={S.modalBg} onClick={e => { if (e.target === e.currentTarget) setShowAdd(false) }}>
          <div style={S.modal} className="modal-inner">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700 }}>Add Material</div>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            {[
              { label: 'Title *', key: 'title', type: 'text' },
              { label: 'File URL (Google Drive / Dropbox)', key: 'file_url', type: 'url' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <label style={S.label}>{f.label}</label>
                <input style={S.inp} type={f.type} value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={S.label}>Subject *</label>
                <select style={S.inp} value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}>
                  <option value="">Select</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>File Type</label>
                <select style={S.inp} value={form.file_type} onChange={e => setForm({ ...form, file_type: e.target.value })}>
                  {FILE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={S.label}>Batch (leave empty for all batches)</label>
              <select style={S.inp} value={form.batch_id} onChange={e => setForm({ ...form, batch_id: e.target.value })}>
                <option value="">All Batches</option>
                {batches.map((b: Batch) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button style={S.btnGhost} onClick={() => setShowAdd(false)}>Cancel</button>
              <button style={S.btn} onClick={handleAdd} disabled={saving}>{saving ? 'Adding...' : 'Add Material'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── NOTIFICATIONS PAGE ───────────────────────────────────
function NotificationsPage({ notifications, parents, profile, reload }: any) {
  const [form, setForm] = useState({ to_id: 'all', message: '', type: 'general' })
  const [saving, setSaving] = useState(false)

  const templates = [
    'Reminder: Fees due this month. Please clear dues at the earliest.',
    'Test scheduled for next week. Please ensure your ward is prepared.',
    'Holiday notice: Classes will remain closed on the upcoming holiday.',
    'Attendance alert: Your ward\'s attendance is below 75%. Please note.',
    'Results declared. Please check the marks on the parent portal.',
  ]

  async function handleSend() {
    if (!form.message) return
    setSaving(true)
    if (form.to_id === 'all') {
      const rows = parents.map((p: Profile) => ({ from_id: profile?.id, to_id: p.id, message: form.message, type: form.type }))
      if (rows.length > 0) await supabase.from('notifications').insert(rows)
    } else {
      await supabase.from('notifications').insert({ from_id: profile?.id, to_id: form.to_id, message: form.message, type: form.type })
    }
    await reload()
    setForm({ to_id: 'all', message: '', type: 'general' })
    setSaving(false)
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={S.sectionTitle}>Notifications</div>
        <div style={{ fontSize: 14, color: '#718096' }}>Send notices to parents</div>
      </div>

      <div className="two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Compose */}
        <div style={S.card}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1A2332', marginBottom: 16 }}>Compose Notice</div>
          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>Send To</label>
            <select style={S.inp} value={form.to_id} onChange={e => setForm({ ...form, to_id: e.target.value })}>
              <option value="all">All Parents</option>
              {parents.map((p: Profile) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>Type</label>
            <select style={S.inp} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              {NOTIF_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>Quick Templates</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {templates.map((t, i) => (
                <button key={i} onClick={() => setForm({ ...form, message: t })}
                  style={{ ...S.btnGhost, textAlign: 'left', fontSize: 12, padding: '8px 12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {t.substring(0, 60)}...
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>Message ({form.message.length}/500)</label>
            <textarea style={{ ...S.inp, height: 100, resize: 'vertical' }} maxLength={500} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Type your message here..." />
          </div>
          <button style={{ ...S.btn, width: '100%' }} onClick={handleSend} disabled={saving}>{saving ? 'Sending...' : 'Send Notification'}</button>
        </div>

        {/* History */}
        <div style={S.card}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1A2332', marginBottom: 16 }}>Sent History ({notifications.length})</div>
          <div style={{ maxHeight: 480, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ color: '#718096', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>No notifications sent yet</div>
            ) : [...notifications].reverse().map((n: Notification) => (
              <div key={n.id} style={{ borderLeft: '3px solid #1A3A5C', paddingLeft: 12, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={S.badge('#1A3A5C', '#E8F0F9')}>{n.type}</span>
                  <span style={{ fontSize: 12, color: '#718096' }}>{new Date(n.sent_at).toLocaleDateString()}</span>
                </div>
                <div style={{ fontSize: 13, color: '#1A2332', lineHeight: 1.5 }}>{n.message}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── FEES PAGE ────────────────────────────────────────────
function FeesPage({ fees, students, batches, profile, reload }: any) {
  const [search, setSearch] = useState('')
  const [batchFilter, setBatchFilter] = useState('all')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)
  const [form, setForm] = useState({ amount_paid: '', total_fees: '', payment_date: new Date().toISOString().split('T')[0], payment_mode: 'cash', note: '' })
  const [saving, setSaving] = useState(false)

  const totalCollected = fees.reduce((s: number, f: Fee) => s + (f.amount_paid || 0), 0)
  const totalPending = fees.reduce((s: number, f: Fee) => s + Math.max(0, (f.total_fees || 0) - (f.amount_paid || 0)), 0)

  const filtered = students.filter((s: Student) => {
    const name = (s.profiles as any)?.name?.toLowerCase() || ''
    const matchSearch = name.includes(search.toLowerCase())
    const matchBatch = batchFilter === 'all' || s.batch_id === batchFilter
    return matchSearch && matchBatch
  })

  function getStudentFees(studentId: string) { return fees.filter((f: Fee) => f.student_id === studentId) }
  function getStudentTotal(studentId: string) { return getStudentFees(studentId).reduce((s: number, f: Fee) => s + (f.amount_paid || 0), 0) }
  function getStudentTotalFees(studentId: string) { const f = getStudentFees(studentId); return f.length > 0 ? f[f.length - 1].total_fees || 0 : 0 }

  function feeStatus(studentId: string) {
    const paid = getStudentTotal(studentId)
    const total = getStudentTotalFees(studentId)
    if (total === 0) return { label: 'Not Set', color: '#718096', bg: '#F7F7F7' }
    if (paid >= total) return { label: 'Paid', color: '#1C5D3B', bg: '#E6F4ED' }
    if (paid > 0) return { label: 'Partial', color: '#4A3500', bg: '#FBF3E2' }
    return { label: 'Pending', color: '#8B1A1A', bg: '#FEF2F2' }
  }

  async function handleRecordPayment() {
    if (!selectedStudent || !form.amount_paid || !form.total_fees) return
    setSaving(true)
    await supabase.from('fees').insert({
      student_id: selectedStudent.id, amount_paid: Number(form.amount_paid),
      total_fees: Number(form.total_fees), payment_date: form.payment_date,
      payment_mode: form.payment_mode, note: form.note, recorded_by: profile?.id
    })
    await reload(); setShowPayment(false); setSaving(false)
    setForm({ amount_paid: '', total_fees: '', payment_date: new Date().toISOString().split('T')[0], payment_mode: 'cash', note: '' })
  }

  async function handleDeleteFee(id: string) {
    await supabase.from('fees').delete().eq('id', id)
    await reload()
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={S.sectionTitle}>Fees</div>
        <div style={{ fontSize: 14, color: '#718096' }}>Track and manage student fee payments</div>
      </div>

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Students', value: students.length, color: '#1A3A5C', bg: '#E8F0F9' },
          { label: 'Total Collected', value: `₹${totalCollected.toLocaleString()}`, color: '#1C5D3B', bg: '#E6F4ED' },
          { label: 'Total Pending', value: `₹${totalPending.toLocaleString()}`, color: '#8B1A1A', bg: '#FEF2F2' },
          { label: 'Payments Made', value: fees.length, color: '#4A3500', bg: '#FBF3E2' },
        ].map((s, i) => (
          <div key={i} style={{ ...S.statCard, background: s.bg }}>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: s.color, marginTop: 4, opacity: 0.8 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input style={{ ...S.inp, maxWidth: 280 }} placeholder="Search student..." value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ ...S.inp, maxWidth: 200 }} value={batchFilter} onChange={e => setBatchFilter(e.target.value)}>
          <option value="all">All Batches</option>
          {batches.map((b: Batch) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((s: Student) => {
          const paid = getStudentTotal(s.id)
          const total = getStudentTotalFees(s.id)
          const status = feeStatus(s.id)
          const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0
          const expanded = expandedStudent === s.id
          const studentFees = getStudentFees(s.id)

          return (
            <div key={s.id} style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#1A2332' }}>{(s.profiles as any)?.name || '—'}</div>
                    <div style={{ fontSize: 13, color: '#718096', marginTop: 2 }}>{batches.find((b: Batch) => b.id === s.batch_id)?.name || '—'}</div>
                  </div>
                  <span style={S.badge(status.color, status.bg)}>{status.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {total > 0 && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1C5D3B' }}>₹{paid.toLocaleString()} / ₹{total.toLocaleString()}</div>
                      <div style={{ background: '#E8F0F9', borderRadius: 2, height: 4, width: 120, marginTop: 4 }}>
                        <div style={{ background: '#1C5D3B', height: 4, borderRadius: 2, width: `${pct}%` }} />
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={S.btnGhost} onClick={() => { setExpandedStudent(expanded ? null : s.id) }}>{expanded ? 'Hide' : 'History'}</button>
                    <button style={S.btn} onClick={() => { setSelectedStudent(s); setShowPayment(true) }}>+ Payment</button>
                  </div>
                </div>
              </div>

              {expanded && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(26,58,92,0.08)' }}>
                  {studentFees.length === 0 ? (
                    <div style={{ fontSize: 13, color: '#718096' }}>No payments recorded yet</div>
                  ) : studentFees.map((f: Fee) => (
                    <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(26,58,92,0.05)' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#1C5D3B' }}>₹{f.amount_paid?.toLocaleString()}</div>
                        <div style={{ fontSize: 12, color: '#718096' }}>{f.payment_date} · {f.payment_mode}{f.note ? ` · ${f.note}` : ''}</div>
                      </div>
                      <button style={S.btnDanger} onClick={() => handleDeleteFee(f.id)}>Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showPayment && selectedStudent && (
        <div style={S.modalBg} onClick={e => { if (e.target === e.currentTarget) setShowPayment(false) }}>
          <div style={S.modal} className="modal-inner">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700 }}>Record Payment</div>
              <button onClick={() => setShowPayment(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ fontSize: 14, color: '#718096', marginBottom: 20 }}>Student: <strong style={{ color: '#1A2332' }}>{(selectedStudent.profiles as any)?.name}</strong></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Amount Paid *', key: 'amount_paid', type: 'number' },
                { label: 'Total Fees *', key: 'total_fees', type: 'number' },
                { label: 'Payment Date', key: 'payment_date', type: 'date' },
              ].map(f => (
                <div key={f.key} style={{ gridColumn: f.key === 'payment_date' ? '1' : 'auto' }}>
                  <label style={S.label}>{f.label}</label>
                  <input style={S.inp} type={f.type} value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                </div>
              ))}
              <div>
                <label style={S.label}>Payment Mode</label>
                <select style={S.inp} value={form.payment_mode} onChange={e => setForm({ ...form, payment_mode: e.target.value })}>
                  {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginTop: 12, marginBottom: 20 }}>
              <label style={S.label}>Note (optional)</label>
              <input style={S.inp} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="e.g. Monthly fee for April" />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button style={S.btnGhost} onClick={() => setShowPayment(false)}>Cancel</button>
              <button style={S.btnGreen} onClick={handleRecordPayment} disabled={saving}>{saving ? 'Saving...' : 'Record Payment'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── ASSISTANTS PAGE ──────────────────────────────────────
function AssistantsPage({ assistants, reload }: any) {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<Assistant | null>(null)
  const [editing, setEditing] = useState<Assistant | null>(null)
  const [editForm, setEditForm] = useState({ name: '', phone: '' })
  const todayKeyRef = useRef(new Date().toISOString().split('T')[0])
  const todayKey = todayKeyRef.current
  const [selectedStatusDate, setSelectedStatusDate] = useState(todayKey)
  const [facultyStatusByDate, setFacultyStatusByDate] = useState<Record<string, Record<string, 'present' | 'leave' | 'absent'>>>({})
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('faculty-status-history')
    if (stored) {
      try { setFacultyStatusByDate(JSON.parse(stored)) } catch { setFacultyStatusByDate({}) }
    } else {
      setFacultyStatusByDate({})
    }
  }, [])

  async function handleAdd() {
    if (!form.name || !form.email || !form.password) { setError('All fields required'); return }
    setSaving(true); setError('')
    const res = await fetch('/api/add-assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const result = await res.json()
    if (result.success) {
      setShowAdd(false); setForm({ name: '', email: '', password: '' }); await reload()
    } else { setError(result.message || 'Failed to add faculty') }
    setSaving(false)
  }

  async function handleDelete(a: Assistant) {
    await supabase.from('profiles').delete().eq('id', a.id)
    await fetch('/api/delete-user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: a.id }) })
    setDeleting(null); await reload()
  }

  function openEdit(a: Assistant) {
    setEditing(a)
    setEditForm({ name: a.name || '', phone: a.phone || '' })
  }

  async function handleUpdateAssistant() {
    if (!editing || !editForm.name.trim()) return
    setSaving(true)
    await supabase
      .from('profiles')
      .update({ name: editForm.name.trim(), phone: editForm.phone.trim() || null })
      .eq('id', editing.id)
    setSaving(false)
    setEditing(null)
    await reload()
  }

  function markFacultyStatus(id: string, status: 'present' | 'leave' | 'absent' | null) {
    const dayMap = { ...(facultyStatusByDate[selectedStatusDate] || {}) }
    if (status) dayMap[id] = status
    else delete dayMap[id]
    const updated = { ...facultyStatusByDate, [selectedStatusDate]: dayMap }
    setFacultyStatusByDate(updated)
    localStorage.setItem('faculty-status-history', JSON.stringify(updated))
  }

  const currentStatus = facultyStatusByDate[selectedStatusDate] || {}
  const presentCount = assistants.filter((a: Assistant) => currentStatus[a.id] === 'present').length
  const leaveCount = assistants.filter((a: Assistant) => currentStatus[a.id] === 'leave').length
  const absentCount = assistants.filter((a: Assistant) => currentStatus[a.id] === 'absent').length
  const unmarkedCount = Math.max(0, assistants.length - presentCount - leaveCount - absentCount)
  const nameById = Object.fromEntries(assistants.map((a: Assistant) => [a.id, a.name || a.email]))
  const historyRows = Object.entries(facultyStatusByDate)
    .flatMap(([date, day]) =>
      Object.entries(day).map(([assistantId, status]) => ({ date, assistantId, status }))
    )
    .sort((a, b) => b.date.localeCompare(a.date))

  const accessItems = [
    { label: 'Attendance', allowed: true },
    { label: 'Marks', allowed: true },
    { label: 'Fees', allowed: false },
    { label: 'Materials', allowed: false },
    { label: 'Notifications', allowed: false },
    { label: 'Analytics', allowed: false },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={S.sectionTitle}>Faculty</div>
          <div style={{ fontSize: 14, color: '#718096' }}>{assistants.length} faculty members</div>
        </div>
        <button style={S.btn} onClick={() => setShowAdd(true)}>+ Add Faculty</button>
      </div>

      <div style={{ background: '#E8F0F9', border: '1px solid rgba(26,58,92,0.15)', borderRadius: 4, padding: '14px 18px', marginBottom: 24, fontSize: 13, color: '#1A3A5C' }}>
        Faculty members can access Attendance and Marks only. Fees, Materials, Notifications and Analytics are restricted to the Owner.
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 12, flexWrap: 'wrap' }}>
        <div>
          <label style={S.label}>Status Date</label>
          <input
            type="date"
            style={{ ...S.inp, maxWidth: 200 }}
            value={selectedStatusDate}
            max={todayKey}
            onChange={e => setSelectedStatusDate(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(120px, 1fr))', gap: 12, marginBottom: 20, maxWidth: 700 }}>
        <div style={{ background: '#E6F4ED', borderRadius: 4, padding: 12 }}>
          <div style={{ fontSize: 12, color: '#1C5D3B' }}>Present</div>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, color: '#1C5D3B', fontWeight: 700 }}>{presentCount}</div>
        </div>
        <div style={{ background: '#FBF3E2', borderRadius: 4, padding: 12 }}>
          <div style={{ fontSize: 12, color: '#4A3500' }}>On Leave</div>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, color: '#4A3500', fontWeight: 700 }}>{leaveCount}</div>
        </div>
        <div style={{ background: '#FEF2F2', borderRadius: 4, padding: 12 }}>
          <div style={{ fontSize: 12, color: '#8B1A1A' }}>Absent</div>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, color: '#8B1A1A', fontWeight: 700 }}>{absentCount}</div>
        </div>
        <div style={{ background: '#F7F7F7', borderRadius: 4, padding: 12 }}>
          <div style={{ fontSize: 12, color: '#4A5568' }}>Not Marked</div>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, color: '#4A5568', fontWeight: 700 }}>{unmarkedCount}</div>
        </div>
      </div>

      <div style={{ ...S.card, marginBottom: 20 }}>
        <button
          onClick={() => setShowHistory(!showHistory)}
          style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1A2332' }}>Faculty Status History</div>
          <span style={{ fontSize: 13, color: '#1A3A5C' }}>{showHistory ? 'Hide ▲' : 'Show ▼'}</span>
        </button>
        {showHistory && (
          <div style={{ marginTop: 12 }}>
            {historyRows.length === 0 ? (
              <div style={{ fontSize: 13, color: '#718096' }}>No status records yet.</div>
            ) : (
              <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                {historyRows.map((row, i) => (
                  <div key={`${row.date}-${row.assistantId}-${i}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: i < historyRows.length - 1 ? '1px solid rgba(26,58,92,0.06)' : 'none' }}>
                    <div style={{ fontSize: 13, color: '#1A2332' }}>{nameById[row.assistantId] || 'Unknown faculty'}</div>
                    <div style={{ fontSize: 12, color: '#718096' }}>{row.date}</div>
                    <span style={row.status === 'present' ? S.badge('#1C5D3B', '#E6F4ED') : row.status === 'leave' ? S.badge('#4A3500', '#FBF3E2') : S.badge('#8B1A1A', '#FEF2F2')}>
                      {row.status === 'leave' ? 'On Leave' : row.status[0].toUpperCase() + row.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {assistants.length === 0 ? (
        <div style={{ ...S.card, textAlign: 'center', padding: '48px', color: '#718096' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>👨‍🏫</div>
          <div style={{ fontSize: 15, marginBottom: 8 }}>No faculty members yet</div>
          <button style={S.btn} onClick={() => setShowAdd(true)}>Add First Faculty Member</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 20 }}>
          {assistants.map((a: Assistant) => (
            <div key={a.id} style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: '#1A2332' }}>{a.name}</div>
                  <div style={{ fontSize: 13, color: '#718096', marginTop: 2 }}>{a.email}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={S.btnGhost} onClick={() => openEdit(a)}>Edit</button>
                  <button style={S.btnDanger} onClick={() => setDeleting(a)}>Delete</button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button
                  style={currentStatus[a.id] === 'present' ? S.btnGreen : S.btnGhost}
                  onClick={() => markFacultyStatus(a.id, 'present')}
                >
                  Present
                </button>
                <button
                  style={currentStatus[a.id] === 'leave' ? { ...S.btn, background: '#4A3500' } : S.btnGhost}
                  onClick={() => markFacultyStatus(a.id, 'leave')}
                >
                  On Leave
                </button>
                <button
                  style={currentStatus[a.id] === 'absent' ? S.btnDanger : S.btnGhost}
                  onClick={() => markFacultyStatus(a.id, 'absent')}
                >
                  Absent
                </button>
                <button
                  style={!currentStatus[a.id] ? S.btnGhost : { ...S.btnGhost, opacity: 0.75 }}
                  onClick={() => markFacultyStatus(a.id, null)}
                >
                  Clear
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {accessItems.map((item, i) => (
                  <span key={i} style={item.allowed ? S.badge('#1C5D3B', '#E6F4ED') : S.badge('#718096', '#F7F7F7')}>
                    {item.allowed ? '✓' : '✗'} {item.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div style={S.modalBg} onClick={e => { if (e.target === e.currentTarget) setShowAdd(false) }}>
          <div style={S.modal} className="modal-inner">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700 }}>Add Faculty Member</div>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            {[
              { label: 'Full Name *', key: 'name', type: 'text' },
              { label: 'Email *', key: 'email', type: 'email' },
              { label: 'Password *', key: 'password', type: 'password' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <label style={S.label}>{f.label}</label>
                <input style={S.inp} type={f.type} value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
              </div>
            ))}
            {error && <div style={{ background: '#FEF2F2', color: '#8B1A1A', padding: '10px 14px', borderRadius: 3, fontSize: 13, marginBottom: 16 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button style={S.btnGhost} onClick={() => setShowAdd(false)}>Cancel</button>
              <button style={S.btn} onClick={handleAdd} disabled={saving}>{saving ? 'Adding...' : 'Add Faculty'}</button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div style={S.modalBg} onClick={e => { if (e.target === e.currentTarget) setEditing(null) }}>
          <div style={{ ...S.modal, maxWidth: 460 }} className="modal-inner">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700 }}>Edit Faculty</div>
              <button onClick={() => setEditing(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Name *</label>
              <input style={S.inp} value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Phone</label>
              <input style={S.inp} value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>Email</label>
              <input style={{ ...S.inp, background: '#F7F7F7' }} value={editing.email} readOnly />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button style={S.btnGhost} onClick={() => setEditing(null)}>Cancel</button>
              <button style={S.btn} onClick={handleUpdateAssistant} disabled={saving}>{saving ? 'Updating...' : 'Update'}</button>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div style={S.modalBg}>
          <div style={{ ...S.modal, maxWidth: 400 }} className="modal-inner">
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Delete Faculty?</div>
            <p style={{ color: '#4A5568', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>This will permanently delete <strong>{deleting.name}</strong> and remove their access.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button style={S.btnGhost} onClick={() => setDeleting(null)}>Cancel</button>
              <button style={S.btnDanger} onClick={() => handleDelete(deleting)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}