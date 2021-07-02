const FeatureFileParser = require('../src/FeatureFileParser');
const fs = require('fs');
const path = require('path');

describe("Parser", function () {
    
    it("should throw error when non-string contents are passed", function() {
        const parser = new FeatureFileParser();
        expect(() => {
            parser.parse(34) ;
        }).toThrowError("Incompatible input type. String is expected.")
    });

});