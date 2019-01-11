var app = app || {};

app.config = app.config || {};
//app.config.apiRoot = "http://localhost:1025/api/";
app.config.apiRoot = "http://hr-express.azurewebsites.net/api/";

// #region Urls

app.urls = {

	// candidate

	GetCandidate: app.config.apiRoot + "Candidate/Get",
	SetCandidate: app.config.apiRoot + "Candidate/Set",
	CreateCandidate: app.config.apiRoot + "Candidate/Create",
	SaveCandidate: app.config.apiRoot + "Candidate/Update",
	GetCandidates: app.config.apiRoot + "Candidate/List",
	DeleteCandidate: app.config.apiRoot + "Candidate/Delete",
	GetCandidateStat: app.config.apiRoot + "Candidate/GetStat",

	// request

	GetRequest: app.config.apiRoot + "Request/Get",
	CreateRequest: app.config.apiRoot + "Request/Create",
	SaveRequest: app.config.apiRoot + "Request/Update",
	GetRequests: app.config.apiRoot + "Request/List",
	DeleteRequest: app.config.apiRoot + "Request/Delete",

	GetOptions: app.config.apiRoot + "Common/GetOptions",

	// workgroup

	Workgroup: app.config.apiRoot + "Workgroup/List",
	GetWorkgroup: app.config.apiRoot + "Workgroup/Get",
	SetWorkgroup: app.config.apiRoot + "Workgroup/Set",
	DeleteWorkgroup: app.config.apiRoot + "Workgroup/Delete",

	// files

	Files: app.config.apiRoot + "File/List",
	SetFile: app.config.apiRoot + "File/Set",
	DeleteFile: app.config.apiRoot + "File/Delete",
	UploadFile: app.config.apiRoot + "File/Upload",
	DownloadFile: app.config.apiRoot + "File/Download",

	// journal

	Journal: app.config.apiRoot + "Journal/List",
	GetJournal: app.config.apiRoot + "Journal/Get",
	SetJournal: app.config.apiRoot + "Journal/Set",
	DeleteJournal: app.config.apiRoot + "Journal/Delete"
};

app.urls.Login = app.config.apiRoot + "User/Login";
app.urls.Register = app.config.apiRoot + "User/Register";
app.urls.SetPass = app.config.apiRoot + "User/SetPassword";
app.urls.ResetPass = app.config.apiRoot + "User/ResetPassword";
app.urls.UserInfo = app.config.apiRoot + "User/Info";
app.urls.GetUser = app.config.apiRoot + "User/GetUser";
app.urls.SaveUser = app.config.apiRoot + "User/Update";
app.urls.GetAccounts = app.config.apiRoot + "User/GetAccounts";
app.urls.GetAccount = app.config.apiRoot + "Account/Get";
app.urls.GetAccountStat = app.config.apiRoot + "Account/Stat";
app.urls.CreateAccount = app.config.apiRoot + "Account/Create";
app.urls.SaveAccount = app.config.apiRoot + "Account/Update";
app.urls.GetAccountSettings = app.config.apiRoot + "Account/GetSettings";
app.urls.SetAccountSettings = app.config.apiRoot + "Account/SetSettings";

app.urls.GetVacancy = app.config.apiRoot + "Vacancy/Get";
app.urls.SetVacancy = app.config.apiRoot + "Vacancy/Set";
app.urls.GetVacancies = app.config.apiRoot + "Vacancy/List";
app.urls.DeleteVacancy = app.config.apiRoot + "Vacancy/Delete";
app.urls.CanCreateVacancy = app.config.apiRoot + "Vacancy/CanCreate";
app.urls.SearchVacancies = app.config.apiRoot + "Vacancy/Search";
app.urls.ViewVacancy = app.config.apiRoot + "Vacancy/View";
app.urls.CreateVacancy = app.config.apiRoot + "Vacancy/Create";
app.urls.SaveVacancy = app.config.apiRoot + "Vacancy/Update";

app.urls.GetCompany = app.config.apiRoot + "Company/Get";
app.urls.SetCompany = app.config.apiRoot + "Company/Set";
app.urls.CreateCompany = app.config.apiRoot + "Company/Create";
app.urls.SaveCompany = app.config.apiRoot + "Company/Update";
app.urls.GetCompanies = app.config.apiRoot + "Company/List";
app.urls.DeleteCompany = app.config.apiRoot + "Company/Delete";
app.urls.CanCreateCompany = app.config.apiRoot + "Company/CanCreate";
app.urls.GetCompanyVacancies = app.config.apiRoot + "Company/Vacancies";
app.urls.GetCompanyRequests = app.config.apiRoot + "Company/Requests";
app.urls.GetCompanyPersons = app.config.apiRoot + "Company/Persons";
app.urls.GetCompanyStat = app.config.apiRoot + "Company/GetStat";
app.urls.DeleteCompanyPerson = app.config.apiRoot + "Company/DeletePerson";
app.urls.ViewCompany = app.config.apiRoot + "Company/View";


