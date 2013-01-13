// by Ned Wright
// 25 Jul 1999
// Copyright Edward L. Wright, all rights reserved.
// define global variables and functions
//
// Adapted/modernized by Stuart Lowe @ dotAstronomy 2012, Heidelberg


// Overall object that deals with the Cosmology Calculator
function CosmoCalc(inp){

	// An instance of a Cosmology
	this.cosmos = new Array();
	this.cosmos[0] = new Cosmos();

	// The DOM selector where the output will be
	if(inp){
	
		this.el = $(inp);
		
	}else{
	
		// The output container doesn't exist so make it
		$(document).append('<div id="cosmocalc_output"><\/div>');

		this.el = $("#cosmocalc_output");

	}

	// The output container doesn't exist so make it
	$('body').append('<textarea id="cosmocalc_copy">Hello<\/textarea>');
	this.clipboard = $('#cosmocalc_copy');

	// We have to keep the clipboard visible to allow it to select all the text and for copy to work
	this.clipboard.css({'width':'1px','height':'1px','position':'absolute','top':0,'left':-100});

//	$('#controls').html('<div id="copy"><img src="clipboard.png" /></div>');

}

// An instance of a cosmology
function Cosmos(inp){
	this.n = 1000;	// number of points in integrals
	this.nda = 1;	// number of digits in angular size distance
	this.H0 = 71;	// Hubble constant
	this.WM = 0.27;	// Omega(matter)
	this.WV = 0.73;	// Omega(vacuum) or lambda
	this.WR = 0;	// Omega(radiation)
	this.WK = 0;	// Omega curvaturve = 1-Omega(total)
	this.z = 3.0;	// redshift of the object
	this.h = 0.71	// H0/100
	this.c = 299792.458; // velocity of light in km/sec
	this.Tyr = 977.8; // coefficent for converting 1/H into Gyr
	this.DTT = 0.5;	// time from z to now in units of 1/H0
	this.DTT_Gyr = 0.0;	// value of DTT in Gyr
	this.age = 0.5;	// age of Universe in units of 1/H0
	this.age_Gyr = 0.0;	// value of age in Gyr
	this.zage = 0.1;	// age of Universe at redshift z in units of 1/H0
	this.zage_Gyr = 0.0;	// value of zage in Gyr
	this.DCMR = 0.0;	// comoving radial distance in units of c/H0
	this.DCMR_Mpc = 0.0;
	this.DCMR_Gyr = 0.0;
	this.DA = 0.0;	// angular size distance
	this.DA_Mpc = 0.0;
	this.DA_Gyr = 0.0;
	this.kpc_DA = 0.0;
	this.DL = 0.0;	// luminosity distance
	this.DL_Mpc = 0.0;
	this.DL_Gyr = 0.0;	// DL in units of billions of light years
	this.V_Gpc = 0.0;
	this.a = 1.0;	// 1/(1+z), the scale factor of the Universe
	this.az = 0.5;	// 1/(1+z(object));
	
	return this;
}

// entry point for the input form to pass values back to this script
Cosmos.prototype.setValues = function(H0,WM,WV,z) {
	this.H0 = H0;
	this.h = this.H0/100;
	this.WM = WM;
	this.WV = WV;
	this.z = z;
	this.WR = 4.165E-5/(this.h*this.h);	// includes 3 massless neutrino species, T0 = 2.72528
	this.WK = 1-this.WM-this.WR-this.WV;

}

Cosmos.prototype.stround = function(x,m) {
	// rounds to m digits and makes a string
	var tenn = 1;
	var i = 0;
	for (i=0; i != m; i++) tenn = tenn*10;

	var y = Math.round(Math.abs(x)*tenn);
	var str = " "+y;
	while (m > str.length-2) str = " 0" + str.substring(1,str.length);
	str = str.substring(0,str.length-m)+"."+
	str.substring(str.length-m,str.length);
	if (x < 0) str = " -"+str.substring(1,str.length);
	return str;
}

