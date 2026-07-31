# MongoDB Atlas Setup Guide

## Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Try Free" or Sign in with existing account
3. Create a new organization and project (if not already created)

## Step 2: Create a Cluster
1. In Atlas dashboard, click **"Create Deployment"**
2. Select **"M0 Shared"** (free tier)
3. Choose your preferred region (closest to your location for best performance)
4. Click **"Create Deployment"** button

**Wait 5-10 minutes for the cluster to initialize**

## Step 3: Create Database User
1. In the left sidebar, go to **"Security"** → **"Quick Start"** or **"Database Access"**
2. Click **"Add new database user"**
3. Enter:
   - **Username**: `elearning` (or your preferred username)
   - **Password**: Create a strong password (copy this!)
   - Password Authentication: Selected
4. Click **"Add User"**

## Step 4: Set Up Network Access (Whitelist IP)
1. Go to **"Security"** → **"Network Access"**
2. Click **"Add IP Address"**
3. For development: Click **"Allow Access from Anywhere"** or enter **"0.0.0.0/0"**
4. For production: Enter your server's IP address
5. Click **"Confirm"**

## Step 5: Get Connection String
1. Go to your cluster overview
2. Click **"Connect"** button
3. Select **"Connect your application"**
4. Choose **"Driver"**: Node.js
5. Choose **"Version"**: 4.1 or later
6. Copy the connection string (it will look like below):

```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
```

## Step 6: Update Your .env File
Replace the placeholder values in your `.env` file:

```env
# Replace the entire MONGODB_URI with your copied connection string
MONGODB_URI=mongodb+srv://elearning:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/elearning?retryWrites=true&w=majority
```

**Important**: 
- Replace `YOUR_PASSWORD` with the password you created in Step 3
- The connection string shows `myFirstDatabase` by default, replace it with `elearning`
- Keep credentials secure - never commit `.env` to version control

## Step 7: Test the Connection
1. Start your backend server:
```bash
npm run dev
```

2. You should see:
```
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
🚀 Server running on port 10000
```

## Connection String Format
```
mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority
```

### Example (Replace with your values):
```
mongodb+srv://elearning:MyPassword123@cluster0.abc123.mongodb.net/elearning?retryWrites=true&w=majority
```

## Troubleshooting

### Error: "authentication failed"
- Check username and password are correct in .env
- Verify the database user exists in MongoDB Atlas
- Make sure password is URL encoded if it contains special characters

### Error: "Unable to connect"
- Check if your IP is whitelisted in Network Access
- Make sure cluster is fully initialized (green status)
- Try "Allow Access from Anywhere" temporarily for testing

### Error: "connect ECONNREFUSED"
- You're still trying to connect to localhost
- Verify MONGODB_URI in .env starts with `mongodb+srv://`
- Check your .env file is in the `backend` folder

## Creating Additional Databases
1. In MongoDB Atlas, click your cluster
2. Go to **"Collections"** tab
3. Click **"+ Create Database"**
4. Enter database name and collection name
5. Click **"Create"**

## Next Steps
1. Test API endpoints with Postman (see [POSTMAN_TESTING_GUIDE.md](./POSTMAN_TESTING_GUIDE.md))
2. Run your frontend and test login/registration
3. Monitor database in MongoDB Atlas dashboard
