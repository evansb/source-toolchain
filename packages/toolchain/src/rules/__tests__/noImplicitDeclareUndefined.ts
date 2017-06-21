import { singleError, noError } from '../../harness/parser'
import { NoImplicitDeclareUndefinedError } from '../noImplicitDeclareUndefined'

it('detects missing value in variable declaration', () => {
  singleError('var x;', {
    errorClass: NoImplicitDeclareUndefinedError,
    explanation: /Missing.*value.*declaration.*/
  })
})
