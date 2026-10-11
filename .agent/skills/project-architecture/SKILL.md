---
name: project-architecture
description: Quy định kiến trúc thư mục, phân lớp và công nghệ bắt buộc của dự án LVTN — client Vue 3 + Vite + Vuetify + Tailwind, server NestJS + TypeScript. LUÔN tra cứu skill này trước khi tạo file/thư mục mới, thêm dependency, viết API, tạo module/component/trang, hoặc quyết định đặt một đoạn code ở đâu. Dùng khi người dùng nhắc tới kiến trúc, cấu trúc thư mục, folder structure, setup, thêm module/API/component hoặc vị trí đặt code. Với bảo mật, dùng `.agent/skills/security/SKILL.md`.
---

# Project Architecture — Vue (client) + NestJS (server)

Dự án: **Xây dựng website đăng ký và học tập trực tuyến các khóa học lập trình cho trung tâm đào tạo** (luận văn tốt nghiệp, làm cá nhân).
Mô tả nghiệp vụ đầy đủ: `docs/Mo_Ta_He_Thong.md` — đọc file này trước khi viết logic nghiệp vụ (khóa học, đơn hàng, thanh toán, chứng chỉ, live, phân quyền).

## 0. Ràng buộc công nghệ (bắt buộc, không đổi nếu không có task riêng)

| Thành phần             | Công nghệ                                                                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Ngôn ngữ               | TypeScript cho cả server và client (không viết `.js` cho code mới)                                                                        |
| Server                 | NestJS (Node.js)                                                                                                                          |
| Client                 | Vue 3 (Composition API, `<script setup lang="ts">`) + Vite                                                                                |
| Routing / State / HTTP | Vue Router, Pinia, Axios                                                                                                                  |
| Giao diện              | Vuetify (component) + Tailwind CSS (layout, spacing, tiện ích)                                                                            |
| Icon                   | `lucide-vue-next` — không trộn bộ icon khác, không dùng emoji trong UI hệ thống                                                           |
| Database               | PostgreSQL hoặc MySQL + Prisma hoặc TypeORM (**chưa chốt** — xem `references/tech-stack.md`, chốt trước khi viết module đầu tiên dùng DB) |
| Xác thực / phân quyền  | JWT + Guards theo vai trò (RBAC)                                                                                                          |

Chi tiết từng công nghệ, quy ước sử dụng, và **quy trình thêm công nghệ mới** nằm trong `references/tech-stack.md`. Luôn đọc file đó trước khi thêm bất kỳ dependency mới nào.

## 1. Cấu trúc thư mục gốc

`client/` và `server/` là hai dự án độc lập, mỗi bên có `package.json`, `node_modules` riêng. `package.json` ở gốc `LVTN/` chỉ dùng `concurrently` để chạy đồng thời client và server, không chứa dependency của ứng dụng.

```
LVTN/
├── .agent/skills/             ← skill cho agent (file này nằm ở đây)
├── docs/                      ← tài liệu: Mo_Ta_He_Thong.md, sơ đồ, ghi chú
├── tasks/                     ← nhật ký nhiệm vụ (skill task-backup-safety)
├── backup/                    ← bản sao lưu trước khi sửa (skill task-backup-safety, git-ignored)
├── package.json               ← chỉ chạy đồng thời client và server bằng concurrently
├── shared/types/               ← kế hoạch, chưa tạo; chỉ tạo theo nhiệm vụ riêng
│
├── client/                    ← Vue 3 + Vite
│   ├── src/
│   │   ├── main.ts             # entry: tạo app, gắn router/pinia/vuetify
│   │   ├── App.vue
│   │   ├── router/             # index.ts + guard kiểm tra đăng nhập/vai trò
│   │   ├── stores/             # Pinia: auth.store.ts, cart/order.store.ts...
│   │   ├── layouts/            # DefaultLayout, LearningLayout (7/3), DashboardLayout
│   │   ├── pages/              # 1 file = 1 trang, chia theo nhóm vai trò
│   │   │   ├── public/         #   trang chủ, danh sách/chi tiết khóa học, tra cứu chứng chỉ, đăng nhập/ký
│   │   │   ├── student/        #   khóa học của tôi, học tập, đơn hàng, chứng chỉ, lịch live, cài đặt
│   │   │   ├── instructor/     #   quản lý khóa học, bài giảng, lịch live, học viên
│   │   │   └── admin/          #   người dùng, duyệt khóa, đơn hàng, mã giảm giá, thống kê (kế toán dùng chung nhóm này theo quyền)
│   │   ├── components/
│   │   │   ├── ui/             # thành phần nền tảng bọc Vuetify (AppButton, AppDialog...)
│   │   │   └── <domain>/       # course/, learning/, order/, certificate/...
│   │   ├── composables/        # useXxx.ts — tách logic khỏi UI (useAuth, useCourseProgress...)
│   │   ├── services/           # gọi API server: http.ts (axios instance) + auth.api.ts, courses.api.ts...
│   │   ├── plugins/            # vuetify.ts (theme, icon aliases), các plugin khác
│   │   ├── types/              # type/interface của client (phản ánh response API)
│   │   ├── lib/                # hàm thuần: format tiền VND, ngày giờ...
│   │   ├── assets/
│   │   └── style.css           # entry Tailwind + biến theme
│   ├── public/
│   ├── .env / .env.example
│   └── vite.config.ts, tsconfig*.json, package.json
│
└── server/                    ← NestJS
    ├── src/
    │   ├── main.ts             # bootstrap: ValidationPipe, helmet, CORS, Swagger
    │   ├── app.module.ts       # chỉ import các module, không chứa logic
    │   ├── config/             # đọc + validate biến môi trường (@nestjs/config)
    │   ├── common/             # dùng chung: decorators/, filters/, guards/, interceptors/, pipes/, utils/
    │   ├── database/           # kết nối DB / PrismaService (tùy ORM đã chọn)
    │   ├── jobs/               # tác vụ định kỳ @nestjs/schedule (hủy đơn quá hạn, nhắc live)
    │   └── modules/            # mỗi nghiệp vụ là một module; chỉ tạo khi bắt đầu làm chức năng cần đến
    │       ├── auth/
    │       ├── users/
    │       ├── courses/
    │       ├── lessons/
    │       ├── enrollments/
    │       ├── progress/
    │       ├── quizzes/
    │       ├── flashcards/
    │       ├── projects/
    │       ├── live-sessions/
    │       ├── attendance/
    │       ├── orders/
    │       ├── payments/
    │       ├── coupons/
    │       ├── certificates/
    │       ├── reviews/
    │       ├── questions/
    │       ├── notifications/
    │       ├── statistics/
    │       └── mail/
    ├── test/                   # e2e
    ├── .env / .env.example
    └── nest-cli.json, tsconfig*.json, package.json
```

