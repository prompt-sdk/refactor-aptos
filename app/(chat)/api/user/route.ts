import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUser } from '@/db/queries';

export async function POST(request: NextRequest) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
        return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
        }

        await createUser(username, password);
        return NextResponse.json({ message: 'User created successfully' }, { status: 201 });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const username = request.nextUrl.searchParams.get('username');

        if (!username) {
        return NextResponse.json({ error: 'Username is required' }, { status: 400 });
        }

        const users = await getUser(username);

        if (users.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Return user data without the password
        const { password, ...userData } = users[0];
        return NextResponse.json(userData);
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }
}

