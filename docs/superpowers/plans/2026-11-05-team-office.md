# Văn phòng Team Dev 3D — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dashboard văn phòng 3D (WebGL) cho team dev 10 người: nhân vật sống theo lịch ngày, nhãn trạng thái task theo quy trình Git, ánh sáng ngày/đêm, panel số liệu — chạy bằng dữ liệu mô phỏng có seed.

**Architecture:** Lõi mô phỏng thuần TypeScript trong `src/sim` (không phụ thuộc React/three, có test Vitest) sinh ra `WorldState` mỗi tick. `src/data/MockSource` bọc lõi đó sau interface `DataSource`. Zustand store giữ snapshot cho cả scene 3D (React Three Fiber) và các panel UI.

**Tech Stack:** Vite, React 19, TypeScript, three, @react-three/fiber, @react-three/drei, zustand, vitest, lucide-react, playwright-core (chụp màn hình kiểm tra bằng Edge/Chrome cài sẵn).

**Spec:** `docs/superpowers/specs/2026-11-05-team-office-design.md`

## Global Constraints

- Toàn bộ chữ trên UI bằng tiếng Việt; font Be Vietnam Pro + JetBrains Mono.
- Giao diện tối mặc định, có công tắc sáng.
- Màu trạng thái cố định: Đang code xanh dương, Chờ review tím, QA hổ phách, Xong xanh lá, Bị chặn đỏ, Rảnh xám.
- Không có bảng xếp hạng cá nhân, % hiệu suất theo người, đếm commit theo người.
- Ăn trưa / ngủ / WC luôn là mô phỏng.
- Model 3D: tự dựng low-poly bằng primitive (quyết định của builder theo spec §8 — không phụ thuộc tải asset ngoài, đồng bộ phong cách).
- Mục tiêu ≥ 30 fps ở toàn cảnh.
- `src/sim` không import `react`, `three`.

## Review Focus

1. Kéo thanh thời gian qua nửa đêm / về 00:00 → không ai kẹt giữa đường, ngày mới sinh lịch mới.
2. Tốc độ 30× → nhân vật không bỏ lỡ đích, không đi xuyên tường (đi theo waypoint).
3. QA vắng mặt (chưa đến/đã về) → hàng chờ QA giữ nguyên, không mất ticket.
4. Người bị chặn đúng lúc PR đang review → trạng thái hiển thị "Bị chặn", gỡ chặn quay về đúng bước cũ.
5. Cửa sổ trình duyệt hẹp (≤ 1000px) → panel xếp dọc, canvas không tràn ngang.

---

### Task 1: Scaffold project

