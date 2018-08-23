import { http } from '../../utils/util.js'

Page({
  data: {
    inputValue: '',
    active: false
  },
  bindKeyInput: function (e) {
    this.setData({
      inputValue: e.detail.value,
      active: /^1\d{10}$/.test(e.detail.value)
    });
  },
  nextPhase: function () {
    if (this.data.active) {
      http('/appusers/getcode', { phone: this.data.inputValue }, 'post').then(
        () => {
          wx.redirectTo({
            url: './phase-two?phone=' + this.data.inputValue,
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