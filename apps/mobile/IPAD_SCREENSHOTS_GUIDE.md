# How to Create iPad Screenshots Without an iPad

## Option 1: iOS Simulator (Mac) - Recommended

1. **Open Xcode** (free from Mac App Store)
2. **Open Simulator:**
   - Xcode → Window → Devices and Simulators
   - Or press `Cmd + Shift + 2`
3. **Select iPad:**
   - Click "+" to add device
   - Choose "iPad Pro (12.9-inch) (6th generation)" or similar
   - Wait for it to boot
4. **Install Your App:**
   - Build your app for simulator
   - Or use Expo Go if you're using Expo
5. **Take Screenshots:**
   - Navigate to the screens you want
   - Press `Cmd + S` to save screenshot
   - Or: Device → Screenshot
   - Screenshots save to Desktop automatically
6. **Crop/Resize if needed:**
   - Required size: **2048 x 2732 pixels**
   - Simulator might give you slightly different size
   - Use Preview (Mac) or any image editor to resize

## Option 2: Resize iPhone Screenshots

If you have iPhone screenshots, you can resize them:

1. **Use Online Tool:**
   - Go to https://www.iloveimg.com/resize-image
   - Upload your iPhone screenshot
   - Set dimensions: 2048 x 2732 pixels
   - Download resized image

2. **Use Preview (Mac):**
   - Open screenshot in Preview
   - Tools → Adjust Size
   - Set width: 2048 pixels
   - Height will auto-adjust (maintain aspect ratio)
   - Then crop to 2048 x 2732

3. **Use Photoshop/GIMP:**
   - Create new canvas: 2048 x 2732 pixels
   - Paste your iPhone screenshot
   - Scale and position appropriately
   - Add padding/background if needed

## Option 3: Design Tool Mockups

Use design tools to create iPad mockups:

1. **Figma/Sketch:**
   - Create frame: 2048 x 2732 pixels
   - Import your app screens
   - Adjust layout for iPad
   - Export as PNG

2. **Online Mockup Tools:**
   - https://mockuphone.com
   - https://screenshots.pro
   - Upload your iPhone screens, select iPad Pro 12.9"

## Option 4: Expo/React Native Tools

If using Expo:

```bash
# Take screenshots programmatically
npx expo install expo-screen-capture
```

Or use EAS Build with simulator.

## Required Screenshots

You need at least **3 screenshots** for iPad Pro 12.9":

1. **Homepage/Country Selection** - Main browsing screen
2. **Plan Details** - Showing eSIM plan information
3. **Checkout/My eSIMs** - Purchase flow or account management

## Quick Fix: Use iPhone Screenshots (Resized)

**Fastest method if you're in a hurry:**

1. Take your best 3 iPhone screenshots
2. Go to https://www.iloveimg.com/resize-image
3. Resize each to 2048 x 2732 pixels
4. Upload to App Store Connect

**Note:** The aspect ratio will be different, so you might need to:
- Add padding/background color
- Or crop intelligently to show the best part

## Screenshot Tips

- **Use the same screenshots** you used for iPhone (just resized)
- **Ensure text is readable** at the larger size
- **Keep important content centered** (may be cropped differently)
- **Use high-quality images** (no pixelation)


