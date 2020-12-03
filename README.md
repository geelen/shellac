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

Inside a shellac block:

```js
await shellac`
  // commands
`
```

`$ my command here` executes commands

`$$ my command here` executes and streams logs while the test runs

`stdout >> ${ str => ... }` gives you 'str' as the output of the most recent command

`stdout >> var_name` makes the shellac command return `{ var_name: latest_stdout }` instead

> Note: these work for `stderr` too

`in ${ dir } { ... }` lets you change dir for a series of commands

> Note: You can also use the alias of ``shellac.in(dir)` ... ` ``

`await ${ async () => { ... } }` lets you pause the script while you do some dank JS

`// single-line-comments` JS-style single-line comments work


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
