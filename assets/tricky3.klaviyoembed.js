$(document).ready(function(){
	$('.klaviyo-embed').each(function(){
		var wrapper = $(this);
		$('form', wrapper).submit(function(e){
          var url = $(this).attr('data-ajax-submit') + '?callback=?';
          var formData = $(this).serialize();
          $.get(url, formData, function(data){
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
		T3Core.TrackUserSignUp(wrapper);
        $('.klaviyo_messages .success_message', wrapper).text('Thank you!').show();
	},
	Error:function(data, wrapper){
		$('.klaviyo_messages .error_message',wrapper).html('<p>'+data.errors[0]+'</p>').show();
	}
};