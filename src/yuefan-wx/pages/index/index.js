import {
  http,
  calcAge,
  ageToBirthStart,
  ageToBirthEnd,
  ageToBirth,
  formatDate,
  calcDistance,
  setParams,
  imageUrl,
  getImgAddress,
  formSubmit,
  throttle
} from '../../utils/util.js'
const app = getApp();
let amapFile = require('../../libs/amap-wx.js');
let config = require('../../libs/config.js');
let key = config.Config.key;
let myAmapFun = new amapFile.AMapWX({
  key: key
});
let ageOptions = [
  [ageToBirth(200), ageToBirth(18)],
  [ageToBirth(25), ageToBirth(18)],
  [ageToBirth(30), ageToBirth(25)],
  [ageToBirth(200), ageToBirth(30)]
];
let genderOption = [undefined, 1, 0];
let unreadItv;

//滑动层叠切换
let {
  px2rpx
} = getApp().globalData;
var animation1 = wx.createAnimation({
  duration: 1000,
  timingFunction: "linear",
  delay: 0
})
var animation2 = wx.createAnimation({
  duration: 1000,
  timingFunction: "linear",
  delay: 0
})
var animation3 = wx.createAnimation({
  duration: 1000,
  timingFunction: "linear",
  delay: 0
})
var animation4 = wx.createAnimation({
  duration: 1000,
  timingFunction: "linear",
  delay: 0
})
var animation5 = wx.createAnimation({
  duration: 1000,
  timingFunction: "linear",
  delay: 0
})
//滑动层叠切换

