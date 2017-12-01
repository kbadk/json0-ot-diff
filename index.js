"use strict";

var equal = require("deep-equal");
var json0 = require("ot-json0/lib/json0");

var optimize = function(ops) {
	/*
	Optimization loop where we attempt to find operations that needlessly inserts and deletes identical objects right
	after each other, and then consolidate them.
	 */
	for (var i=0, l=ops.length-1; i < l; ++i) {
		var a = ops[i], b = ops[i+1];

		// The ops must have same path.
		if (!equal(a.p.slice(0, -1), b.p.slice(0, -1))) {
			continue;
		}

		// The indices must be successive.
		if (a.p[a.p.length-1] + 1 !== b.p[b.p.length-1]) {
			continue;
		}

		// The first operatin must be an insertion and the second a deletion.
		if (!a.li || !b.ld) {
			continue;
		}

		// The object we insert must be equal to what we delete next.
		if (!equal(a.li, b.ld)) {
			continue;
		}

		delete a.li;
		delete b.ld;
	}

	ops = ops.filter(function(op) {
		return Object.keys(op).length > 1;
	});

	return ops;
}

var diff = function(input, output, path=[]) {
	// If the last element of the path is a string, that means we're looking at a key, rather than
	// a number index. Objects use keys, so the target for our insertion/deletion is an object.
	var isObject = typeof path[path.length-1] === "string";

	// If input and output are equal, no operations are needed.
	if (equal(input, output)) {
		return [];
	}

	// If there is no output, we need to delete the current data (input).
	if (typeof output === "undefined") {
		var op = { p: path };
		op[isObject ? "od" : "ld"] = input;
		return [op];
	}

	// If there is no input, we need to add the new data (output).
	if (typeof input === "undefined") {
		var op = { p: path };
		op[isObject ? "oi" : "li"] = output;
		return [op];
	}

	// If either of input/output is a string, there is no need to perform deep recursive calls to
	// figure out what to do. We can just replace the objects.
	if (typeof output === "string" || typeof input === "string") {
		var op = { p: path };
		op[isObject ? "od" : "ld"] = input;
		op[isObject ? "oi" : "li"] = output;
		return [op];
	}

	if (Array.isArray(output)) {
		var ops = [];
		var l = Math.max(input.length, output.length);
		var ops = [];
		var offset = 0;
		for (var i=0; i < l; ++i) {
			var newOps = diff(input[i], output[i], [...path, i + offset]);
			newOps.forEach(function(op) {
				var opParentPath = op.p.slice(0, -1);
				if (equal(path, opParentPath)) {
					if ("li" in op) offset++;
					if ("ld" in op) offset--;
				}
				ops.push(op);
			});
		}
		return ops;
	}

	var ops = [];
	var keys = new Set([...Object.keys(input), ...Object.keys(output)]);
	keys.forEach(function(key) {
		var newOps = diff(input[key], output[key], [...path, key]);
		ops = ops.concat(newOps);
	});
	return ops;
}

var optimizedDiff = function(input, output) {
	return optimize(diff(input, output));
}

module.exports = optimizedDiff;