<?php
/*
Plugin Name: System API
Plugin URI: https://web.ehaitech.com/
Description: [Yeehai]
Version: 1.1.4
Author: Yeehai
License: GPL2
*/

// 防止直接访问文件
if (!defined('ABSPATH')) {
    exit;
}

// 避免重复启用导致函数冲突
if (defined('CUSTOM_DB_API_LOADED')) {
    if (is_admin()) {
        add_action('admin_notices', function () {
            echo '<div class="notice notice-error"><p>检测到重复启用的素材收集系统API插件，已自动禁用当前副本。</p></div>';
        });
        if (function_exists('deactivate_plugins')) {
            deactivate_plugins(plugin_basename(__FILE__), true);
        }
    }
    return;
}
define('CUSTOM_DB_API_LOADED', true);

// 把后续函数声明放进条件块，避免重复插件副本在 PHP 编译阶段发生函数重定义。
if (!defined('CUSTOM_DB_API_FUNCTIONS_LOADED')) {
    define('CUSTOM_DB_API_FUNCTIONS_LOADED', true);

// 注册密钥：后端一键注册时使用，可通过 wp-config.php 的 CUSTOM_DB_REGISTER_KEY 覆盖
if (!defined('CUSTOM_DB_REGISTER_KEY')) {
    define('CUSTOM_DB_REGISTER_KEY', 'rk_a3f7c9b1e4d5f6a8b2c3d4e5f6a7b8c9');
}

// 后台设置页显示 API Key
add_action('admin_menu', 'custom_db_api_admin_menu');
function custom_db_api_admin_menu() {
    add_options_page(
        '素材收集系统API',
        '素材收集系统API',
        'manage_options',
        'custom-db-api',
        'custom_db_api_settings_page'
    );
}

function custom_db_api_settings_page() {
    if (!current_user_can('manage_options')) {
        return;
    }
    $api_key = custom_db_api_get_api_key();
    $system_url = get_option('custom_db_system_base_url', '');
    $demo_site = get_option('custom_db_demo_site', '');
    $plugin_token = get_option('custom_db_plugin_token', '');
    $message = isset($_GET['custom_db_api_msg']) ? sanitize_text_field($_GET['custom_db_api_msg']) : '';
    ?>
    <div class="wrap">
        <h1>素材收集系统API</h1>
        <p>API Key 由系统生成，请在下方填写“插件对接 Token”。</p>
        <input id="custom-db-api-key" type="text" readonly value="<?php echo esc_attr($api_key); ?>" style="width: 420px; max-width: 100%;" />
        <button id="custom-db-api-copy" class="button">复制</button>
        <?php if ($message) { ?>
            <p><strong><?php echo esc_html($message); ?></strong></p>
        <?php } ?>
        <hr />
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
            <?php wp_nonce_field('custom_db_api_save_settings'); ?>
            <input type="hidden" name="action" value="custom_db_api_save_settings" />
            <table class="form-table" role="presentation">
                <tr>
                    <th scope="row"><label for="custom-db-system-url">系统地址</label></th>
                    <td>
                        <input id="custom-db-system-url" name="custom_db_system_base_url" type="text" value="<?php echo esc_attr($system_url); ?>" class="regular-text" placeholder="https://your-system.example.com" />
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="custom-db-demo-site">所属 Demo</label></th>
                    <td>
                        <input id="custom-db-demo-site" name="custom_db_demo_site" type="text" value="<?php echo esc_attr($demo_site); ?>" class="regular-text" />
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="custom-db-plugin-token">插件对接 Token</label></th>
                    <td>
                        <input id="custom-db-plugin-token" name="custom_db_plugin_token" type="text" value="<?php echo esc_attr($plugin_token); ?>" class="regular-text" />
                        <p class="description">由系统生成，用于系统调用插件接口与站点绑定。</p>
                    </td>
                </tr>
            </table>
            <?php submit_button('保存配置'); ?>
        </form>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
            <?php wp_nonce_field('custom_db_api_bind_url'); ?>
            <input type="hidden" name="action" value="custom_db_api_bind_url" />
            <?php submit_button('绑定站点 URL', 'secondary'); ?>
        </form>
        <script>
            (function () {
                var btn = document.getElementById('custom-db-api-copy');
                var input = document.getElementById('custom-db-api-key');
                if (!btn || !input) {
                    return;
                }
                btn.addEventListener('click', function () {
                    input.select();
                    document.execCommand('copy');
                });
            })();
        </script>
    </div>
    <?php
}

add_action('admin_post_custom_db_api_save_settings', 'custom_db_api_save_settings');
function custom_db_api_save_settings() {
    if (!current_user_can('manage_options')) {
        wp_die('无权限');
    }
    check_admin_referer('custom_db_api_save_settings');
    $system_url = isset($_POST['custom_db_system_base_url']) ? esc_url_raw($_POST['custom_db_system_base_url']) : '';
    $system_register_key = '';
    $demo_site = isset($_POST['custom_db_demo_site']) ? sanitize_text_field($_POST['custom_db_demo_site']) : '';
    $plugin_token = isset($_POST['custom_db_plugin_token']) ? sanitize_text_field($_POST['custom_db_plugin_token']) : '';
    update_option('custom_db_system_base_url', $system_url);
    update_option('custom_db_demo_site', $demo_site);
    if ($plugin_token) {
        update_option('custom_db_plugin_token', $plugin_token);
        update_option('custom_db_api_key', $plugin_token);
    }
    wp_safe_redirect(add_query_arg('custom_db_api_msg', urlencode('配置已保存'), admin_url('options-general.php?page=custom-db-api')));
    exit;
}

add_action('admin_post_custom_db_api_bind_url', 'custom_db_api_bind_url');
function custom_db_api_bind_url() {
    if (!current_user_can('manage_options')) {
        wp_die('无权限');
    }
    check_admin_referer('custom_db_api_bind_url');

    $system_url = get_option('custom_db_system_base_url', '');
    $plugin_token = get_option('custom_db_plugin_token', '');
    if (!$system_url || !$plugin_token) {
        wp_safe_redirect(add_query_arg('custom_db_api_msg', urlencode('请先配置系统地址与插件对接 Token'), admin_url('options-general.php?page=custom-db-api')));
        exit;
    }

    $payload = [
        'plugin_token' => $plugin_token,
        'site_url' => site_url(),
    ];

    $response = wp_remote_post(rtrim($system_url, '/') . '/api/site/bind_url', [
        'headers' => [
            'Content-Type' => 'application/json',
        ],
        'body' => wp_json_encode($payload),
        'timeout' => 15,
    ]);

    if (is_wp_error($response)) {
        $msg = '绑定失败：' . $response->get_error_message();
        wp_safe_redirect(add_query_arg('custom_db_api_msg', urlencode($msg), admin_url('options-general.php?page=custom-db-api')));
        exit;
    }

    $code = wp_remote_retrieve_response_code($response);
    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);
    if ($code !== 200 || !is_array($data) || !isset($data['code']) || $data['code'] !== 0) {
        $msg = '绑定失败';
        if (is_array($data) && isset($data['message'])) {
            $msg .= '：' . $data['message'];
        }
        wp_safe_redirect(add_query_arg('custom_db_api_msg', urlencode($msg), admin_url('options-general.php?page=custom-db-api')));
        exit;
    }

    wp_safe_redirect(add_query_arg('custom_db_api_msg', urlencode('绑定成功'), admin_url('options-general.php?page=custom-db-api')));
    exit;
}

// 读取 API Key（优先常量，其次站点配置）
function custom_db_api_get_api_key() {
    if (defined('CUSTOM_DB_API_KEY') && CUSTOM_DB_API_KEY) {
        return CUSTOM_DB_API_KEY;
    }
    $opt = get_option('custom_db_api_key');
    return is_string($opt) ? trim($opt) : '';
}

