import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/tenants - Get all tenants
export async function GET() {
  try {
    const tenants = await db.tenant.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { vehicles: true } }
      }
    })
    return NextResponse.json(tenants)
  } catch (error) {
    console.error('Error fetching tenants:', error)
    return NextResponse.json({ error: 'Ошибка при получении арендаторов' }, { status: 500 })
  }
}

// POST /api/tenants - Create new tenant
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const tenant = await db.tenant.create({
      data: {
        name: data.name,
        phone: data.phone || null,
        address: data.address || null,
        notes: data.notes || null
      }
    })
    return NextResponse.json(tenant)
  } catch (error) {
    console.error('Error creating tenant:', error)
    return NextResponse.json({ error: 'Ошибка при создании арендатора' }, { status: 500 })
  }
}

// PUT /api/tenants - Update tenant
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const { id, ...updateData } = data
    
    const tenant = await db.tenant.update({
      where: { id },
      data: updateData
    })
    return NextResponse.json(tenant)
  } catch (error) {
    console.error('Error updating tenant:', error)
    return NextResponse.json({ error: 'Ошибка при обновлении арендатора' }, { status: 500 })
  }
}

// DELETE /api/tenants - Delete tenant
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID обязателен' }, { status: 400 })
    }
    
    // Check if any vehicles use this tenant
    const vehiclesCount = await db.vehicle.count({
      where: { tenantId: id }
    })
    
    if (vehiclesCount > 0) {
      return NextResponse.json({ 
        error: `Невозможно удалить арендатора, используется в ${vehiclesCount} транспортных средствах` 
      }, { status: 400 })
    }
    
    await db.tenant.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tenant:', error)
    return NextResponse.json({ error: 'Ошибка при удалении арендатора' }, { status: 500 })
  }
}
