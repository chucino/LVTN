---
name: task-backup-safety
description: Quy trình bắt buộc để ghi nhật ký nhiệm vụ (task log) và sao lưu (backup) file trước khi chỉnh sửa trong dự án LVTN (client Vue + server NestJS), nhằm tránh mất dữ liệu/file hệ thống và giữ lịch sử công việc rõ ràng. LUÔN áp dụng khi bắt đầu bất kỳ nhiệm vụ nào trong dự án, và LUÔN backup trước khi chỉnh sửa file lớn hoặc file quan trọng. Dùng khi người dùng nhắc tới: task, nhiệm vụ, checklist, backup, sao lưu, rollback, khôi phục, mất file, nhật ký công việc, migration, refactor.
---

# Task & Backup Safety — Ghi nhật ký nhiệm vụ + Sao lưu an toàn

Mục tiêu: (1) mọi việc agent làm đều có dấu vết rõ ràng, truy lại được; (2) không thao tác chỉnh sửa nào có thể gây mất file mà không có đường lui.

Vị trí: `tasks/` và `backup/` nằm ở **thư mục gốc `LVTN/`** (ngang hàng `client/`, `server/`), vì chúng phục vụ cả hai dự án con. Mọi đường dẫn bên dưới tính từ `LVTN/`.

## 1. Ghi nhật ký nhiệm vụ (task log)

### Vị trí và đặt tên

- Lưu trong `tasks/`.
- Mỗi file tối đa **10 nhiệm vụ**. Khi đủ 10 mục, tạo file mới: `task-1.md → task-2.md → task-3.md ...`
- Có file chỉ mục `tasks/INDEX.md` luôn trỏ tới file đang hoạt động (file mới nhất chưa đầy):

  ```md
  # Task Index

  - Đang hoạt động: task-3.md (7/10)
  - Đã đóng: task-1.md, task-2.md
  ```

- Nếu `tasks/` hoặc `INDEX.md` chưa tồn tại (dự án mới), tạo `tasks/INDEX.md` và `tasks/task-1.md` trước khi làm nhiệm vụ đầu tiên.

### Format một nhiệm vụ

Ghi **ngay khi bắt đầu**, không ghi sau khi làm xong (nếu có sự cố giữa chừng vẫn có dấu vết):

```md
## [ ] #014 - Thêm endpoint tạo đơn hàng trong module orders

- Bắt đầu: 2026-10-12 14:32
- Phạm vi: server
- File liên quan: server/src/modules/orders/orders.service.ts, orders.controller.ts
- Mô tả: tạo đơn hàng, tính tổng tiền ở server từ giá khóa học và mã giảm giá
- Backup: backup/server/src/app.module.ts.20261012-1432.bak (nếu có)
- Hoàn thành: —
- Tóm tắt thay đổi: —
```

Sau khi xong, cập nhật lại đúng mục đó (không tạo mục trùng):

```md
## [x] #014 - Thêm endpoint tạo đơn hàng trong module orders

...

- Hoàn thành: 2026-10-12 15:10
- Tóm tắt thay đổi: thêm OrdersModule, POST /orders, kiểm tra mã giảm giá, sinh mã đơn DH + 5 ký tự
```

Quy tắc nội dung:

- Mỗi mục là **một nhiệm vụ cụ thể**, nói rõ sửa gì, ở đâu (không ghi chung chung kiểu "sửa bug").
- Trường `Phạm vi`: `client`, `server`, hoặc `cả hai`.
- Đánh số nhiệm vụ **liên tục xuyên suốt dự án** (#014 dù đang ở task-2.md), không reset khi sang file mới.
- Không xóa nhiệm vụ cũ, kể cả khi làm sai/hủy: đánh dấu `[~]` kèm lý do để giữ lịch sử trung thực.
- Nhiệm vụ thêm dependency hoặc chốt quyết định công nghệ phải nêu lý do (theo `project-architecture/references/tech-stack.md`).

## 2. Backup trước khi chỉnh sửa file lớn/quan trọng

### Khi nào phải backup (bắt buộc)

- File có **> 200 dòng**, HOẶC
- File thuộc nhóm **quan trọng bất kể kích thước**:
  - Cấu hình: `package.json`, `package-lock.json`, `.env`, `tsconfig*.json`, `vite.config.ts`, `nest-cli.json`, `.prettierrc`, `oxlint.json`, `vitest.config*.ts`
  - Khởi động hệ thống: `server/src/main.ts`, `server/src/app.module.ts`, `client/src/main.ts`, `client/src/router/index.ts`, `client/src/plugins/vuetify.ts`
  - Schema và migration database (ví dụ `schema.prisma`, thư mục `migrations/`, file entity nếu dùng TypeORM)
  - Logic tiền và quyền: module `payments`, `orders`, `auth`, `RolesGuard`/`JwtAuthGuard` — sai ở đây ảnh hưởng thanh toán và bảo mật
  - Bất kỳ file nào sắp bị **refactor lớn / đổi cấu trúc / xóa phần lớn nội dung**

### Cách backup

- Thư mục `backup/` ở gốc dự án, **giữ nguyên cấu trúc thư mục gốc** (gồm cả tiền tố `client/` hoặc `server/`).
- Đặt tên kèm timestamp, không ghi đè:

  ```
  backup/server/src/modules/orders/orders.service.ts.20261012-1432.bak
  backup/client/vite.config.ts.20261012-0905.bak
  backup/db/schema.20261012-1100.sql
  ```

- Backup được tạo **trước khi sửa**. Nếu quên, dừng lại backup trước rồi mới tiếp tục.
- Ghi đường dẫn bản backup vào đúng mục nhiệm vụ trong `task-N.md`.
- Không backup `node_modules/`, `dist/`, file build.

### Quản lý backup theo thời gian

- Giữ tối đa **5 bản backup gần nhất cho mỗi file**. Khi vượt quá, xóa bản cũ nhất — nhưng **chỉ dọn dẹp khi người dùng đồng ý/yêu cầu**, không tự ý xóa nếu không chắc.
- Thêm `backup/` vào `.gitignore`: backup có thể chứa dữ liệu nhạy cảm (secret cũ trong `.env`, dữ liệu người dùng).

### Git và backup

Backup `.bak` là lớp bảo vệ bổ sung, không thay thế git. Hiện `server/` có `.git` riêng; `client/` và thư mục gốc chưa nằm trong repo nào, nên backup là biện pháp bảo vệ chính cho phía `client/` cho đến khi người dùng quyết định cách quản lý git (một repo ở gốc hay hai repo riêng). Agent **không tự `git init`, không tự xóa `.git`, không tự gộp repo** — hỏi người dùng nếu thấy cần.

## 3. Quy trình thực hiện một nhiệm vụ (đầu-cuối)

1. Mở/tạo file task đang active theo `tasks/INDEX.md`, thêm mục nhiệm vụ mới `[ ]`.
2. Nếu nhiệm vụ đụng file thuộc diện phải backup (mục 2) → backup **trước**, ghi đường dẫn vào mục nhiệm vụ.
3. Thực hiện nhiệm vụ.
4. Đánh dấu `[x]`, điền thời gian hoàn thành và tóm tắt thay đổi.
5. Nếu file task chạm mốc 10 mục → tạo `task-(N+1).md`, cập nhật `tasks/INDEX.md`.

## 4. Khôi phục khi có sự cố (rollback)

1. Tìm bản backup mới nhất của file lỗi (theo timestamp trong tên, hoặc tra trong `task-N.md`).
2. Copy đè bản backup lên file gốc.
3. Ghi việc rollback thành **một nhiệm vụ mới** trong task log hiện tại (không sửa nhiệm vụ cũ), nêu lý do và bản đã khôi phục.

## 5. Nguyên tắc an toàn bổ sung

- Không chạy lệnh phá hủy hàng loạt (`rm -rf`, `DROP TABLE`, `git push --force`, `git reset --hard`, ghi đè migration đã chạy) khi chưa backup và chưa xác nhận rõ ràng với người dùng.
- **Trước khi chạy migration database**: backup schema/dump hiện tại vào `backup/db/`. Không chạy migration hoặc lệnh xóa dữ liệu trên DB mà người dùng cho là dữ liệu thật/demo quan trọng nếu chưa được xác nhận.
- Trước một refactor lớn (đổi cấu trúc thư mục, đổi tên hàng loạt file, nâng cấp phiên bản major của Vue/NestJS/Vuetify/Tailwind/ORM): backup toàn bộ file bị ảnh hưởng và ghi thành một nhiệm vụ riêng mô tả phạm vi trước khi bắt đầu.
- Không commit `.env`, khóa API, mật khẩu SMTP, khóa webhook ngân hàng, hay bất kỳ credential nào — kể cả bản backup của chúng. Kiểm tra lại trước khi commit.
- Không ghi giá trị secret vào file task log (chỉ ghi tên biến, không ghi giá trị).

## 6. Checklist trước khi coi một nhiệm vụ là "xong"

- [ ] Nhiệm vụ đã ghi vào đúng `task-N.md` đang active, mô tả cụ thể
- [ ] File lớn/quan trọng bị sửa đã có backup trước khi sửa, đường dẫn đã ghi vào task
- [ ] Mục nhiệm vụ đã đánh dấu `[x]` kèm thời gian + tóm tắt thay đổi
- [ ] `tasks/INDEX.md` trỏ đúng file active
- [ ] Nếu file task đủ 10 mục → đã tạo file kế tiếp và cập nhật INDEX
- [ ] Không có lệnh phá hủy nào được chạy thiếu backup + xác nhận
- [ ] Không có secret nào trong task log hoặc file sắp commit
