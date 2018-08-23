initEvents()
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
            "url": cgiDtUrl('/crmlog/', {starttime: $('#starttime').val(), endtime: $('#endtime').val()}),
            "error": cgiDtError,
            "type": "GET",
            "dataType": "json",
            "dataSrc": function (data) {
                return data.crmlog;
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
                "data": "useruuid",
                "render": function (d, t, f) {
                    var str = d;
                    return str;
                }
            },
            {
                "data": "phone",
                "render": function (d, t, f) {
                    var str = d;
                    return str;
                }
            },
            {
                "data": "ip",
                "render": function (d, t, f) {
                    var str = d;
                    return str;
                }
            },
            {
                "data": "operation",
                "render": function (d, t, f) {
                    var str = d;
                    return str;
                }
            },
            {
                "data": "created",
                "render": function (d, t, f) {
                    var str = d;
                    return str;
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

function initEvents () {
    var date = new Date();
    var nowTimer = date.getFullYear() + '-' + lessThan10(date.getMonth() + 1) + '-' + lessThan10(date.getDate());
    laydate.render({
        elem: '#starttime'
        , value: '1989-10-14'
    });
    laydate.render({
        elem: '#endtime'
        , value: nowTimer
    });
}

function selectOperationRcd () {
    var starttime = $('#starttime').val();
    var endtime = $('#endtime').val();
    if ($('#starttime').val() > $('#endtime').val()) {
        createModalTips('开始时间不能大于结束时间');
        return;
    }
    oTab.api().ajax.url(cgiDtUrl('/crmlog/', {starttime: starttime, endtime: endtime})).load();
}
