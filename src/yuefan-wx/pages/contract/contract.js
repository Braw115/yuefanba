import {
  formatDate,
  http,
  ageToBirth,
  getImgAddress,
  formSubmit,
  calcAge,
  throttle
} from '../../utils/util.js'

//年龄段[18~25, 25~30, 30以上]
let ageOptions = [
  [ageToBirth(200), ageToBirth(18)],
  [ageToBirth(25), ageToBirth(18)],
  [ageToBirth(30), ageToBirth(25)],
  [ageToBirth(200), ageToBirth(30)],
  // [[ageToBirth(25), ageToBirth(18)], [ageToBirth(30), ageToBirth(25)]],
  // [[ageToBirth(30), ageToBirth(25)], [ageToBirth(200), ageToBirth(30)]],
  // [[ageToBirth(25), ageToBirth(18)], [ageToBirth(200), ageToBirth(30)]]
];

let now = new Date();

//小时列表数组
function restHours(date) {
  let hour = date.getHours();
  if (date.getMinutes() >= 45) {
    hour = new Date(date.getTime() + 3600000 * 1).getHours();
  }
  let restHours = Array.apply(null, {
    length: 24 - hour
  }).map((v, i) => {
    let temp = '' + (hour + i);
    temp < 10 ? temp = 0 + temp : temp;
    return temp[1] ? temp + '时' : '0' + temp + '时';
  });
  return restHours;
}

let otherDateHour = 0;
let otherDateHours = Array.apply(null, {
  length: 24
}).map((v, i) => {
  let temp = '' + (otherDateHour + i) + '时';
  return temp[1] ? temp : '0' + temp;
});

let minArr = ['00分', '15分', '30分', '45分'];

function initMinsArr(time) {
  let arr = [];
  for (var i = 0; i < 4; i++) {
    let temp = (15 * i);
    if (temp > time.getMinutes()) {
      arr.push(temp + '分');
    }
  }
  if (arr.length == 0) {
    arr = ['00分', '15分', '30分', '45分'];
    // minArr = ['00分', '15分', '30分', '45分']
  }
  return arr;
}

//日期列表数组
let dateArr = Array.apply(null, {
  length: 15
}).map((v, i) => {
  let temp = '' + afterTime(now.getTime(), 24 * i);
  return temp;
});

// let payOption = ['me', 'aa'];

function afterTime(beforeTime, hournum) {
  var endTime = new Date((beforeTime) + 3600000 * (hournum - 8)); //1.小时=3600000毫秒 东八区时间差8小时
  var endDate = lessThan10(endTime.getMonth() + 1) + '月' + lessThan10(endTime.getDate()) + '日';
  return endDate
}

function afterDate(beforeDate, hournum) {
  return new Date(beforeDate.getTime() + 3600000 * hournum)

}

function lessThan10(num) {
  var str
  if (num < 10) {
    str = '0' + num
  } else {
    str = num
  }
  return str;
}

function split_time(time) { //将当前时间转换成时间搓 例如
  var arr = time.split(" ");
  var day = arr[0].split("-");
  var hour = arr[1].split(":");
  return Date.UTC(day[0], (day[1] - 1), day[2], hour[0], hour[1], hour[2]); //将当前时间转换成时间搓
}

