import { http, formatDate } from '../../utils/util.js'
// pages/deed/deed.js
function afterTime(beforeTime) {
  var endTime = new Date(beforeTime);
  var endhour = endTime.getHours() < 10 ? "0" + endTime.getHours() : endTime.getHours();
  var endminute = endTime.getMinutes() < 10 ? "0" + endTime.getMinutes() : endTime.getMinutes();
  var endsecond = endTime.getSeconds() < 10 ? "0" + endTime.getSeconds() : endTime.getSeconds();
  var endDate = endTime.getFullYear() + '-' + lessThan10(endTime.getMonth() + 1) + '-' + lessThan10(endTime.getDate());
  var endTimer = endhour + ':' + endminute;
  return endDate + " " + endTimer
}

function lessThan10(num) {
  var str
  if (num < 10) { str = '0' + num } else { str = num }
  return str;
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    deedArr:[]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    http('/app/deed/my', {}).then(
      res => {
        let list = res.deedslist;
        list.map(item => { 
          item.mealtime[0] = afterTime(Number(item.mealtime[0])) ;
          item.mealtime[1] = formatDate(afterTime(Number(item.mealtime[1])),'hh:mm') ;
        })
          this.setData({
          deedArr: list,
         
        })
        console.log('res', list)
      },
      err => {
        wx.showModal({
          content: err,
          showCancel: false
        });
      }
    )
  },
  cancelDeed: function(e){
    let { uuid } = e.currentTarget.dataset;
    console.log(uuid),
      http('/app/deed/' + uuid ,'', 'delete').then(
      res => {
        console.log('res', res)
        this.onLoad()
      },
      err => {
        wx.showModal({
          content: err,
          showCancel: false
        });
      }
    )
  }
})