Cây trên mô tả vị trí các thư mục khi cần dùng; chỉ tạo thư mục khi bắt đầu làm chức năng cần nó, không tạo trước thư mục rỗng.

Mỗi module trong `server/src/modules/<tên>/` có cấu trúc:

```
<tên>/
├── <tên>.module.ts
├── <tên>.controller.ts
├── <tên>.service.ts
├── dto/              # request/response DTO (class-validator)
├── entities/         # (nếu dùng TypeORM) hoặc bỏ nếu dùng Prisma
└── <tên>.service.spec.ts   # unit test cạnh file
```

**Về các thư mục trống đã tạo sẵn** `server/src/controller/`, `server/src/module/`, `server/src/service/`: không dùng nữa. Tổ chức theo loại file (tất cả controller một chỗ) không hợp với NestJS và khó mở rộng khi có hơn 10 module. Xóa chúng khi bắt đầu viết module đầu tiên (ghi thành task). `app.controller.ts` / `app.service.ts` mặc định cũng nên xóa khi không còn dùng.

## 2. Nguyên tắc phân lớp

### Server: controller → service → (repository/ORM)

- `*.controller.ts` chỉ: khai báo route, gắn guard/decorator, nhận DTO đã validate, gọi service, trả kết quả. **Không chứa business logic.**
- `*.service.ts` chứa toàn bộ nghiệp vụ. Đây là nơi viết unit test.
- Truy cập DB chỉ qua ORM đã chọn (PrismaService hoặc Repository của TypeORM) và chỉ từ service (hoặc `*.repository.ts` nếu truy vấn phức tạp). Controller không chạm DB.
- Module giao tiếp với nhau qua service được `exports` của module đó, không import thẳng entity/bảng của module khác để tự query. Tránh phụ thuộc vòng; nếu cần, tách logic chung ra module thứ ba.
- Lỗi dùng exception của Nest (`NotFoundException`, `ForbiddenException`...) và Exception Filter tập trung; không tự `try/catch` rồi trả response tùy ý.
- Mọi dữ liệu vào đều qua DTO + `ValidationPipe` (`whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`).
- Import: dùng đường dẫn tương đối trong server. Không cấu hình alias `@/` cho server trừ khi có task riêng, vì build bằng `tsc` không tự đổi alias khi chạy và dễ làm hỏng bản build.

### Client: pages → components → composables → services/stores

- `pages/` ghép layout + component, không gọi API trực tiếp.
- `components/` nhận dữ liệu qua props, phát sự kiện qua emit, hạn chế side-effect.
- Logic gọi API tập trung ở `services/` (một axios instance trong `http.ts`, gắn token và xử lý 401 ở interceptor). Không `axios`/`fetch` trong component.
- State dùng chung (người dùng đăng nhập, giỏ/đơn đang tạo, thông báo) đặt trong Pinia store; state cục bộ của một component giữ trong component.
- Component nền tảng đặt ở `components/ui/`, mọi nơi khác tái sử dụng, không tự dựng bản Button/Dialog riêng.
- Import dùng alias `@/` (cấu hình cả `vite.config.ts` lẫn `tsconfig.app.json`), không dùng import tương đối dài `../../../`.
- Không dùng `v-html` với nội dung do người dùng nhập (đánh giá, hỏi đáp, ghi chú bài giảng).