Page({
  data: {
    type: null,
    genderArr: [true, true],
    ageArr: [true, false, false],
    timeIndex: [0, 0, 1],
    realTimeIndex: [0, 0, 0],
    timeArr: [dateArr, restHours(now), initMinsArr(now)],
    timeStr: dateArr[0] + ' ' + restHours(now)[0] + initMinsArr(now)[0],
    // paywayIndex: "0",
    payway: 'me',
    rewardIndex: '0',
    wantReward: [0, 0],
    realWantReward: [0, 27],
    rewardArr: Array.apply(null, {
      length: 3
    }).map((v, i) => ++i * 100),
    showRecharge: false,
    showGreet: false,
    showRestaurant: false,
    restaurant: null,
    restaurantArr: [],
    searchInput: '',
    length: 27,
    start: 0,
    hasMore: true,
    isLoading: false,
    myContract: null,
    greetArr: [],
    goBack: false,
    errorImg: '',
    errorText: '',
    errorBtnText: '',
    errorToPage: '',
    errorTitle: ''
  },
  onShow: function() {
    this.setData({
      start: 0
    })
    let now = new Date();
    let timeStr
    let timeArr
    if (this.data.type === 'make') {
      timeStr = dateArr[0] + ' ' + restHours(now)[0] + '-' + restHours(now)[0]
      timeArr = [dateArr, restHours(now), restHours(now)]
    } else {
      timeStr = dateArr[0] + ' ' + restHours(now)[0] + initMinsArr(now)[0]
      timeArr = [dateArr, restHours(now), initMinsArr(now)]
    }
    this.setData({
      timeArr,
      timeStr
    });
  
  },
  onLoad: function(options) {
    this.setData({options})
    let title;
    if (options.type === "make") {
      title = "我要赚钱";
    } else if (options.type === "spend") {
      title = "我要花钱";
    } else {
      title = "找附近";
    }
    if (options.type === "nearby") {
      dateArr = Array.apply(null, {
        length: 1
      }).map((v, i) => {
        let temp = '' + afterTime(now.getTime(), 24 * i);
        return temp;
      });
      this.setData({
        timeArr: [dateArr, this.data.timeArr[1], this.data.timeArr[2]]
      });
    } else {
      dateArr = Array.apply(null, {
        length: 15
      }).map((v, i) => {
        let temp = '' + afterTime(now.getTime(), 24 * i);
        return temp;
      });
   }
    wx.setNavigationBarTitle({
      title
    })
    this.setData({
      type: options.type,
      goBack: options.back === 'true'
    });
    options.type !== 'make' && this.searchRest(true);

    this.getProportion();
  },
  selectGender: function(e) {
    let {
      gender
    } = e.currentTarget.dataset;
    if (gender === 'girl') {
      this.setData({
        genderArr: [!this.data.genderArr[0], this.data.genderArr[1]]
      })
    } else if (gender === 'boy') {
      this.setData({
        genderArr: [this.data.genderArr[0], !this.data.genderArr[1]]
      })
    }
  },
  selectAge: function(e) {
    let {
      age,
      num
    } = e.currentTarget.dataset;
    let ageArr = this.data.ageArr
    ageArr[num] = !age

    // if(num === '0'){
    //   if(ageArr[2]){
    //     ageArr[1] = true
    //   }
    // } else if(num === '1'){
    //   if(ageArr[0]&&ageArr[2]){
    //     wx.showModal({
    //       content: '年龄区间必须连续',
    //       showCancel: false
    //     });
    //     return
    //   }
    // } else{
    //   if (ageArr[0]) {
    //     ageArr[1] = true
    //   }
    // }

    this.setData({
      ageArr
    });
  },
  selectPayway: function(e) {
    let {
      payway
    } = e.currentTarget.dataset;
    this.setData({
      payway: payway
    })
  },
  getProportion: function() {
    http('/apppaylog/getproportion', {}, 'GET').then(res => {
      if (!this.data.goBack && this.data.type === "spend") {
        //客户要求兑换成rmb最高300rmb
        let length = 3 * res.proportion;
        this.setData({
          rewardArr: Array.apply(null, {
            length: 3 * res.proportion
            // length: 30
          }).map((v, i) => ++i * 100 + 200),
        });
      }
      if (!this.data.goBack && this.data.type === "make") {
        let length = 3 * res.proportion;
        this.setData({
          rewardArr: Array.apply(null, {
            length: length
          }).map((v, i) => ++i * 100 + 200),
        });
      }
      if (this.data.goBack) {
        this.hotUserAction(res.proportion);
      }
      this.setData({
        proportion: res.proportion
      });
      this.getDeposit();
    })
  },
  hotUserAction: function(proportion) {
    if (this.data.goBack) {
      let hotUserData = wx.getStorageSync('hotUserData')
      // let length = ((3 * proportion * 100) - hotUserData.getdeposit[0]) / 100 + 1;
      let length = 3 * proportion * 100
      console.log('ss',length)
      this.setData({
        rewardArr: Array.apply(null, {
          length: 30
        }).map((v, i) => hotUserData.getdeposit[0] + i * 100),
      });
      this.setData({
        hotObj: {
          nickname: hotUserData.nickname,
          usergender: hotUserData.usergender,
          avatar: getImgAddress(hotUserData.avatar),
          birthday: calcAge(Number(hotUserData.birthday))
        },
      })
      this.setData({
        payway: 'me'
      })
    }
  },
  getDeposit: function() {
    http('/app/deed/deposit').then(res => {
      this.setData({
        deposit: res.deposit
      });
    })
  },
  setTime: function(e) {
    this.setData({
      timeIndex: this.data.realTimeIndex
    })
  },
  showTimeSelect: function() {
    let now = new Date();
    this.setData({
      timeArr: [dateArr, restHours(now), initMinsArr(now)]
    });
  },
  showTimeRangeSelect: function() {
    let now = new Date();
    let now2 = new Date().getHours()
    this.setData({
      timeArr: [dateArr, restHours(now), restHours(now)]
    });
  },
  timeRangeChange: function(e) {
    if (e.detail.column === 0) {
      if (e.detail.value > 0) {
        this.setData({
          timeArr: [dateArr, otherDateHours, minArr]
        });
        this.setData({
          timeIndex: [e.detail.value, 12, this.data.timeIndex[2]]
        })
      } else if (e.detail.value === 0) {
        let now = new Date();
        this.setData({
          timeArr: [dateArr, restHours(now), initMinsArr(now)]
        });
        this.setData({
          timeIndex: [e.detail.value, e.detail.value, this.data.timeIndex[2]]
        })
      }

    } else if (e.detail.column === 1) {
      let timeArr = this.data.timeArr;
      if (e.detail.value > 0) {
        this.setData({
          timeArr: [this.data.timeArr[0], this.data.timeArr[1], minArr]
        });
      } else if (e.detail.value === 0) {
        let now = new Date();
        timeArr[2] = initMinsArr(now)
        this.setData({
          timeArr: timeArr
        });
      }
      this.setData({
        timeIndex: [this.data.timeIndex[0], e.detail.value, this.data.timeIndex[2]]
      })
    }
  },

  timeRangeChange2: function(e) {
    if (e.detail.column === 0) {
      if (e.detail.value > 0) {
        this.setData({
          timeArr: [dateArr, otherDateHours, otherDateHours]
        });
        this.setData({
          timeIndex: [e.detail.value, 12, this.data.timeIndex[2]]
        })
      } else if (e.detail.value === 0) {
        let now = new Date();
        this.setData({
          timeArr: [dateArr, restHours(now), restHours(now)]
        })
        this.setData({
          timeIndex: [e.detail.value, e.detail.value, this.data.timeIndex[2]]
        })
      }

    } else if (e.detail.column === 1) {
      if (e.detail.value > this.data.timeIndex[2]) {
        this.setData({
          timeIndex: [this.data.timeIndex[0], e.detail.value, e.detail.value]
        })
      } else {
        this.setData({
          timeIndex: [this.data.timeIndex[0], e.detail.value, this.data.timeIndex[2]]
        })
      }
    } else {
      if (e.detail.value < this.data.timeIndex[1]) {
        this.setData({
          timeIndex: [this.data.timeIndex[0], e.detail.value, e.detail.value]
        })
      } else {
        this.setData({
          timeIndex: [this.data.timeIndex[0], this.data.timeIndex[1], e.detail.value]
        })
      }
    }
  },

  timeChange: function(e) {
    let selectHour = this.data.timeArr;
    let timeStr =
      selectHour[0][e.detail.value[0]] + '' +
      selectHour[1][e.detail.value[1]] + '-' +
      selectHour[2][e.detail.value[2]];
    this.setData({
      timeStr,
      realTimeIndex: e.detail.value
    });
  },
  setRewardIndex: function(e) {
    this.setData({
      wantReward: this.data.realWantReward
    })
  },
  setrewardChangeIndex: function(e) {
    this.setData({
      rewardIndex: this.data.rewardIndex
    })
  },
  rewardRangeChange: function(e) {
    if (e.detail.column === 0) {
      //最低赏金
      let endIndex = this.data.wantReward[1] < e.detail.value ? e.detail.value : this.data.wantReward[1];
      this.setData({
        wantReward: [e.detail.value, endIndex]
      })
    } else {
      //最高赏金
      let startIndex = this.data.wantReward[0] > e.detail.value ? e.detail.value : this.data.wantReward[0];
      this.setData({
        wantReward: [startIndex, e.detail.value]
      })
    }
  },
  wantRewardChange: function(e) {
    this.setData({
      realWantReward: e.detail.value
    })
  },
  rewardChange: function(e) {
    console.log(e.detail.value)
    this.setData({
      rewardIndex: e.detail.value
    });
  },
  showRecharge: function() {
    this.setData({
      showRecharge: !this.data.showRecharge
    })
  },
  showGreet: function() {
    this.setData({
      showGreet: !this.data.showGreet
    })
  },
  showRestaurant: function() {
    if (!this.data.showRestaurant) {
      this.setData({
        start: 0
      })
      this.getRest();
    }
    this.setData({
      showRestaurant: !this.data.showRestaurant
    })
  },
  setRestaurant: function(e) {
    this.setData({
      restaurant: e.currentTarget.dataset.restaurant,
      showRestaurant: false
    })
  },
  inputChange: function(e) {
    this.setData({
      searchInput: e.detail.value.trim()
    }, () => this.searchRest(true))
  },
  searchRest: function(refresh) {
    refresh = refresh === true;
    if (refresh) {
      this.setData({
        start: 0,
        isLoading: true,
        hasMore: true,
        restaurantArr: []
      }, () => this.getRest(refresh));
    } else {
      if (this.data.isLoading || !this.data.hasMore) return;
      this.setData({
        isLoading: true,
        hasMore: true
      }, () => this.getRest(refresh));
    }
  },
  getRest: function(refresh) {
    http('/app/restaurant', {
      key: this.data.searchInput,
      length: this.data.length,
      start: this.data.start

    }).then(res => {
      if (res.restaurant.status === '1') {
        let tempArr;
        tempArr = refresh ? res.restaurant.pois : [...this.data.restaurantArr, ...res.restaurant.pois]
        this.setData({
          restaurantArr: tempArr,
          start: this.data.start + this.data.length,
          hasMore: res.restaurant.pois.length === this.data.length,
          isLoading: false
        })
      } else {
        this.setData({
          isLoading: false
        })
      }
    }, err => {
      console.log(err)
    })
  },
  invite: function(target) {
    let tempArr = this.data.greetArr.filter(item => item.selected === true);
    let todeeduuidarr = [],
      useruuidarr = [];
    tempArr.forEach(item => {
      todeeduuidarr.push(item.deeduuid);
      useruuidarr.push(item.uuid)
    });
    http('/app/notice/make', {
      fromdeeduuid: this.data.myContract.uuid,
      todeeduuidarr: todeeduuidarr,
      useruuidarr: useruuidarr
    }, 'post').then(res => {
      wx.showToast({
        title: '打招呼已发出'
      })
    })
    err => {
      wx.showModal({
        content: err,
      })
    }
    //设置邀请发送之后1.5秒后返回到首页
    let timer = setTimeout(function () {
      wx.reLaunch({
        url: '/pages/index/index'
      });
      clearTimeout(timer);
    }, 1500)
  },
  selectGreet: function(e) {
    let item = this.data.greetArr[e.currentTarget.dataset.index]
    item.selected = !item.selected;
    this.setData({
      greetArr: this.data.greetArr
    });
  },
  promptMsg: function(msg) {
    wx.showModal({
      content: msg,
      showCancel: false
    });
    wx.hideLoading();
  },
  createContract: function() {
    if (!this.data.ageArr.some((v) => v === true)) {
      this.promptMsg('请选择年龄')
      return;
    }
    let minAge
    let maxAge
    let ageRange
    if (this.data.ageArr[0] && !this.data.ageArr[1] && this.data.ageArr[2]) {
      ageRange = [
        [ageToBirth(25), ageToBirth(18)],
        [ageToBirth(200), ageToBirth(30)]
      ]
    } else {
      if (this.data.ageArr[0]) {
        minAge = ageToBirth(18)
        maxAge = ageToBirth(25)
      }
      if (this.data.ageArr[1]) {
        if (!this.data.ageArr[0]) {
          minAge = ageToBirth(25)
        }
        maxAge = ageToBirth(30)
      }
      if (this.data.ageArr[2]) {
        if (!this.data.ageArr[0] && !this.data.ageArr[1]) {
          minAge = ageToBirth(30)
        }
        maxAge = ageToBirth(200)
      }
      ageRange = [
        [maxAge, minAge]
      ]
    }

    let nowGender;
    if (this.data.genderArr[0] && this.data.genderArr[1]) nowGender = undefined //不限
    if (this.data.genderArr[0] && !this.data.genderArr[1]) nowGender = 0; //女
    if (!this.data.genderArr[0] && this.data.genderArr[1]) nowGender = 1; //男

    //考虑到跨年的情况通过判断月份大小来判断是否当前年份
    let year = Number(this.data.timeStr.split(' ')[0].split('月')[0]) < now.getMonth() + 1 ? now.getFullYear() + 1 : now.getFullYear();
    let month = this.data.timeStr.split(' ')[0].split('月')[0];
    let day = this.data.timeStr.split(' ')[0].split('月')[1].split('日')[0];
    let hour = parseInt(this.data.timeArr[1][this.data.realTimeIndex[1]])
    let minute = parseInt(this.data.timeArr[2][this.data.realTimeIndex[2]])

    let startTime;
    let endTime;

    if (this.data.type === 'make') {
      startTime = split_time(year + '-' + month + '-' + day + ' ' + hour + ':' + '00' + ':00') + 3600000 * -8; //东八区
      endTime = split_time(year + '-' + month + '-' + day + ' ' + minute + ':' + '00' + ':00') + 3600000 * -8; //东八区
      endTime = endTime + 3600000 * 1;
      let d = new Date()
      d.setMinutes(0);
      d.setSeconds(0);
      d.setMilliseconds(0)
      let newnow = d.getTime();
      if (newnow > startTime) {
        this.promptMsg("请重新选择时间");
        return;
      }
    } else {
      startTime = split_time(year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':00') + 3600000 * -8; //东八区
      let newnow = Date.now();
      if (newnow > startTime) {
        this.promptMsg("请重新选择时间");
        return;
      }
      endTime = startTime + 3600000 * 2;
    }
    let mealtime = JSON.stringify([startTime, endTime])
    let obj = {
      type: this.data.type,
      gender: nowGender,
      agerange: JSON.stringify(ageRange),
      mealtime: mealtime,
    }

    if (this.data.goBack) {
      if (!this.data.restaurant) {
        this.promptMsg("请选择餐厅");
        return;
      }
      let hotUserData = wx.getStorageSync('hotUserData')
      let address = this.data.restaurant.cityname + '-' + this.data.restaurant.adname + '-' + this.data.restaurant.address;
      console.log(address);
      let spendObj = {
        deeduuid: hotUserData.uuid,
        useruuid: hotUserData.useruuid,
        restaurant: this.data.restaurant.name,
        address: address,
        // payway: payOption[this.data.paywayIndex],
        payway: this.data.payway,
        deposit: this.data.rewardArr[this.data.rewardIndex],

        longitude: hotUserData.longitude,
        latitude: hotUserData.latitude,
        mealtime: obj.mealtime,
      }
      http('/app/deed/invitehot', spendObj, 'post').then(res => {
        wx.showToast({
          title: '邀请已发送'
        })
        let timer = setTimeout(function() {
          wx.reLaunch({
            url: '/pages/index/index'
          });
          clearTimeout(timer);
        }, 1500)
        wx.hideLoading();
      }, err => {
        wx.hideLoading();
        if(err=='吃货币不足')
        {
          this.setData({
            errorImg: '../../img/beishang@2x(1).png',
            errorText: '吃货币不足啦!',
            errorBtnText: '去充值',
            errorToPage: '../recharge/recharge'
          })
          this.showRecharge()
          return
          
        }
        else{
        this.promptMsg(err);
        return;
        }
      })
      return
    }

    if (this.data.type === 'make') {
      obj.getposit = obj.getposit = '[' + this.data.rewardArr[this.data.realWantReward[0]] + ', ' + this.data.rewardArr[this.data.realWantReward[1]] + ']';
      // console.log(this.data.rewardArr[this.data.realWantReward[0]]);
      // console.log(this.data.rewardArr[this.data.realWantReward[1]]);
      if (this.data.rewardArr[this.data.realWantReward[0]] === this.data.rewardArr[this.data.realWantReward[1]]) {
        this.promptMsg("赏金不能一样");
        return;
      }
      if (this.data.rewardArr[this.data.realWantReward[0]] > this.data.rewardArr[this.data.realWantReward[1]]) {
        this.promptMsg("赏金选择错误");
        return;
      }
    } else {
      if (!this.data.restaurant) {
        this.promptMsg("请选择餐厅");
        return;
      }
      let address = this.data.restaurant.cityname + '-' + this.data.restaurant.adname + '-' + this.data.restaurant.address;
      let spendObj = {
        restaurant: this.data.restaurant.name,
        longitude: this.data.restaurant.location.split(',')[0],
        latitude: this.data.restaurant.location.split(',')[1],
        // payway: payOption[this.data.paywayIndex],
        payway: this.data.payway,
        address: address,
        posit: this.data.rewardArr[this.data.rewardIndex]
      }
      if (this.data.type === 'spend') {
        spendObj.posit = this.data.rewardArr[this.data.rewardIndex]
      }
      obj = {
        ...obj,
        ...spendObj,
      };
      this.setData({
        obj
      })
    }

    http('/app/deed', obj, 'post').then(
      res => {
        wx.hideLoading();
        if (this.data.goBack) {
          wx.navigateBack({});
          return;
        }
        if (this.data.type === 'spend') {
          wx.redirectTo({
            url: '../match/match',
          })
        } else if (this.data.type === 'make') {
          this.setData({
            myContract: res.deed
          }, this.getContract)
          this.showGreet();
        } else {
          wx.navigateTo({
            url: '../radar/radar',
          })
        }
      },
      err => {
        wx.hideLoading();
        switch (err) {
          //attestvideo unupload
          case '1':
            this.setData({
              errorImg: '../../img/beishang@2x(1).png',
              errorText: '认证视频未上传',
              errorBtnText: '去上传',
              errorToPage: '../profile/profile'
            })
            break;
            //attestvideo uncheck
          case '2':
            this.setData({
              errorImg: '../../img/beishang@2x(1).png',
              errorText: '认证视频未审核',
              errorBtnText: '去查看',
              errorToPage: '../profile/profile'
            })
            break;
            //attestvideo refuse
          case '3':
            this.setData({
              errorImg: '../../img/beishang@2x(1).png',
              errorText: '认证视频审核未通过',
              errorBtnText: '去查看',
              errorToPage: '../profile/profile'
            })
            break;
            //phone is empty
          case '4':
            this.setData({
              errorImg: '../../img/beishang@2x(1).png',
              errorText: '手机号未绑定',
              errorBtnText: '去绑定',
              errorToPage: '../modify-phone/phase-one'
            })
            break;
            //balance is not enough
          case '5':
            this.setData({
              errorImg: '../../img/beishang@2x(1).png',
              errorText: '吃货币不足啦!',
              errorBtnText: '去充值',
              errorToPage: '../recharge/recharge'
            })
            break;
          default:
            {
              if (err.length > 10) {
                this.setData({
                  BtnText1: '是',
                  BtnText2: '否',
                  errorImg: '../../img/beishang@2x(1).png',
                  errorText: err,
                })
              } else {
                this.setData({
                  errorBtnText: '确定',
                  errorImg: '../../img/beishang@2x(1).png',
                  errorText: err,
                })
              }
            }
        }
        this.showRecharge()
      }
    )
  },
  goTodeed: function() {
    if (!this.data.ageArr.some((v) => v === true)) {
      this.promptMsg('请选择年龄')
      return;
    }
    let minAge
    let maxAge
    let ageRange
    if (this.data.ageArr[0] && !this.data.ageArr[1] && this.data.ageArr[2]) {
      ageRange = [
        [ageToBirth(25), ageToBirth(18)],
        [ageToBirth(200), ageToBirth(30)]
      ]
    } else {
      if (this.data.ageArr[0]) {
        minAge = ageToBirth(18)
        maxAge = ageToBirth(25)
      }
      if (this.data.ageArr[1]) {
        if (!this.data.ageArr[0]) {
          minAge = ageToBirth(25)
        }
        maxAge = ageToBirth(30)
      }
      if (this.data.ageArr[2]) {
        if (!this.data.ageArr[0] && !this.data.ageArr[1]) {
          minAge = ageToBirth(30)
        }
        maxAge = ageToBirth(200)
      }
      ageRange = [
        [maxAge, minAge]
      ]
    }

    let nowGender;
    if (this.data.genderArr[0] && this.data.genderArr[1]) nowGender = undefined //不限
    if (this.data.genderArr[0] && !this.data.genderArr[1]) nowGender = 0; //女
    if (!this.data.genderArr[0] && this.data.genderArr[1]) nowGender = 1; //男

    //考虑到跨年的情况通过判断月份大小来判断是否当前年份
    let year = Number(this.data.timeStr.split(' ')[0].split('月')[0]) < now.getMonth() + 1 ? now.getFullYear() + 1 : now.getFullYear();
    let month = this.data.timeStr.split(' ')[0].split('月')[0];
    let day = this.data.timeStr.split(' ')[0].split('月')[1].split('日')[0];
    let hour = parseInt(this.data.timeArr[1][this.data.realTimeIndex[1]])
    let minute = parseInt(this.data.timeArr[2][this.data.realTimeIndex[2]])

    let startTime;
    let endTime;

    if (this.data.type === 'make') {
      startTime = split_time(year + '-' + month + '-' + day + ' ' + hour + ':' + '00' + ':00') + 3600000 * -8; //东八区
      endTime = split_time(year + '-' + month + '-' + day + ' ' + minute + ':' + '00' + ':00') + 3600000 * -8; //东八区
      endTime = endTime + 3600000 * 1;
      let d = new Date()
      d.setMinutes(0);
      d.setSeconds(0);
      d.setMilliseconds(0)
      let newnow = d.getTime();
      if (newnow > startTime) {
        this.promptMsg("请重新选择时间");
        return;
      }
    } else {
      startTime = split_time(year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':00') + 3600000 * -8; //东八区
      let newnow = Date.now();
      if (newnow > startTime) {
        this.promptMsg("请重新选择时间");
        return;
      }
      endTime = startTime + 3600000 * 2;
    }
    let mealtime = JSON.stringify([startTime, endTime])
    let obj = {
      type: this.data.type,
      gender: nowGender,
      agerange: JSON.stringify(ageRange),
      mealtime: mealtime,
      deeltype: true,
      deldeed: true,
    }
   if (this.data.goBack) {
      if (!this.data.restaurant) {
        this.promptMsg("请选择餐厅");
        return;
      }
      let hotUserData = wx.getStorageSync('hotUserData')
      let address = this.data.restaurant.cityname + '-' + this.data.restaurant.adname + '-' + this.data.restaurant.address;
      let deldeed = true;
      console.log(address);
      let spendObj = {
        deeduuid: hotUserData.uuid,
        useruuid: hotUserData.useruuid,
        restaurant: this.data.restaurant.name,
        address: address,
        deldeed: deldeed,
        // payway: payOption[this.data.paywayIndex],
        payway: this.data.payway,
        deposit: this.data.rewardArr[this.data.rewardIndex],
        longitude: hotUserData.longitude,
        latitude: hotUserData.latitude,
        mealtime: obj.mealtime
      }
      http('/app/deed/invitehot', spendObj, 'post').then(res => {
        wx.showToast({
          title: '邀请已发送'
        })
        let timer = setTimeout(function() {
          wx.reLaunch({
            url: '/pages/index/index'
          });
          clearTimeout(timer);
        }, 1500)
        wx.hideLoading();
      }, err => {
        wx.hideLoading();
        this.promptMsg(err);
        return;
      })
      return
    }
    if (this.data.type === 'make') {
      obj.getposit = obj.getposit = '[' + this.data.rewardArr[this.data.realWantReward[0]] + ', ' + this.data.rewardArr[this.data.realWantReward[1]] + ']';
      // console.log(this.data.rewardArr[this.data.realWantReward[0]]);
      // console.log(this.data.rewardArr[this.data.realWantReward[1]]);
      if (this.data.rewardArr[this.data.realWantReward[0]] === this.data.rewardArr[this.data.realWantReward[1]]) {
        this.promptMsg("赏金不能一样");
        return;
      }
      if (this.data.rewardArr[this.data.realWantReward[0]] > this.data.rewardArr[this.data.realWantReward[1]]) {
        this.promptMsg("赏金选择错误");
        return;
      }
    } else {
      if (!this.data.restaurant) {
        this.promptMsg("请选择餐厅");
        return;
      }
      let address = this.data.restaurant.cityname + '-' + this.data.restaurant.adname + '-' + this.data.restaurant.address;
      let deldeed = true;
      let spendObj = {
        restaurant: this.data.restaurant.name,
        longitude: this.data.restaurant.location.split(',')[0],
        latitude: this.data.restaurant.location.split(',')[1],
        // payway: payOption[this.data.paywayIndex],
        payway: this.data.payway,
        address: address,
        deldeed: deldeed,
        posit: this.data.rewardArr[this.data.rewardIndex],
      }
      if (this.data.type === 'spend') {
        spendObj.posit = this.data.rewardArr[this.data.rewardIndex]
      }
      obj = {
        ...obj,
        ...spendObj
      };
    }
    http('/app/deed', obj, 'post').then(
      res => {
        if (this.data.type === 'spend') {
          wx.redirectTo({
            url: '../match/match',
          })
        } else if (this.data.type === 'make') {
          this.setData({
            myContract: res.deed,
            deldeed: true
          }, this.getContract);
          this.showGreet();
        } else {
          console.log('附近')
          wx.navigateTo({
            url: '../radar/radar',
          })
        }
      },
      err => {
        wx.hideLoading();
        this.setData({ showRecharge: false,})
        switch (err) {
          //attestvideo unupload
          case '1':
            this.setData({
              errorImg: '../../img/beishang@2x(1).png',
              errorText: '认证视频未上传',
              errorBtnText: '去上传',
              errorToPage: '../profile/profile'
            })
            break;
          //attestvideo uncheck
          case '2':
            this.setData({
              errorImg: '../../img/beishang@2x(1).png',
              errorText: '认证视频未审核',
              errorBtnText: '去查看',
              errorToPage: '../profile/profile'
            })
            break;
          //attestvideo refuse
          case '3':
            this.setData({
              errorImg: '../../img/beishang@2x(1).png',
              errorText: '认证视频审核未通过',
              errorBtnText: '去查看',
              errorToPage: '../profile/profile'
            })
            break;
          //phone is empty
          case '4':
            this.setData({
              errorImg: '../../img/beishang@2x(1).png',
              errorText: '手机号未绑定',
              errorBtnText: '去绑定',
              errorToPage: '../modify-phone/phase-one'
            })
            break;
          //balance is not enough
          case '5':
            this.setData({
              errorImg: '../../img/beishang@2x(1).png',
              errorText: '吃货币不足啦!',
              errorBtnText: '去充值',
              errorToPage: '../recharge/recharge'
            })
            break;
          default:
            {
                this.setData({
                  errorBtnText: '确定',
                  errorImg: '../../img/beishang@2x(1).png',
                  errorText: err,
                })
            }
        }
        this.showRecharge()
      }
    )
  },
  getContract: function() {
    return http('/app/deed', {
      type: 'spend',
      deeduuid: this.data.myContract.uuid,
      start: 0,
      length: 9
    }, 'get').then((res) => {
      res.deedlist.map(item => {
        // item.age = calcAge(Number(item.birthday));
        item.selected = true;
        item.avatar = getImgAddress(item.avatar);
        return item
      })
      this.setData({
        greetArr: res.deedlist
      });
    }, err => {

    })
  },
  navBack: function() {
    wx.navigateBack({})
  },
  pay: function() {
    wx.navigateBack({})
  },
  doCreate: function(e) {
    // if (this.data.type !== 'spend')
    // {
    //   wx:wx.showModal({
    //     title: '去 支付',
    //     content: '同意',
    //     showCancel: false,

    //   })

    // } return;
    wx.showLoading({
      title: '提交中',
      mask: true
    })
    formSubmit(e)
    let that = this
    throttle(that.createContract);
  }
})