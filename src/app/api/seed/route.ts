import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/seed - Create default admin user if no users exist
export async function GET() {
  try {
    // Check if any users exist
    const existingUsers = await db.user.findMany()

    if (existingUsers.length > 0) {
      return NextResponse.json({
        message: 'Users already exist',
        usersCount: existingUsers.length
      })
    }

    // Create default admin user
    const admin = await db.user.create({
      data: {
        name: 'Администратор',
        pin: '1234',
        isAdmin: true,
        isActive: true,
        avatar: '👤'
      }
    })

    return NextResponse.json({
      message: 'Default admin user created',
      user: {
        id: admin.id,
        name: admin.name,
        isAdmin: admin.isAdmin,
        avatar: admin.avatar
      },
      pin: '1234', // Show PIN only on creation
      loginHint: 'Use PIN 1234 to login as admin'
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 })
  }
}
