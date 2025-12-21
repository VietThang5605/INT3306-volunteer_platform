# VolunteerHub API Documentation

## Tổng quan
VolunteerHub là hệ thống quản lý tình nguyện viên và sự kiện với các tính năng:
- Quản lý người dùng (Volunteer, Manager, Admin)
- Quản lý sự kiện và đăng ký tham gia
- Hệ thống bài viết và bình luận
- Thông báo và push notification
- Xuất báo cáo

## Base URL
```
http://localhost:3000/api
```

## Authentication
Sử dụng JWT Bearer Token trong header:
```
Authorization: Bearer <your_jwt_token>
```

## User Roles
- **VOLUNTEER**: Tình nguyện viên - có thể đăng ký tham gia sự kiện
- **MANAGER**: Quản lý sự kiện - có thể tạo và quản lý sự kiện
- **ADMIN**: Quản trị viên - có quyền cao nhất

---

# 📋 API Endpoints

## 🔐 Authentication (`/auth`)

### 1. Đăng ký tài khoản
```http
POST /auth/register
```
**Body:**
```json
{
  "fullName": "Nguyễn Văn A",
  "email": "user@example.com",
  "password": "password123",
  "phoneNumber": "0123456789",
  "location": "Hà Nội",
  "dob": "1990-01-01",
  "role": "VOLUNTEER"
}
```
**Response:**
```json
{
  "message": "Đăng ký thành công",
  "user": {
    "id": "uuid",
    "fullName": "Nguyễn Văn A",
    "email": "user@example.com",
    "role": "VOLUNTEER"
  }
}
```

### 2. Đăng nhập
```http
POST /auth/login
```
**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Response:**
```json
{
  "message": "Đăng nhập thành công",
  "user": {
    "id": "uuid",
    "fullName": "Nguyễn Văn A",
    "email": "user@example.com",
    "role": "VOLUNTEER"
  },
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token"
}
```

### 3. Đăng nhập Google
```http
GET /auth/google
```
Redirect đến Google OAuth

### 4. Callback Google
```http
GET /auth/google/callback
```
Xử lý callback từ Google

### 5. Làm mới token
```http
POST /auth/refresh
```
**Body:**
```json
{
  "refreshToken": "refresh_token"
}
```

### 6. Đăng xuất
```http
POST /auth/logout
```
**Headers:** `Authorization: Bearer <token>`

### 7. Lấy thông tin cá nhân
```http
GET /auth/me
```
**Headers:** `Authorization: Bearer <token>`

### 8. Cập nhật thông tin cá nhân
```http
POST /auth/me
```
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "fullName": "Tên mới",
  "phoneNumber": "0987654321",
  "location": "TP.HCM",
  "bio": "Mô tả bản thân"
}
```

### 9. Cập nhật avatar
```http
POST /auth/me/avatar
```
**Headers:** `Authorization: Bearer <token>`
**Body:** `multipart/form-data`
- `avatar`: File ảnh

### 10. Đổi mật khẩu
```http
POST /auth/change-password
```
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

### 11. Quên mật khẩu
```http
POST /auth/forgot-password
```
**Body:**
```json
{
  "email": "user@example.com"
}
```

### 12. Đặt lại mật khẩu
```http
POST /auth/reset-password
```
**Body:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "new_password123"
}
```

### 13. Xác thực email
```http
GET /auth/verify-email?token=verification_token
```
**Query params:**
- `token`: Token xác thực từ email

---

## 👥 Users (`/users`)

