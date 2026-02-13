# eSIM Management Page - Migration Prompt

## Overview
Implement a "My eSIMs" page that displays user eSIM profiles with proper handling for expired and cancelled eSIMs. Expired/cancelled eSIMs should be displayed as read-only information cards without actionable buttons.

---

## Core Requirements

### 1. eSIM Status Detection Logic

Implement logic to determine if an eSIM is expired or cancelled:

```typescript
// Status detection logic
const isExpired = timeRemaining === null || timeRemaining.totalMs <= 0;
const isCancelled = esim.order?.status?.toLowerCase() === "cancelled" || 
                    esim.order?.status?.toLowerCase() === "canceled";
const isExpiredOrCancelled = isExpired || 
                             esim.esimStatus === "EXPIRED" || 
                             isCancelled;
```

**Status Checks:**
- **Time-based expiration**: Check if `timeRemaining.totalMs <= 0` (using a time remaining calculation function)
- **eSIM status**: Check if `esimStatus === "EXPIRED"`
- **Order status**: Check if order status is "cancelled" or "canceled" (case-insensitive)

### 2. Card Rendering Logic

**For Active eSIMs (NOT expired/cancelled):**
- Card should be clickable (wrapped in Link/Route component)
- Show hover effects (`hover:border-[var(--voyo-accent)]`)
- Show cursor pointer
- Navigate to detail page on click

**For Expired/Cancelled eSIMs:**
- Card should be NON-clickable (wrapped in `div` instead of Link)
- NO hover effects
- NO cursor pointer
- Display as read-only information card

**Implementation Pattern:**
```typescript
// Conditional wrapper component
const cardContent = (
  <Card className={`... ${isExpiredOrCancelled ? '' : 'hover:border-[var(--voyo-accent)] cursor-pointer'}`}>
    {/* Card content */}
  </Card>
);

return isExpiredOrCancelled ? (
  <div key={esim.id} className="block">
    {cardContent}
  </div>
) : (
  <Link key={esim.id} href={`/my-esims/${esim.iccid}`} className="block">
    {cardContent}
  </Link>
);
```

### 3. Action Buttons Visibility

**Buttons to HIDE for expired/cancelled eSIMs:**
1. **Top Up** button
2. **View QR Code** button (if `qrCodeUrl` exists)
3. **Copy Activation Code** button (if `ac` exists)

**Buttons to KEEP visible:**
- **Review** button (users can still review expired/cancelled eSIMs)

**Implementation Pattern:**
```typescript
{!isExpiredOrCancelled && (
  <>
    {esim.qrCodeUrl && (
      <Button onClick={...}>View QR Code</Button>
    )}
    <Button onClick={...}>Top Up</Button>
    {esim.ac && (
      <Button onClick={...}>Copy Activation Code</Button>
    )}
  </>
)}

{/* Review button always visible */}
<Button onClick={...}>Review</Button>
```

### 4. Expiry Countdown Component

**Requirements:**
- Component should accept `userEmail` as a prop
- When eSIM expires, automatically sync with backend
- Sync request MUST include `x-user-email` header
- Skip sync if user email is not available

**Component Interface:**
```typescript
interface ExpiryCountdownProps {
  expiry: string | Date | null | undefined;
  className?: string;
  iccid?: string;
  onExpired?: () => void;
  userEmail?: string; // REQUIRED for sync functionality
}
```

**Sync Implementation:**
```typescript
const handleSync = async () => {
  if (!iccid || isSyncing) return;
  
  // Skip sync if user email is not available (required by backend)
  if (!userEmail) {
    console.warn("Sync skipped: user email not available");
    return;
  }

  setIsSyncing(true);
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
    await safeFetch(`${apiUrl}/esim/${iccid}/sync`, {
      method: "POST",
      headers: {
        "x-user-email": userEmail, // REQUIRED HEADER
      },
      showToast: false,
    });

    if (onExpired) {
      onExpired();
    }
  } catch (error) {
    console.error("Sync error:", error);
    toast({
      variant: "destructive",
      title: "Sync Failed",
      description: "Failed to refresh eSIM status. Please refresh the page.",
    });
  } finally {
    setIsSyncing(false);
  }
};
```

**Auto-sync on Expiry:**
```typescript
useEffect(() => {
  if (time && time.totalMs <= 0 && iccid && !isSyncing && !hasNotifiedExpiry && userEmail) {
    handleSync();
  }
}, [time?.totalMs, iccid, isSyncing, hasNotifiedExpiry, userEmail]);
```

### 5. User Email Handling

