import { db } from './db';
import { users } from './schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function getOrCreateUser(email: string, name?: string, image?: string) {
  // Try to find existing user
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    // Update user info if provided
    if (name || image) {
      await db
        .update(users)
        .set({
          name: name || existingUser.name,
          image: image || existingUser.image,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id));
      
      const [updated] = await db
        .select()
        .from(users)
        .where(eq(users.id, existingUser.id))
        .limit(1);
      
      return updated || existingUser;
    }
    return existingUser;
  }

  // Create new user
  const id = randomUUID();
  const now = new Date();

  await db.insert(users).values({
    id,
    email,
    name: name || null,
    image: image || null,
    createdAt: now,
    updatedAt: now,
  });

  const [newUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return newUser;
}

export async function getUserById(userId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user || null;
}

