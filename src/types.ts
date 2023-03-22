import Shell from './child-subshell/shell'
import Command from './child-subshell/command'
import { ExitExpected } from './child-subshell/types'
import { ChildProcessWithoutNullStreams } from 'child_process'

export type ShellacValueInterpolation =
  | string
  | boolean
  | undefined
  | number
  | null

export type ShellacInterpolations =
  | ShellacValueInterpolation
  | Promise<ShellacValueInterpolation>
  | ((a: string) => void)
  | ((a: string) => Promise<void>)
  | (() => Promise<void | ShellacValueInterpolation>)

export type ShellacReturnVal = {
  stdout: string
  stderr: string
  [key: string]: string | any
}
export type ShellacBGReturnVal = {
  process: ChildProcessWithoutNullStreams
  pid: number
  kill: () => void
  promise: Promise<ShellacReturnVal>
}
export type ParsedToken = Array<ParseResult> & { tag: string }
export type ParseResult = string | ParsedToken
export type Parser = (str: string) => undefined | ParseResult
export type ExecResult = Command | null
export type Captures = { [key: string]: string }
export type ShellacImpl = (
  s: TemplateStringsArray,
  ...interps: ShellacInterpolations[]
) => Promise<ShellacReturnVal>
export type ShellacBGImpl = (
  s: TemplateStringsArray,
  ...interps: ShellacInterpolations[]
) => Promise<ShellacBGReturnVal>

export type ExecutionContext = {
  interps: ShellacInterpolations[]
  last_cmd: ExecResult
  cwd: string
  captures: Captures
  shell: Shell
  exit_expected: ExitExpected
  env: Record<string, string>
}
export type EnvVars = Record<string, any>
