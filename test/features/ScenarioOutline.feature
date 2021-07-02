Feature: Senario Outline

    @parent
    Scenario Template: scenario outline
        Given an example 
        And I can pass "<data>" with spceial characters

        #> instruction
        @tag
        Examples:
        | data  |
        #empty
        | |
        #> instruction 2
        @wip
        Examples:
        | content  |
        #backslash
        | new\nline\ttab\b   |
        #pipe
        | left\|right\|  |    