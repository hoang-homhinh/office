# Văn phòng Team Dev 3D: thiết kế

Ngày: 2026-11-05 · Trạng thái: chờ duyệt

## 1. Mục đích

Người dùng là team lead của một team dev khoảng 10 người, làm ở công ty công nghệ thông tin. Họ cần **một màn hình nhìn là biết ngay team đang thế nào**: ai đang code, ai chờ review, việc nào kẹt, ai đang họp hay nghỉ trưa. Màn hình phải sinh động như một văn phòng thật và **trông chuyên nghiệp**, đủ để mở cho cả team và cấp trên xem.

Trang được trình bày dưới dạng văn phòng 3D: nhân vật đi làm, họp, ăn trưa, ngủ trưa và về nhà theo giờ, còn nhãn trên đầu cho biết trạng thái task lấy từ Git và tracker.

Mức chất lượng mong muốn tham khảo hai ảnh người dùng gửi: một văn phòng isometric sáng màu, và một "Văn phòng AI" 3D nền tối viền neon có panel số liệu. Trang mình làm theo phong cách riêng, không sao chép giao diện của hai sản phẩm đó.

## 2. Mục tiêu

1. Văn phòng 3D render bằng WebGL, có đổ bóng, đèn phòng, ngày và đêm theo giờ.
2. Lịch sinh hoạt trong ngày (giờ mặc định, cấu hình được):

   | Giờ | Hoạt động |
   |---|---|
   | 7:40–8:10 | Đến, gửi xe, vào chỗ |
   | 8:30 | Standup |
   | 12:00 | Ăn trưa ở pantry |
   | 12:30–13:30 | Ngủ trưa (gục bàn hoặc ra sofa) |
   | 13:30–17:30 | Làm việc |
   | 15:00 | Họp sprint (một nhóm người) |
   | Rải rác | Đi WC |
   | 17:30 | Về, một số người ở lại làm thêm |

3. Quy trình task đầy đủ: **Đang code → Chờ review → Chờ QA test → Xong**.
   - Có các nhánh quay lại: review yêu cầu sửa, QA báo bug thì mở lại.
   - Cờ **Bị chặn** gắn được ở bất kỳ bước nào.
4. Dashboard xung quanh văn phòng:
   - Thẻ chỉ số trên cùng
   - Thanh thời gian
   - Danh sách thành viên
   - Feed sự kiện Git
   - PR chờ review lâu nhất
   - Tiến độ sprint
   - Tình trạng pipeline
5. Giai đoạn này chạy bằng **dữ liệu mô phỏng**. Kiến trúc phải sẵn chỗ để thay bằng dữ liệu thật (GitHub/GitLab, tracker, calendar) mà không phải sửa phần hiển thị.

## 3. Không làm (giai đoạn này)

- Không nối dữ liệu thật, không viết server webhook. Đó là giai đoạn 2, có spec riêng.
- Không đăng nhập, không phân quyền.
- Không làm bản mobile đầy đủ. Màn hình hẹp chỉ cần xem được, không vỡ.
- Không chỉnh sửa task từ giao diện. Trang chỉ để xem.

## 4. Phản mục tiêu (làm ra mà dính mấy cái này là hỏng)

- **Thành công cụ giám sát.** Không có bảng xếp hạng cá nhân, "bảng vàng", % hiệu suất theo người, hay đếm commit / số dòng code theo người. Số liệu chỉ nói về **dòng chảy công việc** (kẹt ở đâu, chờ bao lâu).
- **Ăn trưa, ngủ trưa, WC là dữ liệu thật.** Mấy cái này luôn là mô phỏng để trang sinh động, không bao giờ lấy từ nguồn theo dõi thật.
- **Trông như đồ chơi.** Nếu bản 3D nhìn kém chuyên nghiệp hơn ảnh tham khảo thì chưa đạt.
- **Chậm hoặc giật** trên laptop văn phòng bình thường. Mục tiêu khoảng 60 fps, tối thiểu 30 fps.

## 5. Ràng buộc

- Đặt tại `D:\Vinh\team-office`, máy Windows.
- Model 3D chỉ dùng loại có giấy phép dùng thương mại (CC0) hoặc tự dựng.
- Toàn bộ tiếng Việt trên giao diện.
- Tách logic mô phỏng khỏi phần hiển thị, viết bằng code thuần, có test. Đây là hướng người dùng ưu tiên: code xác định, không dùng AI để quyết định logic.

## 6. Các cách đã cân nhắc

| Cách | Ưu | Nhược | Kết luận |
|---|---|---|---|
| A. Giữ canvas 2D, đổi giao diện tối neon | Nhanh, 1–2 ngày | Hình vẫn phẳng, không đạt mức chuyên nghiệp như ảnh tham khảo | Loại |
| **B. Three.js + model low-poly CC0, project Vite** | Ra chất lượng 3D thật (bóng, đèn, đêm đẹp), là nền để nối dữ liệu thật sau này | Mất khoảng 1–2 tuần, phải quản lý tài nguyên 3D | **Người dùng chọn** |
| C. Dựng model riêng bằng Blender hoặc thuê ngoài | Độc nhất, đưa được nhận diện công ty vào | Chậm, tốn | Để sau khi B ổn định |

