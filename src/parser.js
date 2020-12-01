import match, { parse } from 'reghex';

const name = match('name')`
  ${/\w+/}
`;
