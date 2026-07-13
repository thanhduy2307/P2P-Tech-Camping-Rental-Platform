# ⛺ P2P Tech & Camping Rental Platform 📱

Chào mừng bạn đến với **P2P Tech & Camping Rental Platform**, nền tảng kinh tế chia sẻ (Sharing Economy) chuyên kết nối những người sở hữu thiết bị công nghệ và đồ cắm trại (Lender) với những người có nhu cầu thuê (Renter). Nền tảng được thiết kế với mục tiêu mang lại sự tiện lợi, an toàn, minh bạch và tối đa hóa giá trị vòng đời của các thiết bị.

---

## 📖 Tổng quan Dự án (Project Overview)

Trong thời đại kinh tế chia sẻ, nhu cầu sử dụng các thiết bị công nghệ đắt tiền (như máy ảnh kỹ thuật số, flycam, máy chiếu) hoặc đồ dã ngoại (lều trại, phụ kiện sinh tồn) chỉ diễn ra trong các khoảng thời gian ngắn hạn (đi du lịch, dự án sự kiện). Thay vì phải bỏ ra một số tiền lớn để mua đứt, người dùng có thể dễ dàng thuê lại từ những người không có nhu cầu sử dụng thường xuyên.

Dự án này giải quyết các "nỗi đau" (Pain points) lớn nhất của thị trường cho thuê P2P hiện nay:
1. **Nỗi sợ mất đồ / tráo đồ:** Giải quyết thông qua hệ thống eKYC định danh nghiêm ngặt và quy trình bàn giao có OTP 2 lớp.
2. **Tranh chấp hỏng hóc:** Giải quyết qua hệ thống phân xử Dispute dựa trên bằng chứng và Check-list bàn giao chéo giữa 2 bên.
3. **Thẩm định chất lượng:** Giải quyết bằng công nghệ AI tự động duyệt đồ dân dụng và đội ngũ Inspector chuyên nghiệp thẩm định tận nơi cho các tài sản giá trị cao (trên 20 triệu VNĐ).
4. **Quản lý Dòng tiền cọc:** Hệ thống ví điện tử tích hợp, hỗ trợ cả hai hình thức: Cọc trực tuyến (Escrow) được nền tảng bảo vệ 100%, hoặc Cọc trực tiếp bằng tiền mặt (Offline Cash).

---

## 🎯 Phân quyền & Vai trò (Roles)

Hệ thống xoay quanh 4 vai trò chính, mỗi vai trò có một bảng điều khiển (Dashboard) và luồng nghiệp vụ riêng biệt:

- **1. Người thuê (Renter)**: Tìm kiếm, lọc và đặt thuê các thiết bị phù hợp. Renter bắt buộc phải hoàn thành eKYC nếu muốn thuê các thiết bị đắt tiền. Renter được cấp quyền gia hạn thời gian thuê, đánh giá chất lượng thiết bị và gửi yêu cầu khiếu nại nếu đồ không đúng mô tả.
- **2. Chủ đồ (Lender)**: Đăng tải thiết bị lên nền tảng, quản lý kho đồ, duyệt/từ chối các yêu cầu gia hạn và theo dõi doanh thu thông qua Ví điện tử (E-wallet). Lender cũng phải ký cam kết bảo mật và trải qua bước định danh eKYC.
- **3. Người thẩm định (Inspector)**: Đây là đội ngũ cộng tác viên hiện trường của nền tảng. Khi Lender đăng một tài sản có giá trị $\ge$ 20 triệu VNĐ, AI sẽ tự động phân công một Inspector ở gần khu vực đó đến tận nhà Lender để kiểm tra thực tế, chống lừa đảo (Fraud) trước khi cho phép tài sản xuất hiện trên chợ.
- **4. Quản trị viên (Admin)**: Quản lý tối cao của hệ thống. Chịu trách nhiệm duyệt hồ sơ eKYC (nếu hệ thống tự động nghi ngờ), xử lý yêu cầu rút tiền của user, khóa/mở khóa tài khoản, và đặc biệt là **Phân xử Tranh chấp (Dispute Resolution)** dựa trên bằng chứng của Lender và Renter.

---

## ⚙️ Các Module Cốt lõi & Luồng Xử lý (Core Modules)

### 🤖 1. Luồng Kiểm duyệt Tài sản Đa tầng (Multi-tier Verification)
- **Tài sản phổ thông (< 20.000.000đ)**: Sử dụng AI để tự động phát hiện hình ảnh trùng lặp hoặc hình ảnh tải từ Internet. Nếu hình hợp lệ, tự động chuyển sang trạng thái `Verified`.
- **Tài sản cao cấp (>= 20.000.000đ)**: Bắt buộc chuyển sang trạng thái `Pending Inspector`. Quá trình duyệt phải có chữ ký điện tử và ảnh chụp tận nơi từ Inspector.

### 🔐 2. Quy trình Giao nhận An toàn (Secure Handover Workflow)
Để đảm bảo không có tranh chấp về sau, quy trình bàn giao được thiết kế chặt chẽ:
- **Bước Nhận đồ (Handover)**: Renter đến gặp Lender. Renter bắt buộc phải kiểm tra 3 điều kiện (Mô tả, Ngoại quan, Phụ kiện đi kèm) thông qua checklist trên app. Sau khi tick đủ, app mới cấp mã **OTP**. Renter đọc mã này cho Lender nhập vào hệ thống kèm 3 tấm ảnh thực tế để mở khóa đơn hàng.
- **Bước Trả đồ (Return)**: Lender nhận lại đồ. Nếu thiết bị bình thường, Lender chọn "Thu hồi bình thường", nhập mã OTP từ Renter và hoàn cọc. Nếu có hư hỏng, Lender chọn **"Báo cáo hư hỏng"**.

