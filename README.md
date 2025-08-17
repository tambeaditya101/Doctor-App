# 🩺 DocBook – Doctor Appointment Booking Platform

A full-stack web application to discover doctors, view availability, and book appointments online.  
Built with **React + Node.js + Express + PostgreSQL** and secured with **JWT authentication**.

---

## 🚀 Features

- 🔐 **User Authentication** – Register & login with JWT
- 👩‍⚕️ **Discover Doctors** – Filter by specialization & mode (online / in-person)
- 📅 **Appointment Booking** – Select slots & confirm with OTP flow
- 🗂 **Appointments Dashboard** – View upcoming & past appointments
- 👨‍⚕️ **Doctor Availability History (basic)** – User can view all doctors availibility history
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

## ⚡ Getting Started

**Clone Repo**

```bash
git clone https://github.com/your-username/docbook.git
cd docbook

- backend setup
cd backend
npm install

# Create DB
createdb docbook_db

# Run all migrations manually 1-by-1 like below
psql -U postgres -d docbook_db -f migrations/001_init.sql

# Start server
npm run dev

- frontend setup

cd frontend
npm install

# Start React app
npm run dev

```

**Backend env**

PORT=5000
DATABASE_URL=postgres://postgres:password@localhost:5432/docbook_db
JWT_SECRET=supersecretkey

**Frontend env**
VITE_API_BASE_URL=http://localhost:5000/api

## 🚀 Deployment

- Frontend → Vercel
- Backend → Render
- Database → Render PostgreSQL

## 🤝 Contributing

- Fork the repo
- Create your feature branch
- Commit changes
- Push to branch
- Create a Pull Request

## 📌 MIT License

- This project is licensed under the MIT License.
