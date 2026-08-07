import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Global on purpose. Without /g, String.replace strips only the FIRST match,
// so adding a second WEBONLY block silently leaves the other one in the native
// bundle — which is how the website's privacy footer nearly shipped inside the
// apps. Any number of blocks, any order, all removed.
const WEB_ONLY_BLOCKS = [
  /[ \t]*<!-- BEACON:START[\s\S]*?<!-- BEACON:END -->\n?/g,
  /[ \t]*<!-- WEBONLY:START[\s\S]*?<!-- WEBONLY:END -->\n?/g,
]

/**
 * Some markup belongs on the website only. Native builds go through
 * `npm run build` + `npx cap sync`, so the default must exclude all of it:
 *
 * - BEACON — the pageview beacon. Inside the apps it collects a persistent
 *   visitor id and contradicts the "no data collected" store declarations.
 * - WEBONLY — the privacy link that beacon obliges the website to show. The
 *   apps disclose through their store listings instead, and a stray web
 *   footer pinned under a native view is just wrong.
 *
 * Opt in with `npm run build:web` (what Vercel runs). Failing the wrong way
 * only costs the website its analytics and a footer link, which is the cheap
 * direction to fail.
 */
function stripWebOnlyBlocks() {
  const includeWebOnly = process.env.SS_WEB_BEACON === '1'
  return {
    name: 'strip-web-only-blocks',
    transformIndexHtml(html) {
      if (includeWebOnly) return html
      return WEB_ONLY_BLOCKS.reduce((out, block) => out.replace(block, ''), html)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), stripWebOnlyBlocks()],
})
