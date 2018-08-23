var oTab,
    opr = "add";//切换添加和编辑

oTab = createDt();
createInitModal();
verifyEventsInit();
initEvents();

//获取轮播列表
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
            "url": cgiDtUrl('/crmbanner/bannerlist', {start: 0, length: 10, draw: 1, state: "all"}),
            "error": cgiDtError,
            "type": "GET",
            "timeout": 60000,
            "dataType": "json",
            "dataSrc": function (data) {
                return data.bannerList;
            }
        },
        "rowCallback": function (row, data, index) {
            if (data.pic != '') {
                $('td:eq(1)', row).css('height', '95px');
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
                "data": "img",
                "render": function (d) {
                    if (d != undefined && d != '') {
                        d = `<a href="` + servImgUrl + d + `" rel="lightbox">
                            <img class="max-250" src="` + servImgUrl + d + `" alt="轮播图">
                            </a>`;
                    } else if (d == undefined || d == '') {
                        return d = '暂无内容';
                    }
                    return d;
                }
            },
            {
                "data": "url",
                "render": function (d) {
                    if (d && d.length > 25) {
                        d = d.substring(0, 25) + '...';
                    }
                    return d || '暂无内容';
                }
            },
            {
                "data": "description",
                "render": function (d) {
                    if (d && d.length > 12) {
                        d = d.substring(0, 12) + '...';
                    }
                    return d || '暂无内容';
                }
            },
            {
                "data": "priority"
            },
            {
                "data": "state",
                "render": function (d) {
                    var str;
                    d ? str = '已上线' : str = '已下线'
                    return str;
                }
            },
            {
                "data": "uuid",
                "class": "all",
                "render": function (d, t, f) {
                    return '<div class="btn-group btn-group-sm goodsRO" style="min-width:80px;">' +
                        '<a class="btn btn-purple" onclick="editLi(this)" title="编辑"><i class="fa fa-pencil"></i></a>' +
                        '<a class="btn btn-purple" onclick="editBanner(this)" title="编辑轮播"><i class="fa fa-picture-o"></i></a>' +
                        '<a class="btn btn-danger " onclick="delLi(this)" data-toggle="tooltip" data-container="body" title="删除"><i class="fa fa-trash"></i></a>' +
                        '</div>';
                }
            },
        ],
        "rowCallback": function (row, data, index) {
            $(row).find("td:first").html(index + 1);
            if (data.url != '') {
                $('td:eq(2)', row).attr('title', data.url).css('cursor', 'help');
                
            }
            if (data.description != '') {
                $('td:eq(3)', row).attr('title', data.description).css('cursor', 'help');
            }
            index + 1 >= 5 ? $('#addShopBan').css('display', 'none') : $('#addShopBan').css('display', 'inline-block');
        },
        "drawCallback": function () {
            var role = $.cookie("role");
            $('.' + role).remove();
            $("body > div.tooltip").remove();
            $('[data-toggle="tooltip"]').tooltip();
        }
    });
}

function initData () {
    dtReloadData(oTab, false)
}

function initEvents () {
    $("#addShopBan").on("click", onAdd);
    $(".submitItem").on("click", doSave);
    $('[data-toggle="tooltip"]').tooltip();
    $('.modalPosi').on('mouseover', '.editImgShow', function (e) {
        $(e.target).parent().find('.delImg').css('display', 'block');
    });
    $('.modalPosi').on('mouseout', '.editImgShow', function (e) {
        $(e.target).parent().find('.delImg').css('display', 'none');
    })
}

function createInitModal () {
    $("#modalEdit").modal({
        "backdrop": "static",//点遮罩层不会消失
        "show": false
    });
}

function switchModal (elem) {
    $('.imgCont').css('display', 'none')
    $('.editBanTip').css('display', 'none')
    $(elem).css('display', 'block')
}

function onAdd () {
    opr = "add";
    var item = {
        url: '',
        description: '',
        priority: 1,
        state: false
    };
    var obj = jsonTraversal(item, jsTravSet);//取值
    switchModal('.editBanTip');
    $('#bannerModal .submitItem').css('display', 'inline');
    $(".form-group").find("i").attr('class', 'fa fa-exclamation-circle');
    $('#myModalLabel').html('添加轮播图');
    $('#bannerModal').modal('show');
}

