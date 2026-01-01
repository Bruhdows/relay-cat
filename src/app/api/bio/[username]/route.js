import connectDB from "@/lib/mongodb";
import Bio from "@/models/Bio";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
    await connectDB();

    const bio = await Bio.findOne({ username: params.username });

    if (!bio) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(bio, { status: 200 });
}

export async function PUT(req, { params }) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const data = await req.json();

    const bio = await Bio.findOneAndUpdate(
        { username: params.username, userId: session.user.id },
        { ...data, updatedAt: Date.now() },
        { new: true }
    );

    return NextResponse.json(bio, { status: 200 });
}