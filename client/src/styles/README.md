# CSS Variables & Global Styles Documentation

## Overview

This project uses a comprehensive CSS variable system for consistent styling across the Learning Management System. The variables are organized into logical groups and provide a scalable design system.

## File Structure

```
client/src/styles/
├── variable.css    # CSS Variables & Design System
├── global.css      # Global Styles & Component Styles
└── README.md       # This documentation
```

## CSS Variables Usage

### Color Variables

```css
/* Primary Colors */
var(--color-primary)           /* #f7931e - Main orange */
var(--color-primary-light)     /* #ffb366 - Light orange */
var(--color-primary-dark)      /* #e67e00 - Dark orange */
var(--color-primary-50)        /* #fff7ed - Very light orange */
var(--color-primary-100)       /* #ffedd5 - Light orange background */

/* Status Colors */
var(--color-success)           /* #10b981 - Success green */
var(--color-error)             /* #ef4444 - Error red */
var(--color-warning)           /* #f59e0b - Warning yellow */
var(--color-info)              /* #3b82f6 - Info blue */

/* Neutral Colors */
var(--color-gray-50)           /* #f9fafb - Lightest gray */
var(--color-gray-100)          /* #f3f4f6 - Light gray */
var(--color-gray-500)          /* #6b7280 - Medium gray */
var(--color-gray-900)          /* #111827 - Darkest gray */
```

### Typography Variables

```css
/* Font Families */
var(--font-primary)            /* Inter font stack */
var(--font-secondary)          /* Poppins font stack */
var(--font-mono)               /* Monospace font stack */

/* Font Sizes */
var(--text-xs)                 /* 12px */
var(--text-sm)                 /* 14px */
var(--text-base)               /* 16px */
var(--text-lg)                 /* 18px */
var(--text-xl)                 /* 20px */
var(--text-2xl)                /* 24px */

/* Font Weights */
var(--font-normal)             /* 400 */
var(--font-medium)             /* 500 */
var(--font-semibold)           /* 600 */
var(--font-bold)               /* 700 */

/* Line Heights */
var(--leading-tight)           /* 1.25 */
var(--leading-normal)          /* 1.5 */
var(--leading-relaxed)         /* 1.625 */
```

### Spacing Variables

```css
var(--space-1)                 /* 4px */
var(--space-2)                 /* 8px */
var(--space-3)                 /* 12px */
var(--space-4)                 /* 16px */
var(--space-6)                 /* 24px */
var(--space-8)                 /* 32px */
var(--space-12)                /* 48px */
var(--space-16)                /* 64px */
```

### Border & Radius Variables

```css
var(--radius-sm)               /* 2px */
var(--radius-base)             /* 4px */
var(--radius-md)               /* 6px */
var(--radius-lg)               /* 8px */
var(--radius-xl)               /* 12px */
var(--radius-2xl)              /* 16px */
var(--radius-full)             /* 9999px */
```

### Shadow Variables

```css
var(--shadow-sm)               /* Small shadow */
var(--shadow-base)             /* Default shadow */
var(--shadow-md)               /* Medium shadow */
var(--shadow-lg)               /* Large shadow */
var(--shadow-xl)               /* Extra large shadow */
```

### Transition Variables

```css
var(--duration-200)            /* 200ms */
var(--duration-300)            /* 300ms */
var(--ease-in-out)             /* cubic-bezier(0.4, 0, 0.2, 1) */
```

## Component-Specific Variables

### Navigation
```css
var(--nav-width)               /* 256px */
var(--nav-bg)                  /* Navigation background */
var(--nav-border)              /* Navigation border */
var(--nav-shadow)              /* Navigation shadow */
```

### Cards
```css
var(--card-bg)                 /* Card background */
var(--card-border)             /* Card border */
var(--card-radius)             /* Card border radius */
var(--card-shadow)             /* Card shadow */
var(--card-padding)            /* Card internal padding */
```

### Buttons
```css
var(--btn-radius)              /* Button border radius */
var(--btn-padding-sm)          /* Small button padding */
var(--btn-padding-md)          /* Medium button padding */
var(--btn-padding-lg)          /* Large button padding */
```

### Forms
```css
var(--input-bg)                /* Input background */
var(--input-border)            /* Input border */
var(--input-border-focus)      /* Input focus border */
var(--input-radius)            /* Input border radius */
var(--input-padding)           /* Input padding */
```

## Usage Examples

### Using CSS Variables in Components

```jsx
// In your React component
<div 
  className="custom-card"
  style={{
    backgroundColor: 'var(--card-bg)',
    border: '1px solid var(--card-border)',
    borderRadius: 'var(--card-radius)',
    padding: 'var(--card-padding)',
    boxShadow: 'var(--card-shadow)'
  }}
>
  Content here
</div>
```

### Using CSS Variables in CSS

```css
.custom-button {
  background-color: var(--color-primary);
  color: var(--color-white);
  padding: var(--btn-padding-md);
  border-radius: var(--btn-radius);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  transition: all var(--duration-200) var(--ease-in-out);
}

.custom-button:hover {
  background-color: var(--color-primary-dark);
}
```

### Using Utility Classes

```jsx
// Pre-defined utility classes
<div className="bg-primary text-white p-4 rounded-lg shadow-md">
  Primary styled content
</div>

<div className="text-success font-semibold">
  Success message
</div>

<div className="card">
  <div className="card-header">
    <h3>Card Title</h3>
  </div>
  <div className="card-body">
    Card content here
  </div>
</div>
```

## Theme Support

The CSS variables support both light and dark themes:

```css
/* Light theme (default) */
:root {
  --bg-primary: var(--color-white);
  --text-primary: var(--color-gray-900);
  --border-primary: var(--color-gray-200);
}

/* Dark theme */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: var(--color-gray-900);
    --text-primary: var(--color-white);
    --border-primary: var(--color-gray-700);
  }
}
```

## Responsive Design

The variables work seamlessly with responsive design:

```css
@media (max-width: 768px) {
  .container {
    padding: 0 var(--space-3);
  }
  
  .grid-cols-2,
  .grid-cols-3,
  .grid-cols-4 {
    grid-template-columns: 1fr;
  }
}
```

## Best Practices

1. **Use Variables Consistently**: Always use CSS variables instead of hardcoded values
2. **Follow Naming Convention**: Use descriptive names that indicate purpose
3. **Group Related Variables**: Keep related variables together
4. **Document Custom Variables**: Add comments for custom variables
5. **Test Across Themes**: Ensure variables work in both light and dark themes

## Customization

To customize the design system, modify the variables in `variable.css`:

```css
:root {
  /* Override primary color */
  --color-primary: #your-color;
  
  /* Override spacing */
  --space-4: 1.5rem;
  
  /* Add custom variables */
  --custom-variable: value;
}
```

## Integration with Tailwind

The CSS variables work alongside Tailwind CSS:

```jsx
// Using Tailwind classes with CSS variables
<div className="bg-primary text-white p-4">
  This uses both Tailwind and CSS variables
</div>

// Custom styles with variables
<div 
  className="custom-component"
  style={{
    '--custom-color': 'var(--color-primary)',
    backgroundColor: 'var(--custom-color)'
  }}
>
  Custom styled component
</div>
```

## Browser Support

CSS variables are supported in all modern browsers:
- Chrome 49+
- Firefox 31+
- Safari 9.1+
- Edge 16+

For older browsers, consider using a CSS custom properties polyfill.
