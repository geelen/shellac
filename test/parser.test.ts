import { parser, ParseResult, log_parse_result } from '../src'


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

    const format = (str: string) =>
      str
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .join('\n')

    // console.log(received)
    // console.log(log(received))

    expect(format(log_parse_result(received))).toEqual(format(expected))

    return { message: () => 'Parsing matched!', pass: true }
  },
})

describe('parser', () => {
  it('should match a single command', () => {
    expect(parser(`$ echo lol`)).toParseTo(`
      grammar:
        command_line: echo lol
    `)
  })

  it('should match a single command with newlines', () => {
    expect(
      parser(`
      $ echo lol
    `)
    ).toParseTo(`
      grammar:
        command_line: echo lol
    `)
    expect(
      parser(`
    
      $ echo lol
      
    `)
    ).toParseTo(`
      grammar:
        command_line: echo lol
    `)
  })

  it('should match a few echo commands', () => {
    expect(
      parser(`
        $ echo lol
        $ echo boats
      `)
    ).toParseTo(`
      grammar:
        command_line: echo lol
        command_line: echo boats
    `)
    expect(
      parser(`
    
        $ echo lol
        
        $ echo boats
        
      `)
    ).toParseTo(`
      grammar:
        command_line: echo lol
        command_line: echo boats
    `)
  })

  it('should not parse random strings', () => {
    expect(parser(`WAT IS DIS`)).toBeUndefined()
  })
})
