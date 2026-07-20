import { useState, useEffect, useRef } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts"

// ─── Constants ────────────────────────────────────────────────────────────────
const TEAL = "#0F6E56"
const TEAL_DARK = "#0A5240"
const TEAL_MID = "#1A9070"
const TEAL_LIGHT = "#E6F4F0"
const TEAL_XL = "#F0FAF7"
const TODAY = "2026-07-20"

// ─── Types ────────────────────────────────────────────────────────────────────
interface Employee {
  id: number
  name: string
  email: string
  role: string
  department: string
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
  type: "success" | "error" | "info"
  message: string
}

type Tab = "overview" | "calendar" | "requests" | "create" | "report"
type StatusKey = "approved" | "pending" | "rejected"

// ─── Employees ────────────────────────────────────────────────────────────────
// `let` (not `const`) — refreshed in place from the API when the app loads
// (see `loadInitialData` in the App root component below).
let EMPLOYEES: Employee[] = [
  { id: 1, name: "Nguyễn Văn An", email: "an.nguyen@company.vn", role: "TruongPhong", department: "Kinh doanh" },
  { id: 2, name: "Trần Thị Bình", email: "binh.tran@company.vn", role: "NhanVien", department: "Kinh doanh" },
  { id: 3, name: "Lê Văn Cường", email: "cuong.le@company.vn", role: "NhanVien", department: "Kinh doanh" },
  { id: 4, name: "Phạm Thị Dung", email: "dung.pham@company.vn", role: "NhanVien", department: "Kinh doanh" },
  { id: 5, name: "Hoàng Văn Em", email: "em.hoang@company.vn", role: "NhanVien", department: "Kinh doanh" },
]

// ─── Rich seed data ───────────────────────────────────────────────────────────
const SEED_MEETINGS: Meeting[] = [
  { id: 1,  title: "Họp giao ban tuần 30",          description: "Báo cáo tiến độ công việc tuần 30 và kế hoạch tuần tới",       date: "2026-07-22", startTime: "08:30", endTime: "09:30", room: "Phòng họp A", organizerId: 1, status: "approved",  participants: [1,2,3,4,5], createdBy: 1 },
  { id: 2,  title: "Kế hoạch triển khai khách hàng X", description: "Thảo luận phương án triển khai hợp đồng với khách hàng X",   date: "2026-07-23", startTime: "14:00", endTime: "15:00", room: "Phòng họp B", organizerId: 2, status: "pending",   participants: [2,3],     createdBy: 2 },
  { id: 3,  title: "Đào tạo sản phẩm Q3",            description: "Đào tạo nội bộ về dòng sản phẩm mới ra mắt quý 3",           date: "2026-07-24", startTime: "10:00", endTime: "11:30", room: "Phòng họp A", organizerId: 4, status: "pending",   participants: [4,5],     createdBy: 4 },
  { id: 4,  title: "Xử lý khiếu nại KH Y",           description: "Xử lý khiếu nại của khách hàng Y về tiến độ giao hàng",      date: "2026-07-15", startTime: "09:00", endTime: "10:00", room: "Phòng họp C", organizerId: 3, status: "approved",  participants: [1,3],     createdBy: 3 },
  { id: 5,  title: "Đề xuất họp ngoài giờ",          description: "Yêu cầu họp gấp về sự cố hệ thống",                          date: "2026-07-21", startTime: "17:30", endTime: "18:00", room: "Phòng họp B", organizerId: 5, status: "rejected",  participants: [5],       createdBy: 5, rejectReason: "Trùng lịch phòng họp, đề nghị dời sang sáng hôm sau" },
  { id: 6,  title: "Review chiến lược bán hàng Q3",  description: "Đánh giá kết quả tháng 6 và điều chỉnh chiến lược tháng 7",  date: "2026-07-25", startTime: "13:30", endTime: "15:00", room: "Phòng họp A", organizerId: 1, status: "approved",  participants: [1,2,3],   createdBy: 1 },
  { id: 7,  title: "Họp định kỳ với Ban Giám đốc",   description: "Báo cáo tình hình kinh doanh phòng Kinh doanh tháng 7",      date: "2026-07-28", startTime: "09:00", endTime: "10:30", room: "Phòng họp D", organizerId: 1, status: "pending",   participants: [1],       createdBy: 1 },
  { id: 8,  title: "Đàm phán hợp đồng đối tác mới",  description: "Trao đổi điều khoản hợp tác với đối tác Z",                 date: "2026-07-29", startTime: "10:00", endTime: "11:00", room: "Phòng họp B", organizerId: 2, status: "pending",   participants: [2,4],     createdBy: 2 },
  { id: 9,  title: "Họp giao ban tuần 29",            description: "Báo cáo tiến độ và rà soát KPI tuần 29",                    date: "2026-07-14", startTime: "08:30", endTime: "09:30", room: "Phòng họp A", organizerId: 1, status: "approved",  participants: [1,2,3,4,5], createdBy: 1 },
  { id: 10, title: "Sơ kết 6 tháng đầu năm",         description: "Đánh giá tổng thể hoạt động phòng kinh doanh H1/2026",       date: "2026-06-30", startTime: "14:00", endTime: "17:00", room: "Phòng họp D", organizerId: 1, status: "approved",  participants: [1,2,3,4,5], createdBy: 1 },
  { id: 11, title: "Tuyển dụng nhân sự mới",          description: "Phỏng vấn ứng viên vị trí Chuyên viên Kinh doanh cấp cao",  date: "2026-06-25", startTime: "09:00", endTime: "11:00", room: "Phòng họp C", organizerId: 1, status: "approved",  participants: [1,3],     createdBy: 1 },
  { id: 12, title: "Triển khai hệ thống CRM",         description: "Hướng dẫn sử dụng hệ thống CRM mới cho toàn bộ phòng",     date: "2026-06-18", startTime: "10:00", endTime: "12:00", room: "Phòng họp A", organizerId: 4, status: "approved",  participants: [1,2,3,4,5], createdBy: 4 },
  { id: 13, title: "Xin lịch họp đột xuất",           description: "Phản hồi khiếu nại gấp từ khách hàng VIP",                 date: "2026-06-10", startTime: "16:00", endTime: "17:00", room: "Phòng họp B", organizerId: 3, status: "rejected",  participants: [3,5],     createdBy: 3, rejectReason: "Ngoài giờ hành chính, không có phòng trống" },
  { id: 14, title: "Họp giao ban tháng 5",            description: "Đánh giá KPI tháng 5 và lên kế hoạch tháng 6",             date: "2026-05-29", startTime: "08:30", endTime: "10:00", room: "Phòng họp A", organizerId: 1, status: "approved",  participants: [1,2,3,4,5], createdBy: 1 },
  { id: 15, title: "Workshop kỹ năng thuyết trình",   description: "Đào tạo kỹ năng mềm: thuyết trình và đàm phán hiệu quả",   date: "2026-05-20", startTime: "13:00", endTime: "17:00", room: "Phòng họp D", organizerId: 2, status: "approved",  participants: [2,3,4,5], createdBy: 2 },
]

