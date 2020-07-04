const FeatureFileParser = require('../src/FeatureFileParser');

describe("Feature file Parser", function () {

    
    it("should parse feature file", function() {
        const parser = new FeatureFileParser({
            clubBgSteps: false
        });

        let stepWords = [];
        parser.on("feature", (obj) => {
            expect(obj.keyword).toBe("feature");
        })
        parser.on("rule", (obj) => {
            expect(obj.keyword).toBe("rule");
        })
        parser.on("background", (obj) => {
            expect(obj.keyword).toBe("background");
        })
        parser.on("step", (obj) => {
            stepWords.push(obj.keyword);
            //expect(obj.keyword).toBe("step");
        })
        parser.on("example", (obj) => {
            expect(obj.keyword).toBe("example");
        })
        parser.on("scenario", (obj) => {
            expect(obj.keyword).toBe("scenario");
        })

        const featureContent = `Feature: Overdue tasks

        Let users know when tasks are overdue, even when using other
        features of the app

        Rule: Users are notified about overdue tasks on first use of the day
            Background:
                Given I have overdue tasks

                #comment
                
            @tag
            Example: First use of the day
                Given I last used the app yesterday
                When I use the app
                Then I am notified about overdue tasks

            Example: Already used today
                Given I last used the app earlier today
                When I use the app
                Then I am not notified about overdue tasks
        `;
   
        parser.parse(featureContent)
        expect(stepWords).toEqual([ 'Given', 'Given', 'When', 'Then', 'Given', 'When', 'Then' ]);

        //call it twice
        stepWords = [];
        parser.parse(featureContent)
        expect(stepWords).toEqual([ 'Given', 'Given', 'When', 'Then', 'Given', 'When', 'Then' ]);
        //expect(featurePresent).toBeTruthy();
        //console.log(JSON.stringify(parser.output,null,4));
    });
    
});