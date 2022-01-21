import { Captures, ShellacBGImpl, ShellacImpl } from './types'
import { execute } from './execute'
import Shell from './child-subshell/shell'
import { trimFinalNewline } from './child-subshell/utils'
import { parser } from './parser'

const lazyCreateShell = async () => new Shell()

const _shellac = (
  cwd: string,
  lazyShell: () => Promise<Shell>
): ShellacImpl => async (s, ...interps) => {
  let str = s[0]

  for (let i = 0; i < interps.length; i++) {
    const is_fn = typeof interps[i] === 'function'
    const interp_placeholder = `#__${is_fn ? 'FUNCTION_' : 'VALUE_'}${i}__#`
    str += interp_placeholder + s[i + 1]
  }

  if (str.length === 0) throw new Error('Must provide statements')

  // console.log(str)

  const parsed = parser(str)
  if (!parsed || typeof parsed === 'string') throw new Error('Parsing error!')

  const captures: Captures = {}

  const shell = await lazyShell()

  const last_cmd = await execute(parsed, {
    interps,
    last_cmd: null,
    cwd,
    captures,
    shell,
    exit_expected: false,
  })
  shell.exit()

  return {
    stdout: trimFinalNewline(last_cmd?.stdout || ''),
    stderr: trimFinalNewline(last_cmd?.stderr || ''),
    ...captures,
  }
}

const bgShellac: ShellacBGImpl = async (s, ...interps) => {
  const shell = await lazyCreateShell()
  return {
    process: shell.process,
    pid: shell.process.pid!,
    promise: _shellac(process.cwd(), async () => shell)(s, ...interps),
    kill: () => shell.exit(),
  }
}

const shellac = Object.assign(_shellac(process.cwd(), lazyCreateShell), {
  in: (cwd: string) => _shellac(cwd, lazyCreateShell),
  bg: bgShellac,
})

export default shellac
