verifyEventsInit();
var oTab = createDt();

//获取列表
function createDt () {
    return $('#tableLi').dataTable({
        "pagingType": "full_numbers",
        "ordering": false,
        "responsive": true,
        "info": true,
        "lengthChange": true,
        "lengthMenu": [[10, 15, 50, 100], [10, 15, 50, 100]],
        "language": {"url": LanguageHost},
        "ajax": {
            "url": cgiDtUrl('/crmusers/findcrmusers'),
            "error": cgiDtError,
            "type": "GET",
            "dataType": "json",
            "dataSrc": function (data) {
                return data;
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
                "data": "phone"
            },
            {
                "data": "created"
            },
            {
                "data": "modified"
            },
            {
                "data": "role"
            },
            {
                "data": "uuid",
                "class": "all",
                "render": function (d, t, f) {
                    return '<div class="btn-group">' +
                        '<a class="btn btn-primary " onclick="editLi(this)" title="编辑"><i class="fa fa-pencil"></i></a>' +
                        '<a class="btn btn-danger " onclick="delLi(this)" data-toggle="tooltip" data-container="body" title="删除"><i class="fa fa-trash"></i></a>' +
                        '</div>';
                    return d;
                }
            },
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

$('#addAdminBtn').on('click',function(){
    $('#phone').val('');
    $('#password').val('');
    $('#addAdminModal').modal('show');
})

$('.submitItem').on('click',function(){
    if (!verification()) return;
    var item = {
        phone: "",
        password: "",
    };
    var obj = jsonTraversal(item, jsTravGet);//設值
    $.ajax({
        url: '/crmusers/addadmin',
        data: obj,
        dataType: "json",
        type: 'post',
        success: function (data) {
            $('#modal_tips').modal('hide');
            $('#addAdminModal').modal('hide');
            initData()
        }
    });
})

function editLi(that) {
    $('#newpassword').val('');
    $('#resetpassword').val('');
    var node = $(that).closest("tr");
    nodeEdit = oTab.api().row(node).data();
    $('#newphone').val(nodeEdit.phone);
    $('#changePassModal').modal('show')
}

function submitChangePass() {
    if (!verification()) return;
    var item = {
        phone: "",
        password:  "",
    };
    var obj = jsonTraversal(item, jsTravGet);//取值
    obj.phone = $('#newphone').val();
    obj.password = $('#resetpassword').val();
    $.ajax({
        url: cgiDtUrl('/crmusers/admin/' + nodeEdit.uuid),
        timeout:5000,
        type: 'put',
        data: obj,
        dataType: "json",
        success: function (data) {
            createModalTips(data.msg);
            $('#changePassModal').modal('hide');
            initData();
        }
    });
}

//删除该行列表数据
function delLi (that) {
    var node = $(that).closest("tr");
    nodeEdit = oTab.api().row(node).data();
    createModalTips('确定将删除该项,是否删除当前列表项!', 'doDelete')
}

function initData() {
    dtReloadData(oTab, false)
}


function doDelete () {
    $('#modal_tips').modal('hide');
    $.ajax({
        url: cgiDtUrl('/crmusers/' + nodeEdit.uuid),
        timeout:5000,
        type: 'delete',
        data:{
            uuid:nodeEdit.uuid
        },
        dataType:"json",
        success: function (data) {
            $('#modal_tips').modal('hide');
            initData()
        }
    });
}