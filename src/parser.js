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

const grammar = match('grammar')`
  ( (?: ${ignored}) | ${command_line} | ${if_statement} | ${in_statement} )+
`

export default parse(grammar)
