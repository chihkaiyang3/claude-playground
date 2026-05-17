<?php
/**
 * Kaieva theme functions
 */

// Remove WordPress's default head clutter for clean output
remove_action('wp_head', 'wp_generator');
remove_action('wp_head', 'wlwmanifest_link');
remove_action('wp_head', 'rsd_link');
remove_action('wp_head', 'wp_shortlink_wp_head');

// Register the custom page template so WordPress can find it
add_filter('theme_page_templates', function($templates) {
    $templates['page-templates/full-page.php'] = 'Kai Yang – Full Page';
    return $templates;
});

// Theme setup
add_action('after_setup_theme', function() {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', ['search-form', 'comment-form', 'comment-list', 'gallery', 'caption']);
});
