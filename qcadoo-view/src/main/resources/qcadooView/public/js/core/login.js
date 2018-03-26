/*
 * ***************************************************************************
 * Copyright (c) 2010 Qcadoo Limited
 * Project: Qcadoo Framework
 * Version: 1.4
 *
 * This file is part of Qcadoo.
 *
 * Qcadoo is free software; you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation; either version 3 of the License,
 * or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty
 * of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 * ***************************************************************************
 */
var QCD = QCD || {};

QCD.login = (function () {
    var messagePanel;
    var messagePanelHeader;
    var messagePanelContent;

    var usernameInput;
    var passwordInput;

    var changeUserButton;
    var loginButton;

    var forgotPasswordLink;

    function init() {
        if (!isSupportedBrowser()) {
            window.location = "browserNotSupported.html";
        }

        $(".dropdown-menu li span").each(function (i, li) {
            $(li).click(function () {
                changeLanguage(this.lang);
            });
        });

        messagePanel = $("#messagePanel");
        messagePanelHeader = $("#messageHeader");
        messagePanelContent = $("#messageContent");

        if (serverMessageType) {
            showMessagePanel(serverMessageType, serverMessageHeader, serverMessageContent);
        } else {
            hideMessagePanel();
        }

        usernameInput = $("#usernameInput");
        passwordInput = $("#passwordInput");

        changeUserButton = $("#changeUserButton");
        loginButton = $("#loginButton");

        forgotPasswordLink = $("#forgotPasswordLink");

        changeUserButton.click(onChangeUserClick);
        loginButton.click(onLoginClick);

        forgotPasswordLink.click(onForgotPasswordClick);

        var currentLogin = null;

        try {
            if (window.parent && window.parent.getCurrentUserLogin) {
                currentLogin = window.parent.getCurrentUserLogin();
            } else if (window.opener && window.opener.controller && window.opener.controller.getCurrentUserLogin) {
                currentLogin = window.opener.controller.getCurrentUserLogin();
            }
        } catch (err) {
            console.log("err");
        }

        if (currentLogin) {
            usernameInput.val(currentLogin);
            usernameInput.prop("disabled", true);

            passwordInput.focus();

            changeUserButton.prop("disabled", false);
        } else {
            usernameInput.focus();

            changeUserButton.prop("disabled", true);
        }

        usernameInput.keypress(onUsernameInputKeyPress);
        passwordInput.keypress(onPasswordInputKeyPress);
    }

    function getBrowser() {
        var userAgent = navigator.userAgent, version;
        var browser = userAgent.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];

        if (/trident/i.test(browser[1])) {
            version =  /\brv[ :]+(\d+)/g.exec(userAgent) || [];

            return { name: 'IE ', version: (version[1] || '') };
        }

        if (browser[1] === 'Chrome') {
            version = userAgent.match(/\b(OPR|Edge)\/(\d+)/);

            if (version != null) {
                return { name: version[1].replace('OPR', 'Opera'), version: version[2] };
            }
        }

        browser = browser[2] ? [browser[1], browser[2]] : [navigator.appName, navigator.appVersion, '-?'];

        if ((version = userAgent.match(/version\/(\d+)/i)) != null) {
            browser.splice(1, 1, version[1]);
        }

        return { name: browser[0], version: browser[1] };
    }

    function isSupportedBrowser() {
        var browser = getBrowser();

        if (
            browser.name.match(/Opera|Chrome|Safari/i) ||
            (browser.name == 'IE' && browser.version >= 8) ||
            (browser.name == 'Firefox' && browser.version >= 3)
        ) {
            return true;
        } else {
            return false;
        }
    }

    function isMobile() {
        var userAgent = navigator.userAgent;

        if (userAgent.match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i)){
            return true;
        } else {
            return false;
        }
    }

    function changeLanguage(language) {
        window.location = "login.html?lang=" + language;
    }

    function showMessagePanel(type, header, content) {
        messagePanel.removeClass("alert-info");
        messagePanel.removeClass("alert-success");
        messagePanel.removeClass("alert-error");

        messagePanel.addClass('alert-' + type);

        messagePanelHeader.html(header);
        messagePanelContent.html(content);

        messagePanel.show();
    }

    function hideMessagePanel() {
        messagePanel.hide();
    }

    function onUsernameInputKeyPress(e) {
        var key = e.keyCode || e.which;

        if (key == 13) {
            onLoginClick();

            return false;
        }
    }

    function onPasswordInputKeyPress(e) {
        var key = e.keyCode || e.which;

        if (key == 13) {
            onLoginClick();

            return false;
        }
    }

    function onLoginClick() {
        hideMessagePanel();

        usernameInput.removeClass('is-invalid');
        passwordInput.removeClass('is-invalid');

        usernameInput.prop("disabled", false);

        var formData = QCDSerializator.serializeForm($("#loginForm"));
        var url = "j_spring_security_check";

        lockForm(true);

        $.ajax({
            url: url,
            type: 'POST',
            data: formData,
            success: function (response) {
                response = $.trim(response);

                if (response == "loginSuccessfull") {
                    if (isPopup == true) {
                        window.location = targetUrl;
                    } else if (window.parent.onLoginSuccess) {
                        window.parent.onLoginSuccess();
                    } else {
                        if (isMobile()) {
                            window.location = "terminal.html";
                        } else {
                            window.location = "main.html";
                        }
                    }
                } else {
                    switch(response) {
                        case "loginUnsuccessfull:login":
                            hideMessagePanel();

                            usernameInput.addClass('is-invalid');
                        break;

                        case "loginUnsuccessfull:password":
                            hideMessagePanel();

                            passwordInput.addClass('is-invalid');
                        break;

                        default:
                            showMessagePanel("alert-danger", errorHeaderText, errorContentText);
                        break;
                    }
                }

                lockForm(false);
            },
            error: function (xhr, textStatus, errorThrown) {
                showMessageBox("alert-danger", errorHeaderText, errorContentText);

                lockForm(false);
            }
        });
    }

    function lockForm(disabled) {
        usernameInput.prop("disabled", disabled);
        passwordInput.prop("disabled", disabled);

        if (window.parent.getCurrentUserLogin) {
            usernameInput.prop("disabled", true);
        }

        loginButton.prop("disabled", disabled);
    }

    function onChangeUserClick() {
    }

    function onForgotPasswordClick() {
        window.parent.location = "passwordReset.html";
    }

    return {
        init: init
    };
})();
