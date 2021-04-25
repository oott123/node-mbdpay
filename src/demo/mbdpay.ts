import { MbdPay } from '..'

if (!process.env.MBD_APP_ID || !process.env.MBD_APP_KEY) {
  throw new Error('缺少 MBD_APP_ID 或 MBD_APP_KEY')
}

export const mbdpay = new MbdPay(process.env.MBD_APP_ID, process.env.MBD_APP_KEY)
