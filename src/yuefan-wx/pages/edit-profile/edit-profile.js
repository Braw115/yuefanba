import { formatDate, http, formatUserInfo, requestUrl, imageUrl, getImgAddress } from '../../utils/util.js'
Page({
  data: {
    avatar: '',
    personality: [],
    album: [],
    attestvideo: '',
    formatedDate: '',
    date: '2000-01',
    hIndex: 160 - 80,
    heightArr: Array.apply(null, { length: 141 }).map((v, i) => i + 80),
    today: formatDate(Date.now(), 'yyyy-MM-dd')
  },
  onLoad: function () {
    http('/appusers/').then(res => {
      let userInfo = formatUserInfo(res);
      let { album, avatar, attestvideo, birthday, height, personality } = userInfo;
      personality = personality && personality.filter((val,index)=> val!==null) 
      album = album && album.filter((val, index) => val !== null) 
      this.setData({
        album,
        attestvideo,
        avatar,
        personality,
        hIndex: height - 80,
        date: formatDate(Number(birthday), 'yyyy-MM'),
        formatedDate: formatDate(Number(birthday), 'yyyy年MM月')
      })
    })
  },
  onUnload: function () {
    getApp().globalData.mineInfo = null
  },
  onReady: function () {
    this.videoContext = wx.createVideoContext('myVideo');
  },
uploadVideo: function () {
    var that = this;
    wx.chooseVideo({
      sourceType: ['album', 'camera'],
      maxDuration: 60,
      camera: 'back',
      success: function (res) {
        var tempFilePaths = res.tempFilePath; //thumbTempFilePath
        console.log(tempFilePaths)
        wx.showLoading({
          title: '上传中',
          mask: true
        })
        const uploadTask = wx.uploadFile({
          url: requestUrl + '/appusers/media',
          filePath: tempFilePaths,
          name: 'file',
          header: { token: wx.getStorageSync('token') },
          formData: {
            'uploadfield': 'attestvideo'
          },
          success: function (res) {
            var data = JSON.parse(res.data);
            that.setData({ attestvideo: getImgAddress(data.data.path) })
          },
          complete: function () {
            wx.hideLoading();
          },
          fail: function (res) {
            wx.showModal({
              content: res.errMsg,
              showCancel: false
            });
          }
        })
      }
    })
  },
  uploadImage: function (e) {
    let imgType = e.currentTarget.dataset.type;
    console.log('imgType:',imgType);
    let sizeType = ['compressed'];
    imgType !== 'avatar' && sizeType.unshift('original');
    let that = this, imgLength;
    
    if (imgType === 'avatar') {//头像 一张
      imgLength = 1
    }
    if (imgType === 'personality') {//个人形象 限制5张
      if (this.data.personality) {
        imgLength = 5 - this.data.personality.length
      }else{
        imgLength = 5;
      }
    }
    if (imgType === 'album') {//相册 限制9张
      if (this.data.album) {
        imgLength = 9 - this.data.album.length
      } else {
        imgLength = 9;
      }
    }
    wx.chooseImage({
      count: imgLength,
      sizeType: sizeType,
      sourceType: ['album', 'camera'],
      success: function (res) {
        var tempFilePaths = res.tempFilePaths
      console.log(tempFilePaths);
        wx.showLoading({
          title: '上传中',
          mask: true
        })

        that.doUploadimgs(tempFilePaths, imgType);
        
      }
    })
  },
  doUploadimgs: function (data, imgType) {
    var that = this,
    i = data.i ? data.i : 0,//当前上传的哪张图片
    success = data.success ? data.success : 0,//上传成功的个数
    fail = data.fail ? data.fail : 0;//上传失败的个数
    wx.uploadFile({
      url: requestUrl + '/appusers/media',
      filePath: data[i],
      name: 'file',//这里根据自己的实际情况改
      formData: {
        'uploadfield': imgType
      },//这里是上传图片时一起上传的数据
      header: { token: wx.getStorageSync('token') },
      success: (resp) => {
        success++;//图片上传成功，图片上传成功的变量+1
        console.log(i);
        var data = JSON.parse(resp.data)
        if (resp.statusCode === 200) {
          if (imgType === 'avatar') {
            that.setData({ avatar: getImgAddress(data.data.path) })
          }
          if (imgType === 'personality') {
            let temp = data.data.path.map(item => getImgAddress(item))
            that.setData({ personality: temp })
          }
          if (imgType === 'album') {
            let temp = data.data.path.map(item => getImgAddress(item))
            that.setData({ album: temp })
          }
        } else {
          wx.showModal({
            content: data.error,
            showCancel: false
          })
        }

        //这里可能有BUG，失败也会执行这里,所以这里应该是后台返回过来的状态码为成功时，这里的success才+1
      },
      fail: (res) => {
        fail++;//图片上传失败，图片上传失败的变量+1
        console.log('fail:' + i + "fail:" + fail);
        wx.showModal({
          content: res.errMsg,
          showCancel: false
        });
      },
      complete: () => {
        i++;//这个图片执行完上传后，开始上传下一张
        if (i == data.length) {   //当图片传完时，停止调用          
          console.log('执行完毕');
          console.log('成功：' + success + " 失败：" + fail);
          wx.hideLoading();
        } else {//若图片还没有传完，则继续调用函数
          console.log(i);
          data.i = i;
          data.success = success;
          data.fail = fail;
          that.doUploadimgs(data, imgType);
        }
      }
    });
  },
  deleteImgage: function (e) {
    let { type: imgType, index } = e.currentTarget.dataset;
    if (imgType === 'personality') {
      let imgArr = this.data.personality;
      http('/appusers/media', { url: imgArr[index].replace(imageUrl, ''), delfield: imgType }, 'delete').then(() => {
        imgArr.splice(index, 1)
        this.setData({ personality: imgArr })
      }, err => {
        wx.showModal({
          content: err,
          showCancel: false
        })
      })
    } else {
      let imgArr = this.data.album;
      http('/appusers/media', { url: imgArr[index].replace(imageUrl, ''), delfield: imgType }, 'delete').then(() => {
        imgArr.splice(index,1)
        this.setData({ album: imgArr })
      }, err => {
        wx.showModal({
          content: err,
          showCancel: false
        })
      })
    }
  },
  bindDateChange: function (e) {
    this.updateInfo('birthday', new Date(e.detail.value).getTime());
    console.log(new Date(e.detail.value).getTime())
    this.setData({
      date: e.detail.value,
      formatedDate: formatDate(e.detail.value, 'yyyy年MM月dd日')
    })
  },
  bindHeightChange: function (e) {
    this.updateInfo('height', this.data.heightArr[e.detail.value]);
    this.setData({
      hIndex: e.detail.value
    })
  },
  playVideo: function () {
    console.log('full')
    this.videoContext.requestFullScreen();
    this.videoContext.play();
  },
  preview: function (e) {
    let { type: imgType, index } = e.currentTarget.dataset;
    let prevArr = imgType === 'personality' ? this.data.personality : this.data.album;
    wx.previewImage({
      urls: prevArr,
      current: prevArr[index]
    })
  },
  updateInfo: function (key, value) {
    http('/appusers/updatebaseinfo', { key: key, value }, 'post').then(res => {
      console.log('update success')
    }, err => {
      wx.showModal({
        content: err,
        showCancel: false
      })
    })
  }
})