// #endregion

app.ViewModel = {
	// поля ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	User: ko.observable(),	// null если данные не загружены
	Account: ko.observable(),	// null если данные не загружены
	Options: {},
	PageViewModel: null,

	// функции ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	Logout: function () {
		window.localStorage.removeItem("user_id");
		window.localStorage.removeItem("account_id");
		window.localStorage.removeItem("auth_token");
		window.localStorage.removeItem("auth_token_expiration");
		app.RedirectToStart();
	},

	LoadUserInfo: function () {
		if (app.IsAuthenticated())
			app.CallApi(app.urls.UserInfo, { UserId: localStorage.getItem("user_id") }, (response) => app.ViewModel.User(response.Data), true);
	},

	Init: function () {
		if (window.location.pathname === "/login.html" && app.IsAuthenticated())
			window.location = "/";

		if (window.location.pathname !== "/login.html" && window.location.pathname !== "/about.html" && !app.IsAuthenticated())
			window.location = "/login.html";

		app.ViewModel.LoadUserInfo();
		if (app.ViewModel.PageViewModel != null)
			app.ViewModel.PageViewModel.Init();
	}
};

app.IsAuthenticated = function () {
	var token = localStorage.getItem("auth_token");
	if (token) {
		var tokenExpiration = localStorage.getItem("auth_token_expiration");
		if (new Date(tokenExpiration) > new Date())
			return true;
	}

	return false;
};

app.CallApi = function (url, data, success, sync) {
	if (url == undefined)
		throw "Пустой Url";

	if (data instanceof FormData)
		data.append("Auth", localStorage.getItem("user_id") + ":" + localStorage.getItem("auth_token") + ":1:" + localStorage.getItem("account_id"));
	else
		data.Auth = localStorage.getItem("user_id") + ":" + localStorage.getItem("auth_token") + ":1:" + localStorage.getItem("account_id");

	var request = new XMLHttpRequest();
	request.open("POST", url, !sync);
	if (data instanceof FormData)
		;
	else
		request.setRequestHeader('Content-Type', "application/json; charset=utf-8");

	request.onload = function () {
		if (request.status >= 200 && request.status < 400) {
			// Success!
			var response = JSON.parse(request.responseText);
			if (response.IsOk)
				success(response);
			else
				alert(response.Message || "Серверу не удалось вернуть требуемые данные");
		} else {
			if (request.status == 401) {
				var brt = document.getElementById("broot");
				while (brt.firstChild)
					brt.removeChild(brt.firstChild);

				alert("Это действие требует авторизации. Вы будете перенаправлены на страницу входа.");
				app.RedirectToLogin(window.location.pathname + window.location.search);
			}
			else
				if (request.response != undefined)
					alert(JSON.parse(request.response).Message);
				else
					console.log("Error occured: " + request.status + " " + request.statusText);
		}
	};

	request.onerror = function () {
		console.log("Error occured, request failed");
	};

	if (data instanceof FormData)
		request.send(data);
	else
		request.send(JSON.stringify(data));
};


app.EnsureOptions = function (name) {
	if (!app.ViewModel.Options[name])
		app.ViewModel.Options[name] = [];

	var options = app.ViewModel.Options[name];
	if (!options.length)
		app.CallApi(app.urls.GetOptions, { Type: name }, function (response) { app.ViewModel.Options[name] = response.Items });
};

app.GetUrlParam = function (name) {
	var params = window.location.search.substr(1).split('&');
	for (var i = 0; i < params.length; ++i) {
		var p = params[i].split('=', 2);
		if (p[0] == name)
			return (p.length == 1) ? name : decodeURIComponent(p[1].replace(/\+/g, " "));
	}

	return null;
};

app.GetUrlId = function () {
	var params = window.location.search.substr(1).split('&');
	if (params.length == 0)
		return null;

	var id = parseInt(params[0].split('=', 2)[0], 10);

	if (!isNaN(id))
		return id;

	return null;
};

app.RedirectToStart = function () {
	var returnUrl = app.GetUrlParam("returnUrl");
	window.location = returnUrl || "/Index.html";
};