**Get user email from multiple sources (priority order):**
1. Authenticated user email (from auth provider)
2. URL query parameter (`?email=...`)
3. LocalStorage (`guest_checkout_email`)

**Implementation:**
```typescript
// Get email from authenticated user, URL params, or localStorage
const urlParams = new URLSearchParams(window.location.search);
const emailParam = urlParams.get('email');
const storedEmail = localStorage.getItem('guest_checkout_email');

let userEmail: string | undefined;

if (user?.primaryEmailAddress?.emailAddress) {
  // Authenticated user - use their email
  userEmail = user.primaryEmailAddress.emailAddress;
} else if (emailParam) {
  // Guest access via URL parameter
  userEmail = emailParam;
  localStorage.setItem('guest_checkout_email', emailParam);
} else if (storedEmail) {
  // Guest access via stored email
  userEmail = storedEmail;
}

// Store in state to pass to components
setUserEmail(userEmail);
```

### 6. Time Remaining Calculation

**Required Function:**
```typescript
interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

function getTimeRemaining(expiry: string | Date | null | undefined): TimeRemaining | null {
  if (!expiry) return null;
  
  const expiryDate = typeof expiry === 'string' ? new Date(expiry) : expiry;
  const now = Date.now();
  const totalMs = expiryDate.getTime() - now;
  
  if (isNaN(totalMs)) return null;
  
  return {
    days: Math.floor(totalMs / (1000 * 60 * 60 * 24)),
    hours: Math.floor((totalMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((totalMs % (1000 * 60)) / 1000),
    totalMs,
  };
}
```

---

## UI/UX Requirements

### Visual States

**Active eSIM Card:**
- Hoverable border color change
- Cursor pointer on hover
- All action buttons visible
- Clickable to navigate to detail page

**Expired/Cancelled eSIM Card:**
- No hover effects
- No cursor pointer
- Grayed out or muted appearance (optional)
- Only Review button visible
- Non-clickable (info-only)

### Status Badges

Display appropriate status badges:
- **Active**: Blue badge "Active"
- **Expired**: Red badge "Expired"
- **Cancelled**: Gray badge "CANCEL" or "Cancelled"
- **Expiring Soon**: Orange badge "Expiring Soon" (when time remaining < 24 hours)

### Error Handling

**Sync Errors:**
- Show toast notification on sync failure
- Don't block UI - allow user to manually refresh
- Log errors to console for debugging

**Missing User Email:**
- Skip sync silently (log warning to console)
- Don't show error to user
- Allow page to function normally

---

## API Integration

### Backend Endpoint Requirements

**Sync Endpoint:**
```
POST /api/esim/:iccid/sync
Headers:
  x-user-email: string (REQUIRED)
```

**Response:**
- 200: Success
- 404: eSIM not found or user email required
- 400: Invalid request

**Error Handling:**
- If `x-user-email` header is missing, backend returns 404 with "User email required"
- Frontend must always include this header for authenticated users

### Fetching eSIMs

**Endpoint:**
```
GET /api/user/esims?email={email}
Headers (optional):
  x-user-email: string
```

**Response Format:**
```typescript
interface EsimProfile {
  id: string;
  iccid: string;
  esimStatus?: string; // "EXPIRED", "IN_USE", "GOT_RESOURCE", etc.
  totalVolume?: string | null;
  expiredTime?: string | null; // ISO date string
  qrCodeUrl?: string | null;
  ac?: string | null; // Activation code
  order?: {
    id: string;
    planId: string;
    status: string; // "cancelled", "canceled", "paid", etc.
  };
  // ... other fields
}
```

---

## Component Structure

### Main Page Component

```typescript
export default function MyEsimsPage() {
  const [esims, setEsims] = useState<EsimProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  
  // Get user email from auth, URL, or localStorage
  // Fetch eSIMs from API
  // Render eSIM cards with conditional logic
  
  return (
    <div>
      {esims.map((esim) => {
        // Calculate status
        const isExpired = /* ... */;
        const isCancelled = /* ... */;
        const isExpiredOrCancelled = /* ... */;
        
        // Render card with conditional wrapper
      })}
    </div>
  );
}
```

### ExpiryCountdown Component

```typescript
export function ExpiryCountdown({
  expiry,
  className,
  iccid,
  onExpired,
  userEmail, // REQUIRED prop
}: ExpiryCountdownProps) {
  // Calculate time remaining
  // Auto-sync on expiry
  // Display formatted time or "Expired"
  
  return (
    <span className={className}>
      {isExpired ? "Expired" : formatRemainingShort(time)}
    </span>
  );
}
```

