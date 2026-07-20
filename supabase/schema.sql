-- ============================================================================
-- MeetSync — Schema cho Supabase (Postgres)
-- ============================================================================
-- Cách dùng:
--   1. Vào Supabase Dashboard → chọn project → SQL Editor
--   2. Dán toàn bộ nội dung file này → Run
--   (Chạy 1 lần là đủ; script có DROP TABLE IF EXISTS nên chạy lại cũng an toàn)
-- ============================================================================

drop table if exists public.meetings;
drop table if exists public.employees;

-- ---------------------------------------------------------------------------
-- Bảng nhân viên
-- ---------------------------------------------------------------------------
create table public.employees (
  id          bigint generated always as identity primary key,
  name        text not null,
  email       text not null unique,
  role        text not null check (role in ('TruongPhong', 'NhanVien')),
  department  text not null
);

-- ---------------------------------------------------------------------------
-- Bảng cuộc họp
-- ---------------------------------------------------------------------------
create table public.meetings (
  id             bigint generated always as identity primary key,
  title          text not null,
  description    text not null default '',
  date           date not null,
  start_time     text not null,               -- lưu dạng "HH:MM" cho khớp frontend
  end_time       text not null,
  room           text not null,
  organizer_id   bigint not null references public.employees(id),
  status         text not null default 'pending' check (status in ('approved', 'pending', 'rejected')),
  participants   bigint[] not null default '{}',
  created_by     bigint not null references public.employees(id),
  reject_reason  text
);

create index meetings_date_idx on public.meetings (date);
create index meetings_status_idx on public.meetings (status);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Backend dùng SERVICE ROLE KEY nên tự động bỏ qua RLS. Nếu sau này muốn gọi
-- Supabase trực tiếp từ frontend (anon key) thì cần mở policy bên dưới.
-- ---------------------------------------------------------------------------
alter table public.employees enable row level security;
alter table public.meetings  enable row level security;

create policy "Cho phép đọc employees" on public.employees for select using (true);
create policy "Cho phép đọc meetings"  on public.meetings  for select using (true);

-- ---------------------------------------------------------------------------
-- Dữ liệu mẫu
-- ---------------------------------------------------------------------------
insert into public.employees (id, name, email, role, department) values
  (1, 'Nguyễn Văn An',   'an.nguyen@company.vn',  'TruongPhong', 'Kinh doanh'),
  (2, 'Trần Thị Bình',   'binh.tran@company.vn',  'NhanVien',    'Kinh doanh'),
  (3, 'Lê Văn Cường',    'cuong.le@company.vn',   'NhanVien',    'Kinh doanh'),
  (4, 'Phạm Thị Dung',   'dung.pham@company.vn',  'NhanVien',    'Kinh doanh'),
  (5, 'Hoàng Văn Em',    'em.hoang@company.vn',   'NhanVien',    'Kinh doanh');

insert into public.meetings (id, title, description, date, start_time, end_time, room, organizer_id, status, participants, created_by, reject_reason) values
  (1,  'Họp giao ban tuần 30',              'Báo cáo tiến độ công việc tuần 30 và kế hoạch tuần tới',      '2026-07-22', '08:30', '09:30', 'Phòng họp A', 1, 'approved', '{1,2,3,4,5}', 1, null),
  (2,  'Kế hoạch triển khai khách hàng X',  'Thảo luận phương án triển khai hợp đồng với khách hàng X',    '2026-07-23', '14:00', '15:00', 'Phòng họp B', 2, 'pending',  '{2,3}',       2, null),
  (3,  'Đào tạo sản phẩm Q3',               'Đào tạo nội bộ về dòng sản phẩm mới ra mắt quý 3',             '2026-07-24', '10:00', '11:30', 'Phòng họp A', 4, 'pending',  '{4,5}',       4, null),
  (4,  'Xử lý khiếu nại KH Y',              'Xử lý khiếu nại của khách hàng Y về tiến độ giao hàng',        '2026-07-15', '09:00', '10:00', 'Phòng họp C', 3, 'approved', '{1,3}',       3, null),
  (5,  'Đề xuất họp ngoài giờ',             'Yêu cầu họp gấp về sự cố hệ thống',                            '2026-07-21', '17:30', '18:00', 'Phòng họp B', 5, 'rejected', '{5}',         5, 'Trùng lịch phòng họp, đề nghị dời sang sáng hôm sau'),
  (6,  'Review chiến lược bán hàng Q3',     'Đánh giá kết quả tháng 6 và điều chỉnh chiến lược tháng 7',    '2026-07-25', '13:30', '15:00', 'Phòng họp A', 1, 'approved', '{1,2,3}',     1, null),
  (7,  'Họp định kỳ với Ban Giám đốc',      'Báo cáo tình hình kinh doanh phòng Kinh doanh tháng 7',        '2026-07-28', '09:00', '10:30', 'Phòng họp D', 1, 'pending',  '{1}',         1, null),
  (8,  'Đàm phán hợp đồng đối tác mới',     'Trao đổi điều khoản hợp tác với đối tác Z',                    '2026-07-29', '10:00', '11:00', 'Phòng họp B', 2, 'pending',  '{2,4}',       2, null),
  (9,  'Họp giao ban tuần 29',              'Báo cáo tiến độ và rà soát KPI tuần 29',                       '2026-07-14', '08:30', '09:30', 'Phòng họp A', 1, 'approved', '{1,2,3,4,5}', 1, null),
  (10, 'Sơ kết 6 tháng đầu năm',            'Đánh giá tổng thể hoạt động phòng kinh doanh H1/2026',         '2026-06-30', '14:00', '17:00', 'Phòng họp D', 1, 'approved', '{1,2,3,4,5}', 1, null),
  (11, 'Tuyển dụng nhân sự mới',            'Phỏng vấn ứng viên vị trí Chuyên viên Kinh doanh cấp cao',     '2026-06-25', '09:00', '11:00', 'Phòng họp C', 1, 'approved', '{1,3}',       1, null),
  (12, 'Triển khai hệ thống CRM',           'Hướng dẫn sử dụng hệ thống CRM mới cho toàn bộ phòng',         '2026-06-18', '10:00', '12:00', 'Phòng họp A', 4, 'approved', '{1,2,3,4,5}', 4, null),
  (13, 'Xin lịch họp đột xuất',             'Phản hồi khiếu nại gấp từ khách hàng VIP',                     '2026-06-10', '16:00', '17:00', 'Phòng họp B', 3, 'rejected', '{3,5}',       3, 'Ngoài giờ hành chính, không có phòng trống'),
  (14, 'Họp giao ban tháng 5',              'Đánh giá KPI tháng 5 và lên kế hoạch tháng 6',                 '2026-05-29', '08:30', '10:00', 'Phòng họp A', 1, 'approved', '{1,2,3,4,5}', 1, null),
  (15, 'Workshop kỹ năng thuyết trình',     'Đào tạo kỹ năng mềm: thuyết trình và đàm phán hiệu quả',       '2026-05-20', '13:00', '17:00', 'Phòng họp D', 2, 'approved', '{2,3,4,5}',   2, null);

-- Đảm bảo id tự tăng tiếp theo bắt đầu từ 16 (vì đã insert cứng id 1-15 ở trên)
select setval(pg_get_serial_sequence('public.employees', 'id'), (select max(id) from public.employees));
select setval(pg_get_serial_sequence('public.meetings', 'id'), (select max(id) from public.meetings));
