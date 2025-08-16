# 🩺 DocBook – Doctor Appointment Booking Platform

A full-stack web application to discover doctors, view availability, and book appointments online.  
Built with **React + Node.js + Express + PostgreSQL** and secured with **JWT authentication**.

---

## 🚀 Features

- 🔐 **User Authentication** – Register & login with JWT
- 👩‍⚕️ **Discover Doctors** – Filter by specialization & mode (online / in-person)
- 📅 **Appointment Booking** – Select slots & confirm with OTP flow
- 🗂 **Appointments Dashboard** – View upcoming & past appointments
- 👨‍⚕️ **Doctor Login (basic)** – Doctors can view their appointments
- 💾 **Persistent Filters** – User preferences stored in localStorage
- ⚡ **Scalable API** – RESTful endpoints, ready for rate-limiting & caching

---

## 🛠️ Tech Stack

**Frontend**

- React (Vite)
- React Router
- Context API for state management
- Axios (API client)
- TailwindCSS for styling

**Backend**

- Node.js + Express
- PostgreSQL (with migrations & SQL schema)
- JWT Authentication
- REST API structure

---

## 📂 Project Structure

.
├── backend/
│ ├── migrations/ # SQL schema & migrations
│ ├── routes/ # Express routes
│ ├── models/ # DB queries
│ └── server.js # App entry point
│
├── frontend/
│ ├── src/
│ │ ├── components/ # Reusable UI
│ │ ├── pages/ # App pages (Discover, Book, Appointments)
│ │ ├── api/ # Axios instance
│ │ └── utils/ # Helpers (date formatting, etc.)
│ └── vite.config.js
│
├── README.md
├── API.md
└── SCALING.md

---

---

## ⚡ Getting Started

-- Clone Repo

```bash
git clone https://github.com/your-username/docbook.git
cd docbook

--- backend setup
cd backend
npm install

# Create DB
createdb docbook_db

# Run migrations
psql -U postgres -d docbook_db -f migrations/001_init.sql

# Start server
npm run dev

---- frontend setup

cd frontend
npm install

# Start React app
npm run dev


-- backend env
PORT=5000
DATABASE_URL=postgres://postgres:password@localhost:5432/docbook_db
JWT_SECRET=supersecretkey

--  frontend env
VITE_API_BASE_URL=http://localhost:5000/api

📖 Documentation

API docs → API.md

Scaling plan → SCALING.md

🚀 Deployment

Frontend → Vercel

Backend → Render

Database → Render PostgreSQL

🤝 Contributing

Fork the repo

Create your feature branch

Commit changes

Push to branch

Create a Pull Request

📌 License

MIT License

---

✅ This is a **ready-to-drop README.md**.
Do you want me to also draft the **API.md skeleton** right away so you don’t waste time later, and you just fill in endpoints tomorrow?
```
