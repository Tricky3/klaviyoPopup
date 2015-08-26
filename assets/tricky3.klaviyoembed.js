$(document).ready(function(){
	$('.klaviyo-embed').each(function(){
		var wrapper = $(this);
		$('form', wrapper).submit(function(e){
		  var form = $(this);
          var url = form.attr('data-ajax-submit');
          var utcOffset = (new Date).getTimezoneOffset() / -60;
          $('.timeOffset', form).length ? $('.timeOffset', form).val(utcOffset) : form.append('<input type="hidden" value="'+ utcOffset +'" class="timeOffset klaviyo-field" name="$timezone_offset"/>');
          var formData = $(this).find('.klaviyo-field').serialize();
          $.post(url, formData, function(data){
            KlaviyoEmbedFormCallBacks.ProcessResponse(data, wrapper);
          });
          
          e.preventDefault();
          return false;
		});
	});
});

var KlaviyoEmbedFormCallBacks = {
	ProcessResponse:function(responseData, wrapper){
		responseData.success ? KlaviyoEmbedFormCallBacks.Success(responseData, wrapper) : KlaviyoEmbedFormCallBacks.Error(responseData, wrapper);
	},
	Success:function(data, wrapper){
		T3Core.TrackUserSignUpEmbed(wrapper);
        $('.klaviyo_messages .success_message', wrapper).text('Thank you!').show();
	},
	Error:function(data, wrapper){
		$('.klaviyo_messages .error_message',wrapper).html('<p>'+data.errors[0]+'</p>').show();
	}
};