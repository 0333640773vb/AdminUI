/**
 * MeetSync - Backend cho Web Dashboard Quản lý Cuộc họp
 * (Phiên bản dùng Supabase/Postgres để lưu trữ dữ liệu)
 *
 * Giữ nguyên các route API như bản file-based (server.local.js) — chỉ đổi
 * lớp truy xuất dữ liệu (Data Access Layer) sang gọi Supabase, nên frontend
 * không cần sửa gì cả.
 *
 * Cần cấu hình trước khi chạy (xem file .env.example):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (KHÔNG dùng anon key — cần quyền ghi dữ liệu)
 *
 * Chạy:
 *   npm install
 *   cp .env.example .env   (rồi điền URL + key của bạn)
 *   npm start
 */

const http = require("http");
const url = require("url");
const path = require("path");
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

// Nạp file .env thủ công (không phụ thuộc thư viện "dotenv")
loadDotEnv(path.join(__dirname, ".env"));

const PORT = process.env.PORT || 3001;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("✗ Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY.");
  console.error("  Tạo file backend/.env từ backend/.env.example rồi điền thông tin project Supabase của bạn.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// ---------------------------------------------------------------------------
// Tiện ích nạp .env (tránh phải cài thêm gói "dotenv")
// ---------------------------------------------------------------------------
function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

// ---------------------------------------------------------------------------
// Mapping giữa cột Postgres (snake_case) và object frontend dùng (camelCase)
// ---------------------------------------------------------------------------
function rowToMeeting(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    room: row.room,
    organizerId: row.organizer_id,
    status: row.status,
    participants: row.participants || [],
    createdBy: row.created_by,
    ...(row.reject_reason ? { rejectReason: row.reject_reason } : {}),
  };
}

function meetingPayloadToRow(payload) {
  const row = {};
  if (payload.title !== undefined) row.title = payload.title;
  if (payload.description !== undefined) row.description = payload.description;
  if (payload.date !== undefined) row.date = payload.date;
  if (payload.startTime !== undefined) row.start_time = payload.startTime;
  if (payload.endTime !== undefined) row.end_time = payload.endTime;
  if (payload.room !== undefined) row.room = payload.room;
  if (payload.organizerId !== undefined) row.organizer_id = Number(payload.organizerId);
  if (payload.status !== undefined) row.status = payload.status;
  if (payload.participants !== undefined) row.participants = payload.participants.map(Number);
  if (payload.createdBy !== undefined) row.created_by = Number(payload.createdBy);
  return row;
}

function attachNames(meeting, empMap) {
  return {
    ...meeting,
    organizerName: empMap[meeting.organizerId] ? empMap[meeting.organizerId].name : "N/A",
    participantNames: (meeting.participants || []).map((id) => (empMap[id] ? empMap[id].name : "N/A")),
  };
}

async function getEmployeeMap() {
  const { data, error } = await supabase.from("employees").select("*");
  if (error) throw { status: 500, message: error.message };
  return { list: data, map: Object.fromEntries(data.map((e) => [e.id, e])) };
}

function assertOk(error, fallbackMessage) {
  if (error) throw { status: 500, message: error.message || fallbackMessage };
}

// ---------------------------------------------------------------------------
// Tiện ích HTTP
// ---------------------------------------------------------------------------
function sendJSON(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Access-Control-Allow-Origin": "*",
  });
  res.end(body);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1e6) req.destroy();
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error("JSON không hợp lệ"));
      }
    });
    req.on("error", reject);
  });
}

// ---------------------------------------------------------------------------
// Nghiệp vụ (mỗi hàm gọi Supabase thay vì đọc/ghi file JSON)
// ---------------------------------------------------------------------------

// GET /api/meetings?status=&from=&to=&room=&search=
async function listMeetings(query) {
  let q = supabase.from("meetings").select("*");
  if (query.status) q = q.eq("status", query.status);
  if (query.from) q = q.gte("date", query.from);
  if (query.to) q = q.lte("date", query.to);
  if (query.room) q = q.eq("room", query.room);
  if (query.search) q = q.or(`title.ilike.%${query.search}%,description.ilike.%${query.search}%`);

  const { data, error } = await q;
  assertOk(error, "Không tải được danh sách cuộc họp");

  const { map: empMap } = await getEmployeeMap();
  return data
    .map(rowToMeeting)
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
    .map((m) => attachNames(m, empMap));
}

