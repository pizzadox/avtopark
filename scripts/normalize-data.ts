import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// Normalization rules
const OWNER_NORMALIZATION: Record<string, string> = {
  'ЗАО"НСАХ"': 'ЗАО "НСАХ"',
  'ООО"САХ"': 'ЗАО "НСАХ"', // Same company, different legal form
  'ООО "ЭКО СЕРВИС"': 'ООО "ЭКОСЕРВИС"',
  'Уткин Ю.А': 'Уткин Ю.А.',
  'ООО"МСК Рециклинг"': 'ООО "МСК Рециклинг"',
}

const TENANT_NORMALIZATION: Record<string, string> = {
  'ООО"МСК Рециклинг"': 'ООО "МСК Рециклинг"',
  'ООО"САХ"': 'ЗАО "НСАХ"', // Same company
}

const VEHICLE_TYPE_NORMALIZATION: Record<string, string> = {
  'фронтальный погрузчик': 'Фронтальный погрузчик',
  'Экскаватор гусеничный S': 'Экскаватор гусеничный',
}

async function normalizeData() {
  console.log('=== Starting Data Normalization ===\n')

  // Step 1: Get all unique values
  const vehicles = await db.vehicle.findMany({
    select: { id: true, owner: true, tenant: true, vehicleType: true }
  })

  // Step 2: Normalize and collect unique values
  const ownerCounts = new Map<string, number>()
  const tenantCounts = new Map<string, number>()
  const vehicleTypeCounts = new Map<string, number>()

  for (const v of vehicles) {
    // Normalize owner
    let normalizedOwner = v.owner
    for (const [key, value] of Object.entries(OWNER_NORMALIZATION)) {
      if (v.owner === key) {
        normalizedOwner = value
        break
      }
    }
    ownerCounts.set(normalizedOwner, (ownerCounts.get(normalizedOwner) || 0) + 1)

    // Normalize tenant
    if (v.tenant && v.tenant !== 'null') {
      let normalizedTenant = v.tenant
      for (const [key, value] of Object.entries(TENANT_NORMALIZATION)) {
        if (v.tenant === key) {
          normalizedTenant = value
          break
        }
      }
      tenantCounts.set(normalizedTenant, (tenantCounts.get(normalizedTenant) || 0) + 1)
    }

    // Normalize vehicle type
    let normalizedType = v.vehicleType
    for (const [key, value] of Object.entries(VEHICLE_TYPE_NORMALIZATION)) {
      if (v.vehicleType === key) {
        normalizedType = value
        break
      }
    }
    vehicleTypeCounts.set(normalizedType, (vehicleTypeCounts.get(normalizedType) || 0) + 1)
  }

  console.log('=== Normalized Owners ===')
  const sortedOwners = [...ownerCounts.entries()].sort((a, b) => b[1] - a[1])
  sortedOwners.forEach(([name, count]) => console.log(`  ${name}: ${count}`))

  console.log('\n=== Normalized Tenants ===')
  const sortedTenants = [...tenantCounts.entries()].sort((a, b) => b[1] - a[1])
  sortedTenants.forEach(([name, count]) => console.log(`  ${name}: ${count}`))

  console.log('\n=== Normalized Vehicle Types ===')
  const sortedTypes = [...vehicleTypeCounts.entries()].sort((a, b) => b[1] - a[1])
  sortedTypes.forEach(([name, count]) => console.log(`  ${name}: ${count}`))

  // Step 3: Create Owner records
  console.log('\n=== Creating Owner Records ===')
  for (const [name, _count] of sortedOwners) {
    const existing = await db.owner.findUnique({ where: { name } })
    if (!existing) {
      const owner = await db.owner.create({
        data: { name }
      })
      console.log(`  Created: ${name} (${owner.id})`)
    } else {
      console.log(`  Exists: ${name} (${existing.id})`)
    }
  }

  // Step 4: Create Tenant records
  console.log('\n=== Creating Tenant Records ===')
  for (const [name, _count] of sortedTenants) {
    const existing = await db.tenant.findUnique({ where: { name } })
    if (!existing) {
      const tenant = await db.tenant.create({
        data: { name }
      })
      console.log(`  Created: ${name} (${tenant.id})`)
    } else {
      console.log(`  Exists: ${name} (${existing.id})`)
    }
  }

  // Step 5: Create VehicleType records
  console.log('\n=== Creating VehicleType Records ===')
  let sortOrder = 0
  for (const [name, _count] of sortedTypes) {
    const existing = await db.vehicleType.findUnique({ where: { name } })
    if (!existing) {
      const vt = await db.vehicleType.create({
        data: { name, sortOrder: sortOrder++ }
      })
      console.log(`  Created: ${name} (${vt.id})`)
    } else {
      console.log(`  Exists: ${name} (${existing.id})`)
    }
  }

  // Step 6: Update Vehicle records with normalized values and links
  console.log('\n=== Updating Vehicle Records ===')
  let updatedCount = 0

  for (const v of vehicles) {
    // Normalize owner
    let normalizedOwner = v.owner
    for (const [key, value] of Object.entries(OWNER_NORMALIZATION)) {
      if (v.owner === key) {
        normalizedOwner = value
        break
      }
    }

    // Normalize tenant
    let normalizedTenant = v.tenant
    if (v.tenant && v.tenant !== 'null') {
      for (const [key, value] of Object.entries(TENANT_NORMALIZATION)) {
        if (v.tenant === key) {
          normalizedTenant = value
          break
        }
      }
    } else {
      normalizedTenant = null
    }

    // Normalize vehicle type
    let normalizedType = v.vehicleType
    for (const [key, value] of Object.entries(VEHICLE_TYPE_NORMALIZATION)) {
      if (v.vehicleType === key) {
        normalizedType = value
        break
      }
    }

    // Get IDs
    const ownerRecord = await db.owner.findUnique({ where: { name: normalizedOwner } })
    const tenantRecord = normalizedTenant ? await db.tenant.findUnique({ where: { name: normalizedTenant } }) : null
    const typeRecord = await db.vehicleType.findUnique({ where: { name: normalizedType } })

    // Update if needed
    if (v.owner !== normalizedOwner || v.tenant !== normalizedTenant || v.vehicleType !== normalizedType ||
        (ownerRecord && v.owner !== normalizedOwner)) {
      await db.vehicle.update({
        where: { id: v.id },
        data: {
          owner: normalizedOwner,
          tenant: normalizedTenant,
          vehicleType: normalizedType,
          ownerId: ownerRecord?.id,
          tenantId: tenantRecord?.id,
          vehicleTypeId: typeRecord?.id,
        }
      })
      updatedCount++
    }
  }

  console.log(`  Updated ${updatedCount} vehicles`)

  // Step 7: Verify
  console.log('\n=== Verification ===')
  const ownerCount = await db.owner.count()
  const tenantCount = await db.tenant.count()
  const vehicleTypeCount = await db.vehicleType.count()

  console.log(`  Owners: ${ownerCount}`)
  console.log(`  Tenants: ${tenantCount}`)
  console.log(`  Vehicle Types: ${vehicleTypeCount}`)

  // Check for vehicles without links
  const vehiclesWithoutOwner = await db.vehicle.count({ where: { ownerId: null } })
  const vehiclesWithoutType = await db.vehicle.count({ where: { vehicleTypeId: null } })
  console.log(`  Vehicles without owner link: ${vehiclesWithoutOwner}`)
  console.log(`  Vehicles without type link: ${vehiclesWithoutType}`)

  console.log('\n=== Normalization Complete ===')
}

normalizeData()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
