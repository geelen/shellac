<img src="https://user-images.githubusercontent.com/23264/101935969-cdb30100-3bd7-11eb-95ec-022ba9c30f07.png" width="120">

# Shellac

A tool to make invoking a series of shell commands safer & better-looking.

## Usage

```js
import shellac from 'shellac'

test('morty', async () => await shellac`
  $ echo "End-to-end CLI testing made nice"
  $ node -p "5 * 9"
  stdout >> ${ answer => expect(Number(answer)).toBeGreaterThan(40) }
`)
```

## Syntax

### Basic commands

```js
await shellac`
  // To execute a command, use $
  $ my command here  
  
  // If you want the output piped through to process.stdout/err, use $$
  $$ echo "This command will print to terminal"
  
  // Use stdout/err and >> to check the output of the last command
  stdout >> ${ last_cmd_stdout => {
    expect(last_cmd_stdout).toBe("This command will print to terminal")
  }}
`
```

### Returning output

Shellac returns the stdout/err of the last command in a block as `{ stdout, stderr }`

```js
const { stdout, stderr } = await shellac`
  $ echo "This command will run but its output will be lost"
  $ echo "The last command executed returns its stdout/err"
`
expect(stdout).toBe("The last command executed returns its stdout/err")
```

You can also return named captures from a series of commands:

```js
const { current_sha, current_branch } = await shellac`
  $ git rev-parse --short HEAD
  stdout >> current_sha

  $ git rev-parse --abbrev-ref HEAD
  stdout >> current_branch
`
```

### Branching

You can use `if ${ ... } { ... } else { ... }` to run conditionally based on the value of an interpolation:

```js
await shellac`
  if ${ process.env.CLEAN_RUN } {
    $ yarn create react-app
  } else {
    $ git reset --hard
  }
  
  // etc
`
```

### Changing directory

You can either use an `in` directive:

```js
await shellac`
  // By default we run in process.cwd()
  $ pwd
  stdout >> ${ cwd => expect(cwd).toBe(process.cwd()) }

  // Change directory for the duration of the block:
  in ${ __dirname } {
    $ pwd
    stdout >> ${ cwd => expect(cwd).toBe(__dirname) }
  }
  
  // Back to process.cwd() here
`
```

If the whole script needs to run in one place, use `shellac.in(dir)`:

```js
import tmp from 'tmp-promise'
const dir = await tmp.dir()
await shellac.in(dir.path)`
  $ pwd
  stdout >> ${ cwd => expect(cwd).toBe(dir.path) }
`
```

### Async

Use the `await` declaration to invoke & wait for some JS inline with your script. It works great when Bash doesn't quite do what you need.

```js
import fs from 'fs-extra'
await shellac.in(cwd)`
  await ${ async () => {
    await fs.writeFile(
      path.join(cwd, 'bigfile.dat'),
      huge_data
    )
  }}
  
  $ ls -l
  stdout >> ${(files) => expect(files).toMatch('bigfile.dat')}
`
```

### Interpolated commands

Inside a `$` command you can use string interpolation like normal:

```js
await shellac.in(cwd)`
  $ echo "${JSON.stringify({ current_sha, current_branch })}" > git_info.json
`
```

These can even be promises or async functions:

```js
const getAllPackageNames = async () => { /* ... */ }
await shellac.in(cwd)`
  // You can pass a promise and it will be awaited
  $ yarn link ${ getAllPackageNames() }
  
  // ...
  
  // Or pass an async function and shellac will call and await it
  $ yarn unlink ${ async () => getAllPackageNames() }
`
```

### Comments

All these examples are valid, since `// single-line-comments` are ignored as expected.


## Example

Works great with [ts-jest](https://github.com/kulshekhar/ts-jest#getting-started):

```js
// ts-jest-example.test.js
import shellac from 'shellac'

describe('my CLI tool', () => {
  it('should do everything I need', async () => {
    await shellac`
      $ echo "Hello, world!"
      stdout >> ${(echo) => {
        expect(echo).toBe('Hello, world!')
      }}
      
      $ rm -rf working-dir
      $ mkdir -p working-dir/example
      $ cp -R fixtures/run-1/* working-dir/example
      
      await ${async () => {
        // generate some more test data
      }}
      
      in ${'working-dir/example'} {
        $ ls -l
        stdout >> ${(files) => {
          expect(files).toMatch('package.json')
        }}
        
        $ yarn
        $$ run-app
      }
    `
  })
})
```

Using CommonJS, import it like:

```js
const test = require('ava')
const shellac = require('shellac').default

test('plugin should be installable', async (t) => {
  await shellac.default`
    $ echo "Hello, world!"
    stdout >> ${(echo) => {
      t.is(echo, 'Hello, world!')
    }}
  `
})
```

### Snippets

Use double-$ `$$` for logging while the test runs:

```js
shellac.in(cwd)`
  $$ ls -al
`
```

is the same as:

```js
shellac.in(cwd)`
  $ ls -al
  stdout >> ${console.log}
`
```

Confirm a file is present:

```js
shellac`
  $ ls -l
  stdout >> ${files => expect(files).toMatch('fab.zip')}
`
```

## Acknowledgements

[`@kitten`](https://github.com/kitten) for [reghex](https://github.com/kitten/reghex) which is genuinely incredible and the only reason this library is possible at all.

[`@superhighfives`](https://github.com/superhighfives) for coming up with the name!

[`exactly`](https://github.com/emilkarlen/exactly), [`bats`](https://github.com/sstephenson/bats), [`Expect`](https://en.wikipedia.org/wiki/Expect), [`cram`](https://bitheap.org/cram/), [`aruba`](https://github.com/cucumber/aruba) for prior art.
