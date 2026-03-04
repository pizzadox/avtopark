import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper to check if vehicleHistory model exists
const hasVehicleHistory = () => typeof (db as any).vehicleHistory !== 'undefined';

// GET - List repairs with filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const vehicleId = searchParams.get('vehicleId') || '';
    
    const where: any = {};
    
    if (search) {
      where.OR = [
        { regNumber: { contains: search } },
        { malfunction: { contains: search } },
        { vehicleInfo: { contains: search } },
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    if (vehicleId) {
      where.vehicleId = vehicleId;
    }
    
    const repairs = await db.repair.findMany({
      where,
      orderBy: { entryDate: 'desc' },
      include: {
        vehicle: {
          select: {
            brand: true,
            vehicleType: true,
            owner: true,
            tenant: true,
          }
        }
      }
    });
    
    return NextResponse.json(repairs);
  } catch (error) {
    console.error('Error fetching repairs:', error);
    return NextResponse.json({ error: 'Failed to fetch repairs' }, { status: 500 });
  }
}

// POST - Create new repair
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const repair = await db.repair.create({
      data: {
        entryDate: new Date(body.entryDate),
        exitDate: body.exitDate ? new Date(body.exitDate) : null,
        vehicleId: body.vehicleId,
        regNumber: body.regNumber,
        vehicleInfo: body.vehicleInfo || null,
        malfunction: body.malfunction,
        welding: body.welding || false,
        lathe: body.lathe || false,
        repair: body.repair || false,
        diagnostics: body.diagnostics || false,
        defectation: body.defectation || false,
        spareParts: body.spareParts || false,
        downtimeDays: body.downtimeDays || 0,
        downtimeHours: body.downtimeHours || 0,
        downtimeMinutes: body.downtimeMinutes || 0,
        priority: body.priority || 'Обычный',
        workDescription: body.workDescription || null,
        sparePartsInfo: body.sparePartsInfo || null,
        status: body.status || 'Не выполнено',
        mileage: body.mileage || null,
        notes: body.notes || null,
      },
      include: {
        vehicle: true
      }
    });
    
    // Create vehicle history entry if model exists
    if (hasVehicleHistory()) {
      try {
        await (db as any).vehicleHistory.create({
          data: {
            vehicleId: body.vehicleId,
            action: 'repair_added',
            description: `Добавлена запись о ремонте: ${body.malfunction.substring(0, 50)}${body.malfunction.length > 50 ? '...' : ''}`,
          }
        });
      } catch (e) {
        console.log('History creation skipped:', e);
      }
    }
    
    return NextResponse.json(repair, { status: 201 });
  } catch (error) {
    console.error('Error creating repair:', error);
    return NextResponse.json({ error: 'Failed to create repair' }, { status: 500 });
  }
}

// PUT - Update repair
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    
    // Get current repair data
    const currentRepair = await db.repair.findUnique({
      where: { id }
    });
    
    if (!currentRepair) {
      return NextResponse.json({ error: 'Repair not found' }, { status: 404 });
    }
    
    const repair = await db.repair.update({
      where: { id },
      data: {
        ...data,
        entryDate: data.entryDate ? new Date(data.entryDate) : undefined,
        exitDate: data.exitDate ? new Date(data.exitDate) : null,
      },
      include: {
        vehicle: true
      }
    });
    
    // Create vehicle history entry for status change if model exists
    if (hasVehicleHistory() && data.status && currentRepair.status !== data.status) {
      try {
        await (db as any).vehicleHistory.create({
          data: {
            vehicleId: currentRepair.vehicleId,
            action: data.status === 'Выполнено' ? 'repair_completed' : 'repair_status_changed',
            field: 'Статус ремонта',
            oldValue: currentRepair.status,
            newValue: data.status,
            description: `Статус ремонта изменен: ${currentRepair.status} → ${data.status}`,
          }
        });
      } catch (e) {
        console.log('History creation skipped:', e);
      }
    }
    
    return NextResponse.json(repair);
  } catch (error) {
    console.error('Error updating repair:', error);
    return NextResponse.json({ error: 'Failed to update repair' }, { status: 500 });
  }
}

// DELETE - Delete repair
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Repair ID is required' }, { status: 400 });
    }
    
    // Get repair info before deletion
    const repair = await db.repair.findUnique({
      where: { id }
    });
    
    if (repair && hasVehicleHistory()) {
      // Create history entry
      try {
        await (db as any).vehicleHistory.create({
          data: {
            vehicleId: repair.vehicleId,
            action: 'repair_deleted',
            description: `Удалена запись о ремонте: ${repair.malfunction.substring(0, 50)}${repair.malfunction.length > 50 ? '...' : ''}`,
          }
        });
      } catch (e) {
        console.log('History creation skipped:', e);
      }
    }
    
    await db.repair.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting repair:', error);
    return NextResponse.json({ error: 'Failed to delete repair' }, { status: 500 });
  }
}
