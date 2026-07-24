import { useState, useEffect, useRef } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts"

// ─── Constants ────────────────────────────────────────────────────────────────
const TEAL      = "#0F6E56"
const TEAL_DARK = "#0A5240"
const TEAL_MID  = "#1A9070"
const TEAL_LIGHT = "#E6F4F0"
const TEAL_XL   = "#F0FAF7"
const TODAY     = "2026-07-20"

// ─── Types ────────────────────────────────────────────────────────────────────
type UserRole   = "Admin" | "TruongPhong" | "NhanVien"
type UserStatus = "active" | "locked"
type StatusKey  = "approved" | "pending" | "rejected"
type Tab = "overview" | "calendar" | "requests" | "create" | "report" | "users"

interface AppUser {
  id: number
  name: string
  username: string
  password: string
  email: string
  department: string
  role: UserRole
  status: UserStatus
}

interface Meeting {
  id: number
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  room: string
  organizerId: number
  status: "approved" | "pending" | "rejected"
  participants: number[]
  createdBy: number
  rejectReason?: string
}

interface Toast {
  id: number
  type: "success" | "error" | "info" | "warn"
  message: string
}

// ─── Seed users (login credentials) ──────────────────────────────────────────
const SEED_USERS: AppUser[] = [
  { id: 1, name: "Nguyễn Văn An",   username: "an.nguyen",   password: "123456", email: "an.nguyen@company.vn",   department: "Kinh doanh", role: "TruongPhong", status: "active" },
  { id: 2, name: "Trần Thị Bình",   username: "binh.tran",   password: "123456", email: "binh.tran@company.vn",   department: "Kinh doanh", role: "NhanVien",    status: "active" },
  { id: 3, name: "Lê Văn Cường",    username: "cuong.le",    password: "123456", email: "cuong.le@company.vn",    department: "Kinh doanh", role: "NhanVien",    status: "active" },
  { id: 4, name: "Phạm Thị Dung",   username: "dung.pham",   password: "123456", email: "dung.pham@company.vn",   department: "Kinh doanh", role: "NhanVien",    status: "locked" },
  { id: 5, name: "Hoàng Văn Em",    username: "em.hoang",    password: "123456", email: "em.hoang@company.vn",    department: "Kinh doanh", role: "NhanVien",    status: "active" },
  { id: 6, name: "Quản trị viên",   username: "admin",       password: "admin",  email: "admin@company.vn",       department: "IT",         role: "Admin",       status: "active" },
  { id: 7, name: "Vũ Thị Hoa",      username: "hoa.vu",      password: "123456", email: "hoa.vu@company.vn",      department: "Nhân sự",    role: "TruongPhong", status: "active" },
  { id: 8, name: "Đặng Văn Khoa",   username: "khoa.dang",   password: "123456", email: "khoa.dang@company.vn",   department: "Kế toán",    role: "NhanVien",    status: "active" },
]

// ─── Meeting seed data ────────────────────────────────────────────────────────
const SEED_MEETINGS: Meeting[] = [
  { id: 1,  title: "Họp giao ban tuần 30",              description: "Báo cáo tiến độ công việc tuần 30 và kế hoạch tuần tới",     date: "2026-07-22", startTime: "08:30", endTime: "09:30", room: "Phòng họp A", organizerId: 1, status: "approved", participants: [1,2,3,4,5], createdBy: 1 },
  { id: 2,  title: "Kế hoạch triển khai khách hàng X",  description: "Thảo luận phương án triển khai hợp đồng với khách hàng X",   date: "2026-07-23", startTime: "14:00", endTime: "15:00", room: "Phòng họp B", organizerId: 2, status: "pending",  participants: [2,3],       createdBy: 2 },
  { id: 3,  title: "Đào tạo sản phẩm Q3",               description: "Đào tạo nội bộ về dòng sản phẩm mới ra mắt quý 3",         date: "2026-07-24", startTime: "10:00", endTime: "11:30", room: "Phòng họp A", organizerId: 4, status: "pending",  participants: [4,5],       createdBy: 4 },
  { id: 4,  title: "Xử lý khiếu nại KH Y",              description: "Xử lý khiếu nại của khách hàng Y về tiến độ giao hàng",    date: "2026-07-15", startTime: "09:00", endTime: "10:00", room: "Phòng họp C", organizerId: 3, status: "approved", participants: [1,3],       createdBy: 3 },
  { id: 5,  title: "Đề xuất họp ngoài giờ",             description: "Yêu cầu họp gấp về sự cố hệ thống",                        date: "2026-07-21", startTime: "17:30", endTime: "18:00", room: "Phòng họp B", organizerId: 5, status: "rejected", participants: [5],         createdBy: 5, rejectReason: "Trùng lịch phòng họp, đề nghị dời sang sáng hôm sau" },
  { id: 6,  title: "Review chiến lược bán hàng Q3",     description: "Đánh giá kết quả tháng 6 và điều chỉnh chiến lược tháng 7", date: "2026-07-25", startTime: "13:30", endTime: "15:00", room: "Phòng họp A", organizerId: 1, status: "approved", participants: [1,2,3],     createdBy: 1 },
  { id: 7,  title: "Họp định kỳ với Ban Giám đốc",      description: "Báo cáo tình hình kinh doanh phòng Kinh doanh tháng 7",    date: "2026-07-28", startTime: "09:00", endTime: "10:30", room: "Phòng họp D", organizerId: 1, status: "pending",  participants: [1],         createdBy: 1 },
  { id: 8,  title: "Đàm phán hợp đồng đối tác mới",    description: "Trao đổi điều khoản hợp tác với đối tác Z",                date: "2026-07-29", startTime: "10:00", endTime: "11:00", room: "Phòng họp B", organizerId: 2, status: "pending",  participants: [2,4],       createdBy: 2 },
  { id: 9,  title: "Họp giao ban tuần 29",              description: "Báo cáo tiến độ và rà soát KPI tuần 29",                   date: "2026-07-14", startTime: "08:30", endTime: "09:30", room: "Phòng họp A", organizerId: 1, status: "approved", participants: [1,2,3,4,5], createdBy: 1 },
  { id: 10, title: "Sơ kết 6 tháng đầu năm",           description: "Đánh giá tổng thể hoạt động phòng kinh doanh H1/2026",     date: "2026-06-30", startTime: "14:00", endTime: "17:00", room: "Phòng họp D", organizerId: 1, status: "approved", participants: [1,2,3,4,5], createdBy: 1 },
  { id: 11, title: "Tuyển dụng nhân sự mới",            description: "Phỏng vấn ứng viên vị trí Chuyên viên Kinh doanh cấp cao", date: "2026-06-25", startTime: "09:00", endTime: "11:00", room: "Phòng họp C", organizerId: 1, status: "approved", participants: [1,3],       createdBy: 1 },
  { id: 12, title: "Triển khai hệ thống CRM",           description: "Hướng dẫn sử dụng hệ thống CRM mới cho toàn bộ phòng",    date: "2026-06-18", startTime: "10:00", endTime: "12:00", room: "Phòng họp A", organizerId: 4, status: "approved", participants: [1,2,3,4,5], createdBy: 4 },
  { id: 13, title: "Xin lịch họp đột xuất",             description: "Phản hồi khiếu nại gấp từ khách hàng VIP",                date: "2026-06-10", startTime: "16:00", endTime: "17:00", room: "Phòng họp B", organizerId: 3, status: "rejected", participants: [3,5],       createdBy: 3, rejectReason: "Ngoài giờ hành chính, không có phòng trống" },
  { id: 14, title: "Họp giao ban tháng 5",              description: "Đánh giá KPI tháng 5 và lên kế hoạch tháng 6",            date: "2026-05-29", startTime: "08:30", endTime: "10:00", room: "Phòng họp A", organizerId: 1, status: "approved", participants: [1,2,3,4,5], createdBy: 1 },
  { id: 15, title: "Workshop kỹ năng thuyết trình",     description: "Đào tạo kỹ năng mềm: thuyết trình và đàm phán hiệu quả",  date: "2026-05-20", startTime: "13:00", endTime: "17:00", room: "Phòng họp D", organizerId: 2, status: "approved", participants: [2,3,4,5],   createdBy: 2 },
]

