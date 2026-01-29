import Conf from 'conf'
import type { ProjectState } from '../types.js'

const store = new Conf<ProjectState>({
  projectName: 'rundev',
  projectSuffix: '',
})

/**
 * Get the last used script for a project
 */
export function getLastScript(projectPath: string): string | null {
  return store.get(projectPath) ?? null
}

/**
 * Save the last used script for a project
 */
export function saveLastScript(projectPath: string, script: string): void {
  store.set(projectPath, script)
}
