function simulateSticky(eltName, timeout) {
  let bottom = false;
  var move = function() {
    let scrollTop = window.pageYOffset;
    let scrollBottom = document.documentElement.scrollHeight - scrollTop - window.innerHeight;

    let eltTop = elt.parentElement.offsetTop;
    let eltBottom = document.documentElement.scrollHeight - eltTop - elt.parentElement.offsetHeight;

    if (scrollTop < eltTop) { // Top case
      elt.style.position = "absolute";
      elt.style.top = "auto";
      elt.style.right = "-441px";
    }
    else if (scrollTop >= eltTop && scrollBottom >= eltBottom) { // Middle case
            bottom = false;
      elt.style.position = "fixed";
      elt.style.top = "1.4vh";
      elt.style.right = "calc(50vw - 900px)";
    }
    else if (!bottom) { // Bottom case
      bottom = true;
            let spaceTopToBottom = elt.parentElement.offsetHeight + eltTop;
            let eltOffset = eltTop + document.querySelector(".inventory_page_right").offsetHeight;
            let vh = window.innerHeight * 0.986 - document.querySelector(".inventory_page_right").offsetHeight;
      let bottomTop = spaceTopToBottom - eltOffset - vh + "px";

            elt.style.position = "absolute";
      elt.style.top = bottomTop;
      elt.style.right = "-441px";
    }
  };

  // Use of a timeout for better performance
  if (timeout) {
    let timeoutId;
    window.addEventListener("scroll", function() {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(function() {
        move();
      }, 300);
    });
  }
  else {
    window.addEventListener("scroll", move);
  }
  let elt = document.querySelector(eltName);
  // Initial call
  move();
}

document.addEventListener("DOMContentLoaded", function() {
  simulateSticky(".inventory_page_right", false);
});