// tangential comoving distance
Cosmos.prototype.DCMT = function() {
	var ratio = 1.00;
	var x;
	var y;
	x = Math.sqrt(Math.abs(this.WK))*this.DCMR;
	if (x > 0.1) {
		ratio =  (this.WK > 0) ? 0.5*(Math.exp(x)-Math.exp(-x))/x : Math.sin(x)/x;
		y = ratio*this.DCMR;
		return y;
	};
	y = x*x;
	// statement below fixed 13-Aug-03 to correct sign error in expansion
	if (this.WK < 0) y = -y;
	ratio = 1 + y/6 + y*y/120;

	y= ratio*this.DCMR;
	return y;
}

// comoving volume computation
Cosmos.prototype.VCM = function() {
	var ratio = 1.00;
	var x;
	var y;
	x = Math.sqrt(Math.abs(this.WK))*this.DCMR;
	if (x > 0.1) {
		ratio =  (this.WK > 0) ? (0.125*(Math.exp(2*x)-Math.exp(-2*x))-x/2)/(x*x*x/3) :
		(x/2 - Math.sin(2*x)/4)/(x*x*x/3) ;
		y = ratio*this.DCMR*this.DCMR*this.DCMR/3;
		return y;
	};
	y = x*x;
	// statement below fixed 13-Aug-03 to correct sign error in expansion
	if (this.WK < 0) y = -y;
	ratio = 1 + y/5 + (2/105)*y*y;
	y= ratio*this.DCMR*this.DCMR*this.DCMR/3;
	return y;
}

Cosmos.prototype.compute = function(){
	this.h = this.H0/100;
	this.WR = 4.165E-5/(this.h*this.h);	// includes 3 massless neutrino species, T0 = 2.72528
	this.WK = 1-this.WM-this.WR-this.WV;
	this.az = 1.0/(1+1.0*this.z);
	this.age = 0;
	for (i = 0; i != this.n; i++) {
		this.a = this.az*(i+0.5)/this.n;
		this.adot = Math.sqrt(this.WK+(this.WM/this.a)+(this.WR/(this.a*this.a))+(this.WV*this.a*this.a));
		this.age = this.age + 1/this.adot;
	};
	this.zage = this.az*this.age/this.n;

	// correction for annihilations of particles not present now like e+/e-
	// added 13-Aug-03 based on T_vs_t.f
	var lpz = Math.log((1+1.0*this.z))/Math.log(10.0);
	var dzage = 0;
	if (lpz >  7.500) dzage = 0.002 * (lpz -  7.500);
	if (lpz >  8.000) dzage = 0.014 * (lpz -  8.000) +  0.001;
	if (lpz >  8.500) dzage = 0.040 * (lpz -  8.500) +  0.008;
	if (lpz >  9.000) dzage = 0.020 * (lpz -  9.000) +  0.028;
	if (lpz >  9.500) dzage = 0.019 * (lpz -  9.500) +  0.039;
	if (lpz > 10.000) dzage = 0.048;
	if (lpz > 10.775) dzage = 0.035 * (lpz - 10.775) +  0.048;
	if (lpz > 11.851) dzage = 0.069 * (lpz - 11.851) +  0.086;
	if (lpz > 12.258) dzage = 0.461 * (lpz - 12.258) +  0.114;
	if (lpz > 12.382) dzage = 0.024 * (lpz - 12.382) +  0.171;
	if (lpz > 13.055) dzage = 0.013 * (lpz - 13.055) +  0.188;
	if (lpz > 14.081) dzage = 0.013 * (lpz - 14.081) +  0.201;
	if (lpz > 15.107) dzage = 0.214;
	this.zage = this.zage*Math.pow(10.0,dzage);
	this.zage_Gyr = (this.Tyr/this.H0)*this.zage;
	this.DTT = 0.0;
	this.DCMR = 0.0;
	// do integral over a=1/(1+z) from az to 1 in n steps, midpoint rule
	for (i = 0; i != this.n; i++) {
		this.a = this.az+(1-this.az)*(i+0.5)/this.n;
		this.adot = Math.sqrt(this.WK+(this.WM/this.a)+(this.WR/(this.a*this.a))+(this.WV*this.a*this.a));
		this.DTT = this.DTT + 1/this.adot;
		this.DCMR = this.DCMR + 1/(this.a*this.adot);
	};
	this.DTT = (1-this.az)*this.DTT/this.n;
	this.DCMR = (1-this.az)*this.DCMR/this.n;
	this.age = this.DTT+this.zage;
	this.age_Gyr = this.age*(this.Tyr/this.H0);
	this.DTT_Gyr = (this.Tyr/this.H0)*this.DTT;
	this.DCMR_Gyr = (this.Tyr/this.H0)*this.DCMR;
	this.DCMR_Mpc = (this.c/this.H0)*this.DCMR;
	this.DA = this.az*this.DCMT();
	this.DA_Mpc = (this.c/this.H0)*this.DA;
	this.kpc_DA = this.DA_Mpc/206.264806;
	this.DA_Gyr = (this.Tyr/this.H0)*this.DA;
	this.DL = this.DA/(this.az*this.az);
	this.DL_Mpc = (this.c/this.H0)*this.DL;
	this.DL_Gyr = (this.Tyr/this.H0)*this.DL;
	this.V_Gpc = 4*Math.PI*Math.pow(0.001*this.c/this.H0,3)*this.VCM();

}

