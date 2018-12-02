function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

$(document).ready(function () {
    $("body").on("click", ".grid-item", function () {
        console.log("!!!", this)
        $("body").addClass("popup-open").fadeIn(2000);
        $('.overlay-popup').addClass("popup-open").fadeIn(400);
    });

// close/hide popup (+overlay)
    $.fn.popupClose = function () {
        $("body").removeClass("popup-open")
        $(".overlay-popup").removeClass("popup-open");
        return this;
    };
});
