var PageViewModel = function () {
	var model = this;

	// поля ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	model.Entity = ko.observable();
	model.IsDirty = ko.observable(false);
	model.IsCreateMode = ko.observable(false);

	// функции ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	model.LoadUser = function (id) {
		app.CallApi(app.urls.UserInfo, { ID: id },
			function (response) {
					model.Entity(ko.mapping.fromJS(response.Data));
					model.SubscribeToEditable();
					model.InitValidation();
			});
	};

	model.Save = function () {
		model.ValidateAll = true;
		if (!app.Validation.Validate(model))
			return;

		var data = {
			ID: model.Entity().ID(),
			Name: model.Entity().Name(),
			Phone: model.Entity().Phone()
		};

		app.CallApi(app.urls.SaveUser, { User: data },
			function (response) {
					model.IsDirty(false);
			});
	};

	model.Delete = function () {
		// TODO:
	};

	model.SubscribeToEditable = function () {
		var obj = model.Entity();
		for (var property in obj) {
			var prop = obj[property];
			if (ko.isObservable(prop))
				prop.subscribe(function () { model.IsDirty(true) });
		}
	};

	model.GetDisplay = function (what, value) {
		if (!ko.unwrap(value))
			return "#";

		if (hasOwnProperty.call(model, what)) {
			var found = ko.utils.arrayFirst(model[what](), function (item) { return item.ID == ko.unwrap(value) });
			return found ? found.Display : "-";
		}

		var found = ko.utils.arrayFirst(app.ViewModel.Options[what], function (item) { return item.ID == ko.unwrap(value) });
		return found ? found.Display : "-";
	};


	model.InitValidation = function () {
		app.Validation.ValidateField(model, "UserName", model.Entity().Name, new app.Validation.RequiredRule());
		app.Validation.ValidateField(model, "UserName", model.Entity().Name, new app.Validation.LengthRule(64));
		app.Validation.ValidateField(model, "UserEmail", model.Entity().Email, new app.Validation.RequiredRule());
		app.Validation.ValidateField(model, "UserEmail", model.Entity().Email, new app.Validation.FormatRule(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/));
	};

	model.Init = function () {
		if (app.GetUrlParam("create")) {
			model.IsCreateMode(true);
			model.LoadUser(0);
		}
		else {
			var id = app.GetUrlId();
			if (id) {
				model.LoadUser(id);

				app.EnsureOptions("Role");
				app.EnsureOptions("User");
			}
			else
				app.RedirectToError();
		}
	};
}


