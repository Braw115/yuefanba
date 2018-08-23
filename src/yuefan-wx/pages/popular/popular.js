import { http, calcAge, imageUrl, getImgAddress, setParams } from '../../utils/util.js'
Page({
  data: {
    start: 0,
    length: 10,
    hotArr: [],
    isLoading: false,
    hasMore: true
  },
  onLoad: function (options) {
    this.getHot(true);
  },
  getHot: function (refresh) {
    if (refresh) {
      this.setData({ start: 0, isLoading: true, hasMore: true, hotArr: [] }, () => this.getHotRequest(refresh));
    } else {
      if (!this.data.hasMore || this.data.isLoading) return;
      this.setData({ isLoading: true, hasMore: true }, () => this.getHotRequest(refresh));
    }
  },
  getHotRequest: function (refresh) {
    http('/appusers/hot', { start: this.data.start, length: this.data.length }).then(
      res => {
        let arr = res.row.map(item => {
          item.avatar = getImgAddress(item.avatar);
          item.age = calcAge(Number(item.birthday))
          return item;
        })
        this.setData({
          hotArr: refresh ? arr : this.data.hotArr.concat(arr),
          start: this.data.start + this.data.length,
          hasMore: arr.length === this.data.length,
          isLoading: false
        })
        wx.stopPullDownRefresh()
        wx.hideNavigationBarLoading()
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
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.getHot(true);
  },
  onReachBottom: function () {
    this.getHot();
  },
  navToProfile: function (e) {
    let index = e.currentTarget.dataset.index;
    wx.navigateTo({
      url: setParams('../profile/profile', { uuid: this.data.hotArr[index].useruuid }),
    })
  },
  invite: function (e) {
    let index = e.currentTarget.dataset.index;
    let hotUser = this.data.hotArr[index]
    this.setData({ hotUser: hotUser })
    this.getMine();
  },
  getMine: function () {
    http('/app/deed/my', { type: 'spend', start: 0, length: 1 }).then(res => {
      let latest = res.deedslist[0];
      if (latest && !latest.state) {
        //存在有效契约单
        this.setData({ myContract: latest });
      }
      console.log('ss', this.data.hotUser)
      let age = this.data.hotUser.age;
      let avatar = getImgAddress(this.data.hotUser.avatar);
      let gender = this.data.hotUser.gender;
      let nickname = this.data.hotUser.nickname;
    // wx.setStorageSync('hotUserData', this.data.hotUser);
      wx.navigateTo({
        url: setParams('../contract/contract?type=spend&back=true',{
          age,avatar,gender,nickname
         })
      })
    })
  }
})