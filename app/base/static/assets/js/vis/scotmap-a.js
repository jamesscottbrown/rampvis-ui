const TABLE = 'cumulative';
// const TABLE = 'icupatients';
// const TABLE = 'hospconfirmed';
// const TABLE = 'hospsuspected';


const DATE_FORMAT_INPUT = 'DD/MM/YYYY'
const DATE_FORMAT_OUTPUT = 'DD-MMM-YYYY'
// TABLE COLS
var DATE = 0
var TOTAL = 15

// REGIONS
var regions = ['nhs_ayrshire_arran',
	'nhs_borders',
	'nhs_dumfries_galloway',
	'nhs_fife',
	'nhs_forth_valley',
	'nhs_grampian',
	'nhs_greater_glasgow_clyde',
	'nhs_highland',
	'nhs_lanarkshire',
	'nhs_lothian',
	'nhs_orkney',
	'nhs_shetland',
	'nhs_tayside',
	'nhs_western_isles_scotland']

var regionNames = {
	'nhs_ayrshire_arran': "NHS Ayrshire & Arran",
	'nhs_borders': "NHS Borders",
	'nhs_dumfries_galloway': "NHS Dumfries & Galloway",
	'nhs_fife': "NHS Fife",
	'nhs_forth_valley': "NHS Forth Valley",
	'nhs_grampian': "NHS Grampian",
	'nhs_greater_glasgow_clyde': "NHS Greater Glasgow & Clyde",
	'nhs_highland': "NHS Highland",
	'nhs_lanarkshire': "NHS Lanarkshire",
	'nhs_lothian': "NHS Lothian",
	'nhs_orkney': "NHS Orkney",
	'nhs_shetland': "NHS Shetland",
	'nhs_tayside': "NHS Tayside",
	'nhs_western_isles_scotland': "NHS Western Isles"
}

populationPerRegion = {
	'nhs_ayrshire_arran': 369360,
	'nhs_borders': 115510,
	'nhs_dumfries_galloway': 148860,
	'nhs_fife': 373550,
	'nhs_forth_valley': 306640,
	'nhs_grampian': 585700,
	'nhs_greater_glasgow_clyde': 1183120,
	'nhs_highland': 321700,
	'nhs_lanarkshire': 661900,
	'nhs_lothian': 907580,
	'nhs_orkney': 22270,
	'nhs_shetland': 22920,
	'nhs_tayside': 417470,
	'nhs_western_isles_scotland': 26720
}

var dates = [];
var totals = [];


var windowWidth = getWidth();
var windowHeight = getHeight();
var WIDTH_SVG = windowWidth - 20;
var HEIGHT_SVG = windowHeight + 100;
const WIDTH_CHART_BOX = (windowWidth-430) / 3;
const HEIGHT_CHART_BOX = (windowHeight-300) / 5;
const PADDING_CHART_LEFT = 0;
const PADDING_CHART_TOP = 15;
const PADDING_CHART_BOTTOM = 0;
const PADDING_CHART_RIGHT = 0;
const WIDTH_CHART = WIDTH_CHART_BOX - PADDING_CHART_RIGHT - PADDING_CHART_LEFT;
const HEIGHT_CHART = HEIGHT_CHART_BOX - PADDING_CHART_TOP - PADDING_CHART_BOTTOM;

// layout
const WIDTH_LAYOUT = 3;
const WIDTH_HEIGHT = 7;
const GAP_LAYOUT = 40;