## 7. Thiết kế

### 7.1 Bố cục màn hình (desktop ≥ 1280px)

```
┌───────────────────────────────────────────────────────────────────────┐
│ ▣ Văn phòng Team Dev   [Văn phòng 3D | Dòng thời gian]   09:42 Làm sáng│
│ [Có mặt 9/10] [Đang code 4] [Chờ review 2] [QA 2] [Bị chặn 1] [Xong 3] │
├───────────────────────────────────────────────────────────────┬───────┤
│                                                               │ zoom  │
│                 VĂN PHÒNG 3D (WebGL)                          │ xoay  │
│     nhãn phòng nổi · nhân vật + chip trạng thái              │ đặt lại│
│                                                               │ toàn  │
├───────────────────────────────────────────────────────────────┴───────┤
│ [Toàn cảnh] [Khu Dev] [Phòng họp] [Pantry] [Server] [Giải trí] ...    │
│ ▶ 4×  ━━━━━━━━●━━━━━━━━━━━━━━━━━━  07:35 08:45 12:15 15:00 17:42 20:30 │
├──────────────┬──────────────────┬──────────────────┬──────────────────┤
│ Thành viên   │ PR chờ review    │ Tiến độ sprint   │ Hoạt động Git    │
│ (vị trí +    │ lâu nhất         │ (vòng + burndown)│ (feed)           │
│  task)       │                  │ Pipeline / deploy│                  │
└──────────────┴──────────────────┴──────────────────┴──────────────────┘
```

- Bấm vào nhân vật hoặc dòng trong danh sách thì camera bay tới người đó và mở thẻ chi tiết. Thẻ gồm vị trí, giờ đến/về, ticket, branch, PR, reviewer, lý do bị chặn.
- Bấm chip trạng thái thì lọc: người khác mờ đi, người khớp được làm nổi bật.
- Tab "Dòng thời gian": hiển thị task của từng người theo giờ trong ngày (dạng Gantt đơn giản).

### 7.2 Hệ thiết kế

- Giao diện **tối mặc định** (nền xanh than đậm) và có thêm giao diện sáng.
- Mỗi trạng thái task có một màu cố định, dùng thống nhất cho chip, viền, nhãn, biểu đồ:

  | Trạng thái | Màu |
  |---|---|
  | Đang code | xanh dương |
  | Chờ review | tím |
  | QA | hổ phách |
  | Xong | xanh lá |
  | Bị chặn | đỏ |
  | Rảnh | xám |

- Nhãn phòng nổi trong không gian 3D: dạng viên thuốc, có icon và viền màu riêng của phòng.
- Font: Be Vietnam Pro (hỗ trợ tiếng Việt tốt), JetBrains Mono cho mã ticket và giờ.
- Icon dạng nét (Lucide).

### 7.3 Văn phòng 3D

Mặt bằng một tầng, cắt nóc, nhìn chéo từ trên xuống. Có xoay, zoom, pan trong giới hạn.

| Khu | Nội dung |
|---|---|
| **Khu Dev** (open-plan, 40 chỗ) | 4 cụm × 10 bàn. Team 10 người ngồi **một cụm**, 3 cụm còn lại là chỗ trống để mở rộng (giữ đúng yêu cầu trước của người dùng) |
| **Phòng họp** | Bàn dài 10–12 ghế, TV tường. TV sáng biểu đồ khi đang họp |
| **Phòng server / DevOps** | Rack máy chủ, đèn LED nhấp nháy nhanh khi pipeline đang chạy, chớp đỏ khi CI fail |
| **Pantry** | Quầy, tủ lạnh, lò vi sóng, bàn ăn |
| **WC** | Hai buồng, bồn rửa |
| **Khu giải trí / thư giãn** | Sofa (chỗ ngủ trưa của vài người), bóng bàn, kệ sách |
| **Sảnh và lễ tân** | Bảng tên team |
| **Bên ngoài** | Bãi xe máy (xe xuất hiện khi người tới, biến mất khi về), cổng, cây, đèn đường, đường có xe chạy |

Ánh sáng:
- Mặt trời đổi góc và màu theo giờ: sáng trắng, chiều vàng cam, đêm xanh tối.
- Đèn phòng tự bật khi có người và trời tối.
- Màn hình máy tính sáng khi người ngồi đó đang làm.
- Ban đêm có đèn đường và đèn xe.

### 7.4 Nhân vật

- Mỗi người một model nhân vật low-poly, khác nhau về màu áo, tóc và giới tính.
- Có các animation: đi, ngồi gõ phím, ngồi ăn, gục bàn ngủ, đứng.
- Trên đầu có chip tròn: chữ cái đầu tên, viền màu theo trạng thái task. Bị chặn thì thêm dấu "!" đỏ nhấp nháy, ngủ trưa thì có "z z".
- Hiện tên đầy đủ khi zoom gần, khi rê chuột vào, hoặc khi đang được chọn.
- Đi lại theo lưới điều hướng (hành lang và cửa), không đi xuyên tường hay bàn.

