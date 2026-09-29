import { defineConfig } from 'astro/config';

// Basic config for now. We'll add the live site URL and any build
// settings later, once we're ready to deploy.
export default defineConfig({
  server: {
    // Bind explicitly to the IPv4 loopback. Without this, Node/Vite
    // resolves the "localhost" hostname to IPv6 (::1) only on this
    // machine, which Chrome fails to reach since nothing listens on
    // the IPv4 127.0.0.1 — the page just refuses to load.
    host: '127.0.0.1',
    port: 4321,
  },
});
