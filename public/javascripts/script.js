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

$('code').each(function () {
    var $this = $(this);
    var split = $this.html().split('\n');
    if (split.length > 1) {
        var parent = $this.parent();
        $this.remove();
        parent.append($('<pre></pre>').html(split.slice(1).join('\n'))); // start at 1 because the first is the code type
    }
});