app.RedirectToError = function (error) {
	// TODO:
	alert("Произошла ошибка: " + error);
	window.location = "/Error.html";
};

app.RedirectToLogin = function (returnUrl) {
	// TODO:
	window.location = "/Login.html" + ((returnUrl) ? "?returnUrl=" + encodeURIComponent(returnUrl) : "");
};

app.FormatDate = function (date, withTime) {
	var d = ko.unwrap(date) || "";
	if (!d)
		return "";

	var jsd = new Date(d);

	// проверить на Invalid date
	if (isNaN(jsd.getDate()))
		return ".";

	return app.Pad(jsd.getDate(), 2) + "-" + app.Pad((jsd.getMonth() + 1), 2) + "-" + jsd.getFullYear() + (withTime ? " " + app.Pad(jsd.getHours(), 2) + ":" + app.Pad(jsd.getMinutes(), 2) : "");
};

app.FormatText = function (text) {
	var html = ko.unwrap(text) || "";
	return mmd(html);
};

app.Display = function (id, dictionary, n) {
	n = typeof n !== 'undefined' ? n : 1;
	return dictionary[id][(n % 10 == 1 && n % 100 != 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2)];
};

app.ParseSubstitute = function (data) {
	var dict = {};
	for (var id in data)
		dict[id] = data[id].split("|");

	return dict;
};

app.Pad = function (n, width, z) {
	z = z || '0';
	n = n + '';
	return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};

app.Show = function (selector) {
	document.querySelector(selector).style.display = "";
};

app.Hide = function (selector) {
	document.querySelector(selector).style.display = "none";
};

// validation 0.5 /////////////////////////////////////////////////////////////////////////////////////////////////////////

app.Validation = app.Validation || {};

app.Validation.Validate = function (model, fieldName) {
	var result = "";
	var isValid = true;
	model.Validation.every(function (item) {
		if (fieldName && item.Name !== fieldName)
			return true;

		var fieldValid = item.Rules.every(function (rule) {
			result = rule.Validate();
			if (result)
				return false;

			return true;
		});

		app.Validation.Hilite(model, item.Name, !fieldValid, result);
		isValid = isValid && fieldValid;

		return fieldValid || model.ValidateAll;
	});

	return isValid;
};

