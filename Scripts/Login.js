var PageViewModel = function (options) {
	var model = this;

	// поля ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	model.Mode = ko.observable("Login");
	model.Pass = ko.observable("");
	model.Email = ko.observable("");
	model.IsEulaReaded = ko.observable(false);

	// функции ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	model.Validate = function () {
		if (!model.Email()) {
			alert("Заполните поле Электронная почта");
			return false;
		}

		if ((model.Mode() == "Login") || (model.Mode() == "Register"))
			if (!model.Pass()) {
				alert("Заполните поле Пароль");
				return false;
			}

		if (model.Mode() == "Register")
			if (!model.IsEulaReaded()) {
				alert("Регистрация возможна только при согласии с правилами использования сервиса.");
				return false;
			}

		return true;
	};

	model.EnterLogin = function (d, e) {
		e.keyCode === 13 && model.Login();
		return true;
	};

	model.Login = function () {
		if (!model.Validate())
			return;

		fetch(app.urls.Login, {
			method: "POST",
			headers: { "Content-type": "application/json; charset=utf-8" },
			body: JSON.stringify({ Email: model.Email(), Pass: model.Pass(), AppId: 1 })
		})
			.then(function (response) { return response.json() })
			.then(function (response) {
				if (response.IsOk) {
					// store auth data
					window.localStorage.setItem("user_id", response.UserId);
					window.localStorage.setItem("account_id", response.AccountId || 0);
					window.localStorage.setItem("auth_token", response.Token);
					window.localStorage.setItem("auth_token_expiration", new Date(new Date().valueOf() + 7 * 24 * 60 * 60 * 1000)); // week
					window.location = "/AccountSelect.html?auto";
				}
				else
					alert(response.Message);
			});
	};

	model.Register = function () {
		if (!model.Validate())
			return;

		fetch(app.urls.Register, {
			method: "POST",
			headers: { "Content-type": "application/json; charset=utf-8" },
			body: JSON.stringify({ Email: model.Email(), Pass: model.Pass(), AppId: 1 })
		})
			.then(function (response) { return response.json() })
			.then(function (response) {
				if (response.IsOk) {
					// store auth data
					window.localStorage.setItem("user_id", response.UserId);
					window.localStorage.setItem("account_id", response.AccountId || 0);
					window.localStorage.setItem("auth_token", response.Token);
					window.localStorage.setItem("auth_token_expiration", new Date(new Date().valueOf() + 7 * 24 * 60 * 60 * 1000)); // week
					app.RedirectToStart();
				}
				else
					alert(response.Message);
			});
	};

	model.ResetPass = function () {
		if (!model.Validate())
			return;

		app.CallApi(app.urls.ResetPass, { Email: model.Email() },
			function (response) {
				alert(response.Message);
			});
	};

	model.SetPassword = function () {
		if (!model.Validate())
			return;

		fetch(app.urls.SetPass, {
			method: "POST",
			headers: { "Content-type": "application/json; charset=utf-8" },
			body: JSON.stringify({ Email: model.Email(), Pass: model.Pass(), Code: model.Code(), AppId: 1 })
		})
			.then(function (response) { return response.json() })
			.then(function (response) {
				if (response.IsOk) {
					// store auth data
					window.localStorage.setItem("user_id", response.UserId);
					window.localStorage.setItem("account_id", response.AccountId || 0);
					window.localStorage.setItem("auth_token", response.Token);
					window.localStorage.setItem("auth_token_expiration", new Date(new Date().valueOf() + 7 * 24 * 60 * 60 * 1000)); // week
					app.RedirectToStart();
				}
				else
					alert(response.Message);
			});
	};

	model.SwitchToLogin = function () {
		model.Mode("Login");
	};

	model.SwitchToRegister = function () {
		model.Mode("Register");
	};

	model.SwitchToReset = function () {
		model.Mode("Reset");
	};

	model.SwitchToSetPassword = function () {
		model.Code = model.Code || ko.observable("");
		model.Mode("SetPassword");
	};

	model.Init = function () {
		if (app.IsAuthenticated())
			app.RedirectToStart();

		var reset = app.GetUrlParam("reset");
		if (reset) {
			model.Mode("Wait");

			app.CallApi(app.urls.ResetPass, { Phase: 2, Code: reset },
				function (response) {
					model.Email(response.Email);
					model.Mode("SetPassword");
				});
		}

		var set = app.GetUrlParam("SetPassword");
		if (set) {
			model.SwitchToSetPassword();
			model.Email(set);
			model.Code(app.GetUrlParam("code"));
		}
	};
}
