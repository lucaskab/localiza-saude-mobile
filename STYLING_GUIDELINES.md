# 🎨 Styling Guidelines with Unistyles

This document outlines the styling conventions and best practices for the Localiza Saúde mobile app using React Native Unistyles v3.

## Table of Contents

1. [Core Principles](#core-principles)
2. [File Structure](#file-structure)
3. [Theme Access](#theme-access)
4. [Spacing & Layout](#spacing--layout)
5. [Colors](#colors)
6. [Typography](#typography)
7. [Border Radius](#border-radius)
8. [Component Styling Pattern](#component-styling-pattern)
9. [Common Patterns](#common-patterns)
10. [Do's and Don'ts](#dos-and-donts)

---

## Core Principles

### ✅ Always Use Theme Tokens

- **NEVER** use hardcoded numbers for spacing
- **NEVER** use hardcoded color values
- **ALWAYS** use theme tokens for consistency
- **ALWAYS** use the `gap()` function for all spacing values

### ❌ Wrong Way

```typescript
const styles = StyleSheet.create({
  container: {
    padding: 16,              // ❌ Hardcoded number
    backgroundColor: "#3b9a9d", // ❌ Hardcoded color
    borderRadius: 12,          // ❌ Hardcoded radius
    gap: 8,                    // ❌ Hardcoded spacing
  },
});
```

### ✅ Right Way

```typescript
import { StyleSheet } from "react-native-unistyles";

// StyleSheet defined OUTSIDE component
const styles = StyleSheet.create((theme) => ({
  container: {
    padding: theme.gap(2),           // ✅ Using gap function
    backgroundColor: theme.colors.primary, // ✅ Using color token
    borderRadius: theme.radius.lg,   // ✅ Using radius token
    gap: theme.gap(1),               // ✅ Using gap function
  },
}));

export function MyComponent() {
  const { theme } = useUnistyles();
  
  return <View style={styles.container}>...</View>;
}
```

---

## File Structure

### Component First, Styles Below

**ALWAYS** organize your files with this structure:

1. **Imports** at the top
2. **Component function** in the middle
3. **StyleSheet** at the bottom (after the component)

This makes the component logic easy to read first, with styles as reference below.

### ✅ Correct File Structure

```typescript
import { View, Text } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

// 1. Component comes FIRST
export function MyComponent() {
  const { theme } = useUnistyles();
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello</Text>
    </View>
  );
}

// 2. Styles come AFTER (below the component)
const styles = StyleSheet.create((theme) => ({
  container: {
    padding: theme.gap(2),
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 20,
    color: theme.colors.foreground,
  },
}));
```

### ❌ Wrong File Structure

```typescript
import { View, Text } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

// ❌ DON'T put styles before component
const styles = StyleSheet.create((theme) => ({
  container: {
    padding: theme.gap(2),
  },
}));

export function MyComponent() {
  // Component after styles - WRONG!
  return <View style={styles.container}>...</View>;
}
```

### Why This Order?

- ✅ **Better Readability**: See the component logic first
- ✅ **Easier Navigation**: Component is at the top of the file
- ✅ **Standard Pattern**: Consistent across all files
- ✅ **Logical Flow**: Understand what the component does, then see how it's styled

---

## Theme Access

### Import and Setup

```typescript
import { View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

// Define styles OUTSIDE the component
const styles = StyleSheet.create((theme) => ({
  container: {
    backgroundColor: theme.colors.background,
    padding: theme.gap(2),
  },
  // ... more styles
}));

export function MyComponent() {
  const { theme } = useUnistyles();
  
  return <View style={styles.container}>...</View>;
}
```

### Why Define Styles Outside?

- ✅ **Better Performance**: StyleSheet is created once, not on every render
- ✅ **Cleaner Code**: Component logic separate from styles
- ✅ **Automatic Theme Updates**: Unistyles handles theme changes automatically
- ✅ **No useMemo needed**: Unistyles' StyleSheet is already optimized

---

## Spacing & Layout

### The `gap()` Function

The `gap()` function is the **ONLY** way to define spacing values. It uses a base multiplier of 8.

```typescript
theme.gap(1)   // = 8px
theme.gap(2)   // = 16px
theme.gap(3)   // = 24px
theme.gap(4)   // = 32px
theme.gap(0.5) // = 4px
theme.gap(1.5) // = 12px
```

### Usage Examples

```typescript
const styles = useMemo(
  () =>
    StyleSheet.create({
      // Padding
      container: {
        padding: theme.gap(2),           // 16px all sides
        paddingHorizontal: theme.gap(3), // 24px left/right
        paddingVertical: theme.gap(4),   // 32px top/bottom
        paddingTop: theme.gap(6),        // 48px top
      },
      
      // Margin
      section: {
        margin: theme.gap(2),
        marginBottom: theme.gap(3),
      },
      
      // Gap (flexbox spacing)
      row: {
        flexDirection: "row",
        gap: theme.gap(2),               // 16px between children
      },
      
      // Dimensions
      icon: {
        width: theme.gap(5),             // 40px
        height: theme.gap(5),            // 40px
      },
    }),
  [theme]
);
```

### Common Spacing Values

| Value | Result | Usage |
|-------|--------|-------|
| `theme.gap(0.25)` | 2px | Minimal spacing |
| `theme.gap(0.5)` | 4px | Very tight spacing |
| `theme.gap(1)` | 8px | Tight spacing, small gaps |
| `theme.gap(2)` | 16px | Default spacing, padding |
| `theme.gap(3)` | 24px | Medium spacing |
| `theme.gap(4)` | 32px | Large spacing |
| `theme.gap(6)` | 48px | Extra large spacing |
| `theme.gap(8)` | 64px | Section spacing |

---

## Colors

### Available Color Tokens

#### Base Colors
```typescript
theme.colors.background          // Page background
theme.colors.foreground          // Primary text color
```

#### Surface Colors
```typescript
theme.colors.surfacePrimary      // Cards, containers
theme.colors.surfaceSecondary    // Secondary surfaces
theme.colors.surfaceMuted        // Muted backgrounds
theme.colors.surfaceAccent       // Accent surfaces
theme.colors.surfaceInput        // Input backgrounds
```

#### Palette Colors

**Teal:**
```typescript
theme.colors.teal600             // Primary teal
theme.colors.teal50              // Light teal background
```

**Coral/Peach:**
```typescript
theme.colors.coral500            // Coral accent
theme.colors.peach50             // Peach background
```

**Gray:**
```typescript
theme.colors.gray900             // Darkest gray
theme.colors.gray500             // Medium gray
theme.colors.gray300             // Light gray
theme.colors.gray50              // Lightest gray
```

**Red:**
```typescript
theme.colors.red600              // Error/destructive red
```

**White:**
```typescript
theme.colors.white               // Pure white (or dark in dark mode)
```

#### Semantic Colors
```typescript
theme.colors.primary             // Primary brand color
theme.colors.primaryForeground   // Text on primary
theme.colors.secondary           // Secondary brand color
theme.colors.secondaryForeground // Text on secondary
theme.colors.muted               // Muted backgrounds
theme.colors.mutedForeground     // Muted text
theme.colors.accent              // Accent highlights
theme.colors.accentForeground    // Text on accent
theme.colors.destructive         // Destructive actions
theme.colors.destructiveForeground // Text on destructive
```

#### Border & Effects
```typescript
theme.colors.border              // Standard borders
theme.colors.borderSubtle        // Subtle borders
theme.colors.input               // Input borders
theme.colors.ring                // Focus rings
```

#### Chart Colors
```typescript
theme.colors.chart1              // Chart color 1
theme.colors.chart2              // Chart color 2
theme.colors.chart3              // Chart color 3
theme.colors.chart4              // Chart color 4
theme.colors.chart5              // Chart color 5
```

### Color Usage Examples

```typescript
const styles = useMemo(
  () =>
    StyleSheet.create({
      // Backgrounds
      container: {
        backgroundColor: theme.colors.background,
      },
      card: {
        backgroundColor: theme.colors.surfacePrimary,
      },
      
      // Text
      title: {
        color: theme.colors.foreground,
      },
      subtitle: {
        color: theme.colors.mutedForeground,
      },
      
      // Borders
      bordered: {
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      
      // Semantic
      primaryButton: {
        backgroundColor: theme.colors.primary,
      },
      primaryButtonText: {
        color: theme.colors.primaryForeground,
      },
      
      // Opacity variants (for hover/pressed states)
      pressedState: {
        backgroundColor: `${theme.colors.destructive}1A`, // 10% opacity
      },
    }),
  [theme]
);
```

### Opacity Modifiers

Add hex opacity values to colors for transparency:

```typescript
`${theme.colors.primary}1A`      // 10% opacity
`${theme.colors.primary}33`      // 20% opacity
`${theme.colors.primary}4D`      // 30% opacity
`${theme.colors.primary}80`      // 50% opacity
`${theme.colors.primary}B3`      // 70% opacity
`${theme.colors.primary}E6`      // 90% opacity
```

---

## Typography

### Font Sizes

Use numeric values for font sizes (no tokens available yet):

```typescript
const styles = useMemo(
  () =>
    StyleSheet.create({
      // Headers
      h1: {
        fontSize: 28,
        fontWeight: "500",
        color: theme.colors.foreground,
      },
      h2: {
        fontSize: 24,
        fontWeight: "500",
        color: theme.colors.foreground,
      },
      h3: {
        fontSize: 20,
        fontWeight: "500",
        color: theme.colors.foreground,
      },
      h4: {
        fontSize: 18,
        fontWeight: "500",
        color: theme.colors.foreground,
      },
      
      // Body text
      body: {
        fontSize: 16,
        fontWeight: "400",
        color: theme.colors.foreground,
      },
      bodySmall: {
        fontSize: 14,
        fontWeight: "400",
        color: theme.colors.foreground,
      },
      caption: {
        fontSize: 12,
        fontWeight: "400",
        color: theme.colors.mutedForeground,
      },
      
      // Labels and buttons
      label: {
        fontSize: 16,
        fontWeight: "500",
        color: theme.colors.foreground,
      },
      button: {
        fontSize: 16,
        fontWeight: "500",
      },
    }),
  [theme]
);
```

### Font Weights

- `"400"` - Normal text
- `"500"` - Medium weight (headings, labels, buttons)
- `"600"` - Semi-bold (emphasis)
- `"700"` - Bold (strong emphasis)

---

## Border Radius

Use radius tokens for consistent corner rounding:

```typescript
theme.radius.sm   // 8px  - Small radius
theme.radius.md   // 10px - Medium radius
theme.radius.lg   // 12px - Large radius (default)
theme.radius.xl   // 16px - Extra large radius
```

### Usage Examples

```typescript
const styles = useMemo(
  () =>
    StyleSheet.create({
      button: {
        borderRadius: theme.radius.lg,    // Standard button
      },
      card: {
        borderRadius: theme.radius.lg,    // Cards
      },
      pill: {
        borderRadius: theme.radius.xl,    // Pill-shaped
      },
      avatar: {
        borderRadius: 40,                 // Circular (use actual value)
      },
    }),
  [theme]
);
```

---

## Component Styling Pattern

### Standard Pattern

Every component should follow this structure:

```typescript
import { View, Text } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

// ✅ Define styles OUTSIDE the component
const styles = StyleSheet.create((theme) => ({
  container: {
    padding: theme.gap(2),
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: "500",
    color: theme.colors.foreground,
    marginBottom: theme.gap(1),
  },
}));

export function MyComponent() {
  const { theme } = useUnistyles();
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Title</Text>
    </View>
  );
}
```

### ⚠️ Important Notes

- **ALWAYS** use `StyleSheet` from `react-native-unistyles`, NOT from `react-native`
- **ALWAYS** define styles outside the component
- **NO** `useMemo` needed - Unistyles handles optimization
- Access theme only when you need dynamic values in JSX (like icon colors)

### Dynamic Styles Based on Props

For dynamic styles, create helper functions or use inline styles:

```typescript
import { Pressable } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

const styles = StyleSheet.create((theme) => ({
  buttonBase: {
    borderRadius: theme.radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  buttonSecondary: {
    backgroundColor: theme.colors.secondary,
  },
  buttonLarge: {
    padding: theme.gap(3),
  },
  buttonSmall: {
    padding: theme.gap(2),
  },
}));

export function MyButton({ variant, size }: Props) {
  return (
    <Pressable 
      style={[
        styles.buttonBase,
        variant === "primary" ? styles.buttonPrimary : styles.buttonSecondary,
        size === "large" ? styles.buttonLarge : styles.buttonSmall,
      ]}
    >
      ...
    </Pressable>
  );
}
```

---

## Common Patterns

### Card Component

```typescript
const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.surfacePrimary,
    borderRadius: theme.radius.lg,
    padding: theme.gap(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.gap(2),
  },
}));
```

### Header Section

```typescript
const styles = StyleSheet.create((theme) => ({
  header: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.gap(3),
    paddingTop: theme.gap(6),
    paddingBottom: theme.gap(4),
    borderBottomLeftRadius: theme.radius.xl,
    borderBottomRightRadius: theme.radius.xl,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "500",
    color: theme.colors.primaryForeground,
    marginBottom: theme.gap(3),
  },
}));
```

### List Item

```typescript
const styles = StyleSheet.create((theme) => ({
  listItem: {
    backgroundColor: theme.colors.surfacePrimary,
    borderRadius: theme.radius.lg,
    padding: theme.gap(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(2),
  },
  listItemPressed: {
    backgroundColor: theme.colors.secondary,
    opacity: 0.5,
  },
}));
```

### Icon Container

```typescript
const styles = StyleSheet.create((theme) => ({
  iconContainer: {
    width: theme.gap(5),              // 40px
    height: theme.gap(5),             // 40px
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
}));
```

### Button with Custom Styles

```typescript
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Button } from "@/components/ui/button";

const styles = StyleSheet.create((theme) => ({
  customButton: {
    marginTop: theme.gap(3),
    width: "100%",
  },
}));

export function MyScreen() {
  const { theme } = useUnistyles();
  
  return (
    <Button 
      variant="secondary" 
      size="sm" 
      style={styles.customButton}
    >
      Click Me
    </Button>
  );
}
```

---

## Do's and Don'ts

### ✅ DO

```typescript
// ✅ Use gap() for all spacing
padding: theme.gap(2)
margin: theme.gap(3)
gap: theme.gap(1)

// ✅ Use color tokens
backgroundColor: theme.colors.primary
color: theme.colors.foreground

// ✅ Use radius tokens
borderRadius: theme.radius.lg

// ✅ Use Unistyles StyleSheet outside component
const styles = StyleSheet.create((theme) => ({...}));

// ✅ Add opacity to colors when needed
backgroundColor: `${theme.colors.primary}1A`

// ✅ Use semantic color names
color: theme.colors.mutedForeground

// ✅ Import StyleSheet from react-native-unistyles
import { StyleSheet } from "react-native-unistyles";
```

### ❌ DON'T

```typescript
// ❌ Don't use hardcoded numbers
padding: 16
margin: 24
gap: 8

// ❌ Don't use hardcoded colors
backgroundColor: "#3b9a9d"
color: "#1a2b3c"

// ❌ Don't use hardcoded radius
borderRadius: 12

// ❌ Don't use React Native's StyleSheet
import { StyleSheet } from "react-native"; // Wrong!

// ❌ Don't use rgba() - use hex with opacity
backgroundColor: "rgba(59, 154, 157, 0.1)" // Use hex instead

// ❌ Don't use generic color names when semantic ones exist
color: theme.colors.gray500  // Use theme.colors.mutedForeground instead

// ❌ Don't create styles inside component
function MyComponent() {
  const styles = StyleSheet.create((theme) => ({...})); // Wrong!
}
```

---

## Spacing Reference

### Component Spacing

```typescript
// Buttons
padding: theme.gap(2)           // Default button padding
height: 56                      // Use fixed heights for buttons

// Cards
padding: theme.gap(2)           // Small card
padding: theme.gap(3)           // Medium card
padding: theme.gap(4)           // Large card

// Sections
paddingVertical: theme.gap(3)   // Section vertical padding
paddingHorizontal: theme.gap(3) // Section horizontal padding
gap: theme.gap(2)               // Between section items

// Lists
gap: theme.gap(1)               // Between list items (tight)
gap: theme.gap(2)               // Between list items (comfortable)

// Icon containers
width: theme.gap(5)             // 40px icon container
height: theme.gap(5)            // 40px icon container
padding: theme.gap(1)           // Icon padding
```

---

## Color Reference

### When to Use Each Color

| Color Token | Usage |
|-------------|-------|
| `background` | Main page background |
| `foreground` | Primary text, headings |
| `surfacePrimary` | Cards, modals, elevated surfaces |
| `surfaceSecondary` | Secondary surfaces, subtle backgrounds |
| `surfaceMuted` | Disabled states, inactive elements |
| `surfaceInput` | Text input backgrounds |
| `primary` | Primary actions, brand color |
| `primaryForeground` | Text on primary background |
| `secondary` | Secondary actions, highlights |
| `secondaryForeground` | Text on secondary |
| `muted` | Muted backgrounds |
| `mutedForeground` | Secondary text, descriptions |
| `accent` | Accent highlights, badges |
| `accentForeground` | Text on accent |
| `destructive` | Delete, logout, errors |
| `destructiveForeground` | Text on destructive |
| `border` | Card borders, dividers |
| `borderSubtle` | Very subtle borders |

---

## Complete Example

Here's a complete example following all guidelines:

```typescript
import { View, Text, Pressable } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Heart } from "lucide-react-native";

// ✅ Styles defined OUTSIDE component
const styles = StyleSheet.create((theme) => ({
  // Container
  container: {
    backgroundColor: theme.colors.surfacePrimary,
    borderRadius: theme.radius.lg,
    padding: theme.gap(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.gap(2),
  },
  
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(2),
  },
  
  // Icon
  iconContainer: {
    width: theme.gap(5),
    height: theme.gap(5),
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  
  // Text
  title: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.foreground,
  },
  description: {
    fontSize: 14,
    color: theme.colors.mutedForeground,
    marginTop: theme.gap(0.5),
  },
  
  // Button
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    padding: theme.gap(2),
    alignItems: "center",
    marginTop: theme.gap(2),
  },
  buttonPressed: {
    backgroundColor: `${theme.colors.primary}B3`,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.primaryForeground,
  },
}));

export function ExampleCard() {
  const { theme } = useUnistyles();
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Heart size={20} color={theme.colors.primary} strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Card Title</Text>
          <Text style={styles.description}>Card description text</Text>
        </View>
      </View>
      
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
      >
        <Text style={styles.buttonText}>Action</Text>
      </Pressable>
    </View>
  );
}
```

---

## Quick Reference

### Must-Follow Rules

1. ✅ **Always** use `StyleSheet` from `react-native-unistyles` (not `react-native`)
2. ✅ **Always** define styles OUTSIDE the component
3. ✅ **Always** place styles BELOW the component (component first, styles after)
4. ✅ **Always** use `theme.gap()` for spacing
5. ✅ **Always** use `theme.colors.*` for colors
6. ✅ **Always** use `theme.radius.*` for border radius
7. ✅ **Never** use hardcoded numbers for spacing
8. ✅ **Never** use hardcoded color hex values
9. ✅ **Never** use hardcoded border radius values
10. ✅ **Never** use `useMemo` for styles (not needed with Unistyles)
11. ✅ **Never** create styles inside the component function
12. ✅ **Never** place styles before the component

### Common Spacing Values

- `theme.gap(0.5)` → 4px
- `theme.gap(1)` → 8px
- `theme.gap(2)` → 16px
- `theme.gap(3)` → 24px
- `theme.gap(4)` → 32px
- `theme.gap(6)` → 48px

### Most Used Colors

- Text: `theme.colors.foreground` / `theme.colors.mutedForeground`
- Background: `theme.colors.background`
- Cards: `theme.colors.surfacePrimary`
- Primary: `theme.colors.primary` + `theme.colors.primaryForeground`
- Borders: `theme.colors.border`

---

## Questions?

If you're unsure about which token to use:

1. Check this document first
2. Look at existing components (e.g., `login.tsx`, `profile.tsx`)
3. Check the theme definition in `src/styles/unistyles.ts`

**Remember:** Consistency is key! Following these guidelines ensures a cohesive design system across the entire app.

---

## File Organization Checklist

When creating or reviewing a component file, ensure:

- [ ] Imports are at the top
- [ ] Component function is defined after imports
- [ ] Component is exported (default or named export)
- [ ] StyleSheet is defined AFTER the component
- [ ] StyleSheet uses `StyleSheet.create((theme) => ({...}))`
- [ ] All spacing uses `theme.gap()`
- [ ] All colors use `theme.colors.*`
- [ ] No hardcoded values anywhere

**File Order:**
1. Imports
2. Component
3. Styles

**Always!**