const ROOMS = ["Phòng họp A", "Phòng họp B", "Phòng họp C", "Phòng họp D"]

// ─── API client ───────────────────────────────────────────────────────────────
// Talks to the backend in /backend (plain Node http server, see backend/server.js).
// Requests go to /api/... and are proxied to http://localhost:3001 by Vite
// (see the `server.proxy` block in vite.config.ts) — so the backend must be
// running separately: `cd backend && npm start`.
const API_BASE = `${import.meta.env.VITE_API_BASE_URL ?? ""}/api`

class ApiError extends Error {}

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  let data: any = null
  try { data = await res.json() } catch { /* no body */ }
  if (!res.ok) throw new ApiError(data?.message || `Lỗi máy chủ (${res.status})`)
  return data as T
}

const api = {
  getEmployees: () => apiRequest<Employee[]>("/employees"),
  getMeetings: () => apiRequest<Meeting[]>("/meetings"),
  createMeeting: (payload: Partial<Meeting>) =>
    apiRequest<Meeting>("/meetings", { method: "POST", body: JSON.stringify(payload) }),
  approveMeeting: (id: number) =>
    apiRequest<Meeting>(`/meetings/${id}/approve`, { method: "POST" }),
  rejectMeeting: (id: number, reason: string) =>
    apiRequest<Meeting>(`/meetings/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }) }),
  assignParticipants: (id: number, participants: number[]) =>
    apiRequest<Meeting>(`/meetings/${id}/participants`, { method: "PUT", body: JSON.stringify({ participants }) }),
}

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

function empName(id: number) { return EMPLOYEES.find((e) => e.id === id)?.name ?? `#${id}` }
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
  const colors = ["#0F6E56","#2563EB","#7C3AED","#DC2626","#D97706"]
  const hue = name.charCodeAt(0) % colors.length
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}
      style={{ backgroundColor: colors[hue], fontSize: size < 8 ? 10 : 12 }}
    >
      {initials(name)}
    </div>
  )
}

function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-3">
      <div className="text-4xl opacity-30">{icon}</div>
      <div className="text-sm font-medium text-gray-500">{title}</div>
      <div className="text-xs text-gray-400">{sub}</div>
    </div>
  )
}

function TealBtn({ onClick, children, disabled }: { onClick?: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-1.5 text-xs text-white rounded-lg font-medium transition-all disabled:opacity-40"
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
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-xs rounded-lg border font-medium transition-all"
      style={{ borderColor: color, color }}
      onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = color; el.style.color = "#fff" }}
      onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = ""; el.style.color = color }}
    >
      {children}
    </button>
  )
}

// ─── Toast system ─────────────────────────────────────────────────────────────
function Toaster({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium max-w-xs animate-in"
          style={{
            backgroundColor: t.type === "success" ? TEAL : t.type === "error" ? "#DC2626" : "#1E40AF",
            color: "#fff",
          }}
        >
          <span>{t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}</span>
          <span className="flex-1">{t.message}</span>
          <button onClick={() => remove(t.id)} className="opacity-70 hover:opacity-100 text-base leading-none ml-1">&times;</button>
        </div>
      ))}
    </div>
  )
}

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const add = (type: Toast["type"], message: string) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }
  const remove = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id))
  return { toasts, remove, toast: { success: (m: string) => add("success", m), error: (m: string) => add("error", m), info: (m: string) => add("info", m) } }
}

