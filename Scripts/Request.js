// request view data and behaviour
var PageViewModel = function () {
	var model = this;

	// поля ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	model.Request = ko.observable();
	model.IsDirty = ko.observable(false);
	model.IsCreateMode = ko.observable(false);
	model.Journal = ko.observableArray([]);
	model.JournalContent = ko.observable("");
	model.IsJournalFormShown = ko.observable(false);
	model.SelectCompanyModal = null;

	// функции ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	model.LoadRequest = function (id) {
		app.CallApi(app.urls.GetRequest, { ID: id, CompanyId: app.GetUrlParam("CompanyId") || 0 },
			function (response) {
				model.Request(ko.mapping.fromJS(response.Data));
				model.SubscribeToEditable();
				model.InitValidation();
				model.InitTabs();

				if (!model.IsCreateMode()) {
					model.LoadJournal(model.Request().ID());
				}
				else if (app.GetUrlParam("CompanyId")) {
					app.CallApi(app.urls.GetOptions, { Type: "Company" },
						function (or) {
							var companyId = parseInt(app.GetUrlParam("CompanyId"));
							model.Request().CompanyId(companyId);
							model.Request().CompanyName(ko.utils.arrayFirst(or.Items, function (item) { return item.ID == companyId }).Display);
						});
				}
			});
	};

	model.Save = function () {
		model.ValidateAll = true;
		if (!app.Validation.Validate(model))
			return;

		var data = {
			ID: model.Request().ID(),
			Name: model.Request().Name(),
			CompanyId: model.Request().CompanyId(),
			Text: model.Request().Text()
		};

		if (model.IsCreateMode())
			app.CallApi(app.urls.CreateRequest, { Entity: data }, (response) => { window.location = "/Request.html?" + response.Data });
		else
			app.CallApi(app.urls.SaveRequest, { Entity: data }, (response) => { model.IsDirty(false) });
	};

	model.SubscribeToEditable = function () {
		var obj = model.Request();
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

	model.SelectCompany = function () {
		model.SelectCompanyModal.Show("select-company-modalo", model.Request().CompanyId);
		model.SelectCompanyModal.OnDone = function () {
			var id = this.CurrentItem();
			model.Request().CompanyId(id);
			model.Request().CompanyName(ko.utils.arrayFirst(this.Companies(), function (item) { return item.ID == id }).Display);
		};
	};

	model.Delete = function () {
		var entity = model.Request();
		app.ConfirmModal.Show("confirm-delete-request-modalo", entity);
		app.ConfirmModal.OnDone = function (self) {
			app.CallApi(app.urls.DeleteRequest, { ID: entity.ID() }, (response) => { app.RedirectToStart() });
		};
	};

	// journal ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	model.LoadJournal = function (id) {
		app.CallApi(app.urls.GetJournal, { OwnerType: "Request", OwnerId: id },
			function (response) {
				var items = [];
				response.Items.forEach(function (item) { items.push({ ID: item.ID, UserId: item.UserId, UserName: item.UserName, Content: ko.observable(item.Content), Date: item.Date }) });
				model.Journal(items);
			});
	};

	model.ShowJournalForm = function () {
		model.IsJournalFormShown(true);
		document.querySelector("#journalContainer textarea").focus();
	};

	model.SubmitJournal = function () {
		app.CallApi(app.urls.SetJournal, { OwnerType: "Request", OwnerId: model.Request().ID(), Journal: { Content: model.JournalContent() } },
			function (response) {
				model.LoadJournal(model.Request().ID());
				model.JournalContent("");
				model.IsJournalFormShown(false);
			});
	};

	model.InitValidation = function () {
		app.Validation.ValidateField(model, "Name", model.Request().Name, new RequiredRule());
		app.Validation.ValidateField(model, "Name", model.Request().Name, new LengthRule(128));
	};

	model.InitTabs = function () {
		var ctrl = document.getElementById("requestTabs");
		ctrl.querySelectorAll(".tabs-header li").forEach(el => el.addEventListener("click", function (e) {
			ctrl.querySelectorAll(".active").forEach(ael => ael.classList.remove("active"));
			document.getElementById(el.getAttribute("data-target")).classList.add("active");
			el.classList.add("active");
		}));
	};

	model.Init = function () {
		if (app.GetUrlParam("create")) {
			model.IsCreateMode(true);
			model.LoadRequest(0);
		}
		else {
			var id = app.GetUrlId();
			if (id) {
				model.LoadRequest(id);

				app.EnsureOptions("Role");
				app.EnsureOptions("User");
			}
			else
				app.RedirectToError();
		}

		model.SelectCompanyModal = new SelectCompanyModal();
	};
}

var SelectCompanyModal = function () {
	var modal = this;

	modal.ContainerId = "";
	modal.CurrentItem = ko.observable();
	modal.Companies = ko.observableArray([]);

	modal.Show = function (modalId, item, users) {
		app.CallApi(app.urls.GetOptions, { Type: "Company" },
			function (response) {
				modal.Companies(response.Items);
			});

		modal.ContainerId = modalId || modal.ContainerId;
		modal.CurrentItem(ko.unwrap(item));
		ko.applyBindings(modal, document.getElementById(modal.ContainerId));
		document.querySelector("main").style.display = "none";
		document.getElementById(modal.ContainerId).style.display = "";
	};

	modal.Hide = function () {
		document.getElementById(modal.ContainerId).style.display = "none";
		document.querySelector("main").style.display = "";
		ko.cleanNode(document.getElementById(modal.ContainerId));
	};

	modal.Validate = function () {
		return true;
	};

	modal.Reset = function (self) {
		self.CurrentItem(null);
		self.OnClosed = null;
		self.OnDone = null;
	};

	modal.OnClosed = null;
	modal.Close = function (self, e) {
		self.Hide();
		if (self.OnClosed != null)
			self.OnClosed(self);

		self.Reset(self);
	};

	modal.OnDone = null;
	modal.Done = function (self, e) {
		if (!self.Validate())
			return;

		if (self.OnDone != null)
			self.OnDone(self);

		self.Hide();
		self.Reset(self);
	};
}


var RequiredRule = function (message) {
	var rule = this;
	rule.Field = null;
	rule.Message = message;

	rule.Validate = function () {
		if (rule.Field == null)
			throw "Field не инициализировано";

		if (!rule.Field())
			return rule.Message || "Это поле обязательно для заполнения";

		return null;
	};
};

var LengthRule = function (maxLength, message) {
	var rule = this;
	rule.Field = null;
	rule.Message = message;
	rule.MaxLength = maxLength;

	rule.Validate = function () {
		if (rule.Field == null)
			throw "Field не инициализировано";

		if (rule.Field() == undefined)
			return null;

		if (rule.Field().length > rule.MaxLength)
			return rule.Message || "Это поле слишком длинное, " + rule.Field().length + " символа(ов) (допускается " + rule.MaxLength + ")";

		return null;
	};
};

var FormatRule = function (regex, message) {
	var rule = this;
	rule.Field = null;
	rule.Message = message;
	rule.Regex = regex;

	rule.Validate = function () {
		if (rule.Field == null)
			throw "Field не инициализировано";

		if (rule.Field() == undefined)
			return null;

		if (!rule.Regex.test(rule.Field()))
			return rule.Message || "Это поле не соотвествует допустимому формату";

		return null;
	};
};