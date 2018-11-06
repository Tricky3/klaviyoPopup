declare var T3Core: any;
declare var jQuery: any;

(function($) {
    const klaviyoPolicyPopup = function(element, options) {
        const kPopup = this;
        const settings = {
            CookieName: 'KlaviyoPopup',
            SessionCookieName: 'KlaviyoPopupSession',
            PolicyCookieName: 'ts_cookie_policy',
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
                OnSuccess: (data: any, wrapper: any) => { },
                OnError: (data: any = null) => { },
                OnDisplayed: function() { },
                OnClosed: (obj: any = null) => { },
                OnFormSubmitted: () => { },
                BeforeSubmit: () => { }
            },
            MessageWrapperSelectors: {
                Success: '.klaviyo_messages .success_message',
                Error: '.klaviyo_messages .error_message'
            },
            Messages: {
                Success: 'Thank you!'
            },
            IsBlocking: false,
            ForceShow: false,
            HideCookiePolicyMessageIfNeeded: false
        };

        $.extend(settings, options || {});

        const _Globs = {
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

        const KP = {
            Load: function() {
                KP.SetupPolicyCookie();
                KP.FirstTimeLoaded = !KP.PolicyCookieAccepted;

                T3Core.Debug(`KPP: first time loaded ${KP.FirstTimeLoaded}.`);

                if (KP.PolicyCookieAccepted) {
                    // Initializing only if policy has been accepted...
                    T3Core.Debug('KPP: cookie policy accepted.');
                    settings.HideCookiePolicyMessageIfNeeded && KP.HideCookiePolicyMessageIfNeeded();
                    KP.Initialize();
                } else {
                    KP.Show();
                }

                const signupkey = T3Core.GetQueryStringByKey(settings.SignupKey);
                if (signupkey !== '' && signupkey == 1) {
                    T3Core.Debug('KPP: sign up key found, forcing show.');
                    KP.Show();
                } else {
                    settings.ForceShow && KP.Show();
                }

                KP.InitCustomEvents();
            },
            HideCookiePolicyMessageIfNeeded: function() {
                T3Core.Debug('KPP: hiding cookie policy message.');
                $('.cookie-policy').css('display', 'none');
            },
            GetPolicyCookie: function() {
                return T3Core.CookieManager.ReadCookie(settings.PolicyCookieName);
            },
            SetupPolicyCookie: function() {
                KP.AddPolicyCookieIfUserHasAlreadySignedUp();
                if (KP.GetPolicyCookie()) {
                    KP.PolicyCookieAccepted = true;
                }
            },
            AddPolicyCookie: function() {
                if (!KP.GetPolicyCookie()) {
                    T3Core.Debug('KPP: added cookie policy.');
                    T3Core.CookieManager.CreateCookie(settings.PolicyCookieName, 1, 30);
                } else {
                    T3Core.Debug('KPP: cookie policy already exist.');
                }
            },
            AddPolicyCookieIfUserHasAlreadySignedUp: function() {
                const cookieObj = T3Core.CookieManager.ReadCookie(settings.CookieName);
                if (cookieObj !== null) {
                    try {
                        let obj = JSON.parse(cookieObj);
                        if (obj.Status && obj.Status === _Globs.CookiesValues.HasSubmitted && !KP.GetPolicyCookie()) {
                            // this guy has submitted...
                            T3Core.Debug('KPP: user has subscribed on klaviyo popup before. Adding cookie policy.');
                            KP.AddPolicyCookie();
                        }
                    } catch (e) {
                    }
                }
            },
            Initialize: function() {
                if (!KP.Initialized) {
                    T3Core.Debug('KPP: initializing.');
                    KP.InitDefaultKlaviyoCookies();
                    KP.Initialized = true;
                    // this.Hide(false);
                    !settings.IsBlocking ? this.ReadAndSetupCookieValues() : this.SetupModalPopup();
                } else {
                    T3Core.Debug('KPP: is already initialized.');
                }
            },
            InitDefaultKlaviyoCookies: function() {
                const klaPagesCookie = "klaPages";
                let klaPagesCookieValue = parseInt(T3Core.CookieManager.ReadCookie(klaPagesCookie), 10);
                klaPagesCookieValue = isNaN(klaPagesCookieValue) ? 1 : klaPagesCookieValue + 1;
                T3Core.CookieManager.CreateCookie(klaPagesCookie, klaPagesCookieValue, 365);
            },
            InitializeAndAddPolicyCookie: function() {
                KP.AddPolicyCookie();
                KP.Initialize();
            },
            InitCustomEvents: function() {
                for (let i = 0; i < settings.CloseSelectors.length; i++) {
                    const element = $(settings.CloseSelectors[i]);
                    element.click(function(e) {
                        e.preventDefault();
                        T3Core.Debug(`KPP: close button clicked.`);
                        KP.InitializeAndAddPolicyCookie();
                        KP.Hide(true);
                    });
                }

                for (let i = 0; i < settings.ShowSelectors.length; i++) {
                    const element = $(settings.ShowSelectors[i]);
                    element.click(function(e) {
                        e.preventDefault();
                        T3Core.Debug(`KPP: show button clicked.`);
                        KP.InitializeAndAddPolicyCookie();
                        KP.Show(true);
                    });
                }

                if (!settings.IsBlocking) {
                    $(document).on('keydown', function(e) {
                        let keycode = e == null ? e.keyCode : e.which;
                        if (keycode == 27) {
                            T3Core.Debug(`KPP: escape key pressed.`);
                            KP.InitializeAndAddPolicyCookie();
                            KP.Hide(true);
                        }
                    });

                    _Globs.MainWrapper.click(function() {
                        T3Core.Debug(`KPP: wrapper clicked.`);
                        KP.InitializeAndAddPolicyCookie();
                        $(this).hasClass('modalize') && KP.Hide(true);
                    });
                }


                $(settings.InnerWrapper, _Globs.MainWrapper).on('click', function(e) {
                    const targetElem = $(e.target);
                    const isFormElements = targetElem.is('input') || targetElem.is('button');
                    const isLink = targetElem.is('a');

                    if (isLink && targetElem.hasClass('privacy-learn')) {
                        e.stopPropagation();
                        T3Core.Debug(`KPP: privacy learn clicked, no cookies will be added.`);
                    } else if (isFormElements) {
                        e.stopPropagation();
                        T3Core.Debug(`KPP: form element clicked, propagation stopped.`);
                        KP.InitializeAndAddPolicyCookie();
                    } else {
                        T3Core.Debug(`KPP: propagating click event to main wrapper.`);
                    }
                });
            },
            SetupModalPopup: function() {
                let kpCookieValue = this.ReadJsonFromCookie(settings.CookieName);
                T3Core.Debug(`KPP: setupModalPopup fired ${kpCookieValue}`);
                if (kpCookieValue === null) {
                    this.Show();
                } else {
                    this.Hide();
                }
            },
            ReadAndSetupCookieValues: function() {
                const sessionCookie = T3Core.CookieManager.ReadCookie(settings.SessionCookieName);
                let kpCookieValue = this.ReadJsonFromCookie(settings.CookieName);

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
                const cookieObj = T3Core.CookieManager.ReadCookie(cookieName);
                let obj = null;
                if (cookieObj != null) {
                    try {
                        obj = JSON.parse(cookieObj);
                    } catch (e) {
                        if (cookieObj.indexOf(_Globs.CookiesValues.HasSubmitted) !== -1) {
                            KP.SaveJsonToCookie(cookieName, _Globs.CookiesValues.HasSubmitted, '', '', '', 365);
                            obj = JSON.parse(T3Core.CookieManager.ReadCookie(cookieName));
                        }
                    }
                }
                return obj;
            },
            ProcessCookiesValuesAndShowPopupIfNeeded: function() {
                const cookieObj = this.ReadJsonFromCookie(settings.CookieName);
                let obj = {
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
                            const pageview = obj.PageView + 1;
                            this.SaveJsonToCookie(settings.CookieName, _Globs.CookiesValues.ShowOnNextVisit, pageview, obj.Visits, '', 30);
                        }
                    }
                }

                if (obj.Visits > settings.Visits[settings.Visits.length - 1]) {
                    // Visiting number is bigger, nothing to do..here...
                }

                obj.ShowPopup = obj.NeedToShowPopupOnCurrentVisit && obj.NeedToShowPopupOnCurrentPageView;

                T3Core.Debug(`KPP: processCookiesValuesAndShowPopupIfNeeded, show popup: ${obj.ShowPopup}, first time loaded: ${KP.FirstTimeLoaded}`);

                if (obj.ShowPopup && !KP.FirstTimeLoaded) {
                    this.Show(false);
                }
            },
            Show: function(clickEvent: any = null) {
                if (!KP.IsShown) {
                    T3Core.Debug(`KPP: show fired.`);
                    KP.IsShown = true;
                    const delay = clickEvent ? 1000 : settings.Delay;
                    setTimeout(function() {
                        _Globs.MainWrapper.addClass('modalize');
                        KP["CallBackHandler"].OnDisplayed();
                        if (!KP.SubmitBinded) {
                            KP.SubmitBinded = true;
                            KP.InitBValidator();
                            KP.InitAjaxSubmit();
                        }
                    }, delay);
                } else {
                    T3Core.Debug(`KPP: show fired: already visible.`);
                }
            },
            Hide: function(trackEvent) {
                if (KP.IsShown) {
                    T3Core.Debug(`KPP: hide fired.`);
                    _Globs.MainWrapper.removeClass('modalize');
                    KP["CallBackHandler"].OnClosed(trackEvent);
                    KP.IsShown = false;
                } else {
                    T3Core.Debug(`KPP: hide fired: already hidden.`);
                }
            },
            InitBValidator: function() {
                _Globs.KForm.bValidator(settings.BValidatorOptions);
            },
            InitAjaxSubmit: function() {
                _Globs.KForm.submit(function(e) {
                    const form = $(this);
                    if (form.data('bValidator').isValid()) {
                        e.preventDefault();
                        KP["CallBackHandler"].BeforeSubmit();
                        const url = form.attr(settings.AjaxSubmitAttr);
                        const utcOffset = (new Date).getTimezoneOffset() / -60;
                        $('.timeOffset', form).length ? $('.timeOffset', form).val(utcOffset) : form.append('<input type="hidden" value="' + utcOffset + '" class="timeOffset klaviyo-field" name="$timezone_offset"/>');

                        const formData = [];

                        const klaviyoFields = $('.klaviyo-field', form);
                        klaviyoFields.each(function() {
                            formData.push($(this).attr('name') + '=' + encodeURIComponent($(this).val().replace(/%3A/g, ":")));
                        });

                        let formDataAsString = formData.join('&');

                        let customPropertiesNames = $(this).find('.klaviyo-custom-property').map(function() {
                            return $(this).attr('name');
                        }).get();

                        if (customPropertiesNames.length) {
                            formDataAsString += '&$fields=' + customPropertiesNames.join(',');
                        }

                        $.post(url, formDataAsString, KP.AjaxFormSubmitCallBack);
                        KP["CallBackHandler"].OnFormSubmitted();
                    }
                });
            },
            AjaxFormSubmitCallBack: function(responseData) {
                if (responseData.success) {
                    KP.UserHasSignedUp = true;
                    KP.SaveJsonToCookie(settings.CookieName, _Globs.CookiesValues.HasSubmitted, '', '', '', 365);
                    let successMessageWrapper = $(settings.MessageWrapperSelectors.Success, _Globs.MainWrapper);
                    successMessageWrapper.append(settings.Messages.Success).css('display', 'block');
                    KP["CallBackHandler"].OnSuccess(responseData);
                    if (settings.HidePopupOnSuccess) {
                        setTimeout(function() {
                            KP.Hide(false);
                        }, settings.HidePopupOnSuccessTimeout);
                    }
                } else {
                    let errorMessageWrapper = $(settings.MessageWrapperSelectors.Error, _Globs.MainWrapper);
                    $(responseData.errors).each(function() {
                        errorMessageWrapper.append('<p>' + this + '</p>');
                    });

                    errorMessageWrapper.css('display', 'block');
                    KP["CallBackHandler"].OnError(responseData);
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
            UserHasSignedUp: false,
            IsShown: false,
            PolicyCookieAccepted: false,
            Initialized: false,
            FirstTimeLoaded: false,
            SubmitBinded: false
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
                if (window["_learnq"]) {

                    const emailVal = $('input[name="email"]', _Globs.MainWrapper).val();
                    const source = $('input[name="$source"]', _Globs.MainWrapper).length ? $('input[name="$source"]', _Globs.MainWrapper).val() : '';

                    // console.log(window._learnq.push(['identify', { $email: emailVal, $source: source }]));

                    window["_learnq"].push(['identify', {
                        $email: emailVal,
                        $source: source
                    }]);

                    window["_learnq"].push(["trackActivity"]);
                }

                settings.CallBacks.OnSuccess && settings.CallBacks.OnSuccess(data, _Globs.MainWrapper);
            },
            BeforeSubmit: function() {
                settings.CallBacks.BeforeSubmit && settings.CallBacks.BeforeSubmit();
            }
        };

        (function() {
            KP.Load();
        })();

        return {
            show: KP.Show,
            hide: KP.Hide,
            cookiePolicyAccepted: KP.PolicyCookieAccepted
        };
    };

    $.fn.KlaviyoPolicyPopup = function(options) {
        return klaviyoPolicyPopup(this, options);
    };
})(jQuery);
