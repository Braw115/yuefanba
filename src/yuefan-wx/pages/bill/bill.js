import { http, setParams } from '../../utils/util.js'
Page({
  data: {
    start: 0,
    length: 10,
    billArr: [],
    hasMore: true,
    isLoading: false,
    orderuuid:''
  },
  onLoad: function (options) {
    this.searchBill(true);
  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.searchBill(true);
  },
  onReachBottom: function (e) {
    this.searchBill();
  },
  searchBill: function (refresh) {
    if (refresh) {
      this.setData({ start: 0, isLoading: true, hasMore: true, billArr: [] }, () => this.getDataList(refresh));
    } else {
      if (this.data.isLoading || !this.data.hasMore) return;
      this.setData({ isLoading: true, hasMore: true }, () => this.getDataList(refresh));
    }
  },
  gotobilldetail: function (e) {
    let billArr = this.data.billArr[e.currentTarget.dataset.index];
    let id = billArr.id;
    wx.navigateTo({
      url: setParams('../bill-detail/bill-detail', { id: billArr.id, orderuuid: this.data.orderuuid})
    })
  },

  getDataList: function (refresh) {
    http('/apppaylog/payloglist', {
      start: this.data.start,
      length: this.data.length,
    }).then(
      res => {
        let tempArr = res.map(item => { return item })
        tempArr = [...this.data.billArr, ...tempArr];
        this.setData({ orderuuid: this.data.orderuuid })
        this.setData({ billArr: tempArr, start: this.data.start + this.data.length, hasMore: res.length === this.data.length, isLoading: false });
        wx.stopPullDownRefresh()
        wx.hideNavigationBarLoading()
      }, err => {
        wx.stopPullDownRefresh()
        wx.hideNavigationBarLoading()
        this.setData({ isLoading: false });
        wx.showModal({
          content: err,
          showCancel: false
        });
      })
  }
})