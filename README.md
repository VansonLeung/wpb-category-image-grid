# WPBakery Category Image Grid

A dynamic and flexible category image grid element for WPBakery Page Builder with category filtering and pagination.

## Features

- ✅ **Single Post Type Focus** - Display posts from one selected post type only
- ✅ **Category Toolbar** - Interactive toolbar to filter by categories
- ✅ **"All" Option** - Show all posts or filter by specific categories
- ✅ **Responsive Image Grid** - 4:3 landscape aspect ratio with customizable gaps
- ✅ **Hover Effects** - Beautiful overlay with title and customizable "View More" button
- ✅ **Multiple Pagination Types**:
  - Load all posts at once
  - Load top N posts only
   - Lazy loading (load N + automatic infinite scroll, with load-more fallback)
  - Traditional pagination with page numbers
- ✅ **Smooth Animations** - Fade in/out transitions when changing categories
- ✅ **Customizable Gaps** - Set custom spacing between grid items
- ✅ **Fully Responsive** - Automatically adjusts for mobile and tablet screens
- ✅ **Modern Design** - Clean, modern UI with hover effects and transitions
- ✅ **Vanilla JavaScript** - No jQuery dependency, lightweight and fast
- ✅ **WPBakery Integration** - Seamless integration with WPBakery Page Builder
- ✅ **Polylang Compatible** - Properly handles multilingual post types and categories

## Installation

1. **Upload the Plugin**
   - Download or copy the `wpb-category-image-grid` folder
   - Upload it to `/wp-content/plugins/` directory
   - Or install via WordPress admin: Plugins → Add New → Upload Plugin

2. **Activate the Plugin**
   - Go to WordPress Admin → Plugins
   - Find "WPBakery Category Image Grid"
   - Click "Activate"

3. **Requirements**
   - WordPress 5.0 or higher
   - WPBakery Page Builder (Visual Composer) installed and activated

## Usage

### Adding the Category Image Grid Element

1. **Edit a Page with WPBakery**
   - Open any page or post in WPBakery Page Builder

2. **Add the Element**
   - Click "Add Element" button
   - Search for "Category Image Grid"
   - Or find it under the "Content" category

3. **Configure the Element**
   - **Post Type**: Select which post type to display
   - **Grid Columns**: Set the number of columns (2-6)
   - **Gap Size**: Define spacing between items (e.g., 15px, 1rem)
   - **Pagination Type**: Choose how posts are loaded:
     - Load All Posts: Shows all posts at once
     - Load Top N Only: Shows only the first N posts
   - Load N + Lazy Loading: Shows N posts, then auto-loads more when the visitor reaches the end of the grid
   - Load N per Page + Pagination: Shows N posts per page with AJAX page numbers
   - **Posts Per Page**: Number of posts for pagination types
   - **View More Button Text**: Customize the hover button text

### Category Toolbar

The toolbar at the top shows:
- **"All [Post Type]"** - Shows all posts from the selected post type
- **Category names** - Filter posts by specific categories

When a category is selected:
- The grid fades out with a smooth animation
- New posts are loaded via AJAX
- The grid fades back in with staggered item animations
- Pagination is updated based on the new category filter

### Loading Modes

- **Lazy Loading** uses infinite scroll via `IntersectionObserver` when supported by the browser.
- **Fallback Behavior** uses the existing `Load More` button if automatic infinite scroll is not available.
- **Pagination** keeps page switches inside the current page via AJAX and does not update the browser URL.

### Hover Effects

Each grid item features:
- Smooth scale and shadow animation on hover
- Overlay with post title
- Customizable "View More" button
- Centered content layout

### Responsive Behavior

- **Desktop**: Full grid layout with all columns
- **Tablet (768px and below)**: 2 columns, reduced gaps
- **Mobile (480px and below)**: 1 column layout

## Multilingual Support (Polylang)

This plugin is fully compatible with Polylang for multilingual websites:

- **Post Types**: Only translated post types are shown in the dropdown
- **Categories**: Categories are filtered by current language
- **Labels**: Post type and category names appear in the current language
- **Content**: Posts are loaded according to the current language context

## Technical Details

### AJAX Endpoints

- `wp_ajax_wpb_cig_load_posts` - Loads posts for the grid
- `wp_ajax_nopriv_wpb_cig_load_posts` - Same endpoint for non-logged users

### Data Attributes

The main container includes data attributes for configuration:
- `data-post-type` - Selected post type
- `data-category` - Current category filter (or "all")
- `data-columns` - Number of columns
- `data-gap-size` - Gap between items
- `data-pagination-type` - Type of pagination
- `data-posts-per-page` - Posts per page
- `data-view-more-text` - Button text

### Dependencies

- WordPress 5.0+
- WPBakery Page Builder
- Featured images for posts (recommended)
- Polylang (optional, for multilingual support)

## Changelog

### Version 1.0.0
- Initial release of WPBakery Category Image Grid
- Single post type with category filtering
- Responsive grid layout with 4:3 aspect ratio
- Multiple pagination types
- Hover effects with overlay and button
- Smooth animations for category changes
- Polylang multilingual compatibility
- Comprehensive documentation

## Support

For support and feature requests, please contact the plugin author or create an issue in the repository.

## License

This plugin is licensed under the GPL2 license.