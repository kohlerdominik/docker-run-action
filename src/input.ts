import * as core from '@actions/core'

const required = ['image', 'run']

export function has(name: string): boolean {
  return !!get(name)
}

export function get(name: string): string {
  return core.getInput(name, {
    required: required.includes(name)
  })
}

export function getSplittet(name: string): string[] {
  return get(name)
    .split(/[\s]+/)
    .filter((instruction: string) => !!instruction)
}

export function getEnvironment(): string[] {
  return getSplittet('environment').map(
    (variable: string) => `--env=${variable}`
  )
}

export function getVolumes(): string[] {
  return getSplittet('volumes').map((volume: string) => `--volume=${volume}`)
}

export function getTempDir(): string {
  return get('tempDir')
}
