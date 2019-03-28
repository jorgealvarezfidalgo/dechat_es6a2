#Search.feature

Feature: DeChat ES-6A-II
    I should be able to go to the https://arquisoft.github.io/dechat_es6a2 and login

    Scenario: Bad credential, we reach the home page
        Given We visit the "https://arquisoft.github.io/dechat_es6a2"
        And We put the bad credentials username "unexistent" and password "unexistent"
        Then We click on "login" we will stay on the same page and no messages shown

    Scenario: Good credential, we reach the home page
        Given We visit the "https://arquisoft.github.io/dechat_es6a2"
        And We put the good credentials username "asw" and password "asw-2018-19"
        Then We click and we reach the home page with the messages shown

    Scenario: Google search for arquisoft
        When I search Google for "arquisoft"
        Then I should see "GitHub" in the result
