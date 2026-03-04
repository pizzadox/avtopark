import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/users/login - Login with PIN
export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json()

    if (!pin) {
      return NextResponse.json({ error: 'PIN-код обязателен' }, { status: 400 })
    }

    const user = await db.user.findFirst({
      where: {
        pin,
        isActive: true
      },
      include: {
        group: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Неверный PIN-код' }, { status: 401 })
    }

    return NextResponse.json({
      user: {
        ...user,
        pin: undefined
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Ошибка при авторизации' }, { status: 500 })
  }
}
