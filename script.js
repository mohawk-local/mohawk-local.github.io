const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});

var shortcuts = document.getElementById("shortcuts").childNodes;

if (params.filter !== null) {
		for (var i = 0, shortcut; shortcut = shortcuts[i++];) {
				if (shortcut.nodeName == "A") {
						var categories = shortcut.dataset.categories;
						console.log(categories);

						if (categories !== undefined && categories.includes(params.filter)) {
								shortcut.hidden = false;
						}
						else {
								shortcut.hidden = true;
						}
				}
		}
}
