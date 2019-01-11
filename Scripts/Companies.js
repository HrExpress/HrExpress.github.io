// company list
var PageViewModel = function () {
	var model = this;

	// поля ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	model.Items = ko.observableArray([]);
	model.Page = ko.observable(0);
	model.PageSize = ko.observable(0);
	model.Total = ko.observable(0);
	model.Filter = {};
	model.Filter.Context = ko.observable("");
	model.Filter.HasRequests = ko.observable(false);
	model.Filter.HasVacancies = ko.observable(false);

	// функции ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	model.LoadCompanies = function (id) {
		app.CallApi(app.urls.GetCompanies, {},
			function (response) {
				model.Items(response.Items);
				model.Page(response.Page);
				model.PageSize(response.PageSize);
				model.Total(response.Total);
			});
	};
	
	model.SubmitFilter = function () {
		app.CallApi(app.urls.GetCompanies, { Context: model.Filter.Context(), HasRequests: model.Filter.HasRequests(), HasVacancies: model.Filter.HasVacancies() },
			function (response) {
				model.Items(response.Items);
				model.Page(response.Page);
				model.PageSize(response.PageSize);
				model.Total(response.Total);
			});
	};

	model.Init = function () {
		var id = null;	// TODO: extract selected id
		model.LoadCompanies(id);
	};
}
