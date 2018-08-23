var oTab = createDt();

//获取列表
function createDt () {
    return $('#tableLi').dataTable({
        // "serverSide": true,
        "pagingType": "full_numbers",
        "ordering": false,
        "responsive": true,
        "info": true,
        "lengthChange": true,
        "lengthMenu": [[10, 15, 50, 100], [10, 15, 50, 100]],
        "language": {"url": LanguageHost},
        "ajax": {
            "url": cgiDtUrl('/src/json/data.json'),
            "error": cgiDtError,
            "type": "GET",
            "dataType": "json",
            "dataSrc": function (data) {
                console.log('data')
                return data.data.news;
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
                "data": "fromdeeduuid",
            },
            {
                "data": "todeeduuid",
            },
            {
                "data": "reason",
            },
            {
                "data": "type",
            },
            {
                "data": "result",
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