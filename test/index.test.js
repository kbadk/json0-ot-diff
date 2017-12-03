"use strict";

// Mocha assertions
let assert = require("assert");
// Library we're testing
let jsondiff = require("../index.js");
// json0 transform to work out if the right transform is being created
let json0 = require("ot-json0/lib/json0");
// Assertion expectations
let expect = require("chai").expect;

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
      tests.forEach(test => {
        it(test.name, function() {
          let output = jsondiff(test.start, test.end);
          expect(output).to.deep.have.same.members(test.expectedCommand);
        });
      });
    });
    describe("List Replace (oi + od)", function() {
      let tests = [
        {
          name: "Add one string to middle of array",
          start: ["one", "two"],
          end: ["one", "three", "two"],
          expectedCommand: [
            {
              p: [1],
              ld: "two",
              li: "three"
            },
            {
              p: [2],
              li: "two"
            }
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
      tests.forEach(test => {
        it(test.name, function() {
          let output = jsondiff(test.start, test.end);
          expect(output).to.deep.have.same.members(test.expectedCommand);
        });
      });
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
      tests.forEach(test => {
        it(test.name, function() {
          let output = jsondiff(test.start, test.end);
          expect(output).to.deep.equal(test.expectedCommand);
        });
      });
    });
    describe("Object Replace (oi + od)", function() {
      let tests = [
        {
          name: "Replaces one string value to empty object",
          start: { one: "one" },
          end: { one: "two" },
          expectedCommand: [
            {
              p: ["one"],
              oi: "two",
              od: "one"
            }
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
      tests.forEach(test => {
        it(test.name, function() {
          let output = jsondiff(test.start, test.end);
          expect(output).to.deep.equal(test.expectedCommand);
        });
      });
    });
  });
});
