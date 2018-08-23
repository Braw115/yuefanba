initEvents()
createInitModal()

var ageOptions = [
    [ageToBirth(200), ageToBirth(0)],
    [ageToBirth(25), ageToBirth(0)],
    [ageToBirth(35), ageToBirth(25)],
    [ageToBirth(200), ageToBirth(35)]
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
            "url": cgiDtUrl('/crm/appeal/list'),
            "error": cgiDtError,
            "type": "GET",
            "dataType": "json",
            "dataSrc": function (data) {
                return data.appealList;
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
                "data": "appealernick"
            },
            {
                "data": "appealerphone"
            },
            {
                "data": "appealednick"
            },
            {
                "data": "appealedphone"
            },
            {
                "data": "orderuuid"
            },
            {
                "data": "content"
            },
            {
                "data": "created"
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

function initData () {
    dtReloadData(oTab, false)
}

if (storage.read('appUserData')) {
    storage.read('appUserData').nickname ? $('.userMsg').text(storage.read('appUserData').nickname) : $('.userMsg').text(storage.read('appUserData').phone);
    $('.nowUser').css('display', 'inline');
    $('#addBtnBox').css('display', 'inline');
}

function initEvents () {
    $('#addDeed').on("click", addDeed)
    var date = new Date();
    var nowTimer = date.getFullYear() + '-' + lessThan10(date.getMonth() + 1) + '-' + lessThan10(date.getDate());
    laydate.render({
        elem: '#starttime',
        value: '1989-10-14 00:00:00',
        type: 'datetime'
    });
    laydate.render({
        elem: '#endtime',
        value: nowTimer + " 00:00:00",
        max: nowTimer + " 23:59:59",
        istime: true,
        istoday: false,
        type: 'datetime'
    });
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

function createInitModal () {
    $("#addDeedModal").modal({
        "backdrop": "static",//点遮罩层不会消失
        "show": false
    });
}

function submitAddData () {
    if(!verification()) return;
    if(new Date($('#starttime').val()).getTime() > new Date($('#endtime').val()).getTime()){
        createModalTips('开始时间不能大于结束时间!');
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
            if(Number($('#getposit1').val()) > Number($('#getposit2').val())){
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
            initData ();
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
