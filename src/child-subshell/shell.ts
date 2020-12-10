import child_process, {ChildProcessWithoutNullStreams} from 'child_process'
import {Logger} from "./types";

export default class Shell {
  private process: ChildProcessWithoutNullStreams
  private logger: Logger;

  constructor() {
    this.process = child_process.spawn('unbuffer', ['-p', '/bin/bash'], {})

    this.process.stdout.setEncoding('utf8')
    // @ts-ignore
    this.process.stdin.resume()

    this.process.on('close', (code) => {
      console.log(`child process exited with code ${code}`)
    })

    this.logger = (line) => {}
  }

  setLogger(logger: Logger) {
    this.logger = logger
  }

  getLogger() {
    return this.logger
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
