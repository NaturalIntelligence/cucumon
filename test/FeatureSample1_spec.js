const FeatureFileParser = require('../src/FeatureFileParser');
const fs = require('fs');
const path = require('path');

describe("Feature Sample 1", function () {

    it("should run as expected", function() {
        const parser = new FeatureFileParser();

        const filePath = path.join( __dirname, "./features/FeatureSample1.feature");
        const result = parser.parse(fs.readFileSync( filePath ).toString()) ;
        const actual = JSON.parse(JSON.stringify(result));
        const expected = require( "./FeatureSample1_1.json" );
        expect(expected).toEqual(actual);
        //console.log(JSON.stringify(actual,null,4));
        //console.log(JSON.stringify(expected,null,4));
    });

    it("should run as expected by clubbing the bg steps", function() {
        const parser = new FeatureFileParser({
            clubBgSteps: true
        });

        const filePath = path.join( __dirname, "./features/FeatureSample1.feature");
        const result = parser.parse(fs.readFileSync( filePath ).toString()) ;
        const actual = JSON.parse(JSON.stringify(result));
        const expected = require( "./FeatureSample1_clubbedBgSteps.json" );
        expect(expected).toEqual(actual);
        //console.log(JSON.stringify(result,null,4));
    });

});