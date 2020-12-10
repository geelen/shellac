import Shell from './shell'
import { Interactive, Logger } from './types'

enum RUNNING_STATE {
  INIT,
  START,
  END,
}

export default class Command {
  private shell: Shell
  private readonly cmd: string
  private readonly interactive: Interactive | undefined
  private readonly exec: string
  private runningState: RUNNING_STATE
  private pipe_logs: boolean

  private retCode?: number
  private promiseResolve?: any
  private promiseReject?: any
  private promise?: Promise<unknown>
  private timer?: NodeJS.Timeout

  stdout: string
  stderr: string

  constructor({
    cwd,
    shell,
    cmd,
    interactive,
    pipe_logs = false,
  }: {
    cwd: string
    shell: Shell
    cmd: string
    interactive?: Interactive
    pipe_logs: boolean
  }) {
    this.shell = shell
    this.cmd = cmd
    this.interactive = interactive

    this.exec = `cd ${cwd};\n${this.cmd};echo __END_OF_COMMAND_[$?]__\n`

    this.shell.getStdout().on('data', this.handleStdoutData)
    this.shell.getStderr().on('data', this.handleStderrData)
    this.runningState = RUNNING_STATE.INIT

    this.pipe_logs = pipe_logs
    this.stdout = ''
    this.stderr = ''
  }

  handleStdoutData = (data: string) => {
    console.log({ handleStdoutData: data })
    const lines = data.split(/\r?\n/)

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const match = line.match(/__END_OF_COMMAND_\[(\d+)\]__/)

      if (match) {
        this.retCode = parseInt(match[1])

        this.finish()
        return
      } else {
        this.stdout += line
      }

      if (this.interactive) {
        this.interactive(line, this.handleStdinData)
      }
    }
  }

  handleStderrData = (data: string) => {
    console.log({ handleStderrData: data })
    this.stderr += data
  }

  handleStdinData = (data: string) => {
    this.shell.getStdin().write(`${data}\n`)
  }

  run() {
    let promiseResolve, promiseReject

    const promise = new Promise((resolve, reject) => {
      promiseResolve = resolve
      promiseReject = reject
    })

    this.promiseResolve = promiseResolve
    this.promiseReject = promiseReject
    this.promise = promise

    this.runningState = RUNNING_STATE.START

    this.shell.getStdin().write(this.exec)

    this.timer = setTimeout(() => {
      if (this.runningState !== RUNNING_STATE.END) {
        const obj = {
          retCode: -1,
          cmd: this.cmd,
        }

        this.promiseReject(obj)
      }
    }, 86400000)

    return promise.then(() => this)
  }

  finish() {
    this.runningState = RUNNING_STATE.END

    clearTimeout(this.timer!)

    this.shell.getStdout().removeListener('data', this.handleStdoutData)
    this.shell.getStderr().removeListener('data', this.handleStderrData)

    const obj = {
      retCode: this.retCode,
      cmd: this.cmd,
    }

    if (this.retCode) {
      return this.promiseReject(obj)
    }

    return this.promiseResolve(obj)
  }
}
