Page({
  data: {
    mineInfo: null
  },
  onLoad: function() {
    // getApp().getMineInfo((mineInfo) => {
    //   this.setData({ mineInfo })
    // }, true)
    getApp().getMineInfo(res => {
      this.setData({
        res
      })
    });
  },
});