# Postman Testing Guide for E-Learning Backend API

## Prerequisites
- Postman installed ([Download here](https://www.postman.com/downloads/))
- Backend server running on `http://localhost:10000`
- MongoDB Atlas configured and connected

## Getting Started

### 1. Create a New Postman Collection
1. Open Postman
2. Click **"Collections"** on the left sidebar
3. Click **"+"** to create a new collection
4. Name it: `E-Learning API`
5. Click **"Create"**

### 2. Set Up Environment Variables
1. Click **"Environments"** in the left sidebar
2. Click **"+"** to create new environment
3. Name it: `E-Learning Dev`
4. Add these variables:

| Variable | Value |
|----------|-------|
| `base_url` | `http://localhost:10000/api` |
| `token` | *(Leave empty, will be populated after login)* |
| `user_id` | *(Leave empty, will be populated after login)* |

5. Click **"Save"**
6. Select this environment from the top-right dropdown

## Authentication Endpoints Testing

### 1. **Register New User** ✅
**Request:**
- **Method**: `POST`
- **URL**: `{{base_url}}/auth/register`
- **Headers**:
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "password": "Password123"
  }
  ```

**Expected Response** (201 Created):
```json
{
  "status": "success",
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "64a1b2c3d4e5f6g7h8i9j0k1",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "role": "student"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Save the token for later use:**
1. In the response, copy the `token` value
2. Go to **Environments** and paste it in the `token` variable
3. Also copy the `user` → `id` and paste in `user_id` variable

### 2. **Login User** ✅
**Request:**
- **Method**: `POST`
- **URL**: `{{base_url}}/auth/login`
- **Headers**:
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "email": "john@example.com",
    "password": "Password123"
  }
  ```

**Expected Response** (200 OK):
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": "64a1b2c3d4e5f6g7h8i9j0k1",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "role": "student",
      "avatar": "https://..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Save this token in environment variable `token`**

### 3. **Get Current User Profile** (Protected) 🔐
**Request:**
- **Method**: `GET`
- **URL**: `{{base_url}}/auth/me`
- **Headers**:
  ```
  Authorization: Bearer {{token}}
  Content-Type: application/json
  ```
- **Body**: None (leave empty)

**Expected Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "64a1b2c3d4e5f6g7h8i9j0k1",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "role": "student",
      "avatar": "https://...",
      "enrolledCourses": [],
      "isActive": true
    }
  }
}
```

### 4. **Update User Profile** (Protected) 🔐
**Request:**
- **Method**: `PUT`
- **URL**: `{{base_url}}/auth/profile`
- **Headers**:
  ```
  Authorization: Bearer {{token}}
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "name": "John Updated Doe",
    "phone": "9876543210"
  }
  ```

**Expected Response** (200 OK):
```json
{
  "status": "success",
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "64a1b2c3d4e5f6g7h8i9j0k1",
      "name": "John Updated Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "role": "student"
    }
  }
}
```

### 5. **Forgot Password** 
**Request:**
- **Method**: `POST`
- **URL**: `{{base_url}}/auth/forgot-password`
- **Headers**:
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "email": "john@example.com"
  }
  ```

**Expected Response** (200 OK):
```json
{
  "status": "success",
  "message": "Password reset email sent successfully",
  "data": {
    "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 6. **Reset Password** 
**Request:**
- **Method**: `PUT`
- **URL**: `{{base_url}}/auth/reset-password/<reset-token-from-email>`
- **Headers**:
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "password": "NewPassword123"
  }
  ```

**Expected Response** (200 OK):
```json
{
  "status": "success",
  "message": "Password reset successfully"
}
```

## Testing Workflow

### Complete Flow:
1. **Register** - Create a new user
2. **Login** - Test with the registered user
3. **Get Me** - Verify authentication works
4. **Update Profile** - Test protected route
5. **Logout** - Clear the token from environment

### Error Test Cases:

#### Invalid Email Format
```json
{
  "name": "John",
  "email": "invalid-email",
  "phone": "9876543210",
  "password": "Password123"
}
```
Expected: 400 Bad Request

#### Missing Password
```json
{
  "email": "john@example.com"
}
```
Expected: 400 Bad Request - "Please provide email and password"

#### Wrong Password
```json
{
  "email": "john@example.com",
  "password": "WrongPassword"
}
```
Expected: 401 Unauthorized - "Invalid credentials"

#### Invalid Token (Protected Routes)
```
Header: Authorization: Bearer invalid_token_here
```
Expected: 401 Unauthorized - "Token is invalid or expired"

## Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required or failed |
| 403 | Forbidden - User doesn't have permission |
| 404 | Not Found - Resource not found |
| 500 | Server Error - Backend issue |

## Tips for Testing

### 1. Use Postman Collections for Automation
1. Create requests for each endpoint
2. Save in your collection
3. Use **Collection Runner** to test multiple requests sequentially

### 2. Export Collection
1. Right-click collection
2. Select **"Export"**
3. Share with team members

### 3. Monitor Network Activity
- Watch your browser's Network tab when testing from frontend
- Compare requests and responses

### 4. Check Backend Logs
```bash
# Terminal where backend is running should show:
Login attempt: { email: 'john@example.com', passwordLength: 8 }
User found: Yes
Password match: Yes
```

## Sample Request in cURL (Alternative)

If you prefer command line:

```bash
# Register
curl -X POST http://localhost:10000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "password": "Password123"
  }'

# Login
curl -X POST http://localhost:10000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123"
  }'

# Get Profile (replace TOKEN with actual token)
curl -X GET http://localhost:10000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

## Troubleshooting API Issues

### "Cannot POST /api/auth/register"
- Check the URL is correct
- Make sure backend is running on port 10000
- Verify `base_url` environment variable is set

### "MongoDB Connected" shows in console but API returns error
- Check MongoDB Atlas credentials in .env
- Verify network access is allowed for your IP
- Check database user permissions

### "Token is invalid or expired"
- Register/Login again to get new token
- Update the `token` environment variable
- Check JWT_SECRET in .env hasn't changed

### Connection refused (127.0.0.1:10000)
- Backend is not running
- Run `npm run dev` in backend folder
- Check port 10000 is not in use

## Next Steps
1. Test all endpoints with different scenarios
2. Integrate auth token in frontend
3. Test protected routes
4. Document any custom endpoints you add
