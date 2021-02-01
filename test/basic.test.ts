import shellac from '../src'
import * as tmp from 'tmp-promise'
import fs from 'fs-extra'
import path from 'path'
import Shell from '../src/child-subshell/shell'

describe('getting started', () => {
  it('should run a simple command', async () => {
    const { stdout } = await shellac`
      $ echo "Hello, world!" 
    `

    expect(stdout).toBe('Hello, world!')
  })

  it('should run two simple commands', async () => {
    const { stdout } = await shellac`
      $ echo "Hello, world!"
      $ echo "If there's one thing JavaScript has been lacking, it's DSLs."
    `

    expect(stdout).toBe(
      `If there's one thing JavaScript has been lacking, it's DSLs.`
    )
  })

  it('should not execute comments', async () => {
    const { stdout } = await shellac`
      $ echo "Hello, world!"
      // $ echo "If there's one thing JavaScript has been lacking, it's DSLs."
    `

    expect(stdout).toBe(`Hello, world!`)
  })

  it('should handle bash-y things', async () => {
    const { env_var, wc } = await shellac`
      $ echo "omfg" | wc -c
      stdout >> wc
      
      $ LOL=boats
      $ echo $LOL
      stdout >> env_var
    `

    expect(wc).toMatch(/^\s+5/)
    // expect(wc).toBe('5')
    expect(env_var).toBe(`boats`)
  })

  it('should handle interpolations in commands', async () => {
    const rando = Math.random()
    await shellac`
      $ echo ${rando}
      stdout >> ${(echo) => {
        expect(echo).toBe(rando.toString())
      }}
    `
  })

  it('should handle async interpolations in commands', async () => {
    const rando1 = Math.random()
    const rando2 = Math.random()
    const asyncRando = async () => rando2

    await shellac`
      $ echo "RANDO 1: ${Promise.resolve(rando1)}"
      stdout >> ${(as_promise) => {
        expect(as_promise).toBe(`RANDO 1: ${rando1}`)
      }}
      
      $ echo "RANDO 2: ${asyncRando}"
      stdout >> ${(as_async_function) => {
        expect(as_async_function).toBe(`RANDO 2: ${rando2}`)
      }}
    `
  })

  it('should handle an if-else statement', async () => {
    for (const value of [true, false]) {
      const { stdout } = await shellac`
      if ${value} {
        $ echo lol
      } else {
        $ echo boats
      }
    `

      expect(stdout).toBe(value ? 'lol' : 'boats')
    }
  })

  it('should handle an if statement with no else', async () => {
    for (const value of [true, false]) {
      const { stdout } = await shellac`
      $ echo lol
      if ${value} {
        $ echo boats
      }
    `

      expect(stdout).toBe(value ? 'boats' : 'lol')
    }
  })

  it('should handle a nested if statement', async () => {
    for (const value of ['A', 'B', 'C']) {
      const { stdout } = await shellac`
        $ echo easy as
        if ${value === 'A'} {
          $ echo one
        } else {
          $ echo two
          if ${value === 'C'} {
            $ echo three
          }
        }
      `

      expect(stdout).toBe(
        value === 'A' ? 'one' : value === 'B' ? 'two' : 'three'
      )
    }
  })

  it('should handle an IN statement', async () => {
    const { stdout: orig_dir } = await shellac`
      $ pwd
    `
    expect(orig_dir).toBe(process.cwd())

    const { stdout: file_dir } = await shellac`
      in ${__dirname} {
        $ pwd
      }
    `
    expect(file_dir).toBe(__dirname)

    const { stdout: helper_dir } = await shellac.in(__dirname)`
      $ pwd
    `
    expect(helper_dir).toBe(__dirname)
  })

  it('should await async blocks', async () => {
    const dir = await tmp.dir({ unsafeCleanup: true })
    const { stdout: pwd1 } = await shellac.in(dir.path)`
      $ echo "lol boats" > a.file
      $ ls
    `
    expect(pwd1).toBe('a.file')

    const { stdout: pwd2 } = await shellac.in(dir.path)`
      await ${async () => {
        await fs.writeFile(
          path.join(dir.path, 'generated.by.js'),
          'some content here'
        )
      }}
      $ ls
    `
    expect(pwd2).toBe('a.file\ngenerated.by.js')
  })

  it('should emit stdout blocks', async () => {
    let invocations = 0

    const { stdout } = await shellac`
      $ echo "Line one"
      stdout >> ${(line_one) => {
        invocations++
        expect(line_one).toBe('Line one')
      }}
      
      $ echo "Line two"
      stdout >> ${(line_two) => {
        invocations++
        expect(line_two).toBe('Line two')
      }}
    `

    expect(stdout).toBe('Line two')
    expect(invocations).toBe(2)
  })

  it('should emit stderr blocks', async () => {
    let invocations = 0

    const { stdout, stderr } = await shellac`
      $ echo "This going to stderr" >&2
      stderr >> ${(inline_stderr) => {
        invocations++
        expect(inline_stderr).toBe('This going to stderr')
      }}
    `

    expect(stdout).toBe('')
    expect(stderr).toBe('This going to stderr')
    expect(invocations).toBe(1)
  })

  it('should create files and directories', async () => {
    const dir = await tmp.dir({ unsafeCleanup: true })
    await shellac.in(dir.path)`
      $ touch some.file
      $ mkdir -p some/dir
      $ echo "[FAB CI] NextJS — Branch ${Math.random()}" >> some/dir/echoed.file
      $$ npx tree-node-cli
      
      stdout >> ${async (tree) =>
        expect(tree).toBe(
          [
            path.basename(dir.path),
            '├── some',
            '│   └── dir',
            '│       └── echoed.file',
            '└── some.file',
          ].join('\n')
        )}
    `
  })

  it('should permit multiple return values', async () => {
    const dir = await tmp.dir({ unsafeCleanup: true })
    const { default_branch, current_branch, current_sha } = await shellac.in(
      dir.path
    )`
      $ git init
      $ echo "SOME CONTENTS" >> some.file
      $ git add .
      $ git config user.email "test@test.com"
      $ git config user.name "Test"
      $ git commit -m 'auto commit'
      
      $ git rev-parse --abbrev-ref HEAD
      stdout >> default_branch
      
      $ git checkout -b new-branch
      
      $ git rev-parse --abbrev-ref HEAD
      stdout >> current_branch
      
      $ git rev-parse --short HEAD
      stdout >> current_sha
    `

    expect(default_branch).toEqual('master')
    expect(current_branch).toEqual('new-branch')
    expect(current_sha).toMatch(/^[a-f0-9]{7}$/)
  })

  it('should only change dirs with in', async () => {
    const cwd = __dirname
    const parent_dir = path.resolve(cwd, '..')
    await shellac.in(cwd)`
      // Normal behaviour
      $ pwd
      stdout >> ${(pwd) => expect(pwd).toBe(cwd)}
      
      // Has no effect on the remaining commands
      $ cd ..
      
      $ pwd
      stdout >> ${(pwd) => expect(pwd).toBe(cwd)}
      
      // If you want to change dir use in {}
      in ${parent_dir} {
        $ pwd
        stdout >> ${(pwd) => expect(pwd).toBe(parent_dir)}
      }
      
      // Or do it on a single line
      $ cd .. && pwd
      stdout >> ${(pwd) => expect(pwd).toBe(parent_dir)}
      
      // ; also works
      $ cd ..; pwd
      stdout >> ${(pwd) => expect(pwd).toBe(parent_dir)}
    `
  })

  it('should accept exits blocks', async () => {
    await shellac`
      exits {
        $ node -e 'process.stderr.write("this gon fail"); process.exit(2)'
      }
      exitcode >> ${(exitcode) => expect(exitcode).toBe(2)}
      stderr >> ${(stderr) => expect(stderr).toBe('this gon fail')}
    `
  })

  describe('failure tests', () => {
    let logs: string[]
    let _logger: typeof Shell.logger

    beforeEach(() => {
      logs = []
      _logger = Shell.logger
      Shell.logger = (...args) => logs.push(...args)
    })

    afterEach(() => {
      expect(logs.join('\n')).toContain('SHELLAC COMMAND FAILED')
      Shell.logger = _logger
    })

    it('should assert exit codes', async () => {
      await expect(shellac`
        exits(2) {
          $ echo "this gon fail" >&2; false
        }
      `).rejects.toEqual(expect.objectContaining({ retCode: 1 }))
    })

    it('should demand exits blocks for failing commands', async () => {
      // originally, if the command was the last in the block it wouldn't fail
      await expect(shellac`
        $ false
      `).rejects.toEqual(expect.objectContaining({ retCode: 1 }))
    })
  })
})
