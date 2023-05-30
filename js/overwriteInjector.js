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
