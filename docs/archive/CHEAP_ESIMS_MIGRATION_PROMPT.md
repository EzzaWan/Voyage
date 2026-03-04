# Migration Prompt for "Cheap eSIMs" Mobile App

This document contains detailed instructions to migrate changes from the Voyage mobile app to the Cheap eSIMs mobile app. **Please implement these changes in batches as specified below to avoid breaking the app.**

---

## BATCH 1: Profile Page - Remove Non-Functional Menu Items

### Task
Remove the "Marketing Communication" and "Delete my account" menu items from the profile page if they exist and are non-functional.

### Files to Modify
- `apps/mobile/app/profile.tsx` (or equivalent profile page)

### Implementation Steps
1. Locate the profile page component
2. Find menu items related to "Marketing Communication" and "Delete my account"
3. Remove these menu items from the menu groups
4. Ensure the profile picture uses `user.imageUrl` from Clerk (if using Clerk) with a fallback to initial letter avatar
5. Test that the profile page still renders correctly without these items

### Expected Result
- Profile page no longer shows "Marketing Communication" or "Delete my account" options
- Profile picture displays user's Google/Apple account picture if available, otherwise shows initial letter

---

## BATCH 2: Regional Icons - Setup Folder Structure

### Task
Create the folder structure and prepare files for custom regional icons. The user will provide the icon images later.

### Files to Create/Modify
- Create `apps/mobile/assets/regions/` folder
- Create `apps/mobile/assets/regions/README.md` with instructions

### Implementation Steps
1. Create the directory: `apps/mobile/assets/regions/`
2. Create a `README.md` file in that folder with the following content:

```markdown
# Regional Icons

This folder contains custom icons for regional data plans.

## Required Icons
Please place the following PNG images in this folder:
- `asia.png` - Icon for Asia region
- `europe.png` - Icon for Europe region
- `north-america.png` - Icon for North America region
- `south-america.png` - Icon for South America region
- `africa.png` - Icon for Africa region
- `oceania.png` - Icon for Oceania region
- `global.png` - Icon for Global plans

## Image Specifications
- Format: PNG
- Recommended size: 256x256px (source images)
- Display size: 32x32px (will be scaled in app)
- Background: Transparent preferred
```

3. **DO NOT** modify the main app files yet - wait for Batch 3 after user provides the icons

### Expected Result
- Folder structure created
- README file with instructions for the user to place icons

---

## BATCH 3: Regional Icons - Implement Custom Icons

### Task
Replace emoji or generic icons with custom regional icons from the `assets/regions/` folder.

### Files to Modify
- `apps/mobile/app/index.tsx` (or equivalent home/plans page)
- `apps/mobile/app/plans.tsx` (if regional icons are used there)

### Implementation Steps
1. **Define Region Type:**
   ```typescript
   type Region = {
     code: string;
     name: string;
     icon: any | null; // Image source (require() or null)
     fallbackIcon: keyof typeof Ionicons.glyphMap; // Fallback Ionicons icon
   };
   ```

2. **Import Local Icons:**
   ```typescript
   // Local region icons
   const asiaIcon = require('../assets/regions/asia.png');
   const europeIcon = require('../assets/regions/europe.png');
   const northAmericaIcon = require('../assets/regions/north-america.png');
   const southAmericaIcon = require('../assets/regions/south-america.png');
   const africaIcon = require('../assets/regions/africa.png');
   const oceaniaIcon = require('../assets/regions/oceania.png');
   const globalIcon = require('../assets/regions/global.png');
   ```

3. **Update REGIONS Array:**
   ```typescript
   const REGIONS: Region[] = [
     { code: 'asia', name: 'Asia', icon: asiaIcon, fallbackIcon: 'globe-outline' },
     { code: 'europe', name: 'Europe', icon: europeIcon, fallbackIcon: 'location-outline' },
     { code: 'north-america', name: 'North America', icon: northAmericaIcon, fallbackIcon: 'map-outline' },
     { code: 'south-america', name: 'South America', icon: southAmericaIcon, fallbackIcon: 'compass-outline' },
     { code: 'africa', name: 'Africa', icon: africaIcon, fallbackIcon: 'earth-outline' },
     { code: 'oceania', name: 'Oceania', icon: oceaniaIcon, fallbackIcon: 'water-outline' },
   ];
   ```

