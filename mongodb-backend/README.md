# Option B: Dedicated MongoDB + Node/Express Authentication Backend

This standalone backend server handles:
1. **User Account Registration** (`POST /api/auth/register`) with duplicate email checking and cryptographic SHA-256 password hashing.
2. **User Account Login** (`POST /api/auth/login`) with secure password verification (`db.users.findOne({ email })`).
3. **Display & Editing of User Profile Data** (`GET /api/users/profile/:emailOrId` and `PUT /api/users/profile/:id`).

---

## 🛠️ Quick Start Guide

### 1. Install Dependencies
Open a terminal in `d:/Edunetwork/mongodb-backend` and run:
```bash
npm install
```

### 2. Configure Environment (Optional)
Create a `.env` file in `mongodb-backend/` if using MongoDB Atlas cloud database:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/edunetwork_db?retryWrites=true&w=majority
```
*(If no `.env` is provided, the server defaults to your local MongoDB instance at `mongodb://127.0.0.1:27017/edunetwork_db`).*

### 3. Start the Server
```bash
npm start
# or for auto-reload during development:
npm run dev
```

You should see:
```
✅ Connected to MongoDB successfully!
🚀 Option B MongoDB API Server running on http://localhost:5000
```

---

## 📡 API Reference Example

### 1. Register a New Account
**`POST http://localhost:5000/api/auth/register`**
```json
{
  "username": "Sujan",
  "email": "sujan@gmail.com",
  "password": "secretpassword123",
  "studentType": "college",
  "college": "IIT Delhi",
  "department": "Computer Science",
  "skills": ["React", "Node", "MongoDB"]
}
```

### 2. Login
**`POST http://localhost:5000/api/auth/login`**
```json
{
  "email": "sujan@gmail.com",
  "password": "secretpassword123"
}
```

### 3. Display User Profile Data
**`GET http://localhost:5000/api/users/profile/sujan@gmail.com`**
Returns the full user profile data with auto-generated MongoDB `_id` (`6899fbe38d7f46a8b92c53d1`) to render inside the Student Profile screen!
