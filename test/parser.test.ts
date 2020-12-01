import { parser } from '../src'

describe('parser', () => {
  it('should match a single command', () => {
    expect(parser(`$ echo lol`)).toBeTruthy()
  })
})
