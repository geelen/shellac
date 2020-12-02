import shellac from '../src'

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
    for (const value of ['A','B','C']) {
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

      expect(stdout).toBe(value === 'A' ? 'one' : value === 'B' ? 'two' : 'three')
    }
  })

  it('should handle an IN statement', async () => {
    const { stdout: orig_dir } = await shellac`
      $ pwd
    `
    expect(orig_dir).toBe(process.cwd())

    const { stdout: file_dir } = await shellac`
      in ${ __dirname } {
        $ pwd
      }
    `
    expect(file_dir).toBe(__dirname)


  })
})
