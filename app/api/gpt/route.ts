import { sendOpenAi } from '@/libs/gpt';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { messages, userId, max, temp } = await request.json();
        const result = await sendOpenAi(messages, userId, max, temp);
        console.log('test gpt nextjs api', result)
        return NextResponse.json({ result });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
} 