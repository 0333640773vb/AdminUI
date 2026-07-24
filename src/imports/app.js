let currentUser = null;
let employees = [];

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ---------- Login ----------
$("#login-btn").addEventListener("click", async () => {
  const email = $("#login-email").value.trim();
  const password = $("#login-password").value;
  $("#login-error").textContent = "";
  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    currentUser = data;
    startApp();
  } catch (err) {
    $("#login-error").textContent = err.message;
  }
});

$("#logout-btn").addEventListener("click", () => {
  currentUser = null;
  $("#app").classList.add("hidden");
  $("#login-screen").classList.remove("hidden");
});

async function startApp() {
  $("#login-screen").classList.add("hidden");
  $("#app").classList.remove("hidden");
  $("#user-name").textContent = `${currentUser.name} · ${currentUser.department}`;
  employees = await fetchJSON("/api/employees");
  renderParticipantCheckboxes();
  await refreshAll();
}

// ---------- Tabs ----------
$$(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$(".tab-btn").forEach((b) => b.classList.remove("active"));
    $$(".tab-panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    $(`#tab-${btn.dataset.tab}`).classList.add("active");
  });
});

// ---------- Helpers ----------
async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Lỗi");
  return data;
}

function statusPill(status) {
  const map = { approved: "Đã duyệt", pending: "Chờ duyệt", rejected: "Từ chối" };
  return `<span class="status-pill status-${status}">${map[status] || status}</span>`;
}

function fmtDate(d) {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

// ---------- Dashboard ----------
async function loadDashboard() {
  const meetings = await fetchJSON("/api/meetings");
  const stats = await fetchJSON("/api/stats");
  const today = new Date().toISOString().slice(0, 10);

  $("#dashboard-cards").innerHTML = `
    <div class="card"><div class="num">${stats.total}</div><div class="label">Tổng số cuộc họp</div></div>
    <div class="card"><div class="num">${stats.byStatus.pending || 0}</div><div class="label">Đang chờ duyệt</div></div>
    <div class="card"><div class="num">${stats.byStatus.approved || 0}</div><div class="label">Đã được duyệt</div></div>
    <div class="card"><div class="num">${stats.byStatus.rejected || 0}</div><div class="label">Đã từ chối</div></div>
  `;

  const upcoming = meetings.filter((m) => m.date >= today && m.status !== "rejected").slice(0, 6);
  $("#upcoming-table tbody").innerHTML = upcoming
    .map(
      (m) => `<tr>
        <td>${fmtDate(m.date)}</td><td>${m.startTime}-${m.endTime}</td>
        <td>${m.title}</td><td>${m.room}</td><td>${m.organizerName}</td>
        <td>${statusPill(m.status)}</td>
      </tr>`
    )
    .join("") || `<tr><td colspan="6">Không có cuộc họp sắp tới.</td></tr>`;

  const pendingCount = stats.byStatus.pending || 0;
  $("#pending-count").textContent = pendingCount > 0 ? pendingCount : "";
}

// ---------- Calendar / all meetings ----------
async function loadCalendar() {
  const status = $("#filter-status").value;
  const qs = status ? `?status=${status}` : "";
  const meetings = await fetchJSON(`/api/meetings${qs}`);

  $("#calendar-table tbody").innerHTML = meetings
    .map(
      (m) => `<tr>
        <td>${fmtDate(m.date)}</td><td>${m.startTime}-${m.endTime}</td>
        <td>${m.title}</td><td>${m.room}</td><td>${m.organizerName}</td>
        <td>${m.participantNames.join(", ")}</td>
        <td>${statusPill(m.status)}</td>
        <td>
          <button class="btn-small" onclick="editParticipants(${m.id})">Phân công</button>
        </td>
      </tr>`
    )
    .join("") || `<tr><td colspan="8">Không có cuộc họp.</td></tr>`;
}

$("#filter-status").addEventListener("change", loadCalendar);

window.editParticipants = async function (id) {
  const names = employees.map((e) => e.name).join(", ");
  const input = prompt(
    `Nhập danh sách ID người tham gia, cách nhau bởi dấu phẩy.\nDanh sách nhân viên:\n` +
      employees.map((e) => `${e.id} = ${e.name}`).join("\n")
  );
  if (input === null) return;
  const ids = input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  await fetchJSON(`/api/meetings/${id}/participants`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participants: ids }),
  });
  await refreshAll();
};

