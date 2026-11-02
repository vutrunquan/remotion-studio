# Unified Remotion Video Studio

> **Studio sản xuất Video tự động bằng Remotion với 2 phong cách thẩm mỹ chuẩn: Analog Horror (Creepy Rules) & Hoạt hình 2D Tối Giản (Story Studio)**

---

## 🌟 Giới Thiệu

Dự án tích hợp đầy đủ 2 engine sản xuất video Remotion cao cấp:
1. **👁️ Creepy Rules Studio**: Phong cách Analog Horror, VHS scanlines, radar HUD, các thẻ quy tắc sống còn (`RULE`), bộ đếm quy tắc (`Counter`), hồ sơ vụ án (`Exhibit Polaroid`), đèn hazard đỏ, camera giám sát `CCTV`, gương phản chiếu bóng đen dị dạng, và buồng thang máy `Elevator` vector.
2. **🎭 2D Story Studio**: Phong cách hoạt hình tối giản nhân vật Ball-head với hệ thống xương chuyển động đa dạng (`stand`, `sit`, `walk`, `hold`, `kneel`, `slump`), biểu cảm khuôn mặt (`neutral`, `tired`, `happy`, `worried`, `surprised`), bối cảnh ánh sáng điện ảnh (`street-night`, `living-room`, `street-brick`), đạo cụ cầm tay (`umbrella`, `cup`, `letter`, `phone`, `box`) và góc quay máy linh hoạt (`wide`, `medium`, `close`, `roll` Dutch angle).

---

## 🖥️ Giao Diện Desktop Tool (Local Web Studio)

Hệ thống đi kèm công cụ Desktop Studio chạy cục bộ tại `http://localhost:4567`:
- **Chuyển đổi 2 chế độ**: Creepy Rules & 2D Story Studio.
- **Tự Động Đạo Diễn (Semantic Auto-Director)**: Nhập kịch bản văn bản thuần $\rightarrow$ tự động nhận diện ngữ nghĩa và dựng phân cảnh, gán nhân vật, đạo cụ, camera và hiệu ứng tương ứng.
- **Xem trước chuẩn xác từng pixel**: Render trực tiếp frame Remotion (`remotion still`).
- **Render Video MP4**: Theo dõi tiến độ rendering thời gian thực qua Server-Sent Events (SSE).

### Khởi chạy Desktop Studio:
```bash
# Cách 1: Chạy file script trên Mac
./start-studio.command

# Cách 2: Chạy lệnh Node trực tiếp
node tool/server.js
```
Truy cập trình duyệt: **`http://localhost:4567`**

---

## 🚀 Cấu Trúc Dự Án

```
├── src/
│   ├── creepy_rules/       # Engine Analog Horror (Creepy Rules) 1:1
│   │   ├── pictos/         # Thư viện vector pictograms (elevator, cctv, mirror, creature, dog, person...)
│   │   ├── templates/      # Stage, RuleCard, Counter, Exhibit, Cards
│   │   └── Rules.tsx       # Thành phần Remotion Composition
│   ├── story_studio/       # Engine Hoạt hình 2D Story Studio 1:1
│   │   ├── characters/     # Nhân vật ball-head, trang phục, tư thế, biểu cảm, đạo cụ
│   │   ├── sets/           # Bối cảnh (Room, Street Night, Street Brick, Civic)
│   │   ├── overlays/       # TitleCard, TimeBadge, CounterStamp
│   │   └── Story.tsx       # Thành phần Remotion Composition
│   └── Root.tsx            # Đăng ký compositions Remotion
├── tool/
│   ├── server.js           # Backend server & Semantic Auto-Director
│   ├── presets/            # Các kịch bản mẫu JSON
│   └── public/             # Giao diện Desktop Web Studio
└── out/                    # Thư mục xuất video MP4 & ảnh still preview
```

---

## 🎬 Xuất Video Bằng Lệnh CLI

```bash
# Render video Creepy Rules
npx remotion render src/index.ts CreepyRules out/creepy_rules.mp4 --props="tool/presets/creepy_elevator.json"

# Render video 2D Story Studio
npx remotion render src/index.ts StoryStudio out/story_cafe.mp4 --props="tool/presets/story_rainy_cafe.json"
```

---

## 📦 Yêu Cầu Hệ Thống

- **Node.js**: >= 18.0.0
- **Remotion**: 4.0+
- **macOS / Linux / Windows**
