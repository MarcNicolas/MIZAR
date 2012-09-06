var globe = null;
var astroNavigator = null;


function setImageriesButtonsetLayout(){
	// make it vertical
	$(':radio, :checkbox', '#ImageriesDiv').wrap('<div style="margin: 1px"/>'); 
	$('label:first', '#ImageriesDiv').removeClass('ui-corner-left').addClass('ui-corner-top');
	$('label:last', '#ImageriesDiv').removeClass('ui-corner-right').addClass('ui-corner-bottom');
	
	// make the same width for all labels
	mw = 100; // max witdh
	$('label', '#ImageriesDiv').each(function(index){
		w = $(this).width();
		if (w > mw) mw = w; 
	});
	
	// Another way to find a max
	// mw = Math.max.apply(Math, $('label', '#ImageriesDiv').map(function(){ return $(this).width(); }).get());
	
	$('label', '#ImageriesDiv').each(function(index){
		$(this).width(mw);
	});
}

$(function()
{	
	// create accordeon
	$( "#accordion" ).accordion( { autoHeight: false, active: 0, collapsible: true } );
	
	// create Imagery button set
	$( "#ImageriesDiv" ).buttonset();
	setImageriesButtonsetLayout();
	
	var canvas = document.getElementById('HEALPixCanvas');

	// make fullscreen
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	
	// JS
	// window.onresize = onWindowResize;
	
	console.log("Main!");
	
	// jQuery
	$(window).resize(function() {
		if ( canvas.width !=  window.innerWidth ) 
			canvas.width = window.innerWidth;
		if ( canvas.height != window.innerHeight )
			canvas.height = window.innerHeight;
	});
	
	// jQuery
/*	$(window).unload(function() {
		globe.dispose();
	});*/
	
	// Initialize webgl
	try
	{
		globe = new GlobWeb.Globe( { canvas: canvas, 
			showWireframe: false, 
			continuousRendering: true
		} );
	}
	catch (err)
	{
		document.getElementById('HEALPixCanvas').style.display = "none";
		document.getElementById('webGLNotAvailable').style.display = "block";
	}
	
	// Add stats
	var stats = new GlobWeb.Stats( globe, {element: 'fps', verbose: true} );

	// Initialize navigator
	astroNavigator = new GlobWeb.AstroNavigator(globe);
	astroNavigator.setupDefaultEventHandlers(1);
	
	var cdsLayer = new GlobWeb.HEALPixLayer( { baseUrl: "/Alasky/DssColor/"} );
	globe.setBaseImagery( cdsLayer );
	
	// Event for changing imagery provider
	$("#ImageriesDiv :input").click(function(event){
		var cdsProvider;
		if( this.value == "SDSS"){
			cdsProvider = new GlobWeb.HEALPixLayer({ baseUrl: "/Alasky/SDSS/Color"});
			globe.setBaseImagery( cdsProvider );
		}
		
		if( this.value == "DSS" ){
			cdsProvider = new GlobWeb.HEALPixLayer({ baseUrl: "/Alasky/DssColor/"});
			globe.setBaseImagery( cdsProvider );
		}
	});
	
	// Event to show HEALPix wireframe grid
	$("#grid").click(function(event){
		if ($("#grid:checked").length)
		{
			globe.setOption("showWireframe", true);
		}
		else
		{
			globe.setOption("showWireframe", false);
		}
	});
	
	function roundNumber(num, dec) {
		var result = Math.round(num*Math.pow(10,dec))/Math.pow(10,dec);
		return result;
	}
	
	// Click event to show equatorial coordinates
	$("#HEALPixCanvas").click(function(event){
		if(event.ctrlKey){
			var equatorial = [];
			geo = globe.getLonLatFromPixel(event.pageX, event.pageY);		
			GlobWeb.CoordinateSystem.fromGeoToEquatorial(geo, equatorial);
			
			var wordRA = equatorial[0].split(" ");
			var wordDecl = equatorial[1].split(" ");
			$("#equatorialCoordinates").html("<em>Right ascension:</em> <br/>&nbsp&nbsp&nbsp&nbsp" + wordRA[0] +"h "+ wordRA[1] +"mn "+ roundNumber(parseFloat(wordRA[2]), 4) +"s<br /><em>Declination :</em> <br/>&nbsp&nbsp&nbsp&nbsp" + wordDecl[0] +"&#186 "+ wordDecl[1] +"' "+ roundNumber(parseFloat(wordDecl[2]), 4) +"\"");
		}
	});
	
	// Create li's from catalogue
	initPOI(globe);
	
	// Create constellations from catalogue
	initConstellations(globe);
	
});