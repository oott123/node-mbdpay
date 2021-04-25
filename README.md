# mbdpay - 面包多Pay Node.js SDK

有完整 TypeScript 类型定义的面包多Pay Node.js SDK，0运行依赖。[API 文档](https://oott123.github.io/node-mbdpay/)

## 功能

目前 Node.js SDK 支持以下功能：

* 微信 JSAPI 支付（微信 App 内支付）
* 微信 H5 支付（微信 App 外调起微信支付）
* 支付宝支付（支付宝 App 内/外支付）
* 查询订单
* 退款
* 检查 IP 是否在面包多白名单中

涵盖当前（2021/04/25）面包多Pay 所有需主动请求的功能支持。

## 演示

在 [src/demo](./src/demo) 目录下有一份可以运行的演示服务，演示了如何使用该 SDK。

你可以在本地启动该演示服务。注意微信 H5 支付需要在[面包多Pay 后台](https://mbd.pub/h5)设置 H5 域名。

```bash
git clone https://github.com/oott123/node-mbdpay.git
cd node-mbdpay
yarn
echo "MBD_APP_ID=你的appid" > .env
echo "MBD_APP_KEY=你的appkey" >> .env
yarn demo
```

## 使用

### 面包多Pay

你需要先[注册面包多Pay](https://mbd.pub/good/YVJIZ04zSE5YQkdtWldscTF1enNtZz09)，并在[开发设置](https://mbd.pub/dev)内获取 APP ID 和 APP KEY 后才可使用。

### 安装

```bash
npm i mbdpay
# 或者
yarn add mbdpay
```

### 示例

```typescript
import { MbdPay, MbdPayOrderInput } from 'mbdpay' # ES Modules
const MbdPay = require('mbdpay').MbdPay # CommonJS

// 实例化
const mdbPay = new MbdPay(appId, appKey)

// 获取用户 openid
const openIdUrl = mbdpay.weChatGetRedirectUrlForGettingUserOpenId(redirectUrl)

// 构建订单
const order: MbdPayOrderInput = {
  description: '商品', // 商品描述
  priceInCent: 123, // 订单金额（分）
  outTradeNumber: 'test123', // 订单编号。注意每个订单号只能支付一次
}

// 获取支付宝调起 HTML
const html = await mbdpay.aliPayGetFormHtml(order, redirectUrl)
// 获取微信 JSAPI 支付参数
const params = await mbdpay.weChatGetJsApiParams(openId, order, redirectUrl)
// 获取微信 H5 支付链接
const url = await mbdpay.weChatGetWebPayUrl(order)

// 查询订单
const order = await mbdpay.getOrder(orderId)
// 订单退款
const success = await mbdpay.refund(orderId)
```

查看 [API 文档](https://oott123.github.io/node-mbdpay/) 以了解参数细节。
