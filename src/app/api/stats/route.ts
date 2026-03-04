import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get statistics for dashboard
export async function GET() {
  try {
    // Total vehicles
    const totalVehicles = await db.vehicle.count();
    
    // Vehicles by type
    const vehiclesByType = await db.vehicle.groupBy({
      by: ['vehicleType'],
      _count: true
    });
    
    // Total repairs
    const totalRepairs = await db.repair.count();
    
    // Repairs by status
    const repairsByStatus = await db.repair.groupBy({
      by: ['status'],
      _count: true
    });
    
    // Pending repairs count
    const pendingRepairs = await db.repair.count({
      where: { status: 'Не выполнено' }
    });
    
    // Completed repairs count
    const completedRepairs = await db.repair.count({
      where: { status: 'Выполнено' }
    });
    
    // Recent repairs (last 5)
    const recentRepairs = await db.repair.findMany({
      take: 5,
      orderBy: { entryDate: 'desc' },
      include: {
        vehicle: {
          select: {
            brand: true,
            vehicleType: true,
          }
        }
      }
    });
    
    // Vehicles with GLONASS
    const vehiclesWithGlonass = await db.vehicle.count({
      where: { hasGlonass: true }
    });
    
    // Unique owners
    const owners = await db.vehicle.findMany({
      select: { owner: true },
      distinct: ['owner']
    });
    
    // Repairs by month (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const repairs = await db.repair.findMany({
      where: {
        entryDate: {
          gte: twelveMonthsAgo
        }
      },
      select: {
        entryDate: true,
        status: true,
      }
    });
    
    // Group repairs by month
    const repairsByMonth: { month: string; total: number; completed: number; pending: number }[] = [];
    const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth();
      const year = date.getFullYear();
      
      const monthRepairs = repairs.filter(r => {
        const repairDate = new Date(r.entryDate);
        return repairDate.getMonth() === month && repairDate.getFullYear() === year;
      });
      
      repairsByMonth.push({
        month: `${monthNames[month]} ${year.toString().slice(2)}`,
        total: monthRepairs.length,
        completed: monthRepairs.filter(r => r.status === 'Выполнено').length,
        pending: monthRepairs.filter(r => r.status === 'Не выполнено').length,
      });
    }
    
    // Repairs by vehicle type
    const repairsWithVehicle = await db.repair.findMany({
      include: {
        vehicle: {
          select: { vehicleType: true }
        }
      }
    });
    
    const repairsByVehicleType: Record<string, number> = {};
    repairsWithVehicle.forEach(r => {
      const type = r.vehicle?.vehicleType || 'Неизвестно';
      repairsByVehicleType[type] = (repairsByVehicleType[type] || 0) + 1;
    });
    
    // Top vehicles by repair count
    const vehiclesWithRepairCount = await db.vehicle.findMany({
      include: {
        _count: {
          select: { repairs: true }
        }
      },
      orderBy: {
        repairs: {
          _count: 'desc'
        }
      },
      take: 5
    });
    
    const topVehiclesByRepairs = vehiclesWithRepairCount.map(v => ({
      regNumber: v.regNumber,
      brand: v.brand,
      count: v._count.repairs
    }));
    
    // Priority distribution
    const repairsByPriority = await db.repair.groupBy({
      by: ['priority'],
      _count: true
    });
    
    return NextResponse.json({
      totalVehicles,
      vehiclesByType: vehiclesByType.map(v => ({ type: v.vehicleType, count: v._count })),
      totalRepairs,
      repairsByStatus: repairsByStatus.map(r => ({ status: r.status, count: r._count })),
      pendingRepairs,
      completedRepairs,
      recentRepairs,
      vehiclesWithGlonass,
      uniqueOwners: owners.length,
      repairsByMonth,
      repairsByVehicleType: Object.entries(repairsByVehicleType).map(([type, count]) => ({ type, count })),
      topVehiclesByRepairs,
      repairsByPriority: repairsByPriority.map(r => ({ priority: r.priority, count: r._count })),
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
