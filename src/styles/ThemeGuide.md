# Pictionary Color Theming Guide

## Overview

This guide provides instructions for using the Pictionary theme system to maintain consistent styling across the application. The theme is defined in `src/styles/theme.js` and provides a comprehensive set of colors, shadows, and border radii.

## Color Palette

The color palette is organized into several categories:

### Primary Colors

These are the main brand colors, with the primary red (`#FF5252`) being the signature color of Pictionary.

```jsx
// Example usage
import theme from '../styles/theme';

// Primary red
<button className="bg-red-500 hover:bg-red-600 text-white">
  Save
</button>
```

### Neutral Colors

Used for text, backgrounds, and borders. These provide a clean, modern look and ensure proper contrast.

```jsx
// Example usage with Tailwind classes
<div className="bg-gray-50 dark:bg-gray-900">  // Light/dark background
  <p className="text-gray-900 dark:text-white">  // Primary text
    Main content
  </p>
  <p className="text-gray-600 dark:text-gray-300">  // Secondary text
    Supporting information
  </p>
</div>
```

### Accent Colors

Use these for highlighting UI elements, categories, or to add visual interest.

```jsx
// Example usage with inline styles
<span style={{ backgroundColor: theme.accent.blue.light, color: theme.accent.blue.dark }}>
  New feature
</span>
```

### Semantic Colors

These convey meaning and should be used consistently for user feedback.

```jsx
// Success message
<div className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 p-4 rounded-md">
  Your pin was successfully created!
</div>

// Error message
<div className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 p-4 rounded-md">
  There was an error uploading your image.
</div>
```

## Dark Mode

All components should support dark mode. Use Tailwind's dark mode classes to ensure proper contrast and readability.

```jsx
// Dark mode example
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  <h2 className="text-xl font-bold">Profile Settings</h2>
  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
    Content goes here
  </div>
</div>
```

## Shadows

Use shadows to create depth and hierarchy in the UI.

```jsx
// Example with Tailwind classes
<div className="shadow-sm hover:shadow-md transition-shadow duration-300">
  Card content
</div>

// Example with inline styles
<div style={{ boxShadow: theme.shadows.lg }}>
  Modal content
</div>
```

## Border Radius

Consistent border radius helps maintain a cohesive look.

```jsx
// Rounded corners for cards
<div className="rounded-lg overflow-hidden">
  Card content
</div>

// Fully rounded for buttons or pills
<button className="rounded-full px-4 py-2">
  Follow
</button>
```

## Component-Specific Guidelines

### Buttons

- Primary buttons: Use the primary red color
- Secondary buttons: Use neutral colors with borders
- Disabled state: Use lower opacity

```jsx
// Primary button
<button className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-full">
  Save
</button>

// Secondary button
<button className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium py-2 px-4 rounded-full">
  Cancel
</button>
```

### Cards

- Use subtle shadows and rounded corners
- Increase shadow on hover for interactive cards

```jsx
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
  <img className="rounded-t-lg" src="image.jpg" alt="Card image" />
  <div className="p-4">
    <h3 className="text-gray-900 dark:text-white font-medium">Card Title</h3>
    <p className="text-gray-600 dark:text-gray-300 text-sm">Card description</p>
  </div>
</div>
```

### Forms

- Use consistent styling for inputs
- Clearly indicate focus and error states

```jsx
<input 
  type="text" 
  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-300 dark:focus:ring-red-700 focus:border-red-500 dark:focus:border-red-500 dark:bg-gray-800 dark:text-white"
  placeholder="Search..."
/>
```

## Implementation Tips

1. **Consistency is key**: Use the same colors for the same purposes throughout the app
2. **Contrast matters**: Ensure text has sufficient contrast against its background
3. **Use semantic colors meaningfully**: Don't use error red for non-error states
4. **Test in both light and dark modes**: Ensure all components look good in both modes
5. **Use CSS variables for dynamic theming**: Consider converting theme values to CSS variables for runtime theme switching

## Example: Theme Integration with Tailwind

To fully integrate the theme with Tailwind CSS, extend your `tailwind.config.js`:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF1F1',
          100: '#FFE2E2',
          200: '#FFC9C9',
          300: '#FFA8A8',
          400: '#FF8080',
          500: '#FF5252', // Main primary color
          600: '#FF3838',
          700: '#FF1F1F',
          800: '#E60000',
          900: '#CC0000',
        },
        // Add other colors as needed
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  darkMode: 'class', // or 'media' for OS-level preference
};
```

This allows you to use theme colors directly with Tailwind classes like `bg-primary-500` or `text-primary-900`.
