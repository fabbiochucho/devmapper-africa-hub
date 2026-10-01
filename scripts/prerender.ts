// Runs after `vite build` (postbuild hook). This is a pure client-rendered SPA - a crawler
// fetching a route's raw HTML gets nothing but the empty shell, no page content. Fixes that for
// the public, unauthenticated routes by spinning up real headless Chromium against the built
// `dist/`, letting each route render exactly as a visitor's browser would (including live
// Supabase data), and saving the resulting HTML as a static file per route.
//
// Scope: only routes with NO <Guarded>/<RoleRoute> wrapper in src/App.tsx, and only
// non-parameterized ones (skips /project/:id, /change-makers/:id, /certificates/:certificateNumber,
// /verify/:certNumber - there's no single "right" id to bake into a static snapshot of those).
// Authenticated routes are correctly left as pure CSR: a crawler shouldn't be indexing a
// logged-in dashboard, and prerendering them wouldn't show real content anyway since the
// headless browser never logs in.
//
// Caveat inherent to prerendering anything data-driven: these pages show live Supabase data as
// of whenever this script last ran (i.e. as of the last deploy), not truly real-time. That's the
// same tradeoff any static-generation approach makes, and it's a strict improvement over the
// current state (zero indexed content on every single route).

import { chromium } from "playwright"
import { spawn, type ChildProcess } from "child_process"
import { mkdirSync, writeFileSync } from "fs"
import { resolve, dirname } from "path"

const PORT = 4175
const BASE = `http://localhost:${PORT}`
const DIST = resolve("dist")

const PUBLIC_ROUTES = [
  "/",
  "/search",
  "/countries",
  "/change-makers",
  "/fundraising",
  "/guidelines",
  "/support",
  "/resources",
  "/about",
  "/contact",
  "/pricing",
  "/sdg-agenda2063",
  "/sdg-overview",
  "/connect",
  "/spvf-standards",
  "/dspm-methodology",
  "/verify",
  "/sdg-indicators",
  "/certification-workflow",
  "/platform-overview",
  "/carbon-marketplace",
  "/auth",
]

function waitForServer(url: string, timeoutMs = 30_000): Promise<void> {
  const start = Date.now()
  return new Promise((done, fail) => {
    const tryOnce = () => {
      fetch(url)
        .then(() => done())
        .catch(() => {
          if (Date.now() - start > timeoutMs) fail(new Error(`Preview server didn't come up within ${timeoutMs}ms`))
          else setTimeout(tryOnce, 200)
        })
    }
    tryOnce()
  })
}

function outputPathFor(routePath: string): string {
  if (routePath === "/") return resolve(DIST, "index.html")
  return resolve(DIST, routePath.replace(/^\//, ""), "index.html")
}

async function main() {
  const preview: ChildProcess = spawn(`npx vite preview --port ${PORT} --strictPort`, { stdio: "pipe", shell: true })
  let previewOutput = ""
  preview.stdout?.on("data", (d) => (previewOutput += d.toString()))
  preview.stderr?.on("data", (d) => (previewOutput += d.toString()))

  try {
    await waitForServer(BASE)

    let browser
    try {
      browser = await chromium.launch()
    } catch (launchError) {
      // Build environments without a Playwright browser installed (e.g. the hosted publish
      // pipeline) shouldn't fail the whole deploy - fall back to the plain SPA shell.
      console.warn(`Prerender skipped: Chromium unavailable (${(launchError as Error).message.split("\n")[0]})`)
      return
    }
    const page = await browser.newPage()

    for (const routePath of PUBLIC_ROUTES) {
      try {
        await page.goto(`${BASE}${routePath}`, { waitUntil: "networkidle", timeout: 20_000 })
        // Give React a tick past networkidle for any state-driven head-tag updates to commit.
        await page.waitForTimeout(150)

        const html = await page.content()
        const outPath = outputPathFor(routePath)
        mkdirSync(dirname(outPath), { recursive: true })
        writeFileSync(outPath, html)
        console.log(`prerendered ${routePath} -> ${outPath.replace(DIST, "dist")}`)
      } catch (routeError) {
        // One slow/broken route (e.g. a flaky Supabase call) shouldn't take down the rest -
        // that route just keeps its original empty-shell dist file instead of a worse, partial one.
        console.error(`skipped ${routePath}: ${(routeError as Error).message}`)
      }
    }

    await browser.close()
  } catch (error) {
    console.error("Prerender failed:", error)
    console.error("--- vite preview output ---")
    console.error(previewOutput)
    process.exitCode = 1
  } finally {
    preview.kill()
  }
}

main()
