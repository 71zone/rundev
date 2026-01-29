import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

interface PackageJson {
  scripts?: Record<string, string>
}

/**
 * Convert glob pattern to regex
 * Supports: * (any characters)
 */
function patternToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
  return new RegExp(`^${escaped}$`)
}

/**
 * Scan package.json for scripts matching a pattern
 */
export function scanScripts(cwd: string, filter: string = 'dev*'): string[] {
  const packageJsonPath = join(cwd, 'package.json')

  if (!existsSync(packageJsonPath)) {
    return []
  }

  try {
    const content = readFileSync(packageJsonPath, 'utf-8')
    const packageJson: PackageJson = JSON.parse(content)

    if (!packageJson.scripts) {
      return []
    }

    const regex = patternToRegex(filter)
    const matchingScripts = Object.keys(packageJson.scripts)
      .filter((name) => regex.test(name))
      .sort((a, b) => {
        // Sort "dev" first, then alphabetically
        if (a === 'dev') return -1
        if (b === 'dev') return 1
        return a.localeCompare(b)
      })

    return matchingScripts
  } catch {
    return []
  }
}
