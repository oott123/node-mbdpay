import { createHash } from 'crypto'
import { request } from 'https'
import { Agent, IncomingMessage } from 'node:http'
import { MbdPayError } from './MbdPayError'
import { TimeoutError } from './TimeoutError'

/**
 * 高级参数
 */
export interface MbdPayOptions {
  /** 面包多Pay 访问地址 */
  apiEndpoint?: string
  /** 面包多Pay 微信获取 OpenId 访问地址 */
  weChatOpenIdEndpoint?: string
  /** API 请求超时 */
  timeout?: number
  /** http 请求 Agent */
  agent?: any
  /** 面包多Pay IP 白名单 */
  ipWhiteList?: string[]
}

/**
 * 通用订单信息
 */
export interface MbdPayOrderInput {
  /** 商品描述 */
  description: string
  /** 订单金额，单位人民币分 */
  priceInCent: number
  /** 外部系统订单号，为空则由面包多Pay 生成 */
  outTradeNumber?: string
}

/**
 * 微信 JSAPI 使用的相关参数
 */
export interface MbdPayWeChatJsApiParams {
  appId: string
  timeStamp: string
  nonceStr: string
  package: string
  signType: string
  paySign: string
}

/**
 * 面包多Pay 系统返回的订单
 */
export interface MbdPayOrder {
  /** 订单号 */
  order_id: string
  /** 支付渠道流水号 */
  charge_id: string
  /** 商品描述 */
  description: string
  /** 结算 ID */
  share_id: string | null
  /** 结算状态 */
  share_state: string
  /** 支付金额，单位为分 */
  amount: string
  /** 支付状态，0-未支付，1-已支付，2-已结算，3-投诉中，4-投诉完结，5-投诉超时，6-投诉中(买家处理中) */
  state: string
  /** 支付时间（时间戳）（秒级） */
  craete_time: string
  /** 支付渠道，1为微信支付，2为支付宝 */
  payway: string
  /** 退款状态，0为无退款，1为部分退款，2为全部退款 */
  refund_state: string
  /** 已退款金额，单位为分 */
  refund_amount: string
  /** 附加参数（json格式） */
  plusinfo?: string
}

export class MbdPay {
  private agent: Agent | undefined | false
  private version: string
  private timeout: number
  private apiEndpoint: string
  private weChatOpenIdEndpoint: string
  private ipAllowList: string[]