Page({
  data: {
    genderArr: [true, true],
    ageArr: [true, false, false],
    showFilter: false,
    banners: [],
    // hotArr: [],
    imageUrl: imageUrl,
    nearbyArr: [],
    start: 0,
    length: 3,
    hasMore: true,
    isLoading: false,
    myNearby: null,
    hasUnread: false,
    orderby: "distance",

    clubs: [
      // { avatar: '../../testimg/1.png', nickname: '美美' },
      // { avatar: '../../testimg/2.png', nickname: '囡囡' },
      // { avatar: '../../testimg/3.jpg', nickname: '糖糖' },
      // { avatar: '../../testimg/4.jpg', nickname: '丽丽' },
      // { avatar: '../../testimg/5.png', nickname: '微微' },
      // { avatar: '../../testimg/6.jpg', nickname: '娇娇' },
      // { avatar: '../../testimg/7.jpg', nickname: '倩倩' },
      // { avatar: '../../testimg/8.jpg', nickname: '萍萍' },
      // { avatar: '../../testimg/9.jpg', nickname: '琪琪' }
    ],
    done: false,
    interval: '', //记录/清理 时间记录
    time: 0, //时间记录,用户滑动时且时间小于1s则执行左右滑动
  },
  onLoad: function() {
    wx.showNavigationBarLoading()
    this.saveFormIds();
    http('/appbanner/bannerlist').then(
      res => {
        res.map(item => {
          item.img = imageUrl + item.img;
          return item
        })
        this.setData({
          banners: res
        })
        wx.stopPullDownRefresh()
        wx.hideNavigationBarLoading()
      },
      err => {
        wx.stopPullDownRefresh()
        wx.hideNavigationBarLoading()
        wx.showModal({
          content: err,
          showCancel: false
        });
      }
    )
    this.getPosition();
  },
  onShow: function() {
    this.getMine();
    this.getAllUnread();
    //设置消息巡回的时间
    clearInterval(unreadItv);
    unreadItv = setInterval(this.getAllUnread, 2000);
    this.onLoad();
  },
  onPullDownRefresh: function() {
    this.onLoad();
  },
  onHide: function() {
    clearInterval(unreadItv)
  },
  onUnload: function() {
    clearInterval(unreadItv)
  },
  onReachBottom: function(e) {
    this.searchNearby();
  },
  getAllUnread: function() {
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
  gotoLink(e) {
    
    wx.navigateTo({
      url: '/pages/link-to/link-to?link='+this.data.banners[e.target.dataset.index].url,
      success: function(res) {},
      fail: function(res) {},
      complete: function(res) {},
    })
  },

  getHot: function() {
    http('/appusers/hot', {
      start: 0,
      length: 8
    }).then(
      res => {
        wx.stopPullDownRefresh()
        wx.hideNavigationBarLoading()
        let arr = res.row.map(item => {
          item.avatar = getImgAddress(item.avatar);
          item.age = calcAge(Number(item.birthday))
          return item;
        })
        this.setData({
          clubs: arr
        })
      },
      err => {
        wx.showModal({
          content: err,
          showCancel: false
        });
      }
    )
  },
  goToPopular: function() {
    wx.navigateTo({
      url: setParams('../popular/popular'),
    })
  },
  getMine: function() {
    http('/app/deed/my', {
      type: 'nearby',
      start: 0,
      length: 1
    }).then(res => {
      let latest = res.deedslist[0];
      if (latest && !latest.state) {
        //存在有效契约单
        this.setData({
          myNearby: latest
        })
      } else {
        this.setData({
          myNearby: null
        })
      }
    })
  },
  showFilter: function() {
    this.setData({
      showFilter: !this.data.showFilter
    });
  },
  showFilterflash: function() {
    if (!this.data.ageArr[0] && !this.data.ageArr[1] && !this.data.ageArr[2]) {
      wx.showModal({
        content: '年龄必须勾选',
      });
      return
    }
    this.setData({
      showFilter: !this.data.showFilter
    });
    this.onLoad();
  },
  setFilter: function(e) {
    let {
      orderby
    } = e.currentTarget.dataset;
    orderby && this.setData({
      orderby: orderby
    });
    this.searchNearby(true);

  },
  selectAge: function(e) {
    let {
      age,
      num
    } = e.currentTarget.dataset;
    let ageArr = this.data.ageArr
    ageArr[num] = !age
    this.setData({
      ageArr
    });
    console.log('年龄', ageArr)
    // if (this.data.ageArr[0] && !this.data.ageArr[1] || this.data.ageArr[2]) {
    //   this.setData({ ageArr: [true, true, true] });
    // }
    // this.searchNearby(true);
  },
  searchNearby: function(refresh) {
    refresh = refresh === true;
    if (refresh) {
      this.setData({
        start: 0,
        isLoading: true,
        hasMore: true,
        nearbyArr: []
      }, () => this.getNearby(refresh));
    } else {
      if (this.data.isLoading || !this.data.hasMore) return;
      this.setData({
        isLoading: true,
        hasMore: true
      }, () => this.getNearby(refresh));
    }
  },
  getNearby: function(refresh) {
    let nowGender;
    if (this.data.genderArr[0] && this.data.genderArr[1]) nowGender = undefined //不限
    if (this.data.genderArr[0] && !this.data.genderArr[1]) nowGender = 0; //女
    if (!this.data.genderArr[0] && this.data.genderArr[1]) nowGender = 1; //男
    let minAge
    let maxAge
    let agerange
    if (this.data.ageArr[0] && !this.data.ageArr[1] && this.data.ageArr[2]) {
      agerange = [
        [ageToBirthStart(25), ageToBirthEnd(18)],
        [ageToBirthStart(200), ageToBirthEnd(30)]
      ]
    } else {
      if (this.data.ageArr[0]) {
        minAge = ageToBirthEnd(18)
        maxAge = ageToBirthStart(25)
      }
      if (this.data.ageArr[1]) {
        if (!this.data.ageArr[0]) {
          minAge = ageToBirthEnd(25)
        }
        maxAge = ageToBirthStart(30)
      }
      if (this.data.ageArr[2]) {
        if (!this.data.ageArr[0] && !this.data.ageArr[1]) {
          minAge = ageToBirthEnd(30)
        }
        maxAge = ageToBirthStart(200)
      }
      agerange = [
        [maxAge, minAge]
      ]
      console.log('年龄',agerange)
    }

    if (agerange.length < 0) {
      wx.showModal({
        content: '请选择性别',
        // showCancel: false
      });
      return
    }
    if ((agerange[0][0] != undefined) && (agerange[0][1] != undefined)) {
      http('/app/deed/make', {
        gender: nowGender,
        agerange: agerange,
        start: this.data.start,
        length: this.data.length,
        orderby: this.data.orderby,
      }, 'get').then(
        res => {
          let tempArr = res.deedlist.map(item => {
            item.avatar = getImgAddress(item.avatar);
            item.age = calcAge(item.birthday);
            item.time = item.mealtime ? formatDate(item.mealtime[0], 'yyyy-MM-dd hh:mm') : '';
            item.distance = calcDistance(item.distance)
            return item
          })
          if (!refresh) tempArr = [...this.data.nearbyArr, ...tempArr];
          this.setData({
            nearbyArr: tempArr,
            start: this.data.start + this.data.length,
            hasMore: res.deedlist.length === this.data.length,
            isLoading: false
          });
        },
        err => {
          this.setData({
            isLoading: false
          });
          wx.showModal({
            content: err,
            // showCancel: false
          });
        })
    }

  },
  nearbyTap: function(e) {
    let item = e.currentTarget.dataset.item;
    wx.navigateTo({
      url: setParams('../profile/profile', {
        uuid: item.useruuid,
        useruuid: "index",
        deeduuid: item.uuid,
        type: 'nearby'
      }),
    })
  },
  navToRadar: function() {
    http('/app/deed/my', {
      type: 'nearby',
      start: 0,
      length: 1
    }).then(res => {
      let latest = res.deedslist[0];
      let agerange
      if (latest && !latest.state) {
        //存在有效契约单
        this.setData({
          myNearby: latest
        });
      } else {
        let nowGender;
        if (this.data.genderArr[0] && this.data.genderArr[1]) nowGender = undefined //不限
        if (this.data.genderArr[0] && !this.data.genderArr[1]) nowGender = 0; //女
        if (!this.data.genderArr[0] && this.data.genderArr[1]) nowGender = 1; //男
        let minAge
        let maxAge

        if (this.data.ageArr[0] && !this.data.ageArr[1] && this.data.ageArr[2]) {
          agerange = [
            [ageToBirthStart(25), ageToBirthEnd(18)],
            [ageToBirthStart(200), ageToBirthEnd(30)]
          ]
        } else {
          if (this.data.ageArr[0]) {
            minAge = ageToBirthEnd(18)
            maxAge = ageToBirthStart(25)
          }
          if (this.data.ageArr[1]) {
            if (!this.data.ageArr[0]) {
              minAge = ageToBirthEnd(25)
            }
            maxAge = ageToBirthStart(30)
          }
          if (this.data.ageArr[2]) {
            if (!this.data.ageArr[0] && !this.data.ageArr[1]) {
              minAge = ageToBirthEnd(30)
            }
            maxAge = ageToBirthStart(200)
          }
          agerange = [
            [maxAge, minAge]
          ]
        }
        if (agerange.length < 0) {
          wx.showModal({
            content: '请选择性别',
            showCancel: false
          });
          return
        }
        http('/app/deed/make', {
          gender: nowGender,
          agerange: agerange,
          start: this.data.start,
          length: this.data.length,
          orderby: this.data.orderby
        }, 'get').then(
          res => {
            let tempArr = res.deedlist.map(item => {
              item.avatar = getImgAddress(item.avatar);
              item.age = calcAge(item.birthday);
              item.time = item.mealtime ? formatDate(item.mealtime[0], 'yyyy-MM-dd hh:mm') : '';
              item.distance = calcDistance(item.distance)
              return item
            })
            // if (!refresh) 
            tempArr = [...this.data.nearbyArr, ...tempArr];
            this.setData({
              nearbyArr: tempArr,
              start: this.data.start + this.data.length,
              hasMore: res.deedlist.length === this.data.length,
              isLoading: false
            });
          },
          err => {
            this.setData({
              isLoading: false
            });
            wx.showModal({
              content: err,
              showCancel: false
            });
          })
        this.setData({
          myNearby: null
        });
      }

      if (!this.data.myNearbys) {
        let latest = this.data.latest;
        wx.navigateTo({
          url: setParams('../radar/radar', {
            latest,
            agerange: JSON.stringify(agerange)
          })
        })
      }

      // if (!this.data.myNearby) {

      // } 
      // else {
      //   wx.navigateTo({
      //     url: '../radar/radar',
      //   })
    })
  },

  getRegeo(location) {
    return new Promise(function(resove, reject) {
      myAmapFun.getRegeo({
        location: location,
        success: (data) => {
          console.log(data)
          resove(data);
        },
        fail: function(info) {
          reject(info.errMsg);
        }
      })
    });
  },
  authPositionCb: function() {
    wx.getLocation({
      success: (res) => {
        console.log(res)
        //根据经纬度进行逆地址解析,获取当前位置的信息
        this.getRegeo(res.longitude + ',' + res.latitude)
          .then((data) => {
            let city = data[0] && data[0].regeocodeData.addressComponent.district.toString() ||
              data[0].regeocodeData.addressComponent.city;
            let area = data[0] && data[0].regeocodeData.addressComponent.city.toString() ||
              data[0].regeocodeData.addressComponent.city;
            app.getUserInfo((userInfo) => {
              http('/appusers/syncinfo', {
                nickname: userInfo.nickName,
                avatar: userInfo.avatarUrl,
                latitude: res.latitude,
                longitude: res.longitude,
                city: city,
                area: area,

              }, 'post').then(res => {

                // wx.openLocation({
                //   latitude: res.latitude,
                //   longitude: res.longitude,
                //   scale: 28,
                //   complete:function(c){
                //     console.log(c)
                //   }
                // // }),
                // wx.reverseGeocoder({
                //   location: {
                //     latitude: res.latitude,
                //     longitude: res.longitude
                //   },
                //   complete: function (res) {
                //     console.log('district', res);
                //   },

                // }),

                this.getHot();
                this.searchNearby(true);
              }, err => {
                console.log('error: ' + err)
              })
            })
          })
          .catch((err) => {
            wx.showModal({
              content: err + "load",
              showCancel: false
            })
          });
      }
    })
  },
  getPosition: function() {
    wx.getSetting({
      success: res => {
        //查看授权情况
        if (res.authSetting['scope.userLocation']) {
          this.authPositionCb();
        } else {
          //申请授权
          wx.authorize({
            scope: 'scope.userLocation',
            success: () => {
              this.authPositionCb();
            },
            fail: () => {
              //申请被拒绝,显示提示信息
              wx.showModal({
                title: '警告',
                content: '若不授权地理位置,将无法使用该小程序,点击重新获取授权。',
                confirmText: '授权',
                cancelText: '不授权',
                success: (e) => {
                  //打开授权设置页面
                  if (e.confirm) {
                    wx.openSetting({
                      success: res => {
                        if (res.authSetting['scope.userLocation']) {
                          this.authPositionCb();
                        } else {
                          wx.reLaunch({
                            url: '../index/index',
                          })
                        }
                      }
                    })
                  } else {
                    wx.reLaunch({
                      url: '../index/index',
                    })
                  }
                }
              })
            }
          })
        }
      }
    })
  },
  inviteNearby: function(e) {
    let that = this;
    throttle(that.doInviteNearby, e);
  },
  doInviteNearby: function(e) {
    wx.showLoading({
      title: '提交中',
      mask: true
    })
    let deeduuid = e.currentTarget.dataset.uuid;
    http('/app/notice/nearbyonhome', {
      deeduuid
    }, 'post').then(res => {
      this.getNearby(true);
      wx.hideLoading();
      wx.showToast({
        title: '邀请已发送',
      })
    }, err => {
      wx.hideLoading();
      wx.showModal({
        content: err,

      })
    })
  },
  saveFormIds: function() {
    var formIds = wx.getStorageSync('formIds');
    if (formIds && formIds.length > 0) {
      formIds = JSON.stringify(formIds);
      wx.setStorageSync('formIds', '');
      http('/appusers/saveformids', {
        formids: formIds
      }, 'POST').then(res => {
        console.log(JSON.stringify(res))
      }, err => {
        console.log(err)
      })
    }
  },
  toProfile: function(e) {
    let index = e.currentTarget.dataset.index;
    console.log('index', index)
    let List;
    List = this.data.clubs[index];
    wx.setStorageSync('hotUserData', List);
    wx.navigateTo({
      url: setParams('../profile/profile', {
        uuid: List.useruuid,
      }),
    })
  },
  doMine: function(e) {
    formSubmit(e)
    wx.navigateTo({
      url: '../mine/mine',
    })
  },
  doMsg: function(e) {
    formSubmit(e)
    wx.navigateTo({
      url: '../message/message',
    })
  },
  selectGender: function(e) {
    let {
      gender
    } = e.currentTarget.dataset;
    if (gender === 'girl') {
      this.setData({
        genderArr: [!this.data.genderArr[0], this.data.genderArr[1]]
      })
    } else if (gender === 'boy') {
      this.setData({
        genderArr: [this.data.genderArr[0], !this.data.genderArr[1]]
      })
    }
    this.searchNearby(true);
  },
  // selectAge: function (e) {
  //   let { age, num } = e.currentTarget.dataset;
  //   let ageArr = this.data.ageArr
  //   ageArr[num] = !age
  //   this.setData({ ageArr });
  //   console.log('年龄',ageArr)
  //   // if (this.data.ageArr[0] && !this.data.ageArr[1] || this.data.ageArr[2]) {
  //   //   this.setData({ ageArr: [true, true, true] });
  //   // }
  //   // this.searchNearby(true);
  // },


  //滑动层叠切换
  //触摸开始事件
  touchstart: function(e) {
    console.log(666, e.touches[0].pageX);
    this.data.touchDot = e.touches[0].pageX;
    var that = this;
    this.data.interval = setInterval(function() {
      that.data.time += 1;
    }, 100);
  },
  //触摸移动事件
  touchmove: function(e) {
    let touchMove = e.touches[0].pageX;
    let touchDot = this.data.touchDot; //触摸时的原点
    let time = this.data.time;

    //向左滑动
    if (touchMove - touchDot <= -40 && time < 10 && !this.data.done) {
      console.log("touchMove: " + touchMove + ", touchDot: " + touchDot + ", diff: " + (touchMove - touchDot));
      console.log("向左滑动");
      this.data.done = true;
      this.scrollLeft();
    }
    //向右滑动
    if (touchMove - touchDot >= 40 && time < 10 && !this.data.done) {
      console.log("touchMove: " + touchMove + ", touchDot: " + touchDot + ", diff: " + (touchMove - touchDot));
      console.log("向右滑动");
      this.data.done = true;
      this.scrollRight();
    }
  },
  //触摸结束事件
  touchend: function(e) {
    clearInterval(this.data.interval);
    this.data.time = 0;
    this.data.done = false;
  },

  //向左滑动事件
  scrollLeft() {
    this.animation1 = animation1;
    this.animation2 = animation2;
    this.animation3 = animation3;
    this.animation4 = animation4;
    this.animation5 = animation5;

    this.animation1.translateX(0).step();
    this.animation2.translateX(-180 / px2rpx).scale(0.8, 0.8).step();
    this.animation3.translateX(-200 / px2rpx).scale(1, 1).step();

    this.animation4.translateX(-300 / px2rpx).scale(1.4, 1.4).step();
    this.animation5.translateX(-200 / px2rpx).scale(1, 1).step();

    this.setAnimation()

    var that = this;
    setTimeout(function() {
      that.animation1.translateX(65 / px2rpx).scale(0.8, 0.8).step({
        duration: 0,
        timingFunction: 'linear'
      });
      that.animation2.translateX(10 / px2rpx).scale(1, 1).step({
        duration: 0,
        timingFunction: 'linear'
      });
      that.animation3.translateX(0).scale(1.4, 1.4).step({
        duration: 0,
        timingFunction: 'linear'
      });
      that.animation4.translateX(-10 / px2rpx).scale(1, 1).step({
        duration: 0,
        timingFunction: 'linear'
      });
      that.animation5.translateX(-65 / px2rpx).scale(0.8, 0.8).step({
        duration: 0,
        timingFunction: 'linear'
      });
      that.setAnimation();
    }.bind(this), 195)

    let array = this.data.clubs;
    let shift = array.shift();
    array.push(shift);

    setTimeout(function() {
      this.setData({
        clubs: array
      })
    }.bind(this), 195)
  },

  //向右滑动事件
  scrollRight() {
    this.animation1 = animation1;
    this.animation2 = animation2;
    this.animation3 = animation3;
    this.animation4 = animation4;
    this.animation5 = animation5;

    this.animation1.translateX(200 / px2rpx).scale(1, 1).step();
    this.animation2.translateX(300 / px2rpx).scale(1.4, 1.4).step();
    this.animation3.translateX(200 / px2rpx).scale(1, 1).step();
    this.animation4.translateX(180 / px2rpx).scale(0.8, 0.8).step();
    this.animation5.translateX(0).step();

    this.setAnimation()

    var that = this;
    setTimeout(function() {
      that.animation1.translateX(65 / px2rpx).scale(0.8, 0.8).step({
        duration: 0,
        timingFunction: 'linear'
      });
      that.animation2.translateX(10 / px2rpx).scale(1, 1).step({
        duration: 0,
        timingFunction: 'linear'
      });
      that.animation3.translateX(0).scale(1.4, 1.4).step({
        duration: 0,
        timingFunction: 'linear'
      });
      that.animation4.translateX(-10 / px2rpx).scale(1, 1).step({
        duration: 0,
        timingFunction: 'linear'
      });
      that.animation5.translateX(-65 / px2rpx).scale(0.8, 0.8).step({
        duration: 0,
        timingFunction: 'linear'
      });
      that.setAnimation()
    }.bind(this), 195)

    let array = this.data.clubs;
    let pop = array.pop();
    array.unshift(pop);

    setTimeout(function() {
      this.setData({
        clubs: array
      })
    }.bind(this), 195)
  },
  setAnimation: function() {
    this.setData({
      animation1: animation1.export(),
      animation2: animation2.export(),
      animation3: animation3.export(),
      animation4: animation4.export(),
      animation5: animation5.export()
    })
  },
  //滑动层叠切换

  //   onLaunch: function () {
  //     var that = this;
  //     //1.2实例化腾讯地图API核心类
  //     that.globalData.qqmapsdk = new QQMapWX({
  //       key: '开发秘钥'
  //     });
  //     //1.3wx.getLocation方法获取当前位置坐标。
  //     wx.getLocation({
  //       altitude: false,
  //       success: function (res) {
  //         var latitude = res.latitude;
  //         var longitude = res.longitude;
  //         that.globalData.location = {
  //           latitude: latitude,
  //           longitude: longitude
  //         }
  //       }
  //     });

  //   },
  //   globalData: {
  //     url: ''
  //   }
  // }),
  //   on: function(options) {
  //     var that = this;
  //     app.globalData.qqmapsdk.reverseGeocoder({       //qqmapsdk.reverseGeocoder
  //       location: {
  //         latitude: app.globalData.location.latitude,
  //         longitude: app.globalData.location.longitude
  //       },
  //       success: function (res) {
  //         var address = res.result.address;
  //         that.setData({
  //           current_address: address
  //         });
  //       },
  //       fail: function (res) {

  //         wx.showToast({
  //           title: '解析地址错误',
  //           icon: 'loading',
  //           duration: 1000
  //         });

  //       },

  //     }),


  //   },




})