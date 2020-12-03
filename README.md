# Shellac

A tool to make invoking a series of shell commands safer & better-looking.

Works great with [ts-jest](https://github.com/kulshekhar/ts-jest#getting-started):

```js
// ts-jest-example.test.js
import shellac from 'shellac'

describe('my CLI tool', () => {
  it('should do everything I need', async () =>
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
      $ run-app
    }
  `)
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
