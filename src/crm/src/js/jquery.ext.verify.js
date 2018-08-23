(function (root, undefined) {
    var VerifyImplication = {
        //非空
        "required": {
            method: function (val) {
                val = $.trim(val);
                return val != "";
            },
            message: "不能为空!"
        },
        //数字范围（整数）
        "num": {
            method: function (val, from, to) {
                if (val == "") return true;
                var reg = /^-?[0-9]\d*$/;
                if (!reg.test(val)) return false;
                if (from && to) return (parseInt(val) >= parseInt(from) && parseInt(val) <= parseInt(to));
                return true;
            },
            message: "非法数字格式!"
        },
        //两位小数
        "fixed2num": {
            method: function(val) {
                if (val === '') {
                    this.message = "不能为空！";
                    return false;
                } else {
                    this.message = "格式不正确！";
                    return !isNaN(val) && Math.abs(val) == Number(val).toFixed(2);
                }
            }
        },
        //长度范围
        "strlen": {
            method: function(val, from, to) {
                if (arguments.length < 4) {
                    return val.length == parseInt(from);
                } else {
                    return val.length >= parseInt(from) && val.length <= parseInt(to);
                }
            },
            message: "长度不在范围内!"
        },
        //数字范围（大于等于零且不为空）
        "bignum": {
            method: function (val) {
                if (val == "") return false;
                var reg = /^[0-9]\d*$/;
                if (!reg.test(val)) return false;
                return true;
            },
            message: "输入的数值不合法!"
        },
        //用户名
        "username": {
            method: function (val) {
                if (val == '') {
                    this.message = '不能为空!';
                    return false;
                } else {
                    this.message = '格式不正确!';
                    var reg1 = /^1[34578][0-9]{9}$/;
                    return reg1.test(val) || val === "root"
                }
            }
        },
        //密码
        "password": {
            method: function (val) {
                if (val == '') {
                    this.message = '不能为空!';
                    return false;
                } else {
                    this.message = "格式不正确!";
                    var reg = /^[\x21-\x7e]{4,16}$/;
                    return reg.test(val);
                }
            },
        },
        //一致性对比
        "identical": {
            method: function (val, compare) {
                return $("#" + compare).val() === val
            },
            message: "两次输入的密码不一致!"
        },
        "pwd_blank": {
            method: function (val) {
                if (val == '') {
                    return true
                }
                var reg = /^[\x21-\x7e]{4,16}$/;
                return reg.test(val);
            },

            message: "格式不正确!"
        },
        //姓名
        "name": {
            method: function (val) {
                var reg = /^[\u4e00-\u9fa5]{2,}$/;
                return reg.test(val);
            },
            message: "格式不正确!"
        },
        //手机号码检查
        "mobile": {
            method: function (val) {
                if (val == '') {
                    this.message = '不能为空!';
                    return false;
                } else {
                    this.message = '请填写正确的手机号码';
                    var reg = /^1[0-9]{10}$/;
                    return reg.test(val);
                }
            }
        },
        //软件版本号
        "software": {
            method: function (val) {
                if (val == '') {
                    this.message = '不能为空!';
                    return false;
                } else {
                    this.message = '请填写正确的版本号';
                    var reg = /^\d+\.\d+(\.\d+)*$/;
                    return reg.test(val);
                }
            }
        },
        //硬件版本号
        "hardware": {
            method: function (val) {
                if (val == '') {
                    this.message = '不能为空!';
                    return false;
                } else {
                    this.message = '请填写正确的版本号';
                    var reg = /^[v|V]\d+\.\d+\.\d+(\-\d{0,3})?$/;
                    return reg.test(val);
                }
            }
        },
        "upload": {
            /** 图片上传验证，限制格式与大小
             * @param {String} path - input file的值，物理路径
             * @param {String} picLimit - 图片的限制大小，单位为KB
             * @param {String} videoLimit - 视频的限制大小，单位为KB
             */
            method: function (path, picLimit, videoLimit) {
                if (path === '') return true;
                var picReg = /\.(jpg|jpeg|png|gif|bmp)$/i;
                var videoReg = /\.(mp4|ogg|webm)$/i;
                var type = picReg.test(path) ? "pic" : (videoReg.test(path) ? "video" : undefined);
                if (!type) {
                    this.message = "媒体资源格式不支持";
                    $(arguments[arguments.length - 1]).val('');
                    return false;
                }
                var limit = type === "pic" ? picLimit : videoLimit;
                //验证图片大小
                if (limit != undefined && !isNaN(Number(limit))) {
                    var elem = arguments[arguments.length - 1];
                    var fileSize = elem.files[0].size;
                    var size = fileSize / 1024;
                    var str;
                    if (limit / 1024 >= 1) {
                        if (limit / (1024 * 1024) >= 1) {
                            str = limit / (1024 * 1024) + 'GB!';
                        } else {
                            str = limit / 1024 + 'MB!';
                        }
                    } else {
                        str = limit + 'KB!';
                    }
                    if (size > parseInt(limit)) {
                        var preStr = type === "pic" ? "上传图片" : "上传视频";
                        this.message = preStr + "不能大于" + str;
                        $(arguments[arguments.length - 1]).val('');
                        return false;
                    }
                }
                return true;
            }
        }
    };

    function getVerifyObject(key) {
        var obj = VerifyImplication[key];
        if (typeof (obj) == "object" && obj.method) {
            return obj;
        } else {
            return null;
        }
    }

    function getVerfiyPars(doc, flag) {
        var verify = doc.attr('verify');
        if (doc.is(":disabled") || doc.is(":hidden") && flag != true) {
            doc.removeClass('has-error');
            return null;
        }
        if (typeof (verify) != "string") {
            return null;
        }
        verify = verify.toLowerCase().split(" ");
        verify = $.grep(verify, function (value, i) {
            value = $.trim(value);
            verify[i] = value;
            return value != '';
        });
        return verify;
    }

    function rmModaltip(el) {
        var hid = "";
        $("body .modal").each(function (index, element) {
            if ($(element).is(":visible")) {
                hid = $(element).attr("id");
                return false;
            }
        });

        if (hid != "") {
            var that = $("#" + hid + " .modal-footer .tip");
            if (that.length > 0) {
                var tip = el.closest(".form-group").find("label.control-label").html();
                var tip2 = that.html();
                if (tip2.indexOf(tip) > 0) {
                    that.html("");
                }
            }
        }
    }

    var verifyModalTip = function (h, t) {
        var tips;
        if (typeof h == "undefined") return false;
        if (typeof t != "undefined") {
            tips = h + " " + t;
        } else {
            tips = h;
        }

        var hmark = true;
        var hid = "";
        $("body .modal").each(function (index, element) {
            if ($(element).is(":visible")) {
                hmark = false;
                hid = $(element).attr("id");
                return false;
            }
        });

        if (hmark && $("body .modal-backdrop").length == 0 && Object.prototype.toString.call(createModalTips) === "[object Function]") {
            createModalTips(tips);
        } else if (typeof hid != "undefined" && hid != "" && $("#" + hid + " .modal-footer .tip").length > 0) {
            $("#" + hid + " .modal-footer .tip").html("<span title='" + tips + "'><i class='icon-remove-sign'></i> " + tips + "</span>");
        } else {
            alert(tips);
        }
        return false;
    };

    var verification = function (doc) {
        var res = true;
        if (!doc) doc = "body";

        $('input,textarea', doc).each(function () {
            var key,
                pars,
                obj;

            pars = getVerfiyPars($(this));
            if (!pars || pars.length < 1) {
                return true;
            }

            key = pars[0];
            obj = getVerifyObject(key);

            if (obj && obj.method) {
                pars[0] = $(this).val();
                //提供的参数个数不足时用undefined填补;
                for (i = pars.length; i < obj.method.length; i++) {
                    pars.push(undefined);
                }
                pars.push(this);
                res = obj.method.apply(obj, pars);
                if (res != true) {
                    var tips = "",
                        mtip = "",
                        tip = $(this).closest(".form-group").find("label.control-label").html() || "";

                    $(this).closest(".form-group").addClass('has-error');

                    verifyModalTip(mtip + tip, obj.message);
                    return false;
                } else {
                    $(this).closest(".form-group").removeClass('has-error');
                    rmModaltip($(this));
                }
            }
        });

        return res;
    };

    var verifyEventsInit = function (doc) {
        var res = true;
        if (!doc) doc = "body";

        $("input[type='radio'], input[type='checkbox'], select", doc).on("change", function () {
            var that = this;
            setTimeout(function () {
                $(that).closest("form").find("input, textarea").each(function (index, element) {
                    if ($(element).is(":disabled") && $(element).closest(".form-group").length > 0 && $(element).closest(".form-group").hasClass("has-error")) {
                        $(element).closest(".form-group").removeClass("has-error");
                        rmModaltip($(element));
                    }
                });
            }, 150);
        });

        $('input, textarea', doc).each(function () {
            var key,
                pars,
                obj,
                that = this;

            pars = getVerfiyPars($(that), true);
            if (!pars || pars.length < 1) {
                return true;
            }

            key = pars[0];
            obj = getVerifyObject(key);
            if (obj && obj.method) {
                $(that).on("blur keyup", function (e) {
                    if (e.type == "keyup" && !$(that).closest(".form-group").hasClass("has-error")) return false;
                    pars[0] = $(that).val();
                    if (pars[pars.length - 1] !== that) {
                        pars.push(that);
                    }
                    res = obj.method.apply(obj, pars);
                    if (res != true) {
                        $(that).closest(".form-group").addClass('has-error');
                    } else {
                        $(that).closest(".form-group").removeClass('has-error');
                        rmModaltip($(that));
                    }
                });
            }
        });
    }

    root.verification = verification; //直接显示调用
    root.verifyEventsInit = verifyEventsInit; //事件绑定触发方式调用
    root.verifyModalTip = verifyModalTip; //alert提示
})(window);