4. **Update Icon Rendering:**
   Replace emoji or generic icon rendering with:
   ```typescript
   <View style={styles.regionIcon}>
     {region.icon ? (
       <Image 
         source={region.icon} 
         style={styles.regionIconImage}
         resizeMode="contain"
         defaultSource={region.icon}
       />
     ) : (
       <Ionicons name={region.fallbackIcon} size={24} color={theme.colors.primary} />
     )}
   </View>
   ```

5. **Update Styles:**
   ```typescript
   regionIcon: {
     width: 48,
     height: 48,
     borderRadius: 24,
     backgroundColor: theme.colors.card,
     justifyContent: 'center',
     alignItems: 'center',
     marginRight: theme.spacing.md,
   },
   regionIconImage: {
     width: 32,
     height: 32,
   },
   ```

### Expected Result
- Regional icons display custom images instead of emojis
- Fallback to Ionicons if images are missing
- Icons are properly sized and styled

---

## BATCH 4: Global Plans Tab - Full Implementation

### Task
Implement the global plans tab/page with proper logic: fetch from GL-139, filter out 1GB 365 days plans, sort by price, format names correctly.

### Files to Modify
- `apps/mobile/app/index.tsx` (or equivalent home page)
- `apps/mobile/app/plans.tsx` (if global plans are shown there)

### Implementation Steps

1. **Add State Variables:**
   ```typescript
   const [globalPlans, setGlobalPlans] = useState<Plan[]>([]);
   const [loadingGlobalPlans, setLoadingGlobalPlans] = useState(false);
   ```

2. **Add Global Plans Fetch Function:**
   ```typescript
   const fetchGlobalPlans = async () => {
     if (globalPlans.length > 0) return; // Already loaded
     
     try {
       setLoadingGlobalPlans(true);
       // Fetch GL-139 global plans
       const plans = await apiFetch<Plan[]>(`/countries/GL-139/plans`);
       if (plans && plans.length > 0) {
         // Filter out 1GB 365 day plans
         const filtered = plans.filter(plan => {
           // Check by plan name first (most reliable) - case insensitive
           const planName = (plan.name || '').toLowerCase();
           
           // Check for "1gb" and "365" in the name
           const has1GB = planName.includes('1gb') || planName.includes('1 gb');
           const has365 = planName.includes('365') || planName.includes('365days') || planName.includes('365 days');
           
           if (has1GB && has365) {
             return false; // Exclude this plan
           }
           
           // Also check packageCode/slug for pattern like "GL-139_1_365"
           const packageCode = (plan.packageCode || plan.id || '').toLowerCase();
           if (packageCode.includes('_1_365') || packageCode.includes('-1-365')) {
             return false;
           }
           
           // Also check by volume and duration as backup
           let gb = 0;
           if (plan.volume) {
             if (plan.volume > 1000000) {
               // Bytes to GB
               gb = plan.volume / 1024 / 1024 / 1024;
             } else {
               // MB to GB
               gb = plan.volume / 1024;
             }
           }
           
           const duration = plan.duration || 0;
           const durationUnit = (plan.durationUnit || 'day').toLowerCase();
           
           // Exclude 1GB 365 day plans (with some tolerance for rounding)
           if (gb >= 0.9 && gb <= 1.1 && duration === 365 && durationUnit === 'day') {
             return false;
           }
           
           return true;
         });
         
         // Sort by price ascending
         const sorted = filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
         
         setGlobalPlans(sorted);
       }
     } catch (err) {
       console.error('Error fetching global plans:', err);
     } finally {
       setLoadingGlobalPlans(false);
     }
   };
   ```

3. **Update Tab Handler:**
   ```typescript
   const handleTabPress = async (tabId: string) => {
     setActiveTab(tabId);
     // Reset region selection when switching tabs
     if (tabId !== 'regional') {
       setSelectedRegion(null);
       setRegionCountries([]);
     }
     if (tabId === 'global') {
       // Load global plans within the tab
       await fetchGlobalPlans();
     }
   };
   ```

