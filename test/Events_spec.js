const FeatureFileParser = require('../src/FeatureFileParser');
const fs = require('fs');
const path = require('path');

describe("Events:", function () {

    it("should triggers events in sequence for all sections, steps, and examples", async function(done) {
        const parser = new FeatureFileParser({
            //clubBgSteps: true
        });
        const events = [];

        parser.on("background", bg => {
            events.push(bg.keyword);
        })
        parser.on("rule", rule => {
            events.push(rule.keyword);
        })
        parser.on("feature", feature => {
            events.push(feature.keyword);
        })
        parser.on("scenario", scenario => {
            expect(scenario.keyword).toBe("scenario");
            events.push(scenario.statement);
        })
        
        parser.on("step", step => {
            events.push(step.keyword);
        })

        parser.on("end", (result) => {
            expect(events).toEqual([
                "feature",
                "background", 
                "Given",
                "rule",
                'breaks string',
                "When", "Then",
                'breaks string',
                "When", "Then",
                'breaks string for " "', 
                "When", "Then"
            ]);
            //expect(result.feature.background).toBeNull();
            done();
        });

        const filePath = path.join( __dirname, "./features/Background.feature");
        const inputStream = fs.createReadStream( filePath );
        parser.parseFile(inputStream) ;

        
    });

    it("should triggers events in sequence for all sections, steps, and examples", async function(done) {
        const parser = new FeatureFileParser({
            clubBgSteps: true
        });
        const events = [];

        parser.on("rule", rule => {
            events.push(rule.keyword);
        })
        parser.on("feature", feature => {
            events.push(feature.keyword);
        })
        parser.on("scenario", scenario => {
            expect(scenario.keyword).toBe("scenario");
            events.push(scenario.statement);
        })
        
        parser.on("step", step => {
            events.push(step.keyword);
        })

        parser.on("end", (result) => {
            //console.log(events);
            expect(events).toEqual([
                "feature",
                "rule",
                'breaks string',
                "Given", "When", "Then",
                'breaks string',
                "Given", "When", "Then",
                'breaks string for " "', 
                "Given", "When", "Then"
            ]);
            //expect(result.feature.background).toBeNull();
            done();
        });

        const filePath = path.join( __dirname, "./features/Background.feature");
        const inputStream = fs.createReadStream( filePath );
        parser.parseFile(inputStream) ;

        
    });


});