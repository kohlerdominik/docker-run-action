import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as fs from 'fs'
import {v4 as uuidv4} from 'uuid'
import * as input from './input'

export const COMMAND_FILE_NAME = `${uuidv4()}.sh`
export const LOCAL_COMMAND_PATH = `${process.env.RUNNER_TEMP}/${COMMAND_FILE_NAME}`
export const CONTAINER_COMMAND_PATH = `/tmp/${COMMAND_FILE_NAME}`

export async function runContainer(): Promise<void> {
  fs.writeFileSync(LOCAL_COMMAND_PATH, input.get('run'), {mode: 0o755})
  core.info(`
Wrote instruction file to "${LOCAL_COMMAND_PATH}"
with these instructions:
----- START OF FILE -----
${fs.readFileSync(LOCAL_COMMAND_PATH).toString()}
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
    // volume options
    `--volume=${LOCAL_COMMAND_PATH}:${CONTAINER_COMMAND_PATH}`,
    ...input.getVolumes(),
    // other options
    ...input.getSplittet('options'),
    input.get('image'),
    input.get('shell'),
    '-e',
    CONTAINER_COMMAND_PATH
  ])
}