layout_1 = {
	'NHS Ayrshire & Arran': [5,1],
	'NHS Borders': [6,3],
	'NHS Dumfries & Galloway': [6,1],
	'NHS Fife': [4,2],
	'NHS Forth Valley': [4,1],
	'NHS Grampian': [3,2],
	'NHS Greater Glasgow & Clyde': [5,2],
	'NHS Highland': [2,1],
	'NHS Lanarkshire': [6,2],
	'NHS Lothian': [5,3],
	'NHS Orkney': [1,2],
	'NHS Shetland': [0,2],
	'NHS Tayside': [3,1],
	'NHS Western Isles': [2,0]
}
layout_2 = {
	'NHS Ayrshire & Arran': [3,0],
	'NHS Borders': [4,2],
	'NHS Dumfries & Galloway': [4,0],
	'NHS Fife': [2,1],
	'NHS Forth Valley': [2,0],
	'NHS Grampian': [1,2],
	'NHS Greater Glasgow & Clyde': [3,1],
	'NHS Highland': [1,0],
	'NHS Lanarkshire': [4,1],
	'NHS Lothian': [3,2],
	'NHS Orkney': [0,1],
	'NHS Shetland': [0,2],
	'NHS Tayside': [1,1],
	'NHS Western Isles': [0,0]
}

const TICKMARK_GAP_Y = 10

function getLayoutX(regionName){
	return layout_2[cleanRegionName(regionName)][1] * (WIDTH_CHART_BOX + GAP_LAYOUT) + GAP_LAYOUT;
}
function getLayoutY(regionName){
	return layout_2[cleanRegionName(regionName)][0] * (HEIGHT_CHART_BOX + GAP_LAYOUT);
}
function cleanRegionName(regionName){
	var s = regionNames[regionName]
	return s
}

var totalMax = 0
var regionMax = 0
var chartMax =0;

// DATA
var cumulativeCasesByBoard = {}
var dailyCasesByBoard = {}
var cumulativeCasesByBoardPerCapita = {}

const buttons = d3.selectAll('input[name="input-boardData"]');
buttons.on('change', function(d) {
	changeData(this.value)
});


const CHART_BAR = 0
const CHART_LINE = 1
var currentData
var chartType;
function changeData(value){

	if(value === 'culmulativeCases'){
		currentData = cumulativeCasesByBoard;
		chartType = CHART_LINE;
	}
	else if(value === 'newCases'){
		currentData = dailyCasesByBoard
		chartType = CHART_BAR;
	}else if(value === 'cumulativePerCapita'){
		currentData = cumulativeCasesByBoardPerCapita
		chartType = CHART_LINE;
	}

	setData(currentData)
}


// d3.json('http://vis.scrc.uk/api/v1/scotland/' + TABLE).then(function(data)
function ScotmapA(options) {
	let data = options.data;

	// get regions
	var firstRow = data[0];
	for (var key in firstRow){
		if(key != 'date' && key != 'scotland'){
			if(regions.indexOf(key) == -1)
				continue;

			cumulativeCasesByBoard[key] = []
			dailyCasesByBoard[key] = [];
			cumulativeCasesByBoardPerCapita[key] = []
		}
	}

	// parse data
	var row;
	var prevRow;
	for (var i = 0; i < data.length; i++) {
		row = data[i]
		for(var key in row){
			if(key == 'date'){
				dates.push(moment(row[key], DATE_FORMAT_INPUT))
			}else
			if (key == "scotland")
			{
				var val = cleanValue(row[key])
				totals.push(val)
				totalMax = Math.max(totalMax, val)
			}
			else
			{// some nhs board..
				if(regions.indexOf(key) == -1)
					continue;

				var val = cleanValue(row[key])

				// culmulative cases
				cumulativeCasesByBoard[key].push(val)
				var perCapita = val / populationPerRegion[key]
				// console.log(' populationPerRegion[key]',  perCapita)
				perCapita = perCapita.toFixed(5)
				cumulativeCasesByBoardPerCapita[key].push(perCapita)

				regionMax = Math.max(regionMax, val)

				// daily cases
				var diff = 0;
				if(prevRow){
					diff = cleanValue(row[key]) - cleanValue(prevRow[key]);
					diff = Math.max(diff, 0)
				}
				dailyCasesByBoard[key].push(diff)
			}
		}
		prevRow = row;
	}

	console.log("Dates =", dates)
	console.log('regions', regions)
	console.log("Total cases =", totals)
	console.log("culmulative by board =", cumulativeCasesByBoard)
	console.log("daily By board =", cumulativeCasesByBoard)
	console.log("---> data parsed")

    let canvas = document.getElementById(options.chartElement);
	initCharts(canvas);

	changeData('culmulativeCases')
}


