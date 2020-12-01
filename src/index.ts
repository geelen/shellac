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
