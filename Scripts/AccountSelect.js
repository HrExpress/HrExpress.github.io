var PageViewModel = function () {
	var model = this;

	// поля ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	model.IsAuto = false;
	model.Accounts = ko.observableArray();
	model.AccountId = ko.observable();

	// функции ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	model.User = ko.computed(() => app.ViewModel.User());
	model.IsAccountSelected = ko.computed(() => model.AccountId() > 0);

	model.LoadAccounts = function () {
		app.CallApi(app.urls.GetAccounts, { EntityID: app.ViewModel.User().ID },
			function (response) {
				response.Items.forEach(function (item) {
					item.IsSelected = ko.computed(() => model.AccountId() == item.ID);
					item.Select = function () { model.SelectAccount(this) };
				});
				model.Accounts(response.Items);
			});
	};

	model.SelectAccount = function (item) {
		model.AccountId(item.ID);
	};

	model.CreateAccount = function () {
		model.CreateAccountModalo.Show();
	};

	model.Done = function () {
		window.localStorage.setItem("account_id", model.AccountId() || 0);
		app.RedirectToStart();	// TODO: or returnUrl
	};

	// modalo
	model.CreateAccountModalo = (function (parent) {
		var modalo = {};
		modalo.Parent = parent;
		modalo.Name = ko.observable("");
		modalo.Description = ko.observable("");

		modalo.Show = function () {
			document.querySelectorAll("main").forEach(el => el.style.display = "none");	//$("main").hide();
			document.getElementById("create-account-modalo").style.display = "";	//$("#create-account-modalo").show();
		};

		modalo.Hide = function () {
			document.getElementById("create-account-modalo").style.display = "none";
			document.querySelector("main").style.display = "";
			//$("#create-account-modalo").hide();
			//$("#main").show();
		};

		modalo.Validate = function () {
			var nameRegex = /^[\d-_ ()a-zA-zа-яА-Я]{2,64}$/;
			var descriptionRegex = /^[\d-_ ()a-zA-zа-яА-Я]{0,2000}$/;
			return nameRegex.test(modalo.Name()) && descriptionRegex.test(modalo.Description());
		};

		modalo.Ok = function () {
			if (modalo.Validate()) {
				app.CallApi(app.urls.CreateAccount, { EntityID: app.ViewModel.User().ID, Name: modalo.Name(), Description: modalo.Description() },
					function (response) {
						// TODO: select returned id
						parent.LoadAccounts();
					});
			}

			modalo.Hide();
		};

		modalo.Cancel = function () {
			modalo.Hide();
		};

		return modalo;
	})(model);

	model.Init = function () {
		var auto = app.GetUrlParam("auto");
		if (auto)
			model.IsAuto = true;

		model.AccountId(window.localStorage.getItem("account_id"));
		model.LoadAccounts();
	};
}
