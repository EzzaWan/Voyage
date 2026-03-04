# Migration Prompt for Cheap eSIMs App

## Overview
This document contains instructions to migrate three major features from the Voyo app to the Cheap eSIMs app:
1. **Affiliate "Give 10% Get 10%" Discount System** - Referred users get 10% off first purchase, affiliates earn 10% commission
2. **Plan Filter Changes** - Reintroduce 1GB 7 days plans (plain, not FUP/nonhkip)
3. **Admin Delete Functionality** - Ability to delete orders and users from admin panel

---

## 📋 PART 1: AFFILIATE "GIVE 10% GET 10%" DISCOUNT SYSTEM

### Overview
Implement a system where:
- Referred users get **10% off their first eSIM purchase**
- Affiliates earn **10% commission on all purchases** from referred users (lifetime)
- Discount is applied automatically at checkout for first purchase only
- Discount is marked as "used" **after** successful payment (not during checkout creation)

### Database Changes

#### File: `prisma/schema.prisma`

**Add field to `Referral` model:**
```prisma
model Referral {
  id                        String    @id
  affiliateId               String
  referredUserId            String    @unique
  createdAt                 DateTime  @default(now())
  firstPurchaseDiscountUsed Boolean   @default(false) // Tracks if the 10% first-purchase discount was used
  Affiliate                 Affiliate @relation(fields: [affiliateId], references: [id])
  User                      User      @relation(fields: [referredUserId], references: [id])

  @@index([affiliateId])
  @@index([referredUserId])
}
```

**Run migration:**
```bash
npx prisma migrate dev --name add_first_purchase_discount_used
# OR if using db push:
npx prisma db push
```

---

### Backend Changes

#### File: `apps/backend/src/modules/orders/orders.service.ts`

**1. Update `createStripeCheckoutForOrder()` method:**

Add logic to:
- Accept `referralCode` parameter
- Check if user has any existing **completed** orders (status: `paid`, `active`, `esim_created`, `provisioning`)
- If no existing orders AND valid `referralCode` exists, apply 10% discount to `amountUSD`
- Create `Referral` record if one doesn't exist for the user
- Store `referralDiscountApplied` and `referralId` in Stripe metadata

**Key changes:**
```typescript
async createStripeCheckoutForOrder(
  orderId: string,
  referralCode?: string, // Add this parameter
  // ... other params
) {
  // ... existing code ...
  
  // Check for referral discount eligibility
  let discountAmount = 0;
  let referralId: string | null = null;
  
  if (referralCode) {
    // Find affiliate by referral code
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { referralCode },
    });
    
    if (affiliate) {
      // Check if user has any completed orders
      const existingOrders = await this.prisma.order.findMany({
        where: {
          userId: order.userId,
          status: { in: ['paid', 'active', 'esim_created', 'provisioning'] },
        },
      });
      
      // Only apply discount if no completed orders (first purchase)
      if (existingOrders.length === 0) {
        discountAmount = Math.round(amountUSD * 0.1 * 100); // 10% discount in cents
        amountUSD = amountUSD * 0.9; // Apply discount
        
        // Create or get referral record
        let referral = await this.prisma.referral.findUnique({
          where: { referredUserId: order.userId },
        });
        
        if (!referral) {
          referral = await this.prisma.referral.create({
            data: {
              affiliateId: affiliate.id,
              referredUserId: order.userId,
              firstPurchaseDiscountUsed: false,
            },
          });
        }
        
        referralId = referral.id;
      }
    }
  }
  
  // ... create Stripe checkout session ...
  // Add to metadata:
  metadata: {
    // ... existing metadata ...
    referralDiscountApplied: discountAmount > 0 ? 'true' : 'false',
    referralId: referralId || '',
  }
}
```

**2. Update `handleStripePayment()` method:**

