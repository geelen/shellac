export type ShellacInterpolations =
  | string
  | boolean
  | undefined
  | null
  | ((a: string) => void)
  | (() => Promise<void>)

export type ShellacReturnVal = {
  stdout: string
  stderr: string
  [key: string]: string
}

/* NOTE: IMPORTING LIB WHICH IS COMPILED WITH REGHEX */
// @ts-ignore
import _parser from '../lib/parser'

export type ParseResult = string | (Array<ParseResult> & { tag: string })
type Parser = (str: string) => undefined | ParseResult
export const parser = _parser as Parser

export const log_parse_result = (
  chunk: ParseResult,
  depth = 0,
  solo = false
): string => {
  if (!chunk) return ''

  if (Array.isArray(chunk) && chunk.tag) {
    const indent = `${' '.repeat(depth)}`
    const newline = `${depth === 0 ? '' : '\n'}`
    return `${newline}${indent}${chunk.tag + ':'}${chunk
      .map((each) => log_parse_result(each, depth + 2, chunk.length === 1))
      .join('')}`
  } else {
    const indent = solo ? '' : '\n' + ' '.repeat(depth)
    return `${indent} ${(chunk as string).trim()}`
  }
}

const shellac = async (
  s: TemplateStringsArray,
  ...i: ShellacInterpolations[]
): Promise<ShellacReturnVal> => {
  const str = s.join('')
  if (str.length === 0) throw new Error('Must provide statements')

  const parsed = parser(str)
  if (!parsed) throw new Error('Parsing error!')

  console.log(parsed)

  let first_command = null

  return {
    stdout: parsed[0] as string,
    stderr: '',
  }
}
shellac.in = (cwd: string) => shellac

export default shellac