// calculate the actual results
CosmoCalc.prototype.compute = function() {

	var H0 = this.cosmos[0].H0;
	var WM = this.cosmos[0].WM;
	var WV = this.cosmos[0].WV;

	this.H0changed = false;
	this.WMchanged = false;
	this.WVchanged = false;

	for(var i = 0 ; i < this.cosmos.length ; i++){
		this.cosmos[i].compute();
		if(H0 != this.cosmos[i].H0) this.H0changed = true;
		if(WM != this.cosmos[i].WM) this.WMchanged = true;
		if(WV != this.cosmos[i].WV) this.WVchanged = true;
	}
}


CosmoCalc.prototype.scroll = function() {

	this.clipboard.css('top',$(window).scrollTop());

}

// calculate the actual results
CosmoCalc.prototype.display = function() {
	var csv = "";
	var str = "";
	str += "<table>";
	str += this.displayTableHeader();
	csv += this.displayCSVHeader();
	for(var i = 0 ; i < this.cosmos.length ; i++){
		str += this.displayTableRow(i);
		csv += this.displayCSVRow(i);
	}
	str += '<\/table>';

	this.csv = csv;
	this.el.html(str);
	this.clipboard.html(csv);
    $('#copy').show();
}

function hideCol($table, myIndex){
	$table.find("tr").each(function(){
		$(this).find("th:eq("+myIndex+"), td:eq("+myIndex+")").not('.footer').hide();
	});
}

function showCol($table, myIndex){
	$table.find("tr").each(function(){
		$(this).find("th:eq("+myIndex+"), td:eq("+myIndex+")").not('.footer').show();
	});
}

