SEO Defects Detector
=========
[![Build Status](https://travis-ci.org/dangquanglight/seo-defects.svg?branch=master)](https://travis-ci.org/dangquanglight/seo-defects)

A module to scan a HTML input and output all of the SEO defects

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Installation
Install SEO defects globally using [npm](https://www.npmjs.com/): 

```bash
npm install -g @quanglight/seo-defects
```

Install on npm locally and save it in your package's package.json file:

```bash
npm install --save-dev @quanglight/seo-defects
```

### Example

To get familiar with usage of the module, run an example after installation in terminal:

```bash
# cd to seo-defects installed folder inside node_modules folder
npm run-script example
```
  
Output should be printed to terminal like below:

```bash
This HTML has 3 <img> tag without alt attribute
This HTML has 1 <a> tag without rel attribute
This HTML has <head> tag without <title> tag
This HTML has <head> tag without <meta name='descriptions'/> tag
This HTML has <head> tag without <meta name='keywords'/> tag
This HTML has more than one <h1> tag
```

### Pre-defined SEO rules

This module provides a list of pre-defined SEO rules with ability to override/add new rule easily:

```html
1. Detect if there are any <img /> tags without alt attribute
2. Detect if there are any <a /> tags without rel attribute
3. In <head> tag
   i. Detect if there is any header that doesn’t have <title> tag
   ii. Detect if there is any header that doesn’t have <meta name=“descriptions” ... />
       tag
   iii. Detect if there is any header that doesn’t have <meta name=“keywords” ... /> tag
4. Detect if there are more than 15 <strong> tag in HTML (15 is a value should be
configurable by user)
5. Detect if a HTML have more than one <H1> tag.
```

### Usage

##### The input can be either:
- A HTML file (User is able to config the input path)
- A HTML string
- Node Readable Stream
##### The output can be either:
- A file (User is able to config the output destination)
- Node Writable Stream
- Console
- A string as plain text

##### Basic usage

###### Input file, output to console
```javascript
const Detector = require('@quanglight/seo-defects');
let exampleHtmlFile = "/an_absolute_path_to/file.html";

// Input file, output to console
let detector = new Detector();
detector.scanFromFile(exampleHtmlFile);
```

###### Input HTML string, output to string and print it to console
```javascript
const Detector = require('@quanglight/seo-defects');
let exampleHtml = "<strong>Text</strong>";

let detector = new Detector("string");
detector.proceedScan(exampleHtml);
let stringResult = detector.outputResult();
console.log(stringResult);
```

###### Input file with override rule and add new rule, output to console
```javascript
const Detector = require('@quanglight/seo-defects');
// Custom rule could be a json object, json string or even json file
let customRule = require('/an_absolute_path_to/custom-rules.json');
let exampleHtmlFile = "/an_absolute_path_to/file.html";

// Input file with override rule and add new rule, output to console
detector = new Detector("console", JSON.stringify(customRule));
detector.scanFromFile(exampleHtmlFile);
```

###### Input file, output to file with configurable path
```javascript
const Detector = require('@quanglight/seo-defects');
let outputFilePath = "/an_absolute_file_path/";
let exampleHtmlFile = "/an_absolute_path_to/file.html";

// Input file, output to file with configurable path
detector = new Detector("file", {}, outputFilePath);
detector.scanFromFile(exampleHtmlFile);
```

###### Input readable stream, output to console
```javascript
const Detector = require('@quanglight/seo-defects');
let exampleHtmlFile = "/an_absolute_path_to/file.html";

// Input readable stream, output to console
detector = new Detector();
detector.scanFromStream(require('fs').createReadStream(exampleHtmlFile));
```

###### Input file, output to writable stream with allow to access writable stream
```javascript
const Detector = require('@quanglight/seo-defects');
let exampleHtmlFile = "/an_absolute_path_to/file.html";

// Input file, output to writable stream
detector = new Detector("stream");
let writeStream = detector.outputWriteStream;
writeStream.write = function(data) {
    console.log('Test override write() function');
    console.log(data);
};
detector.scanFromFile(exampleHtmlFile);
```

#### Rule structure
Rule is a JSON which can be an object, string or file. To define a rule, it must has structure as below:

With current structure, it support 3 types of rule for SEO defects detection: 
- Detect tag has property
- Detect tag contains child tag
- Compare number of tag with given positive number

Below are the way to define a rule for each type:
##### Detect tag has property
```json
{
  "img": {
    "tag": "img",
    "conditions": [
      {
        "attribute": {
          "assertion": "to.have.property",
          "assertValue": "alt"
        },
        "defectMessage": "This HTML has %d <img> tag without alt attribute"
      }
    ]
  }
}
```

##### Detect tag contains child tag
```json
{
  "head": {
      "tag": "head",
      "conditions": [
        {
          "children": {
            "assertion": "to.containSubset",
            "assertValue": [{
              "name": "title"
            }]
          },
          "defectMessage": "This HTML has <head> tag without <title> tag"
        },
        {
          "children": {
            "assertion": "to.containSubset",
            "assertValue": [{
              "name": "meta",
              "attribs": {
                "name": "description"
              }
            }]
          },
          "defectMessage": "This HTML has <head> tag without <meta name='descriptions'/> tag"
        }
      ]
    }
}
```

##### Compare number of tag with given positive number
```json
{
  "h1": {
      "tag": "h1",
      "conditions": [
        {
          "itself": {
            "assertion": "length.to.be.below",
            "assertValue": 2
          },
          "defectMessage": "This HTML has more than one <h1> tag"
        }
      ]
    }
}
```

## Tests
Run this command in your package after installation to get test result and its coverage information:

```bash
npm test
```
  
## Credits
The main operation mechanism of this module was inspired by [SEO Cop](https://github.com/maulik887/seo-cop) module created by [Maulik Patel](http://maulik.me) with all new source code structure intend to improve ability of maintenance and contribution.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
