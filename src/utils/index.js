import config from '../config/config.js'

function formatNumber (n) {
  const str = n.toString()
  return str[1] ? str : `0${str}`
}

export function formatTime (date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  const t1 = [year, month, day].map(formatNumber).join('/')
  const t2 = [hour, minute, second].map(formatNumber).join(':')

  return `${t1} ${t2}`
}

export function deepCopy (a) {
  return JSON.parse(JSON.stringify(a))
}

export default {
  formatNumber,
  formatTime,
  deepCopy,
  doLogin
}

export function doLogin () {
  wx.login({
    success (res) {
      // wx.getUserInfo({
      //   success: function (res) {
      //     console.log('sucess')
      //   },
      //   fail: function (res) {
      //     console.log('fail')
      //   }
      // })
      if (res.code) {
        console.log(res)
        wx.request({
          url: config.host + '/login/' + res.code,
          success: (res) => {
            const openid = res.data.openid
            const sessionKey = res.data.session_key
            wx.setStorageSync('openid', openid)
            wx.setStorageSync('sessionKey', sessionKey)
            console.log('openid = ', openid)
          }
        })
      } else {
        console.log('login error' + res.errMsg)
      }
    }
  })
}
