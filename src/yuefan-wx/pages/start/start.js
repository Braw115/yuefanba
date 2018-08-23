import { formatDate, http } from '../../utils/util.js'
const app = getApp();
Page({
  data: {
    date: '2000-01',
    hIndex: '80',
    today: formatDate(Date.now(), 'yyyy-MM'),
    heightArr: Array.apply(null, { length: 141 }).map((v, i) => i + 80),
    userInfo: {},
    selectData: '2000年01月',
    active: true
    
  },
  
  onLoad: function () {
    app.getUserInfo((userInfo) => {
      this.setData({ userInfo})
    })
  },
  bindDateChange: function (e) {
    console.log('picker发送选择改变，携带值为', e.detail)
    this.setData({
      date: e.detail.value, selectData: e.detail.value.split('-')[0] + '年' + e.detail.value.split('-')[1] + '月'
})
   
  },
  bindHeightChange: function (e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      hIndex: e.detail.value, active: true
    })
  },
  submit: function () {
    wx.showToast({
      title: '加载中',
      icon: 'loading',
    });
    http('/appusers/addbaseinfo', {
      gender: +this.data.userInfo.gender === 1 ? 1 : 0,
      birthday: new Date(this.data.date).getTime(),
      height: this.data.heightArr[this.data.hIndex]
    }, 'put').then(() => {
      wx.hideLoading();
      wx.setStorageSync("initialized", true)
      wx.reLaunch({
        url: '/pages/index/index',
      })
      },
      err => {
        wx.hideLoading();
      })
  }
})