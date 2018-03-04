'use strict';

// Declare some global variables
const fs = require('fs');
const sprintf = require("sprintf-js").sprintf;

/**
 * @param outputType
 * @param customRules
 * @param outputFilePath
 * @constructor
 */
function Detector(outputType, customRules, outputFilePath) {
    // Declare global output type variable, default value is "console"
    this.outputType = outputType;
    switch (this.outputType) {
        case "stream":
            this.initOutputStream();
            break;
        case "file":
            this.outputFilePath = typeof outputFilePath === "undefined" ?
                "" :
                outputFilePath.replace(/\/+$/, ''); // Remove trailing slash If any
            break;
    }

    // Set default rule from config to global rules variable
    let defaultRules = require("./config/rules.json");
    this.rules = JSON.parse(JSON.stringify(defaultRules));

    // In case of given config is a json string, parse it firstly
    if (typeof customRules === "string" && customRules !== "") {
        customRules = JSON.parse(customRules);
    }

    // Allow to add new/override rules from given customRules variable
    let scope = this;
    if (typeof customRules === "object") {
        Object.keys(customRules).forEach(key => {
            if (typeof scope.rules[key] !== "undefined" &&
                (!customRules[key].hasOwnProperty("tag") || !customRules[key].hasOwnProperty("conditions"))) {
                return console.log("Invalid custom rule " + key);
            }
            // Create empty object for new rule
            if (typeof scope.rules[key] === "undefined") {
                scope.rules[key] = {};
            }

            if (typeof customRules[key].tag !== "undefined") {
                scope.rules[key].tag = customRules[key].tag;
            }

            if (typeof customRules[key].conditions !== "undefined" && customRules[key].conditions instanceof Array) {
                scope.rules[key].conditions = customRules[key].conditions;
            }
        });
    }
}

/**
 * Init readable and writable stream in case of output type is stream
 */
Detector.prototype.initOutputStream = function () {
    // Declare global readable stream variable
    const Readable = require('stream').Readable;
    this.globalReadableStream = new Readable({
        objectMode: true,
        read() {}
    });

    // Allow user to manipulate write stream object by access this outputWriteStream
    this.outputWriteStream = this._createWritableStream();
};

/**
 * Parse HTML from file.
 *
 * @param file - A string path of an HTML file.
 */
Detector.prototype.scanFromFile = function (file) {
    let scope = this;
    fs.stat(file, (err) => {
        if (err) {
            console.log("Invalid file path");
            return;
        }

        let stream = fs.createReadStream(file);
        scope.scanFromStream(stream);
    });
};

/**
 * Parse HTML from stream
 *
 * @param stream - A node object of readable stream.
 */
Detector.prototype.scanFromStream = function (stream) {
    if (typeof stream !== "object" && typeof stream.on !== "function") {
        return console.log("Invalid stream object");
    }
    let scope = this;
    stream.on('data', chunk => {
        // Remove newlines and tabs
        let rawHtml = chunk.toString().replace((/  |\r\n|\n|\r/gm), "");
        scope.proceedScan(rawHtml);
    });
    stream.on('end', () => {
        scope.outputResult();
    });
};

/**
 * Use scanner to proceed scan for SEO defects in given html
 *
 * @param html - HTML string content.
 */
Detector.prototype.proceedScan = function (html) {
    const Scanner = require('./scanner');
    let elements = this._parseHTML(html),
        scope = this,
        scanner = new Scanner();
    Object.keys(this.rules).forEach(key => {
        let rule = scope.rules[key],
            htmlTag = rule.tag;
        rule.conditions.forEach(condition => {
            condition.defectCount = scanner.scan(elements, htmlTag, condition);
        });
    });
};

/**
 * Use cheerio module to parse HTML
 *
 * @link https://github.com/cheeriojs/cheerio
 *
 * @param html - A HTML string
 * @returns {*}
 * @private
 */
Detector.prototype._parseHTML = function (html) {
    return require('cheerio').load(html, {
        normalizeWhitespace: true,
        xmlMode: true,
        lowerCaseTags: true,
        lowerCaseAttributeNames: true
    });
};

/**
 * Output result in many ways:
 * + Console (Default way)
 * + Stream
 * + File
 * + String
 *
 * @returns {string}
 */
Detector.prototype.outputResult = function () {
    let scope = this;
    switch (this.outputType) {
        case "stream":
            this.globalReadableStream.push(scope._getOutputMessages());
            break;
        case "file":
            let fileName = "SEO_defects_scan_result.txt",
                fullFilePath = this.outputFilePath + "/" + fileName,
                path = require('filepath').create(fullFilePath);
            path.write(scope._getOutputMessages())
                .then(() => {
                    console.log(sprintf("SEO defects scan result saved in %s", fullFilePath));
                })
                .catch(err => {
                    return console.log(err);
                });
            break;
        case "string":
            return scope._getOutputMessages();
        default:
            console.log(scope._getOutputMessages());
    }
};

/**
 * @returns {string}
 * @private
 */
Detector.prototype._getOutputMessages = function () {
    let outputMessage = "",
        scope = this;
    Object.keys(this.rules).forEach(key => {
        let rule = scope.rules[key];
        rule.conditions.forEach(condition => {
            if (condition.defectCount === -1) {
                let error = 'Invalid rule conditions for HTML tag "' + scope.rules[key].tag + '"';
                outputMessage = outputMessage === "" ? error : outputMessage + "\n" + error;
            } else if (condition.defectCount > 0) {
                outputMessage = outputMessage === "" ?
                    sprintf(condition.defectMessage, condition.defectCount) :
                    outputMessage + "\n" + sprintf(condition.defectMessage, condition.defectCount);
            }
        });
    });
    return outputMessage;
};

/**
 * Create new writable stream object and implement write() function to print message to console be default
 * User can override write() function by access outputWriteStream property of Detector object
 *
 * @returns {"stream".internal.Writable}
 * @private
 */
Detector.prototype._createWritableStream = function () {
    const Writable = require('stream').Writable;
    let writeStream = new Writable({
        objectMode: true,
        write: (data) => {
            console.log(data);
        }
    });
    this.globalReadableStream.pipe(writeStream);
    return writeStream;
};

module.exports = Detector;