var oTab = createDt();

//获取列表
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
            "url": cgiDtUrl('/paylog/paylist', {type: 'all'}),
            "error": cgiDtError,
            "type": "GET",
            "dataType": "json",
            "dataSrc": function (data) {
                return data.payList;
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
            },
            {
                "data": "deeduuid",
            },
            {
                "data": "type",
                "render": function (d) {
                    var str;
                    switch (d) {
                        case "deposit":
                            str = '提交押金';
                            break;
                        case "paydeed":
                            str = '赏金花费';
                            break;
                        case "withdraw":
                            str = '提现';
                            break;
                        case "recharge":
                            str = '充值';
                            break;
                        case "makedeed":
                            str = '赚取赏金';
                            break;
                        case "backdeed":
                            str = '赏金回退';
                            break;
                        case "depositback":
                            str = '押金回退';
                            break;
                    }
                    return str;
                }
            },
            {
                "data": "coin",
            },
            {
                "data": "orderuuid",
            },
            {
                "data": "created",
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