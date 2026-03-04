import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper to check if vehicleHistory model exists
const hasVehicleHistory = () => typeof (db as any).vehicleHistory !== 'undefined';

// GET - List vehicles with filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const owner = searchParams.get('owner') || '';
    const id = searchParams.get('id') || '';
    
    // If ID is provided, return single vehicle with history
    if (id) {
      const vehicle = await db.vehicle.findUnique({
        where: { id },
        include: {
          _count: {
            select: { repairs: true }
          }
        }
      });
      
      if (!vehicle) {
        return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
      }
      
      return NextResponse.json(vehicle);
    }
    
    const where: any = {};
    
    if (search) {
      where.OR = [
        { brand: { contains: search } },
        { regNumber: { contains: search } },
        { owner: { contains: search } },
        { vin: { contains: search } },
      ];
    }
    
    if (type) {
      where.vehicleType = type;
    }
    
    if (owner) {
      where.owner = { contains: owner };
    }
    
    const vehicles = await db.vehicle.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { repairs: true }
        }
      }
    });
    
    return NextResponse.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 });
  }
}

// POST - Create new vehicle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const vehicle = await db.vehicle.create({
      data: {
        brand: body.brand,
        regNumber: body.regNumber,
        owner: body.owner,
        tenant: body.tenant || null,
        hasGlonass: body.hasGlonass || false,
        vehicleType: body.vehicleType,
        vin: body.vin || null,
        mileage: body.mileage || null,
        techInspection: body.techInspection || null,
        ptsImage: body.ptsImage || null,
      }
    });
    
    // Create history entry if model exists
    if (hasVehicleHistory()) {
      try {
        await (db as any).vehicleHistory.create({
          data: {
            vehicleId: vehicle.id,
            action: 'created',
            description: 'Транспортное средство добавлено в реестр',
          }
        });
      } catch (e) {
        console.log('History creation skipped:', e);
      }
    }
    
    return NextResponse.json(vehicle, { status: 201 });
  } catch (error: any) {
    console.error('Error creating vehicle:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Vehicle with this registration number already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create vehicle' }, { status: 500 });
  }
}

// PUT - Update vehicle
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Vehicle ID is required' }, { status: 400 });
    }
    
    // Get current vehicle data
    const currentVehicle = await db.vehicle.findUnique({
      where: { id }
    });
    
    if (!currentVehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }
    
    // Track changes
    const changes: { field: string; oldValue: string | null; newValue: string | null }[] = [];
    
    const fieldMappings: Record<string, string> = {
      brand: 'Марка',
      regNumber: 'Рег. номер',
      owner: 'Собственник',
      tenant: 'Арендатор',
      hasGlonass: 'ЭРА-ГЛОНАСС',
      vehicleType: 'Тип транспорта',
      vin: 'VIN',
      mileage: 'Пробег',
      techInspection: 'Тех. осмотр',
      ptsImage: 'Фото ПТС',
    };
    
    for (const [key, value] of Object.entries(updateData)) {
      if (key in fieldMappings) {
        const oldValue = currentVehicle[key as keyof typeof currentVehicle];
        const newValue = value;
        
        // Convert to string for comparison
        const oldStr = oldValue?.toString() || null;
        const newStr = newValue?.toString() || null;
        
        if (oldStr !== newStr) {
          changes.push({
            field: fieldMappings[key],
            oldValue: oldStr,
            newValue: newStr,
          });
        }
      }
    }
    
    // Update vehicle
    const updatedVehicle = await db.vehicle.update({
      where: { id },
      data: updateData,
    });
    
    // Create history entries for each change if model exists
    if (hasVehicleHistory()) {
      for (const change of changes) {
        try {
          await (db as any).vehicleHistory.create({
            data: {
              vehicleId: id,
              action: 'updated',
              field: change.field,
              oldValue: change.oldValue,
              newValue: change.newValue,
              description: `Изменено поле "${change.field}": ${change.oldValue || 'пусто'} → ${change.newValue || 'пусто'}`,
            }
          });
        } catch (e) {
          console.log('History creation skipped:', e);
        }
      }
    }
    
    return NextResponse.json(updatedVehicle);
  } catch (error: any) {
    console.error('Error updating vehicle:', error);
    return NextResponse.json({ error: 'Failed to update vehicle' }, { status: 500 });
  }
}

// DELETE - Delete vehicle
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Vehicle ID is required' }, { status: 400 });
    }
    
    // Delete history first if model exists
    if (hasVehicleHistory()) {
      try {
        await (db as any).vehicleHistory.deleteMany({
          where: { vehicleId: id }
        });
      } catch (e) {
        console.log('History deletion skipped:', e);
      }
    }
    
    // Delete repairs
    await db.repair.deleteMany({
      where: { vehicleId: id }
    });
    
    // Delete vehicle
    await db.vehicle.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return NextResponse.json({ error: 'Failed to delete vehicle' }, { status: 500 });
  }
}
