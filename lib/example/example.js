const Detector = require('../detector'),
    fs = require("fs");
let exampleHtmlFile = fs.realpathSync(".") + "/lib/example/example.html";

// Input file, output to console
let detector = new Detector();
detector.scanFromFile(exampleHtmlFile);