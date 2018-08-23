// pages/deed-detail/deed-detail.js
import {http, formatDate } from '../../utils/util.js'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    deedtype:'',
    getdeposit: '',
    restaurant: '',
    created: '',
    address: '',
    nickname: '',
    avatar:'',
    deeduuid:'',
    otherdeeduuid:''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let { deedtype, uuid, getdeposit, restaurant, created, address, nickname, avatar, deeduuid, latest, otherdeeduuid} = options;
    this.setData({
      deedtype: options.deedtype,
      getdeposit: options.getdeposit,
      restaurant: options.restaurant,
      created: options.created,
      address: options.address,
      nickname: options.nickname,
      avatar: options.avatar,
      deeduuid: options.deeduuid,
      latest: options.latest,
      otherdeeduuid: options.otherdeeduuid
    })
    console.log('aaa',options)
  },
  invite:function(){
    let data = {
      otherdeeduuid: this.data.otherdeeduuid
    }
    if (this.data.latest){
      data.mydeeduuid = this.data.latest.uuid
    }
      http('/app/notice/nearbysearch', data, 'post').then(res => {
      wx.showToast({
        title: '邀请已发送'
      })
      //设置邀请发送之后1.5秒后返回到首页
      let timer = setTimeout(function () {
        wx.reLaunch({
          url: '/pages/index/index'
        });
        clearTimeout(timer);
      }, 1500)

      },err => {
        wx.showModal({
          content:err,
        });return
      }
    )

  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})