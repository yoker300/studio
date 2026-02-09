import { NextResponse } from 'next/server';
import { processItem } from '@/ai/flows/ai-process-item';
import type { ProcessItemInput } from '@/lib/types';

export const maxDuration = 60; // Increase the timeout

export async function POST(request: Request) {
  try {
    const body: ProcessItemInput = await request.json();

    if (!body.name || !body.qty) {
      return NextResponse.json({ error: 'Missing item name or quantity' }, { status: 400 });
    }

    const processedItem = await processItem(body);
    return NextResponse.json(processedItem);

  } catch (error) {
    console.error('Error in /api/process-item:', error);
    let errorMessage = 'An unknown error occurred';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: 'Failed to process item', details: errorMessage }, { status: 500 });
  }
}
