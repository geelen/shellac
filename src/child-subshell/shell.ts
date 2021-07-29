import child_process, { ChildProcessWithoutNullStreams } from 'child_process'
import { Logger } from './types'

export default class Shell {
  process: ChildProcessWithoutNullStreams
  static logger: Logger = (...args: any[]) =>
    process.stdout.write(args.map((a) => a.toString()).join('\n'))

  constructor(env_passthrough: string[] = ['PATH']) {
    const env: typeof process.env = { PS1: '' }

    env_passthrough.forEach((key) => {
      env[key] = process.env[key]
    })

    this.process = child_process.spawn('bash', ['--noprofile', '--norc'], {
      env,
      detached: true
    })

    this.process.stdout.setEncoding('utf8')
    // this.process.stdin.resume()
  }

  getStdin() {
    return this.process.stdin
  }

  getStdout() {
    return this.process.stdout
  }

  getStderr() {
    return this.process.stderr
  }

  exit() {
    this.process.kill('SIGINT')
  }
}
