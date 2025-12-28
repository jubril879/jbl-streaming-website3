# CinemaHub Backend

Backend API for the CinemaHub movie streaming application built with Node.js, Express, and MongoDB.

## Features

- User Authentication (Register & Login)
- JWT Token-based Authorization
- Movie Management (CRUD operations)
- Admin Dashboard
- Watch History Tracking
- Featured Movies

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud - MongoDB Atlas)
- npm or yarn

## Installation

1. Navigate to the backend directory:

```bash
cd movie-streaming-backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:

```
MONGODB_URI=mongodb://localhost:27017/cinemahub
JWT_SECRET=your_jwt_secret_key_here_change_in_production
PORT=5000
NODE_ENV=development
```

**MongoDB Setup:**

- **Local**: Make sure MongoDB is running locally
- **Cloud**: Use MongoDB Atlas (https://www.mongodb.com/cloud/atlas)
  - Replace `MONGODB_URI` with your connection string

## Running the Server

**Development mode** (with auto-reload):

```bash
npm run dev
```

**Production mode**:

```bash
npm start
```

Server will run on `http://localhost:5000`

## API Endpoints

### Authentication

**Register**

```
POST /api/auth/register
Body: { name, email, password }
Response: { token, user }
```

**Login**

```
POST /api/auth/login
Body: { email, password }
Response: { token, user }
```

### Movies

**Get All Movies**

```
GET /api/movies
Response: [{ id, title, genre, rating, year, ... }]
```

**Get Single Movie**

```
GET /api/movies/:id
Response: { id, title, genre, ... }
```

**Create Movie** (Admin only)

```
POST /api/movies
Headers: Authorization: Bearer <token>
Body: { title, genre, rating, year, description, poster, videoUrl, isFeatured }
Response: { movie }
```

**Update Movie** (Admin only)

```
PUT /api/movies/:id
Headers: Authorization: Bearer <token>
Body: { title, genre, rating, year, ... }
Response: { movie }
```

**Delete Movie** (Admin only)

```
DELETE /api/movies/:id
Headers: Authorization: Bearer <token>
Response: { message }
```

## Admin Credentials

**Email**: admin@cinemahub.com
**Password**: admin123

These are created automatically on first server start.

## Database Schema

### User

- name: String
- email: String (unique)
- password: String (hashed)
- role: String (user/admin)
- createdAt: Date
- updatedAt: Date

### Movie

- title: String
- genre: String
- rating: Number
- year: Number
- description: String
- poster: String (URL)
- videoUrl: String (URL)
- uploadedBy: ObjectId (User reference)
- isFeatured: Boolean
- createdAt: Date
- updatedAt: Date

### WatchHistory

- userId: ObjectId (User reference)
- movieId: ObjectId (Movie reference)
- watchedAt: Date
- duration: Number

## Frontend Integration

Update your frontend `.env` to point to the backend:

```
VITE_API_URL=http://localhost:5000/api
```

Then update API calls in your components:

```javascript
const response = await fetch(`${process.env.VITE_API_URL}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
```

## Deployment

For production deployment:

1. Use a cloud MongoDB service (MongoDB Atlas)
2. Set environment variables on your hosting platform
3. Use `npm start` for production

## License

ISC
