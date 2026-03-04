import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function importData() {
  console.log('Начинаю импорт данных...')
  
  try {
    // Читаем файл бэкапа
    const backupPath = path.join(process.cwd(), 'backup-data.json')
    
    if (!fs.existsSync(backupPath)) {
      console.error('❌ Файл backup-data.json не найден!')
      console.log('Скопируйте файл backup-data.json в корневую папку проекта')
      return
    }

    const backupContent = fs.readFileSync(backupPath, 'utf-8')
    const backup = JSON.parse(backupContent)

    console.log(`📁 Найден бэкап от: ${backup.exportedAt}`)
    console.log(`📊 Данные для импорта:`)
    console.log(`   - Транспорт: ${backup.count.vehicles}`)
    console.log(`   - Ремонты: ${backup.count.repairs}`)
    console.log(`   - История: ${backup.count.history}`)
    console.log('')

    // Подтверждение (в автоматическом режиме пропускаем)
    console.log('⚠ ВАЖНО: Все существующие данные будут заменены!')
    console.log('')

    // Очистка базы данных
    console.log('🧹 Очистка базы данных...')
    
    try {
      await (prisma as any).vehicleHistory.deleteMany()
      console.log('   ✓ История очищена')
    } catch (e) {
      console.log('   ⚠ Таблица истории не существует')
    }
    
    await prisma.repair.deleteMany()
    console.log('   ✓ Ремонты очищены')
    
    await prisma.vehicle.deleteMany()
    console.log('   ✓ Транспорт очищен')

    // Импорт транспортных средств
    console.log('\n📦 Импорт транспортных средств...')
    let vehiclesCount = 0
    for (const vehicle of backup.data.vehicles) {
      try {
        await prisma.vehicle.create({
          data: {
            id: vehicle.id,
            brand: vehicle.brand,
            regNumber: vehicle.regNumber,
            owner: vehicle.owner,
            tenant: vehicle.tenant,
            hasGlonass: vehicle.hasGlonass,
            vehicleType: vehicle.vehicleType,
            vin: vehicle.vin,
            mileage: vehicle.mileage,
            techInspection: vehicle.techInspection,
            ptsImage: vehicle.ptsImage,
            createdAt: new Date(vehicle.createdAt),
            updatedAt: new Date(vehicle.updatedAt)
          }
        })
        vehiclesCount++
      } catch (e) {
        console.log(`   ⚠ Ошибка импорта ${vehicle.regNumber}: ${e}`)
      }
    }
    console.log(`   ✓ Импортировано ${vehiclesCount} из ${backup.data.vehicles.length}`)

    // Импорт ремонтов
    console.log('\n📦 Импорт ремонтов...')
    let repairsCount = 0
    for (const repair of backup.data.repairs) {
      try {
        await prisma.repair.create({
          data: {
            id: repair.id,
            entryDate: new Date(repair.entryDate),
            exitDate: repair.exitDate ? new Date(repair.exitDate) : null,
            vehicleId: repair.vehicleId,
            regNumber: repair.regNumber,
            vehicleInfo: repair.vehicleInfo,
            malfunction: repair.malfunction,
            welding: repair.welding,
            lathe: repair.lathe,
            repair: repair.repair,
            diagnostics: repair.diagnostics,
            defectation: repair.defectation,
            spareParts: repair.spareParts,
            downtimeDays: repair.downtimeDays,
            downtimeHours: repair.downtimeHours,
            downtimeMinutes: repair.downtimeMinutes,
            priority: repair.priority,
            workDescription: repair.workDescription,
            sparePartsInfo: repair.sparePartsInfo,
            status: repair.status,
            mileage: repair.mileage,
            notes: repair.notes,
            createdAt: new Date(repair.createdAt),
            updatedAt: new Date(repair.updatedAt)
          }
        })
        repairsCount++
      } catch (e) {
        console.log(`   ⚠ Ошибка импорта ремонта ${repair.id}: ${e}`)
      }
    }
    console.log(`   ✓ Импортировано ${repairsCount} из ${backup.data.repairs.length}`)

    // Импорт истории
    if (backup.data.history && backup.data.history.length > 0) {
      console.log('\n📦 Импорт истории...')
      let historyCount = 0
      for (const h of backup.data.history) {
        try {
          await (prisma as any).vehicleHistory.create({
            data: {
              id: h.id,
              vehicleId: h.vehicleId,
              action: h.action,
              field: h.field,
              oldValue: h.oldValue,
              newValue: h.newValue,
              description: h.description,
              createdAt: new Date(h.createdAt)
            }
          })
          historyCount++
        } catch (e) {
          console.log(`   ⚠ Ошибка импорта истории: ${e}`)
        }
      }
      console.log(`   ✓ Импортировано ${historyCount} из ${backup.data.history.length}`)
    }

    console.log('\n========================================')
    console.log('✅ Импорт успешно завершён!')
    console.log('========================================')

  } catch (error) {
    console.error('❌ Ошибка импорта:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

importData()
