import * as p from '@clack/prompts'

interface SelectScriptOptions {
  scripts: string[]
  lastScript: string | null
}

/**
 * Prompt user to select a script
 */
export async function selectScript({
  scripts,
  lastScript,
}: SelectScriptOptions): Promise<string | null> {
  // Sort scripts with last used first
  const sortedScripts = [...scripts].sort((a, b) => {
    if (a === lastScript) return -1
    if (b === lastScript) return 1
    if (a === 'dev') return -1
    if (b === 'dev') return 1
    return a.localeCompare(b)
  })

  const result = await p.select({
    message: 'Select a dev script to run:',
    options: sortedScripts.map((script) => ({
      value: script,
      label: script === lastScript ? `${script} (last used)` : script,
    })),
  })

  if (p.isCancel(result)) {
    return null
  }

  return result as string
}
