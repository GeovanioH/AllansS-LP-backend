const express = require('express')
const { Pool } = require('pg')
const cors = require('cors')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json())

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

// Init table
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS waitlist (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)
  console.log('Table waitlist prête.')
}
initDB()

// POST /subscribe
app.post('/subscribe', async (req, res) => {
  const { email } = req.body
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Email invalide.' })
  }
  try {
    await pool.query(
      'INSERT INTO waitlist (email) VALUES ($1) ON CONFLICT (email) DO NOTHING',
      [email]
    )
    res.json({ success: true, message: 'Email enregistré.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur.' })
  }
})

// GET /subscribers (protégé par clé admin)
app.get('/subscribers', async (req, res) => {
  if (req.headers['x-admin-key'] !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Non autorisé.' })
  }
  const { rows } = await pool.query('SELECT * FROM waitlist ORDER BY created_at DESC')
  res.json(rows)
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`AllansS backend running on port ${PORT}`))
