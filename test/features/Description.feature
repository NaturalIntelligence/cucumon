Feature: Description
This is the multiline description
which can have : in between
#but: is not allowed

Background: Background description
can also have multiline description
with : in between
Given this feature file

Rule: Rule description

This is the multiline description
which can have : in between


    Scenario: Scenario description
    can also hav description
    with : in between

    When there is a description in scenario
    Then it should be parsed
    
    Scenario Outline: Scenario Outline description
    can also hav description
    with : in between

    When there is a <word> in 
    Then it should be parsed

    Examples:
    |word|
    |description|