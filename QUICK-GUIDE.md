# WPBakery Category Image Grid - Quick Guide

## Overview

The Category Image Grid element displays posts from a single post type with category-based filtering and pagination capabilities.

## Basic Setup

1. Add the "Category Image Grid" element to your WPBakery page
2. Select a post type and configure display options
3. The toolbar allows users to filter by categories dynamically

## Key Features

### Single Post Type
- Choose one post type to display (posts, pages, custom post types)
- All filtering happens within that post type's categories

### Category Toolbar
- **"All [Post Type]"** - Shows all posts from the selected post type
- **Category buttons** - Filter posts by specific categories
- Smooth transitions when switching categories

### Grid Layout
- 4:3 aspect ratio images (landscape)
- Customizable number of columns (2-6)
- Adjustable gap sizes between items
- Fully responsive design

### Pagination Options
- **Load All**: Display all posts at once
- **Load Top N**: Show only first N posts
- **Lazy Loading**: Load N posts, then continue with automatic infinite scroll
- **Pagination**: Traditional AJAX page numbers

### Hover Effects
- Scale and shadow animation on hover
- Overlay with post title
- Customizable "View More" button text
- Centered content layout

## Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| Post Type | Post type to display | post |
| Grid Columns | Number of columns (2-6) | 3 |
| Gap Size | Space between items | 15px |
| Pagination Type | How posts are loaded | load_top_n |
| Posts Per Page | Number for pagination | 9 |
| End Message | Message shown after lazy loading finishes | No more posts to load. |
| View More Text | Button text on hover | View More |

## Multilingual Support

When Polylang is active:
- Post types are filtered to translated ones only
- Categories appear in the current language
- Content loads according to language context

## Responsive Behavior

- **Desktop**: Full column layout
- **Tablet (< 768px)**: 2 columns
- **Mobile (< 480px)**: 1 column

## Tips

- Ensure posts have featured images for best results
- Categories must have posts assigned to appear in toolbar
- Use descriptive category names for better UX
- Test with different post types and category structures

## Troubleshooting

**Categories not showing?**
- Check if categories have published posts
- Verify categories are assigned to posts
- Check Polylang language settings if using multilingual

**Posts not loading?**
- Ensure the post type has published posts
- Check if posts have featured images
- Verify browser console for JavaScript errors

**Infinite scroll does not trigger?**
- Check whether the browser supports `IntersectionObserver`
- The plugin falls back to the `Load More` button when it does not

**Styling issues?**
- Clear browser cache
- Check for CSS conflicts
- Use the CSS editor in WPBakery for custom styles