# Sunwin Login Tool

Project Node.js để:

- Convert dữ liệu từ file TXT theo format chat
- Login hàng loạt qua API `POST /loginId`
- Gửi log Telegram vào nhóm data
- Gửi cảnh báo Telegram cho tài khoản có số dư lớn hơn ngưỡng
- Lưu thống kê và kết quả vào MongoDB
- Ghi file JSON output để tiện đối soát

## 1. Cài đặt

```bash
npm install
cp .env.example .env
```

## 2. Chuẩn bị file input

Đặt file TXT vào:

```bash
data/input.txt
```

Format mẫu:

```txt
[4/1/2026 3:52 PM] Santa: ---KHÁCH LOGIN SUNWIN---
Nickname --- vanboi
Username --- newbi9
Password --- mklaso252
Số dư --- 0
```

## 3. Cấu hình `.env`

```env
MONGO_URI=mongodb://127.0.0.1:27017/sunwin_login_tool
INPUT_FILE=./data/input.txt
LOGIN_API_URL=https://api.tlbb-vinagame.fun/loginId
REQUEST_TIMEOUT_MS=20000
CONCURRENCY=5
HIGH_BALANCE_THRESHOLD=100000
RUN_NAME=import-file-01

TELEGRAM_BOT_TOKEN=
TELEGRAM_DATA_CHAT_ID=
TELEGRAM_HIGH_BALANCE_CHAT_ID=
TELEGRAM_NOTIFY_SUCCESS=true
TELEGRAM_NOTIFY_FAILURE=true
```

## 4. Chạy

```bash
npm start
```

## 5. MongoDB collections

### `importruns`
Lưu 1 lần chạy:
- tên run
- file nguồn
- thời gian bắt đầu / kết thúc
- tổng account
- số success / failed
- số account số dư lớn
- summary tổng hợp

### `loginresults`
Lưu từng account:
- username / password / nickname
- số dư file txt
- status login
- message trả về
- balance từ API response
- fullname
- token / signature / ip / rawResponse

## 6. Luồng chạy

1. Đọc TXT
2. Parse thành mảng account
3. Lưu file JSON parsed vào `output/`
4. Tạo `ImportRun` trong MongoDB
5. Chạy login song song theo `CONCURRENCY`
6. Gửi Telegram từng tài khoản vào nhóm data
7. Nếu `balance > HIGH_BALANCE_THRESHOLD` thì gửi thêm vào nhóm số dư lớn
8. Cập nhật thống kê cuối run
9. Ghi summary JSON vào `output/`

## 7. Gợi ý mở rộng

- thêm retry khi request lỗi mạng
- thêm export CSV/XLSX
- thêm dashboard Express để xem run history
- thêm dedupe username trước khi chạy
- thêm queue theo batch

## 8. Lưu ý

Project này hiện lưu cả `accessToken`, `refreshToken`, `wsToken`, `signature` vào MongoDB theo yêu cầu quản lý. Nếu môi trường production nhạy cảm, nên cân nhắc mã hóa hoặc ẩn bớt các field này.
