import express from 'express'
import { supabaseAdmin } from '../middleware/requireAdmin.js'

const router = express.Router()

// Resolves a matriculation number, staff ID, or email to an authenticated email address
router.post('/resolve-identifier', async (req, res) => {
  const { identifier } = req.body
  const idStr = (identifier || '').trim()

  if (!idStr) {
    return res.status(400).json({ error: 'Identifier is required.' })
  }

  // If already an email, return directly
  if (idStr.includes('@')) {
    return res.json({ success: true, email: idStr })
  }

  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('email, role, full_name, matric_number, staff_id')
      .or(`matric_number.ilike.${idStr},staff_id.ilike.${idStr}`)
      .maybeSingle()

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Error resolving identifier:', error)
      return res.status(404).json({ error: 'Account not found with this ID.' })
    }

    if (!profile || !profile.email) {
      return res.status(404).json({ error: 'No user found matching this Matriculation No. or Staff ID.' })
    }

    return res.json({
      success: true,
      email: profile.email,
      role: profile.role,
      fullName: profile.full_name
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in resolve-identifier:', err)
    return res.status(500).json({ error: 'Internal server error.' })
  }
})

export default router
