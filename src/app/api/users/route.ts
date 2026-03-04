import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/users - Get all users or single user by id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      const user = await db.user.findUnique({
        where: { id },
        include: {
          group: true
        }
      })

      if (!user) {
        return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
      }

      return NextResponse.json({
        ...user,
        pin: undefined // Don't expose PIN
      })
    }

    const users = await db.user.findMany({
      include: {
        group: true
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(users.map(u => ({
      ...u,
      pin: undefined
    })))
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Ошибка при получении пользователей' }, { status: 500 })
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Check if PIN already exists
    const existingUser = await db.user.findFirst({
      where: { pin: data.pin }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Пользователь с таким PIN уже существует' }, { status: 400 })
    }

    const user = await db.user.create({
      data: {
        name: data.name,
        pin: data.pin,
        groupId: data.groupId || null,
        avatar: data.avatar || null,
        isAdmin: data.isAdmin || false,
        isActive: data.isActive !== false
      },
      include: {
        group: true
      }
    })

    return NextResponse.json({
      ...user,
      pin: undefined
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Ошибка при создании пользователя' }, { status: 500 })
  }
}

// PUT /api/users - Update user
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const { id, ...updateData } = data

    if (!id) {
      return NextResponse.json({ error: 'ID пользователя обязателен' }, { status: 400 })
    }

    // If PIN is being updated, check for duplicates
    if (updateData.pin) {
      const existingUser = await db.user.findFirst({
        where: {
          pin: updateData.pin,
          NOT: { id }
        }
      })

      if (existingUser) {
        return NextResponse.json({ error: 'Пользователь с таким PIN уже существует' }, { status: 400 })
      }
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
      include: {
        group: true
      }
    })

    return NextResponse.json({
      ...user,
      pin: undefined
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Ошибка при обновлении пользователя' }, { status: 500 })
  }
}

// DELETE /api/users - Delete user
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID пользователя обязателен' }, { status: 400 })
    }

    await db.user.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Ошибка при удалении пользователя' }, { status: 500 })
  }
}