// API Key 校验
function custom_db_api_check_permission($request) {
    $api_key = custom_db_api_get_api_key();
    if (!$api_key) {
        return new WP_Error('api_key_missing', 'API Key 未配置', ['status' => 500]);
    }

    $incoming = $request->get_header('x-api-key');
    if (!$incoming) {
        $auth = $request->get_header('authorization');
        if (stripos($auth, 'Bearer ') === 0) {
            $incoming = trim(substr($auth, 7));
        }
    }
    if (!$incoming) {
        $incoming = $request->get_param('api_key');
    }

    if (!$incoming || !hash_equals($api_key, $incoming)) {
        return new WP_Error('api_key_invalid', '未授权', ['status' => 401]);
    }

    return true;
}

// 注册密钥校验：用于后端一键注册，使用 REGISTER_KEY 而非站点 API Key
function custom_db_api_check_register_permission($request) {
    $register_key = defined('CUSTOM_DB_REGISTER_KEY') ? CUSTOM_DB_REGISTER_KEY : '';
    if (!$register_key) {
        return new WP_Error('register_key_missing', '注册密钥未配置', ['status' => 500]);
    }

    $incoming = $request->get_header('x-api-key');
    if (!$incoming) {
        $auth = $request->get_header('authorization');
        if (stripos($auth, 'Bearer ') === 0) {
            $incoming = trim(substr($auth, 7));
        }
    }

    if (!$incoming || !hash_equals($register_key, $incoming)) {
        return new WP_Error('register_key_invalid', '注册密钥无效', ['status' => 401]);
    }

    return true;
}

// 一键注册：接收后端推送的配置并自动保存
function custom_db_api_register($request) {
    $body = $request->get_params();
    $plugin_token = sanitize_text_field($body['plugin_token'] ?? '');
    $system_url = esc_url_raw($body['system_url'] ?? '');
    $demo_site = sanitize_text_field($body['demo_site'] ?? '');

    if (!$plugin_token || !$system_url) {
        return new WP_REST_Response([
            'code' => 422,
            'message' => '参数错误：缺少 plugin_token 或 system_url'
        ], 422);
    }

    update_option('custom_db_plugin_token', $plugin_token);
    update_option('custom_db_api_key', $plugin_token);
    update_option('custom_db_system_base_url', $system_url);
    if ($demo_site) {
        update_option('custom_db_demo_site', $demo_site);
    }

    return new WP_REST_Response([
        'code' => 0,
        'data' => [
            'plugin_token' => $plugin_token,
            'system_url' => $system_url,
            'demo_site' => $demo_site ?: '',
        ],
        'message' => '注册成功'
    ], 200);
}

// 登录限流（按 IP + 用户名）
function custom_db_api_rate_limit($key, $max = 10, $window_seconds = 60) {
    $count = (int) get_transient($key);
    if ($count >= $max) {
        return false;
    }
    set_transient($key, $count + 1, $window_seconds);
    return true;
}

// 注册 API 路由
add_action('rest_api_init', 'register_custom_db_api_routes');

function register_custom_db_api_routes() {
    register_rest_route('custom-db-api/v1', '/login', [
        'methods' => 'POST',
        'callback' => 'custom_user_login',
        'permission_callback' => 'custom_db_api_check_permission'
    ]);

    register_rest_route('custom-db-api/v1', '/publish_pages', [
        'methods' => 'GET',
        'callback' => 'get_publish_pages',
        'permission_callback' => 'custom_db_api_check_permission'
    ]);

    register_rest_route('custom-db-api/v1', '/elementor_data', [
        'methods' => 'GET',
        'callback' => 'get_elementor_data',
        'permission_callback' => 'custom_db_api_check_permission'
    ]);

    register_rest_route('custom-db-api/v1', '/elementor_data_json', [
        'methods' => 'GET',
        'callback' => 'get_elementor_data_json',
        'permission_callback' => 'custom_db_api_check_permission'
    ]);

    register_rest_route('custom-db-api/v1', '/site_icon', [
        'methods' => 'POST',
        'callback' => 'custom_db_api_set_site_icon',
        'permission_callback' => 'custom_db_api_check_permission'
    ]);
    register_rest_route('custom-db-api/v1', '/site_icon', [
        'methods' => 'GET',
        'callback' => 'custom_db_api_get_site_icon',
        'permission_callback' => 'custom_db_api_check_permission'
    ]);

    register_rest_route('custom-db-api/v1', '/site_title', [
        'methods' => 'POST',
        'callback' => 'custom_db_api_set_site_title',
        'permission_callback' => 'custom_db_api_check_permission'
    ]);
    register_rest_route('custom-db-api/v1', '/site_title', [
        'methods' => 'GET',
        'callback' => 'custom_db_api_get_site_title',
        'permission_callback' => 'custom_db_api_check_permission'
    ]);

    register_rest_route('custom-db-api/v1', '/smtp_config', [
        'methods' => 'POST',
        'callback' => 'custom_db_api_update_smtp_config',
        'permission_callback' => 'custom_db_api_check_permission'
    ]);

    register_rest_route('custom-db-api/v1', '/smtp_test', [
        'methods' => 'POST',
        'callback' => 'custom_db_api_test_smtp',
        'permission_callback' => 'custom_db_api_check_permission'
    ]);

    register_rest_route('custom-db-api/v1', '/post_types', [
        'methods' => 'GET',
        'callback' => 'custom_db_api_get_post_types',
        'permission_callback' => 'custom_db_api_check_permission'
    ]);

    register_rest_route('custom-db-api/v1', '/content_create', [
        'methods' => 'POST',
        'callback' => 'custom_db_api_create_content',
        'permission_callback' => 'custom_db_api_check_permission'
    ]);

    register_rest_route('custom-db-api/v1', '/update_elementor_data', [
        'methods' => 'POST',
        'callback' => 'up_elementor_data',
        'permission_callback' => 'custom_db_api_check_permission'
    ]);

    register_rest_route('custom-db-api/v1', '/upload_file', [
        'methods' => 'POST',
        'callback' => 'custom_files_upload',
        'permission_callback' => 'custom_db_api_check_permission'
    ]);

    register_rest_route('custom-db-api/v1', '/media_list', [
        'methods' => 'GET',
        'callback' => 'custom_db_api_get_media_list',
        'permission_callback' => 'custom_db_api_check_permission'
    ]);

    register_rest_route('custom-db-api/v1', '/delete_file', [
        'methods' => 'POST',
        'callback' => 'custom_delete_file',
        'permission_callback' => 'custom_db_api_check_permission'
    ]);

    register_rest_route('custom-db-api/v1', '/product', [
        'methods' => 'GET',
        'callback' => 'custom_db_api_get_product',
        'permission_callback' => 'custom_db_api_check_permission'
    ]);
    register_rest_route('custom-db-api/v1', '/product_list', [
        'methods' => 'GET',
        'callback' => 'custom_db_api_get_product_list',
        'permission_callback' => 'custom_db_api_check_permission'
    ]);
    register_rest_route('custom-db-api/v1', '/product', [
        'methods' => 'POST',
        'callback' => 'custom_db_api_update_product',
        'permission_callback' => 'custom_db_api_check_permission'
    ]);
    register_rest_route('custom-db-api/v1', '/product_delete', [
        'methods' => 'POST',
        'callback' => 'custom_db_api_delete_product',
        'permission_callback' => 'custom_db_api_check_permission'
    ]);
    register_rest_route('custom-db-api/v1', '/product_categories', [
        'methods' => 'GET',
        'callback' => 'custom_db_api_get_product_categories',
        'permission_callback' => 'custom_db_api_check_permission'
    ]);
    register_rest_route('custom-db-api/v1', '/product_category', [
        'methods' => 'POST',
        'callback' => 'custom_db_api_update_product_category',
        'permission_callback' => 'custom_db_api_check_permission'
    ]);

    register_rest_route('custom-db-api/v1', '/news', [
        'methods' => 'GET',
        'callback' => 'custom_db_api_get_news',
        'permission_callback' => 'custom_db_api_check_permission'
    ]);
    register_rest_route('custom-db-api/v1', '/news_list', [
        'methods' => 'GET',
        'callback' => 'custom_db_api_get_news_list',
        'permission_callback' => 'custom_db_api_check_permission'
    ]);
    register_rest_route('custom-db-api/v1', '/news', [
        'methods' => 'POST',
        'callback' => 'custom_db_api_update_news',
        'permission_callback' => 'custom_db_api_check_permission'
    ]);
    register_rest_route('custom-db-api/v1', '/news_delete', [
        'methods' => 'POST',
        'callback' => 'custom_db_api_delete_news',
        'permission_callback' => 'custom_db_api_check_permission'
    ]);
    register_rest_route('custom-db-api/v1', '/news_categories', [
        'methods' => 'GET',
        'callback' => 'custom_db_api_get_news_categories',
        'permission_callback' => 'custom_db_api_check_permission'
    ]);
    register_rest_route('custom-db-api/v1', '/news_category', [
        'methods' => 'POST',
        'callback' => 'custom_db_api_update_news_category',
        'permission_callback' => 'custom_db_api_check_permission'
    ]);

    register_rest_route('custom-db-api/v1', '/product_short_description', [
        'methods' => 'GET',
        'callback' => 'custom_db_api_get_product_short_description',
        'permission_callback' => 'custom_db_api_check_permission'
    ]);
    register_rest_route('custom-db-api/v1', '/product_short_description', [
        'methods' => 'POST',
        'callback' => 'custom_db_api_update_product_short_description',
        'permission_callback' => 'custom_db_api_check_permission'
    ]);

    register_rest_route('custom-db-api/v1', '/register', [
        'methods' => 'POST',
        'callback' => 'custom_db_api_register',
        'permission_callback' => 'custom_db_api_check_register_permission'
    ]);
}

