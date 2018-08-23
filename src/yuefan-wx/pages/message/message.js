import {
  http,
  imageUrl,
  getImgAddress,
  setParams,
  throttle,
  formatDate
} from '../../utils/util.js';
let unreadItv;
let times;
var app = getApp();
Page({
  data: {
    noticeArr: [],
    startX: 0, //开始坐标
    startY: 0,
    hasMore: true,
    isLoading: false,
    start: 0,
    length: 8,
    nowLength: 8,
    listType: "all",
    showFilter: false,
  },
  onLoad: function() {
    this.searchNotice(true)
  },
  onHide: function() {
    clearInterval(unreadItv)
  },
  showFilter: function() {
    this.setData({
      showFilter: !this.data.showFilter
    })
  },
  setFilter: function(e) {
    let {
      type
    } = e.currentTarget.dataset;
    this.setData({
      showFilter: !this.data.showFilter
    })
    type && this.setData({
      listType: type
    });
    this.searchNotice(true);
  },
  onReachBottom: function(e) {
    this.searchNotice();
  },
  searchNotice: function(refresh) {
    if (refresh) {
      this.setData({
        start: 0,
        isLoading: true,
        hasMore: true,
        noticeArr: []
      }, () => this.getDataList(refresh));
    } else {
      if (this.data.isLoading || !this.data.hasMore) return;
      this.setData({
        isLoading: true,
        hasMore: true
      }, () => this.getDataList(refresh));
    }
  },
  onShow: function() {
    this.saveFormIds();
    unreadItv = setInterval(this.reLoadList, 1000);
  },
  saveFormIds: function() {
    var formIds = wx.getStorageSync('formIds');
    if (formIds && formIds.length > 0) {
      formIds = JSON.stringify(formIds);
      wx.setStorageSync('formIds', '');
      console.log('formIds', formIds)
      http('/appusers/saveformids', {
        formids: formIds
      }, 'POST').then(res => {
        console.log(JSON.stringify(res))
      }, err => {
        console.log(err)
      })
    }
  },
  reLoadList: function() {
    http('/app/notice/byuser', {
      start: 0,
      length: this.data.nowLength,
      type: this.data.listType
    }).then(res => {
      let today = formatDate(Date.now(), 'yyyy-MM-dd')
      let openItem = this.data.noticeArr.find(item => item.isTouchMove === true)
      let tempArr = res.notices.map(item => {
        if (openItem && openItem.uuid === item.uuid) {
          item.isTouchMove = true
        }
        item.avatar = getImgAddress(item.avatar);
        item.created = formatDate(item.created, 'yyyy-MM-dd') === today ? formatDate(item.created, 'hh:mm') : formatDate(item.created, 'yyyy-MM-dd hh:mm');
        return item
      })
      this.setData({
        noticeArr: tempArr
      });
      wx.stopPullDownRefresh()
      wx.hideNavigationBarLoading()
    }, err => {
      wx.stopPullDownRefresh()
      wx.hideNavigationBarLoading()
      this.setData({
        isLoading: false
      });
      wx.showModal({
        content: err,
        showCancel: false
      });
    })
  },
  onUnload: function() {
    clearInterval(unreadItv)
  },
  getDataList: function(refresh) {
    wx.showNavigationBarLoading()
    http('/app/notice/byuser', {
      start: this.data.start,
      length: this.data.length,
      type: this.data.listType,
    }).then(res => {
      let today = formatDate(Date.now(), 'yyyy-MM-dd');
      let reason = res.reason;
      let tempArr = res.notices.map(item => {
        item.avatar = getImgAddress(item.avatar);
        item.created = formatDate(item.created, 'yyyy-MM-dd') === today ? formatDate(item.created, 'hh:mm') : formatDate(item.created, 'yyyy-MM-dd hh:mm');
        // item.reason = wx.getStorageSync('reason');
        return item
      })
      if (!refresh) {
        tempArr = [...this.data.noticeArr, ...tempArr];
        this.setData({
          nowLength: tempArr.length
        })
      } else {
        this.setData({
          nowLength: this.data.length
        });
      }
      this.setData({
        noticeArr: tempArr,
        start: this.data.start + this.data.length,
        hasMore: res.notices.length === this.data.length,
        isLoading: false
      });
      // this.setData({ noticeArr: res.notice })
      wx.stopPullDownRefresh()
      wx.hideNavigationBarLoading()
    }, err => {
      wx.stopPullDownRefresh()
      wx.hideNavigationBarLoading()
      this.setData({
        isLoading: false
      });
      wx.showModal({
        content: err,
        showCancel: false
      });
    })
  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    this.searchNotice(true);
  },
  refuseInvited: function(e) {
    this.invitedAction(e, "refuse", "spend")
  },
  acceptInvited: function(e) {
    this.invitedAction(e, "accept", "spend")
  },
  refuseNearby: function(e) {
    this.invitedAction(e, "refuse", "nearby")
  },
  acceptNearby: function(e) {
    this.invitedAction(e, "accept", "nearby")
  },
  greetInvited: function(e) {
    this.invitedAction(e, "accept", "make")
  },
  notwillingInvited: function(e) {
    this.invitedAction(e, "refuse", "make")
  },
  invitedAction: function(e, result, noticetype) {
    let that = this;
    throttle(that.doInvitedAction, e, result, noticetype);
  },
  doInvitedAction: function(e, result, noticetype) {
    let index = e.currentTarget.dataset.index;
    let noticeList;
    noticeList = this.data.noticeArr[index];
    wx.showLoading({
      title: '提交中',
      mask: true
    })
    http('/app/order/', {
      noticeuuid: noticeList.uuid,
      noticetype: noticetype,
      result: result
    }, 'POST').then(res => {
      this.onShow();
      wx.hideLoading();
    }, err => {
      wx.hideLoading()
      wx.showModal({
        content: err,
        showCancel: false
      })
    })
  },
  goToMsgDetail: function(e) {
    let notice = this.data.noticeArr[e.currentTarget.dataset.index]
    let orderuuid = notice.orderuuid,
      anotheruseruuid = notice.anotheruseruuid,
      useruuid = notice.useruuid,
      nickname = notice.nickname,
      state = notice.state,
      orderstate = notice.orderstate
      if (notice.type == "audit") {
      console.log('通知', notice.infodeeduuid)
      if(notice.infodeeduuid){
        http('/app/deed/' + notice.infodeeduuid).then(
          res => {
            console.log('res', res)
            let deeduuid = notice.infodeeduuid;
            let nickname = res.deed.nickname;
            let address = res.deed.address;
            let created = res.deed.created;
            let restaurant = res.deed.restaurant;
            let deedtype = res.deed.type;
            let getdeposit = res.deed.getdeposit;
            let uuid = res.deed.uuid;
            let avatar = getImgAddress(res.deed.avatar);
            http('/app/notice/state/read', { uuid: notice.uuid }, 'PUT').then(res => {
              // console.log(res)
            })
            wx.navigateTo({
              url: setParams('../deed-detail/deed-detail', {
                deedtype, uuid, getdeposit, deedtype, restaurant, created, address, nickname, avatar, deeduuid, latest: this.data.latest,otherdeeduuid:deeduuid
              })
            }),
              err => {
                wx.showModal({
                  content: err,
                  showCancel: false
                });
              }
        });
      }
      else{
      wx.setStorageSync('reason', notice.reason)
      wx.navigateTo({
        url: setParams('../msg-detail/msg-detail', {
          btntype: notice.type,
          uuid: notice.uuid,
          orderuuid: orderuuid,
          useruuid1: anotheruseruuid,
          useruuid2: useruuid
        })
      })
      }
    } 
    else if (notice.result == "accept") {
        wx.navigateTo({
        url: setParams('../chat/chat', {
          noticeuuid: notice.uuid,
          orderuuid: orderuuid,
          useruuid1: anotheruseruuid,
          useruuid2: useruuid,
          nickname: nickname,
          state,
          orderstate
        }),
      })
    } else {
      wx.navigateTo({
        url: setParams('../msg-detail/msg-detail', {
          uuid: notice.uuid,
          btntype: notice.type,
          btnresult: notice.result
        })
      })
    }
  },
  //手指触摸动作开始 记录起点X坐标
  touchstart: function(e) {
    clearInterval(unreadItv)
    //开始触摸时 重置所有删除
    this.data.noticeArr.forEach(function(v, i) {
      if (v.isTouchMove) //只操作为true的
        v.isTouchMove = false;
    })
    this.setData({
      startX: e.changedTouches[0].clientX,
      startY: e.changedTouches[0].clientY,
      noticeArr: this.data.noticeArr
    })
  },
  touchend: function() {
    clearInterval(unreadItv)
    unreadItv = setInterval(this.reLoadList, 1000)
  },
  //滑动事件处理
  touchmove: function(e) {
    if (this.data.isLoading) return
    var that = this,
      index = e.currentTarget.dataset.index, //当前索引
      startX = that.data.startX, //开始X坐标
      startY = that.data.startY, //开始Y坐标
      touchMoveX = e.changedTouches[0].clientX, //滑动变化坐标
      touchMoveY = e.changedTouches[0].clientY, //滑动变化坐标
      //获取滑动角度
      angle = that.angle({
        X: startX,
        Y: startY
      }, {
        X: touchMoveX,
        Y: touchMoveY
      });
    // angle = ({ X: startX, Y: startY }, { X: touchMoveX, Y: touchMoveY });
    let tempArr = [...that.data.noticeArr]
    tempArr.map(function(v, i) {
      v.isTouchMove = false
      //滑动超过30度角 return
      if (Math.abs(angle) > 30) return;
      if (i == index) {
        if (touchMoveX > startX) //右滑
          v.isTouchMove = false
        else //左滑
          v.isTouchMove = true
      }
      return v
    })
    //更新数据
    this.setData({
      noticeArr: tempArr
    })
  },
  angle: function(start, end) {
    var _X = end.X - start.X,
      _Y = end.Y - start.Y
    //返回角度 /Math.atan()返回数字的反正切值
    return 360 * Math.atan(_Y / _X) / (2 * Math.PI);
  },
  //删除事件
  del: function(e) {
    let notice = this.data.noticeArr[e.currentTarget.dataset.index];
    let uuid = notice.uuid;
    let orderstate = notice.orderstate;
    let result = notice.result;
    if (orderstate == 'on') {
      wx.showModal({
         content: '饭单还未结束不能删除',
      })
      return
    }
    else{
    http('/app/notice/' + uuid, '', 'delete').then(
      res => {
        // times = setInterval(this.onLoad(), 3000),
        wx.showToast({
          title: '删除成功',
          content: '',
        })
        
     },
      err => {
        // wx.showModal({
        //   content: err,
        //   showCancel: false
        // });
        wx.showToast({
          title: '删除失败',
          content: '',
        })
      },
      this.setData({
        noticeArr: this.data.noticeArr
      })
    
    )
    }}


})