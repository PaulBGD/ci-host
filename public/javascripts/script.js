$('[data-toggle="tooltip"]').tooltip();
$('.time').each(function () {
    var $this = $(this);
    $this.text(new Date(parseInt($this.text())).toRelativeTime());
});
