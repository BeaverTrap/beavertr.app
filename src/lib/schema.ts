import { sqliteTable, text, integer, unique } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: integer('emailVerified', { mode: 'timestamp' }),
  image: text('image'),
  username: text('username').unique(), // For public profile URLs
  bio: text('bio'),
  amazonAffiliateTag: text('amazonAffiliateTag'), // Amazon affiliate tag (e.g., "beavertr-20")
  shippingAddress: text('shippingAddress'), // Shipping address for wishlist items
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refreshToken: text('refreshToken'),
  accessToken: text('accessToken'),
  expiresAt: integer('expiresAt'),
  tokenType: text('tokenType'),
  scope: text('scope'),
  idToken: text('idToken'),
  sessionState: text('sessionState'),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  sessionToken: text('sessionToken').notNull().unique(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: integer('expires', { mode: 'timestamp' }).notNull(),
});

export const verificationTokens = sqliteTable('verificationTokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull().unique(),
  expires: integer('expires', { mode: 'timestamp' }).notNull(),
});

export const wishlists = sqliteTable('wishlists', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  privacy: text('privacy').default('public'), // 'public', 'private', 'personal'
  shareLink: text('shareLink').unique(), // Unique shareable link (e.g., "RedGoatPie")
  icon: text('icon'), // React icon name (e.g., "FaGift")
  color: text('color'), // Hex color code (e.g., "#3B82F6")
  isDefault: integer('isDefault', { mode: 'boolean' }).default(false),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const wishlistItems = sqliteTable('wishlistItems', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  url: text('url').notNull(),
  affiliateUrl: text('affiliateUrl'), // Affiliate link (e.g., Amazon affiliate)
  image: text('image'),
  price: text('price'),
  description: text('description'),
  priority: integer('priority').default(0), // 0 = normal, 1 = high, -1 = low
  notes: text('notes'),
  size: text('size'), // Size (e.g., "Large", "XL", "10")
  quantity: integer('quantity'), // Quantity desired
  claimedBy: text('claimedBy'), // userId who claimed it
  purchasedBy: text('purchasedBy'), // userId who purchased it
  claimStatus: text('claimStatus').default('none'), // 'none', 'pending', 'confirmed', 'rejected', 'purchased'
  isClaimed: integer('isClaimed', { mode: 'boolean' }).default(false),
  isPurchased: integer('isPurchased', { mode: 'boolean' }).default(false),
  purchaseProof: text('purchaseProof'), // URL to uploaded receipt/proof image
  purchaseDate: integer('purchaseDate', { mode: 'timestamp' }), // When was it purchased
  trackingNumber: text('trackingNumber'), // Shipping tracking number
  purchaseNotes: text('purchaseNotes'), // Notes from claimer about the purchase
  purchaseAmount: text('purchaseAmount'), // Actual price paid (may differ from listed price)
  proofVerified: integer('proofVerified', { mode: 'boolean' }).default(false), // Owner has verified the receipt
  proofRejected: integer('proofRejected', { mode: 'boolean' }).default(false), // Owner has rejected the proof
  proofVerifiedAt: integer('proofVerifiedAt', { mode: 'timestamp' }), // When proof was verified
  proofVerifiedBy: text('proofVerifiedBy'), // userId who verified the proof (owner or moderator)
  isAnonymous: integer('isAnonymous', { mode: 'boolean' }).default(false), // Purchase is anonymous (don't show buyer name)
  wishlistId: text('wishlistId').notNull().references(() => wishlists.id, { onDelete: 'cascade' }),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const friendships = sqliteTable('friendships', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  friendId: text('friendId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  relationshipType: text('relationshipType').default('friend'), // 'friend', 'family', 'streamer', 'fan', 'moderator'
  status: text('status').default('pending'), // 'pending', 'accepted', 'blocked'
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  uniqueUserFriend: unique().on(table.userId, table.friendId),
}));

