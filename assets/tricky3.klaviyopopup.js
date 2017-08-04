(function($) {
    var klaviyoPopup = function(element, options) {
        var kPopup = this;
        var settings = {
            CookieName: 'KlaviyoPopup',
            SessionCookieName: 'KlaviyoPopupSession',
            Visits: [],
            Delay: 10000,
            PageViewNumber: 1,
            CloseSelectors: [],
            ShowSelectors: [],
            ShowPopupOnCurrentPage: false,
            InnerWrapper: '.modal',
            SignupKey: 'signup',
            HidePopupOnSuccess: true,
            HidePopupOnSuccessTimeout: 5000,
            ShowAlertMessage: true,
            AjaxSubmitAttr: 'data-ajax-submit',
            BValidatorOptions: {
                singleError: true
            },
            CallBacks: {
                OnSuccess: function() {},
                OnError: function() {},
                OnDisplayed: function() {},
                OnClosed: function() {},
                OnFormSubmitted: function() {},
                BeforeSubmit: function() {}
            },
            MessageWrapperSelectors: {
                Success: '.klaviyo_messages .success_message',
                Error: '.klaviyo_messages .error_message'
            },
            Messages: {
                Success: 'Thank you!'
            },
            IsBlocking: false
        };

        $.extend(settings, options || {});

        var _Globs = {
            VisitsCookieTracker: {
                Status: '',
                PageView: 0,
                Visits: 0,
                PopupAlreadyShownOnVisit: []
            },
            CookiesValues: {
                NotSubmitted: 'NotSubmitted',
                HasSubmitted: 'HasSubmitted',
                ShowOnNextVisit: 'ShowOnNextVisit',
                ErrorInSubmitted: 'ErrorInSubmitted'
            },
            MainWrapper: element,
            KForm: $('form', this.MainWrapper)
        };

        var KP = {
            Initialize: function() {
                this.Hide(false);
                !settings.IsBlocking ? this.ReadAndSetupCookieValues() : this.SetupModalPopup();
                this.InitCustomEvents();
            },
			InitDefaultKlaviyoCookies:function(){
				var klaPagesCookie = "klaPages";
				var klaPagesCookieValue = parseInt(T3Core.CookieManager.ReadCookie(klaPagesCookie), 10);
				klaPagesCookieValue = isNaN(klaPagesCookieValue) ? 1 : klaPagesCookieValue + 1;
				T3Core.CookieManager.CreateCookie(klaPagesCookie, klaPagesCookieValue, 365);
			},
            InitCustomEvents: function() {
                for (var i = 0; i < settings.CloseSelectors.length; i++) {
                    var element = $(settings.CloseSelectors[i]);
                    element.click(function(e) {
                        KP.Hide(true);
                        e.stopPropagation();
                        return false;
                    });
                }

                for (var i = 0; i < settings.ShowSelectors.length; i++) {
                    var element = $(settings.ShowSelectors[i]);
                    element.click(function(e) {
                        KP.Show(true);
                        e.stopPropagation();
                        return false;
                    });
                }

                if(!settings.IsBlocking){
                    $(document).keydown(function(e) {
                        keycode = e == null ? event.keyCode : e.which;
                        if (keycode == 27) {
                            KP.Hide(true);
                        }
                    });

                    _Globs.MainWrapper.click(function() {
                        if ($(this).hasClass('modalize')) {
                            KP.Hide(true);
                        }
                    });
                }

                $(settings.InnerWrapper, _Globs.MainWrapper).click(function(e) {
                    e.stopPropagation();
                });
            },
            Hide: function(trackEvent) {
                _Globs.MainWrapper.removeClass('modalize');
                KP.CallBackHandler.OnClosed(trackEvent);
            },
            SetupModalPopup: function(){
                var kpCookieValue = this.ReadJsonFromCookie(settings.CookieName);
                if (kpCookieValue == null){
                    this.Show();
                }else{
                    this.Hide();
                }
            },
            ReadAndSetupCookieValues: function() {
                var sessionCookie = T3Core.CookieManager.ReadCookie(settings.SessionCookieName);
                var kpCookieValue = this.ReadJsonFromCookie(settings.CookieName);

                if (kpCookieValue == null && sessionCookie == null) {
                    T3Core.CookieManager.CreateCookie(settings.SessionCookieName, 1);
                    this.SaveJsonToCookie(settings.CookieName, _Globs.CookiesValues.ShowOnNextVisit, 1, 1, '', 30);
                    kpCookieValue = this.ReadJsonFromCookie(settings.CookieName);
                } else {
                    //save default values to cookie.
                    if (kpCookieValue == null) {
                        this.SaveJsonToCookie(settings.CookieName, _Globs.CookiesValues.ShowOnNextVisit, 1, 1, '', 30);
                        kpCookieValue = this.ReadJsonFromCookie(settings.CookieName);
                    }

                    //new session.
                    if (sessionCookie == null) {
                        var obj = kpCookieValue;
                        var visitNumber = obj.Visits + 1;
                        var pageViewNumber = obj.PageView;
                        T3Core.CookieManager.CreateCookie(settings.SessionCookieName, visitNumber);
                        if (obj.Status == _Globs.CookiesValues.ShowOnNextVisit) {
                            this.SaveJsonToCookie(settings.CookieName, _Globs.CookiesValues.ShowOnNextVisit, pageViewNumber, visitNumber, '', 30);
                        }
                    }
                }

                if (kpCookieValue.Status == _Globs.CookiesValues.ShowOnNextVisit && settings.ShowPopupOnCurrentPage) {
                    KP.ProcessCookiesValuesAndShowPopupIfNeeded();
                }
            },
            ReadJsonFromCookie: function(cookieName) {
                var cookieObj = T3Core.CookieManager.ReadCookie(cookieName);
                var obj = null;
                if (cookieObj != null) {
                    try {
                        obj = JSON.parse(cookieObj);
                    } catch (e) {
                        if (cookieObj.indexOf(_Globs.CookiesValues.HasSubmitted) != -1) {
                            KP.SaveJsonToCookie(cookieName, _Globs.CookiesValues.HasSubmitted, '', '', '', 365);
                            obj = JSON.parse(T3Core.CookieManager.ReadCookie(cookieName));
                        }
                    }
                }
                return obj;
            },
            ProcessCookiesValuesAndShowPopupIfNeeded: function() {
                var cookieObj = this.ReadJsonFromCookie(settings.CookieName);
                var obj = {
                    PageView: 0,
                    Visits: 0,
                    NeedToShowPopupOnCurrentVisit: false,
                    NeedToShowPopupOnCurrentPageView: false,
                    PopupAlreadyShown: false,
                    ShowPopup: false
                };
                obj.PageView = parseInt(cookieObj.PageView);
                obj.Visits = parseInt(cookieObj.Visits);
                if (cookieObj.PopupAlreadyShownOnVisit.length > 0) {
                    obj.PopupAlreadyShown = ($.inArray(obj.Visits, cookieObj.PopupAlreadyShownOnVisit) != -1)
                }
                obj.NeedToShowPopupOnCurrentVisit = (($.inArray(obj.Visits, settings.Visits) != -1) && !obj.PopupAlreadyShown);
                obj.NeedToShowPopupOnCurrentPageView = (obj.PageView == settings.PageViewNumber);
                if (obj.NeedToShowPopupOnCurrentVisit) {
                    if (obj.PageView <= settings.PageViewNumber) {
                        if (obj.NeedToShowPopupOnCurrentPageView) {
                            this.SaveJsonToCookie(settings.CookieName, _Globs.CookiesValues.ShowOnNextVisit, 1, obj.Visits, obj.Visits, 30);
                        } else {
                            var pageview = obj.PageView + 1;
                            this.SaveJsonToCookie(settings.CookieName, _Globs.CookiesValues.ShowOnNextVisit, pageview, obj.Visits, '', 30);
                        }
                    }
                }

                if (obj.Visits > settings.Visits[settings.Visits.length - 1]) {
                    // Visiting number is bigger, nothing to do..here...
                }

                obj.ShowPopup = obj.NeedToShowPopupOnCurrentVisit && obj.NeedToShowPopupOnCurrentPageView;

                if (obj.ShowPopup) {
                    this.Show(false);
                }
            },
            Show: function(clickEvent) {
                var delay = clickEvent ? 1000 : settings.Delay;
                setTimeout(function() {
                    _Globs.MainWrapper.addClass('modalize');
                    KP.CallBackHandler.OnDisplayed();
                    KP.InitBValidator();
                    KP.InitAjaxSubmit();
                }, delay);
            },
            InitBValidator: function() {
                _Globs.KForm.bValidator(settings.BValidatorOptions);
            },
            InitAjaxSubmit: function() {
                _Globs.KForm.submit(function(e) {
                    var form = $(this);
                    if (form.data('bValidator').isValid()) {
                        KP.CallBackHandler.BeforeSubmit();
                        var url = form.attr(settings.AjaxSubmitAttr);
                        var utcOffset = (new Date).getTimezoneOffset() / -60;
                        $('.timeOffset', form).length ? $('.timeOffset', form).val(utcOffset) : form.append('<input type="hidden" value="' + utcOffset + '" class="timeOffset klaviyo-field" name="$timezone_offset"/>');
                        var formData = decodeURIComponent(form.find('.klaviyo-field').serialize());
                        var customPropertiesNames = $(this).find('.klaviyo-custom-property').map(function() {
                            return $(this).attr('name');
                        }).get();

                        if (customPropertiesNames.length) {
                            formData += '&$fields=' + customPropertiesNames.join(',');
                        }
                        $.post(url, formData, KP.AjaxFormSubmitCallBack);
                        KP.CallBackHandler.OnFormSubmitted();
                        e.stopPropagation();
                        return false;
                    }
                });
            },
            AjaxFormSubmitCallBack: function(responseData) {
                if (responseData.success) {
                    KP.UserHasSignedUp = true;
                    KP.SaveJsonToCookie(settings.CookieName, _Globs.CookiesValues.HasSubmitted, '', '', '', 365);
                    var successMessageWrapper = $(settings.MessageWrapperSelectors.Success, _Globs.MainWrapper);
                    successMessageWrapper.append(settings.Messages.Success).css('display', 'block');
                    KP.CallBackHandler.OnSuccess(responseData);
                    if (settings.HidePopupOnSuccess) {
                        setTimeout(function() {
                            KP.Hide(false);
                        }, settings.HidePopupOnSuccessTimeout);
                    }
                } else {
                    var errorMessageWrapper = $(settings.MessageWrapperSelectors.Error, _Globs.MainWrapper);
                    $(responseData.errors).each(function() {
                        errorMessageWrapper.append('<p>' + this + '</p>');
                    });

                    errorMessageWrapper.css('display', 'block');
                    KP.CallBackHandler.OnError(responseData);
                }
            },
            SaveJsonToCookie: function(cookieName, status, pageview, visits, visitpopupshown, duration) {
                _Globs.VisitsCookieTracker.Status = status;
                _Globs.VisitsCookieTracker.PageView = pageview;
                _Globs.VisitsCookieTracker.Visits = visits;
                if (visitpopupshown != '') {
                    _Globs.VisitsCookieTracker.PopupAlreadyShownOnVisit.push(visitpopupshown);
                }
                T3Core.CookieManager.CreateCookie(cookieName, JSON.stringify(_Globs.VisitsCookieTracker), duration);
            },
            UserHasSignedUp: false
        };

        KP["CallBackHandler"] = {
            OnClosed: function(trackEvent) {
                settings.CallBacks.OnClosed && settings.CallBacks.OnClosed(trackEvent && !KP.UserHasSignedUp);
            },
            OnFormSubmitted: function() {
                settings.CallBacks.OnFormSubmitted && settings.CallBacks.OnFormSubmitted();
            },
            OnDisplayed: function() {
                settings.CallBacks.OnDisplayed && settings.CallBacks.OnDisplayed();
            },
            OnError: function(data) {
                settings.CallBacks.OnError && settings.CallBacks.OnError(data);
            },
            OnSuccess: function(data) {
                settings.CallBacks.OnSuccess && settings.CallBacks.OnSuccess(data, _Globs.MainWrapper);
            },
            BeforeSubmit: function() {
                settings.CallBacks.BeforeSubmit && settings.CallBacks.BeforeSubmit();
            }
        };

        (function() {
            var signupkey = T3Core.GetQueryStringByKey(settings.SignupKey);
            if (signupkey != '') {
                if (signupkey == 1) {
                    KP.Initialize();
                    KP.Show();
                }
            } else {
                KP.Initialize();
            }
			KP.InitDefaultKlaviyoCookies();
        })();
    };

    $.fn.KlaviyoPopup = function(options) {
        return new klaviyoPopup(this, options);
    };
})(jQuery);
