<?php
/**
 * WPBakery Category Image Grid Element
 */

if (!defined('ABSPATH')) {
    exit;
}

class WPBakery_Category_Image_Grid extends WPBakeryShortCode {

    function __construct() {
        add_action('init', array($this, 'create_shortcode'), 999);
        add_shortcode('wpb_category_image_grid', array($this, 'render_shortcode'));
    }

    public function create_shortcode() {
        if (!defined('WPB_VC_VERSION')) {
            return;
        }

        // Get available post types (with Polylang support)
        $post_types = $this->get_available_post_types();
        $post_type_options = array();
        foreach ($post_types as $post_type) {
            $post_type_options[$post_type->labels->name] = $post_type->name;
        }

        vc_map(array(
            'name' => __('Category Image Grid', 'wpb-category-image-grid'),
            'base' => 'wpb_category_image_grid',
            'description' => __('Dynamic post grid with category filtering', 'wpb-category-image-grid'),
            'category' => __('Content', 'wpb-category-image-grid'),
            'icon' => 'icon-wpb-category-image-grid',
            'params' => array(
                // Post Type Settings
                array(
                    'type' => 'dropdown',
                    'heading' => __('Post Type', 'wpb-category-image-grid'),
                    'param_name' => 'post_type',
                    'value' => $post_type_options,
                    'std' => 'post',
                    'description' => __('Select the post type to display', 'wpb-category-image-grid'),
                ),

                // Grid Layout Settings
                array(
                    'type' => 'dropdown',
                    'heading' => __('Grid Columns', 'wpb-category-image-grid'),
                    'param_name' => 'columns',
                    'value' => array(
                        '2' => '2',
                        '3' => '3',
                        '4' => '4',
                        '5' => '5',
                        '6' => '6',
                    ),
                    'std' => '3',
                    'description' => __('Number of columns in the grid', 'wpb-category-image-grid'),
                ),
                array(
                    'type' => 'textfield',
                    'heading' => __('Gap Size', 'wpb-category-image-grid'),
                    'param_name' => 'gap_size',
                    'value' => '15px',
                    'description' => __('Gap between grid items (e.g., 15px, 1rem)', 'wpb-category-image-grid'),
                ),

                // Pagination Settings
                array(
                    'type' => 'dropdown',
                    'heading' => __('Pagination Type', 'wpb-category-image-grid'),
                    'param_name' => 'pagination_type',
                    'value' => array(
                        __('Load All Posts', 'wpb-category-image-grid') => 'load_all',
                        __('Load Top N Only', 'wpb-category-image-grid') => 'load_top_n',
                        __('Load N + Lazy Loading', 'wpb-category-image-grid') => 'lazy_loading',
                        __('Load N per Page + Pagination', 'wpb-category-image-grid') => 'pagination',
                    ),
                    'std' => 'load_top_n',
                    'description' => __('Choose how posts are loaded and paginated', 'wpb-category-image-grid'),
                ),
                array(
                    'type' => 'textfield',
                    'heading' => __('Posts Per Page', 'wpb-category-image-grid'),
                    'param_name' => 'posts_per_page',
                    'value' => '9',
                    'description' => __('Number of posts to load initially or per page', 'wpb-category-image-grid'),
                    'dependency' => array(
                        'element' => 'pagination_type',
                        'value' => array('load_top_n', 'lazy_loading', 'pagination'),
                    ),
                ),

                // Hover Settings
                array(
                    'type' => 'textfield',
                    'heading' => __('View More Button Text', 'wpb-category-image-grid'),
                    'param_name' => 'view_more_text',
                    'value' => 'View More',
                    'description' => __('Text for the view more button on hover', 'wpb-category-image-grid'),
                ),
                array(
                    'type' => 'textfield',
                    'heading' => __('All Categories Label', 'wpb-category-image-grid'),
                    'param_name' => 'all_categories_label',
                    'value' => '',
                    'description' => __('Custom label for the "All" categories button. Leave empty to use default "All [Post Type]".', 'wpb-category-image-grid'),
                ),

                // Design Options
                array(
                    'type' => 'css_editor',
                    'heading' => __('CSS', 'wpb-category-image-grid'),
                    'param_name' => 'css',
                    'group' => __('Design Options', 'wpb-category-image-grid'),
                ),
            ),
        ));
    }

    /**
     * Get available post types with Polylang support
     */
    private function get_available_post_types() {
        $post_types = get_post_types(array('public' => true), 'objects');

        // If Polylang is active, filter for translated post types
        if (function_exists('pll_get_post_types')) {
            $translated_types = pll_get_post_types(array('public' => true), true);
            $filtered_post_types = array();
            foreach ($post_types as $post_type) {
                if (in_array($post_type->name, $translated_types)) {
                    $filtered_post_types[] = $post_type;
                }
            }
            return $filtered_post_types;
        }

        return $post_types;
    }

