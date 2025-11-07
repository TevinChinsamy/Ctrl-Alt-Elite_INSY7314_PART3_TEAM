/**
 * Vite Plugin for Security Headers
 *
 * Adds comprehensive security headers to production builds
 * Matches the API's A+ security configuration
 */

export function securityHeaders() {
  return {
    name: 'security-headers',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Content Security Policy (CSP)
        res.setHeader(
          'Content-Security-Policy',
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' data: https:; " +
          "font-src 'self'; " +
          "connect-src 'self' http://localhost:5001 https://localhost:5001; " +
          "frame-ancestors 'none'; " +
          "base-uri 'self'; " +
          "form-action 'self'"
        );

        // HTTP Strict Transport Security (HSTS)
        res.setHeader(
          'Strict-Transport-Security',
          'max-age=31536000; includeSubDomains; preload'
        );

        // Prevent clickjacking
        res.setHeader('X-Frame-Options', 'DENY');

        // Prevent MIME type sniffing
        res.setHeader('X-Content-Type-Options', 'nosniff');

        // XSS Protection (legacy browsers)
        res.setHeader('X-XSS-Protection', '1; mode=block');

        // Referrer Policy
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Permissions Policy (formerly Feature Policy)
        res.setHeader(
          'Permissions-Policy',
          'geolocation=(), microphone=(), camera=(), payment=()'
        );

        // Remove X-Powered-By header
        res.removeHeader('X-Powered-By');

        // Cross-Origin policies
        res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

        // Cache control for security
        res.setHeader(
          'Cache-Control',
          'no-store, no-cache, must-revalidate, proxy-revalidate'
        );
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        // Same headers for preview mode
        res.setHeader(
          'Content-Security-Policy',
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' data: https:; " +
          "font-src 'self'; " +
          "connect-src 'self' http://localhost:5001 https://localhost:5001; " +
          "frame-ancestors 'none'; " +
          "base-uri 'self'; " +
          "form-action 'self'"
        );

        res.setHeader(
          'Strict-Transport-Security',
          'max-age=31536000; includeSubDomains; preload'
        );

        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader(
          'Permissions-Policy',
          'geolocation=(), microphone=(), camera=(), payment=()'
        );
        res.removeHeader('X-Powered-By');
        res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader(
          'Cache-Control',
          'no-store, no-cache, must-revalidate, proxy-revalidate'
        );
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        next();
      });
    },
  };
}

export default securityHeaders;
