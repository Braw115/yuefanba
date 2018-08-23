$(function () {
    // 根据权限移除对应菜单项,当以root权限登录时,会移除class='root'的菜单项.
    var role = storage.read("role"), account = storage.read("username");
    if (role == undefined) {
        createModalTips("请先登录!", "logout");
        return;
    }
    $('.account').html(account)
    $('.' + role).remove();
    // 去除display:none样式,显示菜单
    $(".sidebar-menu").show();
    // sidebar 菜单点击事件
    $(".sidebar-menu").on("click", 'a', function () {
        typeof pageChange === 'function' && pageChange();
        var html = $(this).data("html");
        var js = $(this).data("js");
        if (html) {
            $(".content").load("pages/" + html + ".html", function () {
                if (js) {
                    $.ajax({
                        type: 'GET',
                        dataType: 'script',
                        cache: true,
                        url: "pages/" + js + ".js",
                        complete: function () {
                            $("body .modal").on("hidden.bs.modal", function () {
                                $(".has-error", this).removeClass("has-error");
                                $(".modal-footer .tip", this).html("");
                            })
                        }
                    });
                }
            });
            //菜单高亮
            $(this).parent().addClass("active").siblings().removeClass("active").find('ul').slideUp();
        }
    });

    function loadPage() {
        //页面刷新时根据hash加载对应的页面
        var hash = window.location.hash;
        var $history = $("[href='" + hash + "']");
        if (hash != '' && $history.length == 1) { //$history类类数组
            if (!$history.closest('ul').hasClass('sidebar-menu')) {
                $('.treeview-menu').css('display', 'none').removeClass('menu-open');
                $history.closest('ul').css('display', 'block').addClass('menu-open')
                    .parent('li').addClass('active')
                    .siblings().removeClass('active')
                // $history.closest('ul').addClass('active');
            }
            $history.click();
        } else {
            $firstPage = $('.sidebar-menu .treeview:first');
            if ($firstPage.find('ul').length == 1) {
                $firstPage.find('ul').slideDown(0).addClass("menu-open");
                $firstPage.find('ul').addClass("active").find('li:first > a').click();
            } else {
                $firstPage.find('a').click();
            }
        }
    }

    loadPage();

    /*设置提示模态框点击遮罩层不隐藏*/
    $("#modal_tips").modal({
        "backdrop": "static",
        "show": false
    });
    // 注销弹出模态框 提示
    $('.js-logout').click(function () {
        createModalTips('确定退出后台管理系统?', 'logout');
    });

});

// 登出
function logout() {
    $.ajax({
        url: cgiDtUrl("/crmusers/logout"),
        type: "post",
        global: false,
        success: function (d) {
            storage.clear();
            window.location.href = "index.html";
        },
        error: function (req) {},
        complete:function(){
            storage.clear();
            window.location.href = "index.html";
        }
    });
}
verifyEventsInit();
//修改密码
$("#modal_change_pwd").modal({
    "backdrop": "static",//点遮罩层不会消失
    "show": false
});
function changePwd() {
    $('#modal_change_pwd').modal("show").find('input').val('');
}

//确认提交
$("#changePwd").on("click", function () {
    if (!verification($("#modal_change_pwd"))) return;
    var new_password = $("#new_password").val();
    var old_password = $("#old_password").val();
    var uuid = storage.read('uuid');
    var obj = { "oldPassword": old_password, "newPassword": new_password };
    if (obj) {
        $.ajax({
            url: cgiDtUrl("/crmusers/updatepassword"),
            data: obj,
            type: "post",
            success: function (d) {
                $('#modal_change_pwd').modal("hide").find('input').val('');
                createModalTips("密码修改成功！");
            }
        });
    }
});
