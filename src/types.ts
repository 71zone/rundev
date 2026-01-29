export interface Mapping {
  pattern: string
  envPath: string
}

export interface GlobalConfig {
  envDir: string
  globalEnvFile: string
  mappings: Mapping[]
}

export interface LocalConfig {
  envPath?: string
  scriptFilter?: string
}

export interface ResolvedConfig {
  envDir: string
  globalEnvFile: string
  envPath: string | null
  scriptFilter: string
}

export interface ProjectState {
  [projectPath: string]: string
}
