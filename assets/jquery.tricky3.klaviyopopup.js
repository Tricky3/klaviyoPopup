(function ($) {
	var klaviyoPopup = function(element, options){
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
                HidePopupOnSuccess:true,
                ShowAlertMessage:true,
                AjaxSubmitAttr:'data-ajax-submit',
                BValidatorOptions:{ singleError: true },
                CallBacks:{
                    OnSuccess:function(){},
                    OnError:function(){},
                    OnDisplayed:function(){},
                    OnClosed:function(){},
                    OnFormSubmitted:function(){}
                },
                MessageWrapperSelectors:{
                    Success:'.success_message',
                    Error:'.error_message'
                },
                Messages:{
                    Success:'Thank you!'
                }
            };
    		
    		$.extend(settings, options || {});
    		
    		var _Globs = {
    			VisitsCookieTracker:{Status:'', PageView: 0, Visits:0, PopupAlreadyShownOnVisit: []},
    			CookiesValues:{ NotSubmitted: 'NotSubmitted', HasSubmitted: 'HasSubmitted', ShowOnNextVisit: 'ShowOnNextVisit', ErrorInSubmitted: 'ErrorInSubmitted'},
    			MainWrapper: element,
    			KForm:$('form', this.MainWrapper)
    		};

            var KP = {
                Initialize:function(){
                    this.Hide(false);
                    this.ReadAndSetupCookieValues();
                    this.InitCustomEvents();
                },
                InitCustomEvents:function(){
                    for (var i = 0; i<settings.CloseSelectors.length; i++) {
                        var element = $(settings.CloseSelectors[i]);
                        element.click(function (e) {
                            CMP.Hide(true);
                            e.stopPropagation();
                            return false;
                        });
                    }

                    for (var i = 0; i < settings.ShowSelectors.length; i++) {
                        var element = $(settings.ShowSelectors[i]);
                        element.click(function (e) {
                            CMP.Show(true);
                            e.stopPropagation();
                            return false;
                        });
                    }

                    $(document).keydown(function (e) {
                        keycode = e == null ? event.keyCode : e.which;
                        if (keycode == 27) {
                            CMP.Hide(true);
                        }
                    });

                    _Globs.MainWrapper.click(function () {
                        if ($(this).hasClass('modalize')) {
                            CMP.Hide(true);
                        }
                    });

                    $(settings.InnerWrapper, _Globs.MainWrapper).click(function (e) {
                        e.stopPropagation();
                    });
                },
                Hide: function (trackEvent) {
                    _Globs.MainWrapper.removeClass('modalize');
                    KP.CallBackHandler.OnClosed(trackEvent);
                },
                ReadAndSetupCookieValues: function () {
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
                        }catch (e) {
                            if (cookieObj.indexOf(_Globs.CookiesValues.HasSubmitted) != -1) {
                                KP.SaveJsonToCookie(cookieName, _Globs.CookiesValues.HasSubmitted, '', '', '', 365);
                                obj = JSON.parse(T3Core.CookieManager.ReadCookie(cookieName));
                            }
                        }
                    }
                    return obj;
                },
                ProcessCookiesValuesAndShowPopupIfNeeded: function () {
                    var cookieObj = this.ReadJsonFromCookie(settings.CookieName);
                    var obj = { PageView: 0, Visits: 0, NeedToShowPopupOnCurrentVisit: false, NeedToShowPopupOnCurrentPageView: false, PopupAlreadyShown: false, ShowPopup: false };
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
                    
                    if(obj.ShowPopup) {
                        this.Show(false);
                    }
                },
                Show: function (clickEvent) {
                    var delay = clickEvent ? 1000 : settings.Delay;
                    setTimeout(function () {
                        _Globs.MainWrapper.addClass('modalize');
                        KP.CallBackHandler.OnDisplayed();
                        KP.InitBValidator();
                        KP.InitAjaxSubmit();

                    }, delay);
                },
                InitBValidator: function () {
                    if(typeof(bValidator) == 'function'){
                        _Globs.KForm.bValidator(settings.BValidatorOptions);
                    }
                },
                InitAjaxSubmit: function () {
                    _Globs.KForm.submit(function(e) {
                        var url = $(this).attr(settings.AjaxSubmitAttr) + '?callback=?';
                        var formData = $(this).serialize();
                        $.get(url, formData, KP.AjaxFormSubmitCallBack);
                        KP.CallBackHandler.OnFormSubmitted();
                        e.stopPropagation();
                        return false;
                    });
                },
                AjaxFormSubmitCallBack: function (responseData) {
                    if (responseData.success) {
                        KP.UserHasSignedUp = true;
                        KP.SaveJsonToCookie(settings.CookieName, _Globs.CookiesValues.HasSubmitted, '', '', '', 365);
                        $(_Globs.MainWrapper, settings.MessageWrapperSelectors).append(settings.Messages.Success).show();
                        KP.CallBackHandler.OnSuccess(responseData);
                        if(settings.HidePopupOnSuccess){
                            KP.Hide(false);    
                        }
                    }else{
                        var errorMessageWrapper = $(_Globs.MainWrapper, settings.MessageWrapperSelectors);
                        $(responseData.errors).each(function(){
                            errorMessageWrapper.append('<p>'+this+'</p>');
                        });

                        errorMessageWrapper.show();
                        KP.CallBackHandler.OnError(responseData);
                    }
                },
                SaveJsonToCookie: function (cookieName, status, pageview, visits, visitpopupshown, duration) {
                    _Globs.VisitsCookieTracker.Status = status;
                    _Globs.VisitsCookieTracker.PageView = pageview;
                    _Globs.VisitsCookieTracker.Visits = visits;
                    if (visitpopupshown != '') {
                        _Globs.VisitsCookieTracker.PopupAlreadyShownOnVisit.push(visitpopupshown);
                    }
                    T3Core.CookieManager.CreateCookie(cookieName, JSON.stringify(_Globs.VisitsCookieTracker), duration);
                },
                UserHasSignedUp:false
            };

            KP["CallBackHandler"] = {
                OnClosed:function(trackEvent){
                    settings.CallBacks.OnClosed(trackEvent && !KP.UserHasSignedUp);
                },
                OnFormSubmitted:function(){
                    settings.CallBacks.OnFormSubmitted();
                },
                OnDisplayed:function(){
                    settings.CallBacks.OnDisplayed();
                },
                OnError:function(data){
                    settings.CallBacks.OnError(data);
                },
                OnSuccess:function(data){
                    settings.CallBacks.OnSuccess(data, _Globs.MainWrapper);
                }
            };

            (function () {
                var signupkey = T3Core.GetQueryStringByKey(settings.SignupKey);
                if (signupkey != '') {
                    if (signupkey == 1) {
                        KP.Initialize();
                        KP.Show();
                    }
                } else {
                    KP.Initialize();
                }
            })();
		};
	
	$.fn.KlaviyoPopup = function (options) {
        return new klaviyoPopup(this, options);
    };
})(jQuery);