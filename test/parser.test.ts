import { parser, ParseResult } from '../src'

const log = (chunk: ParseResult, depth = 0, solo = false) => {
  if (!chunk) return

  if (Array.isArray(chunk) && chunk.tag) {
    const indent = `${' '.repeat(depth)}`
    const newline = `${depth === 0 ? '' : '\n'}`
    return `${newline}${indent}${chunk.tag + ':'}${chunk
      .map((each) => log(each, depth + 2, chunk.length === 1))
      .join('')}`
  } else {
    const indent = solo ? '' : '\n' + ' '.repeat(depth)
    return `${indent} ${(chunk as string).trim()}`
  }
}

declare global {
  namespace jest {
    interface Matchers<R> {
      toParseTo(value: string): CustomMatcherResult
    }
  }
}

expect.extend({
  toParseTo(received: ParseResult, expected: string) {
    if (!received) {
      return {
        message: () => `Expected a valid parse result, got: ${received}`,
        pass: false,
      }
    }

    const format = (str) =>
      str
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .join('\n')

    console.log(received)
    console.log(log(received))

    expect(format(log(received))).toEqual(format(expected))

    return { message: () => 'Parsing matched!', pass: true }
  },
})

describe('parser', () => {
  it('should match a single command', () => {
    expect(parser(`$ echo lol`)).toParseTo(`
      grammar:
        echo_line: $ echo lol
    `)
  })

  it('should match a single command with newlines', () => {
    expect(
      parser(`
      $ echo lol
    `)
    ).toParseTo(`
      grammar:
        ignored: 
        echo_line: $ echo lol
        ignored:
    `)
    expect(
      parser(`
    
      $ echo lol
      
    `)
    ).toParseTo(`
      grammar:
        ignored: 
        echo_line: $ echo lol
        ignored:
    `)
  })
})
