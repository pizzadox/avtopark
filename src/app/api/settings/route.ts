import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/settings - Get all settings or specific setting
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (key) {
      const setting = await db.setting.findUnique({
        where: { key }
      })
      return NextResponse.json(setting)
    }

    const settings = await db.setting.findMany()
    
    // Return as object for easier access
    const settingsObj: Record<string, string> = {}
    settings.forEach(s => {
      settingsObj[s.key] = s.value
    })
    
    return NextResponse.json(settingsObj)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Ошибка при получении настроек' }, { status: 500 })
  }
}

// POST /api/settings - Create or update setting
export async function POST(request: NextRequest) {
  try {
    const { key, value } = await request.json()

    if (!key) {
      return NextResponse.json({ error: 'Ключ обязателен' }, { status: 400 })
    }

    const setting = await db.setting.upsert({
      where: { key },
      create: { key, value },
      update: { value }
    })

    return NextResponse.json(setting)
  } catch (error) {
    console.error('Error saving setting:', error)
    return NextResponse.json({ error: 'Ошибка при сохранении настройки' }, { status: 500 })
  }
}

// PUT /api/settings - Update multiple settings
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()

    const updates = Object.entries(data).map(([key, value]) =>
      db.setting.upsert({
        where: { key },
        create: { key, value: String(value) },
        update: { value: String(value) }
      })
    )

    await Promise.all(updates)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Ошибка при обновлении настроек' }, { status: 500 })
  }
}
