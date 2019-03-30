const expect = require("chai").expect;
var driver = require("selenium-webdriver");
var by = driver.By;

module.exports = function () {

    //________________________ FIRST CUCUMBER GOOGLE SEARCH _______________________//

    this.When(/^I search Google for "([^"]*)"$/, (text) => {
        return helpers.loadPage("https://google.com")
            .then(() => {
                return page.googleSearch.performSearch(text);
            })
    });

    this.Then(/^I should see "([^"]*)" in the result$/, function (keywords) {
        return driver.wait(until.elementsLocated(by.partialLinkText(keywords)), 10000);
    });

    //_______________________ DECHAT - TESTS - ES6A - II ___________________________//

    this.Given(/^We visit the "([^"]*)"$/, function (arg1) {
        return helpers.loadPage(arg1)
            .then(() => {
                return driver.wait(until.elementsLocated(by.xpath("//*[@id='nav-login-btn']")), 10000)
                    .then(function (elements) {
                        expect(elements.length).to.not.equal(0);
                    });
            })
    });

    //______________________________ FIRST SCENARIO __ BAD LOGIN __________________________________//

    this.Given(/^We put the bad credentials username "([^"]*)" and password "([^"]*)"$/, function (arg1, arg2) {
        var parent = driver.getWindowHandle();
        return helpers.loadPage("https://arquisoft.github.io/dechat_es6a2")
            .then(() => {
                return driver.findElement(by.xpath("//*[@id='nav-login-btn']")).click()
                    .then(() => {
                        driver.manage().timeouts().implicitlyWait(10);
                        return driver.getAllWindowHandles()
                            .then(function gotWindowHandles(allHandles) {
                                driver.manage().timeouts().implicitlyWait(10);
                                driver.switchTo().window(allHandles[allHandles.length - 1]);
                                driver.manage().timeouts().implicitlyWait(10);
                                return driver.findElement(by.xpath("/html/body/div/div/div/button[2]")).click()
                                    .then(() => {
                                        driver.wait(until.elementsLocated(by.name("username")), 10000);
                                        driver.findElement(by.name("username")).sendKeys(arg1);
                                        driver.findElement(by.name("password")).sendKeys(arg2);
                                        driver.manage().timeouts().implicitlyWait(10);
                                        return driver.findElement(by.xpath("//*[@id='login']"));
                                    })

                            })
                    })
            })
    });

    this.Then(/^We click on "([^"]*)" we will stay on the same page and no messages shown$/, function (arg1) {
        //error paragraph
        return driver.findElement(by.xpath("//*[@id='" + arg1 + "']")).click()
            .then(() => {
                driver.manage().timeouts().implicitlyWait(10);
                return driver.wait(until.elementsLocated(by.xpath("/html/body/div/div[2]/p")), 40000);
            })
    });

    //______________________________ SECOND SCENARIO __ CORRECT LOGIN __________________________________//

    this.Given(/^We put the good credentials username "([^"]*)" and password "([^"]*)"$/, function (arg1, arg2) {
        var parent = driver.getWindowHandle();
        return helpers.loadPage("https://arquisoft.github.io/dechat_es6a2")
            .then(() => {
                return driver.findElement(by.xpath("//*[@id='nav-login-btn']")).click()
                    .then(() => {
                        driver.manage().timeouts().implicitlyWait(10);
                        return driver.getAllWindowHandles()
                            .then(function gotWindowHandles(allHandles) {
                                driver.manage().timeouts().implicitlyWait(10);
                                driver.switchTo().window(allHandles[allHandles.length - 1]);
                                driver.manage().timeouts().implicitlyWait(10);
                                return driver.findElement(by.xpath("/html/body/div/div/div/button[2]")).click()
                                    .then(() => {
                                        driver.wait(until.elementsLocated(by.name("username")), 10000);
                                        driver.findElement(by.name("username")).sendKeys(arg1);
                                        driver.findElement(by.name("password")).sendKeys(arg2);
                                        driver.manage().timeouts().implicitlyWait(10);
                                        return driver.findElement(by.xpath("//*[@id='login']")).click()
                                            .then(() => {
                                                driver.manage().timeouts().implicitlyWait(10);
                                                driver.switchTo().window(parent);
                                                return driver.wait(until.elementsLocated(by.xpath("//*[@id='user-name']")), 20000);
                                            })
                                    })

                            })
                    })
            })
    });

    this.Then(/^We click and we reach the home page with the messages shown$/, () => {
        //username correct
        return driver.wait(until.elementsLocated(by.xpath("//*[@id='user-name']")), 10000)
            .then(() => {
                //selfphoto default is present
                return driver.findElement(by.xpath("//*[@id='selfphoto']"))
                    .then(() => {
                        //the user has only one conversion with Othmane Bakhtaoui
                        driver.wait(until.elementsLocated(by.xpath("//*[@id='chatwindow0']/div[1]/div/h1")), 20000);
                        //click on the friend
                        return driver.findElement(by.xpath("//*[@id='chatwindow0']/div[1]/div/h1")).click()
                            .then(() => {
                                //"hello" should appear
                                return driver.wait(until.elementsLocated(by.xpath("//*[@id='chatdiv']/div/div[2]")), 20000);
                            })
                    })
            });
    });

    //______________________________ THIRD SCENARIO __ SENDING MESSAGE TO AN EXISTING CONVERSATION ________________________//

    this.Given(/^We put the good credentials username "([^"]*)" and password "([^"]*)" and click on "([^"]*)"$/, function (arg1, arg2, arg3) {
        var parent = driver.getWindowHandle();
        return helpers.loadPage("https://arquisoft.github.io/dechat_es6a2")
            .then(() => {
                return driver.findElement(by.xpath("//*[@id='nav-login-btn']")).click()
                    .then(() => {
                        driver.manage().timeouts().implicitlyWait(10);
                        return driver.getAllWindowHandles()
                            .then(function gotWindowHandles(allHandles) {
                                driver.manage().timeouts().implicitlyWait(10);
                                driver.switchTo().window(allHandles[allHandles.length - 1]);
                                driver.manage().timeouts().implicitlyWait(10);
                                return driver.findElement(by.xpath("/html/body/div/div/div/button[2]")).click()
                                    .then(() => {
                                        driver.wait(until.elementsLocated(by.name("username")), 10000);
                                        driver.findElement(by.name("username")).sendKeys(arg1);
                                        driver.findElement(by.name("password")).sendKeys(arg2);
                                        driver.manage().timeouts().implicitlyWait(10);
                                        return driver.findElement(by.xpath("//*[@id='" + arg3 + "']")).click()
                                            .then(() => {
                                                driver.manage().timeouts().implicitlyWait(10);
                                                driver.switchTo().window(parent);
                                                return driver.wait(until.elementsLocated(by.xpath("//*[@id='user-name']")), 20000);
                                            })
                                    })

                            })
                    })
            })
    });

    this.Then(/^the messages will appear and we an existing conversation$/, () => {
        //username correct
        return driver.wait(until.elementsLocated(by.xpath("//*[@id='user-name']")), 20000)
            .then(() => {
                //selfphoto default is present
                return driver.wait(until.elementsLocated(by.xpath("//*[@id='selfphoto']")), 20000)
                    .then(() => {
                        //the user has only one conversion with Othmane Bakhtaoui
                        return driver.wait(until.elementsLocated(by.xpath("//*[@id='chatwindow0']/div[1]/div/h1")), 20000);
                    })
            });
    });

    this.Then(/^we send the implicated friend a message "([^"]*)"$/, function (arg1) {
        //"hello" should appear
        return driver.findElement(by.xpath("//*[@id='chatwindow0']/div[1]/div/h1")).click()
            .then(() => {
                return driver.wait(until.elementsLocated(by.xpath("//*[@id='chatdiv']/div/div[2]")), 20000)
                    .then(() => {
                        driver.findElement(by.xpath("//*[@id='write-chat']")).sendKeys(arg1)
                        return driver.findElement(by.xpath("//*[@id='write-chat']")).sendKeys(webdriver.Key.ENTER)
                            .then(() => {
                                //new message should appear
                                return driver.wait(until.elementsLocated(by.xpath("//*[@id='chatdiv']/div/div[3]")), 20000);
                            })
                    })
            })
    });

    //______________________________ FOURTH SCENARIO __ controlling the app apearance ____________________________//

    this.Given(/^We put the credentials username "([^"]*)" and password "([^"]*)" and click on "([^"]*)"$/, function (arg1, arg2, arg3) {
        var parent = driver.getWindowHandle();
        return helpers.loadPage("https://arquisoft.github.io/dechat_es6a2")
            .then(() => {
                return driver.findElement(by.xpath("//*[@id='nav-login-btn']")).click()
                    .then(() => {
                        driver.manage().timeouts().implicitlyWait(10);
                        return driver.getAllWindowHandles()
                            .then(function gotWindowHandles(allHandles) {
                                driver.manage().timeouts().implicitlyWait(10);
                                driver.switchTo().window(allHandles[allHandles.length - 1]);
                                driver.manage().timeouts().implicitlyWait(10);
                                return driver.findElement(by.xpath("/html/body/div/div/div/button[2]")).click()
                                    .then(() => {
                                        driver.wait(until.elementsLocated(by.name("username")), 10000);
                                        driver.findElement(by.name("username")).sendKeys(arg1);
                                        driver.findElement(by.name("password")).sendKeys(arg2);
                                        driver.manage().timeouts().implicitlyWait(10);
                                        return driver.findElement(by.xpath("//*[@id='" + arg3 + "']")).click()
                                            .then(() => {
                                                driver.manage().timeouts().implicitlyWait(10);
                                                driver.switchTo().window(parent);
                                                return driver.wait(until.elementsLocated(by.xpath("//*[@id='user-name']")), 20000);
                                            })
                                    })

                            })
                    })
            })
    });

    this.Then(/^the messages will appear and we select a friend in the friends' section$/, () => {
        //username correct
        return driver.wait(until.elementsLocated(by.xpath("//*[@id='user-name']")), 20000)
            .then(() => {
                //selfphoto default is present
                return driver.wait(until.elementsLocated(by.xpath("//*[@id='selfphoto']")), 20000)
                    .then(() => {
                        //the user has only one conversion with Othmane Bakhtaoui
                        return driver.wait(until.elementsLocated(by.xpath("//*[@id='show-contacts']")), 20000);
                    })
            });
    });

    this.Then(/^we should see friends and add groups and friends menu$/, () => {
        //"hello" should appear
        return driver.wait(until.elementsLocated(by.id("show-contacts")), 25000)
            .then(() => {
                return driver.wait(until.elementsLocated(by.xpath("//*[@id='create-group']")), 25000)
                    .then(() => {
                        //see only one conversation with Othmane Bakhtaoui
                        return driver.wait(until.elementsLocated(by.xpath("//*[@id='chatwindow0']/div[1]/div/h1")), 20000)
                            .then(() => {
                                return driver.wait(until.elementsLocated(by.xpath("//*[@id='interlocutorw-name']")), 20000)
                                //show contact information
                                    .then(() => {
                                        return driver.wait(until.elementsLocated(by.xpath("//*[@id='show-contact-information']")), 20000);
                                    })
                            })
                    })
            })
    });
};
