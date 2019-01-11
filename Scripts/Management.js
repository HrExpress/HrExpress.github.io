// management page
var PageViewModel = function () {
	var model = this;

	// поля ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	model.Context = ko.observable("");

	// функции ////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	model.Init = function () {
		$.ajax({
			url: app.config.apiRoot + "Management/GetMetrix",
			type: "POST",
			dataType: "json",
			contentType: "application/json; charset=utf-8",
			success: function (response) {
				new BarChart({ targetId: "chart1", width: 1100, height: 128, data: response.Data.Calls });
				new BarChart({ targetId: "chart2", width: 1100, height: 128, data: response.Data.Errors403 });
				new BarChart({ targetId: "chart3", width: 1100, height: 128, data: response.Data.Errors500 });
				new BarChart({ targetId: "chart4", width: 1100, height: 128, data: response.Data.AverageResponseTime });
			},
			error: function (error) { alert(error.responseJSON.Message); }
		});
	};
}
