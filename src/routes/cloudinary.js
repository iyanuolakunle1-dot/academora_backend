import express from 'express'
import { v2 as cloudinary } from 'cloudinary'

const router = express.Router()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// Returns a signature so the client can upload directly and securely to
// Cloudinary without exposing the API secret. Use this instead of an
// unsigned preset in production.
router.post('/signature', (req, res) => {
  try {
    const { folder = 'academora' } = req.body
    const timestamp = Math.round(Date.now() / 1000)

    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET
    )

    res.json({
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder
    })
  } catch (err) {
    res.status(500).json({ error: 'Could not generate upload signature.' })
  }
})

export default router
