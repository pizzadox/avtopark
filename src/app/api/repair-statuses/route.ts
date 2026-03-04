import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/repair-statuses - Get all repair statuses
export async function GET() {
  try {
    const statuses = await db.repairStatus.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { repairs: true } }
      }
    })
    return NextResponse.json(statuses)
  } catch (error) {
    console.error('Error fetching repair statuses:', error)
    return NextResponse.json({ error: 'Ошибка при получении статусов ремонта' }, { status: 500 })
  }
}

// POST /api/repair-statuses - Create new repair status
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // If this is set as default, remove default from others
    if (data.isDefault) {
      await db.repairStatus.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      })
    }
    
    const status = await db.repairStatus.create({
      data: {
        name: data.name,
        color: data.color || '#gray',
        icon: data.icon || null,
        sortOrder: data.sortOrder || 0,
        isDefault: data.isDefault || false,
        isCompleted: data.isCompleted || false,
        isActive: data.isActive !== false
      }
    })
    return NextResponse.json(status)
  } catch (error) {
    console.error('Error creating repair status:', error)
    return NextResponse.json({ error: 'Ошибка при создании статуса ремонта' }, { status: 500 })
  }
}

// PUT /api/repair-statuses - Update repair status
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const { id, ...updateData } = data
    
    // If this is set as default, remove default from others
    if (updateData.isDefault) {
      await db.repairStatus.updateMany({
        where: { 
          isDefault: true,
          NOT: { id }
        },
        data: { isDefault: false }
      })
    }
    
    const status = await db.repairStatus.update({
      where: { id },
      data: updateData
    })
    return NextResponse.json(status)
  } catch (error) {
    console.error('Error updating repair status:', error)
    return NextResponse.json({ error: 'Ошибка при обновлении статуса ремонта' }, { status: 500 })
  }
}

// DELETE /api/repair-statuses - Delete repair status
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID обязателен' }, { status: 400 })
    }
    
    // Check if any repairs use this status
    const repairsCount = await db.repair.count({
      where: { statusId: id }
    })
    
    if (repairsCount > 0) {
      return NextResponse.json({ 
        error: `Невозможно удалить статус, используется в ${repairsCount} ремонтах` 
      }, { status: 400 })
    }
    
    await db.repairStatus.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting repair status:', error)
    return NextResponse.json({ error: 'Ошибка при удалении статуса ремонта' }, { status: 500 })
  }
}
