/**
 * MeetSync - Backend cho Web Dashboard Quản lý Cuộc họp
 *
 * Viết bằng Node.js thuần (module "http" có sẵn) — KHÔNG cần "npm install"
 * để chạy demo được ngay. Dữ liệu lưu trong data/db.json, đóng vai trò như
 * một CSDL đơn giản (JSON file-based DB).
 *
 * Lớp truy xuất dữ liệu (readDB/writeDB) tách biệt với các route phía trên,
 * nên nếu sau này muốn đổi sang MySQL/Postgres/MSSQL thì chỉ cần viết lại
 * readDB()/writeDB() mà không phải sửa logic nghiệp vụ.
 *
 * Chạy:
 *   node server.js
 *   (mặc định cổng 3001, có thể đổi bằng biến môi trường PORT)
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const PORT = process.env.PORT || 3001;
const DB_PATH = path.join(__dirname, "data", "db.json");

// ---------------------------------------------------------------------------
// Lớp truy xuất dữ liệu (Data Access Layer)
// ---------------------------------------------------------------------------
function readDB() {
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw);
}

function writeDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
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
      // giới hạn 1MB tránh payload quá lớn
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
// Validate & helpers nghiệp vụ
// ---------------------------------------------------------------------------
function attachNames(meeting, empMap) {
  return {
    ...meeting,
    organizerName: empMap[meeting.organizerId] ? empMap[meeting.organizerId].name : "N/A",
    participantNames: (meeting.participants || []).map((id) => (empMap[id] ? empMap[id].name : "N/A")),
  };
}

// Kiểm tra trùng lịch phòng họp (cùng phòng, cùng ngày, khung giờ giao nhau)
// chỉ tính các cuộc họp chưa bị từ chối.
function hasRoomConflict(db, { room, date, startTime, endTime }, ignoreId) {
  return db.meetings.some((m) => {
    if (m.id === ignoreId) return false;
    if (m.status === "rejected") return false;
    if (m.room !== room || m.date !== date) return false;
    return startTime < m.endTime && endTime > m.startTime;
  });
}

// ---------------------------------------------------------------------------
// Nghiệp vụ
// ---------------------------------------------------------------------------

// GET /api/meetings?status=&from=&to=&room=&search=
function listMeetings(query) {
  const db = readDB();
  let meetings = db.meetings;

  if (query.status) meetings = meetings.filter((m) => m.status === query.status);
  if (query.from) meetings = meetings.filter((m) => m.date >= query.from);
  if (query.to) meetings = meetings.filter((m) => m.date <= query.to);
  if (query.room) meetings = meetings.filter((m) => m.room === query.room);
  if (query.search) {
    const q = query.search.toLowerCase();
    meetings = meetings.filter((m) => m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q));
  }

  const empMap = Object.fromEntries(db.employees.map((e) => [e.id, e]));
  return meetings
    .slice()
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
    .map((m) => attachNames(m, empMap));
}

// GET /api/meetings/:id
function getMeeting(id) {
  const db = readDB();
  const meeting = db.meetings.find((m) => m.id === id);
  if (!meeting) throw { status: 404, message: "Không tìm thấy cuộc họp" };
  const empMap = Object.fromEntries(db.employees.map((e) => [e.id, e]));
  return attachNames(meeting, empMap);
}

// POST /api/meetings (Trưởng phòng tạo cuộc họp mới -> mặc định approved)
// Nhân viên tạo (createdBy khác organizerId hệ Trưởng phòng) -> mặc định pending
function createMeeting(payload) {
  const db = readDB();
  const required = ["title", "date", "startTime", "endTime", "room", "organizerId"];
  for (const field of required) {
    if (!payload[field]) throw { status: 400, message: `Thiếu trường bắt buộc: ${field}` };
  }
  if (payload.startTime >= payload.endTime) {
    throw { status: 400, message: "Giờ kết thúc phải sau giờ bắt đầu" };
  }

  const organizerId = Number(payload.organizerId);
  const organizer = db.employees.find((e) => e.id === organizerId);
  if (!organizer) throw { status: 400, message: "organizerId không hợp lệ" };

  if (hasRoomConflict(db, payload)) {
    throw { status: 409, message: "Phòng họp đã có lịch trong khung giờ này" };
  }

  const status = payload.status === "pending" || organizer.role !== "TruongPhong" ? "pending" : "approved";

  const meeting = {
    id: db.nextMeetingId++,
    title: payload.title,
    description: payload.description || "",
    date: payload.date,
    startTime: payload.startTime,
    endTime: payload.endTime,
    room: payload.room,
    organizerId,
    status,
    participants: (payload.participants || []).map(Number),
    createdBy: payload.createdBy ? Number(payload.createdBy) : organizerId,
  };
  db.meetings.push(meeting);
  writeDB(db);

  const empMap = Object.fromEntries(db.employees.map((e) => [e.id, e]));
  return attachNames(meeting, empMap);
}

// POST /api/meetings/:id/approve
function approveMeeting(id) {
  const db = readDB();
  const meeting = db.meetings.find((m) => m.id === id);
  if (!meeting) throw { status: 404, message: "Không tìm thấy cuộc họp" };
  meeting.status = "approved";
  delete meeting.rejectReason;
  writeDB(db);
  const empMap = Object.fromEntries(db.employees.map((e) => [e.id, e]));
  return attachNames(meeting, empMap);
}

// POST /api/meetings/:id/reject  { reason }
function rejectMeeting(id, reason) {
  const db = readDB();
  const meeting = db.meetings.find((m) => m.id === id);
  if (!meeting) throw { status: 404, message: "Không tìm thấy cuộc họp" };
  meeting.status = "rejected";
  meeting.rejectReason = reason || "Không có lý do cụ thể";
  writeDB(db);
  const empMap = Object.fromEntries(db.employees.map((e) => [e.id, e]));
  return attachNames(meeting, empMap);
}

// PUT /api/meetings/:id/participants  { participants: [ids] }
function assignParticipants(id, participants) {
  const db = readDB();
  const meeting = db.meetings.find((m) => m.id === id);
  if (!meeting) throw { status: 404, message: "Không tìm thấy cuộc họp" };
  if (!Array.isArray(participants)) throw { status: 400, message: "participants phải là mảng id" };
  meeting.participants = participants.map(Number);
  writeDB(db);
  const empMap = Object.fromEntries(db.employees.map((e) => [e.id, e]));
  return attachNames(meeting, empMap);
}

// DELETE /api/meetings/:id
function deleteMeeting(id) {
  const db = readDB();
  const idx = db.meetings.findIndex((m) => m.id === id);
  if (idx === -1) throw { status: 404, message: "Không tìm thấy cuộc họp" };
  db.meetings.splice(idx, 1);
  writeDB(db);
  return { success: true };
}

// GET /api/employees
function listEmployees() {
  const db = readDB();
  return db.employees;
}

// GET /api/stats
function getStats() {
  const db = readDB();
  const total = db.meetings.length;
  const byStatus = { approved: 0, pending: 0, rejected: 0 };
  const byMonth = {};
  const byRoom = {};
  db.meetings.forEach((m) => {
    byStatus[m.status] = (byStatus[m.status] || 0) + 1;
    const month = m.date.slice(0, 7); // YYYY-MM
    byMonth[month] = (byMonth[month] || 0) + 1;
    byRoom[m.room] = (byRoom[m.room] || 0) + 1;
  });
  return { total, byStatus, byMonth, byRoom };
}

// POST /api/login  { email, password } -- demo đơn giản, không mã hoá thật
function login(email, password) {
  const db = readDB();
  const user = db.employees.find((e) => e.email === email);
  if (!user) throw { status: 401, message: "Sai email hoặc tài khoản không tồn tại" };
  // Demo: mật khẩu cố định "123456" cho mọi tài khoản mẫu
  if (password !== "123456") throw { status: 401, message: "Sai mật khẩu" };
  return user;
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  // CORS preflight
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
      return sendJSON(res, 200, login(body.email, body.password));
    }

    if (pathname === "/api/meetings" && req.method === "GET") {
      return sendJSON(res, 200, listMeetings(query));
    }

    if (pathname === "/api/meetings" && req.method === "POST") {
      const body = await parseBody(req);
      return sendJSON(res, 201, createMeeting(body));
    }

    const idMatch = pathname.match(/^\/api\/meetings\/(\d+)$/);
    if (idMatch && req.method === "GET") {
      return sendJSON(res, 200, getMeeting(Number(idMatch[1])));
    }
    if (idMatch && req.method === "DELETE") {
      return sendJSON(res, 200, deleteMeeting(Number(idMatch[1])));
    }

    const approveMatch = pathname.match(/^\/api\/meetings\/(\d+)\/approve$/);
    if (approveMatch && req.method === "POST") {
      return sendJSON(res, 200, approveMeeting(Number(approveMatch[1])));
    }

    const rejectMatch = pathname.match(/^\/api\/meetings\/(\d+)\/reject$/);
    if (rejectMatch && req.method === "POST") {
      const body = await parseBody(req);
      return sendJSON(res, 200, rejectMeeting(Number(rejectMatch[1]), body.reason));
    }

    const participantsMatch = pathname.match(/^\/api\/meetings\/(\d+)\/participants$/);
    if (participantsMatch && req.method === "PUT") {
      const body = await parseBody(req);
      return sendJSON(res, 200, assignParticipants(Number(participantsMatch[1]), body.participants));
    }

    if (pathname === "/api/employees" && req.method === "GET") {
      return sendJSON(res, 200, listEmployees());
    }

    if (pathname === "/api/stats" && req.method === "GET") {
      return sendJSON(res, 200, getStats());
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
  console.log(`✓ MeetSync backend đang chạy tại http://localhost:${PORT}`);
  console.log(`  Dữ liệu: ${DB_PATH}`);
});
