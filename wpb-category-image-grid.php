<?php
/**
 * Plugin Name: WPBakery Category Image Grid
 * Plugin URI: https://github.com/VansonLeung/wpb-category-image-grid
 * Description: A dynamic category image grid element for WPBakery Page Builder with category filtering and pagination
 * Version: 1.0.0
 * Author: Vanson Leung
 * Author URI: https://github.com/VansonLeung
 * License: GPL2
 * Text Domain: wpb-category-image-grid
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('WPB_CIG_VERSION', '1.0.0');
define('WPB_CIG_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('WPB_CIG_PLUGIN_URL', plugin_dir_url(__FILE__));

class WPB_Category_Image_Grid {

    public function __construct() {
        // Hook into WPBakery
        add_action('vc_before_init', array($this, 'integrate_with_vc'));

        // Enqueue scripts and styles
        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'));

        // AJAX handlers for dynamic loading
        add_action('wp_ajax_wpb_cig_load_posts', array($this, 'ajax_load_posts'));
        add_action('wp_ajax_nopriv_wpb_cig_load_posts', array($this, 'ajax_load_posts'));
    }

    /**
     * Integrate with Visual Composer
     */
    public function integrate_with_vc() {
        // Check if WPBakery is installed
        if (!defined('WPB_VC_VERSION')) {
            return;
        }

        // Require the element class
        require_once WPB_CIG_PLUGIN_DIR . 'includes/wpb-category-image-grid-element.php';
    }

    /**
     * Enqueue assets
     */
    public function enqueue_assets() {
        // Enqueue CSS
        wp_enqueue_style(
            'wpb-cig-style',
            WPB_CIG_PLUGIN_URL . 'assets/css/style.css',
            array(),
            WPB_CIG_VERSION
        );

        // Enqueue JavaScript
        wp_enqueue_script(
            'wpb-cig-script',
            WPB_CIG_PLUGIN_URL . 'assets/js/script.js',
            array(),
            WPB_CIG_VERSION,
            true
        );

        // Localize script for AJAX
        wp_localize_script('wpb-cig-script', 'wpbCigAjax', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('wpb_cig_nonce'),
            'strings' => array(
                'error' => __('Error loading posts. Please try again.', 'wpb-category-image-grid'),
                'noPosts' => __('No posts found.', 'wpb-category-image-grid'),
            ),
        ));
    }

    /**
     * AJAX handler for loading posts
     */
    public function ajax_load_posts() {
        // Verify nonce
        $nonce = isset($_POST['nonce']) ? sanitize_text_field(wp_unslash($_POST['nonce'])) : '';
        if (!wp_verify_nonce($nonce, 'wpb_cig_nonce')) {
            wp_die('Security check failed');
        }

        $post_type = isset($_POST['post_type']) ? sanitize_text_field(wp_unslash($_POST['post_type'])) : 'post';
        $category = isset($_POST['category']) ? sanitize_text_field(wp_unslash($_POST['category'])) : 'all';
        $posts_per_page = isset($_POST['posts_per_page']) ? max(1, intval($_POST['posts_per_page'])) : 9;
        $page = isset($_POST['page']) ? max(1, intval($_POST['page'])) : 1;
        $pagination_type = isset($_POST['pagination_type']) ? sanitize_text_field(wp_unslash($_POST['pagination_type'])) : 'load_top_n';

        // Build query args
        $args = array(
            'post_type' => $post_type,
            'posts_per_page' => $posts_per_page,
            'paged' => $page,
            'post_status' => 'publish'
        );

        // Add category filter if not "all"
        if ($category !== 'all') {
            // Get the taxonomy for the post type
            $taxonomy = $this->get_taxonomy_for_post_type($post_type);
            if ($taxonomy) {
                $args['tax_query'] = array(
                    array(
                        'taxonomy' => $taxonomy,
                        'field'    => 'slug',
                        'terms'    => $category,
                    ),
                );
            }
        }

        // Handle pagination types
        if ($pagination_type === 'load_top_n') {
            $args['posts_per_page'] = $posts_per_page;
            $args['paged'] = 1; // Always load first page
        } elseif ($pagination_type === 'load_all') {
            $args['posts_per_page'] = -1; // Load all posts
            $args['paged'] = 1;
        }

        $query = new WP_Query($args);

        $posts_data = array();
        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $post_id = get_the_ID();

                // Get featured image
                $image_url = '';
                $image_full_url = '';
                if (has_post_thumbnail()) {
                    $image_data = wp_get_attachment_image_src(get_post_thumbnail_id(), 'large');
                    $image_url = $image_data ? $image_data[0] : '';
                    $image_full_data = wp_get_attachment_image_src(get_post_thumbnail_id(), 'full');
                    $image_full_url = $image_full_data ? $image_full_data[0] : $image_url;
                }

                $posts_data[] = array(
                    'id' => $post_id,
                    'title' => get_the_title(),
                    'excerpt' => get_the_excerpt(),
                    'permalink' => get_permalink(),
                    'image_url' => $image_url,
                    'image_full_url' => $image_full_url,
                    'date' => get_the_date()
                );
            }
        }

        wp_reset_postdata();

        $has_more = $query->max_num_pages > $page;

        wp_send_json_success(array(
            'posts' => $posts_data,
            'total_pages' => $query->max_num_pages,
            'current_page' => $page,
            'total_posts' => $query->found_posts,
            'has_more' => $has_more
        ));
    }

    /**
     * Get the primary taxonomy for a post type (usually category for posts, or custom taxonomy)
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
}

// Initialize the plugin
new WPB_Category_Image_Grid();