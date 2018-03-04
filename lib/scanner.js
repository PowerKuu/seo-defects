'use strict';

// Use assume as assertion library to detect SEO defect by given condition
const assume = require('assumejs');

// Include "containSubset" object properties matcher for Chai assertion library
const chaiSubset = require('chai-subset');
assume.chaiUse(chaiSubset);

/**
 * @constructor
 */
function Scanner() {}

/**
 * @param elements
 * @param htmlTag
 * @returns {*|null|Array}
 */
Scanner.prototype.findElements = function (elements, htmlTag) {
    const htmlParser = require('htmlparser');
    let htmlString = elements.html(elements(htmlTag)),
        handler = new htmlParser.DefaultHandler((error, dom) => {}),
        parser = new htmlParser.Parser(handler);
    parser.parseComplete(htmlString);
    return handler.dom;
};

/**
 * Use assume library to do assertion by given condition
 * Ex: ruleAssertion(obj, "to.have.property", "title")
 * will return value as result of assume(obj).to.have.property("title")
 *
 * @link https://github.com/analog-nico/assumejs
 *
 * @param obj - An object that needs to do an assertion
 * @param assertionString - A string for assertion condition. Ex: "to.have.property"
 * @param assertValue
 * @returns {*}
 */
Scanner.prototype.ruleAssertion = function(obj, assertionString, assertValue) {
    let ruleConditions = assertionString.split("."),
        assertionObject = assume(obj);
    for (let index = 0; index < ruleConditions.length; index++) {
        // Set assertion value to the last condition
        if (index === ruleConditions.length - 1) {
            if (typeof assertionObject[ruleConditions[index]] !== "function") {
                throw "Invalid condition";
            }
            return assertionObject[ruleConditions[index]](assertValue);
        }

        // Combine assertion condition
        assertionObject = assertionObject[ruleConditions[index]];
    }
};

/**
 * Scan all SEO defects in HTML parsed object by given HTML tag
 *
 * @param elements - A HTML parsed object
 * @param htmlTag
 * @param condition - An object contains data to find all SEO defects by given tagName
 * @returns {number} of defect(s) count
 */
Scanner.prototype.scan = function(elements, htmlTag, condition) {
    // Init overwriteNotify before actual call assertion function
    let defectCount = 0;
    assume.overwriteNotify((_super) => {
        // The function returned will be called once an assumption gets violated.
        // Use it to count number of defects found
        return (err, context) => {
            defectCount++;
        };
    });

    // Assertion of itself
    elements = this.findElements(elements, htmlTag);
    if (condition.itself) {
        try {
            this.ruleAssertion(elements, condition.itself.assertion, condition.itself.assertValue);
        } catch (err) {
            defectCount = -1;
        }
    } else if (condition.attribute || condition.children) { // Assertion of its attribute or its child attribute
        let ruleType = condition.attribute ? "attribute" : "children";
        elements.forEach(element => {
            try {
                let obj = condition.attribute ? element.attribs : element.children;
                if (!obj) {
                    obj = {};
                }
                this.ruleAssertion(obj, condition[ruleType].assertion, condition[ruleType].assertValue);
            } catch (err) {
                defectCount = -1;
            }
        });
    }
    return defectCount;
};

module.exports = Scanner;