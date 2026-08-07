import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import pkg from './package.json' with { type: 'json' }

const WEB_ONLY_BLOCKS = [
  /[ \t]*<!-- BEACON:START[\s\S]*?<!-- BEACON:END -->\n?/,
  /[ \t]*<!-- WEBONLY:START[\s\S]*?<!-- WEBONLY:END -->\n?/,
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
  define: {
    // The rating prompt asks at most once per released version. If package.json
    // lags a native release the gate simply stays shut, which is the safe way to
    // fail — but bump it each release so a new version can earn a fresh prompt.
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
})
