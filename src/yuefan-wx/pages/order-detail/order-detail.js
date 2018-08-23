import { http, imageUrl, getImgAddress, setParams, formatDate } from '../../utils/util.js'
Page({
  data: {
    rank: 0,
    editRank: false,
    editComplaint: false,
    comment: '',
    complaint: '',
    limit: 60,
    cursor: 0
  },
  onLoad: function (option) {
    wx.showShareMenu({
      withShareTicket: true
    })
    http('/app/order/' + option.uuid).then(res => {
      res.avatar1 = getImgAddress(res.avatar1);
      res.avatar2 = getImgAddress(res.avatar2);
      // res.time = res.starttime ? formatDate(res.starttime[0], 'yyyy-MM-dd hh:mm~') + formatDate(res.starttime[1], 'hh:mm') : '';
      res.time = res.starttime ? formatDate(res.starttime[0], 'yyyy 年 MM 月 dd 日  hh: mm') : '';
      this.setData({
        detailData: res,
        rank: res.level || 0
      })
    })
  },
  ranking: function (e) {
    if (!this.data.editRank) return;
    this.setData({ rank: e.currentTarget.dataset.rank })
    console.log(this.setData)
  },

  editComment: function () {
    this.setData({ editRank: true })
  },
  saveComment: function () {
    let { rank, comment, detailData } = this.data;
    console.log('rank:', rank)
    console.log('comment:', comment)
    if (!comment) {
      wx.showModal({
        content: '请填写评价内容',
        showCancel: false,
      })
      return;
    }
    if (rank === 0) {
      wx.showModal({
        content: '请给对方评星',
        showCancel: false,
      })
      return;
    }
    http('/appcomments/add', {
      orderuuid: detailData.uuid,
      content: comment,
      level: rank
    }, 'post').then(res => {
      detailData.commentcontent = comment;
      detailData.level = rank;
      wx.showToast({
        title: '已提交',
      })
      this.setData({ detailData, editRank: false, level: rank })
    })
  },
  editCplt: function () {
    this.setData({ editComplaint: !this.data.editComplaint })
  },

  saveCplt: function () {
    let { complaint, detailData } = this.data;
    console.log('complaint:', complaint)
    console.log('detailData:', detailData)
    if(!complaint)
    {
      wx:wx.showModal({
        content: '请填写申诉',
        showCancel: false,
       })
    }
    http('/app/appeal/add', {
      orderuuid: detailData.uuid,
      content: complaint,
    }, 'post').then(res => {
      detailData.appealcontent = complaint;
      wx.showToast({
        title: '已提交',
      })
      this.setData({ detailData, editComplaint: false })
    })
  },
  commentInput: function (e) {
    this.setData({ comment: e.detail.value, cursor: e.detail.cursor });
  },
  complaintInput: function (e) {
    this.setData({ complaint: e.detail.value });
  },
  goToChat: function (e) {
    let { uuid, useruuid1, useruuid2, noticeuuid, nickname1} = this.data.detailData
    console.log('this.data.detailData', this.data.detailData)
    wx.navigateTo({
      url: setParams('../chat/chat', { noticeuuid, orderuuid: uuid, useruuid1, useruuid2, nickname: nickname1,state:this.data.detailData.state}),
    })
  },
  goToindex:function(){
    wx.reLaunch({
      url:'../index/index'
    })
  }
})