    /**
     * Get categories for a post type with Polylang support
     */
    private function get_categories_for_post_type($post_type) {
        $taxonomy = $this->get_taxonomy_for_post_type($post_type);
        if (!$taxonomy) {
            return array();
        }

        $args = array(
            'taxonomy' => $taxonomy,
            'hide_empty' => true,
            'orderby' => 'name',
            'order' => 'ASC'
        );

        // Add Polylang language filter if available
        if (function_exists('pll_current_language')) {
            $current_lang = pll_current_language();
            if ($current_lang) {
                $args['lang'] = $current_lang;
            }
        }

        $categories = get_terms($args);
        return $categories ?: array();
    }

    /**
     * Get the primary taxonomy for a post type
     */
    private function get_taxonomy_for_post_type($post_type) {
        // For posts, use category
        if ($post_type === 'post') {
            return 'category';
        }

        // For other post types, try to find a hierarchical taxonomy
        $taxonomies = get_object_taxonomies($post_type, 'objects');
        foreach ($taxonomies as $taxonomy) {
            if ($taxonomy->hierarchical && $taxonomy->public) {
                return $taxonomy->name;
            }
        }

        // Fallback to first available taxonomy
        $taxonomies = get_object_taxonomies($post_type);
        return !empty($taxonomies) ? $taxonomies[0] : false;
    }

    public function render_shortcode($atts, $content = null) {
        extract(shortcode_atts(array(
            'post_type' => 'post',
            'columns' => '3',
            'gap_size' => '15px',
            'pagination_type' => 'load_top_n',
            'posts_per_page' => '9',
            'view_more_text' => 'View More',
            'all_categories_label' => '',
            'css' => '',
        ), $atts));

        // Generate unique ID for this grid
        $grid_id = 'wpb-cig-' . uniqid();

        // Build CSS classes
        $css_class = apply_filters(VC_SHORTCODE_CUSTOM_CSS_FILTER_TAG, vc_shortcode_custom_css_class($css, ' '), 'wpb_category_image_grid', $atts);

        // Get post type object for labels
        $post_type_obj = get_post_type_object($post_type);
        $post_type_label = $post_type_obj ? $post_type_obj->labels->name : $post_type;
        $post_type_label_plural = $post_type_obj ? $post_type_obj->labels->name : $post_type;

        // Get categories for this post type
        $categories = $this->get_categories_for_post_type($post_type);
        $category_options = array();

        // Add "All" option first
        $all_label = !empty($all_categories_label) ? $all_categories_label : sprintf(__('All %s', 'wpb-category-image-grid'), $post_type_label_plural);
        $category_options[] = array(
            'id' => 'all',
            'name' => $all_label,
            'slug' => 'all',
            'selected' => true
        );

        // Add actual categories
        foreach ($categories as $category) {
            $category_options[] = array(
                'id' => $category->term_id,
                'name' => $category->name,
                'slug' => $category->slug,
                'selected' => false
            );
        }

        // Start output
        ob_start();
        ?>
        <div id="<?php echo esc_attr($grid_id); ?>" class="wpb-category-image-grid <?php echo esc_attr($css_class); ?>"
             data-post-type="<?php echo esc_attr($post_type); ?>"
             data-category="all"
             data-columns="<?php echo esc_attr($columns); ?>"
             data-gap-size="<?php echo esc_attr($gap_size); ?>"
             data-pagination-type="<?php echo esc_attr($pagination_type); ?>"
             data-posts-per-page="<?php echo esc_attr($posts_per_page); ?>"
             data-view-more-text="<?php echo esc_attr($view_more_text); ?>">

            <!-- Category Toolbar -->
            <div class="wpb-cig-toolbar">
                <div class="wpb-cig-category-selector">
                    <?php foreach ($category_options as $option): ?>
                        <button class="wpb-cig-category-btn <?php echo $option['selected'] ? 'active' : ''; ?>"
                                data-category="<?php echo esc_attr($option['slug']); ?>">
                            <?php echo esc_html($option['name']); ?>
                        </button>
                    <?php endforeach; ?>
                </div>
            </div>

            <!-- Grid Container -->
            <div class="wpb-cig-grid-container">
                <div class="wpb-cig-grid" style="
                    display: grid;
                    grid-template-columns: repeat(<?php echo esc_attr($columns); ?>, 1fr);
                    gap: <?php echo esc_attr($gap_size); ?>;
                ">
                </div>

                <!-- Loading -->
                <div class="wpb-cig-loading" style="display: none;">
                    <div class="wpb-cig-spinner"></div>
                </div>

                <!-- Pagination -->
                <div class="wpb-cig-pagination" style="display: none;">
                    <button class="wpb-cig-load-more" style="display: none;">
                        Load More</button>
                    <div class="wpb-cig-page-numbers"></div>
                </div>
            </div>
        </div>

        <script type="text/javascript">
            // Initialize the grid when DOM is ready
            document.addEventListener('DOMContentLoaded', function() {
                if (typeof WPB_CategoryImageGrid !== 'undefined') {
                    new WPB_CategoryImageGrid('<?php echo esc_attr($grid_id); ?>');
                }
            });
        </script>
        <?php
        return ob_get_clean();
    }
}

// Initialize the element
new WPBakery_Category_Image_Grid();