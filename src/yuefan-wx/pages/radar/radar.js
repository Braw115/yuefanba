import {
  http,
  calcAge,
  formatDate,
  getImgAddress,
  setParams,
  ageToBirth
} from '../../utils/util.js'
const app = getApp();
Page({
  data: {
    scan: false,
    avatar: '',
    myNearby: null,
    nearbyArr: [],
    inviteArr: [],
    start: 0,
    length: 6,
    hasMore: true,
    isLoading: false,
    useruuid:'',
   },
  onLoad: function(options) {
    console.log('options',options)
    this.setData({
      // agerange: JSON.parse(options.agerange)
      agerange: options.agerange

    })
    app.getMineInfo(res => {
      this.setData({
        avatar: getImgAddress(res.avatar),
        gender:res.gender,
        // birthday: formatDate(res.birthday,'yyy')
      })
    }); 
  },
  onShow() {
    // setTimeout(this.scanStart, 6500)
    if (!this.data.myNearby) {
      this.getMine();
    }
  },
  onUnload() {
    wx.switchTab({
      url:'../index/index'
    })
   },
  getInvite: function() {
    http('/app/notice/nearbyinvite', {
      deeduuid: this.data.myNearby.uuid
    }).then(res => {
      res.deeds.map(item => {
        item.avatar = getImgAddress(item.avatar)
      })
      this.setData({
        inviteArr: res.deeds
      })
    }),console.log(this.data.inviteArr)
  },
  getAgeStr: function(range, when) {
    let ageStr = ''
    if (range[0] instanceof Array) {
      ageStr = range.map(val => this.getAgeStr(val, when)).join(', ')
    } else {
      let maxAge = calcAge(range[0], when);
      let minAge = calcAge(range[1], when);
      if (maxAge === 200) {
        if (minAge === 0) {
          ageStr = '不限'
        } else {
          ageStr = minAge + '以上'
        }
      } else if (minAge === 0) {
        ageStr = maxAge + '以下'
      } else {
        ageStr = minAge + '~' + maxAge;
      }
    }
    return ageStr
  },
  getMine: function() {
    http('/app/deed/my', {
      type: 'nearby',
      start: 0,
      length: 1
    }).then(res => {
      let latest = res.deedslist[0];
      if (latest && !latest.state) {
        //存在有效契约单
        // let timeStr = formatDate(Number(latest.mealtime[0]), 'yyyy-MM-dd hh:mm~') + formatDate(Number(latest.mealtime[1]), 'hh:mm');
        let timeStr = formatDate(Number(latest.mealtime[0]), 'yyyy-MM-dd hh:mm');
        let ageStr = this.getAgeStr(JSON.parse(latest.agerange), latest.created)
        this.setData({
          myNearby: latest,
          timeStr,
          agerange: latest.agerange,
          ageStr
        }, () => {
          this.scanStart();
          this.getInvite();
        })
      } else {
        let ageStr = [
          [ageToBirth(200), ageToBirth(18)]
        ]
        // let ageStr = this.getAgeStr(JSON.parse(latest.agerange), latest.created)
        let orderby = "distance"
        this.setData({
          orderby,
          ageStr
        }, () => {
          this.scanStart();
        })

      }
      //else {
      //   wx.navigateTo({
      //     url: '../contract/contract?type=nearby&back=true',
      //   })
      // }
    })
  },
  scanStart: function() {
    if (this.data.scan) return;
    setTimeout(this.scanStart, 6001)
    setTimeout(this.getNearby, 100)

  },
  clearPosition: function() {
    http('/app/deed/clearlocation', {
      deeduuid: this.data.myNearby.uuid
    }, 'post').then(
      res => {
        wx.showToast({
          title: '已清除'
        })
      },
      err => {
        // wx.showModal({
        //   content: err,
        // })
        wx.showToast({
          title: '已清除'
        })
      }
    )
  },
  getNearby: function() {
    //没数据时重头开始
    if (!this.data.hasMore) {
      this.setData({
        start: 0,
        isLoading: true,
        hasMore: true,
        nearbyArr: []
      }, () => this.getNearbyRequest(true));
    } else {
      if (this.data.isLoading) return;
      this.setData({
        isLoading: true,
        hasMore: true
      }, () => this.getNearbyRequest(false));
    }
  },
  getNearbyRequest: function(refresh) {
    let data = {
      start: refresh ? 0 : this.data.start,
      length: this.data.length,
      type: 'nearby',
      agerange:  this.data.agerange
    }
   if (this.data.myNearby)
     data.deeduuid = this.data.myNearby.uuid
   http('/app/deed/make', data).then(res => {
      let useruuid = res.deedlist.address
      let coords = this.circle(res.deedlist.length)
      let tempArr = res.deedlist.map((item, i) => {
        item.avatar = getImgAddress(item.avatar);
        item.x = coords[i].x;
        item.y = coords[i].y;
        item.radius = coords[i].radius;
        item.useruuid
      }); 
      if (!refresh) tempArr = [...this.data.nearbyArr, ...res.deedlist];
      this.setData({
        start: this.data.start + this.data.length,
        hasMore: res.deedlist.length === this.data.length,
        nearbyArr: res.deedlist,
        isLoading: false,
        tempArr,
      })
    }); 
  }, 
  circle: function(num) {
    let maxFailCount = 1000,
      failCount = 0,
      coords = [],
      px2rpx = app.globalData.px2rpx,
      outerRadius = app.globalData.windowWidth * px2rpx / 2,
      randomR = [30, 40, 50];
    while (failCount < maxFailCount && coords.length < num) {
      let canSet = true
      let radius = randomR[Math.floor(Math.random() * randomR.length)];
      //随机设置圆心坐标直到圆心在圆内
      let randomX, randomY;
      do {
        randomX = Math.floor(40 + Math.random() * (outerRadius - radius - 40)) * (Math.random() > 0.5 ? 1 : -1);
        randomY = Math.floor(40 + Math.random() * (outerRadius - radius - 40)) * (Math.random() > 0.5 ? 1 : -1);
      } while (Math.sqrt(Math.pow(randomX, 2) + Math.pow(randomY, 2)) > (outerRadius - radius))

      for (let l = coords.length; l--;) {
        //判断圆是否与已知圆重叠
        if (Math.sqrt(Math.pow(coords[l].x - randomX, 2) + Math.pow(coords[l].y - randomY, 2)) < coords[l].radius + radius) {
          canSet = false;
          break;
        }
      }
      if (canSet) {
        coords.push({
          x: randomX,
          y: randomY,
          radius: radius
        })
      } else {
        failCount++;
      }
    }
    return coords;
  },
  navToProfile: function(e) {
    let {
      uuid,
      deeduuid,
      useruuid
    } = e.currentTarget.dataset;
    wx.navigateTo({
      url: setParams('../profile/profile', {
        uuid,
        deeduuid,
        useruuid,
        type: 'radarNearby'
      }),
    })
  }
})