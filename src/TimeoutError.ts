import { ClientRequest } from 'http'

export class TimeoutError extends Error {
  constructor(public request: ClientRequest) {
    super('Request timeout')
  }
}