Mark `firstPurchaseDiscountUsed = true` **after** successful payment:
```typescript
async handleStripePayment(session: Stripe.Checkout.Session) {
  // ... existing payment processing ...
  
  // Mark referral discount as used if it was applied
  if (session.metadata?.referralDiscountApplied === 'true' && session.metadata?.referralId) {
    await this.prisma.referral.update({
      where: { id: session.metadata.referralId },
      data: { firstPurchaseDiscountUsed: true },
    });
  }
  
  // ... rest of payment processing ...
}
```

**3. Update `checkReferralDiscountEligibility()` method:**

Add method to check eligibility (accepts `referralCode` parameter):
```typescript
async checkReferralDiscountEligibility(userId: string, referralCode?: string): Promise<{
  eligible: boolean;
  discountPercent: number;
}> {
  if (!referralCode) {
    return { eligible: false, discountPercent: 0 };
  }
  
  // Find affiliate
  const affiliate = await this.prisma.affiliate.findUnique({
    where: { referralCode },
  });
  
  if (!affiliate) {
    return { eligible: false, discountPercent: 0 };
  }
  
  // Check if user has any completed orders
  const existingOrders = await this.prisma.order.findMany({
    where: {
      userId,
      status: { in: ['paid', 'active', 'esim_created', 'provisioning'] },
    },
  });
  
  // Only eligible if no completed orders (first purchase)
  if (existingOrders.length === 0) {
    return { eligible: true, discountPercent: 10 };
  }
  
  return { eligible: false, discountPercent: 0 };
}
```

#### File: `apps/backend/src/modules/orders/orders.controller.ts`

**1. Update `createCheckoutSession()` endpoint:**

Add `referralCode` to request body:
```typescript
@Post('checkout')
async createCheckoutSession(
  @Body() body: { orderId: string; referralCode?: string },
  // ... other params
) {
  return this.ordersService.createStripeCheckoutForOrder(
    body.orderId,
    body.referralCode, // Pass referral code
    // ... other params
  );
}
```

**2. Add `checkReferralDiscount()` endpoint:**

```typescript
@Get('check-referral-discount')
async checkReferralDiscount(
  @Query('userId') userId: string,
  @Query('referralCode') referralCode?: string,
) {
  return this.ordersService.checkReferralDiscountEligibility(userId, referralCode);
}
```

---

### Frontend Changes - Web App

#### File: `apps/web/app/checkout/[orderId]/page.tsx`

**1. Add state for referral discount:**
```typescript
const [referralDiscount, setReferralDiscount] = useState<{
  eligible: boolean;
  discountPercent: number;
} | null>(null);
```

**2. Fetch referral code from cookie and check eligibility:**
```typescript
useEffect(() => {
  // Get referral code from cookie
  const referralCode = getReferralCode(); // Your existing function
  
  if (referralCode && order?.userId) {
    // Check eligibility
    fetch(`${apiUrl}/orders/check-referral-discount?userId=${order.userId}&referralCode=${referralCode}`)
      .then(res => res.json())
      .then(data => setReferralDiscount(data))
      .catch(console.error);
  }
}, [order]);
```

**3. Display discount banner:**
```typescript
{referralDiscount?.eligible && (
  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4">
    <p className="text-green-400 font-semibold">
      🎉 10% First Purchase Discount!
    </p>
    <p className="text-sm text-gray-400">
      You've been referred! Get {referralDiscount.discountPercent}% off your first purchase.
    </p>
  </div>
)}
```

**4. Pass referral code to checkout:**
```typescript
const handleCheckout = async () => {
  const referralCode = getReferralCode(); // Get from cookie
  
  const response = await fetch(`${apiUrl}/orders/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: order.id,
      referralCode, // Include referral code
    }),
  });
  
  // ... handle response ...
};
```

#### File: `apps/web/app/account/affiliate/page.tsx`

**Update the affiliate dashboard:**
- Change header subtitle to: "Give 10%, Get 10% — Share the savings, earn together!"
- Add explainer card explaining the "Give 10% Get 10%" program
- Update share message to mention the 10% discount

**Example explainer card:**
```tsx
<div className="bg-card border border-border rounded-lg p-4 mb-4">
  <h3 className="text-lg font-semibold mb-2">🎁 Give 10%, Get 10%</h3>
  <p className="text-sm text-muted-foreground">
    When you share your link, your friends get <span className="font-semibold">10% off</span> their first purchase, 
    and you earn <span className="font-semibold text-primary">10% commission</span> on all their purchases — forever!
  </p>
