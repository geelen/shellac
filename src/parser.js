import match, { parse } from 'reghex'


const ignored = match('ignored')`
  ${/([\s,]|#[^\n\r]+)+/}
`;

const echo_line = match(`echo_line`)`
  ${ignored}? ${/\$ echo .*/}
`

const grammar = match('grammar')`
  ( ${ignored} | ${echo_line} )*
`

export default parse(grammar)
