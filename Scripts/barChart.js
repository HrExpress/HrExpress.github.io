// Simpl-barChart by Max
// v1.1.0

"use strict";

function BarChart(options) {
	var chart = this;
	chart.id = options.targetId;
	chart.data = options.data;
	chart.width = options.width || 500;
	chart.height = options.height || 500;
	chart.axisColor = options.axisColor || "#666";
	chart.fontColor = options.fontColor || "#666";
	chart.guidelineColor = options.guidelineColor || "#ddd";
	chart.barColor = options.barColor || "#939";

	chart.fontFamily = "sans";
	chart.fontStyle = "normal";
	chart.fontWeight = "300";

	chart.lastBarSelected = null;

	chart.initChart();
	chart.drawChart();
}

BarChart.prototype.initChart = function () {
	var chart = this;
	chart.vMargin = Math.ceil(chart.width / 200);
	chart.hMargin = Math.ceil(chart.height / 100);
	chart.fontSize = Math.ceil(chart.height * 0.05); // 5%

	chart.itemsNum = chart.data.length;
	chart.maxValue = Math.max.apply(null, chart.data.map(function (item) { return item.value }));
	chart.vLabelSize = chart.fontSize * ((chart.maxValue > 9999) ? 5 : (chart.maxValue > 999) ? 4 : (chart.maxValue > 99) ? 3 : 2)
	chart.vAxisSize = chart.height - chart.hMargin * 3 - chart.fontSize;
	chart.hAxisSize = chart.width - chart.hMargin * 3 - chart.vLabelSize;

	chart.Ox = chart.vMargin * 2 + chart.vLabelSize;
	chart.Oy = chart.hMargin + chart.vAxisSize;
	chart.vScaleStep = Math.ceil(chart.maxValue / 10) || 1;
	chart.vScale = (chart.vAxisSize - chart.fontSize) / (chart.vScaleStep * 10);
	var size = Math.floor(chart.hAxisSize / chart.itemsNum);
	chart.barMargin = Math.floor((size * 10) / 100) + 1;
	chart.barSize = size - chart.barMargin;

	chart.createCanvas();
};

BarChart.prototype.drawChart = function () {
	var chart = this;
	chart.drawVerticalLabels();
	chart.drawHorizontalLabels();
	chart.drawHorizontalGuidelines();
	chart.drawBars();
	chart.drawAxis();
};

BarChart.prototype.createCanvas = function () {
	var chart = this;
	var canvas = document.createElement("canvas");
	canvas.id = chart.id + "-" + Math.random();
	canvas.width = chart.width;
	canvas.height = chart.height;

	document.getElementById(chart.id).innerHTML = "";
	document.getElementById(chart.id).appendChild(canvas);

	chart.canvas = canvas;
	chart.context = canvas.getContext("2d");
	canvas.addEventListener('mousemove', function (e) {
		var pos = chart.getMousePos(e);
		var i = chart.detectBar(pos.x);
		if (i !== chart.lastBarSelected) {
			if (chart.lastBarSelected != null) {
				chart.context.clearRect(0, 0, chart.canvas.width, chart.canvas.height);
				chart.drawChart();
			}

			if (i != null)
				chart.hiliteBar(i);

			chart.lastBarSelected = i;
		}
	}, false);
};

BarChart.prototype.getMousePos = function (e) {
	var chart = this;
	var rect = chart.canvas.getBoundingClientRect();
	return {
		x: e.clientX - rect.left,
		y: e.clientY - rect.top
	};
}

BarChart.prototype.drawAxis = function () {
	var chart = this;
	// Vertical
	chart.context.beginPath();
	chart.context.strokeStyle = chart.axisColor;
	chart.context.lineWidth = 1;
	chart.context.moveTo(chart.Ox, chart.hMargin);
	chart.context.lineTo(chart.Ox, chart.Oy);
	chart.context.stroke();
	// Horizontal
	chart.context.beginPath();
	chart.context.moveTo(chart.Ox, chart.Oy);
	chart.context.lineTo(chart.Ox + chart.hAxisSize, chart.Oy);
	chart.context.stroke();
};

