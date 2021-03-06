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
      <input name="openId" type="hidden" id="openId"></input>
      <div>
        <button type="submit" formaction="/alipay">支付宝</button>
        <button type="submit" formaction="/wechat-web">微信 H5</button>
        <button type="submit" formaction="/wechat-app">微信</button>
      </div>
      <div>
        <button type="button" onclick="location.href = '/paid?order_id=' + orderId.value">查订单</button>
        <button type="submit" formaction="/refund" formmethod="post">退款</button>
        <button type="button" style="display: none;" id="clearOpenId" onclick="localStorage.openId = ''; alert('已清空openid'); location.replace('/')">清空openid</button>
      </div>
    </form>
    <script>
      browserUrl.value = location.href;
      orderId.value += (Math.random().toString(36).slice(2));
      if (navigator.userAgent.includes('MicroMessenger/')) {
        if (localStorage.openId) {
          openId.value = localStorage.openId;
          clearOpenId.style.display = 'inline-block';
        } else {
          var match = location.search.match(/openid=([^&]+)(?:&|$)/);
          if (match) {
            localStorage.openId = match[1];
            openId.value = match[1];
            alert('已获取到 openid');
            clearOpenId.style.display = 'inline-block';
          } else {
            if (confirm('获取 openid?')) {
              location.href = '/wechat-get-open-id?redirect_url=' + encodeURIComponent(location.href);
            }
          }
        }
      }
    </script>
  </body>
  </html>`
  await reply.type('text/html').send(html)
})

server.setErrorHandler(async (error, request, reply) => {
  server.log.error(error)
  const html = `<!DOCTYPE html>
  <html lang="zh-Hans">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>mbdpay demo</title>
  </head>
  <body>
    <h2>发生错误</h2>
    <p>${error.message}</p>
    <pre>${error.stack}</pre>
    <a href="/">首页</a>
  </body>
  </html>`
  await reply.type('text/html').send(html)
})

require('./alipay')
require('./wechatWeb')
require('./wechatApp')
require('./paid')
require('./refund')

server.listen(8080, (err) => {
  if (err) {
    server.log.error(err)
    process.exit(1)
  }
})
