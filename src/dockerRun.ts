import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as fs from 'fs'
import {v4 as uuidv4} from 'uuid'
import * as input from './input'
import {FileMap, Mapping} from './fileMap'

export async function runContainer(): Promise<void> {
  // prepare the files for the command
  const fileMap = new FileMap(input.get('tempdir'))

  fileMap.pushRunnerPath('GITHUB_ENV', process.env.GITHUB_ENV)
  fileMap.pushRunnerPath('GITHUB_PATH', process.env.GITHUB_PATH)
  fileMap.pushRunnerPath('GITHUB_OUTPUT', process.env.GITHUB_OUTPUT)
  fileMap.pushRunnerPath('GITHUB_STATE', process.env.GITHUB_STATE)
  fileMap.pushRunnerPath('GITHUB_STEP_SUMMARY', process.env.GITHUB_STEP_SUMMARY)
  const command = fileMap.pushRunnerPath(
    'CONTAINER_COMMAND',
    `${process.env.RUNNER_TEMP}/command_${uuidv4()}`
  )

  fs.writeFileSync(command!.runner.path, input.get('run'), {mode: 0o755})
  await core.group(`Instruction file "${command!.runner.path}"`, async () =>
    core.info(fs.readFileSync(command!.runner.path).toString())
  )

  await pullImageIfMissing(input.get('image'))

  const args = [
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
    input.get('image'),
    input.get('shell'),
    '-e',
    command!.container.path
  ]

  await core.group('Docker command', async () =>
    core.info(['docker', ...args].join(' '))
  )

  // exec.exec always echoes the full command line ("[command]/usr/bin/docker run ...")
  // and offers no way to suppress only that echo. We already logged the command in
  // the collapsible group above, so run silently and forward the container's
  // stdout/stderr ourselves. This keeps the user's output streaming and ungrouped,
  // so their own ::group:: markers still work.
  await exec.exec('docker', args, {
    silent: true,
    listeners: {
      stdout: (data: Buffer) => process.stdout.write(data),
      stderr: (data: Buffer) => process.stderr.write(data)
    }
  })
}

// Mirrors docker run's default pull policy (pull only when the image is missing
// locally) so images built earlier in the job without being pushed keep working.
// Pulling here instead of letting docker run do it lets us collapse the pull output.
async function pullImageIfMissing(image: string): Promise<void> {
  // inspect prints the image's full JSON on success, hence silent
  const inspect = await exec.exec('docker', ['image', 'inspect', image], {
    silent: true,
    ignoreReturnCode: true
  })

  if (inspect === 0) {
    core.info(`Image "${image}" found locally, skipping pull`)
    return
  }

  await core.group(`Pull image "${image}"`, async () =>
    exec.exec('docker', ['pull', image])
  )
}