### 1. Lấy danh sách người dùng (Admin)
```http
GET /users
```
**Headers:** `Authorization: Bearer <admin_token>`
**Query params:**
- `page`: Số trang (default: 1)
- `limit`: Số lượng/trang (default: 10)
- `role`: Lọc theo role (VOLUNTEER/MANAGER/ADMIN)
- `search`: Tìm kiếm theo tên/email

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "fullName": "Nguyễn Văn A",
      "email": "user@example.com",
      "role": "VOLUNTEER",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "totalItems": 100,
    "totalPages": 10,
    "currentPage": 1,
    "limit": 10
  }
}
```

### 2. Lấy thông tin user theo ID (Admin)
```http
GET /users/:id
```
**Headers:** `Authorization: Bearer <admin_token>`

### 3. Cập nhật user (Admin)
```http
POST /users/:id
```
**Headers:** `Authorization: Bearer <admin_token>`
**Body:**
```json
{
  "role": "MANAGER",
  "isActive": false
}
```

### 4. Xóa user (Admin)
```http
DELETE /users/:id
```
**Headers:** `Authorization: Bearer <admin_token>`

---

## 🎯 Events (`/events`)

### 1. Lấy danh sách sự kiện công khai
```http
GET /events
```
**Query params:**
- `page`: Số trang
- `limit`: Số lượng/trang
- `categoryId`: Lọc theo danh mục
- `time`: upcoming/past
- `sortBy`: startTime/createdAt
- `order`: asc/desc

**Response:**
```json
{
  "message": "Lấy dữ liệu thành công",
  "result": {
    "data": [
      {
        "id": "uuid",
        "name": "Tên sự kiện",
        "description": "Mô tả",
        "location": "Địa điểm",
        "startTime": "2024-01-01T10:00:00Z",
        "endTime": "2024-01-01T17:00:00Z",
        "status": "APPROVED",
        "capacity": 100,
        "coverUrl": "https://...",
        "category": {
          "id": 1,
          "name": "Tên danh mục"
        },
        "manager": {
          "id": "uuid",
          "fullName": "Tên manager",
          "avatarUrl": "https://..."
        }
      }
    ],
    "pagination": {
      "totalItems": 50,
      "totalPages": 5,
      "currentPage": 1,
      "limit": 10
    }
  }
}
```

### 2. Lấy chi tiết sự kiện
```http
GET /events/:id
```

### 3. Lấy danh sách sự kiện của Manager
```http
GET /events/manager
```
**Headers:** `Authorization: Bearer <manager_token>`
**Query params:** 
- `page`, `limit`: Phân trang
- `status`: PENDING/APPROVED/REJECTED

### 4. Lấy danh sách sự kiện của tôi (Manager)
```http
GET /events/me
```
**Headers:** `Authorization: Bearer <manager_token>`
**Query params:** 
- `page`, `limit`: Phân trang
- `status`: PENDING/APPROVED/REJECTED

### 5. Lấy chi tiết sự kiện của Manager
```http
GET /events/manager/:id
```
**Headers:** `Authorization: Bearer <manager_token>`

### 6. Lấy tất cả sự kiện (Admin)
```http
GET /events/admin
```
**Headers:** `Authorization: Bearer <admin_token>`

### 7. Tạo sự kiện mới (Manager)
```http
POST /events
```
**Headers:** `Authorization: Bearer <manager_token>`
**Body:** `multipart/form-data`
```json
{
  "name": "Tên sự kiện",
  "description": "Mô tả chi tiết",
  "location": "Địa điểm",
  "startTime": "2024-01-01T10:00:00Z",
  "endTime": "2024-01-01T17:00:00Z",
  "categoryId": 1,
  "capacity": 100,
  "cover": "file_upload"
}
```

### 8. Cập nhật sự kiện (Manager)
```http
PATCH /events/:id
```
**Headers:** `Authorization: Bearer <manager_token>`

### 9. Xóa sự kiện (Manager)
```http
DELETE /events/:id
```
**Headers:** `Authorization: Bearer <manager_token>`

### 10. Lấy danh sách thành viên sự kiện
```http
GET /events/:id/members
```
**Query params:**
- `page`, `limit`: Phân trang

**Response:**
```json
{
  "data": [
    {
      "id": "user_uuid",
      "fullName": "Tên thành viên",
      "avatarUrl": "https://...",
      "joinedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "totalMembers": 25,
  "pagination": {...}
}
```

---

## 📝 Event Registration (`/registrations`)

### 1. Đăng ký tham gia sự kiện (Volunteer)
```http
POST /events/:id/registrations
```
**Headers:** `Authorization: Bearer <volunteer_token>`

**Response:**
```json
{
  "message": "Đăng ký thành công",
  "registration": {
    "id": "uuid",
    "eventId": "event_uuid",
    "userId": "user_uuid",
    "status": "PENDING",
    "registeredAt": "2024-01-01T00:00:00Z"
  }
}
```

### 2. Lấy danh sách đăng ký của sự kiện (Manager)
```http
GET /events/:id/registrations
```
**Headers:** `Authorization: Bearer <manager_token>`
**Query params:**
- `page`, `limit`: Phân trang
- `status`: PENDING/CONFIRMED/CANCELLED/WAITLIST

### 3. Lấy danh sách đăng ký của user
```http
GET /registrations
```
**Headers:** `Authorization: Bearer <token>`
**Query params:**
- `page`, `limit`: Phân trang
- `status`: PENDING/CONFIRMED/CANCELLED/WAITLIST
- `eventId`: Lọc theo sự kiện (Admin/Manager)

### 4. Lấy kênh trao đổi (sự kiện đã tham gia)
```http
GET /registrations/my-channels
```
**Headers:** `Authorization: Bearer <token>`
**Query params:**
- `page`, `limit`: Phân trang

**Response:**
```json
{
  "data": [
    {
      "id": "registration_uuid",
      "event": {
        "id": "event_uuid",
        "name": "Tên sự kiện",
        "coverUrl": "https://..."
      },
      "registeredAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {...}
}
```

### 5. Duyệt/Từ chối đăng ký (Manager)
```http
PATCH /registrations/:id/status
```
**Headers:** `Authorization: Bearer <manager_token>`
**Body:**
```json
{
  "status": "CONFIRMED"
}
```

### 6. Hủy đăng ký (Volunteer)
```http
DELETE /registrations/:id
```
**Headers:** `Authorization: Bearer <volunteer_token>`

---

## � Profiles/ (`/profiles`)

### 1. Xem profile người dùng
```http
GET /profiles/:id
```
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": "uuid",
  "fullName": "Nguyễn Văn A",
  "avatarUrl": "https://...",
  "bio": "Mô tả bản thân",
  "location": "Hà Nội",
  "role": "VOLUNTEER",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

## 📰 Posts (`/posts`)

### 1. Lấy danh sách bài viết của sự kiện
```http
GET /events/:id/posts
```
**Headers:** `Authorization: Bearer <token>`
**Query params:**
- `page`, `limit`: Phân trang

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "content": "Nội dung bài viết",
      "visibility": "PUBLIC", // 🔓 PUBLIC hoặc 🔒 PRIVATE
      "status": "APPROVED",
      "medias": [
        {
          "id": "uuid",
          "url": "https://...",
          "type": "image"
        }
      ],
      "author": {
        "id": "uuid",
        "fullName": "Tác giả",
        "avatarUrl": "https://..."
      },
      "createdAt": "2024-01-01T00:00:00Z",
      "_count": {
        "comments": 5,
        "postLikes": 10
      }
    }
  ],
  "pagination": {...}
}
```

### 2. Tạo bài viết mới
```http
POST /events/:id/posts
```
**Headers:** `Authorization: Bearer <token>`
**Body:** `multipart/form-data`
```json
{
  "content": "Nội dung bài viết",
  "visibility": "PUBLIC", // hoặc "PRIVATE"
  "media": ["file1", "file2"] // Tối đa 5 files
}
```

### 3. Lấy bài viết trending của sự kiện
```http
GET /events/:id/trending-posts
```

### 4. Xóa bài viết
```http
DELETE /posts/:id
```
**Headers:** `Authorization: Bearer <token>`

### 5. Like/Unlike bài viết
```http
POST /posts/:id/like
```
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "isLiked": true,
  "likesCount": 15
}
```

### 6. Lấy bài viết trending toàn cục
```http
GET /posts/trending
```
Không cần authentication

### 7. Cập nhật trạng thái bài viết (Admin/Manager)
```http
POST /posts/:id/status
```
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "status": "APPROVED" // hoặc "REJECTED"
}
```

---

## 💬 Comments (`/comments`)

### 1. Lấy danh sách comment của bài viết
```http
GET /posts/:id/comments
```
**Headers:** `Authorization: Bearer <token>`

### 2. Tạo comment mới
```http
POST /posts/:id/comments
```
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "content": "Nội dung comment",
  "parentId": "parent_comment_uuid" // Optional, cho reply
}
```

### 3. Xóa comment
```http
DELETE /comments/:id
```
**Headers:** `Authorization: Bearer <token>`

### 4. Like/Unlike comment
```http
POST /comments/:id/like
```
**Headers:** `Authorization: Bearer <token>`

---

## 📂 Categories (`/categories`)

### 1. Lấy danh sách danh mục
```http
GET /categories
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Giáo dục",
      "description": "Các hoạt động giáo dục"
    }
  ]
}
```

### 2. Tạo danh mục mới (Admin)
```http
POST /categories
```
**Headers:** `Authorization: Bearer <admin_token>`
**Body:**
```json
{
  "name": "Tên danh mục",
  "description": "Mô tả"
}
```

### 3. Cập nhật danh mục (Admin)
```http
PATCH /categories/:id
```
**Headers:** `Authorization: Bearer <admin_token>`

### 4. Xóa danh mục (Admin)
```http
DELETE /categories/:id
```
**Headers:** `Authorization: Bearer <admin_token>`

---

## 🔔 Notifications (`/notifications`)

### 1. Lấy danh sách thông báo
```http
GET /notifications
```
**Headers:** `Authorization: Bearer <token>`
**Query params:**
- `page`, `limit`: Phân trang
- `filter`: all/unread

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "content": "Nội dung thông báo",
      "isRead": false,
      "targetType": "EVENT",
      "targetId": "target_uuid",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {...},
  "unreadCount": 5
}
```

