import { server } from '.'
import { mbdpay } from './mbdpay'
import { createOrderFromBody } from './utils'

server.post('/wechat-web', async (request, reply) => {
  const body = request.body as Record<string, string>
  const order = createOrderFromBody(body)
  server.log.debug(order)
  const url = await mbdpay.weChatGetWebPayUrl(order)
  await reply.type('text/html').send(`<!DOCTYPE html>
<html lang="zh-Hans">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>微信H5支付</title>
  </head>
  <body>
    <a href="${url.replace(/&/g, '&amp;')}">点击打开微信</a>
  </body>
</html>`)
})
