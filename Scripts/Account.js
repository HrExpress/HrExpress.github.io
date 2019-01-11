var PageViewModel = function () {
	var model = this;

	// поля ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	model.Account = ko.observable();
	model.IsDirty = ko.observable(false);

	// функции ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	model.LoadAccount = function (id) {
		app.CallApi(app.urls.GetAccount, { ID: id },
			function (response) {
				if (response.IsOk) {
					var account = ko.mapping.fromJS(response.Data);
					model.Account(account);
					model.SubscribeToEditable();
					model.ValidateField(model.Account(), "Name", "required");
				}
				else {
					alert(response.Message);
					app.RedirectToStart();
				}
			});
	};

	model.SubscribeToEditable = function () {
		model.Account().Name.subscribe(function () { model.IsDirty(true) });
		model.Account().Description.subscribe(function () { model.IsDirty(true) });
	};

	model.Save = function () {
		model.ValidateAll = true;
		if (!model.Validate())
			return;

		app.CallApi(app.urls.SaveAccount, { ID: model.Account().ID(), Name: model.Account().Name(), Description: model.Account().Description() },
			function (response) {
				if (response.IsOk)
					model.IsDirty(false);
				else
					model.ProcessResponseErrors(response);
			});
	};


	// validation 0.3 /////////////////////////////////////////////////////////////////////////////////////////////////////

	model.Validate = function (fieldName) {
		var result = "";
		model.Validation.every(function (item) {
			if ((fieldName) && (item.Name !== fieldName))
				return true;

			var fieldValid = item.Rules.every(function (rule) {
				// "required"
				if (rule == "required")
					if (!item.Var()) {
						result = "Это поле обязательно для заполнения";
						return false;
					}

				// { rule:"required", message:"" }
				if (typeof rule == "object" && rule.rule == "required")
					if (!item.Var()) {
						result = rule.message;
						return false;
					}

				// regexp
				if (rule instanceof RegExp)
					if (!rule.test(item.Var())) {
						result = "Это поле имеет неверный формат";
						return false;
					}

				// { rule:regexp, message:"" }
				if (typeof rule == "object" && rule.rule instanceof RegExp)
					if (!rule.rule.test(item.Var())) {
						result = rule.message;
						return false;
					}

				// callback
				if (typeof rule == "function") {
					var ruleResult = rule.call(this, item.Var());
					if (ruleResult) {
						result = ruleResult;
						return false;
					}
				}

				return true;
			});

			model.Hilite(item.Name, !fieldValid, result);

			return fieldValid || model.ValidateAll;
		});

		return (result == "");
	};

	model.DontValidateField = function (fieldName) {
		var index = -1;
		model.Validation.every(function (item) {
			index++;
			if (item.Name == fieldName) {
				model.Validation.splice(index, 1);
				return false;
			}

			return true;
		});
	};

	model.ValidateField = function (context, fieldName, rule, message) {
		model.Validation = model.Validation || [];
		model.ValidateAll = model.ValidateAll || false;

		var field = context[fieldName];
		var vf = null;
		model.Validation.forEach(function (item) { if (item.Name == fieldName) vf = item });

		if (vf == null) {
			vf = { Name: fieldName, Var: field, Rules: [] };
			model.Validation.push(vf);
			field.subscribe(function (newValue) { model.Validate(fieldName) });
		}

		vf.Rules.push(message ? { rule: rule, message: message } : rule);
	};

	model.Hilite = function (field, hasError, message) {
		var $container = $("[data-valmsg-for=" + field + "]");	// container for error text
		var $ctrl = $("[name=" + field + "]");

		if ($container.length) {
			$container.empty();
			if (hasError)
				$container.prepend(message);
		}
		else {
			$ctrl.next(".field-validation-error").remove();
			if (hasError)
				$ctrl.after("<span generated class='field-validation-error'>" + message + "</span>");
		}

		if (hasError)
			$ctrl.addClass("input-validation-error");
		else
			$ctrl.removeClass("input-validation-error");
	};

	model.HiliteNone = function () {
		$("[data-valmsg-for]").empty();
		$("[generated]").remove();
	};

	model.ProcessResponseErrors = function (response) {
		model.HiliteNone();
		for (var err in response.errors)
			model.Hilite(err, response.errors[err].length, typeof (response.errors[err]) === "string" ? response.errors[err] : response.errors[err].map(function (item) { return item.ErrorMessage }).join("; "));
	};


	model.Init = function () {
		var id = window.localStorage.getItem("account_id");
		if (id)
			model.LoadAccount(id);
		else
			window.location = "/AccountSelect.html";
	};
}
