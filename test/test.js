'use strict';

const expect = require('chai').expect;
const Detector = require('../lib/detector');

describe('Test default SEO rules', () => {
    let scope = this;

    beforeEach( () => {
        scope.detector = new Detector("string");
    });

    it('Valid SEO <img> tag has alt attribute', () => {
        scope.detector.proceedScan("<img alt=''></img>");
        expect(scope.detector.outputResult()).to.be.empty;
    });

    it('Invalid SEO <img> tag without alt attribute', () => {
        scope.detector.proceedScan("<img></img><img></img><img></img>");
        expect(scope.detector.outputResult()).to.be.equal("This HTML has 3 <img> tag without alt attribute");
    });

    it('Valid SEO <a /> tag has rel attribute', () => {
        scope.detector.proceedScan("<a rel='' />");
        expect(scope.detector.outputResult()).to.be.empty;
    });

    it('Invalid SEO <a /> tag without rel attribute', () => {
        scope.detector.proceedScan("<a/><a/>");
        expect(scope.detector.outputResult()).to.be.equal("This HTML has 2 <a> tag without rel attribute");
    });

    it('Valid SEO <head> tag has <title>, <meta name="description" /> & <meta name="keywords" /> tags', () => {
        scope.detector.proceedScan('<head><title>Title</title><meta name="description" content="Description"><meta name="keywords" content="key, words"></head>');
        expect(scope.detector.outputResult()).to.be.empty;
    });

    it('Invalid SEO <head> tag without <title> tag', () => {
        scope.detector.proceedScan('<head><meta name="description" content="Description"><meta name="keywords" content="key, words"></head>');
        expect(scope.detector.outputResult()).to.be.equal("This HTML has <head> tag without <title> tag");
    });

    it('Invalid SEO <head> tag without <meta name="description" /> tag', () => {
        scope.detector.proceedScan('<head><title>Title</title><meta name="keywords" content="key, words"></head>');
        expect(scope.detector.outputResult()).to.be.equal("This HTML has <head> tag without <meta name='descriptions'/> tag");
    });

    it('Invalid SEO <head> tag without <meta name="keywords" /> tag', () => {
        scope.detector.proceedScan('<head><title>Title</title><meta name="description" content="Description">');
        expect(scope.detector.outputResult()).to.be.equal("This HTML has <head> tag without <meta name='keywords'/> tag");
    });

    it('Invalid SEO <head> tag without <title> and <meta name="keywords" /> tags', () => {
        scope.detector.proceedScan('<head><meta name="description" content="Description">');
        expect(scope.detector.outputResult()).to.be.equal("This HTML has <head> tag without <title> tag\nThis HTML has <head> tag without <meta name='keywords'/> tag");
    });

    it('Valid SEO with less than 15 <strong> tags', () => {
        scope.detector.proceedScan("<strong>Strong text</strong><strong>Strong text</strong><strong>Strong text</strong>");
        expect(scope.detector.outputResult()).to.be.empty;
    });

    it('Invalid SEO with more than 15 <strong> tags', () => {
        let html = "<strong>Text</strong><strong>Text</strong><strong>Text</strong><strong>Text</strong><strong>Text</strong><strong>Text</strong><strong>Text</strong><strong>Text</strong><strong>Text</strong><strong>Text</strong><strong>Text</strong><strong>Text</strong><strong>Text</strong><strong>Text</strong><strong>Text</strong><strong>Text</strong>";
        scope.detector.proceedScan(html);
        expect(scope.detector.outputResult()).to.be.equal("This HTML has more than 15 <strong> tag");
    });

    it('Valid SEO with only 1 <h1> tag', () => {
        scope.detector.proceedScan("<h1>Strong text</h1>");
        expect(scope.detector.outputResult()).to.be.empty;
    });

    it('Invalid SEO with more than 1 <h1> tag', () => {
        scope.detector.proceedScan("<h1>Text</h1><h1>Text</h1>");
        expect(scope.detector.outputResult()).to.be.equal("This HTML has more than one <h1> tag");
    });
});

describe('Test default SEO rules with file/stream input', () => {
    let scope = this;

    beforeEach(() => {
        scope.detector = new Detector("string");
        const fs = require("fs");
        scope.exampleHtmlFile = fs.realpathSync(".") + "/lib/example/example.html";
    });

    it('Input from stream', () => {
        scope.detector.scanFromStream(require('fs').createReadStream(scope.exampleHtmlFile));
        expect(scope.detector.outputResult()).to.be.empty;
    });

    it('Input from file', () => {
        scope.detector.scanFromFile(scope.exampleHtmlFile);
        expect(scope.detector.outputResult()).to.be.empty;
    });
});

describe('Test override/add new rules', () => {
    let scope = this;

    beforeEach( () => {
        let customRules = {
            "custom": {
                "tag": "head",
                "conditions": [
                    {
                        "children": {
                            "assertion": "to.containSubset",
                            "assertValue": [{
                                "name": "meta",
                                "attribs": {
                                    "name": "robots"
                                }
                            }]
                        },
                        "defectMessage": "This HTML has <head> tag without <meta name='robots'/> tag"
                    }
                ]
            },
            "strong": {
                "tag": "strong",
                "conditions": [
                    {
                        "itself": {
                            "assertion": "length.to.be.below",
                            "assertValue": 3
                        },
                        "defectMessage": "This HTML has more than 2 <strong> tag"
                    }
                ]
            }
        };
        scope.detector = new Detector("string", customRules);
    });

    it('Valid SEO <head> tag has new rule for <meta name="robots" /> tag', () => {
        scope.detector.proceedScan('<head><title>Title</title><meta name="description" content="Description"><meta name="keywords" content="key, words"><meta name="robots" content="content"></head>');
        expect(scope.detector.outputResult()).to.be.empty;
    });

    it('Invalid SEO <head> tag has new rule for <meta name="robots" /> tag', () => {
        scope.detector.proceedScan('<head><title>Title</title><meta name="description" content="Description"><meta name="keywords" content="key, words"></head>');
        expect(scope.detector.outputResult()).to.be.equal("This HTML has <head> tag without <meta name='robots'/> tag");
    });

    it('Invalid SEO with override rule for more than 2 <strong> tag', () => {
        scope.detector.proceedScan('<strong>Text</strong><strong>Text</strong><strong>Text</strong>');
        expect(scope.detector.outputResult()).to.be.equal("This HTML has more than 2 <strong> tag");
    });

    it('Invalid custom rule', () => {
        let customRules = {
            "strong": {
                "tag": "strong",
                "conditions": [
                    {
                        "itself": {
                            "assertion": "invalid_assertion",
                            "assertValue": 3
                        },
                        "defectMessage": "This HTML has more than 2 <strong> tag"
                    }
                ]
            }
        };
        let detector = new Detector("string", customRules);
        detector.proceedScan('<strong>Text</strong>');
        expect(detector.outputResult()).to.be.equal('Invalid rule conditions for HTML tag "strong"');
    });
});