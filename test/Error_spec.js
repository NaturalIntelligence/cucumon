const FeatureFileParser = require('../src/FeatureFileParser');
const fs = require('fs');
const path = require('path');

describe("Tags", function () {
    
    it("should throw error when non-string contents are passed", function() {
        const parser = new FeatureFileParser();
    
        const filePath = path.join( __dirname, "./features/Tags.feature");
        const content = fs.readFileSync( filePath );
        expect(() => {
            parser.parse(content) ;
        }).toThrowError("Incompatible input type. String is expected.")
    });

});