</div>
```

#### File: `apps/web/lib/referral.ts`

**Ensure `getReferralCode()` function exists:**
```typescript
export function getReferralCode(): string | null {
  if (typeof window === 'undefined') return null;
  return getCookie('voyage_ref') || null; // Adjust cookie name if different
}
```

#### File: `apps/web/components/ReferralDiscountBanner.tsx` (if exists)

**Update to show "10% First Purchase Discount" message**

#### File: `apps/web/app/layout.tsx`

**Include ReferralDiscountBanner component** (if using site-wide banner)

---

### Frontend Changes - Mobile App

#### File: `apps/mobile/app/checkout.tsx`

**1. Add state and fetch eligibility:**
```typescript
const [referralDiscount, setReferralDiscount] = useState<{
  eligible: boolean;
  discountPercent: number;
} | null>(null);

// Fetch eligibility
useEffect(() => {
  const checkDiscount = async () => {
    const referralCode = await getStoredReferralCode(); // From AsyncStorage
    if (referralCode && order?.userId) {
      try {
        const res = await apiFetch(
          `/orders/check-referral-discount?userId=${order.userId}&referralCode=${referralCode}`
        );
        setReferralDiscount(res);
      } catch (err) {
        console.error('Error checking referral discount:', err);
      }
    }
  };
  checkDiscount();
}, [order]);
```

**2. Display discount banner:**
```tsx
{referralDiscount?.eligible && (
  <View style={styles.discountBanner}>
    <Text style={styles.discountTitle}>🎉 10% First Purchase Discount!</Text>
    <Text style={styles.discountText}>
      You've been referred! Get {referralDiscount.discountPercent}% off your first purchase.
    </Text>
  </View>
)}
```

**3. Pass referral code to checkout:**
```typescript
const handleCheckout = async () => {
  const referralCode = await getStoredReferralCode();
  
  await apiFetch('/orders/checkout', {
    method: 'POST',
    body: JSON.stringify({
      orderId: order.id,
      referralCode,
    }),
  });
};
```

#### File: `apps/mobile/app/affiliate.tsx`

**Update similar to web app:**
- Change header subtitle
- Add explainer card
- Update share message

#### File: `apps/mobile/src/utils/referral.ts` (create if doesn't exist)

**Add functions for mobile referral tracking:**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getStoredReferralCode(): Promise<string | null> {
  return await AsyncStorage.getItem('referralCode');
}

export async function storeReferralCode(code: string): Promise<void> {
  await AsyncStorage.setItem('referralCode', code);
}
```

---

## 📋 PART 2: PLAN FILTER CHANGES (1GB 7 DAYS PLANS)

### Overview
Reintroduce 1GB 7 days plans in the plan filtering logic. These plans should:
- Be exactly 1GB data
- Be exactly 7 days duration
- NOT have FUP flag
- NOT have nonhkip flag
- Bypass the $3 minimum price requirement

### Files to Modify

#### File: `apps/web/lib/plan-utils.ts`

**1. Add helper functions:**