### 2. Đánh dấu một thông báo đã đọc
```http
PATCH /notifications/:id/read
```
**Headers:** `Authorization: Bearer <token>`

### 3. Đánh dấu tất cả đã đọc
```http
POST /notifications/read-all
```
**Headers:** `Authorization: Bearer <token>`

---

## 📊 Dashboard (`/dashboard`)

### 1. Lấy dữ liệu dashboard (theo role)
```http
GET /dashboard
```
**Headers:** `Authorization: Bearer <token>`

**Response:** Dữ liệu trả về khác nhau tùy theo vai trò (Admin, Manager, Volunteer)

### 2. Lấy thống kê hệ thống (công khai)
```http
GET /dashboard/stats
```
Không cần authentication

**Response:**
```json
{
  "totalUsers": 1000,
  "totalEvents": 50,
  "totalRegistrations": 500,
  "totalPosts": 200
}
```

---

## 🔔 Push Notifications (`/push`)

### 1. Lấy VAPID public key
```http
GET /push/vapid-public-key
```
Không cần authentication

**Response:**
```json
{
  "vapidPublicKey": "BKxyz..."
}
```

### 2. Đăng ký push subscription
```http
POST /push/subscribe
```
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "subscription": {
    "endpoint": "https://...",
    "keys": {
      "p256dh": "key",
      "auth": "secret"
    }
  }
}
```

### 3. Hủy đăng ký push
```http
POST /push/unsubscribe
```
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "endpoint": "https://..."
}
```