app.Validation.DontValidateField = function (model, fieldName) {
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

app.Validation.ValidateField = function (model, fieldName, field, rule) {
	model.Validation = model.Validation || [];
	model.ValidateAll = model.ValidateAll || false;

	rule.Field = field;
	var vf = null;
	model.Validation.forEach(function (item) { if (item.Name == fieldName) vf = item });

	if (vf == null) {
		vf = { Name: fieldName, Var: field, Rules: [] };
		model.Validation.push(vf);
		field.subscribe(function () { app.Validation.Validate(model, fieldName) });
	}

	vf.Rules.push(rule);
};

app.Validation.Hilite = function (model, field, hasError, message) {
	var container = document.querySelector("[data-valmsg-for=" + field + "]");	// container for error text
	var ctrl = document.querySelector("[name=" + field + "]");

	if (container) {
		container.innerHTML = "";
		if (hasError)
			container.appendChild(message);
	}
	else if (ctrl) {
		var erel = ctrl.querySelector(".field-validation-error");
		if (erel)
			erel.remove();

		if (hasError)
			ctrl.setAttribute("title", message);
	}
	else
		throw "Не найден контейнер для результатов валидации";

	if (hasError)
		ctrl.classList.add("invalid");
	else
		ctrl.classList.remove("invalid");
};

app.Validation.HiliteNone = function () {
	document.querySelectorAll("[data-valmsg-for]").forEach(el => el.empty());
	document.querySelectorAll("[generated]").forEach(el => el.remove());
};

app.Validation.RequiredRule = function (message) {
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

app.Validation.LengthRule = function (maxLength, message) {
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

app.Validation.FormatRule = function (regex, message) {
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


app.ConfirmModal = {
	ContainerId: "",
	CurrentItem: ko.observable(),
	Show: function (containerId, item) {
		if (containerId)
			app.ConfirmModal.ContainerId = containerId;

		if (item)
			app.ConfirmModal.CurrentItem(item);

		ko.applyBindings(app.ConfirmModal, document.getElementById(app.ConfirmModal.ContainerId));
		document.querySelector("main").style.display = "none";
		document.getElementById(app.ConfirmModal.ContainerId).style.display = "";
	},
	Hide: function () {
		document.getElementById(app.ConfirmModal.ContainerId).style.display = "none";
		document.querySelector("main").style.display = "";
		ko.cleanNode(document.getElementById(app.ConfirmModal.ContainerId));
	},
	Reset: function (self) {
		self.CurrentItem(null);
		self.OnClosed = null;
		self.OnDone = null;
	},
	OnClosed: null,
	OnDone: null,
	Close: function (self, e) {
		self.Hide();
		if (self.OnClosed != null)
			self.OnClosed(self);

		self.Reset(self);
	},
	Done: function (self, e) {
		self.Hide();
		if (self.OnDone != null)
			self.OnDone(self);

		self.Reset(self);
	}
};

// Markup

function mmd(src) {
	var h = '';

	function escape(t) {
		return new Option(t).innerHTML;
	}
	function inlineEscape(s) {
		return escape(s)
			.replace(/!\[([^\]]*)]\(([^(]+)\)/g, '<img alt="$1" src="$2">')
			.replace(/\[([^\]]+)]\(([^(]+)\)/g, '$1'.link('$2'))
			.replace(/`([^`]+)`/g, '<code>$1</code>')
			.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
			.replace(/\*([^*]+)\*/g, '<em>$1</em>');
	}

	src
		.replace(/^\s+|\r|\s+$/g, '')
		.replace(/\t/g, '    ')
		.split(/\n+/)
		.forEach(function (b, f, R) {
			f = b[0];
			R =
				{
					'*': [/\n\* /, '<ul><li>', '</li></ul>'],
					'1': [/\n[1-9]\d*\.? /, '<ol><li>', '</li></ol>'],
					' ': [/\n    /, '<pre><code>', '</pre></code>', '\n'],
					'>': [/\n> /, '<blockquote>', '</blockquote>', '\n']
				}[f];
			h +=
				R ? R[1] + ('\n' + b)
					.split(R[0])
					.slice(1)
					.map(R[3] ? escape : inlineEscape)
					.join(R[3] || '</li>\n<li>') + R[2] :
					f == '#' ? '<h' + (f = b.indexOf(' ')) + '>' + inlineEscape(b.slice(f + 1)) + '</h' + f + '>' :
						f == '<' ? b :
							'<p>' + inlineEscape(b) + '</p>';
		});
	return h;
};

ko.bindingHandlers.allowBindings = {
	init: function (elem, valueAccessor) {
		// Let bindings proceed as normal *only if* my value is false
		var shouldAllowBindings = ko.unwrap(valueAccessor());
		return { controlsDescendantBindings: !shouldAllowBindings };
	}
};

test = {
	state: {
		name: "",
		step: 0,
		testing: false
	},
	SaveState: function () {
		localStorage.setItem("test.state", JSON.stringify(test.state));
	},
	RestoreState: function () {
		test.state = JSON.parse(localStorage.getItem("test.state") || JSON.stringify(test.state));
	},
	Init: function () {
		test.RestoreState();
		if (test.state.testing)
			test.Run();
	},
	Reset: function () {
		test.state.step = 0;
		test.state.testing = false;
		test.SaveState();
	},
	Fail: function () {
		var message = "Test failed at step: " + JSON.stringify(test.scenarios[test.state.name][test.state.step]);
		console.log(message);
		test.Reset();
	},
	Run: function (name) {
		test.state.name = name || test.state.name;
		test.state.testing = true;

		console.log("running test step " + test.state.step);
		var scenario = test.scenarios[test.state.name];
		if (scenario.length == test.state.step) {
			test.Reset();
			console.log("Finished without errors");
		}
		else {
			var currentStep = scenario[test.state.step];
			setTimeout(test.processStep(currentStep), 1);
		}
	},
	processStep: function (step) {
		//console.log("processing step " + JSON.stringify(step));
		var result = true;
		// check
		if (step.check) {
			switch (step.check) {
				case "location":
					if (window.location.pathname.toUpperCase() !== step.equals.toUpperCase())
						result = false;

					break;

				case "inputText":
					var element = document.querySelector(step.element);
					if (!element)
						result = false;
					else
						result = (element.value == step.text);

					break;

				case "visible":
					var element = document.querySelector(step.element);
					if (!element)
						result = false;
					else
						result = (element.style.display != "none");

					break;
			}
		}

		// set
		if (step.set) {
			var element = document.querySelector(step.set);
			if (!element)
				result = false;
			else {
				if (step.text) {
					element.value = step.text;
					element.dispatchEvent(new Event('change', { 'bubbles': true }));
				}
			}
		}

		// click
		if (step.click) {
			var element = document.querySelector(step.click);
			if (!element)
				result = false;
			else
				element.click();
		}

		// goto
		if (step.goto) {
			//test.state.step++;
			//test.SaveState();
			window.location = step.goto;
		}

		// pause
		if (step.pause) {
			if (step.wait > 100)
				result = false;
		}

		if (result) {
			test.state.step++;
			test.SaveState();
			test.Run();
		}
		else {
			if ((step.wait || 0) > 100) {
				step.wait -= 100;
				setTimeout(function () { test.processStep(step) }, 100);
			}
			else
				test.Fail();
		}
	}
};

test.scenarios =
	{
		"login": [
			{ check: "location", equals: "/Login.html" },
			{ set: "[type='text']", text: "qq@qq.qq" },
			{ set: "[type='password']", text: "qq" },
			{ click: "button" },
			{ check: "location", equals: "/AccountSelect.html", wait: 2000 }
		],
		"login-accountselect": [
			{ check: "location", equals: "/AccountSelect.html" },
			{ click: "li" },
			{ click: "button" },
			{ check: "location", equals: "/Index.html", wait: 2000 }
		],
		"create-candidate": [
			{ goto: "/Candidate.html?create" },
			{ check: "location", equals: "/Candidate.html", wait: 2000 },
			{ set: "[name='Name']", text: "Тестовый кандидат", wait: 1000 },
			{ set: "[name='FirstName']", text: "Иван" },
			{ set: "[name='FamilyName']", text: "Задорнов" },
			{ set: "[name='PatronymicName']", text: "Петрович" },
			//{ pause: "посмотреть на заполнение", wait: 1000 },
			{ click: "button" },
			{ check: "visible", element: "button.danger", wait: 2000 },
			{ check: "inputText", element: "[name='Name']", text: "Тестовый кандидат", wait: 1000 }
		],
		"delete-candidate": [
			{ check: "location", equals: "/Candidate.html" },
			{ check: "visible", element: "button.danger", wait: 1000 },
			{ click: "button.danger" },
			{ pause: "подождать модало", wait: 512 },
			{ click: ".modalo button.danger" },
			{ check: "location", equals: "/Index.html", wait: 2000 }
		],
		"create-request": [
			{ goto: "/Request.html?create" },
			{ check: "location", equals: "/Request.html", wait: 2000 },
			{ set: "[name='Name']", text: "Программист .net", wait: 1000 },
			{ set: "[name='Contacts']", text: "Иван Иванович, +792645654654" },
			{ set: "[name='Text']", text: "Нужен программист для программирования. Язык C#. Нужен программист для программирования. \n Нужен программист для программирования. Язык C#. \n Нужен программист для программирования. Очень." },
			{ click: "button" },
			{ check: "visible", element: "button.danger", wait: 2000 },
			{ check: "inputText", element: "[name='Name']", text: "Программист .net", wait: 1000 }
		],
		"delete-request": [
			{ check: "location", equals: "/Request.html" },
			{ check: "visible", element: "button.danger", wait: 1000 },
			{ click: "button.danger" },
			{ pause: "подождать модало", wait: 512 },
			{ click: ".modalo button.danger" },
			{ check: "location", equals: "/Index.html", wait: 2000 }
		],
		"logout": [
			{ click: "#logout" },
			{ check: "location", equals: "/Login.html", wait: 2000 }
		],
		"full": [
			{ check: "location", equals: "/Login.html" },
			{ set: "[type='text']", text: "qq@qq.qq" },
			{ set: "[type='password']", text: "qq" },
			{ click: "button" },
			{ check: "location", equals: "/AccountSelect.html", wait: 2000 },
			{ click: "li", wait: 2000 },
			{ click: "button" },
			{ check: "location", equals: "/Index.html", wait: 2000 },
			{ goto: "/Candidate.html?create" },
			{ check: "location", equals: "/Candidate.html", wait: 2000 },
			{ set: "[name='Name']", text: "Тестовый кандидат", wait: 1000 },
			{ set: "[name='FirstName']", text: "Иван" },
			{ set: "[name='FamilyName']", text: "Задорнов" },
			{ set: "[name='PatronymicName']", text: "Петрович" },
			{ click: "button" },
			{ check: "visible", element: "button.danger", wait: 2000 },
			{ check: "inputText", element: "[name='Name']", text: "Тестовый кандидат", wait: 1000 },
			{ click: "button.danger" },
			{ check: "visible", element: ".modalo button.danger", wait: 2000 },
			{ click: ".modalo button.danger" },
			{ check: "location", equals: "/Index.html", wait: 2000 },
			{ click: "#logout" },
			{ check: "location", equals: "/Login.html", wait: 2000 }
		]
	};