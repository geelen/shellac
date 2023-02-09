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

export const parseJSON = (input: string | undefined) => {
  if (!input) throw new Error(`Attempting to parse JSON, got empty stdout.`)
  try {
    return JSON.parse(input)
  } catch (e) {
    throw new Error(`Failed to parse stdout as JSON, got: ${input}`)
  }
}
