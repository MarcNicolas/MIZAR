/******************************************************************************* 
* Copyright 2012, 2013 CNES - CENTRE NATIONAL d'ETUDES SPATIALES 
* 
* This file is part of SITools2. 
* 
* SITools2 is free software: you can redistribute it and/or modify 
* it under the terms of the GNU General Public License as published by 
* the Free Software Foundation, either version 3 of the License, or 
* (at your option) any later version. 
* 
* SITools2 is distributed in the hope that it will be useful, 
* but WITHOUT ANY WARRANTY; without even the implied warranty of 
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the 
* GNU General Public License for more details. 
* 
* You should have received a copy of the GNU General Public License 
* along with SITools2. If not, see <http://www.gnu.org/licenses/>. 
******************************************************************************/

/**
 * Configuration for require.js
 */
require.config({
	paths: {
		"jquery": "../externals/jquery-1.8.2.min",
		"jquery.ui": "../externals/jquery-ui-1.9.2.custom.min",
		"jquery.ui.selectmenu": "../externals/jquery.ui.selectmenu",
		"underscore-min": "../externals/underscore-min",
		"jquery.nicescroll.min": "../externals/jquery.nicescroll.min",
		"fits": "../externals/fits"
	},
	shim: {
		'jquery': {
			deps: [],
			exports: 'jQuery'
		},
		'jquery.ui': {
			deps: ['jquery'],
			exports: 'jQuery'
		},
		'jquery.ui.selectmenu': {
			deps: ['jquery.ui'],
			exports: 'jQuery'
		},
		'underscore-min': {
			deps: ['jquery'],
			exports: '_'
		},
		'jquery.nicescroll.min': {
			deps: ['jquery'],
			exports: ''
		}
	},
	waitSeconds: 0
});

/**
 * Main module
 */
require( ["jquery.ui", "LayerManager", "NameResolver", "ReverseNameResolver", "Utils", "PickingManager", "FeaturePopup", "IFrame", "ErrorDialog", "StarProvider", "ConstellationProvider", "JsonProvider", "OpenSearchProvider"], function($, LayerManager, NameResolver, ReverseNameResolver, Utils, PickingManager, FeaturePopup, IFrame, ErrorDialog) {

// Console fix	
window.console||(console={log:function(){}});
	
// Private variable
var globe = null;
var navigation = null;

function hideLoading()
{
	$('#loading').hide(300);
}

function updateFov()
{
	var fov = navigation.getFov();
	var fovx = Utils.roundNumber( fov[0], 2 ) ;
	fovx = GlobWeb.CoordinateSystem.fromDegreesToDMS( fovx );
	var fovy = Utils.roundNumber( fov[1], 2 ) ;
	fovy = GlobWeb.CoordinateSystem.fromDegreesToDMS( fovy );
	$('#fov').html( "Fov : " + fovx + " x " + fovy );
}

function removeComments(string)
{
	var starCommentRe = new RegExp("/\\\*(.|[\r\n])*?\\\*/", "g");
	var slashCommentRe = new RegExp("[^:]//.*[\r\n]", "g");
	string = string.replace(slashCommentRe, "");
	string = string.replace(starCommentRe, "");

	return string;
}

$(function()
{	
	// Create accordeon
	$( "#accordion" ).accordion( { autoHeight: false, active: 0, collapsible: true } ).show();
	
	var confURL = 'js/conf.json'; // default

	// If configuration is defined by SiTools2
	var splitIndex = window.document.documentURI.indexOf( "?conf=" );
	if ( splitIndex != -1 )
	{
		var url = window.document.documentURI.substr( splitIndex+6 );
		if ( url != 'undefined' ) {
			confURL = url;
		}
	}

	var canvas = document.getElementById('GlobWebCanvas');

	// Make canvas fullscreen
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	
	// Take into account window resize
	$(window).resize(function() {
		if ( canvas.width !=  window.innerWidth ) 
			canvas.width = window.innerWidth;
		if ( canvas.height != window.innerHeight )
			canvas.height = window.innerHeight;
	});
	
	// Initialize globe
	try
	{
		globe = new GlobWeb.Globe( { 
			canvas: canvas, 
			tileErrorTreshold: 1.5,
			continuousRendering: true
		} );
	}
	catch (err)
	{
		document.getElementById('GlobWebCanvas').style.display = "none";
		document.getElementById('loading').style.display = "none";
		document.getElementById('webGLNotAvailable').style.display = "block";
	}
	
	// When  base layer is ready, hide loading
	globe.subscribe("baseLayersReady", hideLoading);
	
	// Context lost listener
	canvas.addEventListener("webglcontextlost", function(event) {
		// TODO
		event.preventDefault();
		document.getElementById('loading').style.display = "none";
		document.getElementById('webGLContextLost').style.display = "block";
	}, false);
	
	// Initialize navigation
	navigation = new GlobWeb.AstroNavigation(globe, {minFov: 0.001});
	
	// Retreive configuration
	$.ajax({
		type: "GET",
		url: confURL,
		dataType: "text",
		success: function(response) {
			response = removeComments(response);
			try
			{
				var data = $.parseJSON(response);
			}
			catch (e) {
				ErrorDialog.open("Configuration parsing error<br/> For more details see http://jsonlint.com/.");
				console.error(data);
				return false;
			}

			// Add stats
			if ( data.stats.visible ) {
				new GlobWeb.Stats( globe, { element: "fps", verbose: data.stats.verbose });
			} else  {
				$("#fps").hide();
			}
			
			// Initialize the name resolver
			NameResolver.init(globe, navigation, data.nameResolver);
		
			// Initialize the reverse name resolver
			ReverseNameResolver.init(globe, data.reverseNameResolver);

			// Create layers from configuration file
			LayerManager.init(globe, navigation, data);
		},
		error: function(xhr){
			ErrorDialog.open("Couldn't open : "+confURL);
		}
	});
	
	// Create data manager
	PickingManager.init(globe, navigation);
	
	/*** Refactor into common ? ***/
	// Fade hover styled image effect
	$("body").on("mouseenter", "img.defaultImg", function () {
		//stuff to do on mouseover
		$(this).stop().animate({"opacity": "0"}, 100);
		$(this).siblings('.hoverImg').stop().animate({"opacity": "1"}, 100);
	});
	$("body").on("mouseleave", "img.defaultImg", function () {
		//stuff to do on mouseleave
		$(this).stop().animate({"opacity": "1"}, 100);
		$(this).siblings('.hoverImg').stop().animate({"opacity": "0"}, 100);
	});

	// Close button event
	$('body').on("click",'.closeBtn', function(event){
		switch($(this).parent().attr("id"))
		{
			case "externalIFrame":
				IFrame.hide();
				break;
			case "selectedFeatureDiv":
				FeaturePopup.hide();
				break;
			default:
				$(this).parent().fadeOut(300);	
		}
	});
	/***********************************/
	
	updateFov();
	// Update fov when moving
	globe.subscribe("endNavigation", updateFov);
});

});