### Type dùng chung giữa client và server

`shared/types/` là kế hoạch, chưa tạo. Chỉ tạo khi có nhiệm vụ riêng vì build server bằng `tsc` dễ bị đổi cấu trúc `dist/` khi code nằm ngoài `server/`. Trong lúc chưa có, client tự khai báo type trong `client/src/types/` theo DTO của server.

- DTO/entity là nguồn sự thật ở `server/`. Client khai báo type tương ứng trong `client/src/types/` khi dùng API đó.
- Khi đổi shape của API, cập nhật cả hai nơi trong cùng một task và ghi vào mục "Tóm tắt thay đổi".

## 3. Quy tắc bảo mật

Trước khi triển khai hoặc rà soát xác thực, OTP, nội dung trả phí, thanh toán hay cấu hình, làm theo checklist trong `.agent/skills/security/SKILL.md`.

## 4. Giao diện

- Vuetify cho component có sẵn (form, dialog, bảng, v.v.); Tailwind cho layout, khoảng cách, responsive. Không dựng lại component mà Vuetify đã có.
- Màu, bo góc, font khai báo **một nơi** (theme trong `plugins/vuetify.ts`, biến trong `style.css`), dùng lại cho Tailwind. Không hardcode mã màu rải rác trong component.
- Icon chỉ từ `lucide-vue-next`. Icon nội bộ của Vuetify (mũi tên select, checkbox...) cấu hình alias trỏ về Lucide trong `plugins/vuetify.ts`.
- Responsive trên điện thoại là yêu cầu bắt buộc (xem phần phi chức năng).
- Trang học tập dùng `LearningLayout` bố cục 7/3: trái là video + nội dung bài, phải là danh sách chương/bài có nút thu gọn/mở rộng.
- Chi tiết thêm về quy ước giao diện: `references/tech-stack.md`.

## 5. Biến môi trường

- Server: `server/.env`, đọc và validate tập trung qua `src/config/`.
- Client: `client/.env`, chỉ biến cần cho trình duyệt, prefix `VITE_`.
- Thêm biến mới: cập nhật `.env.example` cùng lúc.

## 6. Quy ước đặt tên

- Vue component/page/layout: `PascalCase.vue` (`CourseCard.vue`). Composable: `useCamelCase.ts`. Store: `xxx.store.ts`. Service API: `xxx.api.ts`.
- Server theo quy ước Nest: `kebab-case` + hậu tố vai trò (`course-lesson.service.ts`, `create-order.dto.ts`, `roles.guard.ts`).
- Thư mục: `kebab-case`, chữ thường.
- Biến/hàm `camelCase`; type/interface/class `PascalCase`; hằng số cấu hình `UPPER_SNAKE_CASE`.
- Bảng DB và endpoint đặt theo danh từ số nhiều (`/courses`, `/orders`); chọn một kiểu đặt tên cột (snake_case hoặc camelCase) ở lần tạo schema đầu tiên và giữ nhất quán.

## 7. Chạy dự án

`package.json` ở gốc chỉ dùng `concurrently` để chạy đồng thời client và server, không chứa dependency của ứng dụng. Có thể tiếp tục chạy riêng:

- Server: `cd server` → `npm run start:dev`
- Client: `cd client` → `npm run dev`

Triển khai (server phục vụ file tĩnh của client hay tách riêng) sẽ chốt ở giai đoạn cuối, ghi vào `docs/`.

## 8. Checklist trước khi thêm code mới

- [ ] File TypeScript (`.ts`, `.vue` với `lang="ts"`), không tạo file `.js` mới
- [ ] Đặt đúng tầng: controller không chứa logic, component không gọi axios trực tiếp
- [ ] Server: code nghiệp vụ nằm trong `modules/<domain>/`, DTO có validate
- [ ] Route mới đã có guard/vai trò đúng, có kiểm tra quyền sở hữu nếu cần
- [ ] Không có giá, số tiền, quyền hạn nào được tin từ client
- [ ] Đã rà soát nhóm bảo mật phù hợp trong `.agent/skills/security/SKILL.md` (auth/OTP, nội dung trả phí, thanh toán, cấu hình)
- [ ] Style dùng Vuetify + Tailwind theo theme chung; icon từ `lucide-vue-next`
- [ ] Biến môi trường mới đã thêm vào đúng `.env` và `.env.example`; không có secret trong `client/.env`
- [ ] Nếu thêm dependency: đã đọc `references/tech-stack.md`, thêm mục mô tả, cài đúng `package.json` (`client/` hay `server/`)
- [ ] Đã ghi nhiệm vụ và backup theo skill `task-backup-safety`

## 9. Tài liệu tham khảo

- `references/tech-stack.md` — chi tiết công nghệ, các quyết định còn mở, quy trình thêm công nghệ mới, lịch sử thay đổi.
- `docs/Mo_Ta_He_Thong.md` — mô tả nghiệp vụ và phạm vi hệ thống.
