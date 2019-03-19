require('chromedriver');
const selenium = require('selenium-webdriver');
const driver = new selenium.Builder().forBrowser("chrome").build();
describe('Google search automated testing', async function () {
    it('opening the page and quiting', async () => {
        const url = "http://google.com";
        driver.get(url);
        driver.wait(function () {
            return driver.executeScript('return document.readyState').then(function (readyState) {
                return readyState === 'complete';
            });
        });
        driver.quit();
    });
});
