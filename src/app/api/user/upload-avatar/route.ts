import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(request: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split(".").pop() || "jpg";
    const filename = `avatars/${session.user.id}-${timestamp}-${randomStr}.${fileExtension}`;

    // Upload to Vercel Blob Storage
    // The token is automatically available in Vercel deployments
    // For local dev, you may need to set BLOB_READ_WRITE_TOKEN in .env.local
    const uploadOptions: any = {
      access: 'public',
      contentType: file.type,
    };
    
    // Only add token if it's available (for local dev)
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      uploadOptions.token = process.env.BLOB_READ_WRITE_TOKEN;
    }
    
    console.log('Uploading to Vercel Blob Storage:', {
      filename,
      size: file.size,
      type: file.type,
      hasToken: !!uploadOptions.token,
    });
    
    const blob = await put(filename, file, uploadOptions);
    
    console.log('Upload successful:', blob.url);

    // Update user's image in database
    await db
      .update(users)
      .set({
        image: blob.url,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ imageUrl: blob.url });
  } catch (error: any) {
    console.error("Error uploading avatar:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload avatar" },
      { status: 500 }
    );
  }
}