var chart, chartBox
var bar, line
var valuePoint
var barHeight = d3.scaleLinear()
	.range([0, HEIGHT_CHART]);
var barOpacity = d3.scaleLinear()
	.range([.3, 1]);
var barXPos = d3.scaleLinear()
	.range([0, WIDTH_CHART]);

var xStep = WIDTH_CHART / dates.length;
var svg;

var labelBackground
var label


var valueColorScale = d3.scaleSequential(['green', 'red'])

function initCharts(canvas){

	// Create bar chart for each region
	svg = d3.select(canvas).append('svg')
	    .attr("width", WIDTH_SVG)
	    .attr("height", HEIGHT_SVG);

	chartBox = svg.selectAll('g')
	  	.data(regions)
	  	.enter().append('g')
	  		.attr('class', 'chartBox')
	    	.attr("transform", function(d, i) {
	    		return "translate("+getLayoutX(d)+"," + getLayoutY(d) + ")";
	    	})
	    	.attr('height', HEIGHT_CHART_BOX)
	    	.attr('width', WIDTH_CHART_BOX)

	// chart background and frame
	chartBox.append('rect')
		.attr('width', WIDTH_CHART_BOX)
		.attr('height', HEIGHT_CHART_BOX)
		.attr('class', 'chartBoxBackground')

	chart = chartBox
	    .append('g')
	    	.attr("transform", function() {
	    		return "translate(" + PADDING_CHART_LEFT +"," + PADDING_CHART_TOP + ")";
	    	})
	    	.attr('height', HEIGHT_CHART)
	    	.attr('width', WIDTH_CHART)

	// chart background and frame
	chart.append('rect')
		.attr('width', WIDTH_CHART)
		.attr('height', HEIGHT_CHART)
		.attr('class', 'chartBackground')

    // draw region labels
	chartBox.append('text')
		.attr('class', 'regionLabel')
		.attr('x', 0)
		.attr('y', 10)
		.text(function(d,i){
			return cleanRegionName(d);
		})
		.call(wrap, WIDTH_CHART);

	chart.append('text')
		.attr('class', 'regionCurrentValue')
		.attr('x', WIDTH_CHART_BOX)
		.attr('y', -5)
		.style('text-anchor', 'end')

	// Tooltip on mouse over
	labelBackground = svg.append('rect')
		.attr('visibility', 'hidden')
		.attr('class', 'valueLabelBackground')
		.attr('height', 16)
	label = svg.append("text")
		.attr('visibility', 'hidden')
		.attr('class', 'valueLabel')


	chart.each(createXLabels, this)
}

function mouseOverBar(d,i){

	d3.selectAll('.bar').classed('mouseover', false)
	bar.classed('mouseover', function(d,j){
			return i == j;
		})
	var region = d3.select(this.parentNode).datum().key;
	var text = dates[i].format(DATE_FORMAT_OUTPUT) + ": " + d;

	label
		.text(text)
		.attr('visibility', 'visible')
		.attr('x', getLayoutX(region) + barXPos(i))
		.attr('y', getLayoutY(region) + HEIGHT_CHART - barHeight(d) + 13)
	labelBackground
		.attr('visibility', 'visible')
		.attr('x', getLayoutX(region) + barXPos(i) - text.length * 7 )
		.attr('y', getLayoutY(region) + HEIGHT_CHART- barHeight(d))
		.attr('width', text.length * 7)
}
function mouseOverPath(d,i){

	valuePoint
		.classed('mouseover', function(d,j){
			return i == j;
		})
		.attr('r', function(d,j){
			if(i == j)
				return xStep
			return xStep / 2
		})
	var region = d3.select(this.parentNode).datum().key;
	var text = dates[i].format(DATE_FORMAT_OUTPUT) + ": " + d;

	label
		.text(text)
		.attr('visibility', 'visible')
		.attr('x', getLayoutX(region) + barXPos(i))
		.attr('y', getLayoutY(region) + HEIGHT_CHART - barHeight(d) + 10)
	labelBackground
		.attr('visibility', 'visible')
		.attr('x', getLayoutX(region) + barXPos(i) - text.length * 7)
		.attr('y', getLayoutY(region) + HEIGHT_CHART- barHeight(d) - 3)
		.attr('width', text.length * 7)
}

