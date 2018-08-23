getPrice();
verifyEventsInit();
$('.nav>li').on('click', function () {
    getPrice();
})

function getPrice () {
    $.ajax({
        type: "get",
        url: cgiDtUrl('/systeam/'),
        success: function (res) {
            res = initBackDatas(res);
            res.forEach(function (ele, idx) {
                if (ele.key === "remind") {
                    $('#save_config').show();
                    $('#switch-on').prop("checked", true);
                    $('#secret').val(ele.value['secret'])
                    $('#appkey').val(ele.value['appkey'])
                    $('#templateid').val(ele.value['templateid']);
                } else if (ele.key === "pay") {
                    $('#recharge1').val(ele.value['recharge'][0])
                    $('#recharge2').val(ele.value['recharge'][1])
                    $('#recharge3').val(ele.value['recharge'][2])
                    $('#recharge4').val(ele.value['recharge'][3])
                    $('#proportion').val(ele.value['proportion'])
                    $('#least').val(ele.value['least']);
                } else if (ele.key === "orderstimeout") {
                    $("#" + ele.key + "").val(ele.value['timeout']);
                } else {
                    $("#" + ele.key + "").val(ele.value[ele.key]);
                }
            }, this);
        }
    });
}

//支付设置
$('#save_pay').on('click', function () {
    if (!verification()) return;
    let data = {
        key: 'pay', value: JSON.stringify({
            least: $('#least').val(),
            proportion: $('#proportion').val(),
            recharge: [$('#recharge1').val(), $('#recharge2').val(), $('#recharge3').val(), $('#recharge4').val()]
        })
    }
    $.ajax({
        type: 'post',
        url: cgiDtUrl('/systeam/new'),
        data: data,
        dataType: 'json',
        success: function (d) {
            createModalTips("设置成功");
        },
        error: function (e) {
            createModalTips(e);
        }
    });
});

//诚意金设置
$('#save_deposit').on('click', function () {
    if (!verification()) return;
    $.ajax({
        type: 'post',
        url: cgiDtUrl('/systeam/new'),
        data: {key: 'deposit', value: JSON.stringify({deposit: $("#deposit").val()})},
        dataType: 'json',
        success: function (d) {
            createModalTips("设置成功");
        },
        error: function (e) {
            createModalTips(e);
        }
    });
});

//短信设置
$('#save_mail').on('click', function () {
    if (!verification()) return;
    createModalTips('修改短信设置将会导致之前的短信发送无法使用,是否修改短信设置?',"doSave");
});

function doSave(){
    let data = {
        key: 'remind', value: JSON.stringify({
            secret: $('#secret').val(),
            appkey: $('#appkey').val(),
            templateid: $('#templateid').val()
        })
    }
    $.ajax({
        type: 'post',
        url: cgiDtUrl('/systeam/new'),
        data: data,
        dataType: 'json',
        success: function (d) {
            createModalTips("设置成功");
        },
        error: function (e) {
            createModalTips(e);
        }
    });
}

// 超时时长设置：
$('#save_timer').on('click', function () {
    if (!verification()) return;
    $.ajax({
        type: 'post',
        url: cgiDtUrl('/systeam/new'),
        data: {key: 'orderstimeout', value: JSON.stringify({timeout: $("#orderstimeout").val()})},
        dataType: 'json',
        success: function (d) {
            createModalTips("设置成功");
        },
        error: function (e) {
            createModalTips(e);
        }
    });
});