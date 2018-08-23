var oTab, oTabEvaluation,
    opr = "add", nodeEdit, moduleType,//切换添加和编辑
    oTab = createDt();
createInitModal();
verifyEventsInit();
initEvents();

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
            "url": cgiDtUrl('/crmusers/findusers', {status: "all", orderby: "created", ascordesc: "asc"}),
            "error": cgiDtError,
            "type": "GET",
            "dataType": "json",
            "dataSrc": function (data) {
                return data.userList;
            },
        },
        "columns": [
            {
                "data": null,
                "className": "all",
                "orderable": false,
                "searchable": false,
            },
            {
                "data": "avatar",
                "class": "all",
                "render": function (d, f, t) {
                    var formHtml =
                        `<a class="formHtml" data-toggle="tooltip" data-container="body" title="上传头像">
                                    <button class="btn btn-xs btn-purple fileinput-button" type="button">
                                    <i class="fa fa-user-circle"></i> 上传头像</button>
                                    <input type="file" name="file" onchange="uploadAvatar(this)" style="position:absolute;top:0;left:0;font-size:34px; opacity:0">
                                </a>`;
                    if (d) {
                        var str = `<div class="avatar">
                            <a href="` + getImgAddress(d) + `" rel="lightbox"><img src="` + getImgAddress(d) + `" alt="用户头像"></a>
                            <div align="center" style="margin-top: 8px;"">
                            <a class="btn btn-xs btn-danger"  data-toggle="tooltip" data-container="body" title="删除该图"  onclick="delAvatar(this)">删除</a>
                            </div>
                            </div><form style="display: none; class="avatarBtn" action="" method="post" enctype="multipart/form-data">` + formHtml + `</form>`;
                        
                    } else {
                        var str = `<div><form class="avatarBtn" action="" method="post" enctype="multipart/form-data">` + formHtml + `</form></div>`;
                    }
                    return str;
                }
            },
            {
                "data": "nickname",
                "searchable": true,
            },
            {
                "data": "phone",
                "class": "all",
                "searchable": true
            },
            {
                "data": "attestvideo",
                "class": "all",
                "render": function (d) {
                    var str = '<span><a onclick="videoModal(this)" class="btn btn-xs btn-purple" data-toggle="tooltip" data-container="body" title="认证视频"><i class="fa fa-video-camera"></i></a></span>';
                    return str;
                }
            },
            {
                "data": "album",
                "class": "all",
                "render": function (d) {
                    var str = '<span><a  onclick="editAlbum(this)" class="btn btn-xs btn-purple" data-toggle="tooltip" data-container="body" title="相册"><i class="fa fa-book"></i></a></span>';
                    return str;
                }
            },
            {
                "data": "personality",
                "class": "all",
                "render": function (d) {
                    var str = '<span><a  onclick="editPersonality(this)" class="btn btn-xs btn-purple " data-toggle="tooltip" data-container="body" title="个性展示"><i class="fa fa-picture-o"></i></a></span>';
                    return str;
                }
            },
            {
                "data": "created",
                "render": function (d) {
                    return '<div style="width: 120px;text-align: center">' + d + '</div>'
                }
            },
            {
                "data": "popularity"
            },
            {
                "data": "birthday"
            },
            {
                "data": "gender",
                "render": function (d) {
                    var str;
                    if (d == 1) {
                        str = '男';
                    } else if (d == 0) {
                        str = '女';
                    } else {
                        str = '未授权';
                    }
                    return str;
                }
            },
            {
                "data": "height",
                "render": function (d) {
                    return d;
                }
            },
            {
                "data": "balance"
            },
            {
                "data": "status",
                "class": "all",
                "render": function (d) {
                    var optionStr;
                    switch (d) {
                        case 'unupload':
                            optionStr = `<option value="unupload">未上传</option>`
                            break;
                        case 'uncheck':
                            optionStr = `<option value="uncheck">未审核</option>
                                        <option value="accept">审核通过</option>
                                        <option value="refuse">审核不通过</option>
                                        `
                            break;
                        case 'accept':
                            optionStr = `<option value="accept">审核通过</option>`
                            break;
                        case 'refuse':
                            optionStr = `<option value="refuse">审核不通过</option>
                                    <option value="accept">审核通过</option>`
                            break;
                    }
                    var str = `<div>
                                <select class="form-control" onchange="changeStatus(this)">
                                ` + optionStr + `
                                </select>
                            <div>`;
                    return str;
                }
            },
            {
                "data": "openid",
                "searchable": true,
            },
            {
                "data": "uuid",
                "class": "all",
                "render": function (d, t, f) {
                    return '<span class="btn-group btn-group-xs" style="min-width: 120px">' +
                        '<a class="btn btn-purple" onclick="editLi(this)" data-toggle="tooltip" data-container="body" title="编辑"><i class="fa fa-pencil"></i></a>' +
                        '<a class="btn btn-purple" onclick="goToAppointment(this)" data-toggle="tooltip" data-container="body" title="契约单列表"><i class="fa fa-asl-interpreting"></i></a>' +
                        '<a class="btn btn-purple" onclick="evaluationLi(this)" data-toggle="tooltip" data-container="body" title="用户评价"><i class="fa fa-star-half-o"></i></a>' +
                        '<a class="btn btn-danger " onclick="delLi(this)" data-toggle="tooltip" data-container="body" title="删除"><i class="fa fa-trash"></i></a>' +
                        '</span>';
                    return d;
                }
            },
        ],
        "rowCallback": function (row, data, index) {
            $(row).find("td:first").html(index + 1);
            $(row).find("select:first").val(data.status);
        },
        "drawCallback": function () {
            var role = $.cookie("role");
            $('.' + role).remove();
            $("body > div.tooltip").remove();
            $('[data-toggle="tooltip"]').tooltip();
        }
    });
}

