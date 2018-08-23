verifyEventsInit()
var oTab = createDt(), deedType
$('#level').rating(
  {
    min: 1, max: 5,
    step: 1, size: 'sm',
    showClear: false,
    showCaption: false
  }
)
// $('#level').rating('update', 1).val()

//获取列表
function createDt () {
  return $('#tableLi').dataTable({
    'serverSide': true,
    'pagingType': 'full_numbers',
    'ordering': false,
    'responsive': true,
    'info': true,
    'lengthChange': true,
    'lengthMenu': [[10, 15, 50, 100], [10, 15, 50, 100]],
    'language': {'url': LanguageHost},
    'ajax': {
      'url': cgiDtUrl('/crmorder/orderlist', {type: 'all', state: 'all'}),
      'error': cgiDtError,
      'type': 'GET',
      'dataType': 'json',
      'dataSrc': function (data) {
        return data.orderList
      }
    },
    'columns': [
      {
        'data': 'deeduuid1',
        'class': 'all',
        'render': function (d, t, f) {
          var str = `<span onclick="showOrder1Detail(this)" style="text-decoration: underline;color:purple;cursor: pointer">` + d + `</span>`
          return str
        }
      },
      {
        'data': 'deeduuid2',
        'class': 'all',
        'render': function (d, t, f) {
          var str = `<span onclick="showOrder2Detail(this)" style="text-decoration: underline;color:purple;cursor: pointer">` + d + `</span>`
          return str
        }
      },
      {
        'data': 'state',
        'render': function (d) {
          var str
          switch (d) {
            case 'on':
              str = '未完成'
              break
            case 'off':
              str = '完成'
              break
          }
          return str
        }
      },
      {
        'data': 'type',
        'render': function (d) {
          var str
          switch (d) {
            case 'either':
              str = '单方评论'
              break
            case 'neither':
              str = '双方未评'
              break
            case 'unusual':
              str = '争议评'
              break
            case 'normal':
              str = '正常单'
              break
            case 'waitfeedback':
              str = '待反馈'
              break
          }
          return str
        }
      },
      {
        'data': 'coin'
      },
      {
        'data': 'player'
      },
      {
        'data': 'starttime',
        'render': function (d) {
          var str
          if (d) {
            str = '<div>' + d[0] + '</div>' +
              '<div>' + d[1] + '</div>'
          } else {
            str = d
          }
          return str
        }
      },
      {
        'data': 'location'
      },
      {
        'data': 'created'
      },
      // {
      //   'data': 'uuid',
      //   className: 'all',
      //   render: (d, t, r) => '<button class=\'btn bg-primary\' data-toggle=\'tooltip\' data-placement=\'top\' title=\'添加评论\' onclick=\'onAddComment(this)\'>' +
      //     '<i class=\'fa fa-comment\'></i> 添加评论' +
      //     '</button>'
      // }
    ],
    'rowCallback': function (row, data, index) {
      $(row).find('td:first').html(index + 1)
    },
    'drawCallback': function () {
      var role = $.cookie('role')
      $('.' + role).remove()
    }
  })
}

function onAddComment (that) {
  nodeEdit = oTab.api().row($(that).closest('tr')).data()
  $('#modal_addComment').modal('show')
}

function doAddComment () {
  if (!verification) return
  var params = {
    orderuuid: nodeEdit.uuid,
    useruuid: nodeEdit.player,
    content: $('#content').val(),
    level: $('#level').rating().val(),
    evaluator: storage.read('uuid')
  }
  $.ajax({
    url: cgiDtUrl('/crmcomments/add '),
    data: params,
    type: 'post',
    success: function (data) {
      $('#modal_addComment').modal('hide')
      createModalTips(data.msg)
      dtReloadData(oTab)
    }
  })
}

function changeData () {
  var type = $('#type').val()
  var state = $('#state').val()
  oTab.api().ajax.url(cgiDtUrl('/crmorder/orderlist', {type: type, state: state})).load()
}

function showOrder1Detail (that) {
  deedType = 'deeduuid1'
  showModal(that)
}

function showOrder2Detail (that) {
  deedType = 'deeduuid2'
  showModal(that)
}

function showModal (that) {
  var node = $(that).closest('tr'), deedUuid
  nodeEdit = oTab.api().row(node).data()
  deedType == 'deeduuid1' ? deedUuid = nodeEdit.deeduuid1 : deedUuid = nodeEdit.deeduuid2
  $.ajax({
    url: cgiDtUrl('/crm/deed/' + deedUuid),
    // data: obj,
    timeout: 3700,
    dataType: 'json',
    type: 'get',
    success: function (data) {
      $('#useruuid').text(data.deed.useruuid)
      $('#address').text(data.deed.address || '未填')
      $('#restaurant').text(data.deed.restaurant || '未填')
      $('#payway').text(data.deed.payway)
      $('#deposit').text(data.deed.deposit)
      $('#deedtype').val(data.deed.type)
      $('#deedstate').val(data.deed.state)
      $('#onetoone').text(data.deed.onetoone ? '是' : '否')
      $('#istimeout').text(data.deed.istimeout ? '是' : '否')

      if (data.deed.mealtime) {
        $('#mealtime').html(
          '<div>' + data.deed.mealtime[0] + '</div>' +
          '<div>' + data.deed.mealtime[1] + '</div>'
        )
      }
      $('#created').text(data.deed.created)
      $('#orderDetailModal').modal('show')

      switch (data.deed.result) {
        case 'waitfeedback':
          $('#result').text('待反馈')
          break
        case 'notgo':
          $('#result').text('放鸽子')
          break
        case 'go':
          $('#result').text('已应邀')
          break
      }
      switch (data.deed.type) {
        case 'spend':
          $('#deedtype').text('我要花钱')
          break
        case 'make':
          $('#deedtype').text('我要赚钱')
          break
        case 'nearby':
          $('#deedtype').text('附近约饭')
          break
      }
      data.deed.state ? $('#deedstate').text('已匹配') : $('#deedstate').text('未匹配')
      switch (data.deed.result) {
        case 'both':
          $('#result').text('已完成')
          break
        case 'neither':
          $('#result').text('都没去')
          break
        case 'either':
          $('#result').text('ta没去')
          break
        case 'me':
          $('#result').text('附近约饭')
          break
      }
    }
  })

}