BarChart.prototype.drawVerticalLabels = function () {
	var chart = this;
	chart.context.font = chart.fontStyle + " " + chart.fontWeight + " " + chart.fontSize + "px " + chart.fontFamily;
	chart.context.textAlign = "right";
	chart.context.textBaseline = "alphabetic";
	chart.context.fillStyle = chart.fontColor;

	var step = Math.floor((chart.vAxisSize - chart.fontSize) / 10);
	var labelX = chart.vLabelSize;
	var labelText = 0;
	var labelY = chart.Oy;
	for (var i = 0; i <= 10; i++) {
		chart.context.fillText(labelText, labelX, labelY);
		labelText += chart.vScaleStep;
		labelY -= step;
	}
};

BarChart.prototype.drawHorizontalLabels = function () {
	var chart = this;
	chart.context.textAlign = "center";
	chart.context.textBaseline = "top";
	// font & fillStyle already set

	var labelY = chart.Oy + chart.hMargin;
	for (var i = 0; i < chart.itemsNum; i++) {
		var labelX = chart.Ox + (i + 1) * chart.barMargin + i * chart.barSize + chart.barSize / 2;
		chart.context.fillText(chart.data[i].label, labelX, labelY);
	}
};

BarChart.prototype.drawHorizontalGuidelines = function () {
	var chart = this;
	chart.context.strokeStyle = chart.guidelineColor;
	chart.context.lineWidth = 0.5;

	var guidelineStartX = chart.Ox;
	var guidelineEndX = chart.width - chart.vMargin;
	var step = Math.floor((chart.vAxisSize - chart.fontSize) / 10);
	for (var i = 1; i <= 10; i++) {
		var guidelineY = chart.Oy - i * step - 0.5;
		chart.context.beginPath();
		chart.context.moveTo(guidelineStartX, guidelineY);
		chart.context.lineTo(guidelineEndX, guidelineY);
		chart.context.stroke();
	}
};

BarChart.prototype.drawBars = function () {
	var chart = this;
	var barX = chart.Ox + chart.barMargin + 0.5;
	chart.context.fillStyle = chart.barColor;
	chart.context.strokeStyle = chart.barColor;
	for (var i = 0; i < chart.itemsNum; i++) {
		var barHeight = chart.data[i].value * chart.vScale;
		var barY = chart.Oy - barHeight;
		chart.context.beginPath();
		chart.context.rect(barX, barY, chart.barSize, barHeight);
		chart.context.stroke();
		chart.context.fill();
		barX += chart.barMargin + chart.barSize;
	}
};

BarChart.prototype.detectBar = function (x) {
	var chart = this;
	var rem = (x - chart.Ox) % (chart.barMargin + chart.barSize) - chart.barMargin;
	var i = null;
	if (rem > 0)
		i = Math.floor((x - chart.Ox) / (chart.barMargin + chart.barSize));

	return i;
}

BarChart.prototype.hiliteBar = function (i) {
	var chart = this;
	if (chart.data.length <= i)
		return;

	var barX = chart.Ox + 0.5 + chart.barMargin + (chart.barMargin + chart.barSize) * i;
	chart.context.fillStyle = "#000";
	chart.context.strokeStyle = "#000";
	var barHeight = chart.data[i].value * chart.vScale;
	var barY = chart.Oy - barHeight;

	chart.context.beginPath();
	chart.context.rect(barX, barY, chart.barSize, barHeight);
	chart.context.stroke();
	chart.context.fill();

	var labelY = chart.Oy + chart.hMargin;
	var labelX = chart.Ox + (i + 1) * chart.barMargin + i * chart.barSize + chart.barSize / 2;
	chart.context.fillText(chart.data[i].label, labelX, labelY);
	chart.context.fillText(chart.data[i].value, labelX, barY - chart.fontSize);
};
