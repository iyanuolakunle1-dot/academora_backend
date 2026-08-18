import express from 'express'
import { requireAdmin, supabaseAdmin } from '../middleware/requireAdmin.js'

const router = express.Router()

function generateTempPassword() {
  const specials = '!@#$%^&*'
  const rand = (len) => Math.random().toString(36).slice(-len)
  return `${rand(4).toUpperCase()}${rand(4)}${specials[Math.floor(Math.random() * specials.length)]}${Math.floor(Math.random() * 10)}`
}

// Creates a real auth user + profile row for a student/teacher/librarian/admin.
// Only callable by an authenticated admin or super_admin (see requireAdmin).
// The new user receives an invite email and sets their own password on first login.
router.post('/create-user', requireAdmin, async (req, res) => {
  const { email, fullName, role, department, phone } = req.body

  if (!email || !fullName || !role) {
    return res.status(400).json({ error: 'email, fullName and role are required.' })
  }
  if (!['student', 'teacher', 'parent', 'librarian', 'admin', 'super_admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role.' })
  }

  try {
    const tempPassword = generateTempPassword()

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName, role }
    })

    if (createError) throw createError

    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: created.user.id,
      role,
      full_name: fullName,
      email,
      department: department || null,
      phone: phone || null
    })

    if (profileError) throw profileError

    // Send a password-recovery style invite so the new user can set their own password.
    await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email
    })

    res.status(201).json({ success: true, userId: created.user.id })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Could not create account.' })
  }
})

router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(req.params.id)
    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Could not delete account.' })
  }
})

export default router
