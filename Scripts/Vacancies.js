// vacancy list
var PageViewModel = function () {
	var model = this;

	// поля ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	model.Items = ko.observableArray([]);
	model.Page = ko.observable(0);
	model.PageSize = ko.observable(0);
	model.Total = ko.observable(0);
	model.Filter = {};
	model.Filter.Context = ko.observable("");
	model.Filter.Salary = ko.observable("");

	// функции ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	model.LoadVacancies = function (id) {
		app.CallApi(app.urls.GetVacancies, {},
			function (response) {
				model.Items(response.Items);
				model.Page(response.Page);
				model.PageSize(response.PageSize);
				model.Total(response.Total);
			});
	};

	model.SubmitFilter = function () {
		app.CallApi(app.urls.GetVacancies, { Context: model.Filter.Context() },
			function (response) {
				model.Items(response.Items);
				model.Page(response.Page);
				model.PageSize(response.PageSize);
				model.Total(response.Total);
			});
	};

	model.Init = function () {
		var id = null;	// TODO: extract selected id
		model.LoadVacancies(id);
	};
}
