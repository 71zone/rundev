import { readFileSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import type { GlobalConfig, LocalConfig, ResolvedConfig, Mapping } from '../types.js'

const GLOBAL_CONFIG_PATH = join(homedir(), '.config', 'rundev', 'config.json')

function expandTilde(path: string): string {
  return path.replace(/^~/, homedir())
}

function loadGlobalConfig(): GlobalConfig {
  const defaultConfig: GlobalConfig = {
    envDir: '~/.config/env',
    globalEnvFile: '~/.config/env/global',
    mappings: [],
  }

  if (!existsSync(GLOBAL_CONFIG_PATH)) {
    return defaultConfig
  }

  try {
    const content = readFileSync(GLOBAL_CONFIG_PATH, 'utf-8')
    return { ...defaultConfig, ...JSON.parse(content) }
  } catch {
    return defaultConfig
  }
}

function loadLocalConfig(cwd: string): LocalConfig | null {
  const localConfigPath = join(cwd, '.rundevrc.json')

  if (!existsSync(localConfigPath)) {
    return null
  }

  try {
    const content = readFileSync(localConfigPath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

function matchPattern(pattern: string, cwd: string): boolean {
  // Convert glob pattern to regex
  // Supports: * (single segment), ** (multiple segments)
  const regexPattern = pattern
    .replace(/\*\*/g, '<<<DOUBLE>>>')
    .replace(/\*/g, '[^/]+')
    .replace(/<<<DOUBLE>>>/g, '.*')

  const regex = new RegExp(`${regexPattern}$`)
  return regex.test(cwd)
}

function findMatchingMapping(mappings: Mapping[], cwd: string): Mapping | null {
  for (const mapping of mappings) {
    if (matchPattern(mapping.pattern, cwd)) {
      return mapping
    }
  }
  return null
}

export function loadConfig(cwd: string): ResolvedConfig {
  const globalConfig = loadGlobalConfig()
  const localConfig = loadLocalConfig(cwd)

  // Determine envPath
  let envPath: string | null = null

  if (localConfig?.envPath) {
    // Local config takes precedence
    envPath = localConfig.envPath
  } else {
    // Find matching mapping from global config
    const mapping = findMatchingMapping(globalConfig.mappings, cwd)
    if (mapping) {
      envPath = mapping.envPath
    }
  }

  return {
    envDir: expandTilde(globalConfig.envDir),
    globalEnvFile: expandTilde(globalConfig.globalEnvFile),
    envPath,
    scriptFilter: localConfig?.scriptFilter ?? 'dev*',
  }
}

export { GLOBAL_CONFIG_PATH }
