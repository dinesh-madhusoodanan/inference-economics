import type { Config } from '@netlify/functions'
import { getStore } from '@netlify/blobs'

/**
 * Scheduled poller for an upstream "source" git repository.
 *
 * Every run it asks the git host for the latest commit on the tracked branch,
 * compares it to the last commit it saw (persisted in Netlify Blobs), and — when
 * something new has landed — triggers a Netlify build hook. Netlify then pulls the
 * change and rebuilds/redeploys the site.
 *
 * Configuration (set these as environment variables on the site):
 *   SOURCE_REPO          required  "owner/repo" on the git host (e.g. "vercel/next.js")
 *   BUILD_HOOK_URL       required  Netlify build hook URL to POST when changes are found
 *   SOURCE_BRANCH        optional  branch to track (default "main")
 *   SOURCE_GITHUB_TOKEN  optional  token for private repos / higher API rate limits
 *   SOURCE_API_BASE      optional  API base for GitHub Enterprise (default "https://api.github.com")
 */

const STORE_NAME = 'source-repo-sync'
const STATE_KEY = 'last-commit'

interface SyncState {
  repo: string
  branch: string
  sha: string
  triggeredAt: string
}

export default async (req: Request) => {
  const env = Netlify.env
  const repo = env.get('SOURCE_REPO')
  const buildHookUrl = env.get('BUILD_HOOK_URL')
  const branch = env.get('SOURCE_BRANCH') || 'main'
  const token = env.get('SOURCE_GITHUB_TOKEN')
  const apiBase = (env.get('SOURCE_API_BASE') || 'https://api.github.com').replace(/\/$/, '')

  if (!repo || !buildHookUrl) {
    console.warn(
      '[source-sync] Skipping: set SOURCE_REPO and BUILD_HOOK_URL environment variables to enable polling.',
    )
    return
  }

  // 1. Ask the git host for the latest commit on the tracked branch.
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'netlify-source-repo-poller',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const commitUrl = `${apiBase}/repos/${repo}/commits/${encodeURIComponent(branch)}`
  const res = await fetch(commitUrl, { headers })
  if (!res.ok) {
    console.error(
      `[source-sync] Failed to read latest commit for ${repo}@${branch}: ${res.status} ${res.statusText}`,
    )
    return
  }

  const commit = (await res.json()) as { sha?: string }
  const latestSha = commit.sha
  if (!latestSha) {
    console.error('[source-sync] Git host response did not include a commit sha.')
    return
  }

  // 2. Compare against the last commit we acted on.
  const store = getStore({ name: STORE_NAME, consistency: 'strong' })
  const previous = (await store.get(STATE_KEY, { type: 'json' })) as SyncState | null

  if (previous?.sha === latestSha) {
    console.log(`[source-sync] No change. ${repo}@${branch} still at ${latestSha.slice(0, 8)}.`)
    return
  }

  const isFirstRun = !previous
  console.log(
    isFirstRun
      ? `[source-sync] First run for ${repo}@${branch}; recording ${latestSha.slice(0, 8)} and triggering a build.`
      : `[source-sync] New commit on ${repo}@${branch}: ${previous?.sha.slice(0, 8)} -> ${latestSha.slice(0, 8)}. Triggering build.`,
  )

  // 3. New commit -> tell Netlify to pull the changes and rebuild.
  const hookRes = await fetch(buildHookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trigger_title: `source change ${latestSha.slice(0, 8)} on ${branch}` }),
  })
  if (!hookRes.ok) {
    console.error(`[source-sync] Build hook failed: ${hookRes.status} ${hookRes.statusText}`)
    return
  }

  // 4. Remember what we just built so we don't trigger again for the same commit.
  const state: SyncState = {
    repo,
    branch,
    sha: latestSha,
    triggeredAt: new Date().toISOString(),
  }
  await store.setJSON(STATE_KEY, state)
  console.log(`[source-sync] Build triggered and state saved at ${state.triggeredAt}.`)
}

export const config: Config = {
  // Poll every 5 minutes. Scheduled functions run only on published deploys.
  schedule: '*/5 * * * *',
}
