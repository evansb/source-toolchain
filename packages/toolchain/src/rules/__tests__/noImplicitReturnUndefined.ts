import { singleError, noError } from '../../harness/parser'
import { NoImplicitReturnUndefinedError } from '../noImplicitReturnUndefined'

it('detects missing value in retun statement', () => {
  singleError(
    `
  function foo() {
    return;
  }
  `,
    {
      errorClass: NoImplicitReturnUndefinedError,
      explanation: /Missing.*value.*return.*/
    }
  )
})
