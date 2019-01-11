// main page
var PageViewModel = function () {
	var model = this;

	// поля ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	model.Account = ko.observable("");
	model.AccountStatistics = ko.observable("");

	// функции ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	model.LoadAccount = function () {
		app.CallApi(app.urls.GetAccount, { ID: localStorage.getItem("account_id") },
			function (response) {
				model.Account(response.Data);
				model.LoadStatistics(model.Account().ID);
			});
	};

	model.LoadStatistics = function (id) {
		app.CallApi(app.urls.GetAccountStat, { ID: id },
			function (response) {
				model.AccountStatistics(response.Data);
			});
	};

	model.Init = function () {
		model.LoadAccount();
	};
}
