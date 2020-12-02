import match, { parse } from 'reghex'

const ignored = match('ignored')`
  ${/([\s,]|#[^\n\r]+)+/}
`;

const command_line = match('command_line')`
  (?: ${ignored}? ${/\$\s+/}) ${/.*/}
`

const identifier = match('identifier')`
  ${/VALUE|FUNCTION/} (?: ${/_/}) ${/\d+/}
`

const variable_name = match('variable_name')`
  ${/\S+/}
`

const if_statement = match('if_statement')`
  (?: ${ignored}? ${/if\s+/})
  ${identifier}
  (?: ${ignored}?)
  (?: ${/{/} ${ignored}?)
  ${grammar}
  (?: ${ignored}? ${/}/})
  (
    (?: ${ignored}? ${/else/} ${ignored}? ${/{/} ${ignored}?)
    ${grammar}
    (?: ${ignored}? ${/}/})
  )?
`

const in_statement = match('in_statement')`
  (?: ${ignored}? ${/in\s+/})
  ${identifier}
  (?: ${ignored}?)
  (?: ${/{/} ${ignored}?)
  ${grammar}
  (?: ${ignored}? ${/}/})
`

const await_statement = match('await_statement')`
  (?: ${ignored}? ${/await\s+/})
  ${identifier}
  (?: ${ignored}?)
`

const stdout_statement = match('stdout_statement')`
  (?: ${ignored}? )
  ${/std(out|err)/}
  (?: ${/\s+>>\s+/} )
  ( ${identifier} | ${variable_name} )  
  (?: ${ignored}?)
`

const grammar = match('grammar')`
  (
    (?: ${ignored})
    | ${command_line}
    | ${if_statement}
    | ${in_statement}
    | ${await_statement}
    | ${stdout_statement}
  )+
`

export default parse(grammar)
