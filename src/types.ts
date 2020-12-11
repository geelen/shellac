import { ExecaSyncReturnValue } from 'execa'
import Shell from './child-subshell/shell'
import Command from './child-subshell/command'

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
  [key: string]: string
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

export type ExecutionContext = {
  interps: ShellacInterpolations[]
  last_cmd: ExecResult
  cwd: string
  captures: Captures
  shell: Shell
}
