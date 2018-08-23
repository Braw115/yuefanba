geterrorData()
var date = new Date()

function geterrorData () {
    $.ajax({
        type: "get",
        url: cgiDtUrl('/crmlog/error'),
        success: function (res) {
            res.split(JSON.stringify(date.getFullYear()))
            var nowYearlog = res.split(JSON.stringify(date.getFullYear()))
            var nowYearlog_1 = res.split(JSON.stringify(date.getFullYear() - 1))
            var nowYearlog_2 = res.split(JSON.stringify(date.getFullYear() - 2))
            var nowYearlog1 = res.split(JSON.stringify(date.getFullYear() + 1))
            var nowYearlog2 = res.split(JSON.stringify(date.getFullYear() + 2))
            //今年前后两年的日志
            addYearslog(nowYearlog_1);
            addYearslog(nowYearlog_2);
            addYearslog(nowYearlog);
            addYearslog(nowYearlog1);
            addYearslog(nowYearlog2);
        }
    });
}

function addYearslog (aYearLog) {
    if (aYearLog && aYearLog.length > 1) {
        var str = ''
        for (var i = 0; i < aYearLog.length; i++) {
            if (i == 0 && aYearLog[i] != '' && aYearLog[i] != JSON.stringify(date.getFullYear())) {
                str += `<div style="margin-top:15px;">` + aYearLog[i] + `</div>`;
                ;
            } else if (i > 0) {
                str += `<div style="margin-top:15px;">` + date.getFullYear() + aYearLog[i] + `</div>`;
            }
        }
        $('.panel-body').html(str)
    }
}