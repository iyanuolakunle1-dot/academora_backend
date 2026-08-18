import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import cloudinaryRoutes from './routes/cloudinary.js'
import contactRoutes from './routes/contact.js'
import adminRoutes from './routes/admin.js'
import authRoutes from './routes/auth.js'

const app = express()
const PORT = process.env.PORT || 5000

app.use(helmet())
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  })
)
app.use(express.json({ limit: '2mb' }))

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 })
app.use(limiter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'academora-server', time: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.use('/api/cloudinary', cloudinaryRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/admin', adminRoutes)

app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
})

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Academora server running on port ${PORT}`)
})
