import {
  Captures,
  ExecResult,
  ParsedToken,
  ParseResult,
  ShellacInterpolations,
} from './types'
import execa from 'execa'

function IfStatement(
  chunk: ParsedToken,
  interps: ShellacInterpolations[],
  last_cmd: ExecResult,
  cwd: string,
  captures: Captures
) {
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
  } else {
    return last_cmd
  }
}

function Command(
  chunk: ParsedToken,
  interps: ShellacInterpolations[],
  cwd: string
) {
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
}

function InStatement(
  chunk: Array<ParseResult> & { tag: string },
  interps: ShellacInterpolations[],
  last_cmd: execa.ExecaSyncReturnValue<string> | null,
  captures: Captures
) {
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
}

async function Grammar(
  last_cmd: execa.ExecaSyncReturnValue<string> | null,
  chunk: Array<ParseResult> & { tag: string },
  interps: ShellacInterpolations[],
  cwd: string,
  captures: Captures
) {
  let new_last_cmd = last_cmd
  for (const sub of chunk) {
    new_last_cmd = await execute(interps, sub, new_last_cmd, cwd, captures)
  }
  return new_last_cmd
}

async function Await(
  chunk: Array<ParseResult> & { tag: string },
  interps: ShellacInterpolations[],
  last_cmd: execa.ExecaSyncReturnValue<string> | null
) {
  const [[val_type, val_id]] = chunk
  if (val_type !== 'FUNCTION')
    throw new Error(
      'IN statements only accept function interpolations, not values.'
    )

  // @ts-ignore
  await interps[val_id]()
  return last_cmd
}

async function Stdout(
  chunk: Array<ParseResult> & { tag: string },
  last_cmd: execa.ExecaSyncReturnValue<string> | null,
  interps: ShellacInterpolations[],
  captures: Captures
) {
  const [out_or_err, second] = chunk
  if (!(out_or_err === 'stdout' || out_or_err === 'stderr'))
    throw new Error(`Expected only 'stdout' or 'stderr', got: ${out_or_err}`)
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
  return last_cmd
}

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
      return Command(chunk, interps, cwd)
    } else if (chunk.tag === 'if_statement') {
      return IfStatement(chunk, interps, last_cmd, cwd, captures)
    } else if (chunk.tag === 'in_statement') {
      return InStatement(chunk, interps, last_cmd, captures)
    } else if (chunk.tag === 'grammar') {
      return await Grammar(last_cmd, chunk, interps, cwd, captures)
    } else if (chunk.tag === 'await_statement') {
      return await Await(chunk, interps, last_cmd)
    } else if (chunk.tag === 'stdout_statement') {
      return await Stdout(chunk, last_cmd, interps, captures)
    } else {
      return last_cmd
    }
  }

  return null
}
