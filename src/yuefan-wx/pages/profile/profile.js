import {
  http,
  formatUserInfo,
  getImgAddress,
  setParams
} from '../../utils/util.js';
const app = getApp();
Page({
  data: {
    current: 0,
    tabIndex: "0",
    isMine: false,
    userInfo: null,
    myContract: null,
    myNearby: null,
    type: null,
    start: 0,
    length: 10,
    hasMore: true,
    isLoading: false,
    graystar: [],
    activestar: [],
    commentArr: [],
    noticeArr: []
  },
  onLoad: function(options) {
    console.log('options', options)
    this.setData({
      options
    })
    if (options.uuid) {
      this.setData({
        uuid: options.uuid || '',
        type: options.type || null,
        deeduuid: options.deeduuid || '',
        useruuid: options.useruuid || '',
      })
      if (options.deeduuid == 'undefined') {
        http('/appusers/' + options.useruuid).then(res => {
          app.getMineInfo((mineInfo) => {
            let userInfo = formatUserInfo(res);
            console.log('userInfo', userInfo);
            console.log('userInfo', options.uuid);
            this.setData({
              isMine: userInfo.uuid === mineInfo.uuid,
              userInfo: userInfo,
            })
            this.getComment();
          })
        })
      } else {
        http('/appusers/' + options.uuid).then(res => {
          app.getMineInfo((mineInfo) => {
            let userInfo = formatUserInfo(res);
            console.log('userInfo', userInfo);
            this.setData({
              isMine: res.uuid === mineInfo.uuid,
              userInfo: userInfo,
            })
            this.getComment();
          })
        })

      }
    } else {
      app.getMineInfo((mineInfo) => {
        let arear = mineInfo.latitude + mineInfo.longitude;
        console.log('arear', arear);
        let userInfo = formatUserInfo(mineInfo);
        console.log('userInfo2', userInfo);
        this.setData({
          isMine: true,
          userInfo: userInfo,
        })
        this.getComment();
      })
    }
  },
  getComment: function(refresh) {
    http('/appcomments/getcomments', {
      start: this.data.start,
      length: this.data.length,
      useruuid: this.data.userInfo.uuid
    }).then(res => {
      let tempArr = res.commentlist.map(item => {
        item.evaluatoravatar = getImgAddress(item.evaluatoravatar);
        return item
      })
      let starLen = res.level,
        activeStarArr = [],
        grayStarArr = [];
      for (var i = 0; i < starLen; i++) {
        activeStarArr.push(i);
      }
      for (var i = 0; i < 5 - starLen; i++) {
        grayStarArr.push(i);
      }
      if (!refresh) tempArr = [...this.data.commentArr, ...tempArr];
      this.setData({
        commentArr: tempArr,
        activestar: activeStarArr,
        graystar: grayStarArr,
        start: this.data.start + this.data.length,
        hasMore: res.commentlist.length === this.data.length,
        isLoading: false
      });
    }, err => {
      this.setData({
        isLoading: false
      });
      wx.showModal({
        content: err,
        showCancel: false
      });
    })
  },
  loadMore: function(refresh) {
    if (this.data.tabIndex === "1") {
      return
    }
    refresh = refresh === true;
    if (refresh) {
      this.setData({
        start: 0,
        isLoading: true,
        hasMore: true,
        commentArr: []
      }, () => this.getComment(refresh));
    } else {
      if (this.data.isLoading || !this.data.hasMore) return;
      this.setData({
        isLoading: true,
        hasMore: true
      }, () => this.getComment(refresh));
    }
  },
  onShow: function(e) {
    if (!this.data.type) {
      this.getMine('spend');
    } else if (this.data.type === 'radarNearby') {
      this.getMine('nearby')
    }
    if (this.data.isMine && !app.globalData.mineInfo) {
      app.getMineInfo((mineInfo) => {
        let userInfo = formatUserInfo(mineInfo);
        this.setData({
          userInfo: userInfo,
        })
      })
    }
  },
  onReady: function() {
    this.videoContext = wx.createVideoContext('myVideo');
  },
  editProfile: function() {
    this.data.isMine && wx.navigateTo({
      url: '../edit-profile/edit-profile',
    })
  },
  swiperChange: function(e) {
    this.setData({
      current: e.detail.current
    })
  },
  previewAlbum: function(e) {
    if (this.data.userInfo.album && this.data.userInfo.album.length > 0) {
      let index = e.currentTarget.dataset.index;
      let current;
      if (index) current = this.data.userInfo.album[index];
      console.log('current', current);
      wx.previewImage({
        current: current,
        urls: this.data.userInfo.album,
      })
    } else {
      this.data.isMine && wx.navigateTo({
        url: '../edit-profile/edit-profile',
      })
    }
  },
  changeTab: function(e) {
    if (this.data.tabIndex !== e.currentTarget.dataset.index) {
      this.setData({
        tabIndex: e.currentTarget.dataset.index
      })
    }
  },
  play: function(e) {
    this.videoContext.requestFullScreen();
    this.videoContext.play();
  },
  getMine: function(type) {
    let options = this.data.options;
    if (options.useruuid == 'undefined') {
      http('/app/deed/my', {
        type: type,
        start: 0,
        length: 1
      }).then(res => {
        let latest = res.deedslist[0];
        let uuid = latest.uuid;
        this.setData({
          uuid
        });
        if (latest && !latest.state) {
          //存在有效契约单
          type === 'spend' && this.setData({
            myContract: latest
          });
          type === 'nearby' && this.setData({
            myNearby: latest
          });
        }
      })
    } else {
      http('/app/deed/my', {
        type: type,
        start: 0,
        length: 1
      }).then(res => {
        let latest = res.deedslist[0];
        let uuid = options.uuid;
        this.setData({
          uuid
        });
        if (latest && !latest.state) {
          //存在有效契约单
          type === 'spend' && this.setData({
            myContract: latest
          });
          type === 'nearby' && this.setData({
            myNearby: latest
          });
        }
      })
    }
  },
  invite: function() {
    //雷达图约附近
    if (this.data.type === 'radarNearby') {
      let deeduuid = this.data.deeduuid;
      http('/app/notice/nearbysearch', {
        otherdeeduuid: deeduuid,
        mydeeduuid: this.data.myNearby.uuid
      }, 'post').then(res => {
          wx.showToast({
            title: '邀请已发送'
          })
        },
        err => {
          wx.showModal({
            content: err,
          })
        }
      )
      //设置邀请发送之后1.5秒后返回到首页
      let timer = setTimeout(function () {
        wx.reLaunch({
          url: '/pages/index/index'
        });
        clearTimeout(timer);
      }, 1500)
    }
    //首页约附近
    else if (this.data.type === 'nearby') {
      let deeduuid = this.data.deeduuid;
      http('/app/notice/nearbyonhome', {
        deeduuid
      }, 'post').then(res => {
        wx.showToast({
          title: '邀请已发送',
        })
      }, err => {})
    }
    //花钱约赚钱
    else {
      let nickname = this.data.userInfo.nickname;
      let age = this.data.userInfo.age;
      let avatar = getImgAddress(this.data.userInfo.avatar);
      let gender=this.data.userInfo.gender;
      console.log('xingbie',gender)
      wx.navigateTo({
        url: setParams('../contract/contract?type=spend&back=true',{
          nickname,
          age,
          avatar,
          gender
      })
      })
    }
  },
  viewdeed: function(type) {
    let options = this.data.options;
    if (this.data.options.useruuid == 'index'){
      http('/app/deed/' + this.options.deeduuid).then(
        res => {
          console.log('res', res)
          let deeduuid = this.data.deeduuid;
          let nickname = res.deed.nickname;
          let address = res.deed.address;
          let created = res.deed.created;
          let restaurant = res.deed.restaurant;
          let deedtype = res.deed.type;
          let getdeposit = res.deed.getdeposit;
          let uuid = res.deed.uuid;
          let avatar = getImgAddress(res.deed.avatar);
          wx.navigateTo({
            url: setParams('../deed-detail/deed-detail', {
              deedtype,
              uuid,
              otherdeeduuid:uuid,
              getdeposit,
              deedtype,
              restaurant,
              created,
              address,
              nickname,
              avatar,
              deeduuid,
              latest: this.data.latest
            })
          },
            err => {
              wx.showModal({
                content: err,
                showCancel: false
              });
            }
          )

        });
    }
    if (this.data.options.useruuid =='undefined' ) {
      http('/app/deed/my', {
        type:'nearby',
        start: 0,
        length: 1
      }).then(res => {
        console.log('aaaa', res)
        let latest = res.deedslist[0];
        let uuid = latest.uuid;
        this.setData({
          uuid: uuid,
          latest
        })
        if (latest && !latest.state) {
          //存在有效契约单
          type === 'spend' && this.setData({
            myContract: latest
          });
          type === 'nearby' && this.setData({
            myNearby: latest
          });
        }
        //获取契约单数据
        http('/app/deed/' + this.data.deeduuid).then(
          res => {
            console.log('res', res.deed)
            let otherdeeduuid = this.data.deeduuid;
            let nickname = res.deed.nickname;
            let address = res.deed.address;
            let created = res.deed.created;
            let restaurant = res.deed.restaurant;
            let deedtype = res.deed.type;
            let getdeposit = res.deed.getdeposit;
            let uuid = res.deed.uuid;
            let avatar = getImgAddress(res.deed.avatar);
            wx.navigateTo({
                url: setParams('../deed-detail/deed-detail', {
                  deedtype,
                  uuid,
                  getdeposit,
                  deedtype,
                  restaurant,
                  created,
                  address,
                  nickname,
                  avatar,
                  otherdeeduuid,
                  latest: this.data.latest
                })
              },
              err => {
                wx.showModal({
                  content: err,
                  showCancel: false
                });
              }
            )

          });
      })
    } else {
      //获取契约单数据
      http('/app/deed/' + this.options.uuid).then(
        res => {
          console.log('res', res)
          let deeduuid = this.data.deeduuid;
          let nickname = res.deed.nickname;
          let address = res.deed.address;
          let created = res.deed.created;
          let restaurant = res.deed.restaurant;
          let deedtype = res.deed.type;
          let getdeposit = res.deed.getdeposit;
          let uuid = res.deed.uuid;
          let otherdeeduuid = res.deed.uuid;
          let avatar = getImgAddress(res.deed.avatar);
          wx.navigateTo({
              url: setParams('../deed-detail/deed-detail', {
                deedtype,
                uuid,
                otherdeeduuid,
                getdeposit,
                deedtype,
                restaurant,
                created,
                address,
                nickname,
                avatar,
                deeduuid,
                latest: this.data.latest
              })
            },
            err => {
              wx.showModal({
                content: err,
                showCancel: false
              });
            }
          )

        });

    }

  },
  // toggleFav: function () {
  //   http('/appusers/addordellikely', { action: !this.data.userInfo.isfavorite, uuidarr: [this.data.userInfo.uuid] }, 'post')
  //     .then(res => {
  //       this.data.userInfo.isfavorite = res.msg;
  //       wx.showToast({
  //         title: res.msg ? "已收藏" : "已取消收藏"
  //       })
  //       this.setData({ userInfo: this.data.userInfo });
  //     })
  // }
})