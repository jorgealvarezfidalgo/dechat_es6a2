#Search.feature

Feature: DeChat ES-6A-II
    I should be able to go to the webpage and login

    Scenario: Good credential, we reach the home page
        Given We visit the "https://arquisoft.github.io/dechat_es6a2"
        And We put the good credentials username "asw" and password "asw-2018-19"
        Then We click and we reach the home page with the messages shown and contacts

    Scenario: Google search for voter cards app
        When I search Google for "itunes vote cards app"
        Then I should see "Outvote" in the result
