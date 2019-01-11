// candidate view data and behaviour
var PageViewModel = function () {
	var model = this;

	// поля ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	model.Candidate = ko.observable();
	model.IsDirty = ko.observable(false);
	model.IsCreateMode = ko.observable(false);
	model.Journal = ko.observableArray([]);
	model.JournalContent = ko.observable("");
	model.IsJournalFormShown = ko.observable(false);

	// функции ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	model.Delete = function () {
		var entity = model.Candidate();
		app.ConfirmModal.Show("confirm-delete-candidate-modalo", entity);
		app.ConfirmModal.OnDone = function (self) {
			app.CallApi(app.urls.DeleteCandidate, { ID: entity.ID() },
				function (response) {
					app.RedirectToStart();
				});
		};
	};

	model.LoadCandidate = function (id) {
		app.CallApi(app.urls.GetCandidate, { ID: id },
			function (response) {
				var candidate = ko.mapping.fromJS(response.Data);
				// extend
				candidate.IsMale = ko.computed({
					read: function () { return this.Sex().toString() },
					write: function (newValue) { this.Sex(newValue === "true") },
					owner: candidate
				});
				model.Candidate(candidate);
				model.SubscribeToEditable();
				model.InitValidation();
				model.InitTabs();

				if (!model.IsCreateMode()) {
					model.LoadJournal(model.Candidate().ID());
				}
			});
	};

	model.Save = function () {
		model.ValidateAll = true;
		//if (!app.Validation.Validate(model))
		//	return;

		var data = {
			ID: model.Candidate().ID(),
			Address: model.Candidate().Address(),
			Birthday: model.Candidate().Birthday(),
			Contacts: model.Candidate().Contacts(),
			Email: model.Candidate().Email(),
			Name: model.Candidate().Name(),
			FirstName: model.Candidate().FirstName(),
			FamilyName: model.Candidate().FamilyName(),
			PatronymicName: model.Candidate().PatronymicName(),
			Phone: model.Candidate().Phone(),
			Sex: model.Candidate().Sex(),
			Salary: model.Candidate().Salary(),
			Text: model.Candidate().Text(),
			Url: model.Candidate().Url()
		};

		if (model.IsCreateMode())
			app.CallApi(app.urls.CreateCandidate, { Entity: data }, (response) => { window.location = "/Candidate.html?" + response.Data; });
		else
			app.CallApi(app.urls.SaveCandidate, { Entity: data }, (response) => { model.IsDirty(false); });
	};

	model.SubscribeToEditable = function () {
		var obj = model.Candidate();
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

	// journal ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	model.LoadJournal = function (id) {
		app.CallApi(app.urls.Journal, { OwnerType: "Candidate", OwnerId: id },
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
		app.CallApi(app.urls.SetJournal, { OwnerType: "Candidate", OwnerId: model.Candidate().ID(), Journal: { Content: model.JournalContent() } },
			function (response) {
				if (response.IsOk) {
					model.LoadJournal(model.Candidate().ID());
					model.JournalContent("");
					model.IsJournalFormShown(false);
				}
			});
	};

	model.InitValidation = function () {
		//app.Validation.ValidateField(model, "CandidateName", model.Candidate().Name, new app.Validation.RequiredRule());
		//app.Validation.ValidateField(model, "CandidateName", model.Candidate().Name, new app.Validation.LengthRule(64));
		//app.Validation.ValidateField(model, "CandidateEmail", model.Candidate().Email, new app.Validation.RequiredRule());
		//app.Validation.ValidateField(model, "CandidateEmail", model.Candidate().Email, new app.Validation.FormatRule(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/));
	};

	model.InitTabs = function () {
		var ctrl = document.getElementById("candidateTabs");
		ctrl.querySelectorAll(".tabs-header li").forEach(el => el.addEventListener("click", function (e) {
			ctrl.querySelectorAll(".active").forEach(ael => ael.classList.remove("active"));
			document.getElementById(el.getAttribute("data-target")).classList.add("active");
			el.classList.add("active");
		}));
	};

	model.Init = function () {
		if (app.GetUrlParam("create")) {
			model.IsCreateMode(true);
			model.LoadCandidate(0);
		}
		else {
			var id = app.GetUrlId();
			if (id) {
				model.LoadCandidate(id);
			}
			else
				app.RedirectToError();
		}
	};
}


