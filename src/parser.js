import match, { parse } from 'reghex'

const ignored = match('ignored')`
  ${/([\s,]|#[^\n\r]+)+/}
`;

const comment_line = match('comment_line')`
  (?: ${ignored}? ${/\/\/\s+/})
  ${ /[^\n\r]*/ }
  (?: ${ignored}? )
`

const command_line = match('command_line')`
  (?: ${ignored}? ${/\$\s+/}) ${/.*/}
`

const logged_command = match('logged_command')`
  (?: ${ignored}? ${/\$\$\s+/}) ${/.*/}
`

const identifier = match('identifier')`
  (?:${/#__/}) ${/VALUE|FUNCTION/} (?: ${/_/}) ${/\d+/} (?:${/__#/})
`

const integer_argument = match('integer_argument')`
  (?: ${/\(/}) ${/\d+/} (?: ${/\)/})
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
  ${/std(out|err)|exitcode/}
  (?: ${/\s+>>\s+/} )
  ( ${identifier} | ${variable_name} )  
  (?: ${ignored}?)
`

const exits_statement = match('exits_statement')`
  (?: ${ignored}? ${/exits/})
  (${integer_argument})?
  (?: ${ignored}?)
  (?: ${/{/} ${ignored}?)
  ${grammar}
  (?: ${ignored}? ${/}/})
`

const grammar = match('grammar')`
  (
    (?: ${ignored})
    | ${comment_line}
    | ${command_line}
    | ${logged_command}
    | ${if_statement}
    | ${in_statement}
    | ${await_statement}
    | ${stdout_statement}
    | ${exits_statement}
  )+
`

export default parse(grammar)
