import { http, formatDate } from '../../utils/util.js'
Page({
  data: {
    uuid:'',
    orderuuid:''
  },
   /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let  uuid  = options.id;
    let orderuuid = options.orderuuid
    this.setData({ id:options.id});
    this.getbilldatail()
  },
  getbilldatail: function () {
    let uuid = this.data.id;
    http("/apppaylog/" + uuid).then(
      res => {
        // let tempArr = res.map(item => { return item })
        // tempArr = [...this.data.billArr, ...tempArr];
        // this.setData({ billArr: tempArr, start: this.data.start + this.data.length, hasMore: res.length === this.data.length, isLoading: false });
       let billArr = res.map(item=>{
       let coin=item.coin;
       let created=item.created;
       let address = item.address;
       let description = item.description;
       let location = item.location;
       let billtype = item.type;
       let nickname=item.nickname;
       let user1 = item.user1;
       let user2 = item.user2;
       let orderuuid = item.orderuuid;
       let payway=item.payway;
       this.setData({ coin, created, address, description, location, billtype, nickname, user2, user1, orderuuid, payway, billArr})
        })
      }, console.log('苹果', this.data.billArr),
      console.log('苹果', this.data.nickname)
     
    )
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})