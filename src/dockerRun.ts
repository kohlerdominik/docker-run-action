import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as fs from 'fs'
import {v4 as uuidv4} from 'uuid'
import * as input from './input'
import {FileMap, Mapping} from './fileMap'

const fileMap = new FileMap(input.get('tempdir'))

fileMap.pushRunnerPath('GITHUB_ENV', process.env.GITHUB_ENV)
fileMap.pushRunnerPath('GITHUB_PATH', process.env.GITHUB_PATH)
fileMap.pushRunnerPath('GITHUB_OUTPUT', process.env.GITHUB_OUTPUT)
fileMap.pushRunnerPath('GITHUB_STATE', process.env.GITHUB_STATE)
fileMap.pushRunnerPath('GITHUB_STEP_SUMMARY', process.env.GITHUB_STEP_SUMMARY)

/*for (const item of fileMap.items.values()) {
  fs.chmodSync(item.runner.path, 0o666)
  fs.chownSync(item.runner.path, 0, 0)
}*/

const command = fileMap.pushRunnerPath(
  'CONTAINER_COMMAND',
  `${process.env.RUNNER_TEMP}/command_${uuidv4()}`
)

export async function runContainer(): Promise<void> {
  fs.writeFileSync(command!.runner.path, input.get('run'), {mode: 0o755})
  core.info(`
Wrote instruction file to "${command!.runner.path}"
with these instructions:
----- START OF FILE -----
${fs.readFileSync(command!.runner.path).toString()}
----- END OF FILE -----`)

  await exec.exec('docker', [
    `run`,
    // default network
    ...(input.has('default_network')
      ? [`--network=${input.get('default_network')}`]
      : []),
    // workdir
    ...(input.has('workdir') ? [`--workdir=${input.get('workdir')}`] : []),
    // environment options
    ...input.getEnvironment(),
    ...fileMap.map(
      (item: Mapping, key: string): string =>
        `--env=${key}=${item.container.path}`
    ),
    // volume options
    ...fileMap.map(
      (item: Mapping): string =>
        `--volume=${item.runner.path}:${item.container.path}`
    ),
    ...input.getVolumes(),
    // other options
    ...input.getSplittet('options'),
    '--privileged',
    input.get('image'),
    input.get('shell'),
    '-e',
    command!.container.path
  ])
}
