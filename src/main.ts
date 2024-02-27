import * as os from 'os'
import * as core from '@actions/core'
import * as dockerRun from './dockerRun'

async function run(): Promise<void> {
  try {
    await dockerRun.runContainer()

    if (os.platform() !== 'linux') {
      throw new Error('This actions works only on linux platform.')
    }
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : 'Unkown error')
  }
}

run()
