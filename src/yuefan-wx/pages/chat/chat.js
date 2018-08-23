import { http, getImgAddress, getChatTime, requestUrl, formatDate } from '../../utils/util.js'
const app = getApp();
var px2rpx = app.globalData.px2rpx;
let unreadItv;
Page({
  data: {
    orderuuid: '',
    useruuid1: '',
    useruuid2: '',
    inputValue: '',
    images: [],
    imageSize: {},
    info: {},
    start: 0,
    length: 10,
    isLoading: false,
    hasMore: true,
    timeSpace: 5 * 60 * 1000,//消息之间显示时间的间隔
    messages: [],
    scrollTo: "bottom"
  },
  onLoad: function (options) {
    let { orderuuid, useruuid1, useruuid2, nickname, state, orderstate } = options;
    wx.setNavigationBarTitle({ title: nickname })
    app.getMineInfo(mineInfo => {
      let target;
      if (mineInfo.uuid === useruuid1) {
        target = useruuid2
      } else {
        target = useruuid1
      }
      console.log('target', target)
      this.setData({ mineInfo, targetuuid: target, orderuuid }, () => {
        this.getMsg()
        this.getInfo();
      });
      console.log('mineInfo:', mineInfo)
    });
    this.setData({ noticeuuid: options.noticeuuid, state, orderstate })
    console.log('options.noticeuuid', options.noticeuuid);
    console.log('state', state)
    console.log(orderstate)
    this.haveRead();
  },
  haveRead: function () {
    http('/app/notice/state/read', { uuid: this.data.noticeuuid }, 'PUT').then(res => {
      console.log('resb', res)
    })
  },
  getInfo: function () {
    http('/app/chat/newlist', { useruuid: this.data.targetuuid, orderuuid: this.data.orderuuid }).then(res => {
      if (res && res.info) {
        res.info.mealtime = res.info.mealtime ? formatDate(res.info.mealtime[0], 'yyyy-MM-dd hh:mm') : '';
        this.setData({ info: res.info })
      }
    })
  },
  onShow: function () {
    clearInterval(unreadItv);
    unreadItv = setInterval(this.getUnread, 2000);
},
  onHide: function () {
    this.haveRead();
    clearInterval(unreadItv)
  },
  onUnload: function () {
    this.haveRead();
    clearInterval(unreadItv)
  },
  loadBefore: function (e) {
    if (this.data.isLoading || !this.data.hasMore) return;
    this.setData({ isLoading: true })
    wx.showNavigationBarLoading()
    http('/app/chat/list', {
      orderuuid: this.data.orderuuid,
      start: this.data.messages.length,
      length: this.data.length
    }).then(res => {
      let arr = res.chatting.map(item => {
        return this.processMsg(item)
      });
      let divider = 'load' + Date.now();
      this.data.messages[0].divider = divider;
      let newMsg = arr.reverse().concat(this.data.messages);
      let imgAndMsg = this.resetImageArray(newMsg);
      this.setData({
        ...imgAndMsg,
        start: this.data.start + this.data.length,
        hasMore: arr.length === this.data.length,
        isLoading: false,
        scrollTo: divider
      }, () => {
        wx.hideNavigationBarLoading();
      });
    }, err => {
      console.log(err)
    })
  },
  bindKeyInput: function (e) {
    this.setData({
      inputValue: e.detail.value
    })
  },
  sendImg: function () {
    wx.chooseImage({
      count: 1,
      success: (res) => {
        wx.uploadFile({
          url: requestUrl + '/app/chat/media',
          filePath: res.tempFilePaths[0],
          name: 'file',
          header: { token: wx.getStorageSync('token') },
          formData: {
            'orderuuid': this.data.orderuuid
          },
          success: (res) => {
            if (res.statusCode === 200) {
              var data = JSON.parse(res.data)
              this.sendMsg({ cmd: 'pic', url: data.data.path[0] })
            } else {
              wx.showModal({
                content: res.data,
                showCancel: false
              })
            }
          },
          complete: function () {
            wx.hideLoading();
          },
          fail: function (res) {
            console.log(res)
            wx.showModal({
              content: res.errMsg,
              showCancel: false
            });
          }
        })
      },
    }); 
  },
  sendBtn: function () {
    if (!this.data.inputValue) return;
    this.sendMsg({ cmd: 'text', text: this.data.inputValue });
    this.setData({
      inputValue: '',
      scrollTo: 'bottom'
    });
  },
  sendMsg: function (chat) {
    if (!chat || !chat.cmd) {
      console.error('消息格式不正确');
      return;
    }
    http('/app/chat', {
      chat: JSON.stringify(chat),
      orderuuid: this.data.orderuuid,
      useruuid: this.data.targetuuid
    }, 'put').then(res => {
      let msg = this.processMsg(res.content);
      let newMsg = [...this.data.messages, msg];
      let imgAndMsg = this.resetImageArray(newMsg);
      this.setData({ ...imgAndMsg }, () => this.setData({ scrollTo: 'bottom' }));
    });
    },
  getMsg: function () {
    wx.showNavigationBarLoading()
    http('/app/chat/list', {
      orderuuid: this.data.orderuuid,
      useruuid: this.data.targetuuid,
      start: 0,
      length: 10
    }).then(res => {
      let arr = res.chatting.map(item => {
        return this.processMsg(item)
      })
      arr.reverse();
      let imgAndMsg = this.resetImageArray(arr)
      this.setData({ ...imgAndMsg }, () => this.setData({ scrollTo: 'bottom' }));
      wx.hideNavigationBarLoading();
      if (this.data.state === 'on') unreadItv = setInterval(this.getUnread, 2000);
      if (this.data.state === 'false') unreadItv = setInterval(this.getUnread, 2000);
    }, err => {
      console.log(err)
      });
  },
  processMsg: function (msg) {
    msg.url = getImgAddress(msg.url);
    msg.timeStr = getChatTime(msg.time);
    if (msg.chat.cmd === 'pic') {
      msg.chat.url = getImgAddress(msg.chat.url);
    }
    return msg;
  },
  imgLoad: function (e) {
    var originWidth = e.detail.width * px2rpx,
      originHeight = e.detail.height * px2rpx;
    var maxWidth = 300, maxHeight = 300;
    var calWidth, calHeight;
    // 限制图片宽度
    if (originWidth >= maxWidth) {
      calWidth = maxWidth;
      calHeight = (maxWidth * originHeight) / originWidth;
    } else {
      calWidth = originWidth;
      calHeight = originHeight;
    }

    // 限制图片高度
    if (calHeight >= maxHeight) {
      calWidth = (calWidth / calHeight) * maxHeight;
      calHeight = maxHeight;
    }

    var image = this.data.imageSize;
    image[e.target.dataset.index] = {
      width: calWidth,
      height: calHeight
    }
    this.setData({
      imageSize: image
    })
  },
  previewImage: function (e) {
    wx.previewImage({
      current: this.data.images[e.currentTarget.dataset.index],
      urls: this.data.images
    })
  },
  getUnread: function () {
    http('/app/chat/newlist', {
      orderuuid: this.data.orderuuid,
      useruuid: this.data.targetuuid,
    }).then(res => {
      if (res.array.length === 0) return;
      let arr = res.array.map(item => {
        return this.processMsg(item)
      })
      let newMsg = [...this.data.messages, ...arr.reverse()];
      let imgAndMsg = this.resetImageArray(newMsg);
      // let restaurant = this.data.restaurant
      this.setData({ ...imgAndMsg }, () => this.setData({ scrollTo: 'bottom' }));
    })
  },
  //重新获取所有图片并调整图片的下标
  resetImageArray(newMsg) {
    var tempArr = [];
    newMsg.map(msg => {
      if (msg.chat.cmd === 'pic') {
        msg.index = tempArr.length;
        tempArr.push(msg.chat.url);
      }
      return msg;
    });
    return { images: tempArr, messages: newMsg };
  },
})