  /**
   * 创建面包多Pay SDK 实例
   *
   * @see 注册面包多Pay https://mbd.pub/good/YVJIZ04zSE5YQkdtWldscTF1enNtZz09
   * @see 开发参数获取地址 https://mbd.pub/dev
   * @param appId 面包多Pay 后台 appid
   * @param appKey 面包多Pay 后台 appKey
   * @param options 高级参数，没有特殊需求无需设置
   */
  constructor(private appId: string, private appKey: string, options?: MbdPayOptions) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      this.version = 'v' + require('../package.json').version
    } catch {
      this.version = 'unknown'
    }
    this.apiEndpoint = options?.apiEndpoint || 'https://api.mianbaoduo.com/release'
    this.weChatOpenIdEndpoint = options?.weChatOpenIdEndpoint || 'https://mbd.pub/openid'
    this.timeout = options?.timeout || 3000
    this.agent = options?.agent
    this.ipAllowList = options?.ipWhiteList || ['49.233.5.148', '140.143.158.124']
  }

  private sign(payload: Record<string, any>): string {
    const sortedKeys = [...Object.keys(payload).sort(), 'key']
    const payloadWithAppKey: Record<string, any> = { ...payload, key: this.appKey }
    const signPayload = sortedKeys.map((key) => `${key}=${payloadWithAppKey[key]}`).join('&')
    const hash = createHash('md5').update(signPayload).digest('hex')
    return hash
  }

  private httpPost(url: string, payload: Record<string, any>) {
    return new Promise<{ res: IncomingMessage; body: any }>((resolve, reject) => {
      const payloadText = JSON.stringify(payload)

      const req = request(
        url,
        {
          agent: this.agent,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payloadText),
            'User-Agent': `mbdpay/${this.version} Node.js/${process.version}`,
          },
        },
        (res) => {
          const chunks: Array<Buffer> = []
          res.on('data', (chunk) => {
            chunks.push(chunk)
          })
          res.on('close', () => {
            const body = Buffer.concat(chunks)
            try {
              resolve({
                res,
                body: JSON.parse(body.toString()),
              })
              clearTimeout(timer)
            } catch (e) {
              reject(e)
            }
          })
        },
      )

      req.on('error', reject)

      const timer = setTimeout(() => {
        req.destroy()
        reject(new TimeoutError(req))
      }, this.timeout)

      req.write(payloadText)
      req.end()
    })
  }

  private async request(path: string, payload: Record<string, any>) {
    const payloadWithAppId = {
      ...payload,
      app_id: this.appId,
    }

    const response = await this.httpPost(this.apiEndpoint + path, {
      ...payloadWithAppId,
      sign: this.sign(payloadWithAppId),
    })
    if (response.body?.error) {
      throw new MbdPayError(response.body.error)
    }
    return response
  }

  /**
   * 获取用于获取用户 openId 的 URL
   *
   * @link https://doc.mbd.pub/api/huo-qu-yong-hu-openid
   * @param redirectUrl 回调 URL
   * @return 将要跳转的 URL
   */
  public weChatGetRedirectUrlForGettingUserOpenId(redirectUrl: string): string {
    const url = new URL(this.weChatOpenIdEndpoint)
    const params = new URLSearchParams()
    params.set('target_url', redirectUrl)
    params.set('app_id', this.appId)
    url.search = params.toString()
    return url.toString()
  }

  /**
   * 获取微信 JSAPI 支付需要使用的参数
   *
   * @link https://doc.mbd.pub/api/wei-xin-zhi-fu
   * @see weChatGetRedirectUrlForGettingUserOpenId
   * @param openId 用户的 openId
   * @param order 订单详情
   * @param redirectUrl 支付完成后跳转的 URL
   * @returns JSAPI 需要使用的参数
   */
  public async weChatGetJsApiParams(
    openId: string,
    order: MbdPayOrderInput,
    redirectUrl: string,
  ): Promise<MbdPayWeChatJsApiParams> {
    const payload = {
      openid: openId,
      description: order.description,
      amount_total: order.priceInCent,
      out_trade_no: order.outTradeNumber,
      callback_url: redirectUrl,
    }
    const response = await this.request('/wx/prepay', payload)
    return response.body
  }

  /**
   * 微信 H5 支付（适用于外部手机浏览器）
   *
   * @link https://doc.mbd.pub/api/wei-xin-h5-zhi-fu
   * @param order 订单详情
   * @returns 可唤起微信支付的链接目标 URL
   */
  public async weChatGetWebPayUrl(order: MbdPayOrderInput): Promise<string> {
    const payload = {
      channel: 'h5',
      description: order.description,
      amount_total: order.priceInCent,
      out_trade_no: order.outTradeNumber,
    }
    const response = await this.request('/wx/prepay', payload)
    return response.body.h5_url
  }

  /**
   * 获取支付宝支付使用的 HTML 代码片段
   *
   * @link https://doc.mbd.pub/api/zhi-fu-bao-zhi-fu
   * @param order 订单详情
   * @param redirectUrl 支付后跳转地址，如不填会只显示「支付成功」
   * @returns 可自动唤起支付宝进行支付的 HTML 代码片段，例如 `<form id='alipaysubmit' ... </form><script>...</script>`
   */
  public async aliPayGetFormHtml(order: MbdPayOrderInput, redirectUrl: string): Promise<string> {
    const payload = {
      callback_url: redirectUrl,
      description: order.description,
      amount_total: order.priceInCent,
      out_trade_no: order.outTradeNumber,
    }
    const response = await this.request('/alipay/pay', payload)
    return response.body.body
  }

  /**
   * 查询订单
   *
   * @link https://doc.mbd.pub/api/ding-dan-cha-xun
   * @param keyword 订单号、微信/支付宝流水号
   * @returns 查询到的订单
   */
  public async getOrder(keyword: string): Promise<MbdPayOrder> {
    const payload = {
      out_trade_no: keyword,
    }

    const response = await this.request('/main/search_order', payload)
    return response.body
  }

  /**
   * 退款订单
   *
   * @link https://doc.mbd.pub/api/tui-kuan
   * @param orderId 订单号
   * @returns 退款成功
   */
  public async refund(orderId: string): Promise<boolean> {
    const payload = {
      order_id: orderId,
    }

    const response = await this.request('/main/refund', payload)
    return response.body.code === 200
  }

  /**
   * 检查 IP 是否在面包多的白名单内
   *
   * @link https://doc.mbd.pub/api/ip-bai-ming-dan
   * @param ip 要检查的 IP
   * @returns 是否在白名单内
   */
  public isIpInAllowList(ip: string): boolean {
    return this.ipAllowList.includes(ip)
  }
}
