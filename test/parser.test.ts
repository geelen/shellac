import { parser, log_parse_result } from '../src'
import {ParseResult} from "../src/types";


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

  it('should parse an if statement', () => {
    expect(
      parser(`
        if #__VALUE_0__# {
          $ echo lol
        }
      `)
    ).toParseTo(`
      grammar:
        if_statement:
          identifier:
            VALUE
            0
            grammar:
              command_line: echo lol
    `)
  })

  it('should parse an if-else statement', () => {
    expect(
      parser(`
        if #__VALUE_0__# {
          $ echo lol
        } else {
          $ echo boats
        }
      `)
    ).toParseTo(`
      grammar:
        if_statement:
          identifier:
            VALUE
            0
          grammar:
            command_line: echo lol
          grammar:
            command_line: echo boats
    `)
  })

  it('should parse an in statement', () => {
    expect(
      parser(`
        $ pwd
        in #__VALUE_1__# {
          $ pwd
        }
      `)
    ).toParseTo(`
      grammar:
        command_line: pwd
        in_statement:
          identifier:
            VALUE
            1
          grammar:
            command_line: pwd
    `)
  })

  it('should parse an in string statement', () => {
    expect(
      parser(`
        $ pwd
        in "./relative path" {
          $ pwd
        }
        in ./no-spaces {
          $ pwd
        }
      `)
    ).toParseTo(`
      grammar:
        command_line: pwd
        in_statement:
          string_arg: "./relative path"
          grammar:
            command_line: pwd
        in_statement:
          string_arg: ./no-spaces
          grammar:
            command_line: pwd
    `)
  })

  it('should parse an await statement', () => {
    expect(
      parser(`
        await #__FUNCTION_2__#
        $ ls
      `)
    ).toParseTo(`
      grammar:
        await_statement:
          identifier:
            FUNCTION
            2
        command_line: ls
    `)
  })

  it('should parse comments', () => {
    expect(
      parser(`
        // comment here
        $ ls -l
        // second comment
        $ echo lol
        // third comment
      `)
    ).toParseTo(`
      grammar:
        comment_line: comment here
        command_line: ls -l
        comment_line: second comment
        command_line: echo lol
        comment_line: third comment
    `)
  })

  it('should parse passthrough logged lines', () => {
    expect(
      parser(`
        $$ ls -l
        $ echo lol
      `)
    ).toParseTo(`
      grammar:
        logged_command: ls -l
        command_line: echo lol
    `)
  })

  it('should parse bare exits', () => {
    expect(
      parser(`
        exits {
          $ false
        }
      `)
    ).toParseTo(`
      grammar:
        exits_statement:
          grammar:
            command_line: false
    `)
  })

  it('should parse exits with errcode args', () => {
    expect(
      parser(`
        exits(1) {
          $ false
        }
      `)
    ).toParseTo(`
      grammar:
        exits_statement:
          integer_argument: 1
          grammar:
            command_line: false
    `)
  })

  it('should allow observing the exit code of a block', () => {
    expect(
      parser(`
        exits {
          $ exit 2
        }
        stdout >> #__FUNCTION_2__#
        exitcode >> #__FUNCTION_3__#
      `)
    ).toParseTo(`
      grammar:
        exits_statement:
          grammar:
            command_line: exit 2
        stdout_statement:
          stdout
            identifier:
              FUNCTION
              2
        exitcode_statement:
          exitcode
            identifier:
              FUNCTION
              3
    `)
  })

  it('should allow forking a background task', () => {
    expect(
      parser(`
        $$ echo background boi
        $$ for i in 1 2 3; do echo $i; sleep 1; done &
      `)
    ).toParseTo(`
      grammar:
        logged_command: echo background boi
        logged_command: for i in 1 2 3; do echo $i; sleep 1; done &
    `)
  })
})