//onClick=\"widget.openURL('');\" href=\"#\"
CosmoCalc.prototype.displayTableHeader = function() {
	var str = "<tr>";
	str += "<th><a onClick=\"widget.openURL('http://www.astro.ucla.edu/~wright/glossary.html#redshift');\" href=\"#\">z</a></th>";
	if(this.H0changed) str += "<th><a onClick=\"widget.openURL('http://www.astro.ucla.edu/~wright/glossary.html#H0');\" href=\"#\">H<sub>o</sub></a></th>";
	if(this.WMchanged) str += "<th><a onClick=\"widget.openURL('http://www.astro.ucla.edu/~wright/glossary.html#Omega');\" href=\"#\">&Omega;<sub>M</sub></a></th>";
	if(this.WVchanged) str += "<th><a onClick=\"widget.openURL('http://www.astro.ucla.edu/~wright/glossary.html#CC');\" href=\"#\">&Omega;<sub>vac</sub></a></th>";
	str += "<th>Age at z=0 (t<sub>H</sub>)</th>";
	str += "<th>Age at redshift z</th>";
	str += "<th><a onClick=\"widget.openURL('http://www.astro.ucla.edu/~wright/cosmo_02.htm#DT');\" href=\"#\">Light travel time</a></th>";
	str += "<th><a onClick=\"widget.openURL('http://www.astro.ucla.edu/~wright/cosmo_02.htm#DH');\" href=\"#\">Comoving radial distance</a></th>";
	str += "<th>Comoving volume within redshift z</th>";
	str += "<th>Angular size dist. D<sub>A</sub></th>";
	str += "<th>Scale</th>";
	str += "<th><a onClick=\"widget.openURL('http://www.astro.ucla.edu/~wright/cosmo_02.htm#DL');\" href=\"#\">luminosity distance D<sub>L</sub></a></th>";
	str += "</tr>";

	str += "<tr>";
	str += "<th></th>";
	if(this.H0changed) str += "<th></th>";
	if(this.WMchanged) str += "<th></th>";
	if(this.WVchanged) str += "<th></th>";
	str += "<th>Gyr</th>";
	str += "<th>Gyr</th>";
	str += "<th>Gyr</th>";
	str += "<th>Mpc</th>";
	str += "<th>Gpc<sup>3</sup></th>";
	str += "<th>Mpc</th>";
	str += "<th>kpc/&quot;</th>";
	str += "<th>Mpc</th>";
	
	str += "</tr>";


	return str;
}


CosmoCalc.prototype.displayCSVHeader = function() {

	var ch = '\t';
	var answer = "# ";
	answer += 'H0' + ch;
	answer += 'Omega_M' + ch;
	answer += 'Omega_vac' + ch; 
	answer += 'z' + ch;
	answer += 'time_Gyr' + ch;
	answer += 'age_Gyr' + ch;
	answer += 'travel_time_Gyr' + ch;
	answer += 'comoving_radial_distance_Mpc' + ch;
	answer += 'comoving_radial_distance_Gly' + ch;
	answer += 'comoving_volume_within_z_Gpc3' + ch;
	answer += 'angular_size_distance_DA_Mpc' + ch;
	answer += 'angular_size distance DA_Gly' + ch;
	answer += 'scale_kpc_per_arcsec' + ch;
	answer += 'luminosity_distance_D_L_Mpc' + ch;
	answer += 'luminosity_distance_D_L_Gly' + ch;
	return answer + '\n';		
}


CosmoCalc.prototype.displayCSVRow = function(i) {

	var c = this.cosmos[i];
	var ch = '\t';

	// prepare the HTML to output the results
	var answer = '';
	answer += c.stround(c.z,3) + ch;
	answer += c.H0 + ch;
	answer += c.stround(c.WM,3) + ch;
	answer += c.stround(c.WV,3) + ch;
	answer += c.stround(c.age_Gyr,3) + ch;

	answer += c.stround(c.zage_Gyr,3) + ch;
	answer += c.stround(c.DTT_Gyr,3) + ch;
	answer += c.stround(c.DCMR_Mpc,1) + ch;
	answer += c.stround(c.DCMR_Gyr,3) + ch;
	answer += c.stround(c.V_Gpc,3) + ch;

	c.nda = 1;
	if (c.DA_Mpc < 100) c.nda = 3;

	answer += c.stround(c.DA_Mpc,c.nda) + ch
	answer += c.stround(c.DA_Gyr,c.nda+3) + ch;
	answer += c.stround(c.kpc_DA,3) + ch;
	answer += c.stround(c.DL_Mpc,1) + ch;
	answer += c.stround(c.DL_Gyr,3) + ch;
	return answer + '\n';
}

