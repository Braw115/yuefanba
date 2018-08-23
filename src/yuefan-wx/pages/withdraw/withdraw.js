import { http } from '../../utils/util.js'

Page({
  data: {
    active: false
  },
  /**
   * 页面的初始数据
   */
  data: {
    userInfo: {},
    balance: '0.00',
    inputValue: ''
  },
  bindKeyInput: function(e) {
    this.setData({
      inputValue: e.detail.value,
      active: !Number.isNaN(Number(e.detail.value)) && +e.detail.value>0 && +e.detail.value <= +this.data.balance,
    });
  },
  submit: function() {
    // wx: wx.showModal({
    //   title: '提示',
    //   content: '抱歉，现在无法提现',
    //   showCancel: true,
    //   success: function(res) {},
    //   fail: function(res) {},

    // })
    http('/app/wxpay/businesspay', { pay: this.data.inputValue, useruuid:this.data.userInfo.uuid}, 'post').then(
      (res) => {
        wx.showModal({
          content: '提现成功',
          showCancel: false
        });
        this.getBalance()
      },
      (err) => {
        wx.showModal({
          content: err,
          showCancel: false
        });
      }
    )
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.getBalance()
  },
  getBalance: function(){
    http('/app/wxpay/option').then(res => {
      getApp().getMineInfo(userInfo => {
        this.setData({
          userInfo: userInfo,
          balance: ((userInfo.balance || 0) / res.proportion).toFixed(2)
        })
      });
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})