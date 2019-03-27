const expect = require('chai').expect;

module.exports = function () {

    this.When(/^I search Google for "([^"]*)"$/, (text) => {
        return helpers.loadPage('https://google.com')
            .then(() => {
                return page.googleSearch.performSearch(text)
            })
    })

    this.Then(/^I should see "([^"]*)" in the result$/, function (keywords) {
        return driver.wait(until.elementsLocated(by.partialLinkText(keywords)), 10000);
    });

};
