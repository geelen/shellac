export type ShellacInterpolations =
  | string
  | boolean
  | undefined
  | null
  | ((a: string) => void)
  | (() => Promise<void>)

export type ShellacReturnVal = {
  stdout: string,
  stderr: string,
  [key: string]: string
}

/* NOTE: IMPORTING LIB WHICH IS COMPILED WITH REGHEX */
// @ts-ignore
import _parser from '../lib/parser'

type ParseResult = Array<string> & { tag: string }
type Parser = (str: string) =>  undefined | ParseResult
const parser = _parser as Parser

const shellac = async (
  s: TemplateStringsArray,
  ...i: ShellacInterpolations[]
): Promise<ShellacReturnVal> => {
  return {
    stdout: parser('Hello, world!')![0],
    stderr: ''
  }
}
shellac.in = (cwd: string) => shellac

export default shellac