4. **Add Global Plans Handler:**
   ```typescript
   const handleGlobalPlanPress = (plan: Plan) => {
     router.push({
       pathname: '/plan-detail',
       params: {
         planId: plan.packageCode || plan.id || '',
         countryName: 'Global',
       },
     });
   };
   ```

5. **Render Global Plans Tab:**
   ```typescript
   {/* Global Tab Content */}
   {activeTab === 'global' && !searchQuery && (
     <>
       <Text style={styles.sectionTitle}>Global Plans</Text>
       <View style={styles.groupedList}>
         {loadingGlobalPlans ? (
           <ActivityIndicator size="small" color={theme.colors.primary} style={{ margin: 20 }} />
         ) : globalPlans.length > 0 ? (
           globalPlans.map((plan, index) => {
             const planPrice = plan.price || 0;
             const planCurrency = plan.currency || 'USD';
             
             // Format data size (handle both MB and bytes)
             let dataSize = '';
             if (plan.volume) {
               if (plan.volume > 1000000) {
                 // Bytes to GB
                 const gb = plan.volume / 1024 / 1024 / 1024;
                 dataSize = gb % 1 === 0 ? `${gb} GB` : `${gb.toFixed(1)} GB`;
               } else {
                 // MB to GB
                 const gb = plan.volume / 1024;
                 if (gb >= 1) {
                   dataSize = gb % 1 === 0 ? `${gb} GB` : `${gb.toFixed(1)} GB`;
                 } else {
                   dataSize = `${plan.volume} MB`;
                 }
               }
             }
             
             // Format duration
             const duration = plan.duration 
               ? `${plan.duration} ${plan.durationUnit === 'month' ? 'Month' : 'Day'}${plan.duration !== 1 ? 's' : ''}` 
               : '';
             
             // Plan name is just data size and duration
             const planName = dataSize && duration ? `${dataSize} ${duration}` : (dataSize || duration || 'Global Plan');
             
             return (
               <TouchableOpacity
                 key={plan.packageCode || plan.id || index}
                 style={[
                   styles.listItem,
                   index === globalPlans.length - 1 && styles.lastListItem
                 ]}
                 onPress={() => handleGlobalPlanPress(plan)}
                 activeOpacity={0.7}
               >
                 <View style={[styles.flagContainer, styles.globalIconContainer]}>
                   <Image 
                     source={globalIcon} 
                     style={styles.globalIconImage}
                     resizeMode="contain"
                   />
                 </View>
                 
                 <View style={styles.listItemContent}>
                   <Text style={styles.countryName}>{planName}</Text>
                   {planPrice > 0 && (
                     <Text style={styles.priceText}>
                       {planCurrency && planCurrency !== 'USD' 
                         ? new Intl.NumberFormat('en-US', {
                             style: 'currency',
                             currency: planCurrency.toUpperCase(),
                           }).format(convertFromCurrency(planPrice, planCurrency))
                         : formatCurrencyPrice(convert(planPrice))}
                     </Text>
                   )}
                 </View>
                 
                 <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
               </TouchableOpacity>
             );
           })
         ) : (
           <View style={styles.emptyContainer}>
             <Text style={styles.emptyText}>No global plans available</Text>
           </View>
         )}
       </View>
     </>
   )}
   ```

6. **Add Global Icon Styles:**
   ```typescript
   globalIconContainer: {
     width: 40,
     height: 40,
     borderRadius: 20,
     backgroundColor: theme.colors.card,
     justifyContent: 'center',
     alignItems: 'center',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.1,
     shadowRadius: 4,
     elevation: 3,
   },
   globalIconImage: {
     width: 32,
     height: 32,
   },
   ```

### Expected Result
- Global tab loads plans from GL-139
- 1GB 365 days plans are filtered out
- Plans are sorted by price ascending
- Plan names show only data size and duration (e.g., "5 GB 30 Days")
- Prices display without "From" prefix
- Global icon displays with drop shadow

---

## BATCH 5: Plan Detail Page - Dynamic Speed & Global Plan UI

### Task
1. Make speed display dynamic based on plan data (not hardcoded to "4G/LTE")
2. Update coverage region to use global icon for global plans
3. Format global plan names correctly

### Files to Modify
- `apps/mobile/app/plan-detail.tsx`
- `apps/mobile/src/utils/planUtils.ts` (if exists)

