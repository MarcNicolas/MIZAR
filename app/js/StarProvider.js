/**
 * 	StarProvider module
 *
 *	Specific star catalogue provider of the Brightest Stars (Ochsenbein+ 1988) from VizieR database
 * 	@see Search Catalogue of the Brightest Stars (Ochsenbein+ 1988) in VizieR database for more details
 */
define( [ "jquery.ui", "LayerManager" ], function($, LayerManager) {

/**************************************************************************************************************/

var namesFile;
var catalogueFile;

/**
*	Asynchronous requests to load star database
*
* 	@param configuration Configuration options
* 		<ul>
*			<li>nameUrl : Url providing the stars name data(necessary option)</li>
*			<li>catalogueUrl : Url providing all information about each star(necessary option)</li>
*		</ul>
*/
function loadFiles(gwLayer, configuration)
{
	if ( configuration.nameUrl && configuration.catalogueUrl )
	{
		var nameRequest = {
			type: "GET",
			url: configuration.nameUrl,
			success: function(response){
				namesFile = response;
			},
			error: function (xhr, ajaxOptions, thrownError) {
				console.error( xhr.responseText );
			}
		};
		
		var catalogueRequest = {
			type: "GET",
			url: configuration.catalogueUrl,
			success: function(response){
			       catalogueFile = response;
			},
			error: function (xhr, ajaxOptions, thrownError) {
				console.error( xhr.responseText );
			}
		};
		
		// Synchronizing two asynchronious requests with the same callback
		var self = this;
		$.when($.ajax(nameRequest), $.ajax(catalogueRequest))
			.then(function(){ handleFeatures(gwLayer); },failure);
	}
	else
	{
		console.error("Not valid options");
		return null;
	}
}

/**************************************************************************************************************/

/**
 * 	Handle features on layer
 */
function handleFeatures(gwLayer)
{
	// Extract the table data
	var tmpTab = namesFile.slice(namesFile.indexOf("897;Acamar"), namesFile.indexOf('1231;Zaurak')+11);
	var namesTab = tmpTab.split("\n");
	tmpTab = catalogueFile.slice(catalogueFile.indexOf("001."), catalogueFile.indexOf("4.98;K3Ibv")+10);
	var catalogueTab = tmpTab.split("\n");
	var pois = [];
	
	// For each known star
	for ( var i=0; i<namesTab.length; i++ )
	{
		var word = namesTab[i].split(";"); // word[0] = HR, word[1] = name;
		var HR = parseInt(word[0]);
		var starName = word[1];
			
		// Search corresponding HR in catalogue
		for ( var j=0; j<catalogueTab.length; j++ )
		{
			word = catalogueTab[j].split(";");
			if (parseInt(word[2]) == HR){
				// Star found in the catalogue
				
				var raString = word[6];   // right ascension format : "hours minutes seconds"
				var declString = word[7]; // declinaton format : "degrees minutes seconds"
				
				var geo = [];
				GlobWeb.CoordinateSystem.fromEquatorialToGeo([raString, declString], geo);
				
				// Add poi layer
				var poi = {
					geometry: {
						type: "Point",
						coordinates: [geo[0],geo[1]]
					},
					properties: {
						name: starName,
						style: new GlobWeb.FeatureStyle({ label: starName, fillColor: [1.,1.,1.,1.] })
					}
				};
				pois.push(poi);
			}
		}
	}
	
	// Create feature collection
	var poiFeatureCollection = {
		type: "FeatureCollection",
		features : pois
	};
	
	gwLayer.addFeatureCollection(poiFeatureCollection);
}

/*
 * 	Failure function
 */
function failure()
{
	console.error( "Failed to load files" );
}

/**************************************************************************************************************/

// Register the data provider
LayerManager.registerDataProvider("star", loadFiles);

});