function evaluationDt () {
    return $('#evaluationTable').dataTable({
        "serverSide": true,
        "retrieve": true,
        "pagingType": "full_numbers",
        "ordering": false,
        "responsive": true,
        "info": true,
        "lengthChange": true,
        "lengthMenu": [[10, 15, 50, 100], [10, 15, 50, 100]],
        "language": {"url": LanguageHost},
        "ajax": {
            "url": cgiDtUrl('/crmusers/comments/' + nodeEdit.uuid),
            "error": cgiDtError,
            "type": "GET",
            "dataType": "json",
            "dataSrc": function (data) {
                return data.commentlist
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
                "data": "evaluatornick",
                "render": function (d) {
                    return d || '未填写'
                }
            },
            {
                "data": "evaluatorphone"
            },
            {
                "data": "orderuuid"
            },
            {
                "data": "content",
                "render": function (d) {
                    if (d && d.length > 18) {
                        d = d.substring(0, 18) + '...';
                    }
                    return d || '未填';
                }
            },
            {
                "data": "level"
            },
            {
                "data": "starttime"
            }
        ],
        "rowCallback": function (row, data, index) {
            $(row).find("td:first").html(index + 1);
            if (data.content != '') {
                $('td:eq(3)', row).attr('title', data.description).css('cursor', 'help');
            }
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

function changeStatus (that) {
    var node = $(that).closest("tr");
    nodeEdit = oTab.api().row(node).data();
    if ($(that).val() == "refuse") {
        $('#refuseReasonModal').modal('show');
    } else {
        doChangeStatus($(that).val(), '');
    }
}

function submitRefuseReason () {
    doChangeStatus("refuse", $('#refuseReasonModal textarea').val());
}

function doChangeStatus (status, reason) {
    var obj = {
        status: status,
        reason: reason
    }
    $.ajax({
        url: cgiDtUrl('/crmusers/checkvideo/' + nodeEdit.uuid),
        data: obj,
        timeout: 30000,
        dataType: "json",
        type: 'put',
        success: function (data) {
            createModalTips(data.msg);
            $('#refuseReasonModal').modal('hide');
            initData();
        }
    });
}

function evaluationLi (that) {
    node = $(that).closest("tr");
    nodeEdit = oTab.api().row(node).data();
    nodeEdit.nickname ? $('#appUser').text(nodeEdit.nickname) : $('#appUser').text(nodeEdit.phone);
    if (oTabEvaluation) {
        oTabEvaluation.api().ajax.url(cgiDtUrl('/crmusers/comments/' + nodeEdit.uuid)).load();
    } else {
        oTabEvaluation = evaluationDt();
    }
    
    $('#evaluationModal').modal('show');
}

function initEvents () {
    var date = new Date();
    var nowTimer = date.getFullYear() + '-' + lessThan10(date.getMonth() + 1) + '-' + lessThan10(date.getDate());
    //执行一个laydate实例
    laydate.render({
        elem: '#birthday', //指定元素
        max: nowTimer,
        istime: true,
        istoday: false,
    });
    $('[data-toggle="tooltip"]').tooltip(); //初始化tooltip,以免提示不出来
    $(".editModalPosi").on("mouseover", ".editImgShow", function (e) {
        $(e.target)
            .parent()
            .find(".delImg")
            .css("display", "block");
    });
    $(".editModalPosi").on("mouseout", ".editImgShow", function (e) {
        $(e.target)
            .parent()
            .find(".delImg")
            .css("display", "none");
    });
    
    $('#addAppUser').on("click", addAppUser);
}

//新建列表数据
function addAppUser () {
    opr = 'add';
    var item = {
            nickname: "",
            phone: "",
            height: "",
            birthday: "",
            longitude: "",
            latitude: "",
            popularity: "",
            balance: ""
        },
        obj = jsonTraversal(item, jsTravSet);//设值
    $('#addAppUserModal').modal('show');
}

function submitAddData () {
    if (!verification()) return;
    var method, submitUrl,
        item = {
            nickname: "",
            phone: "",
            gender: "",
            height: "",
            birthday: "",
            longitude: "",
            latitude: "",
            popularity: "",
            balance: "",
            gender: "",
            
        },
        obj = jsonTraversal(item, jsTravGet);//取值
    obj.birthday = new Date($('#birthday').val()).getTime();
    if (opr == 'add') {
        submitUrl = '/crmusers/addappuser'
        method = 'post'
    } else if (opr == 'edit') {
        submitUrl = '/crmusers/' + nodeEdit.uuid;
        method = 'put'
    }
    $.ajax({
        url: submitUrl,
        data: obj,
        timeout: 6000,
        dataType: "json",
        type: method,
        success: function (data) {
            createModalTips(data.msg);
            $('#addAppUserModal').modal('hide');
            oTab.api().ajax.reload(null, false);
        }
    });
}

function videoModal (that) {
    moduleType = 'attestvideo';
    var node = $(that).closest("tr");
    nodeEdit = oTab.api().row(node).data();
    
    switchModuleType();
    if (nodeEdit.attestvideo) {
        var videoSrc = servImgUrl + nodeEdit.attestvideo;
        var videoHtml = `
                    <video controls src="` + videoSrc + `"></video>
                    <div class="del-video-btn" align="center"><button class="btn btn-danger" onclick="deleteAttestvideo(this)" block>删除验证视频</button></div>`;
        $('.video-box').html(videoHtml);
        
    } else {
        var videoStr = `
            <form class="addVideoBtn attestvideoBtn" action="" method="post" enctype="multipart/form-data">
                <a style="display:inline-block;position:relative;overflow: hidden;vertical-align:middle"
                   data-toggle="tooltip" data-container="body" title="上传验证视频">
                    <button class="btn btn-purple fileinput-button" type="button">
                        <i class="fa fa-upload"></i> 上传验证视频
                    </button>
                    <input type="file" name="file" onchange="uploadFile()"
                           style="position:absolute;top:0;left:0;font-size:34px; opacity:0">
                </a>
            </form>
        `
        $('.video-box').html(videoStr);
    }
    $('#resourcesModal').modal('show');
}

//头像上传
function uploadAvatar (that) {
    $("body > div.tooltip").remove();
    var node = $(that).closest("tr");
    nodeEdit = oTab.api().row(node).data();
    $(that).closest('form.avatarBtn').ajaxSubmit({
        url: '/crmusers/',
        type: 'post',
        timeout: 600000,
        data: {
            uploadfield: 'avatar',
            url: '',
            uuid: nodeEdit.uuid
        },
        dataType: 'json',
        success: function (data) {
            initData();
        },
        error: function (e) {
            createModalTips(e);
        }
    })
}

//文件上传
function uploadFile () {
    console.log(2333, moduleType)
    $("." + moduleType + "Btn").ajaxSubmit({
        url: '/crmusers/',
        type: 'post',
        timeout: 600000,
        data: {
            uploadfield: moduleType,
            url: '',
            uuid: nodeEdit.uuid
        },
        dataType: 'json',
        success: function (data) {
            switch (moduleType) {
                case 'album':
                    var pic = data.data.path;
                    if (pic.length > 0) {
                        $(".personalAlbumPics .editImgShow").remove();
                        for (var i = 0; i < pic.length; i++) {
                            $(".personalAlbumPics").append(
                                '<li class="editImgShow"><img src="' +
                                servImgUrl +
                                pic[i] +
                                '" alt="相册图"><div class="fa fa-trash-o delImg" onClick="deleteAlbum(this)"></div></li>'
                            );
                        }
                    }
                    if (pic.length >= 9) {
                        $(".album-box .editImg").css("display", "none");
                    }
                    break;
                case 'attestvideo':
                    var videoHtml = `<video controls src="` + servImgUrl + data.data.path + `"></video>
                    <div class="del-video-btn" align="center">
                    <button class="btn btn-danger" onclick="deleteAttestvideo(this)" block>删除验证视频</button>
                    </div>`;
                    $('.video-box').html(videoHtml);
                    initData();
                    break;
                case 'personality':
                    var pic = data.data.path;
                    if (pic.length > 0) {
                        $(".personalityPics .editImgShow").remove();
                        for (var i = 0; i < pic.length; i++) {
                            $(".personalityPics").append(
                                '<li class="editImgShow"><img src="' +
                                servImgUrl +
                                pic[i] +
                                '" alt="相册图"><div class="fa fa-trash-o delImg" onClick="deletePersonalityPics(this)"></div></li>'
                            );
                        }
                    }
                    if (pic.length >= 5) $(".personality-box .editImg").css("display", "none");
                    break;
            }
            initData();
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

function getImgAddress (img) {
    let absPath = /^\//
    if (img instanceof Array) {
        return img.map(val => absPath.test(val) ? servImgUrl + val : val)
    }
    return absPath.test(img) ? servImgUrl + img : img;
}


function editAlbum (that) {
    moduleType = 'album';
    var node = $(that).closest("tr");
    nodeEdit = oTab.api().row(node).data();
    var albumPics = nodeEdit.album;
    $(".personalAlbumPics .editImgShow").remove();
    if (!albumPics) {
        switchModuleType();
        $('#resourcesModal').modal('show');
        return;
    } else {
        if (albumPics) {
            if (albumPics.length >= 9) {
                $(".editImg").css("display", "none");
            }
            for (var i = 0; i < albumPics.length; i++) {
                $(".personalAlbumPics").append(
                    '<li class="editImgShow"><img data-picpath="' +
                    albumPics[i] +
                    '"  src="' +
                    servImgUrl + albumPics[i] +
                    '" alt="相册图"><div class="fa fa-trash-o delImg" onClick="deleteAlbum(this)"></div></li>'
                );
            }
        }
        switchModuleType();
        $('#resourcesModal').modal('show');
    }
}

function editPersonality (that) {
    moduleType = 'personality';
    var node = $(that).closest("tr");
    nodeEdit = oTab.api().row(node).data();
    var personalityPics = nodeEdit.personality;
    $(".personalityPics .editImgShow").remove();
    if (personalityPics && personalityPics.length != 0) {
        if (personalityPics.length >= 5) {
            $(".personality-box .editImg").css("display", "none");
        }
        for (var i = 0; i < personalityPics.length; i++) {
            $(".personalityPics").append(
                '<li class="editImgShow"><img src="' +
                servImgUrl + personalityPics[i] +
                '" alt="个性展示图"><div class="fa fa-trash-o delImg" onClick="deletePersonalityPics(this)"></div></li>'
            );
        }
    }
    moduleType = 'personality';
    switchModuleType();
    $('#resourcesModal').modal('show');
}

//编辑该条列表数据
function editLi (that) {
    opr = 'edit';
    var node = $(that).closest("tr");
    nodeEdit = oTab.api().row(node).data();
    jsonTraversal(nodeEdit, jsTravSet);
    $('#addAppUserModal').modal('show');
}

//删除编辑的图片
function deleteAlbum (that) {
    window.currentFile = $(that);
    createModalTips("是否删除相册当前图片", "doDeleteImg");
}

function delAvatar (that) {
    var node = $(that).closest("tr");
    nodeEdit = oTab.api().row(node).data();
    createModalTips("是否删除当前头像图片?", "doDeleteAvatar");
}

function deletePersonalityPics (that) {
    window.currentFile = $(that);
    createModalTips("是否删除当前个性展示图片?", "doDeleteImg");
}

function deleteAttestvideo (that) {
    window.currentFile = $(that);
    createModalTips("是否删除当前视频文件?", "doDeleteAttestvideo");
}


function doDeleteImg () {
    var picname = '/' + moduleType + currentFile.closest("li").find('img').attr('src').split('/' + moduleType)[1];
    $.ajax({
        url: '/crmusers/media',
        type: 'delete',
        data: {
            url: picname,
            delfield: moduleType,
            uuid: nodeEdit.uuid,
        },
        success: function (data) {
            currentFile.closest("li").remove();
            switch (moduleType) {
                case 'album':
                    $(".personalAlbumPics").siblings(".editImg").css("display", "inline-block");
                    break;
                case 'avatar':
                    $(".personalAvatarPics").siblings(".editImg").css("display", "inline-block");
                    break;
                case 'personality':
                    $(".personalityPics").siblings(".editImg").css("display", "inline-block");
                    break;
            }
            initData();
            $("#modal_tips").modal("hide");
        },
        error: function (e) {
            createModalTips("删除图片出错了！");
        }
    })
}

function doDeleteAvatar () {
    var picname = nodeEdit.avatar;
    let absPath = /^\//
    if (!absPath.test(picname)) {
        createModalTips("小程序注册用户默认的头像,不可修改！");
        return
    }
    
    $.ajax({
        url: '/crmusers/media',
        type: 'delete',
        timeout: 3000,
        data: {
            url: picname,
            delfield: 'avatar',
            uuid: nodeEdit.uuid,
        },
        success: function (data) {
            initData();
            $("#modal_tips").modal("hide");
        },
        error: function (e) {
            createModalTips("删除图片出错了！");
        }
    })
}

function doDeleteAttestvideo () {
    // var picname = nodeEdit.attestvideo;
    var picname = '/' + moduleType + currentFile.closest(".del-video-btn").siblings('video').attr('src').split('/' + moduleType)[1];
    $.ajax({
        url: '/crmusers/media',
        type: 'delete',
        timeout: 5000,
        data: {
            url: picname,
            delfield: 'attestvideo',
            uuid: nodeEdit.uuid,
        },
        success: function (data) {
            var attestvideoBtn = `
                    <form class="addVideoBtn attestvideoBtn" action="" method="post" enctype="multipart/form-data">
                        <a style="display:inline-block;position:relative;overflow: hidden;vertical-align:middle" data-toggle="tooltip" data-container="body" title="上传验证视频">
                            <button class="btn btn-purple fileinput-button" type="button">
                                <i class="fa fa-upload"></i> 上传验证视频
                            </button>
                            <input type="file" name="file" onchange="uploadFile(this)" style="position:absolute;top:0;left:0;font-size:34px; opacity:0">
                        </a>
                    </form>
                    `;
            currentFile.closest('.del-video-btn').before(attestvideoBtn);
            currentFile.closest('.del-video-btn').siblings('video').remove();
            currentFile.closest('.del-video-btn').remove();
            initData();
            $("#modal_tips").modal("hide");
        },
        error: function (e) {
            createModalTips(e);
        }
    })
}

function switchModuleType () {
    $('.album-box,.avatar-box,.video-box,.personality-box').css('display', 'none');
    switch (moduleType) {
        case 'avatar':
            $('.avatar-box').css('display', 'block');
            break;
        case 'attestvideo':
            $('.video-box').css('display', 'block');
            break;
        case 'album':
            $('.album-box').css('display', 'block');
            break;
        case 'personality':
            $('.personality-box').css('display', 'block');
            break;
    }
}

//删除该行列表数据
function delLi (that) {
    var node = $(that).closest("tr");
    nodeEdit = oTab.api().row(node).data();
    createModalTips('删除该用户可能导致该用户无法正常使用约饭小程序,是否删除当前列表项', 'doDelete')
}

function doDelete () {
    $.ajax({
        url: '/crmusers/' + nodeEdit.uuid,
        type: 'delete',
        timeout: 5000,
        success: function (data) {
            $('#modal_tips').modal('hide');
            initData();
        }
    });
}

function createInitModal () {
    $("#evaluationModal").modal({
        "backdrop": "static",//点遮罩层不会消失
        "show": false
    });
    $("#addAppUserModal").modal({
        "backdrop": "static",//点遮罩层不会消失
        "show": false
    });
    $("#refuseReasonModal").modal({
        "backdrop": "static",//点遮罩层不会消失
        "show": false
    });
    $("#resourcesModal").modal({
        "backdrop": "static",//点遮罩层不会消失
        "show": false
    });
}

function goToAppointment (that) {
    var node = $(that).closest("tr");
    nodeEdit = oTab.api().row(node).data();
    var obj = {
        uuid: nodeEdit.uuid,
        phone: nodeEdit.phone,
        nickname: nodeEdit.nickname
    }
    storage.write('appUserData', obj);
    $("body > div.tooltip").remove();
    loadContent('pages/appointment/appointmentlist/appointmentlist');
}

function changeData () {
    var status = $('#selectStatus').val();
    oTab.api().ajax.url(cgiDtUrl('/crmusers/findusers', {status: status, orderby: "created", ascordesc: "asc"})).load();
}

function sortBy (ascordesc, that, orderby) {
    $(that).css('display', 'none').siblings('i').css('display', 'inline');
    var status = $('#selectStatus').val();
    oTab.api().ajax.url(cgiDtUrl('/crmusers/findusers', {
        status: status,
        orderby: orderby,
        ascordesc: ascordesc
    })).load();
}