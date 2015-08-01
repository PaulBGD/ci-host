$('[data-toggle="tooltip"]').tooltip();
$('.download-select').change(function() {
    var $this = $(this);
    var val = $this.val();
    var project = $this.attr('data-project');
    var a = $this.parent().find('a');
    var selected = $this.find('option:selected');
    var id = selected.attr('data-id');
    a.attr('href', '/downloads/' + project + '/' + val + '/' + id);
});