// 登录接口（需要 API Key）
function custom_user_login($request) {
    $res = $request->get_params();
    $username = sanitize_text_field($res['username'] ?? '');
    $password = $res['password'] ?? '';

    if (empty($username) || empty($password)) {
        return new WP_REST_Response([
            'code' => 100,
            'message' => '请输入用户名和密码'
        ], 400);
    }

    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $limit_key = 'custom_api_login_' . md5($ip . '|' . $username);
    if (!custom_db_api_rate_limit($limit_key, 10, 60)) {
        return new WP_REST_Response([
            'code' => 429,
            'message' => '登录过于频繁，请稍后重试'
        ], 429);
    }

    $creds = [
        'user_login'    => $username,
        'user_password' => $password,
        'remember'      => true
    ];

    $user = wp_signon($creds, null);

    if (is_wp_error($user)) {
        return new WP_REST_Response([
            'code' => 101,
            'message' => '账号或密码错误'
        ], 401);
    }

    return new WP_REST_Response([
        'code' => 0,
        'message' => '登录成功',
        'data' => [
            'user_id'    => $user->ID,
            'username'   => $user->user_login,
            'email'      => $user->user_email,
            'display_name' => $user->display_name,
            'roles'      => $user->roles
        ]
    ], 200);
}

// 查询已发布页面
function get_publish_pages() {
    global $wpdb;
    $table = $wpdb->prefix . 'posts';

    $query = "SELECT ID, post_name FROM {$table} WHERE post_type = 'page' AND post_status = 'publish'";
    $result = $wpdb->get_results($query, ARRAY_A);

    if ($result) {
        return new WP_REST_Response([
            'code' => 0,
            'data' => $result
        ], 200);
    }

    return new WP_REST_Response([
        'code' => 400,
        'message' => '未找到数据'
    ], 404);
}

// 获取 Elementor 数据
function get_elementor_data($request) {
    $res = $request->get_params();
    $id = isset($res['id']) ? absint($res['id']) : 0;

    if ($id <= 0) {
        return new WP_REST_Response([
            'code' => 400,
            'message' => '缺少重要参数'
        ], 400);
    }

    global $wpdb;
    $table = $wpdb->prefix . 'postmeta';
    $query = $wpdb->prepare(
        "SELECT * FROM {$table} WHERE post_id = %d AND meta_key = '_elementor_data'",
        $id
    );
    $result = $wpdb->get_results($query, ARRAY_A);

    if ($result) {
        return new WP_REST_Response([
            'code' => 0,
            'data' => $result[0] ?? []
        ], 200);
    }

    return new WP_REST_Response([
        'code' => 400,
        'message' => '未找到数据'
    ], 404);
}

// 获取 Elementor 数据（JSON 结构化）
function get_elementor_data_json($request) {
    $res = $request->get_params();
    $id = isset($res['id']) ? absint($res['id']) : 0;

    if ($id <= 0) {
        return new WP_REST_Response([
            'code' => 400,
            'message' => '缺少重要参数'
        ], 400);
    }

    global $wpdb;
    $table = $wpdb->prefix . 'postmeta';
    $query = $wpdb->prepare(
        "SELECT meta_value FROM {$table} WHERE post_id = %d AND meta_key = '_elementor_data'",
        $id
    );
    $result = $wpdb->get_row($query, ARRAY_A);

    if (!$result || !isset($result['meta_value'])) {
        return new WP_REST_Response([
            'code' => 400,
            'message' => '未找到数据'
        ], 404);
    }

    $decoded = json_decode($result['meta_value'], true);
    if ($decoded === null && json_last_error() !== JSON_ERROR_NONE) {
        return new WP_REST_Response([
            'code' => 400,
            'message' => '解析 JSON 失败'
        ], 400);
    }

    return new WP_REST_Response([
        'code' => 0,
        'data' => $decoded
    ], 200);
}

function custom_db_api_to_bool($value, $default = false) {
    if ($value === null || $value === '') {
        return $default;
    }
    return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? $default;
}

function custom_db_api_get_smtp_option_key() {
    $keys = ['wp_mail_smtp', 'wp_mail_smtp_settings'];
    foreach ($keys as $key) {
        $opt = get_option($key, null);
        if ($opt !== null && $opt !== false) {
            return $key;
        }
    }
    return '';
}

function custom_db_api_merge_smtp_settings($existing, $payload) {
    $settings = is_array($existing) ? $existing : [];
    $mail = isset($settings['mail']) && is_array($settings['mail']) ? $settings['mail'] : [];
    $smtp = isset($settings['smtp']) && is_array($settings['smtp']) ? $settings['smtp'] : [];

    if (isset($payload['from_email'])) {
        $mail['from_email'] = sanitize_email($payload['from_email']);
    }
    if (isset($payload['from_name'])) {
        $mail['from_name'] = sanitize_text_field($payload['from_name']);
    }
    if (isset($payload['mailer'])) {
        $mail['mailer'] = sanitize_text_field($payload['mailer']);
    }

    if (isset($payload['smtp_host'])) {
        $smtp['host'] = sanitize_text_field($payload['smtp_host']);
    }
    if (isset($payload['smtp_encryption'])) {
        $smtp['encryption'] = sanitize_text_field(strtolower($payload['smtp_encryption']));
    }
    if (isset($payload['smtp_port'])) {
        $smtp['port'] = absint($payload['smtp_port']);
    }
    if (isset($payload['smtp_auth'])) {
        $smtp['auth'] = custom_db_api_to_bool($payload['smtp_auth'], true);
    }
    if (isset($payload['smtp_user'])) {
        $smtp['user'] = sanitize_text_field($payload['smtp_user']);
    }
    if (isset($payload['smtp_pass'])) {
        $smtp['pass'] = sanitize_text_field($payload['smtp_pass']);
    }
    if (isset($payload['smtp_auto_tls'])) {
        $smtp['auto_tls'] = custom_db_api_to_bool($payload['smtp_auto_tls'], true);
        $smtp['autotls'] = custom_db_api_to_bool($payload['smtp_auto_tls'], true);
    }

    $settings['mail'] = $mail;
    $settings['smtp'] = $smtp;
    return $settings;
}

function custom_db_api_suspend_elementor_option_hooks() {
    $tags = ['update_option', 'update_option_blogname', 'update_option_site_icon'];
    $removed = [];
    foreach ($tags as $tag) {
        if (empty($GLOBALS['wp_filter'][$tag])) {
            continue;
        }
        $hook = $GLOBALS['wp_filter'][$tag];
        if (is_object($hook) && isset($hook->callbacks)) {
            foreach ($hook->callbacks as $priority => $callbacks) {
                foreach ($callbacks as $callback) {
                    $fn = $callback['function'] ?? null;
                    if (!custom_db_api_is_elementor_kit_callback($fn)) {
                        continue;
                    }
                    remove_action($tag, $fn, $priority);
                    $removed[] = ['tag' => $tag, 'fn' => $fn, 'priority' => $priority];
                }
            }
        }
    }
    return ['removed' => $removed];
}

