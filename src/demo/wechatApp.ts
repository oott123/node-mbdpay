import { server } from '.'
import { mbdpay } from './mbdpay'
import { createOrderFromBody } from './utils'

server.get('/wechat-get-open-id', async (request, reply) => {
  const url = (request.query as Record<string, string>)?.redirect_url
  const redirectTo = mbdpay.weChatGetRedirectUrlForGettingUserOpenId(url)
  await reply.redirect(302, redirectTo)
})

server.post('/wechat-app', async (request, reply) => {
  const body = request.body as Record<string, string>
  const order = createOrderFromBody(body)
  const openId = body.openId
  if (!body.openId) {
    throw new Error('没有 openid')
  }
  const url = body.browserUrl + 'paid?from=alipay&order_id=' + (order.outTradeNumber || '')

  const params = await mbdpay.weChatGetJsApiParams(openId, order, url)

  await reply.type('text/html').send(`<!DOCTYPE html>
  <html lang="zh-Hans">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>微信支付中间页</title>
    </head>
    <body>
      <button onclick="pay()">微信支付</button>
      <script>
        var params = ${JSON.stringify(params)};

        if (typeof WeixinJSBridge == "undefined") {
          if (document.addEventListener) {
            document.addEventListener('WeixinJSBridgeReady', onBridgeReady, false);
          } else if (document.attachEvent) {
            document.attachEvent('WeixinJSBridgeReady', onBridgeReady);
            document.attachEvent('onWeixinJSBridgeReady', onBridgeReady);
          }
        }

        window.pay = function () {
          alert('请稍等再操作');
        }

        function onBridgeReady() {
          window.pay = function () {
            WeixinJSBridge.invoke(
              'getBrandWCPayRequest',
              params,
              function (res) {
                if (res.err_msg == "get_brand_wcpay_request:ok") {
                  WeixinJSBridge.call('closeWindow');
                } else {
                  alert(res.err_msg);
                }
              }
            );
          };
        }
      </script>
    </body>
  </html>`)
})
