# 📚 BookNook – Backend API

This repository contains the backend REST API for **BookNook – A Small Online Library**.

The backend is built with Node.js, Express, TypeScript, and MongoDB. It provides APIs for managing books, borrowing and returning books, inventory updates, and authenticated user operations.

## 🌐 Project Links

**Live Website:** https://booknooklibrary.netlify.app

**Frontend Repository:** https://github.com/abrar-jaman-gazi/booknook-client

**Backend Repository:** https://github.com/abrar-jaman-gazi/booknook-server

**Production API:** https://booknook-server-pw1e.onrender.com

**Health Check:** https://booknook-server-pw1e.onrender.com/api/health

---

## ✨ Backend Features

- RESTful API architecture.
- MongoDB database integration.
- Book creation, retrieval, updating, and deletion.
- Borrowing and returning functionality.
- Automatic available-copy updates.
- Prevention of duplicate active borrowing.
- JWT-based authentication for protected API operations.
- User-specific book management.
- User-specific borrowing history.
- CORS configuration for frontend communication.
- Centralized backend structure using routes, controllers, services, and middleware.

---

## 🛠️ Technologies Used

- Node.js
- Express.js
- TypeScript
- MongoDB
- MongoDB Atlas
- JSON Web Token (JWT)
- Helmet
- CORS

---

## 📂 Project Structure

```text
booknook-server/
├── src/
│   ├── config/
│   ├── middleware/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── models/
│   ├── utils/
│   └── server.ts
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

---

## ⚙️ Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/abrar-jaman-gazi/booknook-server.git
```

### 2. Navigate to the Project

```bash
cd booknook-server
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the project root.

```env
PORT=5001

MONGODB_URI=your_mongodb_connection_string
DB_NAME=booknook

JWT_SECRET=your_jwt_secret

CLIENT_URLS=http://localhost:3000
```

For production, configure the frontend origin in `CLIENT_URLS`:

```env
CLIENT_URLS=https://booknooklibrary.netlify.app,http://localhost:3000
```



### 5. Build the Project

```bash
npm run build
```

### 6. Start the Server

```bash
npm start
```

The local backend will run at:

```text
http://localhost:5001
```

---

## 🔌 API Documentation

Base URL:

**Local:**
```text
http://localhost:5001
```

**Production:**
```text
https://booknook-server-pw1e.onrender.com
```

### Health Check

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Check backend health |

### Book APIs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/books` | Retrieve all books |
| GET | `/api/books?limit=6` | Retrieve the latest six books |
| GET | `/api/books/:id` | Retrieve a specific book |
| POST | `/api/books` | Add a new book |
| PATCH | `/api/books/:id` | Update an existing book |
| DELETE | `/api/books/:id` | Delete a book |

### Borrowing APIs

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/borrows` | Borrow a book |
| GET | `/api/borrows` | Retrieve borrowing records |
| DELETE | `/api/borrows/:id` | Return a borrowed book |

### Authentication

Protected API operations require a valid JWT.

Include the token in the request header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

The frontend obtains the token through its backend-token API route.

---



---

## 📚 Borrowing and Inventory Management

The borrowing system manages book availability.

### Borrowing Process

1. A user selects a book.
2. The backend checks whether copies are available.
3. The backend checks for an existing active borrow by that user.
4. A borrowing record is created.
5. The available-copy count is decreased.

### Returning Process

1. The user selects a borrowed book to return.
2. The backend updates the borrowing status.
3. The available-copy count is increased.

A book cannot be borrowed when its available-copy count reaches zero.

---

## 🗄️ Database

BookNook uses MongoDB Atlas as its database service.

**Database Name:** `booknook`

MongoDB stores:
- Book records.
- Borrowing records.
- Better Auth user and session data through the frontend's MongoDB adapter.

---

## 🚀 Deployment

The backend is deployed on **Render**.

**Production URL:**

https://booknook-server-pw1e.onrender.com

**Health Check:**

https://booknook-server-pw1e.onrender.com/api/health

To deploy your own backend:

1. Push the server project to GitHub.
2. Create a Web Service on Render.
3. Connect the GitHub repository.
4. Configure the build command:

```bash
npm install && npm run build
```

5. Configure the start command:

```bash
npm start
```

6. Add the required environment variables.
7. Deploy the service.
8. Verify the health-check endpoint.

---

## 🔗 Frontend Integration

The frontend application communicates with this backend.

**Frontend:** https://booknooklibrary.netlify.app

**Frontend Repository:** https://github.com/abrar-jaman-gazi/booknook-client

See the frontend repository for installation and UI documentation.

---

## 👨‍💻 Author

**BookNook Development Team**

Backend development using Express, TypeScript, and MongoDB.

---

## 📄 License

This project was developed for educational purposes.