function custom_db_api_resume_elementor_option_hooks($state) {
    if (!$state || empty($state['removed'])) {
        return;
    }
    foreach ($state['removed'] as $item) {
        add_action($item['tag'], $item['fn'], $item['priority'], 3);
    }
}

function custom_db_api_is_elementor_kit_callback($fn) {
    if (!$fn) {
        return false;
    }
    if (is_array($fn) && isset($fn[0], $fn[1])) {
        $obj = $fn[0];
        $method = $fn[1];
        if ($obj instanceof \Elementor\Core\Kits\Manager && $method === 'update_kit_settings_based_on_option') {
            return true;
        }
        if (is_object($obj) && $method === 'update_kit_settings_based_on_option') {
            $class = get_class($obj);
            if (strpos($class, 'Elementor\\Core\\Kits\\Manager') !== false) {
                return true;
            }
        }
    }
    if ($fn instanceof \Closure) {
        $ref = new \ReflectionFunction($fn);
        $scope = $ref->getClosureScopeClass();
        if ($scope && strpos($scope->getName(), 'Elementor\\Core\\Kits\\Manager') !== false) {
            return true;
        }
    }
    return false;
}

// 设置站点图标（支持上传文件或传 attachment_id）
function custom_db_api_set_site_icon($request) {
    $attachment_id = 0;
    if (!empty($_FILES['file'])) {
        require_once ABSPATH . 'wp-admin/includes/image.php';
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';
        $attachment_id = media_handle_upload('file', 0);
        if (is_wp_error($attachment_id)) {
            return new WP_REST_Response([
                'code' => 400,
                'message' => '上传失败：' . $attachment_id->get_error_message()
            ], 400);
        }
    } else {
        $attachment_id = absint($request->get_param('attachment_id'));
    }

    if ($attachment_id <= 0) {
        return new WP_REST_Response([
            'code' => 400,
            'message' => '缺少附件ID'
        ], 400);
    }

    $hook_state = custom_db_api_suspend_elementor_option_hooks();
    update_option('site_icon', $attachment_id);
    custom_db_api_resume_elementor_option_hooks($hook_state);
    return new WP_REST_Response([
        'code' => 0,
        'message' => '设置成功',
        'data' => ['attachment_id' => $attachment_id]
    ], 200);
}

// 设置网站标题
function custom_db_api_set_site_title($request) {
    $title = sanitize_text_field($request->get_param('title'));
    if (!$title) {
        return new WP_REST_Response([
            'code' => 400,
            'message' => '缺少标题'
        ], 400);
    }
    $hook_state = custom_db_api_suspend_elementor_option_hooks();
    update_option('blogname', $title);
    custom_db_api_resume_elementor_option_hooks($hook_state);
    return new WP_REST_Response([
        'code' => 0,
        'message' => '更新成功'
    ], 200);
}

// 获取网站标题
function custom_db_api_get_site_title() {
    $title = get_option('blogname', '');
    return new WP_REST_Response([
        'code' => 0,
        'message' => '获取成功',
        'data' => ['title' => (string) $title]
    ], 200);
}

// 获取站点图标
function custom_db_api_get_site_icon() {
    $attachment_id = absint(get_option('site_icon', 0));
    $icon_url = '';
    if ($attachment_id > 0) {
        $icon_url = wp_get_attachment_image_url($attachment_id, 'full');
    }
    return new WP_REST_Response([
        'code' => 0,
        'message' => '获取成功',
        'data' => [
            'attachment_id' => $attachment_id,
            'icon_url' => $icon_url ? $icon_url : ''
        ]
    ], 200);
}

// 更新 SMTP 配置
function custom_db_api_update_smtp_config($request) {
    $payload = $request->get_params();
    $option_key = custom_db_api_get_smtp_option_key();
    if ($option_key) {
        $existing = get_option($option_key, []);
        $merged = custom_db_api_merge_smtp_settings($existing, $payload);
        update_option($option_key, $merged);
        return new WP_REST_Response([
            'code' => 0,
            'message' => '更新成功',
            'data' => ['option_key' => $option_key]
        ], 200);
    }

    $existing = get_option('custom_db_smtp', []);
    $merged = custom_db_api_merge_smtp_settings($existing, $payload);
    update_option('custom_db_smtp', $merged);
    return new WP_REST_Response([
        'code' => 0,
        'message' => '更新成功',
        'data' => ['option_key' => 'custom_db_smtp']
    ], 200);
}

// SMTP 测试邮件
function custom_db_api_test_smtp($request) {
    $to = sanitize_email($request->get_param('to'));
    if (!$to) {
        return new WP_REST_Response([
            'code' => 400,
            'message' => '缺少接收邮箱'
        ], 400);
    }

    $subject = '【易海 SMTP 测试邮件】';
    $body = '【易海 SMTP 测试邮件】';
    $result = wp_mail($to, $subject, $body);

    if (!$result) {
        return new WP_REST_Response([
            'code' => 400,
            'message' => '发送失败'
        ], 400);
    }

    return new WP_REST_Response([
        'code' => 0,
        'message' => '发送成功'
    ], 200);
}

// 获取站点可用 post_type
function custom_db_api_get_post_types() {
    $types = get_post_types(['public' => true], 'objects');
    $result = [];
    foreach ($types as $name => $obj) {
        if ($name === 'attachment') {
            continue;
        }
        $result[] = [
            'name' => $name,
            'label' => $obj->labels->singular_name ?? $obj->label ?? $name,
            'hierarchical' => !empty($obj->hierarchical),
        ];
    }
    return new WP_REST_Response([
        'code' => 0,
        'data' => $result
    ], 200);
}

// 创建内容（产品/新闻等）
function custom_db_api_create_content($request) {
    $res = $request->get_params();
    $post_type = sanitize_text_field($res['post_type'] ?? '');
    if (!$post_type || !post_type_exists($post_type)) {
        return new WP_REST_Response([
            'code' => 400,
            'message' => '无效的 post_type'
        ], 400);
    }

    $title = sanitize_text_field($res['title'] ?? '');
    $content = isset($res['content']) ? wp_kses_post($res['content']) : '';
    $excerpt = isset($res['excerpt']) ? wp_kses_post($res['excerpt']) : '';
    if (!$title) {
        return new WP_REST_Response([
            'code' => 400,
            'message' => '缺少标题'
        ], 400);
    }

    $post_date = isset($res['post_date']) ? sanitize_text_field($res['post_date']) : '';

    $post_id = wp_insert_post([
        'post_type' => $post_type,
        'post_title' => $title,
        'post_content' => $content,
        'post_excerpt' => $excerpt,
        'post_status' => 'publish',
        'post_date' => $post_date ?: null,
    ], true);

    if (is_wp_error($post_id)) {
        return new WP_REST_Response([
            'code' => 400,
            'message' => '创建失败：' . $post_id->get_error_message()
        ], 400);
    }

    $category_ids = isset($res['category_ids']) && is_array($res['category_ids'])
        ? array_map('absint', $res['category_ids'])
        : [];
    $tag_ids = isset($res['tag_ids']) && is_array($res['tag_ids'])
        ? array_map('absint', $res['tag_ids'])
        : [];

    $taxonomies = get_object_taxonomies($post_type, 'names');
    $category_tax = in_array('product_cat', $taxonomies, true) ? 'product_cat' : 'category';
    $tag_tax = in_array('product_tag', $taxonomies, true) ? 'product_tag' : 'post_tag';

    if ($category_ids && in_array($category_tax, $taxonomies, true)) {
        wp_set_object_terms($post_id, $category_ids, $category_tax, false);
    }
    if ($tag_ids && in_array($tag_tax, $taxonomies, true)) {
        wp_set_object_terms($post_id, $tag_ids, $tag_tax, false);
    }

    $featured_image_id = isset($res['featured_image_id']) ? absint($res['featured_image_id']) : 0;
    if ($featured_image_id > 0) {
        set_post_thumbnail($post_id, $featured_image_id);
    }

    $gallery_ids = isset($res['gallery_ids']) && is_array($res['gallery_ids'])
        ? array_filter(array_map('absint', $res['gallery_ids']))
        : [];
    if ($gallery_ids) {
        if ($post_type === 'product') {
            update_post_meta($post_id, '_product_image_gallery', implode(',', $gallery_ids));
        } else {
            update_post_meta($post_id, 'custom_db_gallery', $gallery_ids);
        }
    }

    return new WP_REST_Response([
        'code' => 0,
        'message' => '创建成功',
        'data' => ['id' => $post_id]
    ], 200);
}