### 7.5 Lịch sinh hoạt

- Mỗi ngày mô phỏng sinh lịch riêng cho từng người, có dao động ngẫu nhiên quanh giờ chuẩn.
- Thứ tự ưu tiên khi các mốc trùng nhau: về nhà > standup > ăn trưa > ngủ trưa > họp chiều > WC > ngồi làm.
- Giờ chuẩn để trong file cấu hình.
- Kéo thanh thời gian thì mọi người **nhảy ngay** tới vị trí đúng với giờ đó, không đi bộ.

### 7.6 Mô phỏng quy trình task (dữ liệu mẫu)

- Sự kiện chỉ phát sinh khi người đó đang ngồi làm. Các loại sự kiện: đẩy commit, mở PR, review approve hoặc yêu cầu sửa, merge vào develop, deploy staging, QA pass hoặc báo bug, bị chặn, gỡ chặn, nhận ticket mới.
- QA (1 người) xử lý hàng chờ test theo thứ tự.
- Bộ sinh số ngẫu nhiên **có seed**, để cùng seed thì ra cùng kết quả. Phục vụ test và demo lặp lại được.

### 7.7 Dữ liệu và kiến trúc

```
src/
  sim/        logic thuần TS, không phụ thuộc hiển thị: clock, schedule, workflow, rng (có test)
  data/       interface DataSource { snapshot(), subscribe(event) }
              MockSource (giai đoạn 1) · GitSource/TrackerSource (giai đoạn 2)
  store/      trạng thái chung cho 3D và panel (Zustand)
  scene/      Three.js qua React Three Fiber: mặt bằng, model, ánh sáng, nhân vật, camera, điều hướng
  ui/         thanh trên, thanh thời gian, các panel, thẻ chi tiết
  config/     team.json (người, vai trò, chỗ ngồi), schedule.json (giờ), workflow.json (cột ↔ trạng thái)
public/models/  file .glb (nội thất, nhân vật)
```

Kiểu sự kiện chuẩn hoá dùng chung cho cả dữ liệu mẫu và dữ liệu thật:

```
{ at, actor, kind, ticket, pr?, reviewer?, reason? }
kind: commit | pr_opened | review_changes | review_approved | merged | deployed_staging
    | qa_pass | qa_fail | blocked | unblocked | ticket_assigned
```

Giai đoạn 2 chỉ cần viết thêm `GitSource` để chuyển webhook thành các sự kiện trên, phần hiển thị giữ nguyên.

### 7.8 Công nghệ

| Hạng mục | Lựa chọn |
|---|---|
| Nền tảng | Vite + React + TypeScript |
| 3D | three.js, @react-three/fiber, @react-three/drei |
| Trạng thái | Zustand |
| Test | Vitest |
| Biểu đồ panel | SVG tự vẽ, không cần thư viện biểu đồ |

### 7.9 Kiểm thử và nghiệm thu

- Test đơn vị cho `sim/`:
  - Lịch: đúng chỗ theo từng mốc giờ.
  - Quy trình: chỉ chuyển trạng thái hợp lệ, QA xử lý đúng thứ tự hàng chờ.
  - Cùng seed thì cùng kết quả.
- Nghiệm thu bằng mắt: chụp màn hình các mốc 07:45, 08:35, 12:15, 12:50, 15:10, 17:45, 21:00 và so với lịch.
- Hiệu năng: đo fps ở góc nhìn toàn cảnh với 10 người, mục tiêu ≥ 30 fps trên laptop văn phòng.

## 8. Để người xây dựng tự quyết

- Kích thước và toạ độ chính xác của các phòng, miễn đủ chỗ cho các khu ở mục 7.3.
- Chọn bộ model cụ thể (đề xuất: nội thất Kenney, nhân vật Quaternius, đều CC0). Nếu không tải được hoặc không hợp phong cách thì tự dựng low-poly bằng khối cơ bản cùng một phong cách.
- Hiệu ứng hậu kỳ (bloom cho đèn neon ban đêm, ambient occlusion), với điều kiện vẫn đạt yêu cầu fps.
- Chi tiết tab "Dòng thời gian".

## 9. Các quyết định Claude tự chọn (người dùng xem lại)

1. Giao diện tối mặc định, vì hợp với ảnh tham khảo thứ hai.
2. Team 10 người ngồi một cụm trong Khu Dev 40 chỗ, không chia thành phòng Backend/Frontend riêng.
3. Thêm phòng server/DevOps thay cho phòng CI cũ, để thể hiện pipeline.
4. Ngủ trưa: đa số gục bàn, 3 người ra sofa.
5. Giai đoạn 1 chỉ dùng dữ liệu mẫu.