const ROOMS       = ["Phòng họp A", "Phòng họp B", "Phòng họp C", "Phòng họp D"]
const DEPARTMENTS = ["Kinh doanh", "Nhân sự", "Kế toán", "IT", "Marketing", "Vận hành"]
const ROLE_LABEL: Record<UserRole, string>     = { Admin: "Quản trị viên", TruongPhong: "Trưởng phòng", NhanVien: "Nhân viên" }
const ROLE_COLOR: Record<UserRole, string>     = { Admin: "#7C3AED", TruongPhong: TEAL, NhanVien: "#374151" }
const ROLE_BG: Record<UserRole, string>        = { Admin: "#F5F3FF", TruongPhong: TEAL_LIGHT, NhanVien: "#F3F4F6" }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(d: string) {
  const [y, m, day] = d.split("-")
  return `${day}/${m}/${y}`
}
function fmtDateLong(d: string) {
  const days = ["Chủ nhật","Thứ Hai","Thứ Ba","Thứ Tư","Thứ Năm","Thứ Sáu","Thứ Bảy"]
  const dt = new Date(d + "T00:00:00")
  return `${days[dt.getDay()]}, ${fmtDate(d)}`
}
function duration(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = end.split(":").map(Number)
  const mins = (eh * 60 + em) - (sh * 60 + sm)
  if (mins < 60) return `${mins} phút`
  const h = Math.floor(mins / 60), m = mins % 60
  return m ? `${h}g${m}p` : `${h} giờ`
}
function initials(name: string) { return name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase() }