function custom_db_api_parse_id_list($value) {
    if (is_array($value)) {
        return array_values(array_filter(array_map('absint', $value), function ($id) {
            return $id > 0;
        }));
    }
    if (is_string($value) && $value !== '') {
        $parts = explode(',', $value);
        return array_values(array_filter(array_map('absint', $parts), function ($id) {
            return $id > 0;
        }));
    }
    return [];
}

function custom_db_api_normalize_post_status($status) {
    $value = sanitize_text_field((string) $status);
    if (!$value) {
        return '';
    }
    $allowed = ['publish', 'draft', 'pending', 'private'];
    return in_array($value, $allowed, true) ? $value : '';
}

function custom_db_api_get_post_categories($post_id, $taxonomy) {
    if (!taxonomy_exists($taxonomy)) {
        return [];
    }
    $terms = wp_get_post_terms($post_id, $taxonomy, ['fields' => 'ids']);
    if (is_wp_error($terms) || !is_array($terms)) {
        return [];
    }
    return array_values(array_map('absint', $terms));
}

function custom_db_api_get_image_data($attachment_id) {
    $id = absint($attachment_id);
    if ($id <= 0) {
        return [
            'id' => 0,
            'url' => '',
        ];
    }
    return [
        'id' => $id,
        'url' => (string) wp_get_attachment_url($id),
    ];
}

function custom_db_api_get_gallery_data($post_id) {
    $raw = get_post_meta($post_id, '_product_image_gallery', true);
    $ids = custom_db_api_parse_id_list($raw);
    return array_map('custom_db_api_get_image_data', $ids);
}

function custom_db_api_sync_featured_image($post_id, $payload) {
    if (!array_key_exists('featured_image_id', $payload) && !array_key_exists('product_image_id', $payload)) {
        return false;
    }
    $featured_image_id = array_key_exists('featured_image_id', $payload)
        ? absint($payload['featured_image_id'])
        : absint($payload['product_image_id']);
    if ($featured_image_id > 0) {
        set_post_thumbnail($post_id, $featured_image_id);
    } else {
        delete_post_thumbnail($post_id);
    }
    return true;
}

function custom_db_api_sync_product_gallery($post_id, $payload) {
    if (!array_key_exists('gallery_ids', $payload) && !array_key_exists('product_gallery_ids', $payload)) {
        return false;
    }
    $gallery_ids = array_key_exists('gallery_ids', $payload)
        ? custom_db_api_parse_id_list($payload['gallery_ids'])
        : custom_db_api_parse_id_list($payload['product_gallery_ids']);
    update_post_meta($post_id, '_product_image_gallery', implode(',', $gallery_ids));
    return true;
}

function custom_db_api_ensure_post_type($post_id, $post_type) {
    $post = get_post($post_id);
    if (!$post || $post->post_type !== $post_type) {
        return null;
    }
    return $post;
}

function custom_db_api_get_product($request) {
    $id = absint($request->get_param('id'));
    if ($id <= 0) {
        return new WP_REST_Response([
            'code' => 400,
            'message' => '缺少有效的产品ID'
        ], 400);
    }

    $post = custom_db_api_ensure_post_type($id, 'product');
    if (!$post) {
        return new WP_REST_Response([
            'code' => 404,
            'message' => '产品不存在'
        ], 404);
    }

    return new WP_REST_Response([
        'code' => 0,
        'message' => '获取成功',
        'data' => [
            'id' => (int) $post->ID,
            'title' => (string) $post->post_title,
            'content' => (string) $post->post_content,
            'short_description' => (string) $post->post_excerpt,
            'status' => (string) $post->post_status,
            'category_ids' => custom_db_api_get_post_categories($post->ID, 'product_cat'),
            'product_image' => custom_db_api_get_image_data(get_post_thumbnail_id($post->ID)),
            'product_gallery' => custom_db_api_get_gallery_data($post->ID),
            'updated_at' => (string) $post->post_modified_gmt,
        ]
    ], 200);
}

function custom_db_api_get_post_list_by_type($request, $post_type, $label) {
    $page = absint($request->get_param('page'));
    if ($page <= 0) {
        $page = 1;
    }
    $page_size = absint($request->get_param('page_size'));
    if ($page_size <= 0) {
        $page_size = 20;
    }
    $page_size = min($page_size, 100);
    $keyword = sanitize_text_field((string) $request->get_param('keyword'));
    $status = sanitize_text_field((string) $request->get_param('status'));

    $args = [
        'post_type' => $post_type,
        'post_status' => $status ?: ['publish', 'draft', 'pending', 'private'],
        'posts_per_page' => $page_size,
        'paged' => $page,
        'orderby' => 'date',
        'order' => 'DESC',
        's' => $keyword ?: '',
    ];

    $query = new WP_Query($args);
    $list = [];
    foreach ($query->posts as $post) {
        $list[] = [
            'id' => (int) $post->ID,
            'title' => (string) $post->post_title,
            'status' => (string) $post->post_status,
            'date' => (string) $post->post_date_gmt,
            'updated_at' => (string) $post->post_modified_gmt,
        ];
    }

    return new WP_REST_Response([
        'code' => 0,
        'message' => '获取成功',
        'data' => [
            'list' => $list,
            'page' => $page,
            'page_size' => $page_size,
            'total' => (int) $query->found_posts,
            'type' => $label,
        ]
    ], 200);
}

function custom_db_api_get_product_list($request) {
    return custom_db_api_get_post_list_by_type($request, 'product', 'product');
}

function custom_db_api_get_news_list($request) {
    return custom_db_api_get_post_list_by_type($request, 'post', 'news');
}

function custom_db_api_update_product($request) {
    $payload = $request->get_params();
    $id = isset($payload['id']) ? absint($payload['id']) : 0;
    if ($id <= 0) {
        return new WP_REST_Response([
            'code' => 400,
            'message' => '缺少有效的产品ID'
        ], 400);
    }

    $post = custom_db_api_ensure_post_type($id, 'product');
    if (!$post) {
        return new WP_REST_Response([
            'code' => 404,
            'message' => '产品不存在'
        ], 404);
    }

    $post_data = ['ID' => $id];
    $has_updates = false;
    if (array_key_exists('title', $payload)) {
        $post_data['post_title'] = sanitize_text_field((string) $payload['title']);
        $has_updates = true;
    }
    if (array_key_exists('content', $payload)) {
        $post_data['post_content'] = wp_kses_post((string) $payload['content']);
        $has_updates = true;
    }
    if (array_key_exists('short_description', $payload) || array_key_exists('excerpt', $payload)) {
        $excerpt = array_key_exists('short_description', $payload)
            ? (string) $payload['short_description']
            : (string) $payload['excerpt'];
        $post_data['post_excerpt'] = wp_kses_post($excerpt);
        $has_updates = true;
    }
    if (array_key_exists('status', $payload)) {
        $status = custom_db_api_normalize_post_status($payload['status']);
        if (!$status) {
            return new WP_REST_Response([
                'code' => 400,
                'message' => '无效的状态值'
            ], 400);
        }
        $post_data['post_status'] = $status;
        $has_updates = true;
    }

    $has_category_updates = array_key_exists('category_ids', $payload);
    $has_featured_image_updates = custom_db_api_sync_featured_image($id, $payload);
    $has_gallery_updates = custom_db_api_sync_product_gallery($id, $payload);
    if (!$has_updates && !$has_category_updates && !$has_featured_image_updates && !$has_gallery_updates) {
        return new WP_REST_Response([
            'code' => 400,
            'message' => '缺少可更新字段'
        ], 400);
    }

    if ($has_updates) {
        $updated = wp_update_post($post_data, true);
        if (is_wp_error($updated)) {
            return new WP_REST_Response([
                'code' => 400,
                'message' => '更新失败：' . $updated->get_error_message()
            ], 400);
        }
    }

    if ($has_category_updates && taxonomy_exists('product_cat')) {
        $category_ids = custom_db_api_parse_id_list($payload['category_ids']);
        wp_set_object_terms($id, $category_ids, 'product_cat', false);
    }

    return new WP_REST_Response([
        'code' => 0,
        'message' => '更新成功',
        'data' => ['id' => $id]
    ], 200);
}

