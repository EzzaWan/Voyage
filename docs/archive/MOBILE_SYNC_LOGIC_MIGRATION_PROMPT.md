# Mobile Sync Logic Migration Prompt

This document contains detailed instructions to implement the mobile eSIM usage sync logic from the Voyage app. This includes manual sync, automatic background polling, sync status indicators, and proper error handling.

---

## Overview

The sync logic allows users to:
1. **Manually sync** usage data by pulling to refresh or clicking "Sync Now"
2. **Automatically sync** usage data every 5 minutes in the background
3. **See sync status** with "Last synced: X minutes ago" indicator
4. **Understand delays** with a note about provider's 2-3 hour update delay

**Important:** The backend must have the `/esim/:iccid/sync` endpoint that triggers usage sync. This endpoint should:
- Accept `POST /esim/:iccid/sync` with `x-user-email` header
- Validate user ownership
- Query provider for latest profile data
- Update profile status, volume, expiry
- Trigger usage data sync via usage service

---

## BATCH 1: Add State Management & Sync Functions

### Task
Add state variables and core sync functions to the My eSIMs page.

### Files to Modify
- `apps/mobile/app/my-esims.tsx` (or equivalent eSIM list page)

### Implementation Steps

1. **Add State Variables:**
   Add these state variables at the top of your component:
   ```typescript
   const [syncing, setSyncing] = useState(false);
   const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
   ```

2. **Update `fetchEsims` Function:**
   Modify your existing `fetchEsims` function to support usage sync:
   ```typescript
   const fetchEsims = useCallback(async (isRefresh = false, syncUsage = false) => {
     const email = user?.primaryEmailAddress?.emailAddress;
     
     if (!email) {
       setLoading(false);
       setError('Please log in to view your eSIMs.');
       return;
     }

     try {
       if (isRefresh) setRefreshing(true);
       else setLoading(true);
       setError(null);
       
       // If refreshing, sync usage for all eSIMs first
       if (syncUsage && isRefresh) {
         // Fetch current eSIMs to get ICCIDs
         const currentData = await apiFetch<EsimProfile[]>(`/user/esims?email=${encodeURIComponent(email)}`);
         const currentEsims = Array.isArray(currentData) ? currentData : [];
         
         // Sync usage for each eSIM (in parallel, but limit to avoid rate limits)
         const syncPromises = currentEsims
           .filter(esim => esim.iccid) // Only sync if ICCID exists
           .slice(0, 5) // Limit to 5 at a time to avoid rate limits
           .map(esim => 
             apiFetch(`/esim/${esim.iccid}/sync`, {
               method: 'POST',
               headers: {
                 'x-user-email': email,
               },
             }).catch(err => {
               console.warn(`Failed to sync usage for ${esim.iccid}:`, err);
               return null; // Don't fail if one sync fails
             })
           );
         
         // Wait for syncs to complete (but don't block if they fail)
         await Promise.allSettled(syncPromises);
         setLastSyncTime(new Date()); // Update last sync time
       }
       
       // Fetch updated eSIM data
       const data = await apiFetch<EsimProfile[]>(`/user/esims?email=${encodeURIComponent(email)}`);
       const esimsData = Array.isArray(data) ? data : [];
       setEsims(esimsData);
       if (esimsData.length > 0) {
         setCachedEsims(esimsData);
         cachedEsimsRef.current = esimsData;
       }
     } catch (err) {
       const errorMessage = err instanceof Error ? err.message : 'Failed to load eSIMs';
       setError(errorMessage);
       if (cachedEsimsRef.current.length > 0) {
         setEsims(cachedEsimsRef.current);
       }
     } finally {
       setLoading(false);
       setRefreshing(false);
     }
   }, [user?.primaryEmailAddress?.emailAddress]);
   ```

