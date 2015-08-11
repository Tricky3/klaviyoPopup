//for the embeds forms to be tracked add the data attributes to the .campaign-monitor-embed-form-wrapper element
//data-ga-category="UserSignup" data-ga-action="CMEmbedForm"
$(document).ready(function(){
	$('.campaign-monitor-embed-form-wrapper').each(function(){
		var wrapper = $(this);
		$('form.campaign-monitor-embed-form', wrapper).submit(function(e){
          $.getJSON(this.action + '?callback=?', $(this).serialize(), function(data){
          	CampaignMonitorEmbedFormCallBacks.ProcessResponse(data, wrapper);
          });
          e.preventDefault();
          return false;
		});
	});
});

var CampaignMonitorEmbedFormCallBacks = {
	ProcessResponse:function(data, wrapper){
		data.Status === 200 ? CampaignMonitorEmbedFormCallBacks.Success(data, wrapper) : CampaignMonitorEmbedFormCallBacks.Error();
	},
	Success:function(data, wrapper){
		T3Core.TrackUserSignUp(wrapper);
		if(wrapper.attr('data-redirect') == "true" && data.RedirectUrl){
			window.location = data.RedirectUrl;
		}else{
			alert(data.Message);
		}

	},
	Error:function(data, wrapper){
		alert(data.Message);
	}
};