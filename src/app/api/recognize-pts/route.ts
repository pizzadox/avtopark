import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import ZAI from 'z-ai-web-dev-sdk';

interface PTSData {
  brand?: string;
  model?: string;
  vin?: string;
  regNumber?: string;
  vehicleType?: string;
  year?: string;
  engineNumber?: string;
  chassisNumber?: string;
  bodyNumber?: string;
  color?: string;
  owner?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl } = body;
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'No image URL provided' }, { status: 400 });
    }
    
    // Initialize VLM
    const zai = await ZAI.create();
    
    // Prepare image URL (handle both local paths and URLs)
    let fullImageUrl = imageUrl;
    if (imageUrl.startsWith('/uploads/')) {
      // Local file - read and convert to base64
      const filePath = path.join(process.cwd(), 'public', imageUrl);
      const imageBuffer = await readFile(filePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = imageUrl.endsWith('.png') ? 'image/png' : 'image/jpeg';
      fullImageUrl = `data:${mimeType};base64,${base64Image}`;
    }
    
    // Prompt for PTS recognition
    const prompt = `Это фотография ПТС (Паспорт Транспортного Средства) - документа на транспортное средство.
    
Проанализируй изображение и извлеки следующую информацию в формате JSON:
{
  "brand": "Марка автомобиля",
  "model": "Модель автомобиля", 
  "vin": "VIN номер (17 символов)",
  "regNumber": "Государственный регистрационный номер",
  "vehicleType": "Тип транспортного средства",
  "year": "Год выпуска",
  "engineNumber": "Номер двигателя",
  "chassisNumber": "Номер шасси",
  "bodyNumber": "Номер кузова",
  "color": "Цвет",
  "owner": "Собственник"
}

Если какое-то поле не видно или не читается, оставь его пустым.
Верни ТОЛЬКО JSON, без дополнительного текста.`;

    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image_url',
              image_url: {
                url: fullImageUrl
              }
            }
          ]
        }
      ],
      thinking: { type: 'disabled' }
    });

    const content = response.choices[0]?.message?.content || '';
    
    // Parse JSON from response
    let ptsData: PTSData = {};
    try {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        ptsData = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Error parsing VLM response:', parseError);
      // Return raw response if parsing fails
      return NextResponse.json({
        success: false,
        error: 'Could not parse PTS data',
        rawResponse: content
      });
    }
    
    // Combine brand and model if both exist
    const fullBrand = ptsData.brand && ptsData.model 
      ? `${ptsData.brand} ${ptsData.model}` 
      : ptsData.brand || ptsData.model || '';
    
    return NextResponse.json({
      success: true,
      data: {
        brand: fullBrand,
        vin: ptsData.vin || '',
        regNumber: ptsData.regNumber || '',
        vehicleType: ptsData.vehicleType || '',
        owner: ptsData.owner || '',
        year: ptsData.year || '',
        color: ptsData.color || '',
        engineNumber: ptsData.engineNumber || '',
        chassisNumber: ptsData.chassisNumber || '',
        bodyNumber: ptsData.bodyNumber || ''
      },
      rawResponse: content
    });
    
  } catch (error) {
    console.error('Error recognizing PTS:', error);
    return NextResponse.json({ 
      error: 'Failed to recognize PTS',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