### ⚖️ 3. Quản lý Khiếu nại (Dispute Resolution - SLA 48h)
- **Khiếu nại từ Renter**: Ngay lúc nhận đồ, nếu đồ hỏng, Renter có thể nhấn nút "Từ chối nhận & Khiếu nại", đơn hàng bị hủy và Admin sẽ xem xét hoàn cọc.
- **Khiếu nại từ Lender**: Lúc trả đồ, Lender báo cáo hư hỏng và nhập số tiền yêu cầu đền bù. Đơn hàng chuyển sang `Disputed`.
- **Quyền Bào chữa (Defense)**: Renter nhận được thông báo khiếu nại và có thể gửi lời bào chữa (text/hình ảnh).
- **Phân xử**: Admin đọc lời khai hai bên và nhập số tiền bồi thường cuối cùng cho Lender. Hệ thống tự động chia số tiền cọc khả dụng cho cả 2 bên.

### 🕒 4. Phạt Trả Muộn & Gia Hạn
- **Gia hạn (Extension)**: Renter có thể request gia hạn thêm ngày. Tiền thuê phát sinh sẽ tự động trừ vào ví.
- **Trả đồ muộn (Late Return)**: Hệ thống cho phép "ân hạn" 4 tiếng. Nếu Renter trả trễ hơn 4 tiếng so với giờ kết thúc hợp đồng, hệ thống sẽ phạt tự động **150% giá thuê một ngày** cho mỗi ngày trễ.

---

## 🛠 Ngăn xếp Công nghệ (Technology Stack)

Hệ thống được phát triển hoàn toàn bằng Javascript/Typescript từ Frontend đến Backend:

- **Frontend**: 
  - React.js (Vite)
  - TailwindCSS (Utility-first styling, Responsive)
  - SweetAlert2 (Popups/Notifications)
  - React Router (Routing)
- **Backend**: 
  - Node.js với Express.js Framework
  - Kiến trúc MVC (Models - Views - Controllers)
- **Cơ sở dữ liệu**: 
  - MongoDB (Mongoose ORM) với thiết kế NoSQL linh hoạt, phù hợp lưu trữ dữ liệu JSON phức tạp của đơn hàng và người dùng.
- **Tính năng nâng cao**:
  - JWT (JSON Web Tokens) cho phân quyền và bảo mật Session.
  - Tích hợp module xử lý AI cơ bản trong tương lai.

---

## 🚀 Hướng dẫn Cài đặt & Chạy dự án (Getting Started)

### Yêu cầu hệ thống (Prerequisites)
- Node.js (phiên bản v16 trở lên)
- MongoDB Server đang chạy (Localhost hoặc MongoDB Atlas)
- Git

### Các bước Cài đặt (Installation)

**1. Clone dự án về máy:**
```bash
git clone https://github.com/thanhduy2307/P2P-Tech-Camping-Rental-Platform.git
cd P2P-Tech-Camping-Rental-Platform
```

**2. Khởi chạy Backend:**
```bash
# Cài đặt thư viện backend
npm install

# Sao chép file cấu hình môi trường
cp .env.example .env

# Mở file .env và cấu hình các thông số (VD: PORT=5000, MONGODB_URI=...)
# Chạy Server Backend (Mặc định ở cổng 5000)
npm start
```

**3. Khởi chạy Frontend:**
Mở thêm một terminal mới:
```bash
cd frontend

# Cài đặt thư viện frontend
npm install

# Chạy ứng dụng React (Vite - Mặc định ở cổng 5173)
npm run dev
```

Sau khi cả 2 server đều chạy, bạn truy cập vào `http://localhost:5173` để trải nghiệm nền tảng.

---

## 📁 Cấu trúc Thư mục Chính (Directory Structure)

```text
📦 P2P-Tech-Camping-Rental-Platform
 ┣ 📂 frontend/               # Mã nguồn Giao diện (React)
 ┃ ┣ 📂 src/
 ┃ ┃ ┣ 📂 components/         # Các UI component dùng chung (Navbar, Footer, Modal)
 ┃ ┃ ┣ 📂 configs/            # Cấu hình API Axios
 ┃ ┃ ┣ 📂 Page/               # Các trang chính (Dashboard Admin, Lender, Renter, Orders, v.v.)
 ┃ ┃ ┗ 📜 App.jsx             # Cấu hình Routing chính
 ┣ 📂 src/                    # Mã nguồn Máy chủ (Node.js)
 ┃ ┣ 📂 controllers/          # Xử lý logic nghiệp vụ (Auth, Orders, Assets, Admin)
 ┃ ┣ 📂 middleware/           # Trình trung gian bảo mật & phân quyền (verifyToken, isAdmin)
 ┃ ┣ 📂 models/               # Cấu trúc CSDL MongoDB (Mongoose Schema)
 ┃ ┣ 📂 routes/               # Cấu hình đường dẫn API (Endpoints)
 ┃ ┗ 📜 index.js              # File chạy server chính
 ┣ 📜 TEST_PLAN.md            # Tài liệu kịch bản kiểm thử dự án
 ┣ 📜 ROLES_AND_FEATURES.md   # Đặc tả yêu cầu chi tiết
 ┗ 📜 README.md               # Tài liệu tổng quan (Bạn đang đọc file này)
```

---
*Phát triển với ❤️ bởi đội ngũ P2P Platform.*