```typescript
/**
 * Check if a plan has FUP flag (any FUP, not just 1Mbps)
 */
function hasFUP(plan: Plan): boolean {
  const nameLower = (plan.name || '').toLowerCase();
  const fupPattern = /\bfup(\d+)?mbps?\b/i;
  const fupStandalone = /\bfup\b/i;
  return nameLower.match(fupPattern) !== null || 
         nameLower.match(fupStandalone) !== null ||
         (plan as any).fup === true ||
         (plan as any).fairUsagePolicy === true ||
         (typeof (plan as any).fup === 'string' && /^fup(\d+)?mbps?$/i.test((plan as any).fup));
}

/**
 * Check if a plan is a 1GB 7 days plan (plain, not FUP or nonhkip)
 */
function is1GB7DaysPlan(plan: Plan): boolean {
  const gb = calculateGB(plan.volume);
  const roundedGB = Math.round(gb * 10) / 10;
  
  // Must be exactly 1GB
  if (roundedGB !== 1.0) {
    return false;
  }
  
  // Must be exactly 7 days
  const duration = plan.duration || 0;
  const durationUnit = (plan.durationUnit || 'day').toLowerCase();
  if (duration !== 7 || durationUnit !== 'day') {
    return false;
  }
  
  // Must NOT have FUP or nonhkip flags
  if (hasFUP(plan) || hasNonHKIP(plan)) {
    return false;
  }
  
  return true;
}
```

**2. Update `isPlanVisible()` function:**

```typescript
export function isPlanVisible(
  plan: Plan,
  discountPercent?: number
): boolean {
  // Always show 1GB 7 days plans regardless of price
  if (is1GB7DaysPlan(plan)) {
    return true;
  }
  
  const finalPriceUSD = getFinalPriceUSD(plan, discountPercent);
  return finalPriceUSD >= 3.0;
}
```

**3. Update `groupPlansByDataSize()` function:**

```typescript
export function groupPlansByDataSize(plans: Plan[]): Map<number, Plan[]> {
  // ... existing code ...
  
  // Skip plans <= 1.5GB (unless unlimited or 1GB 7 days)
  if (gb <= MIN_GB_SIZE) {
    if (!isDailyUnlimitedPlan(plan) && !is1GB7DaysPlan(plan)) {
      continue;
    }
  }
  
  // ... rest of function ...
}
```

**4. Update `getDurationsForSize()` function:**

```typescript
export function getDurationsForSize(
  plans: Plan[],
  targetGB: number
): Array<{ duration: number; durationUnit: string; plan: Plan }> {
  // ... existing code ...
  
  // Exclude plans <= 1.5GB unless they're unlimited or 1GB 7 days
  if (gb <= MIN_GB_SIZE && !isDailyUnlimitedPlan(plan) && !is1GB7DaysPlan(plan)) {
    return false;
  }
  
  // ... rest of function ...
}
```

**5. Update `filterVisiblePlans()` function:**

```typescript
export function filterVisiblePlans(plans: Plan[]): Plan[] {
  return plans.filter((plan) => {
    const gb = calculateGB(plan.volume);
    
    // Exclude all plans <= 1.5GB (except unlimited plans and 1GB 7 days)
    if (gb <= MIN_GB_SIZE) {
      // Only allow if it's an unlimited plan (2GB + FUP1Mbps) or 1GB 7 days
      if (isDailyUnlimitedPlan(plan) || is1GB7DaysPlan(plan)) {
        // Allow unlimited plans even though they're 2GB
        // Allow 1GB 7 days plans
        // Continue to duration and price check below
      } else {
        // Exclude all other plans <= 1.5GB
        return false;
      }
    }
    
    // ... rest of filtering logic ...
    
    // Filter by price (>= $3 USD), but 1GB 7 days bypasses this in isPlanVisible
    const discountPercent = getDiscount(plan.packageCode, gb);
    return isPlanVisible(plan, discountPercent);
  });
}
```

#### File: `apps/mobile/src/utils/planUtils.ts`

**Apply the same changes as above** (same functions, same logic)

---

## 📋 PART 3: ADMIN DELETE FUNCTIONALITY

### Overview
Add ability for admins to delete orders and users from the database. Orders can only be deleted if they're pending. Users can only be deleted if they have no completed orders.

### Backend Changes

#### File: `apps/backend/src/modules/admin/controllers/admin-orders.controller.ts`