function custom_db_api_delete_post_by_type($request, $post_type, $label) {
    $payload = $request->get_params();
    $id = isset($payload['id']) ? absint($payload['id']) : 0;
    if ($id <= 0) {
        return new WP_REST_Response([
            'code' => 400,
            'message' => '缺少有效ID'
        ], 400);
    }

    $post = custom_db_api_ensure_post_type($id, $post_type);
    if (!$post) {
        return new WP_REST_Response([
            'code' => 404,
            'message' => $label . '不存在'
        ], 404);
    }

    $force = custom_db_api_to_bool($payload['force'] ?? false, false);
    if ($force) {
        $deleted = wp_delete_post($id, true);
        if (!$deleted) {
            return new WP_REST_Response([
                'code' => 400,
                'message' => '删除失败'
            ], 400);
        }
        return new WP_REST_Response([
            'code' => 0,
            'message' => '删除成功',
            'data' => ['id' => $id, 'mode' => 'force']
        ], 200);
    }

    if ((string) $post->post_status === 'trash') {
        return new WP_REST_Response([
            'code' => 0,
            'message' => '已在回收站',
            'data' => ['id' => $id, 'mode' => 'trash']
        ], 200);
    }

    $trashed = wp_trash_post($id);
    if (!$trashed) {
        return new WP_REST_Response([
            'code' => 400,
            'message' => '删除失败'
        ], 400);
    }

    return new WP_REST_Response([
        'code' => 0,
        'message' => '删除成功',
        'data' => ['id' => $id, 'mode' => 'trash']
    ], 200);
}

function custom_db_api_delete_product($request) {
    return custom_db_api_delete_post_by_type($request, 'product', '产品');
}

function custom_db_api_get_terms_by_taxonomy($taxonomy) {
    if (!taxonomy_exists($taxonomy)) {
        return new WP_REST_Response([
            'code' => 404,
            'message' => '分类不存在'
        ], 404);
    }

    $terms = get_terms([
        'taxonomy' => $taxonomy,
        'hide_empty' => false,
    ]);
    if (is_wp_error($terms)) {
        return new WP_REST_Response([
            'code' => 400,
            'message' => '获取分类失败：' . $terms->get_error_message()
        ], 400);
    }

    $list = array_map(function ($term) {
        return [
            'id' => (int) $term->term_id,
            'name' => (string) $term->name,
            'slug' => (string) $term->slug,
            'parent' => (int) $term->parent,
            'count' => (int) $term->count,
            'description' => (string) $term->description,
        ];
    }, $terms);

    return new WP_REST_Response([
        'code' => 0,
        'message' => '获取成功',
        'data' => $list
    ], 200);
}

function custom_db_api_get_product_categories() {
    return custom_db_api_get_terms_by_taxonomy('product_cat');
}

function custom_db_api_get_news_categories() {
    return custom_db_api_get_terms_by_taxonomy('category');
}

function custom_db_api_update_term_by_taxonomy($request, $taxonomy, $error_label) {
    if (!taxonomy_exists($taxonomy)) {
        return new WP_REST_Response([
            'code' => 404,
            'message' => $error_label . '不存在'
        ], 404);
    }

    $payload = $request->get_params();
    $id = isset($payload['id']) ? absint($payload['id']) : 0;
    if ($id <= 0) {
        return new WP_REST_Response([
            'code' => 400,
            'message' => '缺少有效的分类ID'
        ], 400);
    }

    $term = get_term($id, $taxonomy);
    if (!$term || is_wp_error($term)) {
        return new WP_REST_Response([
            'code' => 404,
            'message' => $error_label . '不存在'
        ], 404);
    }

    $args = [];
    if (array_key_exists('name', $payload)) {
        $args['name'] = sanitize_text_field((string) $payload['name']);
    }
    if (array_key_exists('slug', $payload)) {
        $args['slug'] = sanitize_title((string) $payload['slug']);
    }
    if (array_key_exists('parent', $payload)) {
        $args['parent'] = absint($payload['parent']);
    }
    if (array_key_exists('description', $payload)) {
        $args['description'] = sanitize_textarea_field((string) $payload['description']);
    }
    if (!$args) {
        return new WP_REST_Response([
            'code' => 400,
            'message' => '缺少可更新字段'
        ], 400);
    }

    $result = wp_update_term($id, $taxonomy, $args);
    if (is_wp_error($result)) {
        return new WP_REST_Response([
            'code' => 400,
            'message' => '更新失败：' . $result->get_error_message()
        ], 400);
    }

    return new WP_REST_Response([
        'code' => 0,
        'message' => '更新成功',
        'data' => ['id' => (int) $result['term_id']]
    ], 200);
}

function custom_db_api_update_product_category($request) {
    return custom_db_api_update_term_by_taxonomy($request, 'product_cat', '产品分类');
}

function custom_db_api_update_news_category($request) {
    return custom_db_api_update_term_by_taxonomy($request, 'category', '新闻分类');
}

function custom_db_api_get_news($request) {
    $id = absint($request->get_param('id'));
    if ($id <= 0) {
        return new WP_REST_Response([
            'code' => 400,
            'message' => '缺少有效的新闻ID'
        ], 400);
    }

    $post = custom_db_api_ensure_post_type($id, 'post');
    if (!$post) {
        return new WP_REST_Response([
            'code' => 404,
            'message' => '新闻不存在'
        ], 404);
    }

    return new WP_REST_Response([
        'code' => 0,
        'message' => '获取成功',
        'data' => [
            'id' => (int) $post->ID,
            'title' => (string) $post->post_title,
            'excerpt' => (string) $post->post_excerpt,
            'content' => (string) $post->post_content,
            'status' => (string) $post->post_status,
            'category_ids' => custom_db_api_get_post_categories($post->ID, 'category'),
            'featured_image' => custom_db_api_get_image_data(get_post_thumbnail_id($post->ID)),
            'updated_at' => (string) $post->post_modified_gmt,
        ]
    ], 200);
}

function custom_db_api_update_news($request) {
    $payload = $request->get_params();
    $id = isset($payload['id']) ? absint($payload['id']) : 0;
    if ($id <= 0) {
        return new WP_REST_Response([
            'code' => 400,
            'message' => '缺少有效的新闻ID'
        ], 400);
    }

    $post = custom_db_api_ensure_post_type($id, 'post');
    if (!$post) {
        return new WP_REST_Response([
            'code' => 404,
            'message' => '新闻不存在'
        ], 404);
    }

    $post_data = ['ID' => $id];
    $has_updates = false;
    if (array_key_exists('title', $payload)) {
        $post_data['post_title'] = sanitize_text_field((string) $payload['title']);
        $has_updates = true;
    }
    if (array_key_exists('content', $payload)) {
        $post_data['post_content'] = wp_kses_post((string) $payload['content']);
        $has_updates = true;
    }
    if (array_key_exists('excerpt', $payload)) {
        $post_data['post_excerpt'] = wp_kses_post((string) $payload['excerpt']);
        $has_updates = true;
    }
    if (array_key_exists('status', $payload)) {
        $status = custom_db_api_normalize_post_status($payload['status']);
        if (!$status) {
            return new WP_REST_Response([
                'code' => 400,
                'message' => '无效的状态值'
            ], 400);
        }
        $post_data['post_status'] = $status;
        $has_updates = true;
    }

    $has_category_updates = array_key_exists('category_ids', $payload);
    $has_featured_image_updates = custom_db_api_sync_featured_image($id, $payload);
    if (!$has_updates && !$has_category_updates && !$has_featured_image_updates) {
        return new WP_REST_Response([
            'code' => 400,
            'message' => '缺少可更新字段'
        ], 400);
    }

    if ($has_updates) {
        $updated = wp_update_post($post_data, true);
        if (is_wp_error($updated)) {
            return new WP_REST_Response([
                'code' => 400,
                'message' => '更新失败：' . $updated->get_error_message()
            ], 400);
        }
    }

    if ($has_category_updates && taxonomy_exists('category')) {
        $category_ids = custom_db_api_parse_id_list($payload['category_ids']);
        wp_set_object_terms($id, $category_ids, 'category', false);
    }

    return new WP_REST_Response([
        'code' => 0,
        'message' => '更新成功',
        'data' => ['id' => $id]
    ], 200);
}

