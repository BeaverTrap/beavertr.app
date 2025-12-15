import { db } from './db';
import { friendships, users } from './schema';
import { eq, and, or, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function sendFriendRequest(
  userId: string,
  friendId: string,
  relationshipType: 'friend' | 'family' | 'streamer' | 'fan' = 'friend'
) {
  // Check if relationship already exists
  const [existing] = await db
    .select()
    .from(friendships)
    .where(
      and(
        or(eq(friendships.userId, userId), eq(friendships.friendId, userId)),
        or(eq(friendships.userId, friendId), eq(friendships.friendId, friendId))
      )
    )
    .limit(1);
  
  if (existing) {
    return existing;
  }
  
  const id = randomUUID();
  const now = new Date();
  
  await db.insert(friendships).values({
    id,
    userId,
    friendId,
    relationshipType,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  });
  
  const [friendship] = await db
    .select()
    .from(friendships)
    .where(eq(friendships.id, id))
    .limit(1);
  
  return friendship;
}

export async function acceptFriendRequest(friendshipId: string) {
  const now = new Date();
  
  await db
    .update(friendships)
    .set({
      status: 'accepted',
      updatedAt: now,
    })
    .where(eq(friendships.id, friendshipId));
}

export async function getFriends(userId: string) {
  const friendShips = await db
    .select()
    .from(friendships)
    .where(and(
      eq(friendships.userId, userId),
      eq(friendships.status, 'accepted')
    ));
  
  const friendIds = friendShips.map(f => f.friendId);
  if (friendIds.length === 0) return [];
  
  const friendUsers = await db
    .select()
    .from(users)
    .where(inArray(users.id, friendIds));
  
  return friendShips.map(fs => {
    const user = friendUsers.find(u => u.id === fs.friendId);
    return {
      friendship: fs,
      user: user || { id: fs.friendId, name: null, email: null, image: null, username: null },
    };
  });
}

export async function getPendingRequests(userId: string) {
  const pending = await db
    .select()
    .from(friendships)
    .where(and(
      eq(friendships.friendId, userId),
      eq(friendships.status, 'pending')
    ));
  
  if (pending.length === 0) return [];
  
  // Fetch users for pending requests
  const userIds = [...new Set(pending.map(p => p.userId))];
  const requestUsers = await db
    .select()
    .from(users)
    .where(inArray(users.id, userIds));
  
  return pending.map(p => {
    const user = requestUsers.find(u => u.id === p.userId);
    return {
      friendship: p,
      user: user || { id: p.userId, name: null, email: null, image: null, username: null },
    };
  });
}

