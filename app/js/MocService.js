/**
 * Moc display & Moc xMatch services
 * // TODO refactor to two different services
 */
define( [ "jquery.ui", "MocLayer", "ErrorDialog", "Utils", "underscore-min", "text!../templates/mocService.html", "text!../templates/xMatchService.html" ], function($, MocLayer, ErrorDialog, Utils, _, mocServiceHTMLTemplate, xMatchServiceHTMLTemplate) {

// Template generating the services html
var mocServiceTemplate = _.template(mocServiceHTMLTemplate);
var xMatchServiceTemplate = _.template(xMatchServiceHTMLTemplate);

// TODO make option
var coverageServiceUrl = 'http://localhost:8182/sitools/rtwebgl/plugin/coverage?moc=';

var layers = [];
var intersectionLayer;

/**
 *	Create moc sublayer
 *
 *	@param layer Parent layer
 *	@param serviceUrl Url to OpenSearch xml description of layer
 */
function createMocSublayer(layer, serviceUrl)
{
	// Get moc template
	$.ajax({
		type: "GET",
		url: serviceUrl,
		dataType: "xml",
		success: function(xml) {
			var mocdesc = $(xml).find('Url[rel="mocdesc"]');
			var describeUrl = $(mocdesc).attr("template");
			if ( describeUrl )
			{
				var splitIndex = describeUrl.indexOf( "?q=" );
				if ( splitIndex != -1 )
					handleMocLayer( layer, describeUrl.substring( 0, splitIndex ) );
				else
					handleMocLayer( layer, describeUrl );
			}
			else
			{
				// No moc
				layer.coverage = "unknown";
				$("#MocService #mocLayer_"+layer.id).find('.mocCoverage').html("Sky coverage: "+layer.coverage+"%").end()
													.find('.mocStatus').html('Not found');
				$("#xMatchService #mocLayer_"+layer.id).find('.mocCoverage').html("Sky coverage: "+layer.coverage+"%").end()
													.find('.mocStatus').html('Not found');
			}
				
		}
	});
}

/**
 *	Requesting moc sky coverage information and stock it as layer parameter
 */
function requestSkyCoverage(layer, mocServiceUrl)
{
	// Request MOC space coverage
	$.ajax({
		type: "GET",
		url: mocServiceUrl,
		success: function(response){
			var coverage = Utils.roundNumber(parseFloat(response),5);
			$("#MocService #mocLayer_"+layer.id).find('.mocCoverage').html("Sky coverage: "+coverage+"%");
			$("#xMatchService #mocLayer_"+layer.id).find('.mocCoverage').html("Sky coverage: "+coverage+"%");			
			layer.coverage = coverage;
		}
	});	
}

/**
 *	Search moc sublayer
 *	@return	Moc layer if found, null otherwise
 */
function findMocSublayer(layer)
{
	if ( layer.subLayers )
	{
		for ( var j=0; j<layer.subLayers.length; j++ )
		{
			if ( layer.subLayers[j] instanceof MocLayer )
			{
				return layer.subLayers[j];
			}
		}
	}
	return null;
}

/**
 *	Handle moc layer as a sublayer
 *
 *	@param layer Parent layer
 *	@param mocServiceUrl Url to moc service
 */
function handleMocLayer(layer, mocServiceUrl)
{
	var serviceLayer = new MocLayer({ serviceUrl: mocServiceUrl, style: layer.style, visible: false });
	if ( layer.globe )
	{
		// Add sublayer to engine
		layer.globe.addLayer( serviceLayer );
	}

	// Enable checkboxes
	$("#MocService #mocLayer_"+layer.id).find('input[type="checkbox"]').removeAttr("disabled").button("refresh");
	$("#xMatchService #mocLayer_"+layer.id).find('input[type="checkbox"]').removeAttr("disabled").button("refresh");

	layer.subLayers.push(serviceLayer);
	requestSkyCoverage( layer, mocServiceUrl+"?media=txt" );
}

/**
 *	Event for display button
 */
function displayClickEvent()
{
	var layer = $(this).parent().data("layer");

	var serviceLayer;
	if ( !(layer instanceof MocLayer) )
		serviceLayer = findMocSublayer(layer);
	else
		serviceLayer = layer; 

	// Change visibility
	if ( serviceLayer )
	{
		if ( this.checked )
		{
			serviceLayer.visible(true)
		}
		else
		{
			serviceLayer.visible(false);
		}
	}
}

/**
 *	Add HTML of moc layer
 */
function addHTMLMocLayer(layer)
{
	var form = mocServiceTemplate( { layer: layer });
	var serviceLayer = findMocSublayer(layer);
	$(form)
		.appendTo('#MocService .mocLayers')
		.data("layer", layer)
		.find('input[type="checkbox"]')
				.attr("checked", (serviceLayer && serviceLayer.visible()) ? true : false)
				.attr("disabled", (serviceLayer) ? false : true)
				.button()
				.click(displayClickEvent);
}

/**
 *	Add HTML of xMatch layer
 */
function addHTMLXMatchLayer(layer)
{
	var form = xMatchServiceTemplate( { layer: layer } );
	var serviceLayer = findMocSublayer(layer);
	$(form)
		.appendTo('#xMatchService .mocLayers')
		.data("layer",layer)
		.find('input[type="checkbox"]')
			.attr("disabled", (serviceLayer) ? false : true)
			.button({
				text:false,
				icons: {
					primary: "ui-icon-empty"
				}
			})
			.click(function(){
				$(this).button("option", {
					icons: {
	            		primary: $(this).is(':checked') ? "ui-icon-check" : "ui-icon-empty"
	            	}
	            });
			});
}

/**
 *	Add HTML of intersection layer
 */
function addHTMLIntersectionLayer()
{
	// Add HTML
	var form = mocServiceTemplate( { layer: intersectionLayer });
	$(form)
		.appendTo('#intersectResult')
		.data("layer", intersectionLayer)
		.find(".display")
			.button()
			.click(displayClickEvent);
	$('#intersectResult').slideDown();
	$('#intersectMocBtn').removeAttr("disabled").button("refresh");
}

/**
 *	Create & add intersection layer
 *
 *	@param layersToIntersect Layers to intersect
 */
function addIntersectionLayer(layersToIntersect)
{
	// Construct url & layerNames
	var url = coverageServiceUrl;
	var layerNames = "";
	for ( var i=0; i<layersToIntersect.length; i++ )
	{
		var layer = layersToIntersect[i];

		var mocLayer = findMocSublayer(layer);
		layerNames += layer.name;
		url += mocLayer.serviceUrl;
		if ( i != layersToIntersect.length-1 )
		{
			url += ';'
			layerNames += ' x ';
		}
	}

	// HACK+TODO add globe into the module by init
	var globe = layers[0].globe;

	if ( intersectionLayer )
		globe.removeLayer(intersectionLayer);

	// Create intersection MOC layer
	intersectionLayer = new MocLayer({
			name: "Intersection( "+layerNames+" )",
			serviceUrl: url + "&media=json",
			style: new GlobWeb.FeatureStyle({
				rendererHint: "Basic"
			}),
			visible: false
		});
	globe.addLayer(intersectionLayer);

	requestSkyCoverage( intersectionLayer, url + "&media=txt" );
	addHTMLIntersectionLayer();
}

return {

	/**
	 *	Add layer to the service
	 */
	addLayer: function(layer)
	{
		layers.push(layer);

		if ( !layer.subLayers )
		{
			layer.subLayers = [];
		}

		var serviceLayer = findMocSublayer(layer);

		// Create if doesn't exist
		if ( !serviceLayer )
		{
			createMocSublayer( layer, layer.serviceUrl );
		}

		addHTMLMocLayer( layer );
		addHTMLXMatchLayer( layer );	
	},

	/**
	 *	Remove layer from the service
	 */
	removeLayer: function(layer)
	{
		for(var i=0; i<layers.length; i++)
		{
			if(layers[i].id == layer.id)
			{
				layers.splice(i,1);
			}
		}

		$( "#MocService #mocLayer_"+layer.id ).remove();
		$( "#xMatchService #mocLayer_"+layer.id ).remove();
	},

	/**
	 *	Add service to jQueryUI tabs
	 *
	 *	@param tabs jQueryUI tabs selector
	 */
	addService: function(tabs)
	{
		// Append headers
		$('<li style="display: none;"><a href="#MocService">Moc</a></li>\
		<li style="display: none;"><a href="#xMatchService">xMatch</a></li>')
			.appendTo( tabs.children( ".ui-tabs-nav" ) )
			.fadeIn(300);

		// Append content
		tabs.append('<div id="MocService">\
						<div class="mocLayers"></div>\
					</div>\
					<div id="xMatchService">\
						<div class="mocLayers"></div>\
						<button id="intersectMocBtn">Intersect</button>\
						<div id="intersectResult"></div>\
					</div>');

		for ( var i=0; i<layers.length; i++ )
		{
			var layer = layers[i];
			addHTMLMocLayer( layer );
			addHTMLXMatchLayer( layer );	
		}

		$( '#intersectMocBtn' )
			.button()
			.click(function(){
				$(this).attr("disabled","disabled").button("refresh");
				$('#intersectResult').clearQueue().stop().slideUp(function(){
					var checkedInputs = $(this).parent().find('input:checked');
					if ( checkedInputs.length < 2 )
					{
						$('#intersectResult').html('Check at least two layers')
								.slideDown().delay(700).slideUp(function(){
									$('#intersectMocBtn').removeAttr("disabled").button("refresh");
								});
					}
					else
					{
						$('#intersectResult').html('');
						var checkedLayers = [];
						checkedInputs.each(function(i){
							checkedLayers.push( $.data(checkedInputs[i].parentElement, "layer") );
						});

						addIntersectionLayer(checkedLayers);
					}
				});
			});
	},

	/**
	 *	Remove service from jQueryUI tabs
	 *
	 *	@param tabs jQueryUI tabs selector
	 */
	removeService: function(tabs)
	{
		tabs.find( '.ui-tabs-nav li[aria-controls="MocService"]').fadeOut(300, function(){
			var index = $(this).index();
			tabs.tabs("remove",index);
		});
		tabs.find( '.ui-tabs-nav li[aria-controls="xMatchService"]').fadeOut(300, function(){
			var index = $(this).index();
			tabs.tabs("remove",index);
		});

		if ( intersectionLayer )
		{
			intersectionLayer.globe.removeLayer( intersectionLayer );
			intersectionLayer = null;
		}
	}
}

});