function mouseOut(d,i){
	d3.select(this).classed('mouseover', false)
	labelBackground.attr('visibility', 'hidden')
	label.attr('visibility', 'hidden')
}


function createXLabels(d){

	var chart = d3.select(this);
	// console.log('dates.length-1', dates.length-1)
	// // one per week
	// var start = dates[0]
	// var end = dates[dates.length-1]
	// var numWeeks = end.diff(start, 'weeks')
	// console.log('num weeks', numWeeks)
	// timeTickMark.domain([])

	chart.selectAll('line')
		.data(dates)
		.enter()
		.append('line')
			.attr('x1', function(d,i){
				return i * WIDTH_CHART / dates.length + 4;
			})
			.attr('y1', HEIGHT_CHART)
			.attr('x2', function(d,i){
				return i * WIDTH_CHART / dates.length + 4;
			})
			.attr('y2', HEIGHT_CHART + 4)
			.attr('class', 'tickmark')
			.attr('visibility', function(d){
				if(d.date() == 1)
					return 'visible'
				return 'hidden';
			})

	chart.selectAll('.timeTickmarkLabel')
		.data(dates)
		.enter()
		.append('text')
			.text(function(d){
				return d.format('MMM')
			})
			.attr('class', 'timeTickmarkLabel')
			.attr('x', function(d,i){
				return i * WIDTH_CHART / dates.length + 3;
			})
			.attr('visibility', function(d){
				if(d.date() == 1)
					return 'visible'
				return 'hidden';
			})
			.attr('y', HEIGHT_CHART + 15)
}

function createYLabels(d){
	var chart = d3.select(this);

	chart.selectAll('.axisLabel').remove()

	chart.append('line')
		.attr('x1', -5)
		.attr('y1', 0)
		.attr('x2', 0)
		.attr('y2', 0)
		.attr('class', 'tickmark')

	chart.append('text')
		.attr('x', -7)
		.attr('y', 3)
		.text(chartMax)
		.attr('class', 'axisLabel')
		.style('text-anchor', 'end')

	chart.append('line')
		.attr('x1', -5)
		.attr('y1', HEIGHT_CHART)
		.attr('x2', 0)
		.attr('y2', HEIGHT_CHART)
		.attr('class', 'tickmark')

	chart.append('text')
		.attr('x', -7)
		.attr('y', HEIGHT_CHART+3)
		.text(0)
		.attr('class', 'axisLabel')
		.style('text-anchor', 'end')
}

