import Command from './command'
import Shell from './shell'
import {Interactive} from "./types";

export const shell = () => new Shell()

export const command = (shell: Shell) => (cmd: string) =>
  new Command({ shell, cmd }).run()

export const command_interactive = (shell: Shell) => (
  cmd: string,
  interactive: Interactive
) => new Command({ shell, cmd, interactive }).run()
