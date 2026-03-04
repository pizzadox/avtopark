import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Import database data from JSON file
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data } = body

    if (!data) {
      return NextResponse.json({ error: 'Нет данных для импорта' }, { status: 400 })
    }

    const results = {
      vehicleTypes: 0,
      owners: 0,
      tenants: 0,
      repairStatuses: 0,
      vehicles: 0,
      repairs: 0,
      users: 0,
      userGroups: 0,
      settings: 0
    }

    // Import in correct order (dependencies first)
    
    // 1. Vehicle Types
    if (data.vehicleTypes?.length) {
      for (const item of data.vehicleTypes) {
        try {
          await db.vehicleType.upsert({
            where: { id: item.id },
            update: {
              name: item.name,
              icon: item.icon,
              sortOrder: item.sortOrder
            },
            create: {
              id: item.id,
              name: item.name,
              icon: item.icon,
              sortOrder: item.sortOrder
            }
          })
          results.vehicleTypes++
        } catch (e) {
          console.log('VehicleType import skipped:', item.name)
        }
      }
    }

    // 2. Owners
    if (data.owners?.length) {
      for (const item of data.owners) {
        try {
          await db.owner.upsert({
            where: { id: item.id },
            update: {
              name: item.name,
              phone: item.phone,
              address: item.address,
              notes: item.notes
            },
            create: {
              id: item.id,
              name: item.name,
              phone: item.phone,
              address: item.address,
              notes: item.notes
            }
          })
          results.owners++
        } catch (e) {
          console.log('Owner import skipped:', item.name)
        }
      }
    }

    // 3. Tenants
    if (data.tenants?.length) {
      for (const item of data.tenants) {
        try {
          await db.tenant.upsert({
            where: { id: item.id },
            update: {
              name: item.name,
              phone: item.phone,
              address: item.address,
              notes: item.notes
            },
            create: {
              id: item.id,
              name: item.name,
              phone: item.phone,
              address: item.address,
              notes: item.notes
            }
          })
          results.tenants++
        } catch (e) {
          console.log('Tenant import skipped:', item.name)
        }
      }
    }

    // 4. Repair Statuses
    if (data.repairStatuses?.length) {
      for (const item of data.repairStatuses) {
        try {
          await db.repairStatus.upsert({
            where: { id: item.id },
            update: {
              name: item.name,
              color: item.color,
              icon: item.icon,
              sortOrder: item.sortOrder,
              isDefault: item.isDefault,
              isCompleted: item.isCompleted,
              isActive: item.isActive
            },
            create: {
              id: item.id,
              name: item.name,
              color: item.color,
              icon: item.icon,
              sortOrder: item.sortOrder,
              isDefault: item.isDefault,
              isCompleted: item.isCompleted,
              isActive: item.isActive
            }
          })
          results.repairStatuses++
        } catch (e) {
          console.log('RepairStatus import skipped:', item.name)
        }
      }
    }

    // 5. User Groups
    if (data.userGroups?.length) {
      for (const item of data.userGroups) {
        try {
          await db.userGroup.upsert({
            where: { id: item.id },
            update: {
              name: item.name,
              permissions: item.permissions
            },
            create: {
              id: item.id,
              name: item.name,
              permissions: item.permissions
            }
          })
          results.userGroups++
        } catch (e) {
          console.log('UserGroup import skipped:', item.name)
        }
      }
    }

    // 6. Users
    if (data.users?.length) {
      for (const item of data.users) {
        try {
          await db.user.upsert({
            where: { id: item.id },
            update: {
              name: item.name,
              pin: item.pin,
              avatar: item.avatar,
              isAdmin: item.isAdmin,
              isActive: item.isActive,
              groupId: item.groupId
            },
            create: {
              id: item.id,
              name: item.name,
              pin: item.pin,
              avatar: item.avatar,
              isAdmin: item.isAdmin,
              isActive: item.isActive,
              groupId: item.groupId
            }
          })
          results.users++
        } catch (e) {
          console.log('User import skipped:', item.name)
        }
      }
    }

    // 7. Vehicles
    if (data.vehicles?.length) {
      for (const item of data.vehicles) {
        try {
          await db.vehicle.upsert({
            where: { id: item.id },
            update: {
              brand: item.brand,
              regNumber: item.regNumber,
              owner: item.owner,
              tenant: item.tenant,
              ownerId: item.ownerId,
              tenantId: item.tenantId,
              hasGlonass: item.hasGlonass,
              vehicleType: item.vehicleType,
              vehicleTypeId: item.vehicleTypeId,
              vin: item.vin,
              mileage: item.mileage,
              techInspection: item.techInspection,
              ptsImage: item.ptsImage
            },
            create: {
              id: item.id,
              brand: item.brand,
              regNumber: item.regNumber,
              owner: item.owner,
              tenant: item.tenant,
              ownerId: item.ownerId,
              tenantId: item.tenantId,
              hasGlonass: item.hasGlonass,
              vehicleType: item.vehicleType,
              vehicleTypeId: item.vehicleTypeId,
              vin: item.vin,
              mileage: item.mileage,
              techInspection: item.techInspection,
              ptsImage: item.ptsImage
            }
          })
          results.vehicles++
        } catch (e) {
          console.log('Vehicle import skipped:', item.regNumber)
        }
      }
    }

    // 8. Repairs
    if (data.repairs?.length) {
      for (const item of data.repairs) {
        try {
          await db.repair.upsert({
            where: { id: item.id },
            update: {
              entryDate: new Date(item.entryDate),
              exitDate: item.exitDate ? new Date(item.exitDate) : null,
              vehicleId: item.vehicleId,
              regNumber: item.regNumber,
              vehicleInfo: item.vehicleInfo,
              malfunction: item.malfunction,
              welding: item.welding,
              lathe: item.lathe,
              repair: item.repair,
              diagnostics: item.diagnostics,
              defectation: item.defectation,
              spareParts: item.spareParts,
              downtimeDays: item.downtimeDays,
              downtimeHours: item.downtimeHours,
              downtimeMinutes: item.downtimeMinutes,
              priority: item.priority,
              workDescription: item.workDescription,
              sparePartsInfo: item.sparePartsInfo,
              statusId: item.statusId,
              status: item.status,
              mileage: item.mileage,
              notes: item.notes,
              masterId: item.masterId,
              masterName: item.masterName
            },
            create: {
              id: item.id,
              entryDate: new Date(item.entryDate),
              exitDate: item.exitDate ? new Date(item.exitDate) : null,
              vehicleId: item.vehicleId,
              regNumber: item.regNumber,
              vehicleInfo: item.vehicleInfo,
              malfunction: item.malfunction,
              welding: item.welding,
              lathe: item.lathe,
              repair: item.repair,
              diagnostics: item.diagnostics,
              defectation: item.defectation,
              spareParts: item.spareParts,
              downtimeDays: item.downtimeDays,
              downtimeHours: item.downtimeHours,
              downtimeMinutes: item.downtimeMinutes,
              priority: item.priority,
              workDescription: item.workDescription,
              sparePartsInfo: item.sparePartsInfo,
              statusId: item.statusId,
              status: item.status,
              mileage: item.mileage,
              notes: item.notes,
              masterId: item.masterId,
              masterName: item.masterName
            }
          })
          results.repairs++
        } catch (e) {
          console.log('Repair import skipped:', item.id)
        }
      }
    }

    // 9. Settings
    if (data.settings?.length) {
      for (const item of data.settings) {
        try {
          await db.setting.upsert({
            where: { id: item.id },
            update: {
              key: item.key,
              value: item.value
            },
            create: {
              id: item.id,
              key: item.key,
              value: item.value
            }
          })
          results.settings++
        } catch (e) {
          console.log('Setting import skipped:', item.key)
        }
      }
    }

    return NextResponse.json({
      success: true,
      ...results
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Ошибка при импорте данных' }, { status: 500 })
  }
}
