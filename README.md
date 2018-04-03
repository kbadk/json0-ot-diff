# JSON0 OT Diff

Finds differences between two JSON object and generates operational transformation (OT) operations for transforming the first object into the second according to the [JSON0 OT Type](https://github.com/ottypes/json0).

The current implementation supports list/object insertion/deletion (i.e. `li`, `ld`, `oi`, `od`) out of the box.

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

String insertion/deletion (i.e. `si`, `sd`) operations are generated for string mutations if you provide a reference to [diff-match-patch](https://github.com/google/diff-match-patch).

	var diffMatchPatch = require("diff-match-patch");
	var diff = jsondiff(
		["foo", "The only change here is at the end.", 1, 2, 3],
		["foo", "The only change here is at the very end.", 1, 2],
		diffMatchPatch
	);
	console.log(diff);

	> [
	> { p: [ 1, 31 ], si: 'very ' },
	> { p: [ 4 ], ld: 3 }
	>]

This was developed for [JsonML](http://www.jsonml.org/) with [Webstrates](https://github.com/cklokmose/Webstrates) in mind, but could be applicable in other situations.
