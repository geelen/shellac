import {
  Captures,
  ExecResult,
  ParseResult,
  ShellacInterpolations,
} from './types'
import execa from 'execa'

export const execute = async (
  interps: ShellacInterpolations[],
  chunk: ParseResult,
  last_cmd: ExecResult,
  cwd: string,
  captures: Captures
): Promise<ExecResult> => {
  // console.log({ chunk })
  if (Array.isArray(chunk)) {
    if (chunk.tag === 'command_line' || chunk.tag === 'logged_command') {
      const [str] = chunk as string[]
      // @ts-ignore
      const command = str.replace(/#__VALUE_(\d+)__#/g, (_, i) => interps[i])
      if (chunk.tag === 'logged_command') {
        const promise = execa.command(command, { shell: true, cwd })
        promise.stdout!.pipe(process.stdout)
        promise.stderr!.pipe(process.stderr)
        return promise
      } else {
        return execa.command(command, { shell: true, cwd })
      }
    } else if (chunk.tag === 'if_statement') {
      const [[val_type, val_id], if_clause, else_clause] = chunk
      // console.log({val_type, val_id, if_clause, else_clause})
      if (val_type !== 'VALUE')
        throw new Error(
          'If statements only accept value interpolations, not functions.'
        )

      // @ts-ignore
      if (interps[val_id]) {
        // console.log("IF STATEMENT IS TRUE")
        return execute(interps, if_clause, last_cmd, cwd, captures)
      } else if (else_clause) {
        // console.log("IF STATEMENT IS FALSE")
        return execute(interps, else_clause, last_cmd, cwd, captures)
      }
    } else if (chunk.tag === 'in_statement') {
      const [[val_type, val_id], in_clause] = chunk
      if (val_type !== 'VALUE')
        throw new Error(
          'IN statements only accept value interpolations, not functions.'
        )

      // @ts-ignore
      const new_cwd = interps[val_id]
      if (!new_cwd || typeof new_cwd !== 'string')
        throw new Error(
          `IN statements need a string value to set as the current working dir`
        )

      return execute(interps, in_clause, last_cmd, new_cwd, captures)
    } else if (chunk.tag === 'grammar') {
      let new_last_cmd = last_cmd
      for (const sub of chunk) {
        new_last_cmd = await execute(interps, sub, new_last_cmd, cwd, captures)
      }
      return new_last_cmd
    } else if (chunk.tag === 'await_statement') {
      const [[val_type, val_id]] = chunk
      if (val_type !== 'FUNCTION')
        throw new Error(
          'IN statements only accept function interpolations, not values.'
        )

      // @ts-ignore
      await interps[val_id]()
    } else if (chunk.tag === 'stdout_statement') {
      const [out_or_err, second] = chunk
      if (!(out_or_err === 'stdout' || out_or_err === 'stderr'))
        throw new Error(
          `Expected only 'stdout' or 'stderr', got: ${out_or_err}`
        )
      const capture = last_cmd?.[out_or_err] || ''
      // @ts-ignore
      const tag: string = second.tag
      if (tag === 'identifier') {
        const [val_type, val_id] = second
        if (val_type !== 'FUNCTION')
          throw new Error(
            'STDOUT/STDERR statements only accept function interpolations, not values.'
          )

        // @ts-ignore
        await interps[val_id](capture)
      } else if (tag === 'variable_name') {
        captures[second[0] as string] = capture
      } else {
        throw new Error(
          'STDOUT/STDERR statements expect a variable name or an interpolation function.'
        )
      }
    }
  }

  return last_cmd
}
