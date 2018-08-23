import { http } from './utils/util.js'
App({
  globalData: {
    userInfo: null,
    mineInfo: null
  },
  onLaunch: function () {
    wx.getSystemInfo({
      success: (res) => {
        //将移动区域视为井字，可视区域为中间的格子
        let { windowWidth, windowHeight } = res;
        let px2rpx = 750 / windowWidth;
        this.globalData.windowWidth = windowWidth;
        this.globalData.windowHeight = windowHeight;
        this.globalData.px2rpx = px2rpx;
      }
    })
  },
  authSuccessCb: function (cb) {
    wx.getUserInfo({
      success: res => {
        console.log('8888')
        console.log(res)
        this.globalData.userInfo = res.userInfo;
        typeof cb == "function" && cb(this.globalData.userInfo);
      }
    })
  },
  getUserInfo: function (cb) {
    if (this.globalData.userInfo) {
      typeof cb == "function" && cb(this.globalData.userInfo)
    } else {
      wx.getSetting({
        success: res => {
          //查看授权情况
          if (res.authSetting['scope.userInfo']) {
            this.authSuccessCb(cb);
          } else {
            //申请授权
            wx.authorize({
              scope: 'scope.userInfo',
              success: () => {
                this.authSuccessCb(cb);
              },
              fail: () => {
                //申请被拒绝,显示提示信息
                wx.showModal({
                  title: '警告',
                  content: '若不授权微信登录,将无法使用该小程序,点击重新获取授权。',
                  confirmText: '授权',
                  cancelText: '不授权',
                  success: (e) => {
                    //打开授权设置页面
                    e.confirm && wx.openSetting({
                      success: res => {
                        if (res.authSetting['scope.userInfo']) {
                          this.authSuccessCb(cb);
                        }
                      }
                    });
                  }
                })
              }
            })
          }
        }
      })
    }
  },
  getMineInfo: function (cb, notCache) {
    // if (!notCache && this.globalData.mineInfo) {
    //   typeof cb == "function" && cb(this.globalData.mineInfo)
    // } else {
      http('/appusers/').then((res) => {
        this.globalData.mineInfo = res;
        typeof cb == "function" && cb(res)
      })
    //}
  }
})