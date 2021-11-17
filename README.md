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

The [JSON1 OT Type](https://github.com/ottypes/json1) is supported as well. To generate ops for the JSON1 OT type, provide a reference to [diff-match-patch](https://github.com/google/diff-match-patch), [ot-json1](https://github.com/ottypes/json1) and [ot-text-unicode](https://github.com/ottypes/text-unicode).

	var diffMatchPatch = require("diff-match-patch");
	var json1 = require("ot-json1");
	var textUnicode = require("ot-text-unicode");
	var diff = jsondiff(
		["foo", "The only change here is at the end.", 1, 2, 3],
		["foo", "The only change here is at the very end.", 1, 2],
		{ diffMatchPatch, json1, textUnicode }
	);
	console.log(diff);

	>[
	>  [ 1, { "es": [ 31, "very " ] } ],
	>  [ 4, { "r": true } ]
	>]

This was developed for [JsonML](http://www.jsonml.org/) with [Webstrates](https://github.com/cklokmose/Webstrates) in mind, but could be applicable in other situations.
