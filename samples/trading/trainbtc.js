
var path = require('path');
var fs = require('fs');

var simplega = require('../..');
var trading = require('./trading');

function loadValues(year) {
	var values = [];
	var l = year.length;
	
	var data = require('./btcdata/bitcoin.json');

	for (var k in data.bpi) {
		if (k.substring(0,l) != year)
			continue;
		
		values.push(data.bpi[k]);
	}
	
	return values;
}

function runGenerations(popsize, series, ngenerations) {
    var population = trading.population(popsize, series);
    var mutators = [ trading.mutator() ];
    var engine = new simplega.Engine();
    engine.setPopulation(population);
    engine.setMutators(mutators);

    for (var k = 0; k < ngenerations; k++) {
        var newpopulation = engine.nextPopulation();
        engine.setPopulation(newpopulation);
    }
    
    return newpopulation;
}

var series = [];
var testseries = [];

var intestseries = false;

values = [];
testvalues = [];

for (var n = 2; n < process.argv.length; n++) {
    if (process.argv[n] === '--') {
        intestseries = true;
        continue;
    }
    
    var newvalues = loadValues(process.argv[n]);
    
    if (newvalues)
        if (intestseries)
            testvalues = testvalues.concat(newvalues);         
        else
            values = values.concat(newvalues);
}

testseries.push({ amount: 1000, values: testvalues });         
series.push({ amount: 1000, values: values });         

var population = runGenerations(500, series, 500);

var best = simplega.getBestGenotype(population);
    
console.log('best trader');
console.dir(best);
console.log('best value', best.evaluate());
console.log('training market value', calculateMarketValue(series[0]));
console.log('training series length', best.series[0].values.length, series[0].values.length);

best.series = testseries;
console.log('test value', best.evaluate());
console.log('test market value', calculateMarketValue(testseries[0]));
console.log('test series length', testseries[0].values.length);
    
function calculateMarketValue(serie) {
	return serie.amount * serie.values[serie.values.length - 1] / serie.values[0];
}

