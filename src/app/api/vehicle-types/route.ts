import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/vehicle-types - Get all vehicle types
export async function GET() {
  try {
    const types = await db.vehicleType.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { vehicles: true } }
      }
    })
    return NextResponse.json(types)
  } catch (error) {
    console.error('Error fetching vehicle types:', error)
    return NextResponse.json({ error: 'Ошибка при получении типов транспорта' }, { status: 500 })
  }
}

// POST /api/vehicle-types - Create new vehicle type
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const type = await db.vehicleType.create({
      data: {
        name: data.name,
        icon: data.icon || null,
        sortOrder: data.sortOrder || 0
      }
    })
    return NextResponse.json(type)
  } catch (error) {
    console.error('Error creating vehicle type:', error)
    return NextResponse.json({ error: 'Ошибка при создании типа транспорта' }, { status: 500 })
  }
}

// PUT /api/vehicle-types - Update vehicle type
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const { id, ...updateData } = data
    
    const type = await db.vehicleType.update({
      where: { id },
      data: updateData
    })
    return NextResponse.json(type)
  } catch (error) {
    console.error('Error updating vehicle type:', error)
    return NextResponse.json({ error: 'Ошибка при обновлении типа транспорта' }, { status: 500 })
  }
}

// DELETE /api/vehicle-types - Delete vehicle type
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID обязателен' }, { status: 400 })
    }
    
    // Check if any vehicles use this type
    const vehiclesCount = await db.vehicle.count({
      where: { vehicleTypeId: id }
    })
    
    if (vehiclesCount > 0) {
      return NextResponse.json({ 
        error: `Невозможно удалить тип, используется в ${vehiclesCount} транспортных средствах` 
      }, { status: 400 })
    }
    
    await db.vehicleType.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting vehicle type:', error)
    return NextResponse.json({ error: 'Ошибка при удалении типа транспорта' }, { status: 500 })
  }
}