function custom_db_api_delete_news($request) {
    return custom_db_api_delete_post_by_type($request, 'post', '新闻');
}

function custom_db_api_get_product_short_description($request) {
    $id = absint($request->get_param('id'));
    if ($id <= 0) {
        return new WP_REST_Response([
            'code' => 400,
            'message' => '缺少有效的产品ID'
        ], 400);
    }

    $post = custom_db_api_ensure_post_type($id, 'product');
    if (!$post) {
        return new WP_REST_Response([
            'code' => 404,
            'message' => '产品不存在'
        ], 404);
    }

    return new WP_REST_Response([
        'code' => 0,
        'message' => '获取成功',
        'data' => [
            'id' => (int) $post->ID,
            'short_description' => (string) $post->post_excerpt,
        ]
    ], 200);
}

function custom_db_api_update_product_short_description($request) {
    $payload = $request->get_params();
    $id = isset($payload['id']) ? absint($payload['id']) : 0;
    if ($id <= 0) {
        return new WP_REST_Response([
            'code' => 400,
            'message' => '缺少有效的产品ID'
        ], 400);
    }
    if (!array_key_exists('short_description', $payload) && !array_key_exists('excerpt', $payload)) {
        return new WP_REST_Response([
            'code' => 400,
            'message' => '缺少短描述'
        ], 400);
    }

    $post = custom_db_api_ensure_post_type($id, 'product');
    if (!$post) {
        return new WP_REST_Response([
            'code' => 404,
            'message' => '产品不存在'
        ], 404);
    }

    $excerpt = array_key_exists('short_description', $payload)
        ? (string) $payload['short_description']
        : (string) $payload['excerpt'];
    $updated = wp_update_post([
        'ID' => $id,
        'post_excerpt' => wp_kses_post($excerpt),
    ], true);
    if (is_wp_error($updated)) {
        return new WP_REST_Response([
            'code' => 400,
            'message' => '更新失败：' . $updated->get_error_message()
        ], 400);
    }

    return new WP_REST_Response([
        'code' => 0,
        'message' => '更新成功',
        'data' => ['id' => $id]
    ], 200);
}

// 优先从 JSON 请求体读取大对象，避免超长表单字段带来的兼容性问题。
function custom_db_api_get_elementor_update_payload($request) {
    $json_params = $request->get_json_params();
    if (is_array($json_params) && !empty($json_params)) {
        return $json_params;
    }

    $body = $request->get_body();
    if (is_string($body) && $body !== '') {
        $decoded_body = json_decode($body, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded_body)) {
            return $decoded_body;
        }
    }

    return $request->get_params();
}

