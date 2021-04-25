import Fastify from 'fastify'

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config()

export const server = Fastify({
  logger: {
    level: 'debug',
    prettyPrint: {
      translateTime: 'SYS:HH:MM:ss.l',
      ignore: 'hostname,pid',
    },
  },
})

// eslint-disable-next-line @typescript-eslint/no-var-requires
void server.register(require('fastify-formbody'))

server.get('/', async (request, reply) => {
  const html = `<!DOCTYPE html>
  <html lang="zh-Hans">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>mbdpay demo</title>
    <style>
      body {
        line-height: 2;
      }
      label {
        display: block;
      }
      button {
        margin: 8px 0;
        font-size: 1em;
        padding: 8px 20px;
      }
    </style>
  </head>
  <body>
    <form method="POST">
      <label>商品描述：<input name="description" type="text" value="mbdpay SDK 测试"></label>
      <label>订单金额：<input name="priceInCent" type="number" value="1">（分）</label>
      <label>订单编号：<input name="outTradeNumber" type="text" value="mdbpay_" id="orderId"></label>
      <input name="browserUrl" type="hidden" id="browserUrl"></input>
      <button type="submit" formaction="/alipay">支付宝</button>
      <button type="submit" formaction="/wechat-web">微信 H5</button>
    </form>
    <script>browserUrl.value = location.href; orderId.value += (Math.random().toString(36).slice(2))</script>
  </body>
  </html>`
  await reply.type('text/html').send(html)
})

require('./alipay')
require('./wechatWeb')

server.listen(8080, (err) => {
  if (err) {
    server.log.error(err)
    process.exit(1)
  }
})
