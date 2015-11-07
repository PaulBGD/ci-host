$('[data-toggle="tooltip"]').tooltip();
$('.time').each(function () {
    var $this = $(this);
    $this.text(new Date(parseInt($this.text())).toRelativeTime());
});

$('[data-search]').each(function () {
    var searching = $($(this).attr('data-search'));
    $(this).on('keyup', function () {
        var value = this.value;
        if (value.trim() == '') {
            searching.show(); // show all
        } else {
            searching.each(function () {
                if (this.innerHTML.toLowerCase().indexOf(value.toLowerCase()) > -1) {
                    $(this).show();
                } else {
                    $(this).hide();
                }
            });
        }
    });
});

$('#showAll').click(function () {
    $('.btn.hidden').removeClass('hidden');
    this.classList.add('hidden');
});

var tokens = $('#tokens');

function revoke() {
    var $this = $(this);
    $.post('/admin/token/revoke', {token: $this.attr('data-token')}, function (result) {
        if (result.error) {
            return alert(result.message);
        }
        $this.parent().parent().remove();
    }).error(function (error) {
        console.log(error);
    });
    console.log('revoke', $(this).attr('data-token'));
}

$('.revoke').click(revoke);

var projectCollapse = $('#projectCollapse');
function add() {
    projectCollapse.attr('data-token', $(this).attr('data-token')).collapse('show');
}
$('.add').click(add);

$('.collapse-button').click(function () {
    var $this = $(this);
    if (!$this.hasClass('btn-info')) {
        return;
    }
    $.post('/admin/token/toggle_project', {token: projectCollapse.attr('data-token'), project: $this.attr('data-project')}, function (result) {
        if (result.error) {
            return alert(result.message); // todo nicer?
        }
        $('#' + projectCollapse.attr('data-token')).text('Projects (' + Object.keys(result.projects).length + '): ' + Object.keys(result.projects).join(', '));
        projectCollapse.attr('data-token', $(this).attr('data-token')).collapse('hide');
    }).error(function (error) {
        console.log(error);
    });
});

$('#createToken').click(function () {
    $.post('/admin/token/create', function (result) {
        if (result.error) {
            return alert(result.message); // todo nicer?
        }

        var div = $('<div class="row project"></div>');
        var left = $('<div class="col-sm-10"></div>');
        var right = $('<div class="col-sm-2 btn-group-vertical btn-group-sm"></div>');

        left.append($('<h4></h4>').text(result.token));
        left.append($('<h5></h5>').attr('id', result.token).text('Projects (' + Object.keys(result.projects).length + '): ' + Object.keys(result.projects).join(', ')));

        right.append($('<button class="add btn btn-info btn-block">Add or Remove</button>').attr('data-token', result.token).click(add));
        right.append($('<button class="revoke btn btn-warning btn-block">Revoke</button>').attr('data-token', result.token).click(revoke));

        div.append(left).append(right);
        tokens.append(div);
    }).error(function (error) {
        console.log(error);
    });
});
