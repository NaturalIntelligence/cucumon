const FeatureFileParser = require('../src/FeatureFileParser');
const fs = require('fs');
const path = require('path');

describe("Events:", function () {

    it("should run as expected", function() {
        const parser = new FeatureFileParser();

        const filePath = path.join( __dirname, "./features/Inputs.feature");
        const result = parser.parse(fs.readFileSync( filePath ).toString()) ;
        const actual = JSON.parse(JSON.stringify(result));
        const expected = require( "./Inputs.json" );
        expect(expected).toEqual(actual);
        //console.log(JSON.stringify(actual,null,4));
        //console.log(JSON.stringify(result,null,4));
    });

});
