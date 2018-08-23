import { http } from '../../utils/util.js'
let app = getApp();
Page({
  data: {
    showModal: true,
    logining:false
  },
  onLoad: function (option) {
    console.log(111);
    if (option.login === "true") {
      //服务器登录态过期
      // app.getUserInfo(this.login);
      this.setData({
        showModal: true
      })
    }
    //  else {
    //   wx.checkSession({
    //     success: () => {
    //       //session 未过期，并且在本生命周期一直有效
    //       app.getUserInfo(function (userInfo) {

    //         //判断是否填过基本信息
    //         let init = wx.getStorageSync('initialized');
    //         let toPage = init ? '/pages/index/index' : '/pages/start/start';
    //         wx.reLaunch({
    //           url: toPage
    //         })
    //       });
    //     },
    //     fail: () => {
    //       //登录状态过期
    //       wx.showModal({
    //         showCancel: false,
    //         content: '登录状态过期, 请重新登录.',
    //         success: () => {
    //           console.log(555)
    //           app.getUserInfo(this.login);
    //         }
    //       })
    //     }
    //   })
    // }
  },

  getUserInfo: function (info) {
    this.hideModal();
    console.log(info)
    if (info.detail.userInfo) {
      app.globalData.userInfo = info.detail.userInfo;
      typeof cb == "function" && cb(this.globalData.userInfo);
      this.setData({
        logining: true
      })
      this.login(info.detail.userInfo);
    }else{
      var that = this;
      setTimeout(function(){
           that.setData({
          showModal: true
        })
      },3000)
    }
  },

  getUserInfo88: function () {
    var that = this;
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.userInfo']) {
          wx.authorize({
            scope: 'scope.userInfo',
            success: (res) => {
              console.log(res)
              that.login();
            },
            fail: (err) => {
              console.log(err)
              setTimeout(function () {
                wx.showModal({
                  title: '未授权告示',
                  content: '如需正常使用该小程序，需要获取您的用户个人信息，请按确定并在小程序设置页面将个人信息选项打开！',
                  success: function (res) {
                    if (res.confirm) {
                      wx.openSetting({
                        success: (res) => {
                          console.log(res);
                        },
                        fail: err => {
                          console.log(err);
                        },
                        complete: com => {
                          console.log(com);
                        }
                      });
                    } else if (res.cancel) {
                      that.getUserInfo();
                    }
                  },
                  fail: err => {
                    that.getUserInfo();
                  }
                });
              }, 1000);

            },
            complete: function (c) {
              console.log(c)
            }
          });
          console.log(999)
        } else {
          that.login();
        }
      },
      fail: function (e) {
        console.log(e)
      },
      complete: function (c) {
        console.log(c)
      }
    })
  },
  // 登录
  login: function (userInfo) {
    console.log(666)
    wx.showToast({
      title: '加载中',
      icon: 'loading',
    });
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        http('/appusers/login', {
          code: res.code,
          avatar: userInfo && userInfo.avatarUrl,
          nickname: userInfo && userInfo.nickName
        }, 'post')
          .then(res => {
            wx.hideLoading();
            wx.setStorageSync('token', res.token);
            // console.log('token', res.token)
            if (res.msg) {
              wx.reLaunch({
                url: '/pages/start/start',
              })
            } else {
              wx.setStorageSync('initialized', true)
              wx.reLaunch({
                url: '/pages/index/index',
              })
            }
          },
          err => {
            wx.hideLoading();
            wx.showModal({
              showCancel: false,
              content: err,
              success: () => {
                app.getUserInfo(this.login);
              }
            })
          })
      }
    })
  },


  preventTouchMove: function () {
  },
  /**
   * 隐藏模态对话框
   */
  hideModal: function () {
    var that = this;
    
    this.setData({
      showModal: false
    });
    setTimeout(function () {
      that.setData({
        showModal: true
      })
    }, 3000)
  },
  /**
   * 对话框取消按钮点击事件
   */
  onCancel: function () {
    this.hideModal();
  },
  /**
   * 对话框确认按钮点击事件
   */
  onHide: function () {

  }
})