export interface File {
  path: string
  file: string
  dir: string
}

export interface Mapping {
  runner: File
  container: File
}

export class FileMap {
  items: Map<string, Mapping> = new Map()
  containerTempDir: string

  constructor(containerTempDir: string) {
    this.containerTempDir = containerTempDir.endsWith('/')
      ? containerTempDir
      : `${containerTempDir}/`
  }

  map<U>(callbackfn: (value: Mapping, key: string) => U): U[] {
    return Array.from(this.items.entries()).map(([key, value]) =>
      callbackfn(value, key)
    )
  }

  pushRunnerPath(key: string, runnerPath: unknown): Mapping | undefined {
    if (typeof runnerPath === 'string' && runnerPath.length > 0) {
      const mapping = this.runnerPathToMapping(runnerPath)
      this.items.set(key, mapping)
    }

    return this.items.get(key)
  }

  protected runnerPathToMapping(runnerPath: string): Mapping {
    const runner = this.pathToFile(runnerPath)

    const container = {
      dir: this.containerTempDir,
      file: runner.file,
      path: this.containerTempDir + runner.file
    }

    return {runner, container}
  }

  protected pathToFile(path: string): File {
    const lastSlashIndex = path.lastIndexOf('/')
    const dir = path.substring(0, lastSlashIndex)
    const file = path.substring(lastSlashIndex + 1)

    return {path, dir, file}
  }
}
