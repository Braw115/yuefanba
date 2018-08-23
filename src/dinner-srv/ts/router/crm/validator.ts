const uuid = {
    isUUID: {
        errmsg: "uuid有误！",
        param: 1
    }
}

const phone = {
    isMobilePhone: {
        errmsg: "手机号格式错误！",
        param: ["zh-CN"]
    }
}

const password = {
    isLength: {
        errmsg: "密码长度错误！",
        param: [4, 64]
    }
}

const smscode = {
    isLength: {
        errmsg: "验证码错误",
        param: [4, 4]
    }
}

const nickname = {
    isLength: {
        errmsg: "昵称格式错误",
        param: [1, 16]
    }
}

const height = {
    isFloat: {
        errmsg: "身高有误",
        param: { min: 70.00, max: 226.00 }
    }
}

const age = {
    isLength: {
        errmsg: "年龄错误！",
        param: [10, 17]
    }
}

const sex = {
    isInt: {
        errmsg: "性别有误",
        param: { min: 0, max: 1 }
    }
}

const longitude = {
    isLength: {
        errmsg: "经度长度有误",
        param: [4, 32]
    }
}

const latitude = {
    isLength: {
        errmsg: "纬度长度有误",
        param: [4, 32]
    }
}

const start = {
    isLength: {
        errmsg: "分页开始参数有误",
        param: [0, 8]
    }
}
const length = {
    isLength: {
        errmsg: "分页长度有误",
        param: [0, 8]
    }
}

const status = {
    isIn: {
        errmsg: "审核状态有误",
        param: [["refuse", "accept", "uncheck", "unupload", "all"]]
    }
}

const searchdata = {
    require: 0,
    isLength: {
        errmsg: "查询参数有误",
        param: [0, 255]
    }
}

const orderby = {
    isIn: {
        errmsg: "排序字段有误",
        param: [["birthday", "popularity", "created"]]
    }
}

const ascordesc = {
    isIn: {
        errmsg: "排序方式有误",
        param: [["asc", "desc"]]
    }
}

const uploadfield = {
    isIn: {
        errmsg: "媒体字段有误",
        param: [["avatar", "attestvideo", "personality", "album"]]
    }
}

const deletefield = {
    isIn: {
        errmsg: "媒体字段有误",
        param: [["attestvideo", "personality", "album", "avatar"]]
    }
}

const ordertype = {
    isIn: {
        errmsg: "订单类型有误",
        param: [["waitfeedback", "either", "neither", "unusual", "normal", "all"]]//either-单方评论 neither-双方未评 unusual-争议评 normal waitfeedback-待反馈
    }
}

const orderstate = {
    isIn: {
        errmsg: "订单状态有误",
        param: [["on", "off", "all"]]
    }
}

const bannerurl = {
    isLength: {
        errmsg: "轮播图url长度错误",
        param: [1, 64]
    }
}

const description = {
    isLength: {
        errmsg: "描述长度错误",
        param: [1, 128]
    }
}

const priority = {
    isInt: {
        errmsg: "优先级设置错误",
        param: { min: 1, max: 5 }
    }
}

const bannerState = {
    isIn: {
        errmsg: "轮播图状态有误",
        param: [["true", "false", "all"]]
    }
}

const imgUrl = {
    require: 0,
    isLength: {
        errmsg: "图片地址长度错误",
        param: [1, 128]
    }
}

const key = {
    isIn: {
        errmsg: "key有误",
        param: [["pay", "orderstimeout", "remind", "deposit"]]
    }
}

const value = {
    require: 0
}

const pltype = {
    isIn: {
        errmsg: "支付类型有误",   //支付类型，recharge-充值 withdraw-提现	pay-契约花费 back-订单回退
        param: [["recharge", "withdraw", "pay", "back", "all"]]
    }
}

const popularity = {
    isInt: {
        errmsg: "人气值设置错误",
        param: { min: 0, max: 1500 }
    }
}

