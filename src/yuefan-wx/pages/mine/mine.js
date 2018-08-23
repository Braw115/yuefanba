import { http, getImgAddress, calcAge } from '../../utils/util.js'
// import { getAllUnread } from '../../index/index.js'
let unreadItv
Page({
  data: {
    avatar: '',
    nickname: '',
    birthday:'',
    gender:''
  },
  onShow: function () {
    this.getAllUnread();
    getApp().getMineInfo(res => {
      let { avatar, nickname, birthday,gender } = res;
      console.log('ress',res);
      let age = calcAge(birthday)
      // let age=calcAge(birthday);
      // console('age',age)
      this.setData({
        avatar: getImgAddress(avatar),
        nickname,
        birthday,
        gender,
        age
      })
    })
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
      this.setData({ hasUnread: res.msg });
      if(res.msg){
         wx.showTabBarRedDot && wx.showTabBarRedDot({
          index: 2,
        })
      } else{
        wx.hideTabBarRedDot({
          index: 2,
        })
      }
    })
  }, 

  customService: function () {
    wx.makePhoneCall({
      phoneNumber: '12345678911',
      success: function (res) { },
      fail: function (res) { },
      complete: function (res) { },
    })
  }
})