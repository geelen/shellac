import shellac from '../src'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import pick from 'just-pick'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('providing environment values', () => {
  it('should have a few env vars by default', async () => {
    const { stdout } = await shellac`
      $ env
    `

    const envs = Object.fromEntries(
      stdout.split('\n').map((line) => line.split('='))
    )

    expect(Object.keys(envs)).toEqual(
      expect.arrayContaining(['PATH', 'PWD', '_'])
    )
    expect(envs.PS1).toBe(undefined)
    if (os.platform() !== 'win32') {
      expect(envs.PATH).toBe(process.env.PATH)
      expect(envs.PWD).toBe(process.cwd())
    } else {
      // Windows bash normalizes the paths weirdly so don't check them too closely
      expect(typeof envs.PATH).toBe('string')
      expect(typeof envs.PWD).toBe('string')
    }
  })

  it('should make it easy to pass through more vars', async () => {
    const testEnv = {
      EDITOR: "nano",
      EXTRA: "value",
      EXTRA2: "value2",
    }
    const { stdout } = await shellac.env(
      pick(testEnv, ['EDITOR', 'EXTRA'])
    )`
      $ env
    `

    const envs = Object.fromEntries(
      stdout.split('\n').map((line) => line.split('='))
    )

    expect(Object.keys(envs)).toEqual(
      expect.arrayContaining(['EDITOR','EXTRA'])
    )
    expect(envs.EDITOR).toBe(testEnv.EDITOR)
    expect(envs.EXTRA).toBe(testEnv.EXTRA)
  })

  it('should allow adding new envs', async () => {
    const { stdout } = await shellac.env({
      FOO: 'bar',
    })`
      $ env
    `

    const envs = Object.fromEntries(
      stdout.split('\n').map((line) => line.split('='))
    )
    expect(Object.keys(envs)).toEqual(
      expect.arrayContaining(['PATH', 'PWD', '_', 'FOO'])
    )
    expect(envs.FOO).toBe('bar')
  })

  it('should allow overriding default envs', async () => {
    if (os.platform() === 'win32') {
      // Overriding PATH with these hardcoded values doesn't work on Windows so don't try
      return
    }
    const { stdout } = await shellac.env({
      PATH: '/usr/local/bin:/usr/bin:/bin',
    })`
      $ env
    `

    const envs = Object.fromEntries(
      stdout.split('\n').map((line) => line.split('='))
    )
    expect(envs.PATH).toBe('/usr/local/bin:/usr/bin:/bin')
  })

  it('should combine .env calls', async () => {
    const { stdout } = await shellac
      .env({
        AAA: 'one',
        BBB: 'two',
      })
      .env({
        CCC: 'three',
        AAA: 'four',
      })`
      $ env
    `

    const envs = Object.fromEntries(
      stdout.split('\n').map((line) => line.split('='))
    )
    expect(Object.keys(envs)).toEqual(
      expect.arrayContaining(['AAA', 'BBB', 'CCC'])
    )
    expect(envs.AAA).toBe('four')
    expect(envs.BBB).toBe('two')
    expect(envs.CCC).toBe('three')
  })

  it('should allow calling in then env', async () => {
    const cwd = __dirname
    const parent_dir = path.resolve(cwd, '..')
    const { stdout } = await shellac.in(parent_dir).env({
      AAA: 'one',
      BBB: 'two',
    })`
      $ env
    `

    const envs = Object.fromEntries(
      stdout.split('\n').map((line) => line.split('='))
    )
    expect(Object.keys(envs)).toEqual(
      expect.arrayContaining(['AAA', 'BBB', 'PWD'])
    )
    expect(envs.AAA).toBe('one')
    expect(envs.BBB).toBe('two')
    if (os.platform() === 'win32') {
      // Windows bash normalizes the paths weirdly so don't check it too closely
      expect(typeof envs.PWD).toBe('string')
    } else {
      expect(envs.PWD).toBe(parent_dir)
    }
  })

  it('should allow calling env then in', async () => {
    const cwd = __dirname
    const parent_dir = path.resolve(cwd, '..')
    const { stdout } = await shellac
      .env({
        AAA: 'one',
        BBB: 'two',
      })
      .in(parent_dir)`
      $ env
    `

    const envs = Object.fromEntries(
      stdout.split('\n').map((line) => line.split('='))
    )
    expect(Object.keys(envs)).toEqual(
      expect.arrayContaining(['AAA', 'BBB', 'PWD'])
    )
    expect(envs.AAA).toBe('one')
    expect(envs.BBB).toBe('two')
    if (os.platform() === 'win32') {
      // Windows bash normalizes the paths weirdly so don't check it too closely
      expect(typeof envs.PWD).toBe('string')
    } else {
      expect(envs.PWD).toBe(parent_dir)
    }
  })

  it('should allow background tasks with env', async () => {
    const { pid, promise } = await shellac.env({
      AAA: 'one',
      BBB: 'two',
    }).bg`
      $$ for i in 1 2 3; do echo $i; sleep 0.5; done
      $$ echo "$AAA - $BBB"
    `
    const { stdout } = await promise
    expect(stdout).toBe('one - two')
  })
})
