import { server } from '.'
import { mbdpay } from './mbdpay'

server.get('/paid', async (request, reply) => {
  const orderId = (request.query as Record<string, string>).order_id
  if (!orderId) {
    throw new Error('没有订单号')
  }

  const order = await mbdpay.searchOrder(orderId)

  await reply.type('text/html').send(`<!DOCTYPE html>
  <html lang="zh-Hans">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>订单查询</title>
    </head>
    <body>
      <ul>
        <li>订单号：${order.order_id}</li>
        <li>流水号：${order.charge_id}</li>
        <li>描述：${order.description}</li>
        <li>结算号：${order.share_id}</li>
        <li>结算状态：${order.share_state}（0-未结算，1-已结算）</li>
        <li>支付金额：${order.amount}（分）</li>
        <li>支付状态：${order.state}（0-未支付，1-已支付，2-已结算，3-投诉中，4-投诉完结，5-投诉超时，6-投诉买家处理中）</li>
        <li>支付渠道：${order.payway}（1为微信支付，2为支付宝）</li>
        <li>退款状态：${order.refund_state}（0为无退款，1为部分退款，2为全部退款）</li>
      </ul>
      <form action="/refund" method="post">
        <input type="hidden" value="${order.order_id}" name="outTradeNumber"></input>
        <button type="button" onclick="location.reload()">刷新</button>
        <button type="submit">退款</button>
      </form>
    </body>
  </html>`)
})
