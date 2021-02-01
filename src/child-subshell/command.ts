import Shell from './shell'
import {ExitExpected, Interactive} from './types'
import { trimFinalNewline } from './utils'

enum RUNNING_STATE {
  INIT,
  START,
  END,
}

export default class Command {
  private shell: Shell
  private readonly cmd: string
  private readonly cwd: string
  private readonly interactive: Interactive | undefined
  private readonly exec: string
  private runningState: RUNNING_STATE
  private pipe_logs: boolean
  private exit_expected: ExitExpected

  private retCode?: number
  private promiseResolve?: any
  private promiseReject?: any
  private promise?: Promise<unknown>
  private timer?: ReturnType<typeof setTimeout>

  stdout: string
  stderr: string

  constructor({
    cwd,
    shell,
    cmd,
    interactive,
    pipe_logs = false,
    exit_expected = false,
  }: {
    cwd: string
    shell: Shell
    cmd: string
    interactive?: Interactive
    pipe_logs: boolean,
    exit_expected: ExitExpected
  }) {
    this.shell = shell
    this.cmd = cmd
    this.cwd = cwd
    this.interactive = interactive
    this.exit_expected = exit_expected;

    this.exec = `cd ${cwd};\n${this.cmd};echo __END_OF_COMMAND_[$?]__\n`

    this.shell.getStdout().on('data', this.handleStdoutData)
    this.shell.getStderr().on('data', this.handleStderrData)
    this.runningState = RUNNING_STATE.INIT

    this.pipe_logs = pipe_logs
    this.stdout = ''
    this.stderr = ''
  }

  handleStdoutData = (data: string) => {
    const lines = trimFinalNewline(data).split(/\r?\n/)

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const match = line.match(/__END_OF_COMMAND_\[(\d+)\]__/)

      if (match) {
        this.retCode = parseInt(match[1])

        setImmediate(this.finish)
        return
      } else {
        if (this.pipe_logs) process.stdout.write(line + '\n')
        this.stdout += line + '\n'
      }

      if (this.interactive) {
        this.interactive(line, this.handleStdinData)
      }
    }
  }

  handleStderrData = (data: string) => {
    if (this.pipe_logs) process.stderr.write(data)
    this.stderr += data
  }

  handleStdinData = (data: string) => {
    this.shell.getStdin().write(`${data}\n`)
  }

  run = () => {
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

    return promise.then(
      () => this,
      (e) => {
        this.log(
          `\n\nSHELLAC COMMAND FAILED!\nExecuting: ${this.cmd} in ${this.cwd}\n\nSTDOUT:\n\n`
        )
        this.log(`${this.stdout}\n\n`)
        this.log(`STDERR:\n\n${this.stderr}\n\n`)
        this.shell.exit()
        throw e
      }
    )
  }

  finish = () => {
    this.runningState = RUNNING_STATE.END

    clearTimeout(this.timer!)

    this.shell.getStdout().removeListener('data', this.handleStdoutData)
    this.shell.getStderr().removeListener('data', this.handleStderrData)

    const obj = {
      retCode: this.retCode,
      cmd: this.cmd,
    }

    const matching_exit_code = this.retCode === this.exit_expected
    if (!matching_exit_code) {
      if (this.exit_expected === true) {
        if (this.retCode === 0) {
          this.log('NO EXIT WHEN EXPECTED')
          return this.promiseReject(obj)
        }
      } else if (this.exit_expected === false) {
        if (this.retCode !== 0) {
          this.log('EXIT WHEN NOT EXPECTED')
          return this.promiseReject(obj)
        }
      } else {
        this.log(`EXIT CODE DIDN'T MATCH`)
        return this.promiseReject(obj)
      }
    }

    return this.promiseResolve(obj)
  }

  log = Shell.logger
}
