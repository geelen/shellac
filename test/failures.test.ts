import shellac from '../src'

describe('failure messages', () => {
  it('should run a simple command', async () => {
    expect(shellac``).rejects.toThrowError('Must provide statements')
  })
})
