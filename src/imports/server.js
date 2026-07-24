/**
 * HK253_DAMH_Nhom2 - Module Trưởng phòng
 * Hệ thống Quản lý Cuộc họp (Meeting Management System)
 *
 * Backend viết bằng Node.js thuần (module "http" có sẵn), KHÔNG phụ thuộc
 * thư viện ngoài để dễ chạy demo. Dữ liệu lưu trong data/db.json, đóng vai
 * trò như một CSDL đơn giản (JSON file-based DB).
 *
 * Ghi chú: Đề bài cho phép dùng bất kỳ CSDL nào (MS SQL Server, Postgres...).
 * Ở đây nhóm dùng JSON file để gọn nhẹ khi demo; lớp truy xuất dữ liệu
 * (đọc/ghi db.json bên dưới) có thể thay thế bằng driver pg / mssql mà
 * không phải sửa các route phía trên, vì mọi thao tác đều đi qua readDB()/writeDB().
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, "data", "db.json");
const PUBLIC_DIR = path.join(__dirname, "public");

// ---------- Lớp truy xuất dữ liệu (Data Access Layer) ----------
function readDB() {
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw);
}

function writeDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

// ---------- Tiện ích ----------
function sendJSON(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function serveStatic(req, res, pathname) {
  let filePath = pathname === "/" ? "/index.html" : pathname;
  filePath = path.join(PUBLIC_DIR, filePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("404 Not Found");
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(content);
  });
}

// ---------- Nghiệp vụ (Business logic) cho vai trò Trưởng phòng ----------

// GET /api/meetings?status=&from=&to=
function listMeetings(query) {
  const db = readDB();
  let meetings = db.meetings;
  if (query.status) {
    meetings = meetings.filter((m) => m.status === query.status);
  }
  if (query.from) {
    meetings = meetings.filter((m) => m.date >= query.from);
  }
  if (query.to) {
    meetings = meetings.filter((m) => m.date <= query.to);
  }
  // Đính kèm tên người tổ chức + danh sách người tham gia (đọc từ bảng employees)
  const empMap = Object.fromEntries(db.employees.map((e) => [e.id, e]));
  meetings = meetings
    .slice()
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
    .map((m) => ({
      ...m,
      organizerName: empMap[m.organizerId] ? empMap[m.organizerId].name : "N/A",
      participantNames: m.participants.map((id) => (empMap[id] ? empMap[id].name : "N/A")),
    }));
  return meetings;
}

// POST /api/meetings  (Trưởng phòng tạo cuộc họp mới -> mặc định approved)
function createMeeting(payload) {
  const db = readDB();
  const required = ["title", "date", "startTime", "endTime", "room", "organizerId"];
  for (const field of required) {
    if (!payload[field]) throw { status: 400, message: `Thiếu trường bắt buộc: ${field}` };
  }
  const meeting = {
    id: db.nextMeetingId++,
    title: payload.title,
    description: payload.description || "",
    date: payload.date,
    startTime: payload.startTime,
    endTime: payload.endTime,
    room: payload.room,
    organizerId: Number(payload.organizerId),
    status: "approved", // trưởng phòng tạo trực tiếp thì tự động được duyệt
    participants: (payload.participants || []).map(Number),
    createdBy: Number(payload.organizerId),
  };
  db.meetings.push(meeting);
  writeDB(db);
  return meeting;
}

// POST /api/meetings/:id/approve
function approveMeeting(id) {
  const db = readDB();
  const meeting = db.meetings.find((m) => m.id === id);
  if (!meeting) throw { status: 404, message: "Không tìm thấy cuộc họp" };
  meeting.status = "approved";
  delete meeting.rejectReason;
  writeDB(db);
  return meeting;
}

// POST /api/meetings/:id/reject  { reason }
function rejectMeeting(id, reason) {
  const db = readDB();
  const meeting = db.meetings.find((m) => m.id === id);
  if (!meeting) throw { status: 404, message: "Không tìm thấy cuộc họp" };
  meeting.status = "rejected";
  meeting.rejectReason = reason || "Không có lý do cụ thể";
  writeDB(db);
  return meeting;
}

// PUT /api/meetings/:id/participants  { participants: [ids] }
function assignParticipants(id, participants) {
  const db = readDB();
  const meeting = db.meetings.find((m) => m.id === id);
  if (!meeting) throw { status: 404, message: "Không tìm thấy cuộc họp" };
  meeting.participants = (participants || []).map(Number);
  writeDB(db);
  return meeting;
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

// POST /api/login  { email, password }  -- demo đơn giản, không mã hoá thật
function login(email, password) {
  const db = readDB();
  const user = db.employees.find((e) => e.email === email && e.role === "TruongPhong");
  if (!user) throw { status: 401, message: "Sai email hoặc bạn không phải Trưởng phòng" };
  // Demo: mật khẩu cố định "123456" cho mọi tài khoản mẫu
  if (password !== "123456") throw { status: 401, message: "Sai mật khẩu" };
  return user;
}

// ---------- Router ----------
const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const { pathname, query } = parsed;

  try {
    if (pathname === "/api/login" && req.method === "POST") {
      const body = await parseBody(req);
      const user = login(body.email, body.password);
      return sendJSON(res, 200, user);
    }

    if (pathname === "/api/meetings" && req.method === "GET") {
      return sendJSON(res, 200, listMeetings(query));
    }

    if (pathname === "/api/meetings" && req.method === "POST") {
      const body = await parseBody(req);
      const meeting = createMeeting(body);
      return sendJSON(res, 201, meeting);
    }

    const approveMatch = pathname.match(/^\/api\/meetings\/(\d+)\/approve$/);
    if (approveMatch && req.method === "POST") {
      const meeting = approveMeeting(Number(approveMatch[1]));
      return sendJSON(res, 200, meeting);
    }

    const rejectMatch = pathname.match(/^\/api\/meetings\/(\d+)\/reject$/);
    if (rejectMatch && req.method === "POST") {
      const body = await parseBody(req);
      const meeting = rejectMeeting(Number(rejectMatch[1]), body.reason);
      return sendJSON(res, 200, meeting);
    }

    const participantsMatch = pathname.match(/^\/api\/meetings\/(\d+)\/participants$/);
    if (participantsMatch && req.method === "PUT") {
      const body = await parseBody(req);
      const meeting = assignParticipants(Number(participantsMatch[1]), body.participants);
      return sendJSON(res, 200, meeting);
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

    // Static files (frontend)
    return serveStatic(req, res, pathname);
  } catch (err) {
    const status = err.status || 500;
    return sendJSON(res, status, { message: err.message || "Lỗi máy chủ" });
  }
});

server.listen(PORT, () => {
  console.log(`Module Trưởng phòng đang chạy tại http://localhost:${PORT}`);
});