---

## Testing Checklist

- [ ] Active eSIM cards are clickable and navigate to detail page
- [ ] Expired eSIM cards are non-clickable
- [ ] Cancelled eSIM cards are non-clickable
- [ ] Action buttons (Top Up, View QR, Copy Code) are hidden for expired/cancelled
- [ ] Review button is visible for all eSIMs
- [ ] Sync functionality works with user email header
- [ ] Sync is skipped gracefully when user email is unavailable
- [ ] Time remaining calculation is accurate
- [ ] Status badges display correctly
- [ ] Guest access works (email from URL or localStorage)
- [ ] Authenticated user access works
- [ ] Error handling shows appropriate messages
- [ ] Page handles empty eSIM list gracefully

---

## Edge Cases to Handle

1. **Null/undefined expiry dates**: Treat as "unknown" expiry
2. **Invalid date formats**: Handle gracefully, show "Invalid date"
3. **Missing order data**: Don't break if `order` is null/undefined
4. **Case-insensitive status**: Handle "cancelled" vs "canceled"
5. **Network errors**: Show user-friendly error messages
6. **Concurrent sync requests**: Prevent multiple simultaneous syncs
7. **User email changes**: Re-fetch eSIMs when user email changes
8. **Timezone issues**: Ensure date calculations account for timezone

---

## Implementation Notes

1. **Performance**: Consider memoizing status calculations for large lists
2. **Accessibility**: Ensure non-clickable cards have appropriate ARIA attributes
3. **Mobile**: Test touch interactions for clickable vs non-clickable cards
4. **Loading states**: Show skeleton loaders while fetching eSIMs
5. **Empty states**: Show helpful message when no eSIMs exist
6. **Refresh functionality**: Provide manual refresh button to re-sync all eSIMs

---

## Example Code Snippet

```typescript
// Complete card rendering example
{esims.map((esim) => {
  const timeRemaining = getTimeRemaining(esim.expiredTime);
  const isExpired = timeRemaining === null || timeRemaining.totalMs <= 0;
  const isCancelled = esim.order?.status?.toLowerCase() === "cancelled" || 
                      esim.order?.status?.toLowerCase() === "canceled";
  const isExpiredOrCancelled = isExpired || 
                               esim.esimStatus === "EXPIRED" || 
                               isCancelled;
  
  const cardContent = (
    <Card className={`... ${isExpiredOrCancelled ? '' : 'hover:border-[var(--voyo-accent)] cursor-pointer'}`}>
      <CardHeader>
        <h3>{formatPlanName(esim)}</h3>
        <Badge className={getStatusColor(esim.esimStatus)}>
          {getStatusLabel(esim.esimStatus)}
        </Badge>
      </CardHeader>
      <CardContent>
        {/* eSIM details */}
        <ExpiryCountdown 
          expiry={esim.expiredTime} 
          iccid={esim.iccid}
          userEmail={userEmail}
        />
        
        {/* Action buttons - only show if NOT expired/cancelled */}
        {!isExpiredOrCancelled && (
          <>
            {esim.qrCodeUrl && <Button>View QR Code</Button>}
            <Button>Top Up</Button>
            {esim.ac && <Button>Copy Activation Code</Button>}
          </>
        )}
        
        {/* Review button - always visible */}
        <Button>Review</Button>
      </CardContent>
    </Card>
  );
  
  return isExpiredOrCancelled ? (
    <div key={esim.id}>{cardContent}</div>
  ) : (
    <Link key={esim.id} href={`/my-esims/${esim.iccid}`}>
      {cardContent}
    </Link>
  );
})}
```

---

## Migration Steps

1. **Implement status detection logic** - Add functions to calculate expired/cancelled status
2. **Update card rendering** - Add conditional wrapper (div vs Link)
3. **Hide action buttons** - Conditionally render buttons based on status
4. **Update ExpiryCountdown** - Add userEmail prop and sync functionality
5. **Add user email handling** - Get email from auth, URL, or localStorage
6. **Test all scenarios** - Active, expired, cancelled, missing data
7. **Handle edge cases** - Null values, network errors, etc.
8. **Polish UI/UX** - Visual states, loading, empty states

---

## Questions to Consider

- What authentication system are you using? (Clerk, Auth0, custom, etc.)
- What routing framework? (Next.js, React Router, etc.)
- What UI component library? (Tailwind, Material-UI, etc.)
- Do you have an existing time formatting utility?
- What's your API structure? (REST, GraphQL, etc.)

Adjust the implementation details based on your specific tech stack, but the core logic and patterns should remain the same.






