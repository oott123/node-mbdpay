import { MbdPayOrderInput } from '..'

export function createOrderFromBody(body: any): MbdPayOrderInput {
  return {
    description: body.description,
    priceInCent: parseInt(body.priceInCent),
    outTradeNumber: body.outTradeNumber,
  }
}
