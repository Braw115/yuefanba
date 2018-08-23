import { formatDate, http, calcAge, imageUrl, getImgAddress, setParams } from '../../utils/util.js'
let app = getApp();
Page({
  data: {
    imageUrl: imageUrl,
    x: 0,//移动坐标x
    y: 0,//移动坐标y
    initX: 0,//初始坐标x
    initY: 0,//初始坐标y
    ready: false,
    isMoving: false,
    startX: 0,//开始移动坐标x
    startY: 0,//开始移动坐标y
    viewWidth: 664,//滑块宽度,用于计算滑动终点
    viewHeight: 830,//滑块高度,用于计算滑动终点
    current: 0,//当前下标
    matchArr: [],//匹配数组
    likeArr: [],
    like: false,
    dislike: false,
    toDetail: true,
    start: 0,
    length: 10,
    hasMore: true,
    myContract: {} //自己的契约单
  },
  onLoad: function () {
    let { windowWidth, windowHeight, px2rpx } = getApp().globalData;
    let ratio = windowHeight / windowWidth;
    let initX = windowWidth + 42 / px2rpx, initY = windowHeight + 30 / px2rpx;
    this.setData({ x: initX, initX: initX, y: initY, initY: initY, ready: true, windowWidth, windowHeight, px2rpx, ratio })
    this.getMine();
  },
  touchstart: function (e) {
    console.log(e)
    let { pageX, pageY, identifier } = e.changedTouches[0];
    //只记录第一个触摸点
    if (!this.data.isMoving) {
      this.setData({ startX: pageX, startY: pageY, touchid: identifier, isMoving: true });
    }
  },
  touchmove: function (e) {
    this.data.toDetail && this.setData({ toDetail: false });
  },
  touchend: function (e) {
    if (this.data.toDetail) {
      wx.navigateTo({
        url: setParams('../profile/profile', {
          uuid: this.data.matchArr[this.data.current].uuid,
        }),
      })
      return;
    }
    this.setData({ toDetail: true });
    let { pageX, pageY, identifier } = e.changedTouches[0];
    //触摸点对应不上，忽略
    if (identifier !== this.data.touchid) return;
    let moveX = (pageX - this.data.startX) || -1;//水平偏移量,刚好为0时设为向左
    let moveY = pageY - this.data.startY;//垂直偏移量
    let moveRatio = moveY / moveX;
    let endX, endY;
    //垂直方向偏移比高，可到达垂直方向尽头
    if (Math.abs(moveRatio) >= this.data.ratio) {
      endY = moveY < 0 ? 0 : this.data.windowHeight * 3 - this.data.viewHeight / this.data.px2rpx;
      endX = (endY - this.data.y) / moveRatio + this.data.x;
    }
    //水平方向偏移比高，可到达水平方向尽头
    else {
      endX = moveX < 0 ? 0 : this.data.windowWidth * 3 - this.data.viewWidth / this.data.px2rpx;
      endY = (endX - this.data.x) * moveRatio + this.data.y
    }
    moveX > 0 && this.data.likeArr.push(this.data.matchArr[this.data.current]);
    if (moveX > 0) {
      //约
      this.invite(this.data.matchArr[this.data.current])
    }
    //第6张时加载更多
    if (this.data.current % 10 === 5) {
      this.getContract();
    }
    this.setData({ x: endX, y: endY, dislike: moveX < 0, like: moveX > 0, likeArr: this.data.likeArr })
    setTimeout(() => this.setData({ isMoving: false, current: ++this.data.current, x: this.data.initX, y: this.data.initY, like: false, dislike: false }), 200)
  },
  btnTap: function (e) {
    if (!this.data.matchArr[this.data.current] || this.data.isMoving) return;
    //第6张时加载更多
    if (this.data.current % 10 === 5) {
      this.getContract();
    }
    let isLike = e.currentTarget.dataset.type === 'like';
    let endX = !isLike ? 0 : this.data.windowWidth * 3 - this.data.viewWidth / this.data.px2rpx;
    let endY = this.data.initY + 300 / this.data.px2rpx;
    this.setData({ isMoving: true });
    //like and 约
    if (isLike) {
      isLike && this.invite(this.data.matchArr[this.data.current]);
      this.data.likeArr.push(this.data.matchArr[this.data.current]);
    }
    this.setData({ x: endX, y: endY, dislike: !isLike, like: isLike, likeArr: this.data.likeArr });
    setTimeout(() => this.setData({ isMoving: false, current: ++this.data.current, x: this.data.initX, y: this.data.initY, like: false, dislike: false }), 200);
  },
  getMine: function () {
    http('/app/deed/my', { type: 'spend', start: 0, length: 1 }).then(res => {
      let latest = res.deedslist[0];
      if (latest && !latest.state) {
        //存在有效契约单
        this.setData({ myContract: latest }, () => {
          this.getContract();
          this.getInvited();
        })
      }
    })
  },
  getContract: function () {
    http('/app/deed', {
      type: 'make',
      deeduuid: this.data.myContract.uuid,
      start: this.data.start,
      length: this.data.length
    }, 'get').then((res) => {
      res.deedlist.map(item => {
        item.age = calcAge(Number(item.birthday));
        item.avatar = getImgAddress(item.avatar);
        item.personality && item.personality[0] ? item.personality[0] = getImgAddress(item.personality[0]) : '';
        return item;
      })
      this.setData({
        start: this.data.start + this.data.length,
        hasMore: res.length === this.data.length,
        matchArr: [...this.data.matchArr, ...res.deedlist]
      })
    }, err => {

    })
  },
  getInvited: function () {
    http('/app/notice/myinvited', {
      deeduuid: this.data.myContract.uuid
    }, 'get').then((res) => {
      console.log(res);
      res.deeds.map(item => {
        item.age = calcAge(Number(item.birthday));
        item.avatar = getImgAddress(item.avatar);
        return item;
      })
      this.setData({
        likeArr: [...this.data.likeArr, ...res.deeds]
      })
    }, err => {

    })
  },
  invite: function (target) {
    http('/app/notice/spend', {
      fromdeeduuid: this.data.myContract.uuid,
      todeeduuid: target.deeduuid,
      useruuid: target.uuid
    }, 'post').then(res => { console.log })
  }
})