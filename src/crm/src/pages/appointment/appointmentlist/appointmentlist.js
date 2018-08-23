initEvents()
createInitModal()

var ageOptions = [
    [ageToBirth(200), ageToBirth(18)],
    [ageToBirth(25), ageToBirth(0)],
    [ageToBirth(30), ageToBirth(25)],
    [ageToBirth(200), ageToBirth(30)]
];

function ageToBirth (age) {
    let d = new Date();
    return d.setFullYear(d.getFullYear() - age);
}

var oTab = createDt();

function createDt () {
    return $('#tableLi').dataTable({
        "serverSide": true,
        "pagingType": "full_numbers",
        "ordering": false,
        "responsive": true,
        "info": true,
        "lengthChange": true,
        "lengthMenu": [[10, 15, 50, 100], [10, 15, 50, 100]],
        "language": {"url": LanguageHost},
        "ajax": {
            "url": cgiDtUrl('/crm/deed/', {
                state: 'all',
                type: 'all',
                result: 'all',
                address: '',
                restaurant: ''
            }),
            "error": cgiDtError,
            "type": "GET",
            "dataType": "json",
            "dataSrc": function (data) {
                return data.deeds;
            }
        },
        "columns": [
            {
                "data": null,
                "className": "all",
                "orderable": false,
                "searchable": false,
            },
            {
                "data": "useruuid"
            },
            {
                "data": "address"
            },
            {
                "data": "restaurant"
            },
            {
                "data": "payway",
                "render": function (d) {
                    var str;
                    switch (d) {
                        case 'me':
                            str = '我买单'
                            break;
                        case 'aa':
                            str = 'AA制度'
                            break;
                        default:
                            str = d;
                    }
                    return str;
                }
            },
            {
                "data": "deposit"
            },
            {
                "data": "type",
                "render": function (d) {
                    var str = '';
                    switch (d) {
                        case 'nearby':
                            str = '附近约饭';
                            break;
                        case 'make':
                            str = '我要赚钱';
                            break;
                        case 'spend':
                            str = '我要花钱';
                            break;
                    }
                    return str;
                }
            },
            {
                "data": "state",
                "class": "all",
                "render": function (d, t, f) {
                    var str;
                    d ? str = '已匹配' : str = '未匹配'
                    return str;
                }
            },
            {
                "data": "onetoone",
                "render": function (d, t, f) {
                    var str;
                    d ? str = '是' : str = '否'
                    return str;
                }
            },
            {
                "data": "istimeout",
                "render": function (d, t, f) {
                    var str;
                    d ? str = '是' : str = '否'
                    return str;
                }
            },
            {
                "data": "result",
                "render": function (d) {
                    var str;
                    switch (d) {
                        case 'waitfeedback':
                            str = '待反馈';
                            break;
                        case 'go':
                            str = '已应约';
                            break;
                        case 'notgo':
                            str = '放鸽子';
                            break;
                    }
                    return str;
                }
            }, {
                "data": "mealtime",
                "render": function (d) {
                    var str;
                    if (d) {
                        str = "<div>" + d[0] + "</div>" + "<div>" + d[1] + "</div>";
                    } else {
                        str = d;
                    }
                    return str;
                }
            },
            {
                "data": "created"
            },
            {
                data: 'uuid',
                render: function (d, t, r) {
                  return (
                    '<div class="btn-group btn-group-sm" style="min-width:100px">' +
                  ` <a class="btn btn-danger btn_delete" data-toggle="tooltip" data-container="body" onclick="deleteData(this)" title="删除"><i class="fa fa-trash"></i></a>`
                    + '</div>'
                  )
                }
              }
        ],
        "rowCallback": function (row, data, index) {
            $(row).find("td:first").html(index + 1);
        },
        "drawCallback": function () {
            var role = $.cookie("role");
            $('.' + role).remove();
        }
    });
}
// 删除契约单
// function deleteData (that) {
//     var node = $(that).closest('tr')
//     nodeEdit = oTab
//       .api()
//       .row(node)
//       .data()
//     createModalTips('确定要删除该检查项？', 'confirmDeleteData')
//   }
  
