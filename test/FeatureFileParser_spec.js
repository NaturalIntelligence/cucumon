const FeatureFileParser = require('../src/FeatureFileParser');

describe("Feature file Parser", function () {

    
    it("should parse feature file", function() {
        const parser = new FeatureFileParser();
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
        //console.log(JSON.stringify(parser.output,null,4));
    });
    
});