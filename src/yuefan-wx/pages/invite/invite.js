import { formSubmit, setParams, http } from '../../utils/util.js'
const app = getApp();
let unreadItv
Page({
  data: {},
  onShow: function () {
    this.getAllUnread();
    clearInterval(unreadItv);
    unreadItv = setInterval(this.getAllUnread, 2000)
  },
  onHide: function () {
    clearInterval(unreadItv)
  },
  onUnload: function () {
    clearInterval(unreadItv)
  },
  getAllUnread: function () {
    http('/app/notice/new').then(res => {
      if (res.msg) {
        wx.showTabBarRedDot && wx.showTabBarRedDot({
          index: 2,
        })
      } else {
        wx.hideTabBarRedDot({
          index: 2,
        })
      }
    })
  },
  onLoad: function () {
    app.getUserInfo((userInfo) => {
      console.log('userInfo', userInfo.gender)
      this.setData({ gender: userInfo.gender })
    });
  },
  doSpend: function (e) {
    formSubmit(e)
    wx.navigateTo({
      url: setParams('../contract/contract', {
        type: 'spend'
      }),
    })
  },
  doMake: function (e){
    formSubmit(e)
    wx.navigateTo({
      url: setParams('../contract/contract', {
        type: 'make'
      }),
    })
  },
  doNearby: function (e) {
    formSubmit(e)
    wx.navigateTo({
      url: setParams('../contract/contract', {
        type: 'nearby'
      }),
    })
  }
})