// GET /api/meetings/:id
async function getMeeting(id) {
  const { data, error } = await supabase.from("meetings").select("*").eq("id", id).maybeSingle();
  assertOk(error, "Không tải được cuộc họp");
  if (!data) throw { status: 404, message: "Không tìm thấy cuộc họp" };
  const { map: empMap } = await getEmployeeMap();
  return attachNames(rowToMeeting(data), empMap);
}

// Kiểm tra trùng lịch phòng họp (cùng phòng, cùng ngày, khung giờ giao nhau),
// chỉ tính các cuộc họp chưa bị từ chối.
async function hasRoomConflict({ room, date, startTime, endTime }, ignoreId) {
  const { data, error } = await supabase
    .from("meetings")
    .select("id,start_time,end_time,status")
    .eq("room", room)
    .eq("date", date)
    .neq("status", "rejected");
  assertOk(error, "Không kiểm tra được lịch phòng họp");
  return data.some((m) => m.id !== ignoreId && startTime < m.end_time && endTime > m.start_time);
}

// POST /api/meetings
async function createMeeting(payload) {
  const required = ["title", "date", "startTime", "endTime", "room", "organizerId"];
  for (const field of required) {
    if (!payload[field]) throw { status: 400, message: `Thiếu trường bắt buộc: ${field}` };
  }
  if (payload.startTime >= payload.endTime) {
    throw { status: 400, message: "Giờ kết thúc phải sau giờ bắt đầu" };
  }

  const { map: empMap } = await getEmployeeMap();
  const organizer = empMap[Number(payload.organizerId)];
  if (!organizer) throw { status: 400, message: "organizerId không hợp lệ" };

  if (await hasRoomConflict(payload)) {
    throw { status: 409, message: "Phòng họp đã có lịch trong khung giờ này" };
  }

  const status = payload.status === "pending" || organizer.role !== "TruongPhong" ? "pending" : "approved";
  const row = meetingPayloadToRow({
    ...payload,
    organizerId: organizer.id,
    createdBy: payload.createdBy || organizer.id,
    status,
    participants: payload.participants || [],
  });

  const { data, error } = await supabase.from("meetings").insert(row).select().single();
  assertOk(error, "Không tạo được cuộc họp");
  return attachNames(rowToMeeting(data), empMap);
}

// POST /api/meetings/:id/approve
async function approveMeeting(id) {
  const { data, error } = await supabase
    .from("meetings")
    .update({ status: "approved", reject_reason: null })
    .eq("id", id)
    .select()
    .maybeSingle();
  assertOk(error, "Không duyệt được cuộc họp");
  if (!data) throw { status: 404, message: "Không tìm thấy cuộc họp" };
  const { map: empMap } = await getEmployeeMap();
  return attachNames(rowToMeeting(data), empMap);
}

// POST /api/meetings/:id/reject  { reason }
async function rejectMeeting(id, reason) {
  const { data, error } = await supabase
    .from("meetings")
    .update({ status: "rejected", reject_reason: reason || "Không có lý do cụ thể" })
    .eq("id", id)
    .select()
    .maybeSingle();
  assertOk(error, "Không từ chối được cuộc họp");
  if (!data) throw { status: 404, message: "Không tìm thấy cuộc họp" };
  const { map: empMap } = await getEmployeeMap();
  return attachNames(rowToMeeting(data), empMap);
}

// PUT /api/meetings/:id/participants  { participants: [ids] }
async function assignParticipants(id, participants) {
  if (!Array.isArray(participants)) throw { status: 400, message: "participants phải là mảng id" };
  const { data, error } = await supabase
    .from("meetings")
    .update({ participants: participants.map(Number) })
    .eq("id", id)
    .select()
    .maybeSingle();
  assertOk(error, "Không cập nhật được người tham gia");
  if (!data) throw { status: 404, message: "Không tìm thấy cuộc họp" };
  const { map: empMap } = await getEmployeeMap();
  return attachNames(rowToMeeting(data), empMap);
}

