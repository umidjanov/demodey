import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const download = url.searchParams.get('download');

    if (download === 'pdf') {
      const candidates = [
        path.join(process.cwd(), 'public', 'Quizora_Taqdimot_8_Sahifalik.pdf'),
        path.join(process.cwd(), 'Quizora_Taqdimot_8_Sahifalik.pdf'),
        path.join(process.cwd(), '..', 'Quizora_Taqdimot_8_Sahifalik.pdf')
      ];
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          const buf = fs.readFileSync(p);
          return new NextResponse(buf, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': 'inline; filename="Quizora_Taqdimot_8_Sahifalik.pdf"',
            },
          });
        }
      }
      return new NextResponse('PDF File not found', { status: 404 });
    }

    if (download === 'pptx') {
      const candidates = [
        path.join(process.cwd(), 'public', 'Quizora_Canva_Presentation.pptx'),
        path.join(process.cwd(), 'Quizora_Canva_Presentation.pptx'),
        path.join(process.cwd(), '..', 'Quizora_Canva_Presentation.pptx')
      ];
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          const buf = fs.readFileSync(p);
          return new NextResponse(buf, {
            headers: {
              'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
              'Content-Disposition': 'attachment; filename="Quizora_Canva_Presentation.pptx"',
            },
          });
        }
      }
      return new NextResponse('PPTX File not found', { status: 404 });
    }

    const filePath = path.join(process.cwd(), 'public', 'presentation.html');
    if (fs.existsSync(filePath)) {
      const html = fs.readFileSync(filePath, 'utf-8');
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }
    return new NextResponse('Presentation not found', { status: 404 });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
