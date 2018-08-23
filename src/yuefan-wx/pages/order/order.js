import { http, imageUrl, getImgAddress, formatDate, setParams, throttle } from '../../utils/util.js'
Page({
  data: {
    start: 0,
    length: 10,
    orderArr: [],
    isLoading: false,
    hasMore: true,
    listType: "all",
    showFilter: false
  },
  onShow: function (options) {
    wx.showShareMenu({
      withShareTicket: true
    })
    this.getOrder(true);
  },
  onPullDownRefresh: function () {
    this.getOrder(true);
  },
  showFilter: function () {
    this.setData({ showFilter: !this.data.showFilter })
    console.log(this.data.showFilter)
  },
  setFilter: function (e) {
    let { type } = e.currentTarget.dataset;
    this.setData({ showFilter: !this.data.showFilter })
    type && this.setData({ listType: type });
    this.getOrder(true);
  },
  getOrder: function (refresh) {
    if (refresh) {
      this.setData({ start: 0, isLoading: true, hasMore: true, orderArr: [] }, () => this.getOrderRequest(refresh));
    } else {
      if (!this.data.hasMore || this.data.isLoading) return;
      this.setData({ isLoading: true, hasMore: true }, () => this.getOrderRequest(refresh));
    }
  },
  getOrderRequest: function (refresh) {
    wx.showNavigationBarLoading()
    http('/app/order/byuser', { start: this.data.start, length: this.data.length, type: this.data.listType }).then(
      res => {
        wx.stopPullDownRefresh()
        wx.hideNavigationBarLoading()
        let arr = res.order.map(item => {
          item.avatar1 = getImgAddress(item.avatar1);
          item.avatar2 = getImgAddress(item.avatar2);
          // item.time = item.starttime ? formatDate(item.starttime[0], 'yyyy-MM-dd hh:mm~') + formatDate(item.starttime[1], 'hh:mm') : '';
          item.time = item.starttime ? formatDate(item.starttime[0], 'yyyy-MM-dd hh:mm') : '';
          return item;
        })
        this.setData({
          orderArr: refresh ? arr : this.data.orderArr.concat(arr),
          start: this.data.start + this.data.length,
          hasMore: arr.length === this.data.length,
          isLoading: false
        })
      },
      err => {
        wx.stopPullDownRefresh()
        wx.hideNavigationBarLoading()
        this.setData({ isLoading: false });
        wx.showModal({
          content: err,
          showCancel: false
        });
      }
    )
  },
  onReachBottom: function () {
    this.getOrder();
  },
  inviteNearby: function (e) {

  },
  deelOrder: function (e) {
    let that = this;
    throttle(that.doDeelOrder(e));
  },
  doDeelOrder: function (e) {
    wx.showLoading({
      title: '提交中',
      mask: true
    })
    let data = e.currentTarget.dataset;
    let orderArr = this.data.orderArr;
    http('/app/order/deelorder', {
      orderuuid: orderArr[data.index].uuid,
      deel: data.result
    }, 'post').then(res => {
      wx.hideLoading();
      orderArr[data.index].commenttype = data.result;
      this.setData({ orderArr: orderArr })
      this.getOrder(true);
    }, err => {
      wx.showLoading({
        title: err,
        mask: true
      })
      let timer = setTimeout(function () {
        wx.hideLoading();
        clearTimeout(timer);
      }, 2000)
    })
  },
  goToOrderDetail: function (e) {
    let order = this.data.orderArr[e.currentTarget.dataset.index]
    wx.navigateTo({
      url: setParams('../order-detail/order-detail', { uuid: order.uuid })
    })
  },
})