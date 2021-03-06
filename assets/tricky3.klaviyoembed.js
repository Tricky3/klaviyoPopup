$(function() {
    var klaviyoEmbeds = $('.klaviyo-embed');
    klaviyoEmbeds.each(function() {
        var wrapper = $(this);
        var theForm = $('form', wrapper);
        theForm.bValidator({
            singleError: true
        });
        theForm.submit(function(e) {
            e.preventDefault();
            var form = $(this);
            var isValid = form.data('bValidator').isValid();

            if (isValid) {
                var url = form.attr('data-ajax-submit');
                var utcOffset = (new Date).getTimezoneOffset() / -60;
                $('.timeOffset', form).length ? $('.timeOffset', form).val(utcOffset) : form.append('<input type="hidden" value="' + utcOffset + '" class="timeOffset klaviyo-field" name="$timezone_offset"/>');
                var formData = [];
				var klaviyoFields = $('.klaviyo-field', form);
				klaviyoFields.each(function(){
					formData.push($(this).attr('name')+'='+ encodeURIComponent($(this).val().replace(/%3A/g, ":")));
				});
		
				formData = formData.join('&');
				
                var customPropertiesNames = form.find('.klaviyo-custom-property').map(function() {
                    return $(this).attr('name');
                }).get();

                if (customPropertiesNames.length) {
                    formData += '&$fields=' + customPropertiesNames.join(',');
                }

                $.post(url, formData, function(data) {
                    KlaviyoEmbedFormCallBacks.ProcessResponse(data, wrapper);
                });
            }
            return false;
        });
    });
});

var KlaviyoEmbedFormCallBacks = {
    ProcessResponse: function(responseData, wrapper) {
        responseData.success ? KlaviyoEmbedFormCallBacks.Success(responseData, wrapper) : KlaviyoEmbedFormCallBacks.Error(responseData, wrapper);
    },
    Success: function(data, wrapper) {
        T3Core.TrackUserSignUpEmbed(wrapper);
        T3Core.TrackFacebookCompleteRegistration({
            content_name: wrapper.attr('data-ga-action')
        });
        var successMessage = typeof(_t3klaviyoembed) !== "undefined" && _t3klaviyoembed.success_message ? _t3klaviyoembed.success_message : 'Thank you!';
        $('.klaviyo_messages .success_message', wrapper).text(successMessage).show();
		if (window._learnq) {
		  var emailVal = $('input[name="email"]', wrapper).val();
		  var source = $('input[name="$source"]', wrapper).length ? $('input[name="$source"]', wrapper).val() : '';
		  window._learnq.push(['identify', {
			  $email: emailVal,
			  $source: source
		  }]);

		  window._learnq.push(["trackActivity"]);
		}
    },
    Error: function(data, wrapper) {
        $('.klaviyo_messages .error_message', wrapper).html('<p>' + data.errors[0] + '</p>').show();
    }
};