// DELETE /api/meetings/:id
async function deleteMeeting(id) {
  const { error, count } = await supabase.from("meetings").delete({ count: "exact" }).eq("id", id);
  assertOk(error, "Không xoá được cuộc họp");
  if (!count) throw { status: 404, message: "Không tìm thấy cuộc họp" };
  return { success: true };
}

// GET /api/employees
async function listEmployees() {
  const { list } = await getEmployeeMap();
  return list;
}

// GET /api/stats
async function getStats() {
  const { data, error } = await supabase.from("meetings").select("status,date,room");
  assertOk(error, "Không tải được thống kê");
  const total = data.length;
  const byStatus = { approved: 0, pending: 0, rejected: 0 };
  const byMonth = {};
  const byRoom = {};
  data.forEach((m) => {
    byStatus[m.status] = (byStatus[m.status] || 0) + 1;
    const month = m.date.slice(0, 7);
    byMonth[month] = (byMonth[month] || 0) + 1;
    byRoom[m.room] = (byRoom[m.room] || 0) + 1;
  });
  return { total, byStatus, byMonth, byRoom };
}

// POST /api/login  { email, password } -- demo đơn giản, không mã hoá thật
async function login(email, password) {
  const { data, error } = await supabase.from("employees").select("*").eq("email", email).maybeSingle();
  assertOk(error, "Không đăng nhập được");
  if (!data) throw { status: 401, message: "Sai email hoặc tài khoản không tồn tại" };
  if (password !== "123456") throw { status: 401, message: "Sai mật khẩu" };
  return data;
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  const parsed = url.parse(req.url, true);
  const { pathname, query } = parsed;

  try {
    if (pathname === "/api/login" && req.method === "POST") {
      const body = await parseBody(req);
      return sendJSON(res, 200, await login(body.email, body.password));
    }

    if (pathname === "/api/meetings" && req.method === "GET") {
      return sendJSON(res, 200, await listMeetings(query));
    }

    if (pathname === "/api/meetings" && req.method === "POST") {
      const body = await parseBody(req);
      return sendJSON(res, 201, await createMeeting(body));
    }

    const idMatch = pathname.match(/^\/api\/meetings\/(\d+)$/);
    if (idMatch && req.method === "GET") {
      return sendJSON(res, 200, await getMeeting(Number(idMatch[1])));
    }
    if (idMatch && req.method === "DELETE") {
      return sendJSON(res, 200, await deleteMeeting(Number(idMatch[1])));
    }

    const approveMatch = pathname.match(/^\/api\/meetings\/(\d+)\/approve$/);
    if (approveMatch && req.method === "POST") {
      return sendJSON(res, 200, await approveMeeting(Number(approveMatch[1])));
    }

    const rejectMatch = pathname.match(/^\/api\/meetings\/(\d+)\/reject$/);
    if (rejectMatch && req.method === "POST") {
      const body = await parseBody(req);
      return sendJSON(res, 200, await rejectMeeting(Number(rejectMatch[1]), body.reason));
    }

    const participantsMatch = pathname.match(/^\/api\/meetings\/(\d+)\/participants$/);
    if (participantsMatch && req.method === "PUT") {
      const body = await parseBody(req);
      return sendJSON(res, 200, await assignParticipants(Number(participantsMatch[1]), body.participants));
    }

    if (pathname === "/api/employees" && req.method === "GET") {
      return sendJSON(res, 200, await listEmployees());
    }

    if (pathname === "/api/stats" && req.method === "GET") {
      return sendJSON(res, 200, await getStats());
    }

    if (pathname.startsWith("/api/")) {
      return sendJSON(res, 404, { message: "API không tồn tại" });
    }

    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("404 Not Found — đây là backend API, giao diện chạy ở dự án frontend (vite).");
  } catch (err) {
    const status = err.status || 500;
    return sendJSON(res, status, { message: err.message || "Lỗi máy chủ" });
  }
});

server.listen(PORT, () => {
  console.log(`✓ MeetSync backend (Supabase) đang chạy tại http://localhost:${PORT}`);
  console.log(`  Supabase project: ${SUPABASE_URL}`);
});
