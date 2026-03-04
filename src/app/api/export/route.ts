import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Export all database data to JSON
export async function GET() {
  try {
    // Export all data
    const [
      vehicles,
      repairs,
      owners,
      tenants,
      vehicleTypes,
      repairStatuses,
      users,
      userGroups,
      vehicleHistory,
      settings
    ] = await Promise.all([
      db.vehicle.findMany({
        include: {
          _count: { select: { repairs: true } }
        }
      }),
      db.repair.findMany({
        include: {
          vehicle: {
            select: {
              brand: true,
              regNumber: true,
              vehicleType: true,
              owner: true
            }
          }
        }
      }),
      db.owner.findMany({
        include: {
          _count: { select: { vehicles: true } }
        }
      }),
      db.tenant.findMany({
        include: {
          _count: { select: { vehicles: true } }
        }
      }),
      db.vehicleType.findMany({
        include: {
          _count: { select: { vehicles: true } }
        }
      }),
      db.repairStatus.findMany({
        include: {
          _count: { select: { repairs: true } }
        }
      }),
      db.user.findMany({
        select: {
          id: true,
          name: true,
          pin: true,
          avatar: true,
          isAdmin: true,
          isActive: true,
          groupId: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      db.userGroup.findMany(),
      db.vehicleHistory.findMany(),
      db.setting.findMany()
    ])

    return NextResponse.json({
      exportDate: new Date().toISOString(),
      version: '1.0',
      data: {
        vehicles,
        repairs,
        owners,
        tenants,
        vehicleTypes,
        repairStatuses,
        users,
        userGroups,
        vehicleHistory,
        settings
      }
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Ошибка при экспорте данных' }, { status: 500 })
  }
}
