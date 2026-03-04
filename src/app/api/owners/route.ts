import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/owners - Get all owners
export async function GET() {
  try {
    const owners = await db.owner.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { vehicles: true } }
      }
    })
    return NextResponse.json(owners)
  } catch (error) {
    console.error('Error fetching owners:', error)
    return NextResponse.json({ error: 'Ошибка при получении владельцев' }, { status: 500 })
  }
}

// POST /api/owners - Create new owner
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const owner = await db.owner.create({
      data: {
        name: data.name,
        phone: data.phone || null,
        address: data.address || null,
        notes: data.notes || null
      }
    })
    return NextResponse.json(owner)
  } catch (error) {
    console.error('Error creating owner:', error)
    return NextResponse.json({ error: 'Ошибка при создании владельца' }, { status: 500 })
  }
}

// PUT /api/owners - Update owner
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const { id, ...updateData } = data
    
    const owner = await db.owner.update({
      where: { id },
      data: updateData
    })
    return NextResponse.json(owner)
  } catch (error) {
    console.error('Error updating owner:', error)
    return NextResponse.json({ error: 'Ошибка при обновлении владельца' }, { status: 500 })
  }
}

// DELETE /api/owners - Delete owner
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID обязателен' }, { status: 400 })
    }
    
    // Check if any vehicles use this owner
    const vehiclesCount = await db.vehicle.count({
      where: { ownerId: id }
    })
    
    if (vehiclesCount > 0) {
      return NextResponse.json({ 
        error: `Невозможно удалить владельца, используется в ${vehiclesCount} транспортных средствах` 
      }, { status: 400 })
    }
    
    await db.owner.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting owner:', error)
    return NextResponse.json({ error: 'Ошибка при удалении владельца' }, { status: 500 })
  }
}