const reason = {
    require: 0,
    isLength: {
        errmsg: "原因长度错误",
        param: [0, 120]
    }
}

export const UsersValidator = {
    login: {
        phone: phone,
        password: password
    },
    passwordvalidator: {
        password: password
    },
    getCode: {
        phone: phone
    },
    findBackPassword: {
        phone: phone,
        password: password,
        code: smscode
    },
    updatePassword: {
        oldPassword: password,
        newPassword: password
    },
    addAdmin: {
        phone: phone,
        password: password
    },
    updateAdmin: {
        phone: phone,
        password: {
            require: 0,
            isLength: {
                errmsg: "密码长度错误！",
                param: [4, 64]
            }
        }
    },
    deleteUser: {
        uuid: uuid
    },
    addAppUser: {
        nickname: nickname,
        phone: {
            require: 0,
            isMobilePhone: {
                errmsg: "手机号格式错误！",
                param: ["zh-CN"]
            }
        },
        longitude: longitude,
        latitude: latitude,
        gender: sex,
        birthday: age,
        height: height,
        balance: {
            require: 0,
            isInt: {
                errmsg: "吃货币总额设置错误",
                param: { min: 0, max: 9990 }
            }
        },
        popularity: popularity
    },
    UserList: {
        start: start,
        length: length,
        status: status,
        search: searchdata,
        orderby: orderby,
        ascordesc: ascordesc
    },
    updateOrAddMeida: {
        uploadfield: uploadfield
    },
    DelMedia: {
        delfield: deletefield
    },
    checkVideo: {
        uuid: uuid,
        status: {
            isIn: {
                errmsg: "审核状态有误",
                param: [["refuse", "accept"]]
            }
        },
        reason: reason
    },
    getComments: {
        uuid: uuid,
        start: start,
        length: length
    }
}

export const OrderValidator = {
    OrderList: {
        start: start,
        length: length,
        type: ordertype,
        state: orderstate
    }
}

export const BannerValidator = {
    insert: {
        url: bannerurl,
        description: description,
        priority: priority,
        state: bannerState
    },
    BannerList: {
        start: start,
        length: length,
        state: bannerState
    },
    uadateBase: {
        uuid: uuid,
        url: bannerurl,
        description: description,
        priority: priority,
        state: bannerState
    },
    deleteBanner: {
        uuid: uuid
    },
    updateOrAddMeida: {
        url: imgUrl,
        uuid: uuid
    },
    DelMedia: {
        url: imgUrl,
        uuid: uuid
    }
}

export const systemValidate = {
    addupdate: {
        key: key,
        value: value
    }
}

export const PayLogValidator = {
    PayList: {
        start: start,
        length: length,
        type: pltype
    }
}

export const CrmLogValidator = {
    getCrmLOg: {
        start: start,
        length: length
    }
}

export const DeedValidator = {
    listDeedValidator: {
        start: start,
        length: length,
        state: {
            isIn: {
                errmsg: "约饭状态有误",
                param: [["false", "true", "all"]]
            }
        },
        type: {
            isIn: {
                errmsg: "约饭类型有误",
                param: [["nearby", "spend", "make", "all"]]
            }
        },
        result: {
            isIn: {
                errmsg: "约饭结果有误",
                param: [["go", "notgo", "waitfeedback", "all"]]
            }
        },
        address: {
            isLength: {
                errmsg: "地址参数有误",
                param: [0, 64]
            }
        },
        restaurant: {
            isLength: {
                errmsg: "餐厅参数有误",
                param: [0, 64]
            }
        }
    },
    uuidValidator: {
        uuid: uuid
    },
    updateResultValidator: {
        uuid: uuid,
        result: {
            isIn: {
                errmsg: "约饭结果有误",
                param: [["neither", "both", "either", "me"]]
            }
        }
    }
}

export const AppealValidator = {
    list: {
        start: start,
        length: length
    }
}
