import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BEACON_BLOCK = /[ \t]*<!-- BEACON:START[\s\S]*?<!-- BEACON:END -->\n?/

/**
 * The pageview beacon belongs on the website only. Native builds go through
 * `npm run build` + `npx cap sync`, so the default must be beacon-free — if it
 * ships inside the apps it collects a persistent visitor id and contradicts the
 * "no data collected" declarations on both stores.
 *
 * Opt in with `npm run build:web` (what Vercel runs). Failing the wrong way just
 * costs the website its analytics, which is the cheap direction to fail.
 */
function stripWebOnlyBeacon() {
  const includeBeacon = process.env.SS_WEB_BEACON === '1'
  return {
    name: 'strip-web-only-beacon',
    transformIndexHtml(html) {
      return includeBeacon ? html : html.replace(BEACON_BLOCK, '')
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), stripWebOnlyBeacon()],
})
