const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co",
      "font-src 'self' data:",
      "frame-ancestors 'none'",
    ].join('; '),
  },
];

// Session-gated pages must never be served from the browser's back/forward
// cache (bfcache) or any HTTP cache — otherwise pressing Back after logout
// can restore the last-rendered authenticated page from memory without
// re-running middleware or any auth check. `no-store` opts these routes out
// of bfcache entirely, forcing a fresh navigation (and therefore a fresh
// middleware/session check) every time.
const noStoreHeaders = [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }];
const authGatedSources = [
  '/admin/dashboard',
  '/admin/dashboard/:path*',
  '/staff/dashboard',
  '/staff/dashboard/:path*',
  '/dashboard',
  '/dashboard/:path*',
  '/profile',
  '/profile/:path*',
  '/loans',
  '/loans/:path*',
  '/loan-products',
  '/loan-products/:path*',
  '/repledge',
  '/repledge/:path*',
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      ...authGatedSources.map((source) => ({ source, headers: noStoreHeaders })),
    ];
  },
};
export default nextConfig;
