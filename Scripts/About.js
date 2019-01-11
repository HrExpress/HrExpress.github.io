﻿var PageViewModel = function (options) {
	var model = this;

	// поля ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	model.Mode = ko.observable("About");

	// функции ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	model.SwitchToRules = function () {
		model.Mode("Rules");
	};		

	model.Init = function () {
		var rules = app.GetUrlParam("rules");
		if (rules)
			model.SwitchToRules();
	};
}