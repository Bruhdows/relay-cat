import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Bio from '@/models/Bio';
import { NextResponse } from 'next/server';

export async function POST(req) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const data = await req.json();

    try {
        const bio = await Bio.create({
            userId: session.user.id,
            ...data
        })

        return NextResponse.json(bio, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function GET(req) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const bio = await Bio.findOne({ userId: session.user.id });

    return NextResponse.json(bio, { status: 200 });
}