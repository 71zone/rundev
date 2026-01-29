import { defineCommand, runMain } from 'citty'
import * as p from '@clack/prompts'
import { execa } from 'execa'
import { resolve } from 'node:path'

import { loadConfig } from './lib/config.js'
import { detectEnvironment, switchEnvironment } from './lib/env-manager.js'
import { scanScripts } from './lib/script-scanner.js'
import { getLastScript, saveLastScript } from './lib/state.js'
import { selectScript } from './lib/prompts.js'

const main = defineCommand({
  meta: {
    name: 'rundev',
    version: '0.1.0',
    description: 'Smart dev server launcher with environment switching',
  },
  args: {
    env: {
      type: 'positional',
      description: 'Environment name (e.g., staging, production)',
      required: false,
    },
    last: {
      type: 'boolean',
      alias: 'l',
      description: 'Run the last used script without prompting',
      default: false,
    },
  },
  async run({ args }) {
    const cwd = resolve(process.cwd())

    p.intro('rundev')

    // 1. Load configuration
    const config = loadConfig(cwd)

    // 2. Detect or use provided environment
    let env = args.env as string | undefined
    if (!env) {
      env = detectEnvironment(cwd) ?? undefined
      if (env) {
        p.log.info(`Detected environment: ${env}`)
      }
    }

    // 3. Switch environment files if env is available
    if (env) {
      const result = switchEnvironment(env, cwd, config)
      if (result.success) {
        p.log.success(result.message)
      } else {
        p.log.warn(result.message)
      }
    } else {
      p.log.warn('No environment detected. Skipping env file switch.')
    }

    // 4. Scan for dev scripts
    const scripts = scanScripts(cwd, config.scriptFilter)

    if (scripts.length === 0) {
      p.log.error(`No scripts matching "${config.scriptFilter}" found in package.json`)
      p.outro('Exiting')
      process.exit(1)
    }

    // 5. Determine which script to run
    const lastScript = getLastScript(cwd)
    let scriptToRun: string | null = null

    if (args.last && lastScript) {
      // Use last script if -l flag and we have a saved script
      scriptToRun = lastScript
      p.log.info(`Using last script: ${scriptToRun}`)
    } else if (args.last && !lastScript) {
      p.log.warn('No last script saved. Please select one.')
    }

    if (!scriptToRun) {
      if (scripts.length === 1) {
        // Auto-select if only one script
        scriptToRun = scripts[0]
        p.log.info(`Auto-selected: ${scriptToRun}`)
      } else {
        // Prompt user to select
        scriptToRun = await selectScript({ scripts, lastScript })
      }
    }

    if (!scriptToRun) {
      p.outro('Cancelled')
      process.exit(0)
    }

    // 6. Save selection for next time
    saveLastScript(cwd, scriptToRun)

    // 7. Run the script
    p.outro(`Running: npm run ${scriptToRun}`)

    try {
      await execa('npm', ['run', scriptToRun], {
        cwd,
        stdio: 'inherit',
      })
    } catch (error) {
      // execa throws on non-zero exit, but we've already handed off stdio
      process.exit(1)
    }
  },
})

runMain(main)
