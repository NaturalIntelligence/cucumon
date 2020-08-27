const FeatureFileParser = require('../src/FeatureFileParser');
const fs = require('fs');
const path = require('path');

describe("Others", function () {
    const parser = new FeatureFileParser();

    it("should throw error when tags with whitespaces", function() {
        const line = "@tag with whitespace";
        expect(()=>{
            parser.lineNumber = 0;
            parser.breakIntoTags(line);
        }).toThrowError("Tags are not allowed with white spaces at line number 1");
    });

    it("should throw error when tags with whitespaces", function() {
        const parser = new FeatureFileParser();
        const data = `
        Feature: invalid

        Scenario: again invalid
            Given this step

        @tag
        `
        expect(()=>{
            parser.parse(data);
        }).toThrowError("Unexpected line at line number 9");
    });
    
    it("should split joint tags", function() {
        const line = "@tag@joint#2 #skip comments";
        const result = parser.breakIntoTags(line);

        expect(result).toEqual(["@tag", "@joint#2"]);
    });

    it("should read tags of next scenario", function() {
        const parser = new FeatureFileParser();
        const data = `
        @feature
        Feature: invalid

        @tags
        Scenario: again invalid
            Given this step

        @tag2
        @tag3
        #comment
        Scenario: some thing
            Given this step
        `

        const result = parser.parse(data);
        const actual = JSON.parse(JSON.stringify(result));
        const expected = require( "./tags.json" );
        expect(expected).toEqual(actual);
    });
});