**1. Add Delete import:**
```typescript
import {
  Controller,
  Get,
  Param,
  Post,
  Delete, // Add this
  Body,
  UseGuards,
  // ... other imports
} from '@nestjs/common';
```

**2. Add delete endpoint:**
```typescript
@Delete(':id')
async deleteOrder(@Param('id') id: string, @Req() req: any) {
  const order = await this.prisma.order.findUnique({
    where: { id },
    include: {
      EsimProfile: true,
      User: true,
    },
  });

  if (!order) {
    throw new NotFoundException(`Order ${id} not found`);
  }

  // Prevent deletion of orders that have been paid (safety check)
  if (order.status === 'paid' || order.status === 'active' || order.status === 'esim_created') {
    throw new BadRequestException(
      'Cannot delete orders with status "paid", "active", or "esim_created". Only pending orders can be deleted.'
    );
  }

  try {
    // Delete related records in correct order (respecting foreign key constraints)
    
    // 1. Delete commissions related to this order
    await this.prisma.commission.deleteMany({
      where: {
        orderId: id,
        orderType: 'order',
      },
    });

    // 2. Delete eSIM profiles related to this order
    await this.prisma.esimProfile.deleteMany({
      where: {
        orderId: id,
      },
    });

    // 3. Delete the order itself
    await this.prisma.order.delete({
      where: { id },
    });

    // Log admin action (if you have admin logging)
    await this.adminService.logAction(
      req.adminEmail,
      'delete_order',
      'order',
      id,
      { orderId: id, planId: order.planId, status: order.status },
    );

    return { success: true, message: 'Order deleted successfully' };
  } catch (error: any) {
    throw new BadRequestException(`Failed to delete order: ${error.message}`);
  }
}
```

#### File: `apps/backend/src/modules/admin/controllers/admin-users.controller.ts`

**1. Add Delete import and AdminService:**
```typescript
import {
  Controller,
  Get,
  Param,
  Query,
  Delete, // Add this
  UseGuards,
  // ... other imports
} from '@nestjs/common';
import { AdminService } from '../admin.service'; // Add this if exists
```

**2. Inject AdminService in constructor:**
```typescript
constructor(
  private readonly prisma: PrismaService,
  private readonly adminService: AdminService, // Add this
) {}
```

**3. Add delete endpoint:**
```typescript
@Delete(':id')
async deleteUser(@Param('id') id: string, @Req() req: any) {
  const user = await this.prisma.user.findUnique({
    where: { id },
    include: {
      Order: {
        select: {
          id: true,
          status: true,
        },
      },
      EsimProfile: {
        select: {
          id: true,
        },
      },
      TopUp: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundException(`User ${id} not found`);
  }

  // Check if user has any completed orders (safety check)
  const hasCompletedOrders = user.Order.some(
    (order) => order.status === 'paid' || order.status === 'active' || order.status === 'esim_created'
  );

  if (hasCompletedOrders) {
    throw new BadRequestException(
      'Cannot delete user with completed orders. Please delete or refund orders first.'
    );
  }

  try {
    // Delete related records in correct order (respecting foreign key constraints)
    
    // 1. Delete commissions related to user's orders
    const orderIds = user.Order.map((o) => o.id);
    await this.prisma.commission.deleteMany({
      where: {
        orderId: { in: orderIds },
      },
    });

    // 2. Delete topups (they reference EsimProfile, so delete before profiles)
    await this.prisma.topUp.deleteMany({
      where: {
        userId: id,
      },
    });

    // 3. Delete eSIM profiles
    await this.prisma.esimProfile.deleteMany({
      where: {
        userId: id,
      },
    });

    // 4. Delete orders
    await this.prisma.order.deleteMany({
      where: {
        userId: id,
      },
    });

    // 5. Delete referral (if user was referred)
    await this.prisma.referral.deleteMany({
      where: {
        referredUserId: id,
      },
    });

    // 6. Delete affiliate record (if user is an affiliate)
    await this.prisma.affiliate.deleteMany({
      where: {
        userId: id,
      },
    });

    // 7. Delete V-Cash balance and transactions (if exists)
    await this.prisma.vCashTransaction.deleteMany({
      where: {
        userId: id,
      },
    });
    await this.prisma.vCashBalance.deleteMany({
      where: {
        userId: id,
      },
    });

    // 8. Delete reviews (if exists)
    await this.prisma.review.deleteMany({
      where: {
        userId: id,
      },
    });

    // 9. Delete mobile tokens (if exists)
    await this.prisma.mobileToken.deleteMany({
      where: {
        userId: id,
      },
    });

    // 10. Delete affiliate signup (if exists)
    await this.prisma.affiliateSignup.deleteMany({
      where: {
        userId: id,
      },
    });

    // 11. Finally, delete the user
    await this.prisma.user.delete({
      where: { id },
    });

    // Log admin action
    await this.adminService.logAction(
      req.adminEmail,
      'delete_user',
      'user',
      id,
      { userId: id, email: user.email, orderCount: user.Order.length },
    );

    return { success: true, message: 'User deleted successfully' };
  } catch (error: any) {
    throw new BadRequestException(`Failed to delete user: ${error.message}`);
  }
}
```

