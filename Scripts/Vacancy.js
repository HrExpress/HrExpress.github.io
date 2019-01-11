// vacancy view data and behaviour
var PageViewModel = function () {
	var model = this;

	// поля ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	model.Vacancy = ko.observable();
	model.IsDirty = ko.observable(false);
	model.IsCreateMode = ko.observable(false);
	model.Workgroup = ko.observableArray([]);
	model.Files = ko.observableArray([]);
	model.Journal = ko.observableArray([]);
	model.JournalContent = ko.observable("");
	model.IsJournalFormShown = ko.observable(false);
	model.EditWorkgroupModal = null;
	model.SelectCompanyModal = null;

	// функции ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	model.LoadVacancy = function (id) {
		app.CallApi(app.urls.GetVacancy, { ID: id, CompanyId: app.GetUrlParam("CompanyId") || 0 },
			function (response) {
				model.Vacancy(ko.mapping.fromJS(response.Data));
				model.SubscribeToEditable();
				model.InitValidation();
				model.InitTabs();

				if (!model.IsCreateMode()) {
					model.LoadWorkgroup(model.Vacancy().ID());
					model.LoadJournal(model.Vacancy().ID());
					model.LoadFiles(model.Vacancy().ID());
				}
				else if (app.GetUrlParam("CompanyId")) {
					app.CallApi(app.urls.GetOptions, { Type: "Company" },
						function (or) {
							if (or.IsOk) {
								var companyId = parseInt(app.GetUrlParam("CompanyId"));
								model.Vacancy().CompanyId(companyId);
								model.Vacancy().CompanyName(ko.utils.arrayFirst(or.Items, function (item) { return item.ID == companyId }).Display);
							}
						});
				}
			});
	};

	model.Save = function () {
		model.ValidateAll = true;
		if (!app.Validation.Validate(model))
			return;

		var data = {
			ID: model.Vacancy().ID(),
			Name: model.Vacancy().Name(),
			Address: model.Vacancy().Address(),
			CompanyId: model.Vacancy().CompanyId(),
			Status: model.Vacancy().Status(),
			Requirements: model.Vacancy().Requirements(),
			WorkTerms: model.Vacancy().WorkTerms(),
			Announcement: model.Vacancy().Announcement(),
			Responsibility: model.Vacancy().Responsibility(),
			Salary: model.Vacancy().Salary(),
			Code: model.Vacancy().Code(),
			AmountPerson: model.Vacancy().AmountPerson(),
			Priority: model.Vacancy().Priority()
		};

		if (model.IsCreateMode())
			app.CallApi(app.urls.CreateVacancy, { Vacancy: data }, (response) => { window.location = "/Vacancy.html?" + response.Data });
		else
			app.CallApi(app.urls.SaveVacancy, { Vacancy: data }, (response) => { model.IsDirty(false) });
	};

	model.SubscribeToEditable = function () {
		var obj = model.Vacancy();
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
		model.SelectCompanyModal.Show("select-company-modalo", model.Vacancy().CompanyId);
		model.SelectCompanyModal.OnDone = function () {
			var id = this.CurrentItem();
			model.Vacancy().CompanyId(id);
			model.Vacancy().CompanyName(ko.utils.arrayFirst(this.Companies(), function (item) { return item.ID == id }).Display);
		};
	};

	model.Delete = function () {
		var entity = model.Vacancy();
		app.ConfirmModal.Show("confirm-delete-vacancy-modalo", entity);
		app.ConfirmModal.OnDone = function (self) {
			app.CallApi(app.urls.DeleteVacancy, { ID: entity.ID() }, (response) => { app.RedirectToStart() });
		};
	};

	// files //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	model.LoadFiles = function (id) {
		app.CallApi(app.urls.GetFiles, { OwnerType: "Vacancy", OwnerId: id },
			function (response) {
				var items = [];
				response.Items.forEach(function (item) { items.push({ ID: item.ID, UserId: item.UserId, Name: item.Name, Type: item.Type, Size: item.Size }) });
				model.Files(items);
			});
	};

	model.UploadFile = function (e) {
		var dt = document.getElementById("selectedFile");
		// TODO: dt may be e.originalEvent.dataTransfer;
		var formData = new FormData();
		var filename = dt.files[0].name;
		var filesize = dt.files[0].size;
		if (filesize > 1048576) {
			alert("Вы можете загружать файлы размером не более 1MB");
			return;
		}

		var data = {
			Auth: localStorage.getItem("user_id") + ":" + localStorage.getItem("auth_token") + ":1:" + localStorage.getItem("account_id"),
			OwnerId: model.Vacancy().ID(),
			OwnerType: "Vacancy"
		};

		formData.append("File", dt.files[0]);
		formData.append("Data", JSON.stringify(data));

		app.CallApi(app.urls.UploadFile, formData, function (response) {
			alert("Ok");
		});
	};

	// workgroup //////////////////////////////////////////////////////////////////////////////////////////////////////////////

	model.LoadWorkgroup = function (id) {
		app.CallApi(app.urls.GetWorkgroup, { OwnerType: "Vacancy", OwnerId: id },
			function (response) {
				var items = [];
				response.Items.forEach(function (item) { items.push({ ID: item.ID, UserId: ko.observable(item.UserId), Role: ko.observable(item.Role), Percent: ko.observable(item.Percent) }) });
				model.Workgroup(items);
				model.ValidateWorkgroup();
			});
	};

	model.AddWorkgroup = function () {
		var item = { UserId: ko.observable(""), Role: ko.observable(""), Percent: ko.observable("") };
		model.EditWorkgroupModal.Show("editWorkgroupModal", item, model.WorkgroupUsers);
		model.EditWorkgroupModal.OnDone = function () {
			app.CallApi(app.urls.SetWorkgroup, { Name: "Vacancy", ID: model.Vacancy().ID(), Entity: { UserId: item.UserId(), Role: item.Role(), Percent: item.Percent() } },
				function (response) {
					model.Workgroup.push(item);
				});
		};
	};

	model.EditWorkgroup = function (item) {
		var tempItem = { UserId: ko.observable(item.UserId()), Role: ko.observable(item.Role()), Percent: ko.observable(item.Percent()) };

		model.EditWorkgroupModal.Show("edit-workgroup-modalo", tempItem);
		model.EditWorkgroupModal.OnDone = function () {
			item.UserId(tempItem.UserId());
			item.Role(tempItem.Role());
			item.Percent(tempItem.Percent());
			app.CallApi(app.urls.SetWorkgroup, { Name: "Vacancy", ID: model.Vacancy().ID(), Entity: { ID: item.ID, UserId: item.UserId(), Role: item.Role(), Percent: item.Percent() } },
				function (response) {
					model.ValidateWorkgroup();
				});
		};
	};

	model.DeleteWorkgroup = function (entity) {
		app.ConfirmModal.Selector = "#confirmDeleteWorkgroupModal";
		app.ConfirmModal.CurrentItem(entity);
		app.ConfirmModal.OnDone = function (self) {
			app.CallApi(app.urls.DeleteWorkgroup, { ID: self.CurrentItem().ID },
				function (response) {
					model.Workgroup.remove(entity);
					model.ValidateWorkgroup();
				});
		};
		app.ConfirmModal.Show();
	};

	model.ValidateWorkgroup = function () {
		var sum = 0;
		ko.utils.arrayForEach(model.Workgroup(), function (item) { sum += parseInt(item.Percent()) || 0; });

		if (sum != 100)
			app.Show("#workgroup .alert");
		else
			app.Hide("#workgroup .alert");
	};

	// journal ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	model.LoadJournal = function (id) {
		app.CallApi(app.urls.GetJournal, { OwnerType: "Vacancy", OwnerId: id },
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
		app.CallApi(app.urls.SetJournal, { OwnerType: "Vacancy", OwnerId: model.Vacancy().ID(), Journal: { Content: model.JournalContent() } },
			function (response) {
				model.LoadJournal(model.Vacancy().ID());
				model.JournalContent("");
				model.IsJournalFormShown(false);
			});
	};

	model.InitValidation = function () {
		app.Validation.ValidateField(model, "VacancyName", model.Vacancy().Name, new RequiredRule());
		app.Validation.ValidateField(model, "VacancyName", model.Vacancy().Name, new LengthRule(128));
	};

	model.InitTabs = function () {
		var ctrl = document.getElementById("vacancyTabs");
		ctrl.querySelectorAll(".tabs-header li").forEach(el => el.addEventListener("click", function (e) {
			ctrl.querySelectorAll(".active").forEach(ael => ael.classList.remove("active"));
			document.getElementById(el.getAttribute("data-target")).classList.add("active");
			el.classList.add("active");
		}));
	};

	model.Init = function () {
		if (app.GetUrlParam("create")) {
			model.IsCreateMode(true);
			model.LoadVacancy(0);
		}
		else {
			var id = app.GetUrlId();
			if (id) {
				model.LoadVacancy(id);
				model.EditWorkgroupModal = new EditWorkgroupModal();

				app.EnsureOptions("Role");
				app.EnsureOptions("User");
				app.EnsureOptions("VacancyStatus");
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

var EditWorkgroupModal = function () {
	var modal = this;

	modal.ContainerId = "";
	modal.CurrentItem = ko.observable();
	modal.UserCode = ko.observable("");
	modal.Users = ko.observableArray([]);
	modal.Roles = ko.observableArray([]);

	modal.Show = function (modalId, item) {
		modal.Users = app.ViewModel.Options.User;
		modal.Roles = app.ViewModel.Options.Role;
		modal.ContainerId = modalId;
		modal.CurrentItem(item);
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
		if (!modal.CurrentItem().Percent) {
			$("#workgroupErrorMessage").show().text("Введите процент участия");
			return false;
		}

		if (modal.UserCode() != "") {
			var codecheck = app.CallApi(app.urls.GetUser, { Code: modal.UserCode() },
				function (response) {
					if (response.IsOk) {
						modal.Users.push({ ID: response.Data.ID, Display: response.Data.Name });
						modal.CurrentItem().UserId(response.Data.ID);
						modal.UserCode("");
						return true;
					}
					else {
						$("#workgroupErrorMessage").show().text("Пользователь с таким кодом не найден");
					}
				}, true);

			if (!codecheck)
				return false;
		}

		return true;
	};

	modal.CheckUserCode = function () {
		app.CallApi(app.urls.GetUser, { Code: modal.UserCode() },
			function (response) {
				alert(response.Data.Name)
			});
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