//   function confirmDeleteData () {
//     console.log(nodeEdit)
//     $.ajax({
//       url: '/crmgoods/' + nodeEdit.uuid,
//       type: 'delete',
//       success: function (data) {
//         createModalTips(data.msg || '删除成功！')
//         oTab.api().ajax.reload(null, false)
//       }
//     })
//   }

function initData () {
    dtReloadData(oTab, false)
}

if (storage.read('appUserData')) {
    storage.read('appUserData').nickname ? $('.userMsg').text(storage.read('appUserData').nickname) : $('.userMsg').text(storage.read('appUserData').phone);
    $('.nowUser').css('display', 'inline');
    $('#addBtnBox').css('display', 'inline');
    $('#addDeed').css('display', 'inline-block');
    
}

function initEvents () {
    $('#addDeed').on("click", addDeed)
    var nowTime = new Date();
    var hour = nowTime.getHours() < 10 ? "0" + nowTime.getHours() : nowTime.getHours();
    var minute = nowTime.getMinutes() < 10 ? "0" + nowTime.getMinutes() : nowTime.getMinutes();
    var second = nowTime.getSeconds() < 10 ? "0" + nowTime.getSeconds() : nowTime.getSeconds();
    var nowDate = nowTime.getFullYear() + '-' + lessThan10(nowTime.getMonth() + 1) + '-' + lessThan10(nowTime.getDate());
    var nowTimer = hour + ':' + minute + ':' + second;
    
    laydate.render({
        elem: '#starttime',
        value: nowDate + " " + nowTimer,
        min: nowDate + " " + nowTimer,
        max: afterTime(nowTime.getTime(),24*15),
        type: 'datetime',
        done: function(value){//控件选择完毕后的回调---点击日期、清空、现在、确定均会触发。
            var timer = split_time(value);
            $('#endtime').val(afterTime(timer,2));
        }
        
    });
    laydate.render({
        elem: '#endtime',
        value: afterTime(nowTime.getTime(),10),
        // value: nowDate + " " + nowTimer,
        min: nowDate + " " + nowTimer,
        istime: true,
        istoday: false,
        type: 'datetime',
    });
    $('#restaurant').on('focus', function () {
        searchRestaurant($('#restaurant').val());
    });
    // $('#restaurant').on('blur',function(){
    //     $('.restaurant-list').css('display','none');
    // });
    $('#restaurant').on('input propertychange ', function () {
        throttle(searchRestaurant, $('#restaurant').val());
    });
    
    $('.restaurant-list').on('click', '.restaurant_item', changeAddress);
    
    // $('#starttime').on('change',function(){
    //     console.log('起始时间',$('#starttime').val());
    //     $('#endtime').val(afterTime(split_time($('#starttime').val()),2))
    // })
}


function split_time(time){//将当前时间转换成时间搓 例如
    var arr=time.split(" ");
    var day=arr[0].split("-");
    var hour=arr[1].split(":");
    return Date.UTC(day[0],(day[1]-1),day[2],hour[0],hour[1],hour[2]); //将当前时间转换成时间搓
}

function afterTime(beforeTime,hournum){
    var endTime = new Date((beforeTime)+3600000*(hournum-8));//1.小时=3600000毫秒 东八区时间差8小时
    var endhour = endTime.getHours() < 10 ? "0" + endTime.getHours() : endTime.getHours();
    var endminute = endTime.getMinutes() < 10 ? "0" + endTime.getMinutes() : endTime.getMinutes();
    var endsecond = endTime.getSeconds() < 10 ? "0" + endTime.getSeconds() : endTime.getSeconds();
    var endDate = endTime.getFullYear() + '-' + lessThan10(endTime.getMonth() + 1) + '-' + lessThan10(endTime.getDate());
    var endTimer = endhour + ':' + endminute + ':' + endsecond;
    return endDate + " " + endTimer
}

function changeAddress () {
    $('#restaurant').val($(this).find('div').text());
    $('#address').val($(this).find('span').text());
    $('.restaurant-list').css('display', 'none');
}

//节流函数
function throttle (method, ...param) {
    clearTimeout(method.tId);
    method.tId = setTimeout(function () {
        method(...param);
    }, 500);
}

