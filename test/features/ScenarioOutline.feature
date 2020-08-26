Feature: Senario Outline

    Scenario Template: scenario outline
        Given an example 
        And I can pass "<data>" with spceial characters

        #> instruction
        Examples:
        | data  |
        #empty
        | |
        #> instruction 2
        Examples:
        | content  |
        #backslash
        | new\nline\ttab\b   |
        #pipe
        | left\|right\|  |    