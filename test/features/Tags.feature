@feature @multiple
@all
Feature: Tags

Background:
    Given some setup

#@notAllowed
Rule: rule for tags

    @focus
    Scenario: focused tag
        Given a scenario of focused tag
        When @all, @focus, @feature or @multiple are used
    
    @other
    Scenario: other tag
        Given a scenario of other tag
        When @all, @not, @feature or @multiple are used

Rule: rule 2 for tags

    #@without
    Scenario: without tag
        Given a scenario without tag
        When feature level tag is used
        Then this scenario should be parsed

    @other
    Scenario: other tag 2
        Given a scenario
        When @all, @not, @feature or @multiple are used
        And this scenario should be parsed