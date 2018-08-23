const uuid = {
    isUUID: {
        errmsg: "uuid有误！",
        param: 1
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

const code = {
    isLength: {
        errmsg: "微信获取openid交换码有误",
        param: [1, 32]
    }
}

const height = {
    isFloat: {
        errmsg: "身高有误",
        param: { min: 70.00, max: 226.00 }
    }
}

const nickname = {
    isLength: {
        errmsg: "微信昵称长度有误",
        param: [1, 64]
    }
}

const phone = {
    isMobilePhone: {
        errmsg: "手机号格式错误！",
        param: ["zh-CN"]
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
        param: [["attestvideo", "personality", "album"]]
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

const city = {
    isLength: {
        errmsg: "城市长度有误",
        param: [0, 8]
    }
}

const smscode = {
    isLength: {
        errmsg: "验证码错误",
        param: [4, 4]
    }
}



const action = {
    isIn: {
        errmsg: "收藏行为错误",
        param: [["true", "false"]]
    }
}

const commentscontent = {
    isLength: {
        errmsg: "评论内容长度有误",
        param: [1, 120]
    }
}

const chat = {
    isLength: {
        errmsg: "聊天内容长度有误",
        param: [0, 1000]
    }
}

const avatar = {
    isLength: {
        errmsg: "头像url长度有误",
        param: [0, 256]
    }
}

const longitude = {
    require: 0,
    isLength: {
        errmsg: "经度长度有误",
        param: [4, 32]
    }
}

const latitude = {
    require: 0,
    isLength: {
        errmsg: "纬度长度有误",
        param: [4, 32]
    }
}

const baseInfoKey = {
    isIn: {
        errmsg: "修改内容字段有误",
        param: [["birthday", "height"]]
    }
}

const commentslevel = {
    isInt: {
        errmsg: "评价星级错误",
        param: { min: 1, max: 5 }
    }
}

const deel = {
    isIn: {
        errmsg: "处理订单字段有误",
        param: [["go", "notgo"]]
    }
}

const appealcontent = {
    isLength: {
        errmsg: "申诉内容长度有误",
        param: [1, 120]
    }
}

const deedtype = {
    isIn: {
        errmsg: "约饭类型有误",
        param: [["nearby", "spend", "make"]]
    }
}

const posit = {
    require: 0,
    isInt: {
        errmsg: "赏金错误",
        param: { min: 1, max: 5000000000 }
    }
}

const gender = {
    require: 0,
    isIn: {
        errmsg: "性别有误",
        param: [["0", "1", "undefined"]]
    }
}

const agerange = {
    require: 0,
    isLength: {
        errmsg: "年龄区间有误",
        param: [4, 64]
    }
}

export const DeedValidator = {
    listDeedValidator: {
        start: start,
        length: length,
        deeduuid: uuid,
        type: deedtype
    },
    createdDeed: {
        gender: gender,
        latitude: latitude,
        longitude: longitude,
        agerange: {
            require: 0,
            isLength: {
                errmsg: "年龄区间有误",
                param: [4, 124]
            }
        },
        payway: {
            require: 0,
            isIn: {
                errmsg: "支付方式有误",
                param: [["aa", "me"]]
            }
        },
        type: deedtype,
        address: {
            require: 0,
            isLength: {
                errmsg: "地址有误",
                param: [0, 256]
            }
        },
        restaurant: {
            require: 0,
            isLength: {
                errmsg: "餐厅有误",
                param: [0, 128]
            }
        },
        posit: posit,
        getposit: {
            require: 0,
            isLength: {
                errmsg: "赏金区间有误",
                param: [0, 256]
            }
        }
    },
    findMake: {
        gender: gender,
        agerange,
        orderby: {
            require: 0,
            isIn: {
                errmsg: "排序参数有误",
                param: [["distance", "mealtime"]]
            }
        },
        start,
        length
    },
    mydeed: {
        type: deedtype,
        start,
        length
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
    },
    clearLocation: {
        deeduuid: uuid
    }
}

export const NoticeValidator = {
    noticeValidator: {
        reason: {
            require: 0,
            isLength: {
                errmsg: "原因有误",
                param: [0, 255]
            }
        },
        result: {
            isIn: {
                errmsg: "消息结果有误",
                param: [["accept", "refuse"]]
            }
        },
        type: {
            isIn: {
                errmsg: "消息类型有误",
                param: [["send", "receive", "tohello", "fromhello", "audit"]]
            }
        }
    },
    uuidValidator: {
        uuid: uuid
    },
    findMyNotice: {
        uuid: uuid,
        start: start,
        length: length,
        type: {
            isIn: {
                errmsg: "查询类型有误",
                param: [["to", "from", "systeam", "all"]]
            }
        }

    },
    invitedByNotice: {
        fromdeeduuid: uuid,
        todeeduuid: uuid,
        useruuid: uuid
    },
    invitedByNotices: {
        fromdeeduuid: uuid
    },
    readNotice: {
        uuid: uuid
    }
}

export const OrderValidator = {
    orderCreatedValidator: {
        deeduuid: uuid,
        result: {
            isIn: {
                errmsg: "结果类型错误",
                param: [["accept", "refuse"]]
            }
        },
        noticeuuid: uuid
    },
    orderCreatedNewValidator: {
        deeduuid: uuid,
    },
    orderupdateValidator: {
        orderuuid: uuid,
        result: {
            isIn: {
                errmsg: "结果类型错误",
                param: [["accept", "refuse"]]
            }
        }
    },
    myOrder: {
        type: {
            isIn: {
                errmsg: "订单类型有误",
                param: [["to", "from", "all"]]
            }
        }
    },
    uuidValidator: {
        uuid: uuid
    },
    deelOrder: {
        orderuuid: uuid,
        deel: deel
    }

}

export const WxpayValidator = {
    payValidator: {
        pay: {
            isInt: true
        }
    },

    wxpay: {
        useruuid: uuid,
        pay: {
            isInt: true
        }
    }

}

export const UsersValidator = {
    startvalidator: {
        start: start,
        length: length
    },
    login: {
        code: code,
        nickname: nickname
    },
    addBaseInfo: {
        gender: sex,
        birthday: age,
        height: height,
    },
    modifiedPhone: {
        phone: phone
    },
    updateOrAddMeida: {
        uploadfield: uploadfield
    },
    DelMedia: {
        delfield: deletefield
    },
    getCode: {
        phone: phone
    },
    regPhone: {
        phone: phone,
        code: smscode
    },
    syncInfo: {
        nickname: nickname,
        avatar: avatar,
        longitude: longitude,
        latitude: latitude,
        city: city,
        area: {
            isLength: {
                errmsg: "城市长度有误",
                param: [0, 8]
            }
        }
    },
    updateBaseInfo2Birth: {
        key: baseInfoKey,
        value: age
    },
    updateBaseInfo2Height: {
        key: baseInfoKey,
        value: height
    },
    findHotUser: {
        start: start,
        length: length
    },
    addLikely: {
        action: action
    }
}

export const CommentsValidator = {
    add: {
        orderuuid: uuid,
        content: commentscontent,
        level: commentslevel
    },
    getComments: {
        start: start,
        length: length,
        useruuid: uuid
    }
}
export const ChatValidator = {
    listChat: {
        orderuuid: uuid
    },
    updateChat: {
        orderuuid: uuid,
        useruuid: uuid,
        chat: chat
    },
    chatInfo: {
        uuid: uuid
    },
    updateMedia: {
        orderuuid: uuid
    }
}

export const AppealValidator = {
    add: {
        orderuuid: uuid,
        content: appealcontent
    }
}

export const PayLogValidator = {
    payLogList: {
        start: start,
        length: length
    },
    payLogInfo: {
        uuid: {
            isLength: {
                errmsg: "赏金区间有误",
                param: [0, 256]
            }
        }
    }

}