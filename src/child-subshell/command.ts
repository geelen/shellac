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
  private readonly handleStdoutDataBind: OmitThisParameter<
    (data: string) => void
  >
  private readonly handleStderrDataBind: OmitThisParameter<
    (data: string) => void
  >
  private runningState: RUNNING_STATE
  private logger: Logger

  private retCode?: number
  private promiseResolve?: any;
  private promiseReject?: any;
  private promise?: Promise<unknown>;
  private timer?: NodeJS.Timeout;

  constructor({
    shell,
    cmd,
    interactive,
  }: {
    shell: Shell
    cmd: string
    interactive?: Interactive
  }) {
    this.shell = shell
    this.cmd = cmd
    this.interactive = interactive

    this.exec = `${this.cmd}`
    this.exec += ';echo __END_OF_COMMAND_[$?]__\n'

    this.handleStdoutDataBind = this.handleStdoutData.bind(this)
    this.shell.getStdout().on('data', this.handleStdoutDataBind)

    this.handleStderrDataBind = this.handleStderrData.bind(this)
    this.shell.getStderr().on('data', this.handleStderrDataBind)

    this.runningState = RUNNING_STATE.INIT

    this.logger = shell.getLogger()

    return this
  }

  handleStdoutData(data: string) {
    const lines = data.split(/\r?\n/)

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const match = line.match(/__END_OF_COMMAND_\[(\d+)\]__/)

      if (match) {
        this.retCode = parseInt(match[1])

        this.finish()
        return
      } else {
        this.logger(line)
      }

      if (this.interactive) {
        this.interactive(line, this.handleStdinData.bind(this))
      }
    }
  }

  handleStderrData(data: string) {
    this.logger(data)
  }

  handleStdinData(data: string) {
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

    return promise
  }

  finish() {
    this.runningState = RUNNING_STATE.END

    clearTimeout(this.timer!)

    this.shell.getStdout().removeListener('data', this.handleStdoutDataBind)
    this.shell.getStderr().removeListener('data', this.handleStderrDataBind)

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
