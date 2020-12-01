import match, { parse } from 'reghex'

const empty_line = match(`empty_line`)`
  ${/^\s*$/}
`

const grammar = match('name')`
  (${empty_line} | ${/\$ echo .*/})*
`

export default parse(grammar)
