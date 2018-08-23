import { http, getImgAddress, calcAge } from '../../utils/util.js'
Page({
  data: {
    selectMode: false,
    favArr: [],
    start: 0,
    length: 1,
    isLoading: false,
    hasMore: true
  },
  onLoad: function (options) {
    this.getFav(true);
  },
  getFav: function (refresh) {
    if (refresh) {
      this.setData({ start: 0, isLoading: true, hasMore: true, favArr: [] }, () => this.getFavRequest(refresh));
    } else {
      if (!this.data.hasMore || this.data.isLoading) return;
      this.setData({ isLoading: true, hasMore: true }, () => this.getFavRequest(refresh));
    }
  },
  getFavRequest: function (refresh) {
    http('/appusers/likelylist', { start: this.data.start, length: this.data.length }).then(
      res => {
        let arr = res.favoriteList.map(item => {
          item.avatar = getImgAddress(item.avatar);
          item.age = calcAge(item.birthday)
          return item;
        })
        this.setData({
          favArr: refresh ? arr : this.data.favArr.concat(arr),
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
  onReachBottom: function () {
    this.getFav();
  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.getFav(true);
  },
  navToProfile: function (e) {
    let index = e.currentTarget.dataset.index;
    wx.navigateTo({
      url: setParams('../profile/profile', { uuid: this.data.favArr[index].uuid }),
    })
  },
  invite: function (e) {
    let index = e.currentTarget.dataset.index;
    let uuid = this.data.favArr[index].uuid
    this.setData({ uuid: uuid })
    this.getMine();
  },
  getMine: function () {
    http('/app/deed/my', { type: 'spend', start: 0, length: 1 }).then(res => {
      let latest = res.deedslist[0];
      if (latest && !latest.state) {
        //存在有效契约单
        this.setData({ myContract: latest });
      }

      if (this.data.myContract) {
        //存在有效花钱契约单
        http('/app/notice/invite', {
          mydeeduuid: this.data.myContract.uuid,
          useruuid: this.data.uuid,
        }, 'post').then(res => {
          wx.showToast({
            title: '邀请已发送'
          })
        })
      } else {
        //去创建花钱契约单
        wx.navigateTo({
          url: '../contract/contract?type=spend&back=true',
        })
      }
    })
  },


  // getFav: function () {
  //   http('/appusers/likelylist').then(res => {
  //     let favArr = res.favoriteList.map(item => {
  //       item.avatar = getImgAddress(item.avatar);
  //       item.age = calcAge(item.birthday)
  //       return item;
  //     })
  //     this.setData({ favArr: favArr })
  //   })
  // },
  toggleMode: function () {
    this.setData({ selectMode: !this.data.selectMode });
  },
  selectAll: function () {
    let arr = this.data.favArr.map(item => {
      item.selected = true
      return item;
    })
    this.setData({ favArr: arr })
  },
  itemTap: function (e) {
    let index = e.currentTarget.dataset.index;
    if (this.data.selectMode) {
      this.data.favArr[index].selected = !this.data.favArr[index].selected;
      this.setData({ favArr: this.data.favArr })
    } else {
      wx.navigateTo({
        url: '../profile/profile?uuid=' + this.data.favArr[index].uuid,
      })
    }
  },
  unfav: function (e) {
    let unFavArr = []
    let leftArr = this.data.favArr.filter(item => {
      if (item.selected) {
        unFavArr.push(item.uuid)
      }
      return item.selected === false;
    })
    http('/appusers/addordellikely', {
      action: false,
      uuidarr: unFavArr
    }, 'post').then(res => this.setData({ favArr: leftArr }))
  }
})