**Files:** `package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `.gitignore`

- [ ] `npm create vite@latest . -- --template react-ts`; cài `three @react-three/fiber @react-three/drei zustand lucide-react`, dev `vitest @types/three playwright-core`.
- [ ] Thêm script `"test": "vitest run"`.
- [ ] `git init`, commit `chore: scaffold`.
- [ ] Verify: `npm run build` exit 0.

### Task 2: Config + RNG + clock

**Files:** `src/config/team.ts`, `src/config/schedule.ts`, `src/sim/rng.ts`, `src/sim/time.ts`, `src/sim/types.ts`, test `src/sim/rng.test.ts`

**Produces:**
- `mulberry32(seed: number): () => number`; `class Rng { next(); range(a,b); pick<T>(a:T[]); chance(p) }`
- `hhmm(min: number): string` (`hhmm(1439)==="23:59"`, `hhmm(1440)==="00:00"`)
- `TEAM: PersonConfig[]` (10 người: Minh Backend, Linh Frontend, Tuấn Backend, Hà QA, Dũng DevOps, Trang Frontend, Nam Backend, Phương Mobile, Khoa Fullstack, Vy Frontend)
- `SCHEDULE = { arrive:[462,490], standup:[510,525], lunch:720, nap:[806,810], sprintMeeting:[900,945], leave:[1050,1075], overtime:[1140,1230] }`
- types `TaskStage = 'doing'|'review'|'qa'|'done'`, `Activity = 'home'|'walk'|'work'|'standup'|'sprint'|'eat'|'nap'|'wc'`, `PlaceKey = 'home'|'seat'|'meet'|'pantry'|'sofa'|'wc'|'parking'`

- [ ] Test: cùng seed → cùng dãy 5 số; `range(2,3)` ∈ [2,3).
- [ ] Implement, pass, commit.

### Task 3: Daily schedule

**Files:** `src/sim/schedule.ts`, test `src/sim/schedule.test.ts`

**Produces:** `genDay(rng, team): DayPlan[]` và `want(plan: DayPlan, t: number): {place: PlaceKey, act: Activity}`

Thứ tự ưu tiên: home > standup > eat > nap > sprint > wc > seat/work. Đúng 3 người `sofa` ngủ trưa, 2 người overtime, 4 người họp sprint.

- [ ] Tests: t=400 → home; t=515 (đã đến) → meet/standup; t=lunchStart+1 → pantry/eat; t=lunchEnd+1 & sofa → sofa/nap; t=600 → seat/work; t=leave → home; người overtime t=1100 → seat/work.
- [ ] Implement, pass, commit.

### Task 4: Floor plan + navigation

**Files:** `src/sim/layout.ts`, `src/sim/nav.ts`, test `src/sim/nav.test.ts`

**Produces:**
- `LAYOUT` — phòng `{id, name, rect:[x0,z0,x1,z1], color, icon}` (dev, meeting, server, pantry, wc, lounge, lobby, parking, yard), `SEATS[40]`, `TEAM_CLUSTER` (10 ghế), `MEET_CHAIRS`, `PANTRY_SEATS`, `SOFA_SPOTS`, `WC_SPOTS`, `BIKE_SPOTS`, `DOORS`.
- `placeSpot(personIdx, place, dayPlan): Spot{x,z,face}`
- `route(from: Vec2, fromPlace, to: Vec2, toPlace): Vec2[]` — đi qua graph waypoint (hành lang + cửa), A* trên graph nhỏ.

- [ ] Tests: mọi đoạn của route từ ghế team → pantry/meet/wc/sofa/parking không cắt qua cạnh tường nào (kiểm tra giao đoạn thẳng với danh sách wall segments trừ cửa); route kết thúc đúng spot.
- [ ] Implement, pass, commit.

### Task 5: Task workflow

**Files:** `src/sim/workflow.ts`, test `src/sim/workflow.test.ts`

**Produces:** `type GitEvent = {at, actor, kind, ticket, pr?, reviewer?, reason?}` với `kind` như spec §7.7; `class Workflow { tasks; qaQueue; step(actorIdx, t, rng): GitEvent|null; stageOf(idx): TaskStage|'blocked'|'test'|'testidle' }`

- [ ] Tests: chuỗi doing→review→qa→done hợp lệ; review_changes đưa về doing; qa_fail mở lại doing; blocked giữ nguyên stage, unblock trở lại stage cũ; QA xử lý FIFO; actor có stage `qa` không phát sự kiện.
- [ ] Implement, pass, commit.

### Task 6: World engine

**Files:** `src/sim/world.ts`, test `src/sim/world.test.ts`

**Produces:** `class World { constructor(seed); t; day; people: PersonState[]; events: GitEvent[]; stats(); advance(realDt, speed); setTime(t) }` — `PersonState {idx, pos:{x,z}, heading, place, dest, path, act, bikeOn, stage}`.

Walk speed `min(30, 2.6*max(1,speed))` ô/giây thực; sự kiện mỗi 4 phút mô phỏng trong 08:00–21:00; qua 1440 → day+1, genDay mới.

- [ ] Tests: chạy 1 ngày ở speed 30 → tại 13:00 ≥ 6 người `nap`; 21:00 có ≤ 2 người còn ở văn phòng; `setTime(735)` → mọi người có mặt ở pantry, path rỗng; cùng seed → cùng `events.length` sau 1 ngày; qua nửa đêm `day===2`.
- [ ] Implement, pass, commit.

### Task 7: Store + DataSource

**Files:** `src/data/source.ts`, `src/data/mockSource.ts`, `src/store.ts`

**Produces:** `interface DataSource { world: World; tick(dt) }`; zustand `useOffice` với `{ t, day, speed, paused, selected, focus, view, theme, version }` + actions `setSpeed, togglePause, select, setFocus, setView, jump(t)`; `world` là singleton đọc trong `useFrame`.

- [ ] Commit.

### Task 8: Scene — building & props

**Files:** `src/scene/Office.tsx`, `src/scene/Building.tsx`, `src/scene/props/*.tsx`, `src/scene/Outdoors.tsx`, `src/scene/RoomLabels.tsx`

Low-poly bằng `RoundedBox`/box/cylinder, vật liệu `meshStandardMaterial`, instancing cho bàn/ghế. Tường ngoài phía sau cao, tường trong kính/ngăn thấp (cutaway). Nhãn phòng `Html` dạng pill có icon Lucide + viền màu phòng.

- [ ] Verify bằng screenshot (Task 13 script) ở 10:00.
- [ ] Commit.

### Task 9: Scene — people

**Files:** `src/scene/People.tsx`, `src/scene/Person.tsx`, `src/scene/PersonChip.tsx`

Chibi low-poly (đầu to, thân, tay, chân) — animation thủ tục: đi (vung tay chân), ngồi gõ phím, gục ngủ, ăn. Xe máy hiện ở bãi khi `bikeOn`. Chip `Html` trên đầu: chữ cái, viền màu stage, "!" khi bị chặn, "z" khi ngủ; tên đầy đủ khi hover/chọn/zoom gần. Bấm → `select(idx)`.

- [ ] Verify screenshot 08:35 (phòng họp đủ người), 12:15 (pantry), 12:50 (ngủ).
- [ ] Commit.

### Task 10: Lighting & environment

**Files:** `src/scene/Lighting.tsx`, `src/scene/sky.ts`, test `src/scene/sky.test.ts`

**Produces:** `skyAt(t): {sunDir:[x,y,z], sunColor, sunIntensity, ambient, bg, night:0..1}` (thuần, có test: t=720 night=0, t=0 night=1, t=1110 0<night<1). Đèn phòng (pointLight/emissive) bật khi night>0.2 và phòng có người; màn hình emissive khi `work`; đèn đường, xe trên đường; Bloom (postprocessing) nếu fps đạt.

- [ ] Test sky, verify screenshot 21:00, commit.

### Task 11: UI shell

**Files:** `src/ui/TopBar.tsx`, `src/ui/StatCards.tsx`, `src/ui/TimeBar.tsx`, `src/ui/RoomNav.tsx`, `src/ui/CameraControls.tsx`, `src/ui/DetailCard.tsx`, `src/styles.css`

Layout theo spec §7.1; camera bay tới phòng/người (lerp `CameraControls`).

- [ ] Commit.

### Task 12: Panels + Timeline tab

**Files:** `src/ui/panels/Members.tsx`, `ReviewQueue.tsx`, `Sprint.tsx` (donut + burndown SVG), `Pipeline.tsx`, `Feed.tsx`, `src/ui/Timeline.tsx`

Số liệu lấy từ `world.stats()`: đếm stage, PR chờ lâu nhất, ticket xong/tổng sprint, burndown theo giờ, số deploy & CI fail hôm nay.

- [ ] Commit.

### Task 13: Visual QA loop

**Files:** `scripts/shot.mjs`

`playwright-core` + `channel:'msedge'` (fallback chrome) mở `vite preview`, gọi `window.__office.jump(t)`, chụp các mốc 07:45, 08:35, 12:15, 12:50, 15:10, 17:45, 21:00 + toàn cảnh, đo fps qua `window.__office.fps`.

- [ ] Chạy, xem ảnh, sửa lỗi hình/bố cục, lặp đến khi đạt mức chuyên nghiệp; `npm test` + `npm run build` xanh; commit.
