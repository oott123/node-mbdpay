import { server } from '.'
import { mbdpay } from './mbdpay'
import { MbdPayOrderInput } from '..'

server.post('/alipay', async (request, reply) => {
  const body = request.body as Record<string, string>
  const order: MbdPayOrderInput = {
    description: body.description,
    priceInCent: parseInt(body.priceInCent),
    outTradeNumber: body.outTradeNumber,
  }
  const url = body.browserUrl + 'paid?from=alipay&order_id=' + (order.outTradeNumber || '')
  server.log.debug('支付宝回调 URL: ' + url)
  const html = await mbdpay.aliPayGetFormHtml(order, url)
  await reply.type('text/html').send(`<!DOCTYPE html>
<html lang="zh-Hans">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>跳转中……</title>
  </head>
  <body>
    <p>正在打开支付宝……</p>
    ${html}
  </body>
</html>`)
})
