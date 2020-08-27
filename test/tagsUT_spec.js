const FeatureFileParser = require('../src/FeatureFileParser');

describe("Others", function () {
    const parser = new FeatureFileParser();

    it("should throw error when tags with whitespaces", function() {
        const line = "@tag with whitespace";
        expect(()=>{
            parser.lineNumber = 0;
            parser.recordTags(line);
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
        parser.recordTags(line);

        expect(parser.tags).toEqual(["@tag", "@joint#2"]);
    });
});