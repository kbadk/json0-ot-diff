"use strict";

var assert = require("assert");
var equal = require("deep-equal");
var clone = require("clone");
var json1 = require("ot-json1").type;
var jsondiff = require("./index.js");

var tests = [
	//tests of li/ld
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
	//[
	//	["foo", "bar", "quux"],
	//	["bar"]
	//],
	//[
	//	[["foo", "bar"], "bar"],
	//	["bar", "bar"]
	//],
	//[
	//	[["foo", "bar"], "bar"],
	//	[]
	//],
	//[
	//	[[["foo"], "bar"], "quux"],
	//	["quux"]
	//],
	//[
	//	["foo", "bar", "quux"],
	//	["bar", "quux"]
	//],
	//// tests for object/array
	//[
	//	{},
	//	[]
	//],
	//// tests for oi/od
	//[
	//	{},
	//	{"foo":"bar"}
	//],
	//[
	//	{"foo":"bar"},
	//	{"foo":"quux"}
	//],
	//[
	//	[	{ foo: 'bar' } ],
	//	[	{} ]
	//],
	//// big tests
	//[
	//	[],
	//	["the", {"quick":"brown", "fox":"jumped"}, "over", {"the": ["lazy", "dog"]}]
	//],
	//[
	//	["the", {"quick":"brown", "fox":"jumped"}, "over", {"the": ["lazy", "dog"]}],
	//	[]
	//],
	//[
	//	[["the", {"quick":"black", "fox":"jumped"}, "over", {"the": ["lazy", "dog"]}]],
	//	["the", {"quick":"brown", "fox":"leapt"}, "over", {"the": ["stupid", "dog"]}]
	//],
	//// real-life jsonml tests
	//[
	//	[ 'html', {}, [ 'body', {}, '\n\n', '\n\n',     [ 'p', {}, 'Quux!' ] ], '\n' ],
	//	[ 'html', {}, [ 'body', {}, '\n\n', '\n\n\n\n', [ 'p', {}, 'Quux!' ] ], '\n' ]
	//],
	//[
	//	[ 'html', {}, [ 'body', {}, '\n\n', '\n\n', [ 'p', {}, 'Quux!' ] ], '\n' ],
	//	[ 'html', {}, [ 'body', {}, '\n\n\n\n',     [ 'p', {}, 'Quux!' ] ], '\n' ]
	//],
	//[
	//	["html", {},
	//		["body", {},
	//			"foo", ["b", {}, "hello"],
	//			"foo", ["b", {}], ["strong", {}, "bar"]
	//		]
	//	],
	//	["html", {},
	//		["body", {},
	//			"foo", ["b", {}], ["strong", {}, "bar"],
	//			["p", {}]
	//		]
	//	]
	//],
	//[
	//	["html", {},
	//		"\n",
	//		["body", {"contenteditable":""},
	//			"\n",
	//			["div", {}, "a"],
	//			"\n",
	//			["div", {}, "b"],
	//			"\n",
	//			["div", {}, "c"],
	//			"\n"
	//		],
	//		"\n"
	//	],
	//	["html", {},
	//		"\n",
	//		["body", {"contenteditable":""},
	//			"\n",
	//			["div", {}, "b"],
	//			"\n",
	//			["div", {}, "c"],
	//			"\n"
	//		],
	//		"\n"
	//	]
	//]
];

// Test whether jsondiff modifies the input/output (it shouldn't).
tests.forEach(function([input, output]) {
	var cinput = clone(input), coutput = clone(output);
	jsondiff(input, output);
	assert(equal(cinput, input));
	assert(equal(coutput, output));
});

// Actual tests
tests.forEach(function([input, output]) {
	var ops = jsondiff(input, output);
	var generatedOutput = json1.apply(input, ops);
	assert(equal(generatedOutput, output));
});

console.log("No errors!");
