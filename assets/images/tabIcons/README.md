# Tab Icons Guide

This directory contains icons for the bottom navigation tabs.

## Icon Specifications

- **Format**: PNG
- **Sizes**: 
  - `@1x`: 24x24px
  - `@2x`: 48x48px  
  - `@3x`: 72x72px
- **Color**: Black (#000000) on transparent background
- **Rendering**: Template mode (will be tinted by the system)

## Required Icons

### Current Icons
- ✅ `home.png` - Home tab icon
- ✅ `explore.png` - Currently used for Profile tab
- ❌ `appointments.png` - **NEEDED** - Calendar/appointment icon

## Creating the Appointments Icon

You need to create a calendar icon in three sizes:

### Option 1: Using an Icon Tool/Website

1. Visit [Heroicons](https://heroicons.com/), [Lucide Icons](https://lucide.dev/), or [Feather Icons](https://feathericons.com/)
2. Search for "calendar" or "calendar-days"
3. Download as SVG (black color)
4. Convert to PNG at the required sizes:
   - 24x24px → `appointments.png`
   - 48x48px → `appointments@2x.png`
   - 72x72px → `appointments@3x.png`

### Option 2: Using Figma

1. Create a 24x24px frame
2. Draw or import a calendar icon
3. Make it black (#000000) with transparent background
4. Export as PNG at:
   - 1x → `appointments.png`
   - 2x → `appointments@2x.png`
   - 3x → `appointments@3x.png`

### Option 3: Using ImageMagick (Command Line)

If you have an SVG calendar icon:

```bash
# Generate @1x (24x24)
magick calendar.svg -resize 24x24 appointments.png

# Generate @2x (48x48)
magick calendar.svg -resize 48x48 appointments@2x.png

# Generate @3x (72x72)
magick calendar.svg -resize 72x72 appointments@3x.png
```

### Option 4: Using SF Symbols (macOS only)

1. Open SF Symbols app (built into macOS)
2. Search for "calendar"
3. Select a calendar icon you like
4. Export as PNG at different sizes
5. Rename to `appointments.png`, `appointments@2x.png`, `appointments@3x.png`

## Design Guidelines

- **Simple**: Icons should be simple and recognizable at small sizes
- **Consistent Style**: Match the style of existing icons (line weight, detail level)
- **Clear**: Should be clearly identifiable even at @1x size
- **Black on Transparent**: Always use solid black (#000000) on transparent background
- **Template Mode**: Icons will be automatically tinted based on the active/inactive state

## Recommended Calendar Icon Style

For consistency with typical iOS/Android tab bar icons:
- Simple outline style
- 2-3px stroke weight
- Minimal details (just outline of calendar page)
- Square or slightly rounded corners
- Optional: Small grid lines inside to represent dates

## After Adding Icons

Once you create the `appointments.png` icons, update the tab configuration in:

```typescript
// src/components/app-tabs.tsx
<NativeTabs.Trigger name="appointments">
  <NativeTabs.Trigger.Label>Appointments</NativeTabs.Trigger.Label>
  <NativeTabs.Trigger.Icon
    src={require("@/assets/images/tabIcons/appointments.png")}
    renderingMode="template"
  />
</NativeTabs.Trigger>
```

## Testing

After adding the icons, test on:
- iOS Simulator (check all device sizes)
- Android Emulator
- Verify the icon tinting works correctly in active/inactive states