function custom_db_api_log_elementor_update($message, $context = []) {
    $prefix = '[custom-db-api][update_elementor_data] ';
    $line = $prefix . $message;
    if (!empty($context)) {
        $json = wp_json_encode($context, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($json !== false) {
            $line .= ' ' . $json;
        }
    }
    error_log($line);
}


function custom_db_api_finalize_elementor_update($post_id, $encoded_meta_value, $sync_editor = true) {
    $result = [
        'synced_autosave_ids' => [],
        'post_css_deleted' => false,
        'elementor_cache_cleared' => false,
        'post_touched' => false,
    ];

    update_post_meta($post_id, '_elementor_edit_mode', 'builder');
    if (defined('ELEMENTOR_VERSION') && ELEMENTOR_VERSION) {
        update_post_meta($post_id, '_elementor_version', ELEMENTOR_VERSION);
    }

    if ($sync_editor && function_exists('wp_get_post_revisions')) {
        $revisions = wp_get_post_revisions($post_id, ['check_enabled' => false]);
        if (is_array($revisions)) {
            foreach ($revisions as $revision) {
                $revision_id = isset($revision->ID) ? absint($revision->ID) : 0;
                $revision_name = isset($revision->post_name) ? (string) $revision->post_name : '';
                if ($revision_id <= 0 || stripos($revision_name, 'autosave') === false) {
                    continue;
                }
                update_post_meta($revision_id, '_elementor_data', $encoded_meta_value);
                update_post_meta($revision_id, '_elementor_edit_mode', 'builder');
                if (defined('ELEMENTOR_VERSION') && ELEMENTOR_VERSION) {
                    update_post_meta($revision_id, '_elementor_version', ELEMENTOR_VERSION);
                }
                clean_post_cache($revision_id);
                if (function_exists('wp_cache_delete')) {
                    wp_cache_delete($revision_id, 'post_meta');
                }
                $result['synced_autosave_ids'][] = $revision_id;
            }
        }
    }

    clean_post_cache($post_id);
    if (function_exists('wp_cache_delete')) {
        wp_cache_delete($post_id, 'post_meta');
    }

    if (class_exists('\\Elementor\\Core\\Files\\CSS\\Post')) {
        try {
            $css_file = new \Elementor\Core\Files\CSS\Post($post_id);
            if (method_exists($css_file, 'delete')) {
                $css_file->delete();
                $result['post_css_deleted'] = true;
            }
        } catch (Throwable $e) {
            custom_db_api_log_elementor_update('删除 Elementor 单页 CSS 失败', [
                'post_id' => $post_id,
                'message' => $e->getMessage(),
            ]);
        }
    }

    if (class_exists('\\Elementor\\Plugin')) {
        try {
            $elementor = \Elementor\Plugin::$instance;
            if ($elementor && isset($elementor->files_manager) && method_exists($elementor->files_manager, 'clear_cache')) {
                $elementor->files_manager->clear_cache();
                $result['elementor_cache_cleared'] = true;
            }
        } catch (Throwable $e) {
            custom_db_api_log_elementor_update('清理 Elementor 缓存失败', [
                'post_id' => $post_id,
                'message' => $e->getMessage(),
            ]);
        }
    }

    if (function_exists('wp_update_post')) {
        $touched = wp_update_post([
            'ID' => $post_id,
            'post_modified' => current_time('mysql'),
            'post_modified_gmt' => current_time('mysql', true),
        ], true);
        $result['post_touched'] = !is_wp_error($touched);
    }

    return $result;
}

// 更新 Elementor 数据
function up_elementor_data($request) {
    try {
        $res = custom_db_api_get_elementor_update_payload($request);
        $post_id = isset($res['post_id']) ? absint($res['post_id']) : 0;
        $meta_value = $res['meta_value'] ?? '';
        $sync_editor = custom_db_api_to_bool($res['sync_editor'] ?? true, true);

        custom_db_api_log_elementor_update('请求进入', [
            'post_id' => $post_id,
            'meta_value_type' => gettype($meta_value),
            'body_length' => strlen((string) $request->get_body()),
            'memory_usage' => function_exists('memory_get_usage') ? memory_get_usage(true) : null,
        ]);

        if ($post_id <= 0 || $meta_value === '') {
            custom_db_api_log_elementor_update('缺少重要参数', [
                'post_id' => $post_id,
                'meta_value_empty' => $meta_value === '',
            ]);
            return new WP_REST_Response([
                'code' => 400,
                'message' => '缺少重要参数'
            ], 400);
        }

        if (function_exists('wp_is_post_revision')) {
            $revision_parent = wp_is_post_revision($post_id);
            if ($revision_parent) {
                $post_id = absint($revision_parent);
            }
        }
        if (function_exists('wp_is_post_autosave')) {
            $autosave_parent = wp_is_post_autosave($post_id);
            if ($autosave_parent) {
                $post_id = absint($autosave_parent);
            }
        }
        if (!get_post($post_id)) {
            return new WP_REST_Response([
                'code' => 404,
                'message' => '页面不存在'
            ], 404);
        }

        if (is_array($meta_value)) {
            $decoded = $meta_value;
        } else {
            $decoded = json_decode((string) $meta_value, true);
            if ($decoded === null && json_last_error() !== JSON_ERROR_NONE) {
                custom_db_api_log_elementor_update('JSON 解析失败', [
                    'json_error' => json_last_error_msg(),
                ]);
                return new WP_REST_Response([
                    'code' => 400,
                    'message' => 'meta_value 必须是合法 JSON'
                ], 400);
            }
        }

        $encoded_json = wp_json_encode($decoded, JSON_UNESCAPED_UNICODE);
        if ($encoded_json === false) {
            custom_db_api_log_elementor_update('JSON 编码失败', [
                'json_error' => function_exists('json_last_error_msg') ? json_last_error_msg() : 'unknown',
            ]);
            return new WP_REST_Response([
                'code' => 400,
                'message' => 'JSON 编码失败'
            ], 400);
        }

        $encoded = wp_slash($encoded_json);
        $current = get_post_meta($post_id, '_elementor_data', true);

        custom_db_api_log_elementor_update('准备写入', [
            'encoded_length' => strlen($encoded_json),
            'current_length' => strlen((string) $current),
            'decoded_count' => is_array($decoded) ? count($decoded) : null,
            'sync_editor' => $sync_editor,
        ]);

        $changed = false;
        if ((string) $current !== (string) $encoded_json) {
            $updated = update_post_meta($post_id, '_elementor_data', $encoded);
            if ($updated === false) {
                custom_db_api_log_elementor_update('update_post_meta 返回 false', [
                    'post_id' => $post_id,
                    'encoded_length' => strlen($encoded_json),
                ]);
                return new WP_REST_Response([
                    'code' => 400,
                    'message' => '更新失败'
                ], 400);
            }
            $changed = true;
        }

        $finalize_result = custom_db_api_finalize_elementor_update($post_id, $encoded, $sync_editor);

        custom_db_api_log_elementor_update($changed ? '更新成功' : '已同步编辑器状态', [
            'post_id' => $post_id,
            'changed' => $changed,
            'finalize' => $finalize_result,
        ]);
        return new WP_REST_Response([
            'code' => 0,
            'message' => $changed ? '更新成功' : '已同步编辑器状态',
            'data' => [
                'post_id' => $post_id,
                'changed' => $changed,
                'sync_editor' => $sync_editor,
                'finalize' => $finalize_result,
            ]
        ], 200);
    } catch (Throwable $e) {
        custom_db_api_log_elementor_update('捕获到异常', [
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
        ]);
        return new WP_REST_Response([
            'code' => 500,
            'message' => '服务端异常：' . $e->getMessage()
        ], 500);
    }
}

// 文件上传
function custom_files_upload($request) {
    if (empty($_FILES['file'])) {
        return new WP_REST_Response([
            'code' => 1,
            'message' => '未上传文件',
            'data' => []
        ], 400);
    }

    $files = [];
    $file_info = $_FILES['file'];

    if (is_array($file_info['name'])) {
        $file_count = count($file_info['name']);
        for ($i = 0; $i < $file_count; $i++) {
            if (empty($file_info['name'][$i])) {
                continue;
            }
            $files[] = [
                'name' => $file_info['name'][$i],
                'type' => $file_info['type'][$i],
                'tmp_name' => $file_info['tmp_name'][$i],
                'error' => $file_info['error'][$i],
                'size' => $file_info['size'][$i]
            ];
        }
    } else {
        $files[] = [
            'name' => $file_info['name'],
            'type' => $file_info['type'],
            'tmp_name' => $file_info['tmp_name'],
            'error' => $file_info['error'],
            'size' => $file_info['size']
        ];
    }

    if (empty($files)) {
        return new WP_REST_Response([
            'code' => 2,
            'message' => '未检测到有效文件',
            'data' => []
        ], 400);
    }

    $upload_results = [];
    $allowed_mimes = [
        'jpg|jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'gif' => 'image/gif',
        'webp' => 'image/webp'
    ];
    $max_size = 10 * 1024 * 1024;

    require_once ABSPATH . 'wp-admin/includes/image.php';
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/media.php';

    foreach ($files as $file) {
        $result = [
            'original_name' => $file['name'],
            'success' => false,
            'message' => ''
        ];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            $result['message'] = '上传失败';
            $upload_results[] = $result;
            continue;
        }

        if ($file['size'] <= 0 || $file['size'] > $max_size) {
            $result['message'] = $file['size'] <= 0 ? '文件为空' : '文件过大（最大 10MB）';
            $upload_results[] = $result;
            continue;
        }

        $check = wp_check_filetype_and_ext($file['tmp_name'], $file['name'], $allowed_mimes);
        if (empty($check['type']) || empty($check['ext'])) {
            $result['message'] = '不支持的文件类型';
            $upload_results[] = $result;
            continue;
        }

        $_FILES['temp_image'] = [
            'name' => $file['name'],
            'type' => $check['type'],
            'tmp_name' => $file['tmp_name'],
            'error' => $file['error'],
            'size' => $file['size']
        ];

        $attachment_id = media_handle_upload('temp_image', 0);
        if (is_wp_error($attachment_id)) {
            $result['message'] = '服务器上传失败：' . $attachment_id->get_error_message();
        } else {
            $attachment = get_post($attachment_id);
            if (!$attachment) {
                $result['message'] = '附件创建失败';
            } else {
                $result['success'] = true;
                $result['message'] = '上传成功';
                $result['data'] = [
                    'attachment_id' => $attachment_id,
                    'url' => wp_get_attachment_url($attachment_id),
                    'title' => $attachment->post_title
                ];
            }
        }
        $upload_results[] = $result;
    }

    return new WP_REST_Response([
        'code' => 0,
        'message' => count($upload_results) . ' 个文件处理完成',
        'data' => $upload_results
    ], 200);
}

// 获取媒体列表
function custom_db_api_get_media_list($request) {
    $page = absint($request->get_param('page')) ?: 1;
    $page_size = absint($request->get_param('page_size')) ?: 20;
    if ($page <= 0) {
        $page = 1;
    }
    if ($page_size <= 0) {
        $page_size = 20;
    }
    if ($page_size > 100) {
        $page_size = 100;
    }

    $query = new WP_Query([
        'post_type' => 'attachment',
        'post_status' => 'inherit',
        'posts_per_page' => $page_size,
        'paged' => $page,
        'orderby' => 'ID',
        'order' => 'DESC',
        'fields' => 'ids',
    ]);

    $items = [];
    foreach ($query->posts as $attachment_id) {
        $items[] = [
            'id' => (int) $attachment_id,
            'url' => wp_get_attachment_url($attachment_id),
        ];
    }

    return new WP_REST_Response([
        'code' => 0,
        'data' => [
            'list' => $items,
            'page' => $page,
            'page_size' => $page_size,
            'total' => (int) $query->found_posts,
        ],
    ], 200);
}

// 删除媒体文件（物理删除）
function custom_delete_file($request) {
    $res = $request->get_params();
    $attachment_id = isset($res['attachment_id']) ? absint($res['attachment_id']) : 0;

    if ($attachment_id <= 0) {
        return new WP_REST_Response([
            'code' => 400,
            'message' => '缺少附件ID'
        ], 400);
    }

    $attachment = get_post($attachment_id);
    if (!$attachment || $attachment->post_type !== 'attachment') {
        return new WP_REST_Response([
            'code' => 404,
            'message' => '附件不存在'
        ], 404);
    }

    $deleted = wp_delete_attachment($attachment_id, true);
    if (!$deleted) {
        return new WP_REST_Response([
            'code' => 400,
            'message' => '删除失败'
        ], 400);
    }

    return new WP_REST_Response([
        'code' => 0,
        'message' => '删除成功'
    ], 200);
}

}
