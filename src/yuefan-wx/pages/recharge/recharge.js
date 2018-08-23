import { http, formSubmit } from '../../utils/util.js'
Page({
  data: {
    selectedIndex: 0,
    option: [],
    proportion: null
  },
  onLoad: function () {
    http('/app/wxpay/option').then(res => {
      if (res.option instanceof Array){
        this.setData({ option: res.option, proportion: res.proportion })
      }
    })
  },
  changeIndex: function (e) {
    let index = e.currentTarget.dataset.index;
    this.setData({ selectedIndex: index })
  },
  recharge: function () {
      http('/app/wxpay/paydeposit', { pay: this.data.option[this.data.selectedIndex] }, 'post').then(
        (res) => {
          wx.requestPayment({
            'timeStamp': res.param.timeStamp,
            'nonceStr': res.param.nonceStr,
            'package': res.param.package,
            'signType': 'MD5',
            'paySign': res.param.paySign,
            'success': (res) => {
              wx.showToast({
                title: '充值成功',
              });
              wx.navigateBack({});
            },
            'fail': function (res) {
              console.log(res)
            }
          })
          if(res.msg==='ok')
          {
            wx.showToast({
              title: '充值成功',
              duration: 1000,
            })
            // console.log('充值成功')
          }
        },
        (err) => {
          wx.showModal({
            content: err,
            showCancel: false
          });
        }
      )
  },

  formSubmit: function (e) {
    formSubmit(e)
  },
})