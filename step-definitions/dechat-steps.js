const expect = require('chai').expect;
const assert = require('chai').assert;


module.exports = function () {

    //________________________ FIRST CUCUMBER GOOGLE SEARCH _______________________//

    this.When(/^I search Google for "([^"]*)"$/, (text) => {
        return helpers.loadPage('https://google.com')
            .then(() => {
                return page.googleSearch.performSearch(text)
            })
    });

    this.Then(/^I should see "([^"]*)" in the result$/, function (keywords) {
        return driver.wait(until.elementsLocated(by.partialLinkText(keywords)), 10000);
    });

    //_______________________ DECHAT - ES6A - II ___________________________//

    this.Given(/^We visit the "([^"]*)"$/, function (arg1) {
        return helpers.loadPage(arg1)
            .then(() => {
                return driver.wait(until.elementsLocated(by.xpath('//*[@id="nav-login-btn"]')), 10000)
                    .then(function (elements) {
                        expect(elements.length).to.not.equal(0);
                    });
            })
    });

    this.Given(/^We put the good credentials username "([^"]*)" and password "([^"]*)"$/, function (arg1, arg2) {
        var parent = driver.getWindowHandle();
        return helpers.loadPage("https://arquisoft.github.io/dechat_es6a2")
            .then(() => {
                return driver.findElement(by.xpath('//*[@id="nav-login-btn"]')).click()
                    .then(() => {
                        driver.manage().timeouts().implicitlyWait(10);
                        return driver.getAllWindowHandles()
                            .then(function gotWindowHandles(allHandles) {
                                driver.manage().timeouts().implicitlyWait(10);
                                driver.switchTo().window(allHandles[allHandles.length - 1]);
                                driver.manage().timeouts().implicitlyWait(10);
                                return driver.findElement(by.xpath('/html/body/div/div/div/button[2]')).click()
                                    .then(() => {
                                        driver.wait(until.elementsLocated(by.name('username')), 10000);
                                        driver.findElement(by.name('username')).sendKeys(arg1);
                                        driver.findElement(by.name('password')).sendKeys(arg2);
                                        driver.manage().timeouts().implicitlyWait(10);
                                        return driver.findElement(by.xpath('//*[@id="login"]')).click()
                                            .then(() => {
                                                driver.manage().timeouts().implicitlyWait(10);
                                                driver.switchTo().window(parent);
                                                return driver.wait(until.elementsLocated(by.xpath('//*[@id="user-name"]')), 20000);
                                            })
                                    })

                            })
                    })
            })
    });

    this.Then(/^We click and we reach the home page with the messages shown and contacts$/, () => {
        //"//*[contains(text(), 'button')]" });
        return driver.wait(until.elementsLocated(by.xpath('//*[@id="user-name"]')), 10000);
    });
};
