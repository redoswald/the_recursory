import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { userQueries } from "@/lib/db";
import { generateId } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    console.log('[REGISTER] Starting registration process');
    const { email, password, name } = await request.json();
    console.log('[REGISTER] Received data:', { email, name: name || 'null' });

    // Validate input
    if (!email || !password) {
      console.log('[REGISTER] Validation failed: missing email or password');
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    console.log('[REGISTER] Checking if user exists');
    const existingUser = userQueries.findByEmail.get(email);
    if (existingUser) {
      console.log('[REGISTER] User already exists');
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    console.log('[REGISTER] Hashing password');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    console.log('[REGISTER] Creating user in database');
    const userId = generateId();
    userQueries.create.run(userId, email, hashedPassword, name || null);
    console.log('[REGISTER] User created successfully with ID:', userId);

    return NextResponse.json(
      { message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER] Registration error:", error);
    console.error("[REGISTER] Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
