const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'clinic.db');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── DATABASE SETUP ───────────────────────────────────────────────────────────
let db;

async function initDB() {
  const SQL = await initSqlJs();

  // Load existing DB file if it exists
  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(fileBuffer);
    console.log('[DB] Loaded existing database from', DB_FILE);
  } else {
    db = new SQL.Database();
    console.log('[DB] Created new database');
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER,
      gender TEXT,
      mobile TEXT,
      blood_group TEXT,
      address TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS visits (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      symptoms TEXT,
      diagnosis TEXT,
      temperature TEXT,
      bp TEXT,
      notes TEXT,
      followup TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS prescriptions (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      diagnosis TEXT,
      medicines TEXT,
      instructions TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      date TEXT,
      time TEXT,
      reason TEXT,
      status TEXT DEFAULT 'scheduled',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  // Default users
  const userCheck = db.exec("SELECT COUNT(*) as cnt FROM users")[0];
  if (userCheck.values[0][0] === 0) {
    db.run(`INSERT INTO users (username, password, name, role) VALUES
      ('dr.sharma', 'demo123', 'Dr. R. Sharma', 'doctor'),
      ('admin', 'admin123', 'Admin User', 'admin'),
      ('staff1', 'staff123', 'Staff User', 'staff')
    `);
    console.log('[DB] Default users created');
  }

  // Default settings
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES
    ('clinicName', 'City General Clinic'),
    ('doctorName', 'Dr. R. Sharma'),
    ('contact', ''),
    ('address', 'Chandigarh')
  `);

  // Demo data if no patients
  const pCheck = db.exec("SELECT COUNT(*) as cnt FROM patients")[0];
  if (pCheck.values[0][0] === 0) {
    seedDemoData();
  }

  saveDB();
  console.log('[DB] Database ready');
}

function saveDB() {
  const data = db.export();
  fs.writeFileSync(DB_FILE, Buffer.from(data));
}

function runQuery(sql, params = []) {
  db.run(sql, params);
  saveDB();
}

function getAll(sql, params = []) {
  const result = db.exec(sql, params);
  if (!result || result.length === 0) return [];
  const cols = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    cols.forEach((col, i) => obj[col] = row[i]);
    return obj;
  });
}

function getOne(sql, params = []) {
  const rows = getAll(sql, params);
  return rows[0] || null;
}

function genId(prefix) {
  return prefix + Date.now() + Math.floor(Math.random() * 1000);
}

function seedDemoData() {
  const patients = [
    { id: 'P001', name: 'Priya Mehta', age: 34, gender: 'Female', mobile: '9876543210', blood_group: 'O+', address: 'Rajpur Colony, Chandigarh' },
    { id: 'P002', name: 'Rajan Verma', age: 58, gender: 'Male', mobile: '9876543211', blood_group: 'B+', address: 'Civil Lines, Chandigarh' },
    { id: 'P003', name: 'Sunita Devi', age: 42, gender: 'Female', mobile: '9876543212', blood_group: 'A-', address: 'Model Town, Chandigarh' },
    { id: 'P004', name: 'Arjun Singh', age: 29, gender: 'Male', mobile: '9123456789', blood_group: 'AB+', address: 'Sector 17, Chandigarh' }
  ];
  patients.forEach(p => {
    db.run(`INSERT INTO patients (id, name, age, gender, mobile, blood_group, address) VALUES (?,?,?,?,?,?,?)`,
      [p.id, p.name, p.age, p.gender, p.mobile, p.blood_group, p.address]);
  });

  const visits = [
    { pid: 'P001', symptoms: 'Fever, Headache', diagnosis: 'Viral Fever', temperature: '101.2', bp: '118/76', notes: 'Rest advised' },
    { pid: 'P002', symptoms: 'Cough, Cold', diagnosis: 'Upper Respiratory Infection', bp: '120/80', notes: 'Steam inhalation' },
    { pid: 'P003', symptoms: 'Back pain, Fatigue', diagnosis: 'Musculoskeletal Pain', temperature: '98.4', bp: '122/82' },
    { pid: 'P004', symptoms: 'Stomach pain, Nausea', diagnosis: 'Gastritis', bp: '116/74', notes: 'Avoid spicy food' }
  ];
  visits.forEach(v => {
    db.run(`INSERT INTO visits (id, patient_id, symptoms, diagnosis, temperature, bp, notes) VALUES (?,?,?,?,?,?,?)`,
      [genId('V'), v.pid, v.symptoms, v.diagnosis, v.temperature || '', v.bp || '', v.notes || '']);
  });

  const rxMeds = JSON.stringify([{ name: 'Paracetamol 500mg', dosage: '1-0-1', dur: '5 days' }, { name: 'Cetirizine 10mg', dosage: '0-0-1', dur: '3 days' }]);
  patients.forEach(p => {
    const diag = visits.find(v => v.pid === p.id).diagnosis;
    db.run(`INSERT INTO prescriptions (id, patient_id, diagnosis, medicines, instructions) VALUES (?,?,?,?,?)`,
      [genId('RX'), p.id, diag, rxMeds, 'Take after food. Drink plenty of water.']);
  });

  const today = new Date().toISOString().split('T')[0];
  db.run(`INSERT INTO appointments (id, patient_id, date, time, reason, status) VALUES (?,?,?,?,?,?)`, [genId('A'), 'P001', today, '10:00', 'Follow-up checkup', 'scheduled']);
  db.run(`INSERT INTO appointments (id, patient_id, date, time, reason, status) VALUES (?,?,?,?,?,?)`, [genId('A'), 'P002', today, '11:30', 'Blood pressure review', 'completed']);
  db.run(`INSERT INTO appointments (id, patient_id, date, time, reason, status) VALUES (?,?,?,?,?,?)`, [genId('A'), 'P003', today, '14:00', 'General consultation', 'scheduled']);
  console.log('[DB] Demo data seeded');
}

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  const user = getOne('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ success: true, user: { id: user.id, name: user.name, role: user.role, username: user.username } });
});

// ─── PATIENT ROUTES ───────────────────────────────────────────────────────────
app.get('/api/patients', (req, res) => {
  const patients = getAll('SELECT * FROM patients ORDER BY created_at DESC');
  res.json(patients);
});

app.get('/api/patients/:id', (req, res) => {
  const p = getOne('SELECT * FROM patients WHERE id = ?', [req.params.id]);
  if (!p) return res.status(404).json({ error: 'Patient not found' });
  res.json(p);
});

app.post('/api/patients', (req, res) => {
  const { name, age, gender, mobile, blood_group, address, notes } = req.body;
  if (!name || !mobile) return res.status(400).json({ error: 'Name and mobile are required' });
  const id = genId('P');
  runQuery(`INSERT INTO patients (id, name, age, gender, mobile, blood_group, address, notes) VALUES (?,?,?,?,?,?,?,?)`,
    [id, name, age || null, gender || '', mobile, blood_group || '', address || '', notes || '']);
  res.json({ success: true, id, message: 'Patient added' });
});

app.put('/api/patients/:id', (req, res) => {
  const { name, age, gender, mobile, blood_group, address, notes } = req.body;
  runQuery(`UPDATE patients SET name=?, age=?, gender=?, mobile=?, blood_group=?, address=?, notes=? WHERE id=?`,
    [name, age, gender, mobile, blood_group, address, notes, req.params.id]);
  res.json({ success: true, message: 'Patient updated' });
});

app.delete('/api/patients/:id', (req, res) => {
  const id = req.params.id;
  runQuery('DELETE FROM visits WHERE patient_id = ?', [id]);
  runQuery('DELETE FROM prescriptions WHERE patient_id = ?', [id]);
  runQuery('DELETE FROM appointments WHERE patient_id = ?', [id]);
  runQuery('DELETE FROM patients WHERE id = ?', [id]);
  res.json({ success: true, message: 'Patient deleted' });
});

// ─── VISIT ROUTES ─────────────────────────────────────────────────────────────
app.get('/api/patients/:id/visits', (req, res) => {
  const visits = getAll('SELECT * FROM visits WHERE patient_id = ? ORDER BY created_at DESC', [req.params.id]);
  res.json(visits);
});

app.get('/api/visits', (req, res) => {
  const visits = getAll('SELECT * FROM visits ORDER BY created_at DESC');
  res.json(visits);
});

app.post('/api/patients/:id/visits', (req, res) => {
  const { symptoms, diagnosis, temperature, bp, notes, followup } = req.body;
  if (!symptoms || !diagnosis) return res.status(400).json({ error: 'Symptoms and diagnosis required' });
  const vid = genId('V');
  runQuery(`INSERT INTO visits (id, patient_id, symptoms, diagnosis, temperature, bp, notes, followup) VALUES (?,?,?,?,?,?,?,?)`,
    [vid, req.params.id, symptoms, diagnosis, temperature || '', bp || '', notes || '', followup || '']);
  res.json({ success: true, id: vid, message: 'Visit recorded' });
});

// ─── PRESCRIPTION ROUTES ──────────────────────────────────────────────────────
app.get('/api/prescriptions', (req, res) => {
  const rxs = getAll('SELECT * FROM prescriptions ORDER BY created_at DESC');
  rxs.forEach(r => { try { r.medicines = JSON.parse(r.medicines || '[]'); } catch(e) { r.medicines = []; } });
  res.json(rxs);
});

app.get('/api/patients/:id/prescriptions', (req, res) => {
  const rxs = getAll('SELECT * FROM prescriptions WHERE patient_id = ? ORDER BY created_at DESC', [req.params.id]);
  rxs.forEach(r => { try { r.medicines = JSON.parse(r.medicines || '[]'); } catch(e) { r.medicines = []; } });
  res.json(rxs);
});

app.post('/api/prescriptions', (req, res) => {
  const { patient_id, diagnosis, medicines, instructions } = req.body;
  if (!patient_id || !diagnosis) return res.status(400).json({ error: 'Patient and diagnosis required' });
  const rid = genId('RX');
  runQuery(`INSERT INTO prescriptions (id, patient_id, diagnosis, medicines, instructions) VALUES (?,?,?,?,?)`,
    [rid, patient_id, diagnosis, JSON.stringify(medicines || []), instructions || '']);
  res.json({ success: true, id: rid, message: 'Prescription saved' });
});

app.delete('/api/prescriptions/:id', (req, res) => {
  runQuery('DELETE FROM prescriptions WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Prescription deleted' });
});

// ─── APPOINTMENT ROUTES ───────────────────────────────────────────────────────
app.get('/api/appointments', (req, res) => {
  const appts = getAll('SELECT * FROM appointments ORDER BY date DESC, time DESC');
  res.json(appts);
});

app.post('/api/appointments', (req, res) => {
  const { patient_id, date, time, reason, status } = req.body;
  if (!patient_id || !date || !time || !reason) return res.status(400).json({ error: 'All fields required' });
  const aid = genId('A');
  runQuery(`INSERT INTO appointments (id, patient_id, date, time, reason, status) VALUES (?,?,?,?,?,?)`,
    [aid, patient_id, date, time, reason, status || 'scheduled']);
  res.json({ success: true, id: aid, message: 'Appointment booked' });
});

app.put('/api/appointments/:id/status', (req, res) => {
  const { status } = req.body;
  runQuery('UPDATE appointments SET status = ? WHERE id = ?', [status, req.params.id]);
  res.json({ success: true, message: 'Status updated' });
});

app.delete('/api/appointments/:id', (req, res) => {
  runQuery('DELETE FROM appointments WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Appointment deleted' });
});

// ─── SETTINGS ROUTES ──────────────────────────────────────────────────────────
app.get('/api/settings', (req, res) => {
  const rows = getAll('SELECT key, value FROM settings');
  const settings = {};
  rows.forEach(r => settings[r.key] = r.value);
  res.json(settings);
});

app.post('/api/settings', (req, res) => {
  const entries = Object.entries(req.body);
  entries.forEach(([key, value]) => {
    runQuery('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
  });
  res.json({ success: true, message: 'Settings saved' });
});

// ─── STATS ROUTE ──────────────────────────────────────────────────────────────
app.get('/api/stats', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const patients   = getOne('SELECT COUNT(*) as cnt FROM patients').cnt;
  const visits     = getOne('SELECT COUNT(*) as cnt FROM visits').cnt;
  const rx         = getOne('SELECT COUNT(*) as cnt FROM prescriptions').cnt;
  const appts      = getOne('SELECT COUNT(*) as cnt FROM appointments WHERE date = ?', [today]).cnt;
  const pending    = getOne("SELECT COUNT(*) as cnt FROM appointments WHERE date = ? AND status = 'scheduled'", [today]).cnt;
  res.json({ patients, visits, prescriptions: rx, todayAppointments: appts, pendingAppointments: pending });
});

// ─── START ────────────────────────────────────────────────────────────────────
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n SmartClinic Server running at http://localhost:${PORT}`);
    console.log(' Database: SQLite (clinic.db)');
    console.log(' Login: dr.sharma / demo123\n');
  });
}).catch(err => {
  console.error('Failed to start:', err);
});