CosmoCalc.prototype.displayTableRow = function(i) {

	// prepare the HTML to output the results

	var c = this.cosmos[i];

	var answer = '<tr>';
	answer += '<td>' + c.stround(c.z,3) + '</td>';
	if(this.H0changed) answer += '<td>' + c.H0 + '</td>';
	if(this.WMchanged) answer += '<td>' + c.stround(c.WM,3) + '</td>';
	if(this.WVchanged) answer += '<td>' + c.stround(c.WV,3) + '</td>';
	answer += '<td>' + c.stround(c.age_Gyr,3) + '</td>';
	

	answer += '<td>' + c.stround(c.zage_Gyr,3) + '</td>';
	answer += '<td>' + c.stround(c.DTT_Gyr,3) + '</td>';
	answer += '<td>' + c.stround(c.DCMR_Mpc,1) + '</td>';
	answer += '<td>' + c.stround(c.V_Gpc,3) + '</td>';

	c.nda = 1;
	if (c.DA_Mpc < 100) c.nda = 3;

	answer += '<td>' + c.stround(c.DA_Mpc,c.nda) + '</td>'
	answer += '<td>' + c.stround(c.kpc_DA,3) + '</td>';
	answer += '<td>' + c.stround(c.DL_Mpc,1) + '</td>';
	return answer;		
}

CosmoCalc.prototype.empty = function(){
	this.cosmos = new Array();	

	return this;
}
CosmoCalc.prototype.addCosmos = function(H0,WM,WV,z){

	this.cosmos.push(new Cosmos());
	this.cosmos[this.cosmos.length-1].setValues(H0,WM,WV,z);

	return this;

}

CosmoCalc.prototype.do = function(curvature) {

	// Get the lists
	var H0list = document.getval.txtH0.value.split("\n");
	var WMlist = document.getval.txtWM.value.split("\n");
	var WVlist = document.getval.txtWV.value.split("\n");
	var zlist = document.getval.txtz.value.split("\n");

	var H0, WM, WV, z;
	
	this.empty();

	for(var i = 0 ; i < zlist.length ; i++){

		if(zlist[i]){

			H0 = parseFloat(H0list.length > i ? H0list[i] : H0list[0]);
			WM = parseFloat(WMlist.length > i ? WMlist[i] : WMlist[0]);
			z = parseFloat(zlist[i]);

			if(curvature == "open"){
				WV = 0;
			}else if(curvature == "flat"){
				WV = 1.0 - WM - 0.4165/(H0*H0);
			}else {
				WV = parseFloat(WVlist.length > i ? WVlist[i] : WVlist[0]);
			}

			this.addCosmos(H0,WM,WV,z);

		}

	}
	
	this.compute();
	this.display();
//	$('#output').css('overflow-y','scroll');
	$('#key').show().css('opacity',1);
    $('#copy').show();
    $('#clear').show();

}



$(document).ready(function(){


	// Set things up
	c = new CosmoCalc('#output');

    $('#clear').bind('click',{me:c},function(e){
        $('#output').html('');
        $('#key').hide();
        $('#copy').hide();
        $(this).hide();
    });

	if(typeof widget=="object"){
	
		$('#copy').bind('click',{me:c},function(e){

            widget.system("/bin/echo '"+e.data.me.csv+"' | /usr/bin/pbcopy", null);

		});

	}
    $('#copy').hide();
    $('#clear').hide();

	$(document).bind('keypress.meta keypress.ctrl',{me:c},function(e){

		e.data.me.clipboard.focus().select();

	}).bind('keyup',{me:c},function(e){

		e.data.me.clipboard.blur();

	});
	
	$(window).bind('scroll',{me:c},function(e){ e.data.me.scroll(); });

});


function doGeneral(){ c.do(); }
function doFlat(){ c.do('flat'); }
function doOpen(){ c.do('open'); }



/*
 * jQuery Hotkeys Plugin
 * Copyright 2010, John Resig
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Modified by Stuart Lowe to pass data
 *
 * Based upon the plugin by Tzury Bar Yochay:
 * https://github.com/tzuryby/jquery.hotkeys
 *
 * Original idea by:
 * Binny V A, http://www.openjs.com/scripts/events/keyboard_shortcuts/
*/
(function(jQuery){
	jQuery.hotkeys = {
		version: "0.8+",
		specialKeys: {
			8: "backspace", 9: "tab", 13: "return", 16: "shift", 17: "ctrl", 18: "alt", 19: "pause",
			20: "capslock", 27: "esc", 32: "space", 33: "pageup", 34: "pagedown", 35: "end", 36: "home",
			37: "left", 38: "up", 39: "right", 40: "down", 45: "insert", 46: "del",
			96: "0", 97: "1", 98: "2", 99: "3", 100: "4", 101: "5", 102: "6", 103: "7",
			104: "8", 105: "9", 106: "*", 107: "+", 109: "-", 110: ".", 111 : "/",
			112: "f1", 113: "f2", 114: "f3", 115: "f4", 116: "f5", 117: "f6", 118: "f7", 119: "f8",
			120: "f9", 121: "f10", 122: "f11", 123: "f12", 144: "numlock", 145: "scroll", 188: ",", 190: ".",
			191: "/", 224: "meta"
		},
		shiftNums: {
			"`": "~", "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^", "7": "&",
			"8": "*", "9": "(", "0": ")", "-": "_", "=": "+", ";": ": ", "'": "\"", ",": "<",
			".": ">", "/": "?", "\\": "|"
		}
	};
	function keyHandler( handleObj ) {
		var origHandler = handleObj.handler,
			origData = handleObj.data,
			// use namespace as keys so it works with event delegation as well
			// will also allow removing listeners of a specific key combination
			// and support data objects
			keys = (handleObj.namespace || "").toLowerCase().split(" ");
			keys = jQuery.map(keys, function(key) { return key.split("."); });
		
		// no need to modify handler if no keys specified
		if (keys.length === 1 && (keys[0] === "" || keys[0] === "autocomplete")) return;

		handleObj.handler = function( event ) {

			if(origData) arguments[0].data = origData;

			// Don't fire in text-accepting inputs that we didn't directly bind to
			if ( this !== event.target && (/textarea|select/i.test( event.target.nodeName ) ||
				event.target.type === "text" || $(event.target).prop('contenteditable') == 'true' )) {
				return;
			}
			// Keypress represents characters, not special keys
			var special = event.type !== "keypress" && jQuery.hotkeys.specialKeys[ event.which ],
				character = String.fromCharCode( event.which ).toLowerCase(),
				key, modif = "", possible = {};
			// check combinations (alt|ctrl|shift+anything)
			if ( event.altKey && special !== "alt" ) modif += "alt_";
			if ( event.ctrlKey && special !== "ctrl" ) modif += "ctrl_";
			// TODO: Need to make sure this works consistently across platforms
			if ( event.metaKey && !event.ctrlKey && special !== "meta" ) modif += "meta_";
			if ( event.shiftKey && special !== "shift" ) modif += "shift_";
			if ( special ) possible[ modif + special ] = true;
			else {
				possible[ modif + character ] = true;
				possible[ modif + jQuery.hotkeys.shiftNums[ character ] ] = true;
				// "$" can be triggered as "Shift+4" or "Shift+$" or just "$"
				if ( modif === "shift_" ) possible[ jQuery.hotkeys.shiftNums[ character ] ] = true;
			}
			for ( var i = 0, l = keys.length; i < l; i++ ) {
				if ( possible[ keys[i] ] ) return origHandler.apply( this, arguments );
			}
		};
	}
	jQuery.each([ "keydown", "keyup", "keypress" ], function() { jQuery.event.special[ this ] = { add: keyHandler }; });
})( jQuery );
