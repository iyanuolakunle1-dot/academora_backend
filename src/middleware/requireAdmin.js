import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export async function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) return res.status(401).json({ error: 'Missing authorization token.' })

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !userData?.user) return res.status(401).json({ error: 'Invalid or expired session.' })

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single()

    if (profileError || !['admin', 'super_admin'].includes(profile?.role)) {
      return res.status(403).json({ error: 'Admin access required.' })
    }

    req.adminUser = userData.user
    req.supabaseAdmin = supabaseAdmin
    next()
  } catch (err) {
    res.status(500).json({ error: 'Authorization check failed.' })
  }
}

export { supabaseAdmin }
