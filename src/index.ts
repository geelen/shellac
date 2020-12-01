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
import parser from '../lib'

console.log({parser})

const shellac = async (
  s: TemplateStringsArray,
  ...i: ShellacInterpolations[]
): Promise<ShellacReturnVal> => {
  return {
    stdout: '',
    stderr: ''
  }
}
shellac.in = (cwd: string) => shellac

export default shellac