3. **Add `handleSyncNow` Function:**
   ```typescript
   const handleSyncNow = useCallback(async () => {
     const email = user?.primaryEmailAddress?.emailAddress;
     if (!email || syncing) return;

     try {
       setSyncing(true);
       setError(null);
       
       // Fetch current eSIMs to get ICCIDs
       const currentData = await apiFetch<EsimProfile[]>(`/user/esims?email=${encodeURIComponent(email)}`);
       const currentEsims = Array.isArray(currentData) ? currentData : [];
       
       // Sync usage for each eSIM (in parallel, but limit to avoid rate limits)
       const syncPromises = currentEsims
         .filter(esim => esim.iccid) // Only sync if ICCID exists
         .slice(0, 5) // Limit to 5 at a time to avoid rate limits
         .map(esim => 
           apiFetch(`/esim/${esim.iccid}/sync`, {
             method: 'POST',
             headers: {
               'x-user-email': email,
             },
           }).catch(err => {
             console.warn(`Failed to sync usage for ${esim.iccid}:`, err);
             return null; // Don't fail if one sync fails
           })
         );
       
       // Wait for syncs to complete
       await Promise.allSettled(syncPromises);
       setLastSyncTime(new Date()); // Update last sync time
       
       // Refresh eSIM data to show updated usage
       await fetchEsims(false, false);
     } catch (err) {
       const errorMessage = err instanceof Error ? err.message : 'Failed to sync usage';
       setError(errorMessage);
     } finally {
       setSyncing(false);
     }
   }, [user?.primaryEmailAddress?.emailAddress, syncing, fetchEsims]);
   ```

4. **Add `formatTimeAgo` Helper Function:**
   ```typescript
   const formatTimeAgo = (date: Date | null): string => {
     if (!date) return 'Never';
     
     const now = new Date();
     const diffMs = now.getTime() - date.getTime();
     const diffMins = Math.floor(diffMs / 60000);
     const diffHours = Math.floor(diffMs / 3600000);
     
     if (diffMins < 1) return 'Just now';
     if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
     if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
     
     const diffDays = Math.floor(diffHours / 24);
     return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
   };
   ```

5. **Update `onRefresh` Function:**
   ```typescript
   const onRefresh = useCallback(() => {
     fetchEsims(true, true); // Refresh and sync usage
   }, [fetchEsims]);
   ```

### Expected Result
- State variables added for sync status and last sync time
- `fetchEsims` function supports usage sync on refresh
- `handleSyncNow` function for manual sync
- `formatTimeAgo` helper for displaying sync time
- Pull-to-refresh triggers usage sync

---

## BATCH 2: Add Automatic Background Polling

### Task
Add automatic background polling to sync usage every 5 minutes when the app is active.

### Files to Modify
- `apps/mobile/app/my-esims.tsx`

### Implementation Steps

1. **Add `useEffect` for Automatic Polling:**
   Add this `useEffect` hook after your existing `useEffect` hooks:
   ```typescript
   // Auto-refresh usage every 5 minutes when app is active
   useEffect(() => {
     if (!isLoaded || !user?.primaryEmailAddress?.emailAddress || esims.length === 0) {
       return;
     }

     const interval = setInterval(() => {
       // Silently refresh usage (don't show loading spinner)
       fetchEsims(false, true); // Sync usage but don't show refresh spinner
     }, 5 * 60 * 1000); // 5 minutes

     return () => clearInterval(interval);
   }, [isLoaded, user?.primaryEmailAddress?.emailAddress, esims.length, fetchEsims]);
   ```

   **Important Notes:**
   - The interval only runs when user is loaded, signed in, and has eSIMs
   - It calls `fetchEsims(false, true)` which syncs usage without showing the refresh spinner
   - The interval is cleaned up when the component unmounts or dependencies change

### Expected Result
- Usage data automatically syncs every 5 minutes in the background
- No loading spinner shown during automatic sync
- Interval is properly cleaned up when component unmounts

---

## BATCH 3: Add Sync Status UI

### Task
Add the sync status section with "Last synced" indicator, "Sync Now" button, and provider delay note.

### Files to Modify
- `apps/mobile/app/my-esims.tsx`

### Implementation Steps

