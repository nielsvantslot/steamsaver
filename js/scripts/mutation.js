if (typeof init === 'undefined') {

  const init = function() {
    let interval;

    const engine = typeof browser !== 'undefined' ? browser : chrome;
    const mainContent = document.getElementById("mainContents");
    const regex = /\/inventory\/?(#\d+)?$/;

    if (regex.test(window.location.href)) {
      try {
        const children = mainContent.querySelectorAll("*");

        if (children.length === 1 && children[0].tagName === "H2") {
          const newUrl = window.location.href.replace(/\/inventory\/?/, "/inventory/?xml=1");
          window.location.href = newUrl;
        }
      } catch (e) {

      }
    }

    function checkSite () {
      try {
        const iframes = document.querySelectorAll('iframe');

        for (let frame of iframes) {
          if (frame && frame.contentWindow.document.body && frame.contentWindow.document.body.textContent.match(/© Valve Corporation\. All rights reserved\. All trademarks are property of their respective owners in the US and other countries\./i)) {
              clearInterval(interval);
              browser.runtime.sendMessage({ message: 'textFound' }, function(response) {
                if (browser.runtime.lastError) {
                  console.error(browser.runtime.lastError);
                }
              });
              break;
          }
        }
      } catch (e) {

      }
    }

    interval = setInterval(checkSite, 1000);
  }
  init();
}
