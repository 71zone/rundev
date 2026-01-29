import { readFileSync, writeFileSync, existsSync, copyFileSync, appendFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ResolvedConfig } from '../types.js'

/**
 * Detect environment from existing .env file or AWS_PROFILE
 */
export function detectEnvironment(cwd: string): string | null {
  const envFile = join(cwd, '.env')

  // Try reading STAGE from existing .env
  if (existsSync(envFile)) {
    try {
      const content = readFileSync(envFile, 'utf-8')
      const match = content.match(/^STAGE=(.+)$/m)
      if (match) {
        return match[1].trim()
      }
    } catch {
      // Fall through to AWS_PROFILE
    }
  }

  // Try extracting from AWS_PROFILE (e.g., "user@staging" -> "staging")
  const awsProfile = process.env.AWS_PROFILE
  if (awsProfile) {
    const match = awsProfile.match(/@(.+)$/)
    if (match) {
      return match[1]
    }
  }

  return null
}

/**
 * Switch environment files
 * 1. Find the source env file using config mapping
 * 2. Copy source to .env
 * 3. Append global env file if it exists
 */
export function switchEnvironment(
  env: string,
  cwd: string,
  config: ResolvedConfig
): { success: boolean; message: string } {
  if (!config.envPath) {
    return {
      success: false,
      message: 'No environment path mapping found for this directory',
    }
  }

  // Resolve the source env file path
  // Replace {env} placeholder with actual environment name
  const envPathResolved = config.envPath.replace('{env}', env)
  const sourceEnvFile = join(config.envDir, envPathResolved)

  if (!existsSync(sourceEnvFile)) {
    return {
      success: false,
      message: `Environment file not found: ${sourceEnvFile}`,
    }
  }

  const targetEnvFile = join(cwd, '.env')

  try {
    // Copy source env file to .env
    copyFileSync(sourceEnvFile, targetEnvFile)

    // Append global env file if it exists
    if (existsSync(config.globalEnvFile)) {
      const globalContent = readFileSync(config.globalEnvFile, 'utf-8')
      appendFileSync(targetEnvFile, '\n' + globalContent)
    }

    return {
      success: true,
      message: `Switched to ${env} environment`,
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to switch environment: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}
