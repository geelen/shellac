import match, { parse } from 'reghex'

const ignored = match('ignored')`
  ${/([\s,]|#[^\n\r]+)+/}
`;

const command_line = match(`command_line`)`
  (?: ${ignored}? ${/\$ /}) ${/.*/}
`

const grammar = match('grammar')`
  ( (?: ${ignored}) | ${command_line} )+
`

export default parse(grammar)