const STATUS_LABEL: Record<StatusKey, string> = { approved: "Đã duyệt", pending: "Chờ duyệt", rejected: "Từ chối" }
const STATUS_STYLE: Record<StatusKey, string> = {
  approved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  pending:  "bg-amber-50 text-amber-700 border border-amber-200",
  rejected: "bg-red-50 text-red-600 border border-red-200",
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: StatusKey }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_STYLE[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "approved" ? "bg-emerald-500" : status === "pending" ? "bg-amber-500" : "bg-red-500"}`} />
      {STATUS_LABEL[status]}
    </span>
  )
}

function Avatar({ name, size = 7 }: { name: string; size?: number }) {
  const palette = ["#0F6E56","#2563EB","#7C3AED","#DC2626","#D97706","#0891B2","#059669"]
  const idx = name.charCodeAt(0) % palette.length
  const px = size * 4
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold shrink-0"
      style={{ backgroundColor: palette[idx], width: px, height: px, fontSize: px * 0.38 }}
    >
      {initials(name)}
    </div>
  )
}

function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-2.5">
      <div className="text-4xl opacity-25">{icon}</div>
      <div className="text-sm font-medium text-gray-500">{title}</div>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
    </div>
  )
}

function TealBtn({ onClick, children, disabled, type = "button" }: { onClick?: () => void; children: React.ReactNode; disabled?: boolean; type?: "button" | "submit" }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className="px-3 py-1.5 text-xs text-white rounded-lg font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ backgroundColor: disabled ? "#9CA3AF" : TEAL }}
      onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLElement).style.backgroundColor = TEAL_DARK }}
      onMouseLeave={(e) => { if (!disabled) (e.currentTarget as HTMLElement).style.backgroundColor = TEAL }}
    >
      {children}
    </button>
  )
}

function OutlineBtn({ onClick, color = TEAL, children }: { onClick?: () => void; color?: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className="px-3 py-1.5 text-xs rounded-lg border font-medium transition-all"
      style={{ borderColor: color, color }}
      onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = color; el.style.color = "#fff" }}
      onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = ""; el.style.color = color }}
    >
      {children}
    </button>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────
const TOAST_STYLE = {
  success: { bg: TEAL,      icon: "✓" },
  error:   { bg: "#DC2626", icon: "✕" },
  info:    { bg: "#1E40AF", icon: "ℹ" },
  warn:    { bg: "#D97706", icon: "⚠" },
}

function Toaster({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const s = TOAST_STYLE[t.type]
        return (
          <div key={t.id} className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium max-w-sm" style={{ backgroundColor: s.bg, color: "#fff" }}>
            <span className="text-base">{s.icon}</span>
            <span className="flex-1">{t.message}</span>
            <button onClick={() => remove(t.id)} className="opacity-70 hover:opacity-100 text-base leading-none">&times;</button>
          </div>
        )
      })}
    </div>
  )
}

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const push = (type: Toast["type"], message: string) => {
    const id = Date.now() + Math.random()
    setToasts((p) => [...p, { id, type, message }])
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3800)
  }
  const remove = (id: number) => setToasts((p) => p.filter((t) => t.id !== id))
  return { toasts, remove, toast: { success: (m: string) => push("success", m), error: (m: string) => push("error", m), info: (m: string) => push("info", m), warn: (m: string) => push("warn", m) } }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function LoginScreen({ users, onLogin }: { users: AppUser[]; onLogin: (user: AppUser) => void }) {
  const [username, setUsername]     = useState("")
  const [password, setPassword]     = useState("")
  const [showPass, setShowPass]     = useState(false)
  const [errors, setErrors]         = useState<{ username?: string; password?: string; general?: string }>({})
  const [loading, setLoading]       = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

  const validate = () => {
    const e: typeof errors = {}
    if (!username.trim()) e.username = "Vui lòng nhập tên đăng nhập"
    if (!password)        e.password = "Vui lòng nhập mật khẩu"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setTimeout(() => {
      const user = users.find((u) => (u.username === username.trim() || u.email === username.trim()) && u.password === password)
      if (!user) {
        setErrors({ general: "Tên đăng nhập hoặc mật khẩu không đúng. Vui lòng thử lại." })
        setLoading(false)
        return
      }
      if (user.status === "locked") {
        setErrors({ general: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên." })
        setLoading(false)
        return
      }
      onLogin(user)
    }, 700)
  }

  const inCls = (field?: "username" | "password") =>
    `w-full border rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 transition-all ${
      field && errors[field] ? "border-red-300 bg-red-50/30 focus:ring-red-200" : "border-gray-200 focus:ring-teal-100 focus:border-teal-400"
    }`

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#F4F6F5" }}>
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 p-12" style={{ backgroundColor: TEAL }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <GridIcon />
          </div>
          <span className="text-white font-bold text-lg">MeetSync</span>
        </div>
        <div>
          <h1 className="text-white text-4xl font-bold leading-tight mb-4">
            Quản lý cuộc họp<br />thông minh & hiệu quả
          </h1>
          <p className="text-white/70 text-sm leading-relaxed">
            Hệ thống quản lý lịch họp nội bộ doanh nghiệp — duyệt nhanh, theo dõi dễ, báo cáo đầy đủ.
          </p>
        </div>
        {/* Feature chips */}
        <div className="space-y-3">
          {["Duyệt yêu cầu họp trực tuyến", "Phân công người tham gia linh hoạt", "Báo cáo thống kê chi tiết"].map((f) => (
            <div key={f} className="flex items-center gap-3 text-white/80 text-sm">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</div>
              {f}
            </div>
          ))}
        </div>
        <div className="text-white/40 text-xs">© 2026 MeetSync · Phiên bản 2.0</div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 justify-center mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: TEAL }}>
              <GridIcon />
            </div>
            <span className="font-bold text-gray-800 text-lg">MeetSync</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="mb-7">
              <h2 className="text-xl font-bold text-gray-800">Đăng nhập</h2>
              <p className="text-sm text-gray-400 mt-1">Nhập thông tin tài khoản để tiếp tục</p>
            </div>

            {/* Hint */}
            <div className="mb-5 rounded-xl px-4 py-3 text-xs leading-relaxed" style={{ backgroundColor: TEAL_XL, color: TEAL }}>
              <strong>Demo:</strong> admin / admin &nbsp;·&nbsp; an.nguyen / 123456 &nbsp;·&nbsp; binh.tran / 123456
            </div>

            {errors.general && (
              <div className="mb-4 rounded-xl px-4 py-3 text-sm text-red-700 bg-red-50 border border-red-100 flex items-start gap-2">
                <span className="mt-0.5">⚠</span> {errors.general}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tên đăng nhập</label>
                <input
                  type="text" value={username} onChange={(e) => { setUsername(e.target.value); setErrors({}) }}
                  placeholder="username hoặc email..."
                  autoComplete="username"
                  className={inCls("username")}
                />
                {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-600">Mật khẩu</label>
                  <button
                    type="button"
                    onClick={() => setForgotSent(true)}
                    className="text-xs hover:underline"
                    style={{ color: TEAL }}
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors({}) }}
                    placeholder="Nhập mật khẩu..."
                    autoComplete="current-password"
                    className={`${inCls("password")} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
              </div>

              {forgotSent && (
                <div className="rounded-xl px-4 py-3 text-xs" style={{ backgroundColor: TEAL_XL, color: TEAL }}>
                  ✓ Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn.
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-70"
                style={{ backgroundColor: TEAL }}
                onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.backgroundColor = TEAL_DARK }}
                onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.backgroundColor = TEAL }}
              >
                {loading ? <><Spinner /> Đang đăng nhập...</> : "Đăng nhập →"}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-5">
            Hệ thống quản lý cuộc họp nội bộ · Công ty ABC
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Tiny SVG icons ───────────────────────────────────────────────────────────
function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.95"/>
      <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.55"/>
      <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.55"/>
      <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.95"/>
    </svg>
  )
}
function EyeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5" style={{ width: 18, height: 18 }}>
      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
    </svg>
  )
}
function EyeOffIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, height: 18 }}>
      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd"/>
      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/>
    </svg>
  )
}
function Spinner() {
  return (
    <svg className="animate-spin" style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
      <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEETING DETAIL MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function DetailModal({ meeting, users, onClose }: { meeting: Meeting; users: AppUser[]; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [onClose])

  const organizer = users.find((u) => u.id === meeting.organizerId)
  const participantUsers = meeting.participants.map((pid) => users.find((u) => u.id === pid)).filter(Boolean) as AppUser[]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4">
          <div className="flex-1">
            <StatusPill status={meeting.status} />
            <h2 className="text-base font-semibold text-gray-800 mt-2 leading-snug">{meeting.title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none">&times;</button>
        </div>
        <div className="px-6 pb-4 grid grid-cols-2 gap-3">
          {[
            { label: "Ngày họp", value: fmtDateLong(meeting.date) },
            { label: "Thời gian", value: `${meeting.startTime} – ${meeting.endTime} (${duration(meeting.startTime, meeting.endTime)})` },
            { label: "Phòng họp", value: meeting.room },
            { label: "Người tổ chức", value: organizer?.name ?? `#${meeting.organizerId}` },
          ].map((item) => (
            <div key={item.label} className="bg-gray-50 rounded-lg px-3 py-2.5">
              <div className="text-xs text-gray-400 mb-0.5">{item.label}</div>
              <div className="text-sm text-gray-700 font-medium">{item.value}</div>
            </div>
          ))}
        </div>
        {meeting.description && (
          <div className="px-6 pb-4">
            <div className="text-xs text-gray-400 mb-1">Nội dung</div>
            <p className="text-sm text-gray-600 leading-relaxed">{meeting.description}</p>
          </div>
        )}
        {meeting.status === "rejected" && meeting.rejectReason && (
          <div className="mx-6 mb-4 rounded-lg px-3 py-2.5 bg-red-50 border border-red-100">
            <div className="text-xs text-red-500 font-medium mb-0.5">Lý do từ chối</div>
            <p className="text-sm text-red-700">{meeting.rejectReason}</p>
          </div>
        )}
        <div className="px-6 pb-5">
          <div className="text-xs text-gray-400 mb-2">Người tham gia ({participantUsers.length})</div>
          <div className="flex flex-wrap gap-2">
            {participantUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5">
                <Avatar name={u.name} size={5} />
                <span className="text-xs text-gray-700">{u.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 pb-5 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors">Đóng</button>
        </div>
      </div>
    </div>
  )
}

// ─── Assign Modal ─────────────────────────────────────────────────────────────
function AssignModal({ meeting, users, onClose, onSave }: { meeting: Meeting; users: AppUser[]; onClose: () => void; onSave: (ids: number[]) => void }) {
  const [selected, setSelected] = useState<number[]>(meeting.participants)
  const toggle = (id: number) => setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">Phân công người tham gia</h3>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[240px]">{meeting.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="px-5 py-3 max-h-64 overflow-y-auto space-y-1">
          {users.filter((u) => u.status === "active").map((u) => (
            <label key={u.id} className="flex items-center gap-3 cursor-pointer py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors">
              <input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggle(u.id)} className="w-4 h-4 rounded" style={{ accentColor: TEAL }} />
              <Avatar name={u.name} size={6} />
              <div className="flex-1">
                <div className="text-sm text-gray-700">{u.name}</div>
                <div className="text-xs text-gray-400">{ROLE_LABEL[u.role]}</div>
              </div>
              {selected.includes(u.id) && <span className="text-xs font-medium" style={{ color: TEAL }}>✓</span>}
            </label>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">Đã chọn {selected.length} người</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Hủy</button>
            <TealBtn onClick={() => { onSave(selected); onClose() }}>Lưu phân công</TealBtn>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Reject Modal ─────────────────────────────────────────────────────────────
function RejectModal({ meetingTitle, onClose, onConfirm }: { meetingTitle: string; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState("")
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-sm shrink-0">✕</div>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">Từ chối yêu cầu</h3>
            <p className="text-xs text-gray-400 truncate max-w-[280px]">{meetingTitle}</p>
          </div>
        </div>
        <div className="px-5 py-4">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Lý do từ chối</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Nhập lý do từ chối..." className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-700 resize-none h-24 focus:outline-none focus:ring-2 focus:ring-red-200" autoFocus />
          <div className="text-xs text-gray-400 text-right mt-1">{reason.length}/200</div>
        </div>
        <div className="px-5 pb-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Hủy</button>
          <button onClick={() => onConfirm(reason)} className="px-4 py-2 text-sm text-white rounded-lg bg-red-600 hover:bg-red-700 font-medium">Xác nhận từ chối</button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER MANAGEMENT TAB
// ═══════════════════════════════════════════════════════════════════════════════
const BLANK_USER_FORM = { name: "", username: "", password: "", confirmPassword: "", email: "", department: DEPARTMENTS[0], role: "NhanVien" as UserRole, status: "active" as UserStatus }

type UserForm = typeof BLANK_USER_FORM
type UserFormErrors = Partial<Record<keyof UserForm | "general", string>>

function UserModal({
  mode, initialData, onClose, onSave, existingUsers,
}: {
  mode: "add" | "edit"
  initialData?: AppUser
  onClose: () => void
  onSave: (data: Omit<AppUser, "id"> & { id?: number }) => void
  existingUsers: AppUser[]
}) {
  const [form, setForm] = useState<UserForm>(() =>
    mode === "edit" && initialData
      ? { name: initialData.name, username: initialData.username, password: "", confirmPassword: "", email: initialData.email, department: initialData.department, role: initialData.role, status: initialData.status }
      : { ...BLANK_USER_FORM }
  )
  const [errors, setErrors] = useState<UserFormErrors>({})
  const [showPass, setShowPass]   = useState(false)
  const [showPass2, setShowPass2] = useState(false)
  const [showReset, setShowReset] = useState(false)

  const set = (k: keyof UserForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((p) => ({ ...p, [k]: e.target.value }))
    setErrors((p) => ({ ...p, [k]: undefined }))
  }

  const validate = () => {
    const e: UserFormErrors = {}
    if (!form.name.trim())  e.name = "Vui lòng nhập họ tên"
    if (!form.email.trim()) e.email = "Vui lòng nhập email"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email không hợp lệ"
    if (!form.username.trim()) e.username = "Vui lòng nhập tên đăng nhập"
    else {
      const dup = existingUsers.find((u) => u.username === form.username.trim() && u.id !== initialData?.id)
      if (dup) e.username = "Tên đăng nhập đã tồn tại"
    }
    if (mode === "add" || (mode === "edit" && (form.password || showReset))) {
      if (!form.password) e.password = "Vui lòng nhập mật khẩu"
      else if (form.password.length < 6) e.password = "Mật khẩu tối thiểu 6 ký tự"
      if (form.password !== form.confirmPassword) e.confirmPassword = "Mật khẩu xác nhận không khớp"
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    onSave({
      id: initialData?.id,
      name: form.name.trim(),
      username: form.username.trim(),
      password: (mode === "add" || showReset) ? form.password : (initialData?.password ?? ""),
      email: form.email.trim(),
      department: form.department,
      role: form.role,
      status: form.status,
    })
    onClose()
  }

  const inputCls = (field: keyof UserFormErrors) =>
    `w-full border rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 transition-all ${
      errors[field] ? "border-red-300 bg-red-50/30 focus:ring-red-200" : "border-gray-200 focus:ring-teal-100 focus:border-teal-400"
    }`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h3 className="font-semibold text-gray-800">{mode === "add" ? "Thêm người dùng mới" : "Chỉnh sửa người dùng"}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{mode === "add" ? "Điền đầy đủ thông tin để tạo tài khoản" : `Cập nhật thông tin cho ${initialData?.name}`}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Name + Username */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Họ và tên *</label>
              <input type="text" value={form.name} onChange={set("name")} placeholder="Nguyễn Văn A" className={inputCls("name")} />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Tên đăng nhập *</label>
              <input type="text" value={form.username} onChange={set("username")} placeholder="a.nguyen" className={inputCls("username")} />
              {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email *</label>
            <input type="email" value={form.email} onChange={set("email")} placeholder="email@company.vn" className={inputCls("email")} />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          {/* Password section */}
          {mode === "add" ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Mật khẩu *</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={form.password} onChange={set("password")} placeholder="Tối thiểu 6 ký tự" className={`${inputCls("password")} pr-10`} />
                  <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">{showPass ? <EyeOffIcon /> : <EyeIcon />}</button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Xác nhận mật khẩu *</label>
                <div className="relative">
                  <input type={showPass2 ? "text" : "password"} value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="Nhập lại mật khẩu" className={`${inputCls("confirmPassword")} pr-10`} />
                  <button type="button" onClick={() => setShowPass2((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">{showPass2 ? <EyeOffIcon /> : <EyeIcon />}</button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mật khẩu</label>
                <button type="button" onClick={() => setShowReset((v) => !v)} className="text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors" style={{ borderColor: TEAL, color: TEAL }}
                  onMouseEnter={(e) => { const el = e.currentTarget; el.style.backgroundColor = TEAL; el.style.color = "#fff" }}
                  onMouseLeave={(e) => { const el = e.currentTarget; el.style.backgroundColor = ""; el.style.color = TEAL }}
                >
                  {showReset ? "Hủy đặt lại" : "Đặt lại mật khẩu"}
                </button>
              </div>
              {showReset ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="relative">
                      <input type={showPass ? "text" : "password"} value={form.password} onChange={set("password")} placeholder="Mật khẩu mới" className={`${inputCls("password")} pr-10`} />
                      <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPass ? <EyeOffIcon /> : <EyeIcon />}</button>
                    </div>
                    {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                  </div>
                  <div>
                    <div className="relative">
                      <input type={showPass2 ? "text" : "password"} value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="Xác nhận mật khẩu" className={`${inputCls("confirmPassword")} pr-10`} />
                      <button type="button" onClick={() => setShowPass2((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPass2 ? <EyeOffIcon /> : <EyeIcon />}</button>
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-200 px-3 py-2.5 text-xs text-gray-400">Mật khẩu hiện tại được giữ nguyên. Nhấn "Đặt lại mật khẩu" để thay đổi.</div>
              )}
            </div>
          )}

          {/* Department + Role */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Phòng ban</label>
              <select value={form.department} onChange={set("department")} className={inputCls("department")}>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Vai trò</label>
              <select value={form.role} onChange={set("role")} className={inputCls("role")}>
                <option value="NhanVien">Nhân viên</option>
                <option value="TruongPhong">Trưởng phòng</option>
                <option value="Admin">Quản trị viên</option>
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Trạng thái tài khoản</label>
            <div className="flex gap-3">
              {(["active", "locked"] as UserStatus[]).map((s) => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="status" value={s} checked={form.status === s} onChange={() => setForm((p) => ({ ...p, status: s }))} style={{ accentColor: TEAL }} />
                  <span className="text-sm text-gray-700">{s === "active" ? "Hoạt động" : "Khóa"}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 pb-5 border-t border-gray-100 pt-4 flex justify-end gap-2 sticky bottom-0 bg-white rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Hủy</button>
          <TealBtn onClick={handleSave}>{mode === "add" ? "Thêm người dùng" : "Lưu thay đổi"}</TealBtn>
        </div>
      </div>
    </div>
  )
}

function DeleteUserModal({ user, onClose, onConfirm }: { user: AppUser; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-6 py-5 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 text-xl">🗑</div>
          <h3 className="font-semibold text-gray-800 mb-2">Xóa người dùng?</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Bạn có chắc muốn xóa tài khoản <strong>{user.name}</strong> ({user.username})?<br />Hành động này không thể hoàn tác.
          </p>
        </div>
        <div className="px-6 pb-5 flex gap-2 justify-center">
          <button onClick={onClose} className="px-5 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 font-medium">Hủy</button>
          <button onClick={() => { onConfirm(); onClose() }} className="px-5 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors">Xóa tài khoản</button>
        </div>
      </div>
    </div>
  )
}

function UsersTab({ users, onAdd, onEdit, onDelete, onToggleLock, currentUser }: {
  users: AppUser[]
  onAdd: (u: Omit<AppUser, "id">) => void
  onEdit: (u: AppUser) => void
  onDelete: (id: number) => void
  onToggleLock: (id: number) => void
  currentUser: AppUser
}) {
  const [search, setSearch]     = useState("")
  const [roleFilter, setRoleFilter]   = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [showAdd, setShowAdd]   = useState(false)
  const [editTarget, setEditTarget]   = useState<AppUser | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null)

  const filtered = users.filter((u) => {
    if (roleFilter   && u.role !== roleFilter)     return false
    if (statusFilter && u.status !== statusFilter) return false
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.username.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-4">
      {showAdd && (
        <UserModal mode="add" onClose={() => setShowAdd(false)} onSave={(data) => onAdd(data as Omit<AppUser, "id">)} existingUsers={users} />
      )}
      {editTarget && (
        <UserModal mode="edit" initialData={editTarget} onClose={() => setEditTarget(null)} onSave={(data) => { onEdit({ ...editTarget, ...data } as AppUser); setEditTarget(null) }} existingUsers={users} />
      )}
      {deleteTarget && (
        <DeleteUserModal user={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => onDelete(deleteTarget.id)} />
      )}

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-3.5 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên, username, email..." className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-100" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none">
          <option value="">Tất cả vai trò</option>
          <option value="Admin">Quản trị viên</option>
          <option value="TruongPhong">Trưởng phòng</option>
          <option value="NhanVien">Nhân viên</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none">
          <option value="">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="locked">Đã khóa</option>
        </select>
        <span className="text-xs text-gray-400 whitespace-nowrap">{filtered.length} người dùng</span>
        <button
          onClick={() => setShowAdd(true)}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 text-sm text-white rounded-lg font-medium transition-all"
          style={{ backgroundColor: TEAL }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = TEAL_DARK }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = TEAL }}
        >
          <span className="text-base leading-none">＋</span> Thêm người dùng
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {["Họ tên", "Username / Email", "Phòng ban", "Vai trò", "Trạng thái", "Hành động"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={6}><EmptyState icon="👥" title="Không tìm thấy người dùng" sub="Thử thay đổi bộ lọc hoặc từ khóa" /></td></tr>
                : filtered.map((u) => (
                  <tr key={u.id} className={`border-b border-gray-50 hover:bg-gray-50/80 transition-colors ${u.status === "locked" ? "opacity-60" : ""}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} size={8} />
                        <div>
                          <div className="text-sm font-medium text-gray-800">{u.name}</div>
                          {u.id === currentUser.id && <div className="text-xs text-teal-600 font-medium" style={{ color: TEAL }}>Tài khoản của bạn</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-sm text-gray-700 font-mono">{u.username}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{u.email}</div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{u.department}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold" style={{ backgroundColor: ROLE_BG[u.role], color: ROLE_COLOR[u.role] }}>
                        {ROLE_LABEL[u.role]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => { if (u.id !== currentUser.id) onToggleLock(u.id) }}
                        disabled={u.id === currentUser.id}
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium transition-colors ${u.id !== currentUser.id ? "cursor-pointer hover:opacity-80" : "cursor-not-allowed"}`}
                        style={{
                          backgroundColor: u.status === "active" ? "#D1FAE5" : "#FEE2E2",
                          color: u.status === "active" ? "#065F46" : "#991B1B",
                        }}
                        title={u.id === currentUser.id ? "Không thể thay đổi tài khoản của chính mình" : u.status === "active" ? "Click để khóa" : "Click để mở khóa"}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === "active" ? "bg-emerald-500" : "bg-red-500"}`} />
                        {u.status === "active" ? "Hoạt động" : "Đã khóa"}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setEditTarget(u)}
                          className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-all"
                          style={{ borderColor: TEAL, color: TEAL }}
                          onMouseEnter={(e) => { const el = e.currentTarget; el.style.backgroundColor = TEAL; el.style.color = "#fff" }}
                          onMouseLeave={(e) => { const el = e.currentTarget; el.style.backgroundColor = ""; el.style.color = TEAL }}
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => { if (u.id !== currentUser.id) setDeleteTarget(u) }}
                          disabled={u.id === currentUser.id}
                          className="text-xs px-3 py-1.5 rounded-lg border border-red-300 text-red-500 font-medium hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title={u.id === currentUser.id ? "Không thể xóa tài khoản đang đăng nhập" : ""}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Summary footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-6 text-xs text-gray-400">
          <span>Tổng: <strong className="text-gray-600">{users.length}</strong></span>
          <span>Hoạt động: <strong className="text-emerald-600">{users.filter((u) => u.status === "active").length}</strong></span>
          <span>Đã khóa: <strong className="text-red-500">{users.filter((u) => u.status === "locked").length}</strong></span>
          <span>Trưởng phòng: <strong className="text-gray-600">{users.filter((u) => u.role === "TruongPhong").length}</strong></span>
          <span>Admin: <strong style={{ color: "#7C3AED" }}>{users.filter((u) => u.role === "Admin").length}</strong></span>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ═══════════════════════════════════════════════════════════════════════════════
function OverviewTab({ meetings, users, onOpenDetail, onNavigate }: {
  meetings: Meeting[]
  users: AppUser[]
  onOpenDetail: (m: Meeting) => void
  onNavigate: (tab: Tab) => void
}) {
  const total    = meetings.length
  const pending  = meetings.filter((m) => m.status === "pending").length
  const approved = meetings.filter((m) => m.status === "approved").length
  const rejected = meetings.filter((m) => m.status === "rejected").length

  const upcoming = meetings.filter((m) => m.date >= TODAY && m.status !== "rejected").sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)).slice(0, 5)
  const todayMeetings = meetings.filter((m) => m.date === TODAY && m.status === "approved")
  const recent = [...meetings].filter((m) => m.status !== "pending").sort((a, b) => b.id - a.id).slice(0, 5)

  const statCards = [
    { label: "Tổng số cuộc họp", value: total, delta: "+3 tháng này", color: TEAL, bg: TEAL_LIGHT,
      icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg> },
    { label: "Đang chờ duyệt", value: pending, delta: "Cần xử lý", color: "#B45309", bg: "#FEF3C7",
      icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg> },
    { label: "Đã được duyệt", value: approved, delta: `${total ? Math.round(approved/total*100) : 0}% tỷ lệ duyệt`, color: "#065F46", bg: "#D1FAE5",
      icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> },
    { label: "Đã từ chối", value: rejected, delta: `${total ? Math.round(rejected/total*100) : 0}% tỷ lệ từ chối`, color: "#991B1B", bg: "#FEE2E2",
      icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg> },
  ]

  const getUserName = (id: number) => users.find((u) => u.id === id)?.name ?? `#${id}`

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: c.bg, color: c.color }}>{c.icon}</div>
              <span className="text-xs text-gray-400">{c.delta}</span>
            </div>
            <div>
              <div className="text-3xl font-bold tracking-tight" style={{ color: c.color }}>{c.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 280px" }}>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Cuộc họp sắp diễn ra</h2>
            <button onClick={() => onNavigate("calendar")} className="text-xs hover:underline" style={{ color: TEAL }}>Xem tất cả →</button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                {["Ngày", "Giờ", "Tiêu đề", "Phòng", "Người tổ chức", "Trạng thái"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {upcoming.length === 0
                ? <tr><td colSpan={6}><EmptyState icon="📅" title="Không có cuộc họp sắp tới" sub="" /></td></tr>
                : upcoming.map((m) => (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => onOpenDetail(m)}>
                    <td className="px-5 py-3 text-gray-700 whitespace-nowrap text-xs">{fmtDate(m.date)}</td>
                    <td className="px-5 py-3 whitespace-nowrap font-mono text-xs text-gray-500">{m.startTime}–{m.endTime}</td>
                    <td className="px-5 py-3 text-gray-800 font-medium max-w-[180px] truncate">{m.title}</td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap text-xs">{m.room}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Avatar name={getUserName(m.organizerId)} size={5} />
                        <span className="text-xs text-gray-600">{getUserName(m.organizerId)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3"><StatusPill status={m.status} /></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h3 className="text-xs font-semibold text-gray-700">Hôm nay · {fmtDate(TODAY)}</h3>
            </div>
            <div className="px-4 py-3">
              {todayMeetings.length === 0
                ? <p className="text-xs text-gray-400 py-2 text-center">Không có cuộc họp hôm nay</p>
                : todayMeetings.map((m) => (
                  <div key={m.id} className="py-2 border-b last:border-0 border-gray-50 cursor-pointer hover:opacity-80" onClick={() => onOpenDetail(m)}>
                    <div className="flex items-start gap-2">
                      <div className="w-0.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: TEAL, minHeight: 36 }} />
                      <div>
                        <div className="text-xs font-medium text-gray-700">{m.title}</div>
                        <div className="text-xs text-gray-400 mt-0.5 font-mono">{m.startTime}–{m.endTime}</div>
                        <div className="text-xs text-gray-400">{m.room}</div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-xs font-semibold text-gray-700 mb-3">Thao tác nhanh</h3>
            <div className="space-y-2">
              <button onClick={() => onNavigate("create")} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-white text-xs font-medium" style={{ backgroundColor: TEAL }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = TEAL_DARK }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = TEAL }}
              >＋ Tạo cuộc họp mới</button>
              {pending > 0 && (
                <button onClick={() => onNavigate("requests")} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-amber-700 bg-amber-50 border border-amber-200 text-xs font-medium hover:bg-amber-100">
                  ⏳ Duyệt {pending} yêu cầu đang chờ
                </button>
              )}
              <button onClick={() => onNavigate("report")} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-gray-600 bg-gray-50 border border-gray-200 text-xs font-medium hover:bg-gray-100">◩ Xem báo cáo thống kê</button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Hoạt động gần đây</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {recent.map((m) => (
            <div key={m.id} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50 cursor-pointer" onClick={() => onOpenDetail(m)}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${m.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                {m.status === "approved" ? "✓" : "✕"}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-gray-700 font-medium">{m.title}</span>
                <span className="text-xs text-gray-400 ml-2">· {m.room} · {fmtDate(m.date)}</span>
              </div>
              <StatusPill status={m.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALENDAR TAB
// ═══════════════════════════════════════════════════════════════════════════════
const PAGE_SIZE = 8

function CalendarTab({ meetings, users, onOpenDetail, onAssign }: {
  meetings: Meeting[]
  users: AppUser[]
  onOpenDetail: (m: Meeting) => void
  onAssign: (m: Meeting) => void
}) {
  const [statusFilter, setStatusFilter] = useState("")
  const [roomFilter, setRoomFilter]     = useState("")
  const [search, setSearch]             = useState("")
  const [page, setPage]                 = useState(1)

  const getUserName = (id: number) => users.find((u) => u.id === id)?.name ?? `#${id}`

  const filtered = meetings.filter((m) => {
    if (statusFilter && m.status !== statusFilter) return false
    if (roomFilter   && m.room !== roomFilter)     return false
    if (search && !m.title.toLowerCase().includes(search.toLowerCase()) && !getUserName(m.organizerId).toLowerCase().includes(search.toLowerCase())) return false
    return true
  }).sort((a, b) => b.date.localeCompare(a.date))

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const reset = () => setPage(1)

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-3.5 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); reset() }} placeholder="Tìm tiêu đề, người tổ chức..." className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-100" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); reset() }} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none">
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ duyệt</option>
          <option value="approved">Đã duyệt</option>
          <option value="rejected">Từ chối</option>
        </select>
        <select value={roomFilter} onChange={(e) => { setRoomFilter(e.target.value); reset() }} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none">
          <option value="">Tất cả phòng</option>
          {ROOMS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <span className="text-xs text-gray-400">{filtered.length} kết quả</span>
        {(search || statusFilter || roomFilter) && (
          <button className="text-xs text-gray-400 hover:text-gray-700 underline" onClick={() => { setSearch(""); setStatusFilter(""); setRoomFilter(""); reset() }}>Xóa bộ lọc</button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {["Ngày", "Giờ / Thời lượng", "Tiêu đề", "Phòng", "Người tổ chức", "Người tham gia", "Trạng thái", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0
                ? <tr><td colSpan={8}><EmptyState icon="🔍" title="Không tìm thấy cuộc họp" sub="Thử thay đổi bộ lọc" /></td></tr>
                : paged.map((m) => (
                  <tr key={m.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${m.status === "rejected" ? "opacity-60" : ""}`} onClick={() => onOpenDetail(m)}>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap text-xs">{fmtDate(m.date)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-mono text-xs text-gray-700">{m.startTime}–{m.endTime}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{duration(m.startTime, m.endTime)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-800 font-medium max-w-[200px] truncate">{m.title}</div>
                      {m.status === "rejected" && m.rejectReason && <div className="text-xs text-red-400 truncate max-w-[200px] mt-0.5">↳ {m.rejectReason}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">{m.room}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Avatar name={getUserName(m.organizerId)} size={5} />
                        <span className="text-xs text-gray-600">{getUserName(m.organizerId)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex -space-x-1">
                        {m.participants.slice(0,4).map((pid) => <div key={pid} title={getUserName(pid)}><Avatar name={getUserName(pid)} size={6} /></div>)}
                        {m.participants.length > 4 && <div className="w-6 h-6 rounded-full bg-gray-100 border border-white flex items-center justify-center text-xs text-gray-500">+{m.participants.length - 4}</div>}
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusPill status={m.status} /></td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <OutlineBtn onClick={() => onAssign(m)}>Phân công</OutlineBtn>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">Trang {page}/{totalPages} · {filtered.length} cuộc họp</span>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">← Trước</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button key={n} onClick={() => setPage(n)} className="px-3 py-1.5 text-xs border rounded-lg" style={n === page ? { backgroundColor: TEAL, color: "#fff", borderColor: TEAL } : { borderColor: "#E5E7EB", color: "#6B7280" }}>{n}</button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Sau →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// REQUESTS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function RequestsTab({ meetings, users, onApprove, onReject, onOpenDetail }: {
  meetings: Meeting[]
  users: AppUser[]
  onApprove: (id: number) => void
  onReject: (id: number, reason: string) => void
  onOpenDetail: (m: Meeting) => void
}) {
  const [rejectTarget, setRejectTarget] = useState<Meeting | null>(null)
  const [search, setSearch] = useState("")
  const getUserName = (id: number) => users.find((u) => u.id === id)?.name ?? `#${id}`
  const pending = meetings.filter((m) => m.status === "pending" && (!search || m.title.toLowerCase().includes(search.toLowerCase()) || getUserName(m.organizerId).toLowerCase().includes(search.toLowerCase())))

  return (
    <div className="space-y-4">
      {rejectTarget && (
        <RejectModal meetingTitle={rejectTarget.title} onClose={() => setRejectTarget(null)} onConfirm={(reason) => { onReject(rejectTarget.id, reason); setRejectTarget(null) }} />
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-3.5 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm yêu cầu..." className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-100" />
        </div>
        <span className="text-xs text-gray-400">{pending.length} yêu cầu chờ duyệt</span>
        {pending.length > 1 && (
          <button onClick={() => { pending.forEach((m) => onApprove(m.id)) }} className="ml-auto text-xs px-3 py-1.5 rounded-lg font-medium border transition-all" style={{ borderColor: TEAL, color: TEAL }}
            onMouseEnter={(e) => { const el = e.currentTarget; el.style.backgroundColor = TEAL; el.style.color = "#fff" }}
            onMouseLeave={(e) => { const el = e.currentTarget; el.style.backgroundColor = ""; el.style.color = TEAL }}
          >
            Duyệt tất cả ({pending.length})
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {["Ngày", "Giờ / Thời lượng", "Tiêu đề & Mô tả", "Người yêu cầu", "Phòng", "Tham gia", "Thao tác"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pending.length === 0
                ? <tr><td colSpan={7}><EmptyState icon="✅" title="Không còn yêu cầu nào đang chờ" sub="Tất cả yêu cầu đã được xử lý" /></td></tr>
                : pending.map((m) => (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-amber-50/30 transition-colors">
                    <td className="px-4 py-3.5 text-gray-700 whitespace-nowrap text-xs">{fmtDate(m.date)}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-mono text-xs text-gray-700">{m.startTime}–{m.endTime}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{duration(m.startTime, m.endTime)}</div>
                    </td>
                    <td className="px-4 py-3.5 max-w-[220px]">
                      <button className="text-gray-800 font-medium hover:underline text-left truncate block w-full" onClick={() => onOpenDetail(m)}>{m.title}</button>
                      {m.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{m.description}</p>}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Avatar name={getUserName(m.organizerId)} size={6} />
                        <span className="text-xs text-gray-600">{getUserName(m.organizerId)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap text-xs">{m.room}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex -space-x-1">
                        {m.participants.slice(0,3).map((pid) => <div key={pid} title={getUserName(pid)}><Avatar name={getUserName(pid)} size={6} /></div>)}
                        {m.participants.length > 3 && <div className="w-6 h-6 rounded-full bg-gray-100 border border-white flex items-center justify-center text-xs text-gray-500">+{m.participants.length-3}</div>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1.5">
                        <TealBtn onClick={() => onApprove(m.id)}>✓ Duyệt</TealBtn>
                        <button onClick={() => setRejectTarget(m)} className="text-xs px-3 py-1.5 rounded-lg border border-red-400 text-red-600 font-medium hover:bg-red-50 transition-colors">✕ Từ chối</button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE TAB
// ═══════════════════════════════════════════════════════════════════════════════
type CreateFieldErrors = Partial<Record<"title" | "date" | "startTime" | "endTime", string>>

function CreateTab({ onCreate, users }: { onCreate: (m: Meeting) => void; users: AppUser[] }) {
  const [form, setForm] = useState({ title: "", room: ROOMS[0], date: "", startTime: "", endTime: "", description: "" })
  const [participants, setParticipants] = useState<number[]>([1])
  const [errors, setErrors] = useState<CreateFieldErrors>({})
  const [success, setSuccess] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    setErrors((p) => ({ ...p, [k]: undefined }))
  }
  const toggleP = (id: number) => setParticipants((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])

  const validate = () => {
    const e: CreateFieldErrors = {}
    if (!form.title.trim())  e.title = "Vui lòng nhập tiêu đề"
    if (!form.date)          e.date = "Vui lòng chọn ngày"
    if (!form.startTime)     e.startTime = "Vui lòng chọn giờ bắt đầu"
    if (!form.endTime)       e.endTime = "Vui lòng chọn giờ kết thúc"
    if (form.startTime && form.endTime && form.endTime <= form.startTime) e.endTime = "Giờ kết thúc phải sau giờ bắt đầu"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    onCreate({ id: Date.now(), ...form, organizerId: 1, status: "pending", participants, createdBy: 1 })
    setSuccess(true)
    setForm({ title: "", room: ROOMS[0], date: "", startTime: "", endTime: "", description: "" })
    setParticipants([1])
    setTimeout(() => setSuccess(false), 4000)
  }

  const inputCls = (f?: keyof CreateFieldErrors) =>
    `w-full border rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 transition-all ${
      f && errors[f] ? "border-red-300 bg-red-50/30 focus:ring-red-200" : "border-gray-200 focus:ring-teal-100 focus:border-teal-400"
    }`

  const dur = form.startTime && form.endTime && form.endTime > form.startTime ? duration(form.startTime, form.endTime) : null
  const activeUsers = users.filter((u) => u.status === "active")

  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 300px" }}>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2" style={{ backgroundColor: TEAL_XL }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm" style={{ backgroundColor: TEAL }}>＋</div>
          <h2 className="text-sm font-semibold" style={{ color: TEAL }}>Tạo cuộc họp mới</h2>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Tiêu đề *</label>
            <input type="text" value={form.title} onChange={set("title")} placeholder="Nhập tiêu đề cuộc họp..." className={inputCls("title")} />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Phòng họp</label>
              <select value={form.room} onChange={set("room")} className={inputCls()}>
                {ROOMS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Ngày họp *</label>
              <input type="date" value={form.date} onChange={set("date")} className={inputCls("date")} />
              {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Giờ bắt đầu *</label>
              <input type="time" value={form.startTime} onChange={set("startTime")} className={inputCls("startTime")} />
              {errors.startTime && <p className="text-xs text-red-500 mt-1">{errors.startTime}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Giờ kết thúc *</label>
              <input type="time" value={form.endTime} onChange={set("endTime")} className={inputCls("endTime")} />
              {errors.endTime && <p className="text-xs text-red-500 mt-1">{errors.endTime}</p>}
              {dur && <p className="text-xs mt-1" style={{ color: TEAL }}>⏱ {dur}</p>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Mô tả nội dung</label>
            <textarea value={form.description} onChange={set("description")} placeholder="Mô tả mục tiêu, agenda..." rows={3} className={`${inputCls()} resize-none`} />
            <div className="text-xs text-gray-400 text-right mt-1">{form.description.length}/500</div>
          </div>
          {success && (
            <div className="rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2" style={{ backgroundColor: TEAL_LIGHT, color: TEAL }}>
              ✓ Tạo cuộc họp thành công! Đang chờ phê duyệt.
            </div>
          )}
          <div className="flex items-center justify-between pt-1">
            <button type="button" onClick={() => { setForm({ title: "", room: ROOMS[0], date: "", startTime: "", endTime: "", description: "" }); setParticipants([1]); setErrors({}) }} className="text-xs text-gray-400 hover:text-gray-600 underline">Xóa form</button>
            <button type="submit" className="px-6 py-2.5 text-sm text-white rounded-lg font-medium transition-all" style={{ backgroundColor: TEAL }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = TEAL_DARK }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = TEAL }}
            >Tạo cuộc họp →</button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden self-start">
        <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Người tham gia</h3>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: TEAL_LIGHT, color: TEAL }}>{participants.length} người</span>
        </div>
        <div className="divide-y divide-gray-50">
          {activeUsers.map((u) => (
            <label key={u.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
              <input type="checkbox" checked={participants.includes(u.id)} onChange={() => toggleP(u.id)} className="w-4 h-4 rounded" style={{ accentColor: TEAL }} />
              <Avatar name={u.name} size={7} />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-700 font-medium truncate">{u.name}</div>
                <div className="text-xs text-gray-400">{ROLE_LABEL[u.role]}</div>
              </div>
              {participants.includes(u.id) && <span className="text-xs font-bold" style={{ color: TEAL }}>✓</span>}
            </label>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
          <button type="button" onClick={() => setParticipants(activeUsers.map((u) => u.id))} className="flex-1 text-xs py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Chọn tất cả</button>
          <button type="button" onClick={() => setParticipants([])} className="flex-1 text-xs py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Bỏ chọn</button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPORT TAB
// ═══════════════════════════════════════════════════════════════════════════════
function ReportTab({ meetings, users }: { meetings: Meeting[]; users: AppUser[] }) {
  const [period, setPeriod] = useState("all")
  const filtered = period === "all" ? meetings : meetings.filter((m) => m.date.startsWith(period))

  const total    = filtered.length
  const approved = filtered.filter((m) => m.status === "approved").length
  const pending  = filtered.filter((m) => m.status === "pending").length
  const rejected = filtered.filter((m) => m.status === "rejected").length
  const getUserName = (id: number) => users.find((u) => u.id === id)?.name ?? `#${id}`

  const byStatus = [
    { name: "Đã duyệt", value: approved, color: "#059669" },
    { name: "Chờ duyệt", value: pending, color: "#D97706" },
    { name: "Từ chối",  value: rejected, color: "#DC2626" },
  ]

  const roomMap: Record<string, number> = {}
  filtered.forEach((m) => { roomMap[m.room] = (roomMap[m.room] || 0) + 1 })
  const byRoom = Object.entries(roomMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)

  const monthMap: Record<string, number> = {}
  filtered.forEach((m) => { const [, mo] = m.date.split("-"); const k = `T${parseInt(mo,10)}`; monthMap[k] = (monthMap[k]||0)+1 })
  const byMonth = Object.entries(monthMap).sort().map(([name, value]) => ({ name, value }))

  const orgMap: Record<number, number> = {}
  filtered.forEach((m) => { orgMap[m.organizerId] = (orgMap[m.organizerId]||0)+1 })

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4 flex-wrap">
        <div>
          <div className="text-xs text-gray-400 mb-0.5">Kỳ báo cáo</div>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="text-sm font-semibold text-gray-700 border-0 p-0 focus:outline-none bg-transparent">
            <option value="all">Toàn bộ thời gian</option>
            <option value="2026-07">Tháng 7/2026</option>
            <option value="2026-06">Tháng 6/2026</option>
            <option value="2026-05">Tháng 5/2026</option>
          </select>
        </div>
        <div className="ml-auto flex gap-8">
          {[{ label: "Tổng", value: total, color: TEAL }, { label: "Đã duyệt", value: approved, color: "#059669" }, { label: "Chờ duyệt", value: pending, color: "#D97706" }, { label: "Từ chối", value: rejected, color: "#DC2626" }].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Pie */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Tỷ lệ theo trạng thái</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={byStatus.filter((d) => d.value > 0)} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                {byStatus.filter((d) => d.value > 0).map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v} cuộc`, ""]} />
              <Legend formatter={(value) => <span style={{ fontSize: 12, color: "#374151" }}>{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar by month */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Số cuộc họp theo tháng</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byMonth} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v} cuộc`, ""]} />
              <Bar dataKey="value" fill={TEAL} radius={[4,4,0,0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Room usage */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-5">Mức độ sử dụng phòng họp</h3>
        <div className="space-y-4">
          {byRoom.map((r) => {
            const pct = total ? Math.round((r.value/total)*100) : 0
            return (
              <div key={r.name} className="flex items-center gap-4">
                <div className="text-sm text-gray-700 w-28 shrink-0">{r.name}</div>
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: TEAL }} />
                </div>
                <div className="text-xs text-gray-500 w-20 text-right">{r.value} cuộc · {pct}%</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top organizers */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Người tổ chức nhiều nhất</h3>
        <div className="space-y-3">
          {Object.entries(orgMap).sort((a,b) => Number(b[1])-Number(a[1])).map(([id, count], i) => {
            const name = getUserName(Number(id))
            const pct = total ? Math.round(count/total*100) : 0
            return (
              <div key={id} className="flex items-center gap-3">
                <div className="text-xs text-gray-400 w-4">{i+1}</div>
                <Avatar name={name} size={7} />
                <div className="text-sm text-gray-700 w-36 truncate">{name}</div>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: TEAL_MID }} />
                </div>
                <div className="text-xs text-gray-500 w-16 text-right">{count} cuộc</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Notification Bell ────────────────────────────────────────────────────────
function NotifBell({ count, meetings, users, onView }: { count: number; meetings: Meeting[]; users: AppUser[]; onView: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])
  const pending = meetings.filter((m) => m.status === "pending").slice(0, 5)
  const getUserName = (id: number) => users.find((u) => u.id === id)?.name ?? `#${id}`
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="relative w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>
        {count > 0 && <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full text-white flex items-center justify-center font-bold" style={{ backgroundColor: "#DC2626", fontSize: 9 }}>{count}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">Yêu cầu chờ duyệt</span>
            <button onClick={() => { onView(); setOpen(false) }} className="text-xs hover:underline" style={{ color: TEAL }}>Xem tất cả</button>
          </div>
          {pending.length === 0
            ? <div className="px-4 py-6 text-center text-xs text-gray-400">Không có yêu cầu nào</div>
            : pending.map((m) => (
              <div key={m.id} className="px-4 py-3 border-b border-gray-50 flex items-start gap-3 hover:bg-gray-50">
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-amber-400" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-700 truncate">{m.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{getUserName(m.organizerId)} · {fmtDate(m.date)}</div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════════════════════════════════════════════
const TABS_CONFIG: { id: Tab; label: string; icon: string; roles?: UserRole[] }[] = [
  { id: "overview",  label: "Tổng quan",           icon: "▤" },
  { id: "calendar",  label: "Lịch họp phòng ban",  icon: "☷" },
  { id: "requests",  label: "Duyệt yêu cầu",       icon: "✦" },
  { id: "create",    label: "Tạo cuộc họp",         icon: "＋" },
  { id: "report",    label: "Báo cáo thống kê",     icon: "◩" },
  { id: "users",     label: "Quản lý người dùng",   icon: "👥", roles: ["Admin", "TruongPhong"] },
]

export default function App() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null)
  const [users, setUsers]             = useState<AppUser[]>(SEED_USERS)
  const [meetings, setMeetings]       = useState<Meeting[]>(SEED_MEETINGS)
  const [activeTab, setActiveTab]     = useState<Tab>("overview")
  const [detailMeeting, setDetailMeeting] = useState<Meeting | null>(null)
  const [assignTarget, setAssignTarget]   = useState<Meeting | null>(null)
  const { toasts, remove, toast } = useToast()

  const pendingCount = meetings.filter((m) => m.status === "pending").length
  const visibleTabs  = TABS_CONFIG.filter((t) => !t.roles || (currentUser && t.roles.includes(currentUser.role)))

  // Meetings actions
  const handleApprove = (id: number) => {
    const m = meetings.find((x) => x.id === id)
    setMeetings((p) => p.map((x) => x.id === id ? { ...x, status: "approved" } : x))
    toast.success(`Đã duyệt: "${m?.title}"`)
  }
  const handleReject = (id: number, reason: string) => {
    const m = meetings.find((x) => x.id === id)
    setMeetings((p) => p.map((x) => x.id === id ? { ...x, status: "rejected", rejectReason: reason } : x))
    toast.error(`Đã từ chối: "${m?.title}"`)
  }
  const handleCreate = (m: Meeting) => {
    setMeetings((p) => [...p, m])
    toast.success("Tạo cuộc họp thành công! Đang chờ phê duyệt.")
  }
  const handleSaveAssign = (ids: number[]) => {
    if (!assignTarget) return
    setMeetings((p) => p.map((m) => m.id === assignTarget.id ? { ...m, participants: ids } : m))
    toast.info("Đã cập nhật người tham gia.")
  }

  // User management actions
  const handleAddUser = (data: Omit<AppUser, "id">) => {
    const newUser: AppUser = { ...data, id: Date.now() }
    setUsers((p) => [...p, newUser])
    toast.success(`Đã thêm người dùng "${data.name}"`)
  }
  const handleEditUser = (updated: AppUser) => {
    setUsers((p) => p.map((u) => u.id === updated.id ? updated : u))
    toast.success(`Đã cập nhật thông tin "${updated.name}"`)
  }
  const handleDeleteUser = (id: number) => {
    const u = users.find((x) => x.id === id)
    setUsers((p) => p.filter((x) => x.id !== id))
    toast.warn(`Đã xóa người dùng "${u?.name}"`)
  }
  const handleToggleLock = (id: number) => {
    const u = users.find((x) => x.id === id)
    if (!u) return
    setUsers((p) => p.map((x) => x.id === id ? { ...x, status: x.status === "active" ? "locked" : "active" } : x))
    toast.info(`${u.status === "active" ? "Đã khóa" : "Đã mở khóa"} tài khoản "${u.name}"`)
  }

  if (!currentUser) {
    return (
      <>
        <LoginScreen users={users} onLogin={(u) => { setCurrentUser(u); setActiveTab("overview") }} />
        <Toaster toasts={toasts} remove={remove} />
      </>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F4F6F5", fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      {/* Topbar */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: TEAL }}>
              <GridIcon />
            </div>
            <div>
              <span className="font-bold text-gray-800 text-sm">MeetSync</span>
              <span className="hidden sm:inline text-gray-300 text-xs mx-1.5">·</span>
              <span className="hidden sm:inline text-gray-400 text-xs">Hệ thống quản lý cuộc họp nội bộ</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotifBell count={pendingCount} meetings={meetings} users={users} onView={() => setActiveTab("requests")} />
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <div className="flex items-center gap-2.5">
              <Avatar name={currentUser.name} size={7} />
              <div>
                <div className="text-xs font-semibold text-gray-700 leading-tight">{currentUser.name}</div>
                <div className="text-xs text-gray-400 leading-tight">{ROLE_LABEL[currentUser.role]} · {currentUser.department}</div>
              </div>
            </div>
            <button
              onClick={() => { setCurrentUser(null); setActiveTab("overview") }}
              className="ml-2 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors font-medium flex items-center gap-1"
            >
              <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3m4-12l4 6-4 6m4-6H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-100 sticky top-14 z-30">
        <div className="max-w-screen-xl mx-auto px-6">
          <nav className="flex">
            {visibleTabs.map((t) => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className="relative flex items-center gap-1.5 text-sm px-5 py-3.5 font-medium transition-colors whitespace-nowrap"
                style={{ color: activeTab === t.id ? TEAL : "#6B7280", borderBottom: activeTab === t.id ? `2px solid ${TEAL}` : "2px solid transparent" }}
              >
                <span className="text-base leading-none opacity-70">{t.icon}</span>
                {t.label}
                {t.id === "requests" && pendingCount > 0 && (
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-white font-bold" style={{ backgroundColor: "#DC2626", fontSize: 9 }}>{pendingCount}</span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-screen-xl mx-auto px-6 py-3 flex items-center gap-1.5 text-xs text-gray-400">
        <span>Trang chủ</span>
        <span>›</span>
        <span style={{ color: TEAL }}>{visibleTabs.find((t) => t.id === activeTab)?.label}</span>
      </div>

      {/* Content */}
      <main className="max-w-screen-xl mx-auto px-6 pb-10">
        {activeTab === "overview" && <OverviewTab meetings={meetings} users={users} onOpenDetail={setDetailMeeting} onNavigate={setActiveTab} />}
        {activeTab === "calendar" && <CalendarTab meetings={meetings} users={users} onOpenDetail={setDetailMeeting} onAssign={setAssignTarget} />}
        {activeTab === "requests" && <RequestsTab meetings={meetings} users={users} onApprove={handleApprove} onReject={handleReject} onOpenDetail={setDetailMeeting} />}
        {activeTab === "create"   && <CreateTab onCreate={handleCreate} users={users} />}
        {activeTab === "report"   && <ReportTab meetings={meetings} users={users} />}
        {activeTab === "users"    && currentUser && (currentUser.role === "Admin" || currentUser.role === "TruongPhong") && (
          <UsersTab users={users} onAdd={handleAddUser} onEdit={handleEditUser} onDelete={handleDeleteUser} onToggleLock={handleToggleLock} currentUser={currentUser} />
        )}
      </main>

      {detailMeeting && <DetailModal meeting={detailMeeting} users={users} onClose={() => setDetailMeeting(null)} />}
      {assignTarget  && <AssignModal meeting={assignTarget}  users={users} onClose={() => setAssignTarget(null)} onSave={handleSaveAssign} />}
      <Toaster toasts={toasts} remove={remove} />
    </div>
  )
}
