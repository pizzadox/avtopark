import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'

const db = new PrismaClient()

function normalizeRegNumber(reg: string): string {
  if (!reg) return ''
  return reg.toUpperCase().replace(/\s+/g, '').trim()
}

function normalizeOwnerName(name: string): string {
  if (!name) return ''
  let normalized = name.trim()
  
  const normalizationMap: Record<string, string> = {
    'ЗАО"НСАХ"': 'ЗАО "НСАХ"',
    'ООО"САХ"': 'ЗАО "НСАХ"',
    'ООО "ЭКО СЕРВИС"': 'ООО "ЭКОСЕРВИС"',
    'Уткин Ю.А': 'Уткин Ю.А.',
    'ООО"МСК Рециклинг"': 'ООО "МСК Рециклинг"',
  }
  
  return normalizationMap[normalized] || normalized
}

async function main() {
  console.log('=== Starting Import from XLSX ===\n')

  const workbook = XLSX.readFile('/home/z/my-project/upload/Копия Журнал Ремонта (1).xlsx')
  
  // ========== Process Vehicles ==========
  console.log('Processing vehicles...')
  const vehiclesSheet = workbook.Sheets['Список']
  const vehiclesData = XLSX.utils.sheet_to_json(vehiclesSheet) as any[]
  
  console.log(`Found ${vehiclesData.length} vehicle rows`)

  // Clear existing data
  console.log('Clearing existing data...')
  await db.vehicleHistory.deleteMany()
  await db.repair.deleteMany()
  await db.vehicle.deleteMany()
  await db.owner.deleteMany()
  await db.tenant.deleteMany()
  await db.vehicleType.deleteMany()

  // Collect unique values
  const ownersMap = new Map<string, string>()
  const tenantsMap = new Map<string, string>()
  const vehicleTypesMap = new Map<string, string>()
  
  interface VehicleRow {
    brand: string
    regNumber: string
    owner: string
    tenant: string | null
    hasGlonass: boolean
    vehicleType: string
    vin: string | null
    mileage: string | null
    techInspection: string | null
  }
  
  const vehicles: VehicleRow[] = []

  for (const row of vehiclesData) {
    const brand = String(row['Марка'] || '').trim()
    const regNumber = normalizeRegNumber(String(row['Рег. №'] || ''))
    const owner = normalizeOwnerName(String(row['Собственник'] || ''))
    const tenantRaw = String(row['Арендатор'] || '').trim()
    const tenant = tenantRaw && tenantRaw !== 'null' ? normalizeOwnerName(tenantRaw) : null
    const hasGlonass = String(row['Наличие эро глоннасс'] || '').toLowerCase() === 'да'
    const vehicleType = String(row['Тип транспорта'] || '').trim()
    const vin = String(row['VIN'] || '').trim() || null
    const mileage = String(row['Малек'] || '').trim() || null
    const techInspection = String(row['Тех.Осмотр'] || '').trim() || null

    if (!brand || !regNumber) continue

    vehicles.push({
      brand,
      regNumber,
      owner,
      tenant,
      hasGlonass,
      vehicleType,
      vin,
      mileage,
      techInspection
    })

    if (owner) ownersMap.set(owner, owner)
    if (tenant) tenantsMap.set(tenant, tenant)
    if (vehicleType) vehicleTypesMap.set(vehicleType, vehicleType)
  }

  // Create owners
  console.log(`Creating ${ownersMap.size} owners...`)
  for (const [name] of ownersMap) {
    await db.owner.create({ data: { name } })
  }

  // Create tenants
  console.log(`Creating ${tenantsMap.size} tenants...`)
  for (const [name] of tenantsMap) {
    await db.tenant.create({ data: { name } })
  }

  // Create vehicle types
  console.log(`Creating ${vehicleTypesMap.size} vehicle types...`)
  let sortOrder = 0
  for (const [name] of vehicleTypesMap) {
    await db.vehicleType.create({ data: { name, sortOrder: sortOrder++ } })
  }

  // Create vehicles
  console.log(`Creating ${vehicles.length} vehicles...`)
  let vehicleCount = 0
  for (const v of vehicles) {
    const ownerRecord = await db.owner.findUnique({ where: { name: v.owner } })
    const tenantRecord = v.tenant ? await db.tenant.findUnique({ where: { name: v.tenant } }) : null
    const typeRecord = await db.vehicleType.findUnique({ where: { name: v.vehicleType } })

    try {
      await db.vehicle.create({
        data: {
          brand: v.brand,
          regNumber: v.regNumber,
          owner: v.owner,
          tenant: v.tenant,
          hasGlonass: v.hasGlonass,
          vehicleType: v.vehicleType,
          vin: v.vin,
          mileage: v.mileage,
          techInspection: v.techInspection,
          ownerId: ownerRecord?.id,
          tenantId: tenantRecord?.id,
          vehicleTypeId: typeRecord?.id,
        }
      })
      vehicleCount++
    } catch (e: any) {
      if (!e.message.includes('Unique constraint')) {
        console.log(`  Skipped duplicate: ${v.regNumber}`)
      }
    }
  }

  // ========== Process Repairs ==========
  console.log('\nProcessing repairs...')
  const repairsSheet = workbook.Sheets['        ']
  const repairsRaw = XLSX.utils.sheet_to_json(repairsSheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' }) as any[][]

  // The structure based on analysis:
  // C1 (index 1): Time or Date
  // C2 (index 2): Brand
  // C3 (index 3): Reg number  
  // C4 (index 4): Malfunction
  // C5 (index 5): Line status
  // C6 (index 6): Mileage
  // C7 (index 7): Mechanic

  interface RepairEntry {
    date: Date
    regNumber: string
    brand: string
    malfunction: string
    mileage: string | null
    master: string | null
  }

  const repairs: RepairEntry[] = []
  let currentDate = new Date(2023, 0, 1) // Default date
  let lastRepair: RepairEntry | null = null

  // Start from row 3 (after header)
  for (let i = 3; i < repairsRaw.length; i++) {
    const row = repairsRaw[i]
    if (!row || row.length < 3) continue

    const col1 = row[1] ? String(row[1]).trim() : ''
    const col2 = row[2] ? String(row[2]).trim() : ''
    const col3 = row[3] ? String(row[3]).trim() : ''
    const col4 = row[4] ? String(row[4]).trim() : ''
    const col5 = row[5] ? String(row[5]).trim() : ''
    const col6 = row[6] ? String(row[6]).trim() : ''
    const col7 = row[7] ? String(row[7]).trim() : ''

    // Check if col1 is a date (YYYY-MM-DD format or similar)
    const dateMatch = col1.match(/^(\d{4})-(\d{2})-(\d{2})/)
    
    if (dateMatch) {
      // This row contains a date - update current date
      currentDate = new Date(parseInt(dateMatch[1]), parseInt(dateMatch[2]) - 1, parseInt(dateMatch[3]))
      
      // Save previous repair if exists
      if (lastRepair && lastRepair.regNumber) {
        repairs.push(lastRepair)
      }
      
      // Start a new repair from this row
      lastRepair = {
        date: currentDate,
        regNumber: normalizeRegNumber(col3),
        brand: col2,
        malfunction: col4,
        mileage: col6 && col6 !== '-----' && col6 !== '----------' ? col6 : null,
        master: col7 || null
      }
    } else if (col1.match(/^\d{1,2}[:-]\d{2}$/)) {
      // This is a time row - complete repair entry
      if (lastRepair && lastRepair.regNumber) {
        repairs.push(lastRepair)
      }
      
      lastRepair = {
        date: currentDate,
        regNumber: normalizeRegNumber(col3),
        brand: col2,
        malfunction: col4,
        mileage: col6 && col6 !== '-----' && col6 !== '----------' ? col6 : null,
        master: col7 || null
      }
    } else if (!col1 && !col2 && !col3 && col4 && lastRepair) {
      // This is a continuation row - append to malfunction
      lastRepair.malfunction += ' ' + col4
    }
  }

  // Save last repair
  if (lastRepair && lastRepair.regNumber) {
    repairs.push(lastRepair)
  }

  console.log(`Found ${repairs.length} repairs`)

  // Create repairs
  let repairCount = 0
  let skippedCount = 0
  
  for (const r of repairs) {
    if (!r.regNumber || !r.malfunction) continue

    // Find vehicle by reg number
    let vehicle = await db.vehicle.findFirst({
      where: { regNumber: r.regNumber }
    })

    // If not found, try partial match
    if (!vehicle) {
      vehicle = await db.vehicle.findFirst({
        where: {
          regNumber: { contains: r.regNumber.substring(0, 6) }
        }
      })
    }

    if (!vehicle) {
      skippedCount++
      continue
    }

    try {
      await db.repair.create({
        data: {
          entryDate: r.date,
          vehicleId: vehicle.id,
          regNumber: vehicle.regNumber,
          malfunction: r.malfunction || '-',
          mileage: r.mileage,
          masterName: r.master,
          status: 'Не выполнено',
          priority: 'Обычный',
        }
      })
      repairCount++
    } catch (e) {
      skippedCount++
    }
  }

  console.log(`Created ${repairCount} repairs`)
  console.log(`Skipped ${skippedCount} repairs (no matching vehicle)`)

  // Summary
  console.log('\n=== Import Summary ===')
  console.log(`Vehicles: ${vehicleCount}`)
  console.log(`Owners: ${ownersMap.size}`)
  console.log(`Tenants: ${tenantsMap.size}`)
  console.log(`Vehicle Types: ${vehicleTypesMap.size}`)
  console.log(`Repairs: ${repairCount}`)

  await db.$disconnect()
  console.log('\nImport completed!')
}

main().catch((e) => {
  console.error('Import error:', e)
  process.exit(1)
})