// ─── Meeting Detail Modal ─────────────────────────────────────────────────────
function DetailModal({ meeting, onClose }: { meeting: Meeting; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4">
          <div className="flex-1">
            <StatusPill status={meeting.status} />
            <h2 className="text-base font-semibold text-gray-800 mt-2 leading-snug">{meeting.title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none mt-0.5">&times;</button>
        </div>

        {/* Meta grid */}
        <div className="px-6 pb-4 grid grid-cols-2 gap-3">
          {[
            { label: "Ngày họp", value: fmtDateLong(meeting.date) },
            { label: "Thời gian", value: `${meeting.startTime} – ${meeting.endTime} (${duration(meeting.startTime, meeting.endTime)})` },
            { label: "Phòng họp", value: meeting.room },
            { label: "Người tổ chức", value: empName(meeting.organizerId) },
          ].map((item) => (
            <div key={item.label} className="bg-gray-50 rounded-lg px-3 py-2.5">
              <div className="text-xs text-gray-400 mb-0.5">{item.label}</div>
              <div className="text-sm text-gray-700 font-medium">{item.value}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        {meeting.description && (
          <div className="px-6 pb-4">
            <div className="text-xs text-gray-400 mb-1">Nội dung</div>
            <p className="text-sm text-gray-600 leading-relaxed">{meeting.description}</p>
          </div>
        )}

        {/* Reject reason */}
        {meeting.status === "rejected" && meeting.rejectReason && (
          <div className="mx-6 mb-4 rounded-lg px-3 py-2.5 bg-red-50 border border-red-100">
            <div className="text-xs text-red-500 font-medium mb-0.5">Lý do từ chối</div>
            <p className="text-sm text-red-700">{meeting.rejectReason}</p>
          </div>
        )}

        {/* Participants */}
        <div className="px-6 pb-5">
          <div className="text-xs text-gray-400 mb-2">Người tham gia ({meeting.participants.length})</div>
          <div className="flex flex-wrap gap-2">
            {meeting.participants.map((pid) => {
              const name = empName(pid)
              return (
                <div key={pid} className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5">
                  <Avatar name={name} size={5} />
                  <span className="text-xs text-gray-700">{name}</span>
                </div>
              )
            })}
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
function AssignModal({ meeting, onClose, onSave }: { meeting: Meeting; onClose: () => void; onSave: (ids: number[]) => void }) {
  const [selected, setSelected] = useState<number[]>(meeting.participants)
  const toggle = (id: number) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

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
          {EMPLOYEES.map((e) => (
            <label key={e.id} className="flex items-center gap-3 cursor-pointer py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors">
              <input type="checkbox" checked={selected.includes(e.id)} onChange={() => toggle(e.id)} className="w-4 h-4 rounded" style={{ accentColor: TEAL }} />
              <Avatar name={e.name} size={6} />
              <div className="flex-1">
                <div className="text-sm text-gray-700">{e.name}</div>
                <div className="text-xs text-gray-400">{e.role === "TruongPhong" ? "Trưởng phòng" : "Nhân viên"}</div>
              </div>
              {selected.includes(e.id) && <span className="text-xs font-medium" style={{ color: TEAL }}>✓</span>}
            </label>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">Đã chọn {selected.length} người</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Hủy</button>
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
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-sm">✕</div>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">Từ chối yêu cầu</h3>
            <p className="text-xs text-gray-400 truncate max-w-[280px]">{meetingTitle}</p>
          </div>
        </div>
        <div className="px-5 py-4">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Lý do từ chối</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Nhập lý do từ chối để thông báo cho người yêu cầu..."
            className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-700 resize-none h-24 focus:outline-none focus:ring-2 focus:ring-red-200"
            autoFocus
          />
          <div className="text-xs text-gray-400 text-right mt-1">{reason.length}/200</div>
        </div>
        <div className="px-5 pb-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Hủy</button>
          <button
            onClick={() => onConfirm(reason)}
            className="px-4 py-2 text-sm text-white rounded-lg bg-red-600 hover:bg-red-700 transition-colors font-medium"
          >
            Xác nhận từ chối
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Tabs config ──────────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "overview",  label: "Tổng quan",          icon: "▤" },
  { id: "calendar",  label: "Lịch họp phòng ban", icon: "☷" },
  { id: "requests",  label: "Duyệt yêu cầu",      icon: "✦" },
  { id: "create",    label: "Tạo cuộc họp",        icon: "＋" },
  { id: "report",    label: "Báo cáo thống kê",    icon: "◩" },
]

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ meetings, onOpenDetail, onNavigate }: {
  meetings: Meeting[]
  onOpenDetail: (m: Meeting) => void
  onNavigate: (tab: Tab) => void
}) {
  const total    = meetings.length
  const pending  = meetings.filter((m) => m.status === "pending").length
  const approved = meetings.filter((m) => m.status === "approved").length
  const rejected = meetings.filter((m) => m.status === "rejected").length

  const upcoming = meetings
    .filter((m) => m.date >= TODAY && m.status !== "rejected")
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
    .slice(0, 5)

  const todayMeetings = meetings.filter((m) => m.date === TODAY && m.status === "approved")

  // Recent activity (last 5 changes = approved/rejected, sorted by id desc)
  const recent = [...meetings]
    .filter((m) => m.status !== "pending")
    .sort((a, b) => b.id - a.id)
    .slice(0, 5)

  const statCards = [
    { label: "Tổng số cuộc họp", value: total, delta: "+3 tháng này", color: TEAL, bg: TEAL_LIGHT,
      icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg> },
    { label: "Đang chờ duyệt", value: pending, delta: "Cần xử lý", color: "#B45309", bg: "#FEF3C7",
      icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg> },
    { label: "Đã được duyệt", value: approved, delta: `${Math.round(approved/total*100)}% tỷ lệ duyệt`, color: "#065F46", bg: "#D1FAE5",
      icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> },
    { label: "Đã từ chối", value: rejected, delta: `${Math.round(rejected/total*100)}% tỷ lệ từ chối`, color: "#991B1B", bg: "#FEE2E2",
      icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg> },
  ]

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow cursor-default">
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

      {/* Main row: upcoming + today sidebar */}
      <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 280px" }}>
        {/* Upcoming table */}
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
                ? <tr><td colSpan={6}><EmptyState icon="📅" title="Không có cuộc họp sắp tới" sub="Các cuộc họp tương lai sẽ hiển thị ở đây" /></td></tr>
                : upcoming.map((m) => (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => onOpenDetail(m)}>
                    <td className="px-5 py-3 text-gray-700 whitespace-nowrap text-xs">{fmtDate(m.date)}</td>
                    <td className="px-5 py-3 whitespace-nowrap font-mono text-xs text-gray-500">{m.startTime}–{m.endTime}</td>
                    <td className="px-5 py-3 text-gray-800 font-medium max-w-[180px] truncate">{m.title}</td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap text-xs">{m.room}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Avatar name={empName(m.organizerId)} size={5} />
                        <span className="text-xs text-gray-600">{empName(m.organizerId)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3"><StatusPill status={m.status} /></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          {/* Today's meetings */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h3 className="text-xs font-semibold text-gray-700">Hôm nay · {fmtDate(TODAY)}</h3>
            </div>
            <div className="px-4 py-3">
              {todayMeetings.length === 0 ? (
                <p className="text-xs text-gray-400 py-2 text-center">Không có cuộc họp hôm nay</p>
              ) : todayMeetings.map((m) => (
                <div key={m.id} className="py-2 border-b last:border-0 border-gray-50 cursor-pointer hover:opacity-80" onClick={() => onOpenDetail(m)}>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-full rounded-full shrink-0 mt-0.5" style={{ backgroundColor: TEAL, minHeight: 32, width: 3 }} />
                    <div>
                      <div className="text-xs font-medium text-gray-700 leading-snug">{m.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5 font-mono">{m.startTime}–{m.endTime}</div>
                      <div className="text-xs text-gray-400">{m.room}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-xs font-semibold text-gray-700 mb-3">Thao tác nhanh</h3>
            <div className="space-y-2">
              <button onClick={() => onNavigate("create")} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-white text-xs font-medium transition-all" style={{ backgroundColor: TEAL }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = TEAL_DARK }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = TEAL }}
              >
                <span>＋</span> Tạo cuộc họp mới
              </button>
              {pending > 0 && (
                <button onClick={() => onNavigate("requests")} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-amber-700 bg-amber-50 border border-amber-200 text-xs font-medium hover:bg-amber-100 transition-colors">
                  <span>⏳</span> Duyệt {pending} yêu cầu đang chờ
                </button>
              )}
              <button onClick={() => onNavigate("report")} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-gray-600 bg-gray-50 border border-gray-200 text-xs font-medium hover:bg-gray-100 transition-colors">
                <span>◩</span> Xem báo cáo thống kê
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Hoạt động gần đây</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {recent.map((m) => (
            <div key={m.id} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => onOpenDetail(m)}>
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

// ─── Calendar Tab ─────────────────────────────────────────────────────────────
const PAGE_SIZE = 8

function CalendarTab({ meetings, onOpenDetail, onAssign }: {
  meetings: Meeting[]
  onOpenDetail: (m: Meeting) => void
  onAssign: (m: Meeting) => void
}) {
  const [statusFilter, setStatusFilter] = useState("")
  const [roomFilter, setRoomFilter]     = useState("")
  const [search, setSearch]             = useState("")
  const [page, setPage]                 = useState(1)

  const filtered = meetings.filter((m) => {
    if (statusFilter && m.status !== statusFilter) return false
    if (roomFilter   && m.room !== roomFilter)     return false
    if (search && !m.title.toLowerCase().includes(search.toLowerCase()) && !empName(m.organizerId).toLowerCase().includes(search.toLowerCase())) return false
    return true
  }).sort((a, b) => b.date.localeCompare(a.date))

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const resetPage = () => setPage(1)

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-3.5 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text" value={search} onChange={(e) => { setSearch(e.target.value); resetPage() }}
            placeholder="Tìm theo tiêu đề, người tổ chức..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2"
            style={{ "--tw-ring-color": TEAL + "40" } as React.CSSProperties}
          />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); resetPage() }} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none">
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ duyệt</option>
          <option value="approved">Đã duyệt</option>
          <option value="rejected">Từ chối</option>
        </select>
        <select value={roomFilter} onChange={(e) => { setRoomFilter(e.target.value); resetPage() }} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none">
          <option value="">Tất cả phòng</option>
          {ROOMS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <span className="text-xs text-gray-400 whitespace-nowrap">{filtered.length} kết quả</span>
        {(search || statusFilter || roomFilter) && (
          <button className="text-xs text-gray-400 hover:text-gray-700 underline" onClick={() => { setSearch(""); setStatusFilter(""); setRoomFilter(""); resetPage() }}>Xóa bộ lọc</button>
        )}
      </div>

      {/* Table */}
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
                ? <tr><td colSpan={8}><EmptyState icon="🔍" title="Không tìm thấy cuộc họp" sub="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm" /></td></tr>
                : paged.map((m) => (
                  <tr
                    key={m.id}
                    className={`border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${m.status === "rejected" ? "opacity-60" : ""}`}
                    onClick={() => onOpenDetail(m)}
                  >
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap text-xs">{fmtDate(m.date)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-mono text-xs text-gray-700">{m.startTime}–{m.endTime}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{duration(m.startTime, m.endTime)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-800 font-medium max-w-[200px] truncate">{m.title}</div>
                      {m.status === "rejected" && m.rejectReason && (
                        <div className="text-xs text-red-400 truncate max-w-[200px] mt-0.5">↳ {m.rejectReason}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">{m.room}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Avatar name={empName(m.organizerId)} size={5} />
                        <span className="text-xs text-gray-600">{empName(m.organizerId)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex -space-x-1">
                        {m.participants.slice(0, 4).map((pid) => (
                          <div key={pid} title={empName(pid)}>
                            <Avatar name={empName(pid)} size={6} />
                          </div>
                        ))}
                        {m.participants.length > 4 && (
                          <div className="w-6 h-6 rounded-full bg-gray-100 border border-white flex items-center justify-center text-xs text-gray-500">+{m.participants.length - 4}</div>
                        )}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">Trang {page} / {totalPages} · {filtered.length} cuộc họp</span>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">← Trước</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button key={n} onClick={() => setPage(n)} className="px-3 py-1.5 text-xs border rounded-lg transition-colors" style={n === page ? { backgroundColor: TEAL, color: "#fff", borderColor: TEAL } : { borderColor: "#E5E7EB", color: "#6B7280" }}>{n}</button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">Sau →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Requests Tab ─────────────────────────────────────────────────────────────
function RequestsTab({ meetings, onApprove, onReject, onOpenDetail }: {
  meetings: Meeting[]
  onApprove: (id: number) => void
  onReject: (id: number, reason: string) => void
  onOpenDetail: (m: Meeting) => void
}) {
  const [rejectTarget, setRejectTarget] = useState<Meeting | null>(null)
  const [search, setSearch] = useState("")
  const pending = meetings.filter((m) => m.status === "pending" && (
    !search || m.title.toLowerCase().includes(search.toLowerCase()) || empName(m.organizerId).toLowerCase().includes(search.toLowerCase())
  ))

  return (
    <div className="space-y-4">
      {rejectTarget && (
        <RejectModal
          meetingTitle={rejectTarget.title}
          onClose={() => setRejectTarget(null)}
          onConfirm={(reason) => { onReject(rejectTarget.id, reason); setRejectTarget(null) }}
        />
      )}

      {/* Filter + bulk bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-3.5 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm yêu cầu..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2"
            style={{ "--tw-ring-color": TEAL + "40" } as React.CSSProperties}
          />
        </div>
        <span className="text-xs text-gray-400">{pending.length} yêu cầu chờ duyệt</span>
        {pending.length > 1 && (
          <button
            onClick={() => { pending.forEach((m) => onApprove(m.id)) }}
            className="ml-auto text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors"
            style={{ borderColor: TEAL, color: TEAL }}
            onMouseEnter={(e) => { const el = e.currentTarget; el.style.backgroundColor = TEAL; el.style.color = "#fff" }}
            onMouseLeave={(e) => { const el = e.currentTarget; el.style.backgroundColor = ""; el.style.color = TEAL }}
          >
            Duyệt tất cả ({pending.length})
          </button>
        )}
      </div>

      {/* Table */}
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
                      {m.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">{m.description}</p>}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Avatar name={empName(m.organizerId)} size={6} />
                        <span className="text-xs text-gray-600">{empName(m.organizerId)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap text-xs">{m.room}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex -space-x-1">
                        {m.participants.slice(0,3).map((pid) => (
                          <div key={pid} title={empName(pid)}>
                            <Avatar name={empName(pid)} size={6} />
                          </div>
                        ))}
                        {m.participants.length > 3 && <div className="w-6 h-6 rounded-full bg-gray-100 border border-white flex items-center justify-center text-xs text-gray-500">+{m.participants.length - 3}</div>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1.5">
                        <TealBtn onClick={() => onApprove(m.id)}>✓ Duyệt</TealBtn>
                        <button
                          onClick={() => setRejectTarget(m)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-red-400 text-red-600 font-medium hover:bg-red-50 transition-colors"
                        >
                          ✕ Từ chối
                        </button>
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

// ─── Create Tab ───────────────────────────────────────────────────────────────
type FieldErrors = Partial<Record<"title" | "date" | "startTime" | "endTime", string>>

function CreateTab({ onCreate }: { onCreate: (m: Meeting) => void }) {
  const [form, setForm] = useState({ title: "", room: ROOMS[0], date: "", startTime: "", endTime: "", description: "" })
  const [participants, setParticipants] = useState<number[]>([1])
  const [errors, setErrors] = useState<FieldErrors>({})
  const [success, setSuccess] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    setErrors((prev) => ({ ...prev, [k]: undefined }))
  }
  const toggleP = (id: number) => setParticipants((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const validate = (): boolean => {
    const e: FieldErrors = {}
    if (!form.title.trim())   e.title = "Vui lòng nhập tiêu đề"
    if (!form.date)           e.date = "Vui lòng chọn ngày"
    if (!form.startTime)      e.startTime = "Vui lòng chọn giờ bắt đầu"
    if (!form.endTime)        e.endTime = "Vui lòng chọn giờ kết thúc"
    if (form.startTime && form.endTime && form.endTime <= form.startTime)
      e.endTime = "Giờ kết thúc phải sau giờ bắt đầu"
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

  const inputCls = (field?: keyof FieldErrors) =>
    `w-full border rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 transition-all ${
      field && errors[field] ? "border-red-300 focus:ring-red-200 bg-red-50/30" : "border-gray-200 focus:ring-teal-100 focus:border-teal-400"
    }`

  const dur = form.startTime && form.endTime && form.endTime > form.startTime ? duration(form.startTime, form.endTime) : null

  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 300px" }}>
      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2" style={{ backgroundColor: TEAL_XL }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm" style={{ backgroundColor: TEAL }}>＋</div>
          <h2 className="text-sm font-semibold" style={{ color: TEAL }}>Tạo cuộc họp mới</h2>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Tiêu đề <span className="text-red-400 normal-case font-normal">*</span></label>
            <input type="text" value={form.title} onChange={set("title")} placeholder="Nhập tiêu đề cuộc họp..." className={inputCls("title")} />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* Room + Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Phòng họp</label>
              <select value={form.room} onChange={set("room")} className={inputCls()}>
                {ROOMS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Ngày họp <span className="text-red-400 normal-case font-normal">*</span></label>
              <input type="date" value={form.date} onChange={set("date")} className={inputCls("date")} />
              {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
            </div>
          </div>

          {/* Start + End */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Giờ bắt đầu <span className="text-red-400 normal-case font-normal">*</span></label>
              <input type="time" value={form.startTime} onChange={set("startTime")} className={inputCls("startTime")} />
              {errors.startTime && <p className="text-xs text-red-500 mt-1">{errors.startTime}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Giờ kết thúc <span className="text-red-400 normal-case font-normal">*</span></label>
              <input type="time" value={form.endTime} onChange={set("endTime")} className={inputCls("endTime")} />
              {errors.endTime && <p className="text-xs text-red-500 mt-1">{errors.endTime}</p>}
              {dur && <p className="text-xs mt-1" style={{ color: TEAL }}>⏱ Thời lượng: {dur}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Mô tả nội dung</label>
            <textarea value={form.description} onChange={set("description")} placeholder="Mô tả mục tiêu, agenda cuộc họp..." rows={3} className={`${inputCls()} resize-none`} />
            <div className="text-xs text-gray-400 text-right mt-1">{form.description.length}/500</div>
          </div>

          {success && (
            <div className="rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2" style={{ backgroundColor: TEAL_LIGHT, color: TEAL }}>
              <span>✓</span> Tạo cuộc họp thành công! Đang chờ phê duyệt.
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <button type="button" onClick={() => { setForm({ title: "", room: ROOMS[0], date: "", startTime: "", endTime: "", description: "" }); setParticipants([1]); setErrors({}) }} className="text-xs text-gray-400 hover:text-gray-600 underline">Xóa form</button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm text-white rounded-lg font-medium transition-all"
              style={{ backgroundColor: TEAL }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = TEAL_DARK }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = TEAL }}
            >
              Tạo cuộc họp →
            </button>
          </div>
        </form>
      </div>

      {/* Participants panel */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden self-start">
        <div className="px-4 py-3.5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Người tham gia</h3>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: TEAL_LIGHT, color: TEAL }}>{participants.length} người</span>
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {EMPLOYEES.map((e) => (
            <label key={e.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
              <input type="checkbox" checked={participants.includes(e.id)} onChange={() => toggleP(e.id)} className="w-4 h-4 rounded" style={{ accentColor: TEAL }} />
              <Avatar name={e.name} size={7} />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-700 font-medium truncate">{e.name}</div>
                <div className="text-xs text-gray-400">{e.role === "TruongPhong" ? "Trưởng phòng" : "Nhân viên"}</div>
              </div>
              {participants.includes(e.id) && <span className="text-xs font-bold" style={{ color: TEAL }}>✓</span>}
            </label>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
          <button onClick={() => setParticipants(EMPLOYEES.map((e) => e.id))} className="flex-1 text-xs py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Chọn tất cả</button>
          <button onClick={() => setParticipants([])} className="flex-1 text-xs py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Bỏ chọn</button>
        </div>
      </div>
    </div>
  )
}

// ─── Report Tab ───────────────────────────────────────────────────────────────
function ReportTab({ meetings }: { meetings: Meeting[] }) {
  const [period, setPeriod] = useState("all")

  const filtered = period === "all" ? meetings : meetings.filter((m) => {
    const mo = m.date.slice(0, 7)
    return period === "2026-07" ? mo === "2026-07"
         : period === "2026-06" ? mo === "2026-06"
         : mo === "2026-05"
  })

  const total    = filtered.length
  const approved = filtered.filter((m) => m.status === "approved").length
  const pending  = filtered.filter((m) => m.status === "pending").length
  const rejected = filtered.filter((m) => m.status === "rejected").length

  const byStatus = [
    { name: "Đã duyệt", value: approved, color: "#059669" },
    { name: "Chờ duyệt", value: pending,  color: "#D97706" },
    { name: "Từ chối",   value: rejected,  color: "#DC2626" },
  ]

  const roomMap: Record<string, number> = {}
  filtered.forEach((m) => { roomMap[m.room] = (roomMap[m.room] || 0) + 1 })
  const byRoom = Object.entries(roomMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)

  const monthMap: Record<string, number> = {}
  filtered.forEach((m) => {
    const [, mo] = m.date.split("-")
    const key = `T${parseInt(mo, 10)}`
    monthMap[key] = (monthMap[key] || 0) + 1
  })
  const byMonth = Object.entries(monthMap).sort().map(([name, value]) => ({ name, value }))

  const pieData = byStatus.filter((d) => d.value > 0)

  return (
    <div className="space-y-5">
      {/* Filter + summary */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
        <div className="flex-1">
          <div className="text-xs text-gray-400 mb-0.5">Kỳ báo cáo</div>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="text-sm font-semibold text-gray-700 border-0 p-0 focus:outline-none bg-transparent">
            <option value="all">Toàn bộ thời gian</option>
            <option value="2026-07">Tháng 7/2026</option>
            <option value="2026-06">Tháng 6/2026</option>
            <option value="2026-05">Tháng 5/2026</option>
          </select>
        </div>
        <div className="flex gap-6">
          {[
            { label: "Tổng", value: total, color: TEAL },
            { label: "Đã duyệt", value: approved, color: "#059669" },
            { label: "Chờ duyệt", value: pending, color: "#D97706" },
            { label: "Từ chối", value: rejected, color: "#DC2626" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-5">
        {/* Pie chart - status */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Tỷ lệ theo trạng thái</h3>
          {pieData.length === 0
            ? <EmptyState icon="📊" title="Không có dữ liệu" sub="Chọn kỳ khác" />
            : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v} cuộc`, ""]} />
                  <Legend formatter={(value) => <span style={{ fontSize: 12, color: "#374151" }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
        </div>

        {/* Bar - by month */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Số cuộc họp theo tháng</h3>
          {byMonth.length === 0
            ? <EmptyState icon="📅" title="Không có dữ liệu" sub="" />
            : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byMonth} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v} cuộc`, ""]} />
                  <Bar dataKey="value" fill={TEAL} radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            )}
        </div>
      </div>

      {/* Room usage */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-5">Mức độ sử dụng phòng họp</h3>
        {byRoom.length === 0
          ? <EmptyState icon="🏢" title="Không có dữ liệu" sub="" />
          : (
            <div className="space-y-4">
              {byRoom.map((r) => {
                const pct = total ? Math.round((r.value / total) * 100) : 0
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
          )}
      </div>

      {/* Top organizers */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Người tổ chức nhiều nhất</h3>
        <div className="space-y-3">
          {(() => {
            const org: Record<number, number> = {}
            filtered.forEach((m) => { org[m.organizerId] = (org[m.organizerId] || 0) + 1 })
            return Object.entries(org).sort((a, b) => Number(b[1]) - Number(a[1])).map(([id, count], i) => {
              const name = empName(Number(id))
              const pct = total ? Math.round(count / total * 100) : 0
              return (
                <div key={id} className="flex items-center gap-3">
                  <div className="text-xs text-gray-400 w-4">{i + 1}</div>
                  <Avatar name={name} size={7} />
                  <div className="text-sm text-gray-700 w-36 truncate">{name}</div>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: TEAL_MID }} />
                  </div>
                  <div className="text-xs text-gray-500 w-16 text-right">{count} cuộc</div>
                </div>
              )
            })
          })()}
        </div>
      </div>
    </div>
  )
}

// ─── Notification dropdown ────────────────────────────────────────────────────
function NotifBell({ count, meetings, onView }: { count: number; meetings: Meeting[]; onView: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const pending = meetings.filter((m) => m.status === "pending").slice(0, 5)

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="relative w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
        </svg>
        {count > 0 && (
          <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full text-white flex items-center justify-center font-bold" style={{ backgroundColor: "#DC2626", fontSize: 9 }}>{count}</span>
        )}
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
                  <div className="text-xs text-gray-400 mt-0.5">{empName(m.organizerId)} · {fmtDate(m.date)}</div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

// ─── App root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("overview")
  const [meetings, setMeetings]   = useState<Meeting[]>(SEED_MEETINGS)
  const [detailMeeting, setDetailMeeting] = useState<Meeting | null>(null)
  const [assignTarget, setAssignTarget]   = useState<Meeting | null>(null)
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)
  const { toasts, remove, toast } = useToast()

  // Load real data from the backend on first render. If the backend isn't
  // reachable (e.g. it hasn't been started), fall back to the built-in
  // sample data so the UI still works, and flag it with `offline`.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [employees, freshMeetings] = await Promise.all([api.getEmployees(), api.getMeetings()])
        if (cancelled) return
        EMPLOYEES.length = 0
        EMPLOYEES.push(...employees)
        setMeetings(freshMeetings)
        setOffline(false)
      } catch (err) {
        if (cancelled) return
        setOffline(true)
        toast.error("Không kết nối được máy chủ — đang hiển thị dữ liệu mẫu.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const pendingCount = meetings.filter((m) => m.status === "pending").length

  const handleApprove = async (id: number) => {
    const m = meetings.find((x) => x.id === id)
    try {
      const updated = await api.approveMeeting(id)
      setMeetings((prev) => prev.map((x) => x.id === id ? updated : x))
      toast.success(`Đã duyệt: "${m?.title}"`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể duyệt cuộc họp")
    }
  }

  const handleReject = async (id: number, reason: string) => {
    const m = meetings.find((x) => x.id === id)
    try {
      const updated = await api.rejectMeeting(id, reason)
      setMeetings((prev) => prev.map((x) => x.id === id ? updated : x))
      toast.error(`Đã từ chối: "${m?.title}"`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể từ chối cuộc họp")
    }
  }

  const handleCreate = async (m: Meeting) => {
    try {
      const created = await api.createMeeting(m)
      setMeetings((prev) => [...prev, created])
      toast.success("Tạo cuộc họp thành công! Đang chờ phê duyệt.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể tạo cuộc họp")
    }
  }

  const handleSaveAssign = async (ids: number[]) => {
    if (!assignTarget) return
    try {
      const updated = await api.assignParticipants(assignTarget.id, ids)
      setMeetings((prev) => prev.map((m) => m.id === assignTarget.id ? updated : m))
      toast.info("Đã cập nhật danh sách người tham gia.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể cập nhật người tham gia")
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F4F6F5", fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      {/* Topbar */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: TEAL }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.95"/>
                <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.55"/>
                <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.55"/>
                <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.95"/>
              </svg>
            </div>
            <div>
              <span className="font-bold text-gray-800 text-sm">MeetSync</span>
              <span className="hidden sm:inline text-gray-300 text-xs mx-1.5">·</span>
              <span className="hidden sm:inline text-gray-400 text-xs">Hệ thống quản lý cuộc họp nội bộ</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NotifBell count={pendingCount} meetings={meetings} onView={() => setActiveTab("requests")} />
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <div className="flex items-center gap-2.5">
              <Avatar name="Nguyễn Văn An" size={7} />
              <div>
                <div className="text-xs font-semibold text-gray-700 leading-tight">Nguyễn Văn An</div>
                <div className="text-xs text-gray-400 leading-tight">Trưởng phòng · Kinh doanh</div>
              </div>
            </div>
            <button className="ml-2 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors font-medium flex items-center gap-1">
              <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3m4-12l4 6-4 6m4-6H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {offline && !loading && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-700 text-xs text-center py-1.5">
          Không kết nối được máy chủ backend (localhost:3001) — đang dùng dữ liệu mẫu. Chạy <code className="font-mono">cd backend &amp;&amp; npm start</code> rồi tải lại trang.
        </div>
      )}

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-100 sticky top-14 z-30">
        <div className="max-w-screen-xl mx-auto px-6">
          <nav className="flex">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className="relative flex items-center gap-1.5 text-sm px-5 py-3.5 font-medium transition-colors whitespace-nowrap"
                style={{
                  color: activeTab === t.id ? TEAL : "#6B7280",
                  borderBottom: activeTab === t.id ? `2px solid ${TEAL}` : "2px solid transparent",
                }}
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
        <span style={{ color: TEAL }}>{TABS.find((t) => t.id === activeTab)?.label}</span>
      </div>

      {/* Main content */}
      <main className="max-w-screen-xl mx-auto px-6 pb-10">
        {activeTab === "overview" && (
          <OverviewTab meetings={meetings} onOpenDetail={setDetailMeeting} onNavigate={setActiveTab} />
        )}
        {activeTab === "calendar" && (
          <CalendarTab meetings={meetings} onOpenDetail={setDetailMeeting} onAssign={setAssignTarget} />
        )}
        {activeTab === "requests" && (
          <RequestsTab meetings={meetings} onApprove={handleApprove} onReject={handleReject} onOpenDetail={setDetailMeeting} />
        )}
        {activeTab === "create" && <CreateTab onCreate={handleCreate} />}
        {activeTab === "report" && <ReportTab meetings={meetings} />}
      </main>

      {/* Modals */}
      {detailMeeting && <DetailModal meeting={detailMeeting} onClose={() => setDetailMeeting(null)} />}
      {assignTarget && (
        <AssignModal
          meeting={assignTarget}
          onClose={() => setAssignTarget(null)}
          onSave={(ids) => { handleSaveAssign(ids) }}
        />
      )}

      <Toaster toasts={toasts} remove={remove} />
    </div>
  )
}
