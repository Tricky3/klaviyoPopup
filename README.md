# Tricky3 Klaviyo Modal Popup Signup 
## Module for Shopify themes

__Includes:__

* Basic styles user-configurable via admin theme settings panel
  * Modal overlay background color & opacity
  * Popup background color, border color, and text-align

* Cookie-based configuration. Be as annoying as you like! Settings for:
  * Which site visit to display popup
  * Which page to display on within a visit 
  * Whether to display once or on multiple visits
  * Time on target page before popup is displayed
  * Enable / disable on mobile devices
  * URL parameters to force enable/disable popup e.g. `yoursite.com/?signup=1`

* Integrated Google Analytics Event-tracking for the following Actions:
  * "Displayed"
  * "ClosedWithoutSignup"
  * "FormSubmitted"
  * "Success"
  * "Error"
  
* Field(s) validations:
  * Klaviyo Modal Popup Signup will make use of "bvalidator plugin" if it has been added on the page. Ref theme.liquid.
  * If it has not been added, then to enable form validation, you will need to add "validate" property to the form element.
  * If it has been added, these data attributes should be added to the field(s) that you want to validate:
	* data-bvalidator="required,email"
	* data-bvalidator-msg="The email is required" //Optional if you want to configure error message that will be displayed by bValidator plugin
	* For more info: http://bojanmauser.from.hr/bvalidator/#inputerrmsgs
	
