import { goAuth } from '@/api/buzz.ts'
import AppConfig from '@/config/'
import MetaIdJs from "metaidjs"

let singleton

export default function SDKInit() {
  if (singleton) return singleton
  singleton = new Promise((resolve, reject) => {
    if (window.appMetaIdJs) {
      // 定义新方法，兼容公开 SDK 与 showapp 内创建节点方法
      window.__metaIdJs = window.appMetaIdJs || {}
      window.__metaIdJs.addProtocolNode_ = (config) => {
        window.addProtocolNodeCallBack_ = (res) => {
          if (typeof res === 'string') {
            res = JSON.parse(res)
          }
          console.log('callback res: ', res)
          config.callback(res)
        }
        window.addProtocolNodeOnCancel_ = (res) => {
          if (typeof res === 'string') {
            res = JSON.parse(res)
          }
          console.log('cancel res: ', res)
          config.onCancel(res)
        }
        console.log('before inApp send: ', config)
        if (window.localStorage.getItem('needConfirm') === 'false') {
          let totalAmount = config.payTo.reduce((acc, cur) => acc + cur.amount, 0)
          console.log('neecConfirm amount', totalAmount)
          if (totalAmount < 2000) {
            config.needConfirm = false
          }
        }
        window.appMetaIdJs.sendMetaDataTx(
          config.accessToken,
          JSON.stringify(config),
          'addProtocolNodeCallBack_',
          // 'addProtocolNodeOnCancel_' // 会报错
        )
      }
      resolve(true)
      return
    } else {
      if (window.__metaIdJs?.isInjectMainFrame) {
        console.log('sdk has cached')
        resolve(true)
        return
      }
      console.log('before new MetaIdJs', performance.now() / 1000)
      window.__metaIdJs = new MetaIdJs({
        oauthSettings: {
          clientId: AppConfig.oauthSettings.clientId,
          clientSecret: AppConfig.oauthSettings.clientSecret,
          redirectUri: AppConfig.oauthSettings.redirectUri,
        },
        onLoaded: () => {
          console.log('metaidjs loaded', performance.now() / 1000)
          resolve(true)
        },
        onError: (res) => {
          console.log(res)
          const { code } = res
          if (code === 201) {
            goAuth()
          }
          reject(code)
        }
      })
      window.__metaIdJs.addProtocolNode_ = window.__metaIdJs.addProtocolNode
    }
  })
  return singleton
}
