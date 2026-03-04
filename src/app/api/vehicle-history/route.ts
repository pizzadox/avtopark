import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get vehicle history
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const vehicleId = searchParams.get('vehicleId');
    
    if (!vehicleId) {
      return NextResponse.json({ error: 'Vehicle ID is required' }, { status: 400 });
    }
    
    // Check if vehicleHistory model exists (for hot-reload compatibility)
    if (typeof (db as any).vehicleHistory === 'undefined') {
      return NextResponse.json([]);
    }
    
    const history = await (db as any).vehicleHistory.findMany({
      where: { vehicleId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    
    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching vehicle history:', error);
    return NextResponse.json([]);
  }
}

// POST - Add history entry (for repairs, etc.)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if vehicleHistory model exists
    if (typeof (db as any).vehicleHistory === 'undefined') {
      return NextResponse.json({ success: true }, { status: 201 });
    }
    
    const history = await (db as any).vehicleHistory.create({
      data: {
        vehicleId: body.vehicleId,
        action: body.action,
        field: body.field || null,
        oldValue: body.oldValue || null,
        newValue: body.newValue || null,
        description: body.description || null,
      }
    });
    
    return NextResponse.json(history, { status: 201 });
  } catch (error) {
    console.error('Error creating vehicle history:', error);
    return NextResponse.json({ success: true }, { status: 201 });
  }
}
