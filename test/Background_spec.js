const FeatureFileParser = require('../src/FeatureFileParser');
const fs = require('fs');
const path = require('path');

describe("Background", function () {

    it("should throw error when scenario with no steps", async function(done) {
        const parser = new FeatureFileParser();
        const stepWords = [];

        parser.on("background", bg => {
            expect(bg.keyword).toBe("background");
        })
        
        parser.on("scenario", scenario => {
            expect(scenario.keyword).toBe("scenario");
        })
        
        parser.on("step", step => {
            stepWords.push(step.keyword);
        })

        parser.on("end", () => {
            expect(stepWords).toEqual(["Given", "When", "Then", "When", "Then"]);
            done();
        });

        const filePath = path.join( __dirname, "./features/Background.feature");
        const inputStream = fs.createReadStream( filePath );
        parser.parseFile(inputStream) ;
        //console.log(JSON.stringify(parser.output,null,4));
    });


});