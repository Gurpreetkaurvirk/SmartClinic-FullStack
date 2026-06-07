# SmartClinic — Digital Patient Management System

A full-stack web application built with Node.js, Express and SQLite.

## Tech Stack
- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Backend:** Node.js + Express.js (REST API)
- **Database:** SQLite (via sql.js — no installation required)

## Project Structure
```
smartclinic/
├── server.js          ← Express backend + API routes
├── package.json       ← Dependencies
├── clinic.db          ← SQLite database (auto-created on first run)
└── public/
    └── index.html     ← Frontend (served by Express)
```

## How to Run

### Step 1 — Install dependencies
```bash
npm install
```

### Step 2 — Start the server
```bash
npm start
```
or
```bash
node server.js
```

### Step 3 — Open in browser
```
http://localhost:3000
```

## Login Credentials
| Role   | Username   | Password  |
|--------|------------|-----------|
| Doctor | dr.sharma  | demo123   |
| Admin  | admin      | admin123  |
| Staff  | staff1     | staff123  |

## API Endpoints

### Auth
| Method | Endpoint      | Description       |
|--------|---------------|-------------------|
| POST   | /api/login    | Login user        |

### Patients
| Method | Endpoint            | Description        |
|--------|---------------------|--------------------|
| GET    | /api/patients       | Get all patients   |
| GET    | /api/patients/:id   | Get one patient    |
| POST   | /api/patients       | Add new patient    |
| PUT    | /api/patients/:id   | Update patient     |
| DELETE | /api/patients/:id   | Delete patient     |

### Visits
| Method | Endpoint                     | Description           |
|--------|------------------------------|-----------------------|
| GET    | /api/patients/:id/visits     | Get patient visits    |
| POST   | /api/patients/:id/visits     | Add visit             |
| GET    | /api/visits                  | Get all visits        |

### Prescriptions
| Method | Endpoint                         | Description              |
|--------|----------------------------------|--------------------------|
| GET    | /api/prescriptions               | Get all prescriptions    |
| GET    | /api/patients/:id/prescriptions  | Get patient prescriptions|
| POST   | /api/prescriptions               | Add prescription         |
| DELETE | /api/prescriptions/:id           | Delete prescription      |

### Appointments
| Method | Endpoint                      | Description              |
|--------|-------------------------------|--------------------------|
| GET    | /api/appointments             | Get all appointments     |
| POST   | /api/appointments             | Book appointment         |
| PUT    | /api/appointments/:id/status  | Update status            |
| DELETE | /api/appointments/:id         | Delete appointment       |

### Settings & Stats
| Method | Endpoint      | Description        |
|--------|---------------|--------------------|
| GET    | /api/stats    | Get dashboard stats|
| GET    | /api/settings | Get settings       |
| POST   | /api/settings | Save settings      |

## Features
- Patient registration and management
- Visit history with symptoms, diagnosis, vitals
- Prescription management with medicines
- Appointment scheduling with status tracking
- Reports and analytics dashboard
- Settings (clinic name, doctor name, etc.)
- Data persists in SQLite database file (clinic.db)