---

## 🛠️ Admin (`/admin`)

### 1. Duyệt sự kiện
```http
POST /admin/events/:id/approve
```
**Headers:** `Authorization: Bearer <admin_token>`

### 2. Lấy chi tiết sự kiện (Admin)
```http
GET /admin/events/:id
```
**Headers:** `Authorization: Bearer <admin_token>`

### 3. Xóa sự kiện (Admin)
```http
DELETE /admin/events/:id
```
**Headers:** `Authorization: Bearer <admin_token>`

### 4. Xuất danh sách sự kiện
```http
GET /admin/export/events?format=json
```
**Headers:** `Authorization: Bearer <admin_token>`
**Query params:**
- `format`: json/csv/xlsx

### 5. Xuất danh sách người dùng
```http
GET /admin/export/users?format=json
```
**Headers:** `Authorization: Bearer <admin_token>`
**Query params:**
- `format`: json/csv/xlsx

### 6. Lấy thống kê dashboard (Admin)
```http
GET /admin/dashboard
```
**Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "totalUsers": 1000,
  "totalEvents": 50,
  "totalRegistrations": 500,
  "totalPosts": 200,
  "recentActivities": [...]
}
```

---

## 🎨 UI Enhancement: Post Visibility Icons

### Đề xuất hiển thị biểu tượng cho Posts:

**Frontend Implementation:**
```jsx
const PostVisibilityIcon = ({ visibility }) => {
  return (
    <span className="visibility-icon">
      {visibility === 'PRIVATE' ? (
        <i className="fas fa-lock" title="Bài viết riêng tư"></i>
      ) : (
        <i className="fas fa-globe" title="Bài viết công khai"></i>
      )}
    </span>
  );
};

// Sử dụng trong component Post
<div className="post-header">
  <h3>{post.title}</h3>
  <PostVisibilityIcon visibility={post.visibility} />
</div>
```

**CSS Styling:**
```css
.visibility-icon {
  margin-left: 8px;
  font-size: 14px;
}

.visibility-icon .fa-lock {
  color: #ff6b6b; /* Đỏ cho private */
}

.visibility-icon .fa-globe {
  color: #51cf66; /* Xanh cho public */
}
```

---

## 📱 Response Status Codes

- **200**: OK - Thành công
- **201**: Created - Tạo mới thành công  
- **204**: No Content - Xóa thành công
- **400**: Bad Request - Dữ liệu không hợp lệ
- **401**: Unauthorized - Chưa đăng nhập
- **403**: Forbidden - Không có quyền
- **404**: Not Found - Không tìm thấy
- **409**: Conflict - Dữ liệu bị trung lặp
- **500**: Internal Server Error - Lỗi server

---

## 🔧 Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/volunteerhub"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="1h"
REFRESH_TOKEN_SECRET="refresh-secret"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Email
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Push Notifications
VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"
VAPID_EMAIL="your-email@example.com"

# Server
PORT=3000
NODE_ENV="development"
```

---

## 🚀 Getting Started

1. **Clone repository**
```bash
git clone <repository-url>
cd volunteerhub-api
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup database**
```bash
npx prisma migrate dev
npx prisma generate
```

4. **Start development server**
```bash
npm run dev
```

5. **Access API Documentation**
```
http://localhost:3000/api-docs
```

---

## 📋 TODO: Improvements

### 1. Post Visibility Enhancement
- ✅ Database đã có field `visibility` 
- 🔄 Frontend cần thêm icon hiển thị
- 🔄 Filter posts theo visibility trong API

### 2. Additional Features
- 📧 Email notifications
- 📱 Real-time chat trong events  
- 📊 Advanced analytics
- 🔍 Full-text search
- 📷 Image optimization
- 🌐 Multi-language support

---

*Tài liệu này được cập nhật lần cuối: $(date)*