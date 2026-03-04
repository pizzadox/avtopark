import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/groups - Get all groups
export async function GET() {
  try {
    const groups = await db.userGroup.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(groups)
  } catch (error) {
    console.error('Error fetching groups:', error)
    return NextResponse.json({ error: 'Ошибка при получении групп' }, { status: 500 })
  }
}

// POST /api/groups - Create new group
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const group = await db.userGroup.create({
      data: {
        name: data.name,
        permissions: data.permissions || null
      }
    })

    return NextResponse.json(group)
  } catch (error) {
    console.error('Error creating group:', error)
    return NextResponse.json({ error: 'Ошибка при создании группы' }, { status: 500 })
  }
}

// PUT /api/groups - Update group
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const { id, ...updateData } = data

    if (!id) {
      return NextResponse.json({ error: 'ID группы обязателен' }, { status: 400 })
    }

    const group = await db.userGroup.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(group)
  } catch (error) {
    console.error('Error updating group:', error)
    return NextResponse.json({ error: 'Ошибка при обновлении группы' }, { status: 500 })
  }
}

// DELETE /api/groups - Delete group
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID группы обязателен' }, { status: 400 })
    }

    // Remove group from users first
    await db.user.updateMany({
      where: { groupId: id },
      data: { groupId: null }
    })

    await db.userGroup.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting group:', error)
    return NextResponse.json({ error: 'Ошибка при удалении группы' }, { status: 500 })
  }
}
