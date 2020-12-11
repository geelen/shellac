export type Logger = (line: string) => void

export type Interactive = (line: string, input: ((cmd: string) => void)) => Promise<void>
