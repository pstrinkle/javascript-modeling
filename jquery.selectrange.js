// Stolen from http://stackoverflow.com/a/841121/332370
// Modified so that:
//   1. `end' can be omitted (defaults to the same value as `start').
//   2. -1 means the end of the range.

$.fn.selectRange = function(start, end) {
    return this.each(function() {
        if (typeof end == "undefined") {
            end = start;
        }
        if (start == -1) {
            start = this.value.length;
        }
        if (end == -1) {
            end = this.value.length;
        }
        if (this.setSelectionRange) {
            this.focus();
            this.setSelectionRange(start, end);
        }
        else if (this.createTextRange) {
            var range = this.createTextRange();
            range.collapse(true);
            range.moveEnd('character', end);
            range.moveStart('character', start);
            range.select();
        }
    });
};