// ---------- Requests (approve/reject) ----------
async function loadRequests() {
  const pending = await fetchJSON("/api/meetings?status=pending");
  $("#requests-table tbody").innerHTML = pending
    .map(
      (m) => `<tr>
        <td>${fmtDate(m.date)}</td><td>${m.startTime}-${m.endTime}</td>
        <td>${m.title}</td><td>${m.description || ""}</td>
        <td>${m.organizerName}</td><td>${m.room}</td>
        <td>
          <button class="btn-approve" onclick="approve(${m.id})">Duyệt</button>
          <button class="btn-reject" onclick="reject(${m.id})">Từ chối</button>
        </td>
      </tr>`
    )
    .join("") || `<tr><td colspan="7">Không có yêu cầu nào đang chờ duyệt.</td></tr>`;
}

window.approve = async function (id) {
  await fetchJSON(`/api/meetings/${id}/approve`, { method: "POST" });
  await refreshAll();
};

window.reject = async function (id) {
  const reason = prompt("Lý do từ chối:") || "";
  await fetchJSON(`/api/meetings/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  await refreshAll();
};

// ---------- Create meeting ----------
function renderParticipantCheckboxes() {
  $("#f-participants").innerHTML = employees
    .map((e) => `<label><input type="checkbox" value="${e.id}" /> ${e.name}</label>`)
    .join("");
}

$("#create-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const participants = Array.from($$("#f-participants input:checked")).map((cb) => cb.value);
  const payload = {
    title: $("#f-title").value,
    room: $("#f-room").value,
    date: $("#f-date").value,
    startTime: $("#f-start").value,
    endTime: $("#f-end").value,
    description: $("#f-desc").value,
    organizerId: currentUser.id,
    participants,
  };
  try {
    await fetchJSON("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    $("#create-success").textContent = "Đã tạo cuộc họp thành công.";
    e.target.reset();
    renderParticipantCheckboxes();
    await refreshAll();
    setTimeout(() => ($("#create-success").textContent = ""), 3000);
  } catch (err) {
    $("#create-success").textContent = "Lỗi: " + err.message;
  }
});

// ---------- Report ----------
function bar(label, value, max) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return `<div class="bar-row">
    <div class="bar-label">${label}</div>
    <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
    <div class="bar-val">${value}</div>
  </div>`;
}

async function loadReport() {
  const stats = await fetchJSON("/api/stats");

  const statusLabels = { approved: "Đã duyệt", pending: "Chờ duyệt", rejected: "Từ chối" };
  const statusMax = Math.max(...Object.values(stats.byStatus), 1);
  $("#report-status").innerHTML = Object.entries(stats.byStatus)
    .map(([k, v]) => bar(statusLabels[k] || k, v, statusMax))
    .join("");

  const roomMax = Math.max(...Object.values(stats.byRoom), 1);
  $("#report-room").innerHTML = Object.entries(stats.byRoom)
    .map(([k, v]) => bar(k, v, roomMax))
    .join("");

  const monthMax = Math.max(...Object.values(stats.byMonth), 1);
  $("#report-month").innerHTML = Object.entries(stats.byMonth)
    .sort()
    .map(([k, v]) => bar(k, v, monthMax))
    .join("");
}

async function refreshAll() {
  await Promise.all([loadDashboard(), loadCalendar(), loadRequests(), loadReport()]);
}
