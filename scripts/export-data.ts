import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function exportData() {
  console.log('Начинаю экспорт данных...')
  
  try {
    // Экспорт транспортных средств
    const vehicles = await prisma.vehicle.findMany({
      include: {
        _count: {
          select: { repairs: true }
        }
      }
    })
    console.log(`✓ Экспортировано ${vehicles.length} транспортных средств`)

    // Экспорт ремонтов
    const repairs = await prisma.repair.findMany()
    console.log(`✓ Экспортировано ${repairs.length} записей о ремонтах`)

    // Экспорт истории
    let history: any[] = []
    try {
      history = await (prisma as any).vehicleHistory.findMany()
      console.log(`✓ Экспортировано ${history.length} записей истории`)
    } catch (e) {
      console.log('⚠ История пуста или таблица не существует')
    }

    // Формируем данные для экспорта
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      count: {
        vehicles: vehicles.length,
        repairs: repairs.length,
        history: history.length
      },
      data: {
        vehicles,
        repairs,
        history
      }
    }

    // Сохраняем в файл
    const outputPath = path.join(process.cwd(), 'backup-data.json')
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8')
    
    console.log('\n========================================')
    console.log('✅ Экспорт успешно завершён!')
    console.log(`📄 Файл сохранён: ${outputPath}`)
    console.log(`📊 Статистика:`)
    console.log(`   - Транспорт: ${vehicles.length}`)
    console.log(`   - Ремонты: ${repairs.length}`)
    console.log(`   - История: ${history.length}`)
    console.log('========================================')

  } catch (error) {
    console.error('❌ Ошибка экспорта:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

exportData()
