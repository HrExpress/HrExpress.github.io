// candidate list
var PageViewModel = function () {
	var model = this;

	// поля ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	model.Items = ko.observableArray([]);
	model.Page = ko.observable(0);
	model.PageSize = ko.observable(0);
	model.Total = ko.observable(0);
	model.Filter = {};
	model.Filter.Context = ko.observable("");

	// функции ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	model.LoadCandidates = function (id) {
		app.CallApi(app.urls.GetCandidates, {},
			function (response) {
				model.Items(response.Items);
				model.Page(response.Page);
				model.PageSize(response.PageSize);
				model.Total(response.Total);
			});
	};
	
	model.SubmitFilter = function () {
		app.CallApi(app.urls.GetCandidates, { Context: model.Filter.Context(), HasRequests: model.Filter.HasRequests(), HasVacancies: model.Filter.HasVacancies() },
			function (response) {
				model.Items(response.Items);
				model.Page(response.Page);
				model.PageSize(response.PageSize);
				model.Total(response.Total);
			});
	};

	model.Init = function () {
		var id = null;	// TODO: extract selected id
		model.LoadCandidates(id);
	};
}