### Implementation Steps

1. **Add Speed Property to Plan Interface:**
   In `planUtils.ts` (or wherever Plan interface is defined):
   ```typescript
   export interface Plan {
     // ... existing properties
     speed?: string; // Speed information (e.g., "4G/LTE", "5G")
   }
   ```

2. **Update Speed Display:**
   In `plan-detail.tsx`, find the speed display section and update:
   ```typescript
   <View style={styles.statBox}>
     <Text style={styles.statLabel}>SPEED</Text>
     <Text style={styles.statValue}>{plan.speed || '4G/LTE'}</Text>
   </View>
   ```

3. **Import Global Icon:**
   ```typescript
   const globalIcon = require('../assets/regions/global.png');
   ```

4. **Detect Global Plans:**
   ```typescript
   const isGlobalPlan = params.countryName === 'Global' || 
                        plan?.packageCode?.startsWith('GL-') ||
                        plan?.locationCode?.startsWith('GL-');
   ```

5. **Update Coverage Region Section:**
   ```typescript
   {/* Coverage Region */}
   <View style={styles.section}>
     <View style={styles.sectionHeader}>
       <Ionicons name="globe-outline" size={16} color={theme.colors.textMuted} style={styles.sectionIcon} />
       <Text style={styles.sectionTitle}>COVERAGE REGION</Text>
     </View>
     
     <View style={styles.coverageCard}>
       <View style={[styles.coverageFlagContainer, isGlobalPlan && styles.globalIconContainer]}>
         {isGlobalPlan ? (
           <Image
             source={globalIcon}
             style={styles.globalIconImage}
             resizeMode="contain"
           />
         ) : !imageError && locationCode ? (
           <Image
             source={{ uri: getFlagUrl() }}
             style={styles.coverageFlag}
             resizeMode="cover"
             onError={() => setImageError(true)}
           />
         ) : (
           <Ionicons name="globe-outline" size={20} color={theme.colors.textMuted} />
         )}
       </View>
       <View style={styles.coverageInfo}>
         <Text style={styles.coverageCountry}>{isGlobalPlan ? 'Global' : getCountryName(locationCode)}</Text>
         {!isGlobalPlan && (
           <Text style={styles.coverageNetwork}>{getNetworkOperator(locationCode)}</Text>
         )}
       </View>
     </View>
   </View>
   ```

6. **Format Global Plan Names:**
   For global plans, format the display name to show only data size and duration:
   ```typescript
   const displayName = useMemo(() => {
     if (isGlobalPlan && plan) {
       // Format: "5 GB 30 Days"
       const dataSize = formatDataSize(plan.volume);
       const duration = formatValidity(plan.duration, plan.durationUnit);
       return `${dataSize} ${duration}`;
     }
     return getDisplayName(plan);
   }, [plan, isGlobalPlan]);
   ```

7. **Add Global Icon Styles:**
   ```typescript
   globalIconContainer: {
     width: 40,
     height: 40,
     borderRadius: 20,
     backgroundColor: theme.colors.card,
     justifyContent: 'center',
     alignItems: 'center',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.1,
     shadowRadius: 4,
     elevation: 3,
   },
   globalIconImage: {
     width: 32,
     height: 32,
   },
   ```

### Expected Result
- Speed displays dynamically from `plan.speed` with fallback to "4G/LTE"
- Global plans show global icon in coverage region section
- Global plans display "Global" as coverage region name
- Global plan names formatted as "X GB Y Days"

---

## BATCH 6: My eSIMs & eSIM Setup - Hide Actions for Expired/Cancelled

### Task
1. Hide "Top Up Data" button for expired/cancelled eSIMs
2. Hide troubleshooting section for expired/cancelled eSIMs
3. Update layout to match Voyage app style

### Files to Modify
- `apps/mobile/app/esim-setup.tsx`
- `apps/mobile/app/my-esims.tsx` (if it has similar functionality)

### Implementation Steps

1. **Define Expired/Cancelled Status Check:**
   In `esim-setup.tsx`:
   ```typescript
   const esimStatus = esimProfile?.esimStatus?.toUpperCase() || '';
   const isExpiredOrCanceled = esimStatus === 'EXPIRED' || 
                                esimStatus === 'UNUSED_EXPIRED' || 
                                esimStatus === 'USED_EXPIRED' || 
                                esimStatus === 'DISABLED' || 
                                esimStatus === 'CANCEL' || 
                                esimStatus === 'CANCELLED' || 
                                esimStatus === 'CANCELED';
   ```

2. **Conditionally Hide Troubleshooting Section:**
   Find the troubleshooting section and wrap it:
   ```typescript
   {!isExpiredOrCanceled && (
     <View style={styles.troubleshootingSection}>
       {/* Troubleshooting content */}
     </View>
   )}
   ```

3. **Conditionally Hide Top Up Button:**
   Find the "Top Up Data" button and wrap it:
   ```typescript
   {!isExpiredOrCanceled && (
     <TouchableOpacity
       style={styles.topUpButton}
       onPress={handleTopUp}
       activeOpacity={0.7}
     >
       <Text style={styles.topUpButtonText}>Top Up Data</Text>
     </TouchableOpacity>
   )}
   ```

4. **Update Layout to Match Voyage:**
   Review the Voyage app's `esim-setup.tsx` layout and apply similar styling:
   - Card-based sections
   - Consistent spacing
   - Status badges
   - Error/expired state handling
   - "Buy New eSIM" button for expired/cancelled states

5. **Apply Same Logic to My eSIMs Page:**
   If `my-esims.tsx` has a "Top Up" button or similar actions, apply the same conditional rendering.

### Expected Result
- "Top Up Data" button hidden for expired/cancelled eSIMs
- Troubleshooting section hidden for expired/cancelled eSIMs
- Layout matches Voyage app style
- Expired/cancelled eSIMs show appropriate status messages and "Buy New eSIM" option

---

## Testing Checklist

After each batch, test the following:

### Batch 1
- [ ] Profile page loads without errors
- [ ] Menu items removed correctly
- [ ] Profile picture displays correctly

### Batch 2
- [ ] Folder structure created
- [ ] README file exists

### Batch 3
- [ ] Regional icons display correctly
- [ ] Fallback icons work if images missing
- [ ] No bundling errors

### Batch 4
- [ ] Global tab loads plans
- [ ] 1GB 365 days plans filtered out
- [ ] Plans sorted by price
- [ ] Plan names formatted correctly
- [ ] Prices display without "From" prefix

### Batch 5
- [ ] Speed displays dynamically
- [ ] Global plans show global icon
- [ ] Coverage region shows "Global" for global plans
- [ ] Plan names formatted correctly

### Batch 6
- [ ] Top Up button hidden for expired/cancelled
- [ ] Troubleshooting hidden for expired/cancelled
- [ ] Layout matches Voyage style

---

## Notes

1. **Import Paths:** Adjust import paths based on your project structure (e.g., `../assets/regions/` vs `../../assets/regions/`)

2. **API Endpoints:** Verify that your API endpoints match (e.g., `/countries/GL-139/plans`)

3. **Theme/Colors:** Use your existing theme system - replace `theme.colors.primary` etc. with your actual theme values

4. **Currency Context:** Ensure you have a currency context similar to Voyage, or adapt the currency conversion logic

5. **Plan Utils:** If you don't have a `planUtils.ts` file, create one or add the Plan interface to an existing utils file

6. **Error Handling:** Add proper error handling and loading states as needed

7. **TypeScript:** Ensure all types are properly defined to avoid TypeScript errors

---

## Important Reminders

- **Work in batches** - Don't try to implement everything at once
- **Test after each batch** - Make sure nothing breaks before moving to the next batch
- **Backup your code** - Commit after each successful batch
- **Ask for clarification** - If any step is unclear, ask before proceeding

---

## Questions to Ask User

1. What is the exact path to the home/index page? (`app/index.tsx` or `app/home.tsx`?)
2. Do you have a `planUtils.ts` file, or should I create one?
3. What is your theme structure? (similar to Voyage's `theme.ts`?)
4. Do you have a currency context, or should I adapt the currency logic?
5. What is the exact API endpoint for fetching plans? (`/countries/{code}/plans`?)
6. Are there any existing global plan implementations I should be aware of?