---

### Frontend Changes - Web App

#### File: `apps/web/components/admin/AdminTable.tsx`

**Update to support custom render functions:**

**1. Update Column interface:**
```typescript
interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => string | number);
  className?: string | ((row: T) => string);
  render?: (row: T) => React.ReactNode; // Add this
}
```

**2. Update table cell rendering:**
```typescript
{columns.map((column, idx) => {
  // If render function is provided, use it
  if (column.render) {
    return (
      <td
        key={idx}
        className={`text-left px-4 py-3 text-sm break-words ${typeof column.className === "function" ? column.className(row) : (column.className || "text-white")}`}
        onClick={(e) => e.stopPropagation()} // Prevent row click for action cells
      >
        {column.render(row)}
      </td>
    );
  }

  // Otherwise, use accessor (existing logic)
  // ... rest of existing code ...
})}
```

**3. Add React import if needed:**
```typescript
import React from "react";
```

#### File: `apps/web/app/admin/orders/page.tsx`

**1. Add imports:**
```typescript
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
```

**2. Add state:**
```typescript
const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
const { toast } = useToast();
```

**3. Add delete handler:**
```typescript
const handleDeleteOrder = async (orderId: string, e: React.MouseEvent) => {
  e.stopPropagation(); // Prevent row click
  
  const order = orders.find((o) => o.id === orderId);
  if (!order) return;

  // Confirm deletion
  if (!confirm(`Are you sure you want to delete order ${orderId}?\n\nThis will permanently delete the order and all related data. This action cannot be undone.`)) {
    return;
  }

  setDeletingOrderId(orderId);
  try {
    const res = await fetch(`${apiUrl}/admin/orders/${orderId}`, {
      method: "DELETE",
      headers: {
        "x-admin-email": user?.primaryEmailAddress?.emailAddress || "",
      },
    });

    if (res.ok) {
      toast({
        title: "Success",
        description: "Order deleted successfully",
      });
      // Refresh orders list
      const updatedOrders = orders.filter((o) => o.id !== orderId);
      setOrders(updatedOrders);
    } else {
      const error = await res.json();
      throw new Error(error.message || "Failed to delete order");
    }
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message || "Failed to delete order",
      variant: "destructive",
    });
  } finally {
    setDeletingOrderId(null);
  }
};
```

**4. Add Actions column:**
```typescript
const columns = useMemo(() => [
  // ... existing columns ...
  {
    header: "Actions",
    accessor: () => "",
    render: (row: Order) => {
      // Only allow deletion of pending orders
      const canDelete = row.status === "pending";
      return (
        <div className="flex items-center gap-2">
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => handleDeleteOrder(row.id, e)}
              disabled={deletingOrderId === row.id}
              className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      );
    },
    className: "text-white w-[80px]",
  },
], [planNames, deletingOrderId]);
```

