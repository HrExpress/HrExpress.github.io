// request list
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

	model.LoadRequests = function (id) {
		app.CallApi(app.urls.GetRequests, {},
			function (response) {
				model.Items(response.Items);
				model.Page(response.Page);
				model.PageSize(response.PageSize);
				model.Total(response.Total);
			});
	};

	model.SubmitFilter = function () {
		app.CallApi(app.urls.GetRequests, { Context: model.Filter.Context() },
			function (response) {
				model.Items(response.Items);
				model.Page(response.Page);
				model.PageSize(response.PageSize);
				model.Total(response.Total);
			});
	};

	model.Init = function () {
		var id = null;	// TODO: extract selected id
		model.LoadRequests(id);
	};
}
