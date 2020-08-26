const FeatureFileParser = require('../src/FeatureFileParser');
const fs = require('fs');
const path = require('path');

describe("Scenario Outline:", function () {

    it("Multiple examples", function() {
        const parser = new FeatureFileParser();

        const filePath = path.join( __dirname, "./features/ScenarioOutline.feature");
        const result = parser.parse(fs.readFileSync( filePath ).toString()) ;
        const actual = JSON.parse(JSON.stringify(result));
        const expected = require( "./MultipleExamples.json" );
        expect(expected).toEqual(actual);
        //console.log(JSON.stringify(actual,null,4));
        //console.log(JSON.stringify(result,null,4));
    });

});
