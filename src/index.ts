import execa, { ExecaSyncReturnValue } from 'execa'
/* NOTE: IMPORTING LIB WHICH IS COMPILED WITH REGHEX */
// @ts-ignore
import _parser from '../lib/parser'

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

export type ParseResult = string | (Array<ParseResult> & { tag: string })
type Parser = (str: string) => undefined | ParseResult
export const parser = (str: string) => (_parser as Parser)(str.trim())

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

type ExecResult = ExecaSyncReturnValue | null;

const execute = async (
  interps: ShellacInterpolations[],
  chunk: ParseResult,
  last_cmd: ExecResult
): Promise<ExecResult> => {
  // console.log({ chunk })
  if (Array.isArray(chunk)) {
    if (chunk.tag === 'command_line') {
      const [str] = chunk as string[]
      return execa.command(str, { shell: true })
    } else if (chunk.tag === 'if_statement') {
      const [[val_type, val_id], if_clause, else_clause] = chunk
      // console.log({val_type, val_id, if_clause, else_clause})
      if (val_type !== 'VALUE') throw new Error('If statements only accept value interpolations, not functions.')

      // @ts-ignore
      if (interps[val_id]) {
        // console.log("IF STATEMENT IS TRUE")
        return execute(interps, if_clause, last_cmd)
      } else if (else_clause) {
        // console.log("IF STATEMENT IS FALSE")
        return execute(interps, else_clause, last_cmd)
      }
    } else if (chunk.tag === 'grammar') {
      let new_last_cmd = last_cmd
      for (const sub of chunk) {
        new_last_cmd = await execute(interps, sub, new_last_cmd)
      }
      return new_last_cmd
    }
  }

  return last_cmd
}

const shellac = async (
  s: TemplateStringsArray,
  ...interps: ShellacInterpolations[]
): Promise<ShellacReturnVal> => {
  let str = s[0]

  for (let i = 0; i < interps.length; i++) {
    let is_fn = typeof interps[i] === 'function'
    str = `${str}${is_fn ? 'FUNCTION_' : 'VALUE_'}${i}${s[i + 1]}`
  }

  if (str.length === 0) throw new Error('Must provide statements')

  // console.log(str)

  const parsed = parser(str)
  if (!parsed || typeof parsed === 'string') throw new Error('Parsing error!')

  // console.log(parsed)

  const last_cmd = await execute(interps, parsed, null)

  return {
    stdout: last_cmd?.stdout || '',
    stderr: last_cmd?.stderr || '',
  }
}
shellac.in = (cwd: string) => shellac

export default shellac