function setData(values){

	// set new data for every chart and every bar
	console.log('SET DATA', values)
	// chartBox.data(d3.entries(values))
	chart.data(d3.entries(values))

	var max = 0
	for (var r in regions) {
		for (var j = 0; j < values[regions[r]].length; j++) {
			max = Math.max(max, values[regions[r]][j])
		}
	}
	console.log('max', max)
	if(max > 1){
		var decimals = max.toString().length;
		var offset = Math.pow(10, decimals-1)
		var v =max + offset;
		v = v / offset
		v = Math.trunc(v);
		chartMax = v * offset
	}else{
		var decimals = -Math.floor( Math.log(max) / Math.log(10) + 1);
		max *= Math.pow(10, decimals+1)
		var v = max + .5;
		v = Math.trunc(v);
		chartMax = v / Math.pow(10, decimals+1)
	}


	barHeight.domain([0, chartMax])
	barOpacity.domain([0, chartMax])
	barXPos.domain([0, dates.length])
	valueColorScale.domain([0,chartMax])


	xStep = WIDTH_CHART / dates.length

	// draw bars
	if(chartType == CHART_BAR){

		// create bar chart version
		bar = chart.selectAll('.bar')
			.data(function(d){
				console.log('d on bars', d.value)
				return d.value;
			})
			.enter().append('rect')
				.attr('class','bar')
				.classed('tickmark', function(d,i){
					return dates[i].date() == 1;
				})
				.on('mouseover', mouseOverBar)
				.on('mouseout', mouseOut)
				.attr('class','bar')
				.classed('tickmark', function(d,i){
					return dates[i].date() == 1;
				})
				.attr('x', function(d,i){
					return barXPos(i);
				})
				.attr('height',function(d,i){
					return barHeight(d);
				})
				.attr('width', xStep)
				.attr('y', function(d,i){
					return HEIGHT_CHART - barHeight(d);
				})
				.style('opacity', function(d,i){
					return barOpacity(d);
				})
	}
	chart.selectAll('.bar').style('visibility', function(){
		if(chartType == CHART_BAR)
			return 'visible'
		return 'hidden'
	})

	// create line chart version
	if(chartType == CHART_LINE)
	{
		valuePoint = chart.selectAll('.valuePoint')
			.remove();

		valuePoint = chart.selectAll('.valuePoint')
			.data(function(d){
				return d.value;
			})
			.enter().append('circle')
				.attr('class','valuePoint')
				.on('mouseover', mouseOverPath)
				.on('mouseout', mouseOut)
				.attr('class','valuePoint')
				.attr('cx', function(d,i){
					return barXPos(i);
				})
				.attr('r', xStep/2)
				.attr('cy', function(d,i){
					return HEIGHT_CHART - barHeight(d);
				})
				.style('fill', function(d,i){
					return valueColorScale(d);
				})
				// .classed('zerovalue', true)

		var valueline = d3.line()
		    .x(function(d,i) {  return barXPos(i); })
		    .y(function(d,i) {  return HEIGHT_CHART - barHeight(d); });

		chart.selectAll('.valueline')
			.remove()

		line = chart.append('path')
			.datum(function(d){
				return d.value;})
	        .attr("d", valueline)
	        .attr('class', 'valueline')

	}
	chart.selectAll('.valueline')
		.style('visibility', function(){
			if(chartType == CHART_LINE)
				return 'visible'
			return 'hidden'
		})

	chart.selectAll('.valuePoint')
		.style('visibility', function(){
			if(chartType == CHART_LINE)
				return 'visible'
			return 'hidden'
		})


	// CHART LABELS
	chart.each(createYLabels, this)

	// console.log(chart.selectAll('text.regionCurrentValue'))
	chart.select('.regionCurrentValue')
		.text(function(d,i){
			return 'latest: ' + d.value[d.value.length-1];
		})
		.classed('zerovalue', function(d,i){
			return d.value[d.value.length-1] == 0
		})
}

function cleanValue(string){
	if(string == '*') return 0;
	if(string == 'N/A') return 0;
	else{
		return parseInt(string.replace(',',''));
	}
}

function wrap(text, width) {
	text.each(function() {
	    var text = d3.select(this),
	        words = text.text().split(/\s+/).reverse(),
	        word,
	        line = [],
	        lineNumber = 0,
	        lineHeight = 1.1, // ems
	        y = text.attr("y"),
	        dy = 0, // dunno why...
	        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");

	    while (word = words.pop()) {
			line.push(word);
			tspan.text(line.join(" "));
			//if (tspan.node().getComputedTextLength() > width) {
			line.pop();
			tspan.text(line.join(" "));
			line = [word];
			tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
		//}
    }
  });
}



function getWidth() {
  return Math.max(
    document.body.scrollWidth,
    document.documentElement.scrollWidth,
    document.body.offsetWidth,
    document.documentElement.offsetWidth,
    document.documentElement.clientWidth
  );
}

function getHeight() {
  return Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight,
    document.documentElement.clientHeight
  );
}