function switchShow (type) {
    $('.makeBox').css('display', 'none');
    $('.spendBox').css('display', 'none');
    $('.nearbyBox').css('display', 'none');
    $('.' + type + 'Box').css('display', 'block');
}

function addDeed () {
    switchShow($('#type').find("option:selected").val())
    $('.typeMsg').text($('#type').find("option:selected").text())
    $('#addDeedModal').modal('show');
}

function searchRestaurant (key) {
    $.ajax({
        url: '/crm/restaurant?key=' + key + '&length=20&start=0&city=深圳',
        type: 'GET',
        success: function (data) {
            $('.restaurant-list').html('');
            if (!data) return
            $('.restaurant-list').css('display', 'block');
            var str = ''
            for (i = 0; i < data.restaurants.pois.length; i++) {
                str += `<div class="restaurant_item"><div>` + data.restaurants.pois[i].name + `</div>(<span>` + data.restaurants.pois[i].address + `</span>)</div>`
            }
            $('.restaurant-list').html(str);
        }
    })
}

function createInitModal () {
    $("#addDeedModal").modal({
        "backdrop": "static",//点遮罩层不会消失
        "show": false
    });
}

function submitAddData () {
    if (!verification()) return;
    if (new Date($('#starttime').val()).getTime() > new Date($('#endtime').val()).getTime()) {
        createModalTips('开始时间不能大于结束时间!');
        return;
    }
    if (new Date($('#starttime').val()).getTime() > new Date().getTime()) {
        createModalTips('附近约饭不能选当天以外的开始时间!');
        return;
    }
    var obj, item = {
            type: "",
            address: "",
            restaurant: "",
            gender: "",
        },
        obj = jsonTraversal(item, jsTravGet);//取值
    obj.useruuid = storage.read('appUserData').uuid;
    obj.agerange = JSON.stringify(ageOptions[$('.agerangeSelect').val()]);
    
    obj.mealtime = JSON.stringify([new Date($('#starttime').val()).getTime(), new Date($('#endtime').val()).getTime()]);
    switch ($('#type').find("option:selected").val()) {
        case "nearby":
            obj.latitude = $('#latitude').val();
            obj.longitude = $('#longitude').val();
            obj.payway = $('#payway').val();
            break;
        case "spend":
            obj.latitude = $('#latitude').val();
            obj.longitude = $('#longitude').val();
            obj.posit = $('#posit').val();
            break;
        case "make":
            if (Number($('#getposit1').val()) > Number($('#getposit2').val())) {
                createModalTips('诚意金范围区间输入错误!');
                return;
            }
            obj.getposit = JSON.stringify([$('#getposit1').val(), $('#getposit2').val()]);
            break;
    }
    $.ajax({
        url: cgiDtUrl('/crm/deed/'),
        data: obj,
        timeout: 3700,
        dataType: "json",
        type: "post",
        success: function (data) {
            initData();
            $('#addDeedModal').modal('hide');
        }
    })
}

function changeData () {
    var type = $('.typeSelect').val();
    var state = $('.stateSelect').val();
    var result = $('.resultSelect').val();
    oTab.api().ajax.url(cgiDtUrl('/crm/deed/', {
        type: type, state: state, result: result, address: '',
        restaurant: ''
    })).load();
}

// function calcAge(date, when) {
//     date = date == +date ? +date : date;
//     when = when == +when ? +when : when;
//     let d = date instanceof Date ? date : new Date(date);
//     if (d.valueOf() !== d.valueOf()) return -1;
//     let now = when ? new Date(when) : new Date();
//     let age = now.getFullYear() - d.getFullYear();
//     if (now.getMonth() - d.getMonth() < 0) age--;
//     return age;
// }
//
// let ageStr;
// let maxAge = calcAge(latest.agerange[0], latest.created);
// let minAge = calcAge(latest.agerange[1], latest.created);
// if (maxAge === 200) {
//     if (minAge === 0) {
//         ageStr = '不限'
//     } else {
//         ageStr = minAge + '以上'
//     }
// } else if (minAge === 0) {
//     ageStr = maxAge + '以下'
// } else {
//     ageStr = minAge + '~' + maxAge;
// }
