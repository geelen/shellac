const LF = '\n'
const CR = '\r'

export const trimFinalNewline = (input: string) => {
  if (input[input.length - 1] === LF) {
    input = input.slice(0, input.length - 1)
  }

  if (input[input.length - 1] === CR) {
    input = input.slice(0, input.length - 1)
  }

  return input
}
