"use strict";

var equal = require("deep-equal");

var diffMatchPatchInstance;

function replaceOp(path, isObject, input, output, json1) {
	var op;
	if (json1) {
		op = json1.replaceOp(path, input, output);
	} else {
		op = { p: path };
		op[isObject ? "od" : "ld"] = input;
		op[isObject ? "oi" : "li"] = output;
	}
	return [op];
}

/**
 * Convert a number of string patches to OT operations.
 * @param  {JsonMLPath} path Base path for patches to apply to.
 * @param  {string} oldValue Old value.
 * @param  {string} newValue New value.
 * @return {Ops}             List of resulting operations.
 */
function patchesToOps(path, oldValue, newValue, diffMatchPatch, json1, textUnicode) {
	const ops = [];

	var patches = diffMatchPatchInstance.patch_make(oldValue, newValue);

	Object.keys(patches).forEach(function(i) {
		var patch = patches[i], offset = patch.start1;
		patch.diffs.forEach(function([type, value]) {
			switch (type) {
				case diffMatchPatch.DIFF_DELETE:
					if (textUnicode) {
						var unicodeOp = textUnicode.remove(offset, value);
						ops.push(json1.editOp(path, textUnicode.type, unicodeOp));
					} else {
						ops.push({ sd: value, p: [...path, offset] });
					}
					break;
				case diffMatchPatch.DIFF_INSERT:
					if (textUnicode) {
						var unicodeOp = textUnicode.insert(offset, value);
						ops.push(json1.editOp(path, textUnicode.type, unicodeOp));
					} else {
						ops.push({ si: value, p: [...path, offset] });
					}
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

var optimize = function(ops, options) {
	if (options && options.json1) {
		var compose = options.json1.type.compose;
		return ops.reduce(compose, null);
	}
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

var diff = function(input, output, path=[], options) {
	var diffMatchPatch = options && options.diffMatchPatch;
	var json1 = options && options.json1;
	var textUnicode = options && options.textUnicode;

	// If the last element of the path is a string, that means we're looking at a key, rather than
	// a number index. Objects use keys, so the target for our insertion/deletion is an object.
	var isObject = typeof path[path.length-1] === "string" || path.length === 0;

	// If input and output are equal, no operations are needed.
	if (equal(input, output) && Array.isArray(input) === Array.isArray(output)) {
		return [];
	}

	// If there is no output, we need to delete the current data (input).
	if (typeof output === "undefined") {
		var op;
		if (json1) {
			op = json1.removeOp(path, input);
		} else {
			op = { p: path };
			op[isObject ? "od" : "ld"] = input;
		}
		return [op];
	}

	// If there is no input, we need to add the new data (output).
	if (typeof input === "undefined") {
		var op;
		if (json1) {
			op = json1.insertOp(path, output);
		} else {
			op = { p: path };
			op[isObject ? "oi" : "li"] = output;
		}
		return [op];
	}

	// If diffMatchPatch was provided, handle string mutation.
	if (diffMatchPatch && (typeof input === "string") && (typeof output === "string")) {

		// Instantiate the instance of diffMatchPatch only once.
		if (!diffMatchPatchInstance) {
			diffMatchPatchInstance = new diffMatchPatch();
		}

		return patchesToOps(path, input, output, diffMatchPatch, json1, textUnicode);
	}

	var primitiveTypes = ["string", "number", "boolean"];
	// If either of input/output is a primitive type, there is no need to perform deep recursive calls to
	// figure out what to do. We can just replace the objects.
	if (primitiveTypes.includes(typeof output) || primitiveTypes.includes(typeof input)) {
		return replaceOp(path, isObject, input, output, json1);
	}

	if (Array.isArray(output) && Array.isArray(input)) {
		var ops = [];
		var inputLen = input.length, outputLen = output.length;
		var minLen = Math.min(inputLen, outputLen);
		var ops = [];
		for (var i=0; i < minLen; ++i) {
			var newOps = diff(input[i], output[i], [...path, i], options);
			newOps.forEach(function(op) {
				ops.push(op);
			});
		}
		if (outputLen > inputLen) {
			// deal with array insert
			for (var i=minLen; i < outputLen; i++) {
				var newOps = diff(undefined, output[i], [...path, i], options);
				newOps.forEach(function(op) {
					ops.push(op);
				});
			}
		} else if (outputLen < inputLen) {
			// deal with array delete
			for (var i=minLen; i < inputLen; i++) {
				var newOps = diff(input[i], undefined, [...path, minLen], options);
				newOps.forEach(function(op) {
					ops.push(op);
				});
			}
		}
		return ops;
	} else if (Array.isArray(output) || Array.isArray(input)) {
		// deal with array/object
		return replaceOp(path, isObject, input, output, json1);
	}

	var ops = [];
	var keys = new Set([...Object.keys(input), ...Object.keys(output)]);
	keys.forEach(function(key) {
		var newOps = diff(input[key], output[key], [...path, key], options);
		ops = ops.concat(newOps);
	});
	return ops;
}

var optimizedDiff = function(input, output, diffMatchPatch, json1, textUnicode) {
	var options = { diffMatchPatch, json1, textUnicode };
	return optimize(diff(input, output, [], options), options);
}

module.exports = optimizedDiff;
