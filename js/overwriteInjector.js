const engine = typeof browser !== 'undefined' ? browser : chrome;

// let s = document.createElement('script');
// s.src = engine.runtime.getURL('js/overwrites/steamInventory.js');
// // s.onload = function() {
// //     this.remove();
// // };
// document.documentElement.appendChild(s);



const handleMutation = function (mutations) {
	for (const mutation of mutations) {
		if (!mutation.addedNodes) return;

		for (const node of mutation.addedNodes) {
			console.log("scanning...");
			if (node.tagName === 'SCRIPT' && node.getAttribute('src')?.includes('prototype-1.7.js')) {
				let s = document.createElement('script');
				s.type = "text/javascript";
				s.src = engine.runtime.getURL('js/overwrites/steamInventory.js');
				// s.onload = function() {
				//     this.remove();
				// };
				document.head.appendChild(s);
			}

			if (node.tagName === 'SCRIPT' && node.getAttribute('src')?.includes('economy_v2.js')) {
				// const element = document.createElement('script');
				// element.setAttribute('src', engine.runtime.getURL('js/overwrites/steamInventory.js'));
				// document.head.appendChild(element);\

				node.remove();

				observer.disconnect();

				return;
			}
		}
	}
}

const observer = new MutationObserver(handleMutation);

observer.observe(document, {
	childList: true,
	subtree: true,
	attributes: false,
	characterData: false,
});

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

// function modifyHTML(htmlcode) {
//   htmlcode = htmlcode.replace("https://community.cloudflare.steamstatic.com/public/javascript/economy_v2.js?v=34ZYyPjY9bIj&amp;l=english&amp;_cdn=cloudflare", engine.runtime.getURL('js/overwrites/steamInventory.js'));
//   return htmlcode;
// }
//
// window.stop();
//
// let xhr = new XMLHttpRequest();
// xhr.open('GET', window.location.href, false);
// xhr.send();
//
// let htmlcode = xhr.responseText;
// htmlcode = modifyHTML(htmlcode);
//
// let iframe = document.createElement('iframe');
// iframe.style.display = 'none';
// iframe.onload = function() {
//   let doc = iframe.contentDocument || iframe.contentWindow.document;
//   doc.open();
//   doc.write(htmlcode);
//   doc.close();
//   setTimeout(function() {
//     document.body.removeChild(iframe);
//   }, 0);
// };
// document.body.appendChild(iframe);
// iframe.src = 'about:blank';
