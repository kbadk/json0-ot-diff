"use strict";

var assert = require("assert");
var equal = require("deep-equal");
var clone = require("clone");
var json0 = require("ot-json0");
let json1 = require("ot-json1");
let diffMatchPatch = require("diff-match-patch");
let textUnicode = require("ot-text-unicode");
var jsondiff = require("./index.js");

var tests = [
	// Tests of equality
	[
		5,
		5,
	],
	[
		"foo",
		"foo",
	],
	[
		["foo"],
		["foo"],
	],
	[
		[],
		[],
	],
	[
		{},
		{},
	],
	// Tests of li/ld
	[
		[],
		["foo"]
	],
	[
		["foo"],
		["bar"]
	],
	[
		["foo", "bar"],
		["bar"]
	],
	[
		["foo", "bar", "quux"],
		["bar"]
	],
	[
		[["foo", "bar"], "bar"],
		["bar", "bar"]
	],
	[
		[["foo", "bar"], "bar"],
		[]
	],
	[
		[[["foo"], "bar"], "quux"],
		["quux"]
	],
	[
		["foo", "bar", "quux"],
		["bar", "quux"]
	],
	// Tests for object/array
	[
		{},
		[]
	],
	[
		[],
		{}
	],
	// Tests for oi/od
	[
		{},
		{"foo":"bar"}
	],
	[
		{"foo":"bar"},
		{"foo":"quux"}
	],
	[
		[	{ foo: 'bar' } ],
		[	{} ]
	],
	// Null tests
	[null, null],
	[null, "foo"],
	[null, 123],
	["foo", null],
	[123, null],
	[null, {}],
	[{}, null],
	// String tests
	// Inspired by https://github.com/google/diff-match-patch/blob/master/javascript/tests/diff_match_patch_test.js
	["abc", "xyz"],
	["1234abcdef", "1234xyz"],
	["1234", "1234xyz"],
	["abc", "xyz"],
	["abcdef1234", "xyz1234"],
	["1234", "xyz1234"],
	["", "abcd"],
	["abc", "abcd"],
	["123456", "abcd"],
	["123456xxx", "xxxabcd"],
	["fi", "\ufb01i"],
	["1234567890", "abcdef"],
	["12345", "23"],
	["1234567890", "a345678z"],
	["a345678z", "1234567890"],
	["abc56789z", "1234567890"],
	["a23456xyz", "1234567890"],
	["121231234123451234123121", "a1234123451234z"],
	["x-=-=-=-=-=-=-=-=-=-=-=-=", "xx-=-=-=-=-=-=-="],
	["-=-=-=-=-=-=-=-=-=-=-=-=y", "-=-=-=-=-=-=-=yy"],
	["qHilloHelloHew", "xHelloHeHulloy"],
	["abcdefghijk", "fgh"],
	["abcdefghijk", "efxhi"],
	["abcdefghijk", "cdefxyhijk"],
	["abcdefghijk", "bxy"],
	["123456789xx0", "3456789x0"],
	["abcdefghijk", "efxyhi"],
	["abcdefghijk", "bcdef"],
	["abcdexyzabcde", "abccde"],
	["abcdefghijklmnopqrstuvwxyz01234567890", "XabXcdXefXghXijXklXmnXopXqrXstXuvXwxXyzX01X23X45X67X89X0"],
	["abcdef1234567890123456789012345678901234567890123456789012345678901234567890uvwxyz", "abcdefuvwxyz"],
	["1234567890123456789012345678901234567890123456789012345678901234567890", "abc"],
	["XY", "XtestY"],
	["XXXXYYYY", "XXXXtestYYYY"],
	["The quick brown fox jumps over the lazy dog.", "Woof"],
	// Big tests
	[
		[],
		["the", {"quick":"brown", "fox":"jumped"}, "over", {"the": ["lazy", "dog"]}]
	],
	[
		["the", {"quick":"brown", "fox":"jumped"}, "over", {"the": ["lazy", "dog"]}],
		[]
	],
	[
		[["the", {"quick":"black", "fox":"jumped"}, "over", {"the": ["lazy", "dog"]}]],
		["the", {"quick":"brown", "fox":"leapt"}, "over", {"the": ["stupid", "dog"]}]
	],
	// Real-life jsonml tests
	[
		[ 'html', {}, [ 'body', {}, '\n\n', '\n\n',     [ 'p', {}, 'Quux!' ] ], '\n' ],
		[ 'html', {}, [ 'body', {}, '\n\n', '\n\n\n\n', [ 'p', {}, 'Quux!' ] ], '\n' ]
	],
	[
		[ 'html', {}, [ 'body', {}, '\n\n', '\n\n', [ 'p', {}, 'Quux!' ] ], '\n' ],
		[ 'html', {}, [ 'body', {}, '\n\n\n\n',     [ 'p', {}, 'Quux!' ] ], '\n' ]
	],
	[
		["html", {},
			["body", {},
				"foo", ["b", {}, "hello"],
				"foo", ["b", {}], ["strong", {}, "bar"]
			]
		],
		["html", {},
			["body", {},
				"foo", ["b", {}], ["strong", {}, "bar"],
				["p", {}]
			]
		]
	],
	[
		["html", {},
			"\n",
			["body", {"contenteditable":""},
				"\n",
				["div", {}, "a"],
				"\n",
				["div", {}, "b"],
				"\n",
				["div", {}, "c"],
				"\n"
			],
			"\n"
		],
		["html", {},
			"\n",
			["body", {"contenteditable":""},
				"\n",
				["div", {}, "b"],
				"\n",
				["div", {}, "c"],
				"\n"
			],
			"\n"
		]
	]
];

// Test whether jsondiff modifies the input/output (it shouldn't).
tests.forEach(function([input, output]) {
	var cinput = clone(input), coutput = clone(output);
	jsondiff(input, output);
	assert(equal(cinput, input));
	assert(equal(coutput, output));
});

// Actual tests for json0
tests.forEach(function([input, output]) {
	var ops = jsondiff(input, output);

	// Don't let json0 mutate the input,
	// so we can use it in later tests.
	input = clone(input);
	ops.forEach(function(op) {
		assert.doesNotThrow(function() {
			input = json0.type.apply(input, [op]);
		}, null, "json0 could not apply transformation");
	});
	assert(equal(input, output));
});

// Actual tests for json1
tests.forEach(function([input, output]) {
	var ops = jsondiff(
		input,
		output,
		diffMatchPatch,
		json1,
		textUnicode
	);
	assert(equal(json1.type.apply(input, ops), output));
});

console.log("No errors!");
