# Marketing Landing Page Customization Guide

## Overview
Your marketing landing page now includes a rotating screenshot carousel and fully customizable content. This guide explains how to make changes yourself.

## 🎯 Quick Start

### To Update Text Content
1. Open `client/src/components/marketing/MarketingPage.tsx`
2. Find the `MARKETING_CONTENT` object (around line 59)
3. Edit any text values you want to change
4. Save the file - changes will appear immediately in development mode

### To Add New Screenshots
1. Place your screenshot files in `client/public/screenshots/`
2. Open `client/src/components/marketing/ScreenshotCarousel.tsx`
3. Add a new entry to the `screenshots` array (around line 31)
4. Save the file

## 📝 Customizable Content Sections

### Navigation Bar
```javascript
navigation: {
  items: ['Features', 'Pricing', 'About', 'Contact'], // Menu items
  brandName: 'AriNote', // Company name in header
}
```

### Hero Section (Main Banner)
```javascript
hero: {
  badge: 'AI-Powered Medical Documentation', // Top badge text
  headline: 'Streamline Your Medical Documentation', // Main headline
  subtext: 'Transform your clinical workflow...', // Description paragraph
  primaryButton: 'Start Free Trial', // Main call-to-action button
  secondaryButton: 'Watch Demo', // Secondary button
  demoCard: {
    title: 'Clinical Note Generated', // Demo card title
    subtitle: 'AI-powered documentation in seconds', // Demo card subtitle
    sampleText: '<strong>Chief Complaint:</strong> Chest pain...' // HTML sample text
  }
}
```

### Features Section
```javascript
features: {
  title: 'Everything You Need for Medical Documentation', // Section title
  subtitle: 'Comprehensive tools designed specifically...', // Section subtitle
  items: [
    {
      title: 'AI-Powered Generation', // Feature title
      description: 'Advanced AI creates comprehensive...' // Feature description
    },
    // Add more features here...
  ]
}
```

### Call-to-Action Section
```javascript
cta: {
  title: 'Ready to Transform Your Practice?', // CTA headline
  subtitle: 'Join thousands of healthcare professionals...', // CTA subtitle
  primaryButton: 'Start Your Free Trial', // Primary button text
  secondaryButton: 'Schedule Demo' // Secondary button text
}
```

### Footer
```javascript
footer: {
  brandName: 'AriNote', // Brand name in footer
  description: 'AI-powered medical documentation platform...', // Company description
  sections: {
    product: {
      title: 'Product', // Column title
      links: ['Features', 'Pricing', 'Security'] // Links in this column
    },
    // Add more footer sections...
  },
  copyright: '© 2024 AriNote. All rights reserved.' // Copyright text
}
```

## 🖼️ Managing Screenshots

### Current Screenshots
The carousel includes these feature screenshots:
- Live Preview
- Clinical Impression
- Past Medical History
- Laboratory Values
- Medications List
- Medication Output
- Smart Medication Search

### Adding New Screenshots
1. **Prepare your image**: Ensure it's high quality and shows your feature clearly
2. **Save to correct location**: `client/public/screenshots/your-image.png`
3. **Update the carousel**: Add to the `screenshots` array in `ScreenshotCarousel.tsx`:

```javascript
{
  id: '8', // Unique ID
  title: 'Your New Feature', // Display name
  description: 'Description of what this screenshot shows', // Brief description
  imagePath: '/screenshots/your-image.png', // Path to your image
  category: 'Feature Category' // Category tag
}
```

### Screenshot Requirements
- **Format**: PNG, JPG, or WebP
- **Size**: Recommended 1200x800px or similar aspect ratio
- **Quality**: High resolution for crisp display
- **Content**: Should clearly show the feature in action

## 🎨 Customization Options

### Carousel Settings
In `ScreenshotCarousel.tsx`, you can customize:
- `autoRotate={true}` - Enable/disable auto-rotation
- `rotationInterval={5000}` - Time between slides (milliseconds)

### Theme Colors
To change colors, modify the `theme` object in `MarketingPage.tsx`:
```javascript
primary: {
  main: '#2563eb', // Main brand color
  light: '#3b82f6', // Lighter shade
  dark: '#1d4ed8', // Darker shade
}
```

## 🚀 Testing Your Changes

1. **Development Mode**: Run `npm run dev` to see changes immediately
2. **Production Build**: Run `npm run build` to create optimized version
3. **Responsive Testing**: Check on mobile, tablet, and desktop

## 📱 Mobile Responsiveness

The landing page is fully responsive and will automatically adjust for:
- Mobile phones (< 768px)
- Tablets (768px - 1024px)
- Desktop (> 1024px)

## 🔧 Advanced Customization

### Adding New Sections
To add completely new sections:
1. Create a new component in the `marketing` folder
2. Import and add it to `MarketingPage.tsx`
3. Place it between existing sections

### Modifying Animations
- Carousel transitions use Material-UI's `Fade` component
- Auto-rotation timing can be adjusted in `ScreenshotCarousel.tsx`
- Hover effects are defined in the `sx` prop styling

## 🆘 Common Issues

### Screenshots Not Showing
- Check file path is correct: `/screenshots/filename.png`
- Ensure image is in `client/public/screenshots/` folder
- Verify image file format is supported (PNG, JPG, WebP)

### Text Not Updating
- Make sure you're editing the `MARKETING_CONTENT` object
- Check for syntax errors (missing quotes, commas)
- Restart development server if needed

### Layout Issues
- Test on different screen sizes
- Check console for any error messages
- Ensure all React components are properly closed

## 📞 Need Help?

If you encounter issues:
1. Check the browser console for error messages
2. Verify your changes don't have syntax errors
3. Test in a fresh browser window
4. Restart the development server (`npm run dev`)

---

*This guide covers the main customization options. The marketing page is designed to be easily maintainable while providing professional results.*