#### File: `apps/web/app/admin/users/page.tsx`

**Apply similar changes:**
- Add imports (Button, Trash2, useToast)
- Add state (deletingUserId)
- Add delete handler (similar to orders)
- Add Actions column with delete button

**Note:** For users, you can show delete button for all users (backend will validate), or only show for users with 0 orders.

---

## 📁 FILE CHECKLIST

### Database
- [ ] `prisma/schema.prisma` - Add `firstPurchaseDiscountUsed` to `Referral` model

### Backend
- [ ] `apps/backend/src/modules/orders/orders.service.ts` - Add referral discount logic
- [ ] `apps/backend/src/modules/orders/orders.controller.ts` - Add referral code endpoints
- [ ] `apps/backend/src/modules/admin/controllers/admin-orders.controller.ts` - Add delete endpoint
- [ ] `apps/backend/src/modules/admin/controllers/admin-users.controller.ts` - Add delete endpoint

### Frontend - Web
- [ ] `apps/web/app/checkout/[orderId]/page.tsx` - Add referral discount UI and logic
- [ ] `apps/web/app/account/affiliate/page.tsx` - Update affiliate dashboard
- [ ] `apps/web/lib/referral.ts` - Ensure referral code functions exist
- [ ] `apps/web/lib/plan-utils.ts` - Add 1GB 7 days plan filtering
- [ ] `apps/web/components/admin/AdminTable.tsx` - Add render prop support
- [ ] `apps/web/app/admin/orders/page.tsx` - Add delete functionality
- [ ] `apps/web/app/admin/users/page.tsx` - Add delete functionality

### Frontend - Mobile
- [ ] `apps/mobile/app/checkout.tsx` - Add referral discount UI and logic
- [ ] `apps/mobile/app/affiliate.tsx` - Update affiliate dashboard
- [ ] `apps/mobile/src/utils/referral.ts` - Add mobile referral functions
- [ ] `apps/mobile/src/utils/planUtils.ts` - Add 1GB 7 days plan filtering

---

## 🧪 TESTING CHECKLIST

### Affiliate Discount
- [ ] User clicks referral link, cookie is stored
- [ ] First purchase shows "10% First Purchase Discount" banner
- [ ] Discount is applied in Stripe checkout
- [ ] After payment, `firstPurchaseDiscountUsed` is set to `true`
- [ ] Second purchase does NOT show discount
- [ ] Affiliate earns commission on both purchases

### Plan Filter
- [ ] 1GB 7 days plans appear in plan listings
- [ ] FUP variants of 1GB plans are excluded
- [ ] nonhkip variants of 1GB plans are excluded
- [ ] 1GB 7 days plans bypass $3 minimum price

### Admin Delete
- [ ] Can delete pending orders
- [ ] Cannot delete paid/active orders
- [ ] Can delete users with no completed orders
- [ ] Cannot delete users with completed orders
- [ ] Related records are properly deleted (cascading)

---

## 📝 NOTES

1. **Cookie Name**: Adjust cookie name if different (e.g., `voyage_ref` vs `cheapesims_ref`)
2. **API Endpoints**: Adjust API URL patterns if different
3. **Admin Service**: If `AdminService.logAction()` doesn't exist, remove those calls or create the service
4. **Prisma Models**: Adjust model names if different (e.g., `EsimProfile` vs `ESimProfile`)
5. **Toast/Notifications**: Adjust toast implementation if using different library
6. **Icons**: Adjust icon library if not using `lucide-react` (web) or `@expo/vector-icons` (mobile)

---

## 🚀 DEPLOYMENT STEPS

1. **Database Migration**: Run Prisma migration for `firstPurchaseDiscountUsed` field
2. **Backend**: Deploy backend changes
3. **Frontend**: Deploy frontend changes
4. **Test**: Verify all three features work as expected
5. **Monitor**: Watch for any errors in logs

---

**Good luck with the migration!** 🎉


















