# Fixes Needed to Make Wishlist App Functional

## 1. Complete Database Migration
The database migration is waiting for your input. Run:
```bash
npm run db:push
```
When prompted about the `bio` column, select: **"+ bio create column"**

## 2. Key Fixes Applied
- ✅ Fixed import issue: `getDefaultWishlist` now imported from correct file
- ✅ Added user creation in NextAuth callbacks
- ✅ Created `src/lib/user.ts` for user management
- ✅ Updated auth to create users in database on sign-in

## 3. Testing Checklist

### Authentication
- [ ] Sign in with Google
- [ ] Verify user is created in database
- [ ] Check that session.user.id exists

### Wishlist Creation
- [ ] Navigate to /wishlist
- [ ] Verify default wishlist is created automatically
- [ ] Create a new wishlist
- [ ] Switch between wishlists

### Adding Items
- [ ] Add item via URL (test with a product URL)
- [ ] Verify scraping works (image, title, price)
- [ ] Check item appears in wishlist

### Friends & Social
- [ ] Navigate to /wishlist/friends
- [ ] Send friend request
- [ ] Accept friend request
- [ ] Browse public wishlists at /wishlist/browse
- [ ] View friend's wishlist at /wishlist/user/[username]

### Claim/Purchase
- [ ] Claim an item on someone's wishlist
- [ ] Mark item as purchased
- [ ] Verify status badges appear

## 4. Common Issues & Solutions

### Issue: "User not found" errors
**Solution**: Make sure you've completed the database migration (step 1)

### Issue: Items not appearing
**Solution**: 
- Check browser console for errors
- Verify wishlistId is being passed correctly
- Check API routes are returning data

### Issue: Scraping not working
**Solution**:
- Check if the URL is accessible
- Some sites block scraping - try different URLs
- Check server logs for scraping errors

### Issue: Friends not showing
**Solution**:
- Make sure both users are signed in
- Check that friend requests are accepted
- Verify database has friendship records

## 5. Next Steps After Migration
1. Restart the dev server: `npm run dev`
2. Sign in with Google
3. Try adding an item to your wishlist
4. Test the full flow

