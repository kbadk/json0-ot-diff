"use strict";

// Mocha assertions
let assert = require("assert");
// Library we're testing
let jsondiff = require("../index.js");
// OT types.
// These are applied to work out if the right transform is being created
let json0 = require("ot-json0");
let json1 = require("ot-json1");
let textUnicode = require("ot-text-unicode");
// Assertion expectations
let expect = require("chai").expect;
// Library for computing differences between strings
let diffMatchPatch = require("diff-match-patch");

let clone = function(object) {
  return JSON.parse(JSON.stringify(object));
}

describe("Jsondiff", function() {
  describe("Operations", function() {
    describe("List Insert (li)", function() {
      let tests = [
        {
          name: "Add one string to empty array",
          start: [],
          end: ["one"],
          expectedCommand: [
            {
              p: [0],
              li: "one"
            }
          ]
        },
        {
          name: "Add one number to empty array",
          start: [],
          end: [1],
          expectedCommand: [
            {
              p: [0],
              li: 1
            }
          ]
        },
        {
          name: "Add one boolean to empty array",
          start: [],
          end: [false],
          expectedCommand: [
            {
              p: [0],
              li: false
            }
          ]
        },
        {
          name: "Add one string to end of non-empty array",
          start: ["one"],
          end: ["one", "two"],
          expectedCommand: [
            {
              p: [1],
              li: "two"
            }
          ]
        },
        {
          name: "Add one number to end of non-empty array",
          start: [1],
          end: [1, 2],
          expectedCommand: [
            {
              p: [1],
              li: 2
            }
          ]
        },
        {
          name: "Add one boolean to end of non-empty array",
          start: [false],
          end: [false, true],
          expectedCommand: [
            {
              p: [1],
              li: true
            }
          ]
        }
      ];
      runTests(tests);
    });
    describe("List Replace (oi + od)", function() {
      let tests = [
        {
          name: "Add one string to middle of array",
          start: ["one", "two"],
          end: ["one", "three", "two"],
          expectedCommand: [
            { sd: 'wo', p: [ 1, 1 ] },
            { si: 'hree', p: [ 1, 1 ] },
            { p: [ 2 ], li: 'two' }
          ]
        },
        {
          name: "Add one number to middle of array",
          start: [1, 2],
          end: [1, 3, 2],
          expectedCommand: [
            {
              p: [1],
              ld: 2,
              li: 3
            },
            {
              p: [2],
              li: 2
            }
          ]
        },
        {
          name: "Add one boolean to middle of array",
          start: [false, false],
          end: [false, true, false],
          expectedCommand: [
            {
              p: [1],
              ld: false,
              li: true
            },
            {
              p: [2],
              li: false
            }
          ]
        }
      ];
      runTests(tests);
    });
    describe("Object Insert (oi)", function() {
      let tests = [
        {
          name: "Add one string value to empty object",
          start: {},
          end: { one: "two" },
          expectedCommand: [
            {
              p: ["one"],
              oi: "two"
            }
          ]
        },
        {
          name: "Add one number value to empty object",
          start: {},
          end: { one: 1 },
          expectedCommand: [
            {
              p: ["one"],
              oi: 1
            }
          ]
        },
        {
          name: "Add one boolean value to empty object",
          start: {},
          end: { one: true },
          expectedCommand: [
            {
              p: ["one"],
              oi: true
            }
          ]
        }
      ];
      runTests(tests);
    });
    describe("Object Replace (oi + od)", function() {
      let tests = [
        {
          name: "Replaces one string value to empty object",
          start: { one: "one" },
          end: { one: "two" },
          expectedCommand: [
            { sd: 'one', p: [ 'one', 0 ] },
            { si: 'two', p: [ 'one', 0 ] }
          ]
        },
        {
          name: "Replaces one number value to empty object",
          start: { one: 1 },
          end: { one: 2 },
          expectedCommand: [
            {
              p: ["one"],
              oi: 2,
              od: 1
            }
          ]
        },
        {
          name: "Replaces one boolean value to empty object",
          start: { one: true },
          end: { one: false },
          expectedCommand: [
            {
              p: ["one"],
              oi: false,
              od: true
            }
          ]
        }
      ];
      runTests(tests);
    });
    describe("String Mutation (si + sd)", function() {
      // These test cases come from diff-match-patch tests.
      let tests = [
        {
          name: "Top level string",
          start: "one",
          end: "two",
          expectedCommand: [
            { sd: "one", p: [0] },
            { si: "two", p: [0] }
          ]
        },
        {
          name: "Strings with a common prefix, null case",
          start: { one: "one" },
          end: { one: "two" },
          expectedCommand: [
            { sd: "one", p: [ "one", 0 ] },
            { si: "two", p: [ "one", 0 ] }
          ]
        },
        {
          name: "Strings with a common prefix, non-null case",
          start: { one: "1234abcdef" },
          end: { one: "1234xyz" },
          expectedCommand: [
            { sd: 'abcdef', p: [ 'one', 4 ] },
            { si: 'xyz', p: [ 'one', 4 ] }
          ]
        },
        {
          name: "Strings with a common prefix, whole case",
          start: { one: "1234" },
          end: { one: "1234xyz" },
          expectedCommand: [
            { si: 'xyz', p: [ 'one', 4 ] }
          ]
        },
        {
          name: "Strings with a common suffix, non-null case",
          start: { one: "abcdef1234" },
          end: { one: "xyz1234" },
          expectedCommand: [
            { sd: 'abcdef', p: [ 'one', 0 ] },
            { si: 'xyz', p: [ 'one', 0 ] }
          ]
        },
        {
          name: "Strings with a common suffix, whole case",
          start: { one: "1234" },
          end: { one: "xyz1234" },
          expectedCommand: [
            { si: 'xyz', p: [ 'one', 0 ] }
          ]
        },
        {
          name: "Strings suffix/prefix overlap, overlap case",
          start: { one: "123456xxx" },
          end: { one: "xxxabcd" },
          expectedCommand: [
            { "p": [ "one", 0 ], "sd": "123456xxx" },
            { "p": [ "one", 0 ], "si": "xxxabcd" }
          ]
        },
        {
          name: "Example from README",
          start: ["foo", "The only change here is at the end.", 1, 2, 3],
          end: ["foo", "The only change here is at the very end.", 1, 2],
          expectedCommand: [
            { p: [ 1, 31 ], si: "very " },
            { p: [ 4 ], ld: 3 }
          ]
        }
      ];
      runTests(tests);
    });
  });
});

function runTests(tests) {
  tests.forEach(test => {
    it(test.name, function() {

      //////////////////
      // Verify JSON0 //
      //////////////////
      let json0Op = jsondiff(test.start, test.end, diffMatchPatch);
      expect(json0Op).to.deep.equal(test.expectedCommand);

      // Test actual application of the expected ops.
      // Clone the input, because json0 mutates the input to `apply`.
      let json0Start = clone(test.start);
      let json0End = json0.type.apply(json0Start, json0Op);
      expect(json0End).to.deep.equal(test.end);


      //////////////////
      // Verify JSON1 //
      //////////////////
      let json1Op = jsondiff(
        test.start,
        test.end,
        diffMatchPatch,
        json1,
        textUnicode
      );

      // Test actual application of the expected ops.
      // No need to clone the input, json1 does _not_ mutate the input to `apply`.
      let json1End = json1.type.apply(test.start, json1Op);
      expect(json1End).to.deep.equal(test.end);
    });
  });
}
