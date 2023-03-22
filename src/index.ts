import { Captures, EnvVars, ShellacBGImpl, ShellacImpl } from './types'
import { execute } from './execute'
import Shell from './child-subshell/shell'
import { trimFinalNewline } from './child-subshell/utils'
import { parser } from './parser'

const lazyCreateShell = async (env: EnvVars) => new Shell(env)

const _shellac =
  (
    cwd: string,
    lazyShell: (env: EnvVars) => Promise<Shell>,
    env: EnvVars
  ): ShellacImpl =>
  async (s, ...interps) => {
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

    const shell = await lazyShell(env)

    const last_cmd = await execute(parsed, {
      interps,
      last_cmd: null,
      cwd,
      captures,
      shell,
      exit_expected: false,
      env,
    })
    shell.exit()

    return {
      stdout: trimFinalNewline(last_cmd?.stdout || ''),
      stderr: trimFinalNewline(last_cmd?.stderr || ''),
      ...captures,
    }
  }

const bgShellac =
  (
    cwd: string,
    lazyShell: (env: EnvVars) => Promise<Shell>,
    env: EnvVars
  ): ShellacBGImpl =>
  async (s, ...interps) => {
    const shell = await lazyShell(env)
    return {
      process: shell.process,
      pid: shell.process.pid!,
      promise: _shellac(process.cwd(), async () => shell, env)(s, ...interps),
      kill: () => shell.exit(),
    }
  }

type ShellacType = ShellacImpl & {
  in: (dir: string) => ShellacType
  bg: ShellacBGImpl
  env: (env: EnvVars) => ShellacType
}

function makeShellac(
  cwd = process.cwd(),
  env = {},
  shell = lazyCreateShell
): ShellacType {
  return Object.defineProperties(_shellac(cwd, lazyCreateShell, env), {
    in: { value: (dir: string) => makeShellac(dir, env, shell) },
    bg: {
      get() {
        return bgShellac(cwd, shell, env)
      },
    },
    env: {
      value: (newEnv: EnvVars) =>
        makeShellac(cwd, { ...env, ...newEnv }, shell),
    },
  }) as ShellacType
}

const shellac = makeShellac()

export default shellac
