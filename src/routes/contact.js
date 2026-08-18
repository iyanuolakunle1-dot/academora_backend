import express from 'express'
import { createClient } from '@supabase/supabase-js'

const router = express.Router()

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Optional server-side endpoint for the public contact form. The client
// currently writes directly to Supabase via RLS (see contact_messages policy),
// but routing through here lets you add spam filtering / email notifications
// later without touching the frontend.
router.post('/', async (req, res) => {
  const { name, email, phone, subject, message } = req.body

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields.' })
  }

  const { error } = await supabaseAdmin.from('contact_messages').insert({
    full_name: name,
    email,
    phone: phone || null,
    subject,
    message
  })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.status(201).json({ success: true })
})

export default router
