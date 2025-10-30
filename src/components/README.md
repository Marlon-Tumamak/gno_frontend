# Skeleton Loader Component

A comprehensive skeleton loading component that matches the design and vibe of your trucking management application. This component provides loading states for all major pages with smooth animations and consistent styling.

## Features

- **Multiple Variants**: Supports 7 different page layouts (analytics, dashboard, accounts, revenue, drivers, trips, upload)
- **Consistent Design**: Matches your app's color scheme, rounded corners, and modern aesthetic
- **Smooth Animations**: Uses CSS animations for a polished loading experience
- **Responsive**: Adapts to different screen sizes with responsive grid layouts
- **Customizable**: Easy to extend and modify for new page types

## Usage

### Basic Usage

```tsx
import SkeletonLoader from '@/components/SkeletonLoader';

// Show analytics page skeleton
<SkeletonLoader variant="analytics" />

// Show dashboard page skeleton
<SkeletonLoader variant="dashboard" />

// Show accounts page skeleton
<SkeletonLoader variant="accounts" />
```

### With Loading State

```tsx
import { useState, useEffect } from 'react';
import SkeletonLoader from '@/components/SkeletonLoader';

function MyPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    // Simulate API call
    fetchData().then((result) => {
      setData(result);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <SkeletonLoader variant="analytics" />;
  }

  return (
    <div>
      {/* Your actual page content */}
    </div>
  );
}
```

### Using the Example Wrapper

```tsx
import SkeletonExample from '@/components/SkeletonExample';

function MyPage() {
  const [loading, setLoading] = useState(true);

  return (
    <SkeletonExample variant="analytics" loading={loading}>
      {/* Your page content */}
    </SkeletonExample>
  );
}
```

## Available Variants

### 1. Analytics (`variant="analytics"`)
- Header section with title and subtitle
- Account entries cards grid (8 colorful cards)
- Monthly financials section with 3 metric cards
- Recent trips summary with list items
- Active drivers and fleet trucks sections

### 2. Dashboard (`variant="dashboard"`)
- Header section
- 4 metric cards grid
- 2 chart sections with placeholder areas
- Clean, organized layout

### 3. Accounts (`variant="accounts"`)
- Header section
- Filter controls
- Data table with headers and rows
- Perfect for list/table pages

### 4. Revenue (`variant="revenue"`)
- Header section
- 3 revenue metric cards
- Large chart area
- Revenue data table

### 5. Drivers (`variant="drivers"`)
- Header section
- 4 driver statistics cards
- Drivers list with avatars

### 6. Trips (`variant="trips"`)
- Header section
- 3 trip statistics cards
- Trips list with detailed items

### 7. Upload (`variant="upload"`)
- Header section
- Upload drop zone area
- Instructions list with bullet points

## Customization

### Adding Custom Styles

```tsx
<SkeletonLoader 
  variant="analytics" 
  className="my-custom-class" 
/>
```

### Creating New Variants

To add a new variant, extend the `SkeletonLoaderProps` interface and add a new case in the `renderSkeleton()` function:

```tsx
// Add to interface
interface SkeletonLoaderProps {
  variant?: 'analytics' | 'dashboard' | 'accounts' | 'revenue' | 'drivers' | 'trips' | 'upload' | 'new-variant';
  className?: string;
}

// Add new skeleton component
const NewVariantSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
    {/* Your skeleton layout */}
  </div>
);

// Add to switch statement
case 'new-variant':
  return <NewVariantSkeleton />;
```

## Design Principles

The skeleton loader follows these design principles:

1. **Consistency**: Uses the same color palette, spacing, and rounded corners as your main app
2. **Hierarchy**: Maintains proper visual hierarchy with appropriate skeleton sizes
3. **Animation**: Smooth pulse animations for a polished feel
4. **Accessibility**: Proper contrast and readable placeholder elements
5. **Performance**: Lightweight with minimal DOM elements

## Color Scheme

The skeleton uses these colors to match your app:

- **Background**: `bg-gradient-to-br from-slate-50 to-slate-100`
- **Cards**: `bg-white` with `rounded-2xl` corners
- **Skeleton Elements**: `bg-gray-300` for subtle loading effect
- **Accent Colors**: Various colors for different card types (blue, red, purple, green, orange)

## Animation

The skeleton uses CSS `animate-pulse` for smooth loading animations. You can customize the animation by modifying the CSS classes or adding custom animations.

## Integration Tips

1. **Replace Loading Spinners**: Use skeleton loaders instead of simple spinners for better UX
2. **Match Content Structure**: The skeleton should closely match your actual content layout
3. **Loading States**: Show skeleton during initial page load and data fetching
4. **Error Handling**: Consider showing skeleton while retrying failed requests

## Examples in Your App

Here's how you might integrate it into your existing pages:

```tsx
// In your analytics page
if (loading) {
  return <SkeletonLoader variant="analytics" />;
}

// In your accounts page
if (loading) {
  return <SkeletonLoader variant="accounts" />;
}

// In your revenue page
if (loading) {
  return <SkeletonLoader variant="revenue" />;
}
```

This skeleton loader will provide a much better user experience compared to simple loading spinners, giving users a preview of the content structure while data is being fetched.
