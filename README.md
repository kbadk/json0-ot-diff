# JSON0 OT Diff

Finds differences between two JSON object and generates operational transformation (OT) operations for transforming the first object into the second according to the [JSON0 OT Type](https://github.com/ottypes/json0).

The current implementation only supports list/object insertion/deletion (i.e. `li`, `ld`, `oi`, `od`).

	var jsondiff = require("./json0-ot-diff");

	var diff = jsondiff(
		["foo", "bar", 1, 2, 3],
		["foo", "quux", 1, 2]
	);
	console.log(diff);

	> [
	>	{ p: [ 1 ], ld: 'bar', li: 'quux' },
	>	{ p: [ 4 ], ld: 3 }
	>]

This was developed for [JsonML](http://www.jsonml.org/) with [Webstrates](https://github.com/cklokmose/Webstrates) in mind, but could be applicable in other situations.