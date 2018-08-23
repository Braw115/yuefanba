(function (root, undefined) {
    //添加Host地址, 覆盖重写beforeSend或url不以'/'开头时不会添加
    // var HOST = 'http://192.168.0.51:5000';//银仙
    // var HOST = 'http://localhost:63342/crm';//本/地
    var LanguageHost = 'json/language.json'
    // var HOST = 'http://192.168.0.71:5000/crm';//玉祥
    // var HOST = 'http://192.168.0.171:5000';
    var HOST = 'https://yuefanba.aefcm.com/crm';//域名
    
    
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (storage.read("uuid") && storage.read("token")) {
                xhr.setRequestHeader("uuid", storage.read("uuid"));
                xhr.setRequestHeader("token", storage.read("token"));
            }
            if (settings.url.substring(0, 1) == '/')
                settings.url = HOST + settings.url;
        }
    });
    
    function cgiDtUrl(str, obj) {
        var url = HOST + (str || "");
        return addUrlParam(url, obj);
    }
    
    getImgHost()
    
    function getImgHost() {
        // servImgUrl = 'https://' + location.host/
        servImgUrl = 'https://yuefanba.aefcm.com/image'//图片文件地址
        // servImgUrl = 'http://192.168.0.85:9000'//图片文件地址
        return servImgUrl;
    }
    
    //jquery ajax统一异常处理,设置global: false时不会捕获异常
    $(document).ajaxError(function (evt, req, settings) {
        layer.closeAll();
        if (req && req.status != 200 && req.status != 304) {
            switch (req.status) {
                case 0:
                    createModalTips('网络异常');
                    break;
                case 401:
                    if (req.responseJSON && req.responseJSON.error) {
                        createModalTips(req.responseJSON.error, "errorTipsCallBack");
                    } else if (req.responseText) {
                        createModalTips(JSON.parse(req.responseText).error, "errorTipsCallBack");
                    } else {
                        createModalTips('401', "errorTipsCallBack");
                    }
                    break;
                case 404:
                    if (req.responseJSON && req.responseJSON.error) {
                        createModalTips(req.responseJSON.error);
                    } else if (req.responseText) {
                        createModalTips(req.responseText.error);
                    } else {
                        createModalTips('资源不存在（404）');
                    }
                    break;
                case 500:
                    if (req.responseJSON.error) {
                        createModalTips('服务器错误, '+ req.responseJSON.error);
                    }
                    break;
                default:
                    if (req.responseJSON && req.responseJSON.error) {
                        createModalTips(req.responseJSON.error);
                    } else if (req.responseText) {
                        createModalTips(req.responseText.error);
                    } else {
                        createModalTips('系统异常');
                    }
            }
        }
        // console.log(req);
    });
    
    /**
     *  datatables统一异常处理,初始化时设置配置项
     *  @example
     *  $('#example').dataTable({
     *    ajax: {
     *      url: cgiDtUrl('/api',obj)
     *      error: cgiDtError
     *    }
     *  });
     */
    function cgiDtError(req) {
        if (req && req.status) {
            switch (req.status) {
                case 401:
                    createModalTips('您没有权限,是否跳转至登录页？', "errorTipsCallBack");
                    break;
                case 403:
                    createModalTips('没有权限');
                    break;
                // case 500:
                //     createModalTips('系统异常');
                //     break;
                default:
                    if (req.responseJSON && req.responseJSON.error) {
                        createModalTips(req.responseJSON.error);
                    } else if (req.responseText) {
                        createModalTips(req.responseText);
                    } else {
                        createModalTips('系统异常');
                    }
            }
        }
    }
    
    /*处理返回的数据,将其中的JSON字符串转换成对象*/
    function initBackDatas(obj) {
        var sobj = {};
        if (Object.prototype.toString.call(obj) === '[object Object]') {
            for (var k in obj) {
                var o;
                try {
                    if (typeof obj[k] === "object") {
                        throw new Error("");
                    } else if (!isNaN(obj[k])) {
                        throw new Error("");
                    } else {
                        o = JSON.parse(obj[k]);
                    }
                } catch (e) {
                    o = obj[k];
                    if (typeof o === "object") o = initBackDatas(o);
                }
                sobj[k] = o;
            }
        } else if (Object.prototype.toString.call(obj) === '[object Array]') {
            sobj = [];
            for (var i = 0, ien = obj.length; i < ien; i++) {
                var o;
                try {
                    if (typeof obj[i] === "object") {
                        throw new Error("");
                    } else if (!isNaN(obj[k])) {
                        throw new Error("");
                    } else {
                        o = JSON.parse(obj[i]);
                    }
                } catch (e) {
                    o = obj[i];
                    if (typeof o === "object") o = initBackDatas(o);
                }
                sobj.push(o)
            }
        } else {
            return obj;
        }
        return sobj;
    }
    
    /**
     * 取值与赋值函数
     * @param obj 取值或赋值数据结构
     * @param func 取值或赋值函数
     * @returns {*}
     */
    function jsonTraversal(obj, func) {
        var oset = ObjClone(obj);
        for (var k in oset) {
            if (typeof (oset[k]) == 'object' && oset[k] != null) {
                oset[k] = recurseTravSubNode(oset[k], k, func);
            } else {
                var fp = k;
                oset[k] = func(fp, oset[k]);
            }
        }
        return oset;
    }
    
    //遍历所有节点
    function recurseTravSubNode(o, parent, func) {
        var oset = ObjClone(o);
        for (var k in o) {
            var fp = parent + '__' + k;
            if (typeof (o[k]) == 'object') {
                //还有子节点.
                oset[k] = recurseTravSubNode(o[k], fp, func);
                
            } else {
                oset[k] = func(fp, o[k]);
            }
        }
        return oset;
    }
    
    //赋值函数
    function jsTravSet(fp, v) {
        var doc = getControlByIdMisc(fp),
            type = doc[0] && doc[0].type;
        
        switch (type) {
            case "checkbox":
                var arr = doc.val().split(" ");
                var str = v.toString();
                if (str == arr[0]) {
                    doc.prop("checked", true);
                } else {
                    doc.prop("checked", false);
                }
                break;
            
            case "radio":
                var that = doc.attr("name");
                $('input:radio[name="' + that + '"]').each(function (index, element) {
                    if ($(element).val() == v) {
                        $(element).prop("checked", true);
                    } else {
                        $(element).prop("checked", false);
                    }
                });
                break;
            case 'select-one':
                doc.val(String(v));
                break;
            default:
                doc.val(v);
                break;
        }
        
        return v;
    }
    
    //取值函数
    function jsTravGet(fp, v) {
        var nv,
            doc = getControlByIdMisc(fp),
            type = doc.attr('type');
        
        switch (type) {
            case 'checkbox':
                var arr = doc.val().split(" ");
                var str = v.toString();
                
                
                if (arr.length == 1) {
                    if (arr[0] == "1") {
                        arr[1] = "0";
                    } else if (arr[0] == "true") {
                        arr[1] = "false";
                    } else {
                        console.log(fp + 'checkbox value fail');
                    }
                }
                
                if (typeof v == "boolean") {
                    arr[0] = true;
                    arr[1] = false;
                } else if (typeof v == "number") {
                    arr[0] = parseInt(arr[0]);
                    arr[1] = parseInt(arr[1]);
                }
                
                nv = doc.is(":checked") ? arr[0] : arr[1];
                break;
            
            case 'radio':
                var that = doc.attr("name");
                nv = $('input:radio[name="' + that + '"]:checked').val();
                if (typeof v == "number") {
                    nv = parseInt(nv);
                }
                break;
            case 'select-one':
                nv = doc.val();
                if (nv === "true") {
                    nv = true
                }
                if (nv === "false") {
                    nv = false
                }
                break;
            default:
                nv = doc.val();
                break;
        }
        
        nv = (typeof (nv) == 'undefined' ? v : nv);
        
        if (typeof (v) == 'number') {
            nv = parseInt(nv);
        } else if (typeof (v) == 'string') {
            nv = $.trim(nv);
        }
        
        return nv;
    }
    
    //根据id获取元素
    function getControlByIdMisc(id) {
        //优先尝试input类型,其次select,再次ID.
        res = $('input#' + id);
        
        if (res.length < 1) {
            res = $('select#' + id);
        }
        if (res.length < 1) {
            res = $('#' + id);
        }
        return res;
    }
    
    //对象属性长度
    function ObjCountLength(o) {
        var t = typeof o;
        if (t == 'string') {
            return o.length;
        } else if (t == 'object') {
            var n = 0;
            for (var i in o) {
                n++;
            }
            return n;
        }
        return false;
    }
    
    //对象克隆
    function ObjClone(obj) {
        var o;
        if (typeof obj == "object") {
            if (obj === null) {
                o = null;
            } else {
                if (obj instanceof Array) {
                    o = [];
                    for (var i = 0, len = obj.length; i < len; i++) {
                        o.push(ObjClone(obj[i]));
                    }
                } else {
                    o = {};
                    for (var j in obj) {
                        o[j] = ObjClone(obj[j]);
                    }
                }
            }
        } else {
            o = obj;
        }
        return o;
    }
    
    //对象转数组
    function dtObjToArray(o) {
        var arr = [],
            obj = ObjClone(o);
        
        if (typeof obj == 'object') {
            if (Object.prototype.toString.call(obj) === '[object Array]') {
                arr = obj;
            } else if (Object.prototype.toString.call(obj) === '[object Object]') {
                for (key in obj) {
                    arr.push(obj[key]);
                }
            } else {
                arr.push(obj);
            }
        } else {
            arr.push(obj);
        }
        return arr;
    }
    
    /**
     * 重新加载datatables, 常在对datatables进行增删查改后执行
     * @param table datatables实例对象
     * @param bool 是否重置分页
     * @param func 回调函数
     */
    function dtReloadData(table, bool, func) {
        var callback = null;
        if (typeof func == "function") {
            callback = func;
        }
        table.api().ajax.reload(callback, bool); //false 保存分页
    }
    
    function dtRrawData(table, data) {
        table.api().clear().draw();
        if (ObjCountLength(data) == 0) return;
        table.api().rows.add(dtObjToArray(data)).draw();
    }
    
    function dtHideColumn(table, hd) {
        table.api().columns().visible(true);
        for (var i = 0; i < hd.length; i++) {
            var num = parseInt(hd[i]);
            if (num < 0) continue;
            var column = table.api().column(num);
            column.visible(false);
        }
    }
    
    /**
     * 获取datatables中所有选中的行的数据
     * @param table
     * @returns {Array}
     */
    function dtGetSelected(table) {
        var arr = [];
        var drows = table.api().rows(".row_selected").data();
        for (var i = 0; i < drows.length; i++) {
            arr.push(drows[i])
        }
        return arr;
    }
    
    /**
     * 勾选datatables当前页
     * @param that
     * @param table
     */
    function dtSelectAll(that, table) {
        var check = $(that).is(":checked");
        table.find('tbody tr').each(function (index, element) {
            var row = $(element);
            if (row.find('td input[type="checkbox"]').is(":disabled")) return true;
            row.find('td input[type="checkbox"]').prop("checked", check);
            row_select_event(row);
        });
    }
    
    /**
     * datatables checkbox绑定事件
     * @param row
     * @example
     *  $('#example').dataTable({
     *   "rowCallback": function (row, data, index) {
     *       dtBindRowSelectEvents(row);
     *    }
     *  });
     */
    function dtBindRowSelectEvents(row) {
        var that = $(row);
        that.find('td input[type="checkbox"]').off('click', function () {
            row_select_event(that)
        });
        that.find('td input[type="checkbox"]').on('click', function () {
            row_select_event(that)
        });
    }
    
    function row_select_event(that) {
        if (that.find('td input[type="checkbox"]').is(":checked")) {
            that.addClass("row_selected");
        } else {
            that.removeClass("row_selected");
        }
    }
    
    /**
     * 弹出提示模态框
     * @param tip
     * @param e
     */
    function createModalTips(tip, e) {
        $("#modal_tips .modal-p span").html(tip);
        $("#modal_tips .modal-footer .btn-modal").remove();
        
        if (typeof (e) != "undefined") {
            var input = '<input type="button" class="btn btn-primary btn-modal" onclick="' + e + '()" value="确定" />';
            $("#modal_tips .modal-footer").append(input);
        }
        $("#modal_tips").modal("show");
    }
    
    //url添加参数
    function addUrlParam(url, obj) {
        if (obj === undefined) return url;
        var str = [];
        for (var p in obj)
            if (obj.hasOwnProperty(p)) {
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            }
        if (url.indexOf("?") !== -1) {
            return url + "&" + str.join("&");
        } else {
            return url + "?" + str.join("&");
        }
    }
    
    //url设置参数
    function setUrlParam(src, key, val) {
        var reg = eval('/(' + key + '=)([^&]*)/gi');
        var nUrl = src.replace(reg, key + '=' + val);
        return nUrl;
    }
    
    //url获取参数
    function getUrlParam(src, val) {
        var reg = new RegExp("(^|\\?|&)" + val + "=([^&#]*)(\\s|&|$|#)", "i");
        if (reg.test(src)) return unescape(RegExp.$2);
        return "";
    }
    
    //
    function write(key, value) {
        if (value) {
            value = JSON.stringify(value);
        }
        localStorage.setItem(key, value);
    }
    
    function read(key) {
        var value = localStorage.getItem(key);
        if (value && value != "undefined" && value != "null") {
            return JSON.parse(value);
        }
        return null;
    }
    
    function remove(key) {
        localStorage.removeItem(key);
    }
    
    function clear(key) {
        localStorage.clear();
    }
    
    /* cgi */
    root.LanguageHost = LanguageHost;
    root.cgiDtUrl = cgiDtUrl; //datatable的ajax的URL
    root.cgiDtError = cgiDtError; //datatable请求失败的回调函数
    root.initBackDatas = initBackDatas; //初始化回调数据
    root.jsonTraversal = jsonTraversal; //取值赋值入口
    root.jsTravGet = jsTravGet; //取值
    root.jsTravSet = jsTravSet; //赋值
    root.getHost = function () {
        return HOST;
    };
    /* object */
    root.ObjCountLength = ObjCountLength; //对象长度
    root.ObjClone = ObjClone; //对象克隆
    root.createModalTips = createModalTips; //创建提示模态框
    root.addUrlParam = addUrlParam; //URL添加参数
    root.setUrlParam = setUrlParam; //URL设置参数
    root.getUrlParam = getUrlParam; //URL获取参数
    
    /* 本地存储 */
    root.storage = {
        write: write, //设置参数
        read: read, //读取参数
        remove: remove, //移除参数
        clear: clear //清空本地存储
    };
    
    /* datatable */
    root.dtObjToArray = dtObjToArray; //对象强制转数组 去适应datatable
    root.dtReloadData = dtReloadData; //刷新datatable
    root.dtRrawData = dtRrawData; //重绘datatable
    root.dtHideColumn = dtHideColumn; //隐藏datatable列
    root.dtGetSelected = dtGetSelected; //获取datatable选中的列
    root.dtSelectAll = dtSelectAll; //选中所有datatable列
    root.dtBindRowSelectEvents = dtBindRowSelectEvents; //绑定选择事件
})(window);

/*日期格式化方法*/
Date.prototype.format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
    }
    return fmt;
};

//datatables错误提示
$.fn.dataTable.ext.errMode = 'throw';

//ajax--无相应权限提示跳转
function errorTipsCallBack() {
    window.location.href = 'index.html';
}

//跳转对应地址执行script
function loadContent(urlPre) {
    $(".content").load(urlPre + '.html', function() {
        $.ajax({
            type: 'GET',
            dataType: 'script',
            cache: true,
            global: false,
            url: urlPre + '.js',
            complete: function() {
                $("body .modal").on("hidden.bs.modal", function() {
                    $("#modal_tips").modal('hide');
                    $(".has-error", this).removeClass("has-error");
                    $(".modal-footer .tip", this).html("");
                })
            }
        });
    });
}

//加载中
$(document).ajaxStart(function() {
    layer.load(2, {
        shade: [0.1, '#fff'] //0.1透明度的白色背景
    });
}).ajaxStop(function() {
    layer.closeAll();
}).ajaxComplete(function() {
    layer.closeAll();
})

function lessThan10 (num) {
    var str
    if (num < 10) {str = '0' + num}else{str = num}
    return str;
}