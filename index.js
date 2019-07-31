"use strict";

var equal = require("deep-equal");

/**
 * Convert a number of string patches to OT operations.
 * @param  {JsonMLPath} path Base path for patches to apply to.
 * @param  {string} oldValue Old value.
 * @param  {string} newValue New value.
 * @return {Ops}             List of resulting operations.
 */
function patchesToOps(path, oldValue, newValue, diffMatchPatch, diffMatchPatchInstance) {
	const ops = [];

	var patches = diffMatchPatchInstance.patch_make(oldValue, newValue);

	Object.keys(patches).forEach(function(i) {
		var patch = patches[i], offset = patch.start1;
		patch.diffs.forEach(function([type, value]) {
			switch (type) {
				case diffMatchPatch.DIFF_DELETE:
					ops.push({ sd: value, p: [...path, offset] });
					break;
				case diffMatchPatch.DIFF_INSERT:
					ops.push({ si: value, p: [...path, offset] });
					// falls through intentionally
				case diffMatchPatch.DIFF_EQUAL:
					offset += value.length;
					break;
				default: throw Error(`Unsupported operation type: ${type}`);
			}
		});
	});

	return ops;
}

var diffMatchPatchInstance;

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

var diff = function(input, output, path=[], diffMatchPatch) {
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

	// If diffMatchPatch was provided, handle string mutation.
	if (diffMatchPatch && (typeof input === "string") && (typeof output === "string")) {

		// Instantiate the instance of diffMatchPatch only once.
		if (!diffMatchPatchInstance) {
			diffMatchPatchInstance = new diffMatchPatch();
		}

		return patchesToOps(path, input, output, diffMatchPatch, diffMatchPatchInstance);
	}

	var primitiveTypes = ["string", "number", "boolean"];
	// If either of input/output is a primitive type, there is no need to perform deep recursive calls to
	// figure out what to do. We can just replace the objects.
	if (primitiveTypes.includes(typeof output) || primitiveTypes.includes(typeof input)) {
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
			var newOps = diff(input[i], output[i], [...path, i + offset], diffMatchPatch);
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
		var newOps = diff(input[key], output[key], [...path, key], diffMatchPatch);
		ops = ops.concat(newOps);
	});
	return ops;
}

var optimizedDiff = function(input, output, diffMatchPatch) {
	return optimize(diff(input, output, [], diffMatchPatch));
}

module.exports = optimizedDiff;
