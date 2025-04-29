package com.epam.carrentapp.driver;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;

public class DriverFactory {

    private static DriverFactory instance;
    private WebDriver driver;

    private DriverFactory(){

    }
    public static DriverFactory getInstance(){
        if(instance == null){
            instance = new DriverFactory();
        }
        return instance;
    }

    public WebDriver getDriver() {
        if (driver == null) {
            ChromeOptions options = new ChromeOptions();
            options.addArguments("--start-maximized");
            driver = new ChromeDriver(options);
        }
        return driver;
    }

    public void quitDriver() {
        if (driver != null) {
            driver.quit();
            driver = null;
        }
    }
}