function doSave () {
    if (!verification()) return;
    var urlStr, typeStr;
    if (opr == 'add') {
        urlStr = '/crmbanner/insert';
        typeStr = 'post'
    } else if (opr == 'edit') {
        urlStr = '/crmbanner/' + nodeEdit.uuid;
        typeStr = 'put'
    }
    var item = {
        url: '',
        description: '',
        priority: '',
        state: ''
    };
    var obj = jsonTraversal(item, jsTravGet);//取值
    $.ajax({
        url: urlStr,
        type: typeStr,
        timeout: 30000,
        dataType: 'json',
        data: obj,
        success: function (data) {
            $('#bannerModal').modal('hide');
            initData();
        }
    });
}

//显示图片上传按钮
function editBanner (that) {
    var node = $(that).closest("tr");
    nodeEdit = oTab.api().row(node).data();
    switchModal('.imgCont');
    $('.submitItem').css('display', 'none');
    $(".editImgShow img").remove();
    if (nodeEdit.img) {
        $('.editImg').css('display', 'none');
        $(".editImgShow").append('<img class="maxH250"  src="' + servImgUrl + nodeEdit.img + '" alt="轮播图">');
    }else {
        $('.editImg').css('display', 'block');
    }
    $('#bannerModal').modal('show');
}

//图片上传
function uploadImg () {
    $("#editBanForm").ajaxSubmit({
        url: cgiDtUrl('/crmbanner/'),
        type: 'post',
        data: {url: '', uuid: nodeEdit.uuid},
        dataType: 'json',
        success: function (data) {
            $('.editImg').css('display', 'none');
            $(".editImgShow img").remove();
            $(".editBanImgShow").css('display', 'block');
            $(".editImgShow").append('<img class="maxH250" style="width:100%;height:250px;" src="' + servImgUrl + data.data.path + '" alt="轮播图">');
            initData();
            $(window).resize();
        },
        complete: function () {
            $('#editFile').prop('disabled', false);
        },
        error: function (e) {
            createModalTips(e);
        }
    })
    $('#editFile').prop('disabled', true);
}

//删除添加的图片
function delImg () {
    createModalTips('是否删除当前图片', 'doDeleteImg');
}

function doDeleteImg () {
    var picname = '/banner' + $('.modalPosi img').eq(0).attr('src').split('/banner')[1]
    $.ajax({
        url: '/crmbanner/media',
        type: 'delete',
        data: {
            url: picname,
            uuid: nodeEdit.uuid,
        },
        success: function (data) {
            $(".editImgShow img").remove();
            $('.delImg').css('display', 'none');
            $('.editImg').css('display', 'block');
            initData();
        },
        error: function (e) {
            createModalTips("删除图片出错了！");
        }
    })
}

//删除该行列表数据
function delLi (that) {
    var node = $(that).closest("tr");
    nodeEdit = oTab.api().row(node).data();
    createModalTips('确定将删除该项,是否删除当前列表项!', 'doDelete')
}

function doDelete () {
    $.ajax({
        url: '/crmbanner/' + nodeEdit.uuid,
        data: {
            uuid: nodeEdit.uuid
        },
        type: 'delete',
        success: function (data) {
            $('#modal_tips').modal('hide');
            initData();
        }
    });
}

//编辑该条列表数据
function editLi (that) {
    opr = 'edit';
    $('#bannerModal .submitItem').css('display', 'inline');
    switchModal('.editBanTip');
    $(".form-group").find("i").attr('class', 'fa fa-check-circle-o');
    $('#myModalLabel').html('编辑轮播图');
    var thatComdUrn = '/goodscrm/api/banner/';
    var node = $(that).closest("tr");
    nodeEdit = oTab.api().row(node).data();
    $('.editImg').css('display', 'block');
    jsonTraversal(nodeEdit, jsTravSet);
    $('#bannerModal').modal('show');
}