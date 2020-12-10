import {ExecaSyncReturnValue} from "execa";

export type ShellacInterpolations =
  | string
  | boolean
  | undefined
  | number
  | null
  | ((a: string) => void)
  | ((a: string) => Promise<void>)
  | (() => Promise<void>)
export type ShellacReturnVal = {
  stdout: string
  stderr: string
  [key: string]: string
}
export type ParseResult = string | (Array<ParseResult> & { tag: string })
export type Parser = (str: string) => undefined | ParseResult
export type ExecResult = ExecaSyncReturnValue | null
export type Captures = { [key: string]: string }
export type ShellacImpl = (
  s: TemplateStringsArray,
  ...interps: ShellacInterpolations[]
) => Promise<ShellacReturnVal>
