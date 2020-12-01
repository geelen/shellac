import shellac from '../src'

describe('failure messages', () => {
  it('should bail on empty string', async () => {
    await expect(shellac``).rejects.toThrowError('Must provide statements')
  })

  it('should bail on invalid syntax', async () => {
    await expect(shellac`DEF NOT VALID`).rejects.toThrowError('Parsing error!')
  })
})
