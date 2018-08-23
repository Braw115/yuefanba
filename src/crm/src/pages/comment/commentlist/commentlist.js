var oTab = createDt(),
  nodeEdit

//获取列表
function createDt () {
  return $('#tableLi').dataTable({
    'serverSide': true,
    'pagingType': 'full_numbers',
    'ordering': false,
    'responsive': true,
    searching: false,
    'info': true,
    'lengthChange': true,
    'lengthMenu': [[10, 15, 50, 100], [10, 15, 50, 100]],
    'language': {'url': LanguageHost},
    'ajax': {
      'url': cgiDtUrl('/crmcomments/getcomments', {}),
      'error': cgiDtError,
      'type': 'GET',
      'dataType': 'json',
      'dataSrc': function (data) {
        return data.commentslist
      }
    },
    'columns': [
      {data: 'evaluatorname'},
      {data: 'username'},
      {
        'data': 'content'
      },
      {
        'data': 'level'
      },
      {
        'data': 'created',
        render: (d) => new Date(d).format('yyyy-MM-dd hh:mm:ss')
      },
      {
        'data': 'deeduuid1',
        'class': 'all',
        'render': function (d, t, f) {
          return '<button class=\'btn bg-danger\' data-toggle=\'tooltip\' data-placement=\'top\' title=\'删除评论\' onclick=\'onDelComment(this)\'>' +
            '<i class=\'fa fa-trash\'></i> 删除评论' +
            '</button>'
        }
      }
    ],
    'drawCallback': function () {
      var role = $.cookie('role')
      $('.' + role).remove()
    }
  })
}

function onDelComment (that) {
  nodeEdit = oTab.api().row($(that).closest('tr')).data()
  createModalTips('确定要删除所选的评论吗', 'doDelComment')
}

function doDelComment () {
  $.ajax({
    url: cgiDtUrl('/crmcomments/del'),
    method: 'post',
    data: {
      uuid: nodeEdit.uuid
    },
    success: function (d) {
      $('#modal_tips .btn-primary').remove()
      $('#modal_tips .modal-p span').text(d.msg)
      dtReloadData(oTab)
    }
  })
}