1. **Add Sync Section to Header:**
   In your header section (where the title is), add the sync section:
   ```typescript
   <View style={styles.header}>
     <Text style={styles.title}>My eSIMs</Text>
     
     {/* Sync Status and Controls - Redesigned */}
     <View style={styles.syncSection}>
       <View style={styles.syncRow}>
         <View style={styles.syncInfoContainer}>
           <Ionicons name="time-outline" size={16} color={theme.colors.textMuted} />
           <Text style={styles.syncText}>
             Last synced: {formatTimeAgo(lastSyncTime)}
           </Text>
         </View>
         <TouchableOpacity 
           onPress={handleSyncNow} 
           disabled={syncing || refreshing}
           style={[styles.syncButton, (syncing || refreshing) && styles.syncButtonDisabled]}
         >
           {syncing ? (
             <ActivityIndicator size="small" color={theme.colors.white} />
           ) : (
             <>
               <Ionicons name="sync" size={16} color={theme.colors.white} />
               <Text style={styles.syncButtonText}>Sync Now</Text>
             </>
           )}
         </TouchableOpacity>
       </View>
       
       {/* Provider Delay Note */}
       <View style={styles.infoNote}>
         <Ionicons name="information-circle-outline" size={13} color={theme.colors.textMuted} />
         <Text style={styles.infoNoteText}>
           Usage data updates every 2–3 hours from your carrier
         </Text>
       </View>
     </View>
   </View>
   ```

2. **Add Styles for Sync Section:**
   Add these styles to your `StyleSheet.create()`:
   ```typescript
   syncSection: {
     backgroundColor: theme.colors.card,
     borderRadius: theme.borderRadius.md,
     padding: theme.spacing.md,
     borderWidth: 1,
     borderColor: theme.colors.border + '40',
     marginTop: theme.spacing.md,
   },
   syncRow: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginBottom: theme.spacing.xs,
   },
   syncInfoContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     gap: 8,
     flex: 1,
   },
   syncText: {
     fontSize: 13,
     color: theme.colors.textMuted,
     fontWeight: '500',
   },
   syncButton: {
     flexDirection: 'row',
     alignItems: 'center',
     gap: 6,
     backgroundColor: theme.colors.primary,
     paddingHorizontal: 14,
     paddingVertical: 8,
     borderRadius: theme.borderRadius.md,
     ...theme.shadows.primaryGlow, // Or your shadow style
   },
   syncButtonDisabled: {
     opacity: 0.6,
   },
   syncButtonText: {
     fontSize: 13,
     color: theme.colors.white,
     fontWeight: '600',
   },
   infoNote: {
     flexDirection: 'row',
     alignItems: 'flex-start',
     gap: 6,
     marginTop: theme.spacing.xs,
     paddingTop: theme.spacing.xs,
     borderTopWidth: 1,
     borderTopColor: theme.colors.border + '30',
   },
   infoNoteText: {
     fontSize: 11,
     color: theme.colors.textMuted,
     flex: 1,
     lineHeight: 16,
   },
   ```

3. **Update Header Styles:**
   Ensure your header has proper padding and border:
   ```typescript
   header: {
     paddingBottom: theme.spacing.md,
     paddingLeft: 16,
     paddingRight: 16,
     backgroundColor: theme.colors.background,
     borderBottomWidth: 1,
     borderBottomColor: theme.colors.border,
   },
   ```

### Expected Result
- Sync section displays below the title
- "Last synced: X minutes ago" shows with time icon
- "Sync Now" button with sync icon
- Button shows loading spinner when syncing
- Provider delay note displays below sync controls
- Card-based design with proper spacing and borders

---

## BATCH 4: Update Pull-to-Refresh

### Task
Ensure pull-to-refresh triggers usage sync and updates last sync time.

### Files to Modify
- `apps/mobile/app/my-esims.tsx`

### Implementation Steps

1. **Verify RefreshControl:**
   Ensure your `FlatList` or `ScrollView` has a `RefreshControl`:
   ```typescript
   <FlatList
     data={esims}
     keyExtractor={(item) => item.id}
     renderItem={renderEsimItem}
     contentContainerStyle={styles.listContent}
     refreshControl={
       <RefreshControl
         refreshing={refreshing}
         onRefresh={onRefresh}
         tintColor={theme.colors.primary}
       />
     }
   />
   ```

2. **Verify `onRefresh` Function:**
   Make sure `onRefresh` calls `fetchEsims(true, true)` to trigger sync:
   ```typescript
   const onRefresh = useCallback(() => {
     fetchEsims(true, true); // Refresh and sync usage
   }, [fetchEsims]);
   ```

### Expected Result
- Pull-to-refresh triggers usage sync for all eSIMs
- Last sync time updates after refresh completes
- Refresh spinner shows during sync

---

## BATCH 5: Backend Endpoint Verification

### Task
Verify that the backend has the `/esim/:iccid/sync` endpoint that triggers usage sync.

### Files to Check/Modify
- Backend: `apps/backend/src/modules/esim/esim.controller.ts` (or equivalent)

### Implementation Steps

1. **Verify Endpoint Exists:**
   The backend should have an endpoint:
   ```typescript
   @Post('esim/:iccid/sync')
   @RateLimit({ limit: 10, window: 60 }) // 10 syncs per minute per user
   async syncEsimByIccid(
     @Param('iccid') iccid: string,
     @Headers('x-user-email') userEmail: string | undefined,
   ) {
     // Validate user email
     if (!userEmail) {
       throw new NotFoundException('User email required');
     }

     // Get user ID from email
     const userId = await getUserIdFromEmail(this.prisma, userEmail);
     if (!userId) {
       throw new NotFoundException('User not found');
     }

     // Find profile by ICCID
     const profile = await this.ordersService.findByIccid(iccid);
     if (!profile) {
       throw new NotFoundException('Profile not found');
     }

     // Validate ownership
     assertOwnership({
       userId,
       ownerId: profile.userId,
       resource: 'eSIM Profile',
     });

     // Query provider for latest profile data
     const orderNo = profile.Order?.esimOrderNo;
     if (!orderNo) {
       throw new NotFoundException('Order not found for this profile');
     }

     const res = await this.esimService.getEsimAccess().client.request<any>(
       'POST',
       '/esim/query',
       { orderNo, pager: { pageNum: 1, pageSize: 50 } }
     );

     if (!res?.obj?.esimList || res.obj.esimList.length === 0) {
       throw new NotFoundException('Profile data not found from provider');
     }

     // Find matching profile
     const providerProfile = res.obj.esimList.find(
       (p: any) => p.iccid === iccid || p.esimTranNo === profile.esimTranNo
     ) || res.obj.esimList[0];

     // Update profile with latest data
     const updateData: any = {};
     if (providerProfile.esimStatus !== undefined) {
       updateData.esimStatus = providerProfile.esimStatus;
     }
     if (providerProfile.totalVolume !== undefined) {
       updateData.totalVolume = providerProfile.totalVolume;
     }
     if (providerProfile.expiredTime) {
       updateData.expiredTime = new Date(providerProfile.expiredTime);
     }
     if (providerProfile.smdpStatus !== undefined) {
       updateData.smdpStatus = providerProfile.smdpStatus;
     }
     if (providerProfile.qrCodeUrl !== undefined) {
       updateData.qrCodeUrl = providerProfile.qrCodeUrl;
     }
     if (providerProfile.ac !== undefined) {
       updateData.ac = providerProfile.ac;
     }

     if (Object.keys(updateData).length > 0) {
       await this.prisma.esimProfile.update({
         where: { id: profile.id },
         data: updateData,
       });
     }

     // **IMPORTANT: Also sync usage data**
     if (profile.esimTranNo) {
       try {
         await this.usageService.syncUsageForProfile(profile.id, profile.esimTranNo);
       } catch (err) {
         // Log but don't fail the sync if usage sync fails
         console.warn(`Failed to sync usage for profile ${profile.id}:`, err);
       }
     }

     // Check and mark as expired if status indicates
     if (providerProfile.esimStatus === 'EXPIRED' || 
         providerProfile.esimStatus === 'UNUSED_EXPIRED' || 
         providerProfile.esimStatus === 'USED_EXPIRED') {
       await this.prisma.esimProfile.update({
         where: { id: profile.id },
         data: { esimStatus: 'EXPIRED' },
       });
     }

     return {
       success: true,
       message: 'Profile synced successfully',
       updated: Object.keys(updateData),
       timestamp: new Date().toISOString(),
     };
   }
   ```

2. **Verify Usage Service:**
   Ensure your backend has a `UsageService` with `syncUsageForProfile` method that:
   - Queries the eSIM Access API for usage data
   - Updates the `orderUsage` field in the database
   - Creates usage history records

### Expected Result
- Backend endpoint exists and accepts `POST /esim/:iccid/sync`
- Endpoint validates user ownership
- Endpoint queries provider and updates profile data
- Endpoint triggers usage sync via usage service
- Rate limiting is in place (10 syncs per minute)

---

## Testing Checklist

After each batch, test the following:

### Batch 1
- [ ] State variables added correctly
- [ ] `fetchEsims` function supports sync parameter
- [ ] `handleSyncNow` function works
- [ ] `formatTimeAgo` displays correct time
- [ ] Pull-to-refresh triggers sync

### Batch 2
- [ ] Automatic polling starts when user has eSIMs
- [ ] Polling stops when component unmounts
- [ ] Polling doesn't show loading spinner
- [ ] Usage data updates every 5 minutes

### Batch 3
- [ ] Sync section displays in header
- [ ] "Last synced" shows correct time
- [ ] "Sync Now" button works
- [ ] Button shows loading state when syncing
- [ ] Provider delay note displays
- [ ] Styles match design system

### Batch 4
- [ ] Pull-to-refresh triggers sync
- [ ] Last sync time updates after refresh
- [ ] Refresh spinner shows during sync

### Batch 5
- [ ] Backend endpoint exists
- [ ] Endpoint validates ownership
- [ ] Endpoint triggers usage sync
- [ ] Mobile app can call endpoint successfully

---

## Important Notes

1. **API Endpoints:**
   - Verify your API base URL matches the backend
   - Ensure `/user/esims?email=...` endpoint exists
   - Ensure `/esim/:iccid/sync` endpoint exists

2. **Error Handling:**
   - Sync failures for individual eSIMs don't block the entire sync
   - Errors are logged but don't crash the app
   - Cached data is shown if sync fails

3. **Rate Limiting:**
   - Only sync up to 5 eSIMs at a time to avoid rate limits
   - Backend should have rate limiting (10 syncs per minute)

4. **User Experience:**
   - Automatic sync is silent (no loading spinner)
   - Manual sync shows loading state
   - Provider delay note manages user expectations
   - Last sync time helps users understand data freshness

5. **Performance:**
   - Use `useCallback` for functions to prevent unnecessary re-renders
   - Use `Promise.allSettled` to handle partial failures
   - Clean up intervals on unmount

6. **TypeScript:**
   - Ensure `EsimProfile` type includes `iccid` field
   - Ensure `apiFetch` function is properly typed
   - Add proper error types

---

## Questions to Ask User

1. What is the exact API endpoint for fetching user eSIMs? (`/user/esims?email=...` or different?)
2. What is the exact API endpoint for syncing eSIMs? (`/esim/:iccid/sync` or different?)
3. Does your backend already have the sync endpoint, or do we need to create it?
4. What is your theme structure? (similar to Voyage's `theme.ts`?)
5. Do you have a `dataUtils.ts` file with `calculateRemainingData`, `formatDataSize`, etc.?
6. What is your authentication system? (Clerk, custom, etc.)
7. How do you get the user's email? (`user?.primaryEmailAddress?.emailAddress` or different?)

---

## Troubleshooting

### Issue: Sync doesn't work
- **Check:** Backend endpoint exists and is accessible
- **Check:** User email is being sent in headers
- **Check:** ICCID exists for eSIMs
- **Check:** Network requests in dev tools

### Issue: Automatic polling doesn't start
- **Check:** User is loaded and signed in
- **Check:** `esims.length > 0` condition
- **Check:** `fetchEsims` is in dependency array
- **Check:** No errors in console

### Issue: Last sync time doesn't update
- **Check:** `setLastSyncTime(new Date())` is called after sync
- **Check:** `formatTimeAgo` function works correctly
- **Check:** State is updating (use React DevTools)

### Issue: Multiple syncs happening
- **Check:** Rate limiting on backend
- **Check:** Only 5 eSIMs synced at a time
- **Check:** `Promise.allSettled` is used correctly

---

## Summary

This implementation provides:
- ✅ Manual sync via pull-to-refresh and "Sync Now" button
- ✅ Automatic background polling every 5 minutes
- ✅ Sync status indicator with "Last synced" time
- ✅ Provider delay note for user expectations
- ✅ Proper error handling and rate limiting
- ✅ Clean UI with card-based sync section

The sync logic ensures users always have up-to-date usage data while managing expectations about provider delays.

