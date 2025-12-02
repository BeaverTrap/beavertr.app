# Feature Roadmap - Wishlist App

## ✅ Completed Features
- ✅ Search functionality (search by title, description, notes, size)
- ✅ Filter by status (all, available, claimed, purchased)
- ✅ Sort by (date, price, priority, name)
- ✅ Size auto-detection from scraped data
- ✅ Holiday icons
- ✅ Multiple wishlists
- ✅ Friends system
- ✅ Claim/purchase system
- ✅ Purchase proof verification
- ✅ Affiliate links
- ✅ Share links

## 🚧 In Progress
- [ ] Categories/tags system
- [ ] Price tracking
- [ ] Export functionality

## 📋 Planned Features

### High Priority (Next)
1. **Categories/Tags System**
   - Add category field to items
   - Filter by category
   - Category icons/colors

2. **Price Tracking**
   - Store price history
   - Price drop detection
   - Price alerts

3. **Export Functionality**
   - Export to CSV
   - Export to PDF
   - Print-friendly view

4. **Email Notifications**
   - Item claimed notifications
   - Purchase confirmations
   - Price drop alerts
   - Friend request notifications

### Medium Priority
5. **Comments/Reactions**
   - Comments on items
   - Like/reaction system
   - Activity feed

6. **Duplicate Detection**
   - Detect same item in multiple lists
   - Merge duplicates option

7. **Bulk Operations**
   - Select multiple items
   - Bulk delete
   - Bulk move between lists
   - Bulk edit (priority, category)

8. **Wishlist Templates**
   - Birthday template
   - Wedding template
   - Holiday templates
   - Custom templates

9. **Custom Item Creation**
   - Add items without URL
   - Upload custom images
   - Manual price entry

10. **Analytics Dashboard**
    - Total wishlist value
    - Most wanted items
    - Purchase statistics
    - Category breakdown

### Lower Priority
11. **Dark/Light Theme Toggle**
12. **Drag-and-Drop Reordering**
13. **Keyboard Shortcuts**
14. **Mobile PWA**
15. **Accessibility Improvements**
16. **Recurring Wishlists**
17. **Gift Suggestions**
18. **Budget Tracking**
19. **Purchase History Archive**
20. **Item Recommendations**

## Implementation Notes

### Database Schema Updates Needed
- `wishlistItems`: Add `category` field
- `wishlistItems`: Add `priceHistory` JSON field
- `wishlistItems`: Add `tags` JSON field
- New table: `priceAlerts`
- New table: `comments`
- New table: `reactions`
- New table: `notifications`

### API Endpoints Needed
- `/api/wishlist/items/search` - Advanced search
- `/api/wishlist/items/export` - Export functionality
- `/api/wishlist/items/bulk` - Bulk operations
- `/api/notifications` - Notification system
- `/api/comments` - Comments system
- `/api/price-tracking` - Price tracking

### Third-Party Services Needed
- Email service (SendGrid, Resend, etc.)
- PDF generation library
- Price tracking service (optional)




