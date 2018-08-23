import { http } from '../../utils/util.js'
var countItv;
Page({
  data: {
    phone: '',
    inputValue: '',
    active: false,
    countDown: 60
  },
  bindKeyInput: function (e) {
    this.setData({
      inputValue: e.detail.value,
      active: e.detail.value.length === 4
    });
  },
  onLoad: function (options) {
    this.setData({ phone: options.phone })
    this.counting();
  },
  counting: function (time) {
    clearInterval(countItv);
    this.setData({ countDown: time || 60 });
    countItv = setInterval(() => {
      if (this.data.countDown <= 1) {
        clearInterval(countItv);
      }
      this.setData({ countDown: --this.data.countDown });
    }, 1000)
  },
  resend: function () {
    this.counting();
    http('/appusers/getcode', { phone: this.data.phone }, 'post').then(
      () => { },
      err => {
        wx.showModal({
          content: err,
          showCancel: false
        });
      }
    )
  },
  onUnload: function () {
    clearInterval(countItv);
  },
  submit: function () {
    if (this.data.active) {
      http('/appusers/updatephone', { phone: this.data.phone, code: this.data.inputValue }, 'post').then(
        () => {
          wx.showToast({
            title: '手机号绑定成功',
          })
          wx.reLaunch({
            url: '../index/index',
          })
        },
        err => {
          wx.showModal({
            content: err,
            showCancel: false
          });
        }
      )
    }
  }
})