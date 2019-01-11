// company view data and behaviour
var PageViewModel = function () {
	var model = this;

	// поля ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	model.Company = ko.observable();
	model.IsDirty = ko.observable(false);
	model.IsCreateMode = ko.observable(false);
	model.Workgroup = ko.observableArray([]);
	model.Files = ko.observableArray([]);
	model.Vacancies = ko.observableArray([]);
	model.Requests = ko.observableArray([]);
	model.Journal = ko.observableArray([]);
	model.IsJournalFormShown = ko.observable(false);
	model.NewJournalItem = ko.observable(null);
	model.EditWorkgroupModal = null;

	// функции ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	model.LoadCompany = function (id) {
		app.CallApi(app.urls.GetCompany, { ID: id },
			function (response) {
				model.Company(ko.mapping.fromJS(response.Data));
				model.SubscribeToEditable();
				model.InitValidation();
				model.InitTabs();

				if (!model.IsCreateMode()) {
					model.LoadWorkgroup();
					model.LoadJournal();
					model.LoadVacancies();
					model.LoadRequests();
					model.LoadFiles();
				}
			});
	};

	model.LoadVacancies = function (id) {
		app.CallApi(app.urls.GetCompanyVacancies, { EntityID: model.Company().ID() },
			function (response) {
				model.Vacancies(response.Items);
			});
	};

	model.LoadRequests = function (id) {
		app.CallApi(app.urls.GetCompanyRequests, { EntityID: model.Company().ID() },
			function (response) {
				model.Requests(response.Items);
			});
	};

	model.Save = function () {
		model.ValidateAll = true;
		if (!app.Validation.Validate(model))
			return;

		var data = {
			ID: model.Company().ID(),
			Name: model.Company().Name(),
			Description: model.Company().Description(),
			Address: model.Company().Address(),
			LegalAddress: model.Company().LegalAddress(),
			LegalForm: model.Company().LegalForm(),
			BIC: model.Company().BIC(),
			TIN: model.Company().TIN(),
			KPP: model.Company().KPP(),
			KS: model.Company().KS(),
			RS: model.Company().RS(),
			Bank: model.Company().Bank(),
			OGRN: model.Company().OGRN(),
			Email: model.Company().Email(),
			Phone: model.Company().Phone(),
			Url: model.Company().Url()
		};

		if (model.IsCreateMode())
			app.CallApi(app.urls.CreateCompany, { Entity: data }, (response) => { window.location = "/Company.html?" + response.Data; });
		else
			app.CallApi(app.urls.SaveCompany, { Entity: data }, (response) => { model.IsDirty(false); });
	};

	model.Delete = function () {
		var entity = model.Company();
		app.CallApi(app.urls.GetCompanyStat, { ID: ko.unwrap(entity.ID) },
			function (response) {
				var s = response.Data || {};
				entity.VacancyCount = s.Vacancies || 0;
				entity.JournalCount = s.Journal || 0;
				app.ConfirmModal.Show("confirm-delete-company-modalo", entity);
				app.ConfirmModal.OnDone = function (self) {
					app.CallApi(app.urls.DeleteCompany, { ID: entity.ID }, (response) => { app.RedirectToStart() });
				};
			});
	};

	model.SubscribeToEditable = function () {
		var obj = model.Company();
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

	model.CreateVacancy = function () {
		window.location = "/Vacancy.html?create&CompanyId=" + model.Company().ID();
	};

	model.CreateRequest = function () {
		window.location = "/Request.html?create&CompanyId=" + model.Company().ID();
	};

	// files //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	model.LoadFiles = function () {
		app.CallApi(app.urls.Files, { OwnerType: "Company", OwnerId: model.Company().ID() },
			function (response) {
				var items = [];
				response.Items.forEach(function (item) { items.push({ ID: item.ID, UserId: item.UserId, Name: item.Name, Type: item.Type, Size: item.Size, Date: app.FormatDate(item.Date) }) });
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
			OwnerId: model.Company().ID(),
			OwnerType: "Company"
		};

		formData.append("File", dt.files[0]);
		formData.append("Data", JSON.stringify(data));

		app.CallApi(app.urls.UploadFile, formData, function (response) {
			model.LoadFiles(model.Company().ID());
			alert("Файл загружен");
		});
	};

	model.DeleteFile = function (entity) {
		app.ConfirmModal.Show("confirmDeleteFileModalo", entity);
		app.ConfirmModal.OnDone = function (self) {
			app.CallApi(app.urls.DeleteFile, { ID: self.CurrentItem().ID },
				function (response) {
					model.Files.remove(entity);
				});
		};
	};

	// workgroup //////////////////////////////////////////////////////////////////////////////////////////////////////////////

	model.LoadWorkgroup = function () {
		app.CallApi(app.urls.Workgroup, { OwnerType: "Company", OwnerId: model.Company().ID() },
			function (response) {
				var items = [];
				response.Items.forEach(function (item) { items.push({ ID: item.ID, UserId: ko.observable(item.UserId), Role: ko.observable(item.Role), Percent: ko.observable(item.Percent) }) });
				model.Workgroup(items);
				model.ValidateWorkgroup();
			});
	};

	model.AddWorkgroup = function () {
		app.CallApi(app.urls.GetWorkgroup, { OwnerType: "Company", OwnerId: model.Company().ID() },
			function (response) {
				var item = ko.mapping.fromJS(response.Data);
				model.EditWorkgroupModal.Show("edit-workgroup-modalo", item);
				model.EditWorkgroupModal.OnDone = function () {
					app.CallApi(app.urls.SetWorkgroup, { Entity: { OwnerType: item.OwnerType(), OwnerId: item.OwnerId(), UserId: item.UserId(), Role: item.Role(), Percent: item.Percent() } },
						function (response) {
							item = ko.mapping.fromJS(response.Data);
							model.Workgroup.push(item);
						});
				};
			})
	};

	model.EditWorkgroup = function (item) {
		var tempItem = { UserId: ko.observable(item.UserId()), Role: ko.observable(item.Role()), Percent: ko.observable(item.Percent()) };

		model.EditWorkgroupModal.Show("edit-workgroup-modalo", tempItem);
		model.EditWorkgroupModal.OnDone = function () {
			item.UserId(tempItem.UserId());
			item.Role(tempItem.Role());
			item.Percent(tempItem.Percent());
			app.CallApi(app.urls.SetWorkgroup, { Entity: { ID: item.ID, UserId: item.UserId(), Role: item.Role(), Percent: item.Percent() } },
				function (response) {
					model.ValidateWorkgroup();
				});
		};
	};

	model.DeleteWorkgroup = function (entity) {
		app.ConfirmModal.Show("confirmDeleteWorkgroupModalo", entity);
		app.ConfirmModal.OnDone = function (self) {
			app.CallApi(app.urls.DeleteWorkgroup, { ID: self.CurrentItem().ID },
				function (response) {
					model.Workgroup.remove(entity);
					model.ValidateWorkgroup();
				});
		};
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

	model.LoadJournal = function () {
		app.CallApi(app.urls.Journal, { OwnerType: "Company", OwnerId: model.Company().ID() },
			function (response) {
				var items = [];
				response.Items.forEach(function (item) { items.push({ ID: item.ID, UserId: item.UserId, UserName: item.UserName, Content: item.Content, Date: item.Date, IsMessage: item.IsMessage }) });
				model.Journal(items);
			});
	};

	model.ShowJournalForm = function () {
		app.CallApi(app.urls.GetJournal, { OwnerType: "Company", OwnerId: model.Company().ID() },
			function (response) {
				model.NewJournalItem({ OwnerType: response.Data.OwnerType, OwnerId: response.Data.OwnerId, Content: ko.observable(response.Data.Content) });
				model.IsJournalFormShown(true);
				document.querySelector("#journalContainer textarea").focus();
			});
	};

	model.SubmitJournal = function () {
		app.CallApi(app.urls.SetJournal, { Entity: { OwnerType: model.NewJournalItem().OwnerType, OwnerId: model.NewJournalItem().OwnerId, Content: model.NewJournalItem().Content() } },
			function (response) {
				model.LoadJournal(model.Company().ID());
				model.IsJournalFormShown(false);
			});
	};

	model.InitValidation = function () {
		app.Validation.ValidateField(model, "CompanyName", model.Company().Name, new app.Validation.RequiredRule());
		app.Validation.ValidateField(model, "CompanyName", model.Company().Name, new app.Validation.LengthRule(64));
		app.Validation.ValidateField(model, "CompanyEmail", model.Company().Email, new app.Validation.RequiredRule());
		app.Validation.ValidateField(model, "CompanyEmail", model.Company().Email, new app.Validation.FormatRule(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/));
		app.Validation.ValidateField(model, "CompanyTIN", model.Company().TIN, new app.Validation.FormatRule(/^(\d{10}|\d{12})$/));
	};

	model.InitTabs = function () {
		var ctrl = document.getElementById("companyTabs");
		ctrl.querySelectorAll(".tabs-header li").forEach(el => el.addEventListener("click", function (e) {
			ctrl.querySelectorAll(".active").forEach(ael => ael.classList.remove("active"));
			document.getElementById(el.getAttribute("data-target")).classList.add("active");
			el.classList.add("active");
		}));
	};

	model.Init = function () {
		if (app.GetUrlParam("create")) {
			model.IsCreateMode(true);
			model.LoadCompany(0);
		}
		else {
			var id = app.GetUrlId();
			if (id) {
				model.LoadCompany(id);
				model.EditWorkgroupModal = new EditWorkgroupModal();

				app.EnsureOptions("Role");
				app.EnsureOptions("User");
			}
			else
				app.RedirectToError();
		}
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

