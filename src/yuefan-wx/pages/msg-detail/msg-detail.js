import { http, imageUrl, getImgAddress, setParams, formatDate } from '../../utils/util.js'
const app = getApp();
Page({
  data: {
    btntype: '',
    useruuid: '',
  },
  onLoad: function (options) {
    let { orderuuid, useruuid1, useruuid2, nickname, state, orderstate,useruuid } = options;
    console.log(options,"options+++++++++++")
    this.setData({
      btntype: options.btntype
    });
    app.getMineInfo(mineInfo => {
      let target;
      if (mineInfo.uuid === useruuid1) {
        target = useruuid2
      } else {
        target = useruuid1
      }
      console.log('target', target)
      this.setData({ mineInfo, targetuuid: target, orderuuid }, () => {
      this.getInfo();
      });
      console.log('mineInfo:', mineInfo)
    });

    if (options.btntype == "audit") {
      this.setData({
        reason: wx.getStorageSync('reason')
      })
    } else if (options && options.btntype != "audit") {
      this.setData({ btnresult: options.btnresult, listUuid: options.uuid })
      http('/app/notice/' + options.uuid).then(res => {
        res.avatar = getImgAddress(res.avatar);
        // res.time = res.mealtime ? formatDate(res.mealtime[0], 'yyyy-MM-dd hh:mm~') + formatDate(res.mealtime[1], 'hh:mm') : '';
        res.time = res.mealtime ? formatDate(res.mealtime[0], 'yyyy-MM-dd hh:mm') : '';
        this.setData({
          detailData: res,
          rank: res.level || 0,
          useruuid:res.useruuid
        })
      })
    }

    http('/app/notice/state/read', { uuid: options.uuid }, 'PUT').then(res => {
      // console.log(res)
    })
    // this.getInfo();
  },
  getInfo: function () {
    http('/app/chat/newlist', { useruuid: this.data.targetuuid, orderuuid: this.data.orderuuid }).then(res => {
      if (res && res.info) {
        res.info.mealtime = res.info.mealtime ? formatDate(res.info.mealtime[0], 'yyyy-MM-dd hh:mm') : '';
        this.setData({ info: res.info })
      }
    })
  },
  refuseInvited: function (e) {
    this.invitedAction(e, "refuse", "spend")
  },
  acceptInvited: function (e) {
    this.invitedAction(e, "accept", "spend")
  },
  refuseNearby: function (e) {
    this.invitedAction(e, "refuse", "nearby")
  },
  acceptNearby: function (e) {
    this.invitedAction(e, "accept", "nearby")
  },
  greetInvited: function (e) {
    this.invitedAction(e, "accept", "make")
  },
  notwillingInvited: function (e) {
    this.invitedAction(e, "refuse", "make")
  },
  toPersonalCenter: function (e) {
    wx.navigateTo({
      url: setParams('../profile/profile', {
        uuid: this.data.useruuid,
      }),
    })

  },
  invite:function(){
    // let deeduuid = this.data.deeduuid;
    // http('/app/notice/nearbyonhome', { deeduuid }, 'post').then(res => {
    //   wx.showToast({
    //     title: '邀请已发送',
    //   })
    // }, err => {

    //  }
  },

  invitedAction: function (e, result, noticetype) {
    let index = e.currentTarget.dataset.index;
    http('/app/order/', {
      noticeuuid: this.data.listUuid,
      noticetype: noticetype,
      result: result
    }, 'POST').then(res => {
      wx.navigateBack({ delta: 1 })
      console.log('倒退')
    }, err => {
      wx.showModal({
        content: err,
        showCancel: false
      })
    })
  },
})