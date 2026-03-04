import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface VehicleData {
  brand: string;
  regNumber: string;
  owner: string;
  tenant: string | null;
  hasGlonass: boolean;
  vehicleType: string;
  vin: string | null;
  mileage: string | null;
  techInspection: string | null;
}

interface RepairData {
  entryDate: string;
  exitDate: string | null;
  regNumber: string;
  vehicleInfo: string;
  malfunction: string;
  status: string;
}

interface SeedData {
  vehicles: VehicleData[];
  repairs: RepairData[];
}

function parseDate(dateStr: string): Date {
  const parts = dateStr.split('.');
  return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
}

async function main() {
  console.log('Starting seed...');
  
  const dataPath = path.join(__dirname, 'seed_data.json');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const data: SeedData = JSON.parse(rawData);
  
  console.log(`Loading ${data.vehicles.length} vehicles and ${data.repairs.length} repairs...`);
  
  // Seed vehicles
  let vehicleCount = 0;
  for (const v of data.vehicles) {
    try {
      await prisma.vehicle.create({
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
        }
      });
      vehicleCount++;
    } catch (e: any) {
      // Skip duplicates
      if (!e.message?.includes('Unique constraint')) {
        console.log(`Error creating vehicle ${v.regNumber}:`, e.message);
      }
    }
  }
  console.log(`Created ${vehicleCount} vehicles`);
  
  // Seed repairs
  let repairCount = 0;
  for (const r of data.repairs) {
    try {
      // Find vehicle by reg number (partial match)
      const vehicle = await prisma.vehicle.findFirst({
        where: {
          regNumber: { contains: r.regNumber.substring(0, 5) }
        }
      });
      
      if (!vehicle) {
        console.log(`Vehicle not found for repair: ${r.regNumber}`);
        continue;
      }
      
      await prisma.repair.create({
        data: {
          entryDate: parseDate(r.entryDate),
          exitDate: r.exitDate ? parseDate(r.exitDate) : null,
          vehicleId: vehicle.id,
          regNumber: r.regNumber,
          vehicleInfo: r.vehicleInfo,
          malfunction: r.malfunction,
          status: r.status,
        }
      });
      repairCount++;
    } catch (e: any) {
      console.log(`Error creating repair:`, e.message);
    }
  }
  console.log(`Created ${repairCount} repairs`);
  
  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
