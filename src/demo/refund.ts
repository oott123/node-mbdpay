import { server } from '.'
import { mbdpay } from './mbdpay'

server.post('/refund', async (request, reply) => {
  const orderId = (request.body as Record<string, string>).outTradeNumber
  if (!orderId) {
    throw new Error('没有订单号')
  }

  const refund = await mbdpay.refund(orderId)

  await reply.type('text/html').send(`<!DOCTYPE html>
  <html lang="zh-Hans">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>订单退款</title>
    </head>
    <body>
      ${refund ? '退款成功' : '退款失败，可能是订单不存在'}
    </body>
  </html>`)
})
