/* New Caches

Aluno 1: 59837 Bárbara Correia
Aluno 2: 60044 Gonçalo Rodrigues 

Comment:

The file "newCaches.js" must include, in the first lines,
an opening comment containing: the name and number of the two students who
developd the project; indication of which parts of the work
made and which were not made; possibly alerts to some aspects of the
implementation that may be less obvious to the teacher.



0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789

HTML DOM documentation: https://www.w3schools.com/js/js_htmldom.asp
Leaflet documentation: https://leafletjs.com/reference.html
*/



/* GLOBAL CONSTANTS */

const MAP_INITIAL_CENTRE =
	[38.661, -9.2044];  // FCT coordinates
const MAP_INITIAL_ZOOM =
	14
const MAP_ID =
	"mapid";
const MAP_ATTRIBUTION =
	'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> '
	+ 'contributors, Imagery Â© <a href="https://www.mapbox.com/">Mapbox</a>';
const MAP_URL =
	'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token='
	+ 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw'
const MAP_ERROR =
	"https://upload.wikimedia.org/wikipedia/commons/e/e0/SNice.svg";
const MAP_LAYERS =
	["streets-v11", "outdoors-v11", "light-v10", "dark-v10", "satellite-v9",
		"satellite-streets-v11", "navigation-day-v1", "navigation-night-v1"]
//const RESOURCES_DIR =
//	"http//ctp.di.fct.unl.pt/lei/lap/projs/proj2122-3/resources/";
const RESOURCES_DIR =
	"resources/";
const CACHE_KINDS = ["CITO", "Earthcache", "Event",
	"Letterbox", "Mega", "Multi", "Mystery", "Other",
	"Traditional", "Virtual", "Webcam", "Wherigo"];
const CACHE_RADIUS =
	161	// meters
const CACHE_MAX_RADIUS =
	400	// meters
const CACHES_FILE_NAME =
	"caches.xml";
const STATUS_ENABLED =
	"E"


/* GLOBAL VARIABLES */

let map = null;



/* USEFUL FUNCTIONS */

// Capitalize the first letter of a string.
function capitalize(str) {
	return str.length > 0
		? str[0].toUpperCase() + str.slice(1)
		: str;
}

// Distance in km between to pairs of coordinates over the earth's surface.
// https://en.wikipedia.org/wiki/Haversine_formula
function haversine(lat1, lon1, lat2, lon2) {
	function toRad(deg) { return deg * 3.1415926535898 / 180.0; }
	let dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
	let sa = Math.sin(dLat / 2.0), so = Math.sin(dLon / 2.0);
	let a = sa * sa + so * so * Math.cos(toRad(lat1)) * Math.cos(toRad(lat2));
	return 6372.8 * 2.0 * Math.asin(Math.sqrt(a));
}

function loadXMLDoc(filename) {
	let xhttp = new XMLHttpRequest();
	xhttp.open("GET", filename, false);
	try {
		xhttp.send();
	}
	catch (err) {
		alert("Could not access the geocaching database via AJAX.\n"
			+ "Therefore, no POIs will be visible.\n");
	}
	return xhttp.responseXML;
}

function getAllValuesByTagName(xml, name) {
	return xml.getElementsByTagName(name);
}

function getFirstValueByTagName(xml, name) {
	return getAllValuesByTagName(xml, name)[0].childNodes[0].nodeValue;
}

function kindIsPhysical(kind) {
	return kind === "Traditional";
}


/* POI CLASS + Cache CLASS */

class POI {
	constructor(xml) {
		this.decodeXML(xml);
	}

	decodeXML(xml) {
		if (xml === null)
			return;
		this.name = getFirstValueByTagName(xml, "name");
		this.latitude = getFirstValueByTagName(xml, "latitude");
		this.longitude = getFirstValueByTagName(xml, "longitude");
	}

	installCircle(radius, color) {
		let pos = [this.latitude, this.longitude];
		let style = { color: color, fillColor: color, weight: 1, fillOpacity: 0.1 };
		this.circle = L.circle(pos, radius, style);
		this.circle.bindTooltip(this.name);
		map.add(this.circle);
	}
}

class Cache extends POI {
	constructor(xml) {
		super(xml);
		this.installMarker();
	}

	decodeXML(xml) {
		super.decodeXML(xml);
		this.code = getFirstValueByTagName(xml, "code");
		this.owner = getFirstValueByTagName(xml, "owner");
		this.altitude = getFirstValueByTagName(xml, "altitude");

		this.kind = getFirstValueByTagName(xml, "kind");
		this.size = getFirstValueByTagName(xml, "size");
		this.difficulty = getFirstValueByTagName(xml, "difficulty");
		this.terrain = getFirstValueByTagName(xml, "terrain");


		this.favorites = getFirstValueByTagName(xml, "favorites");
		this.founds = getFirstValueByTagName(xml, "founds");
		this.not_founds = getFirstValueByTagName(xml, "not_founds");
		this.state = getFirstValueByTagName(xml, "state");
		this.county = getFirstValueByTagName(xml, "county");

		this.publish = new Date(getFirstValueByTagName(xml, "publish"));
		this.status = getFirstValueByTagName(xml, "status");
		this.last_log = new Date(getFirstValueByTagName(xml, "last_log"));
	}

	installMarker() {
		let pos = [this.latitude, this.longitude];
		this.marker = L.marker(pos, { icon: map.getIcon(this.kind) });
		this.marker.bindTooltip(this.name);

		this.marker.bindPopup(this.getPopupContent());
		map.add(this.marker);
	}

	getPopupContent() {
		let name = this.name;
		let latitude = this.latitude;
		let longitude = this.longitude;
		let owner = this.owner;
		let size = this.size;
		let difficulty = this.difficulty;
		let code = this.code;
		let form =
			`<FORM>
				<H></H>
				<P>
				I'm the marker of the cache <b> ${name} </b><p> 
				<b> Latitude: </b> ${latitude} <p>  
				<b> Longitude: </b> ${longitude} '<p> 
				<b> Owner: </b>${owner} <p>  
				<b> Size: </b> ${size} <p> 
				<b> Difficulty: </b> ${difficulty} <p> 
				<P>
				<INPUT TYPE="button" VALUE="Geocaching" ONCLICK="openGeocaching('${code}');">
				<INPUT TYPE="button" VALUE="Street view" ONCLICK="openStreetView('${latitude}', '${longitude}');">
			 </FORM>`

		return form;
	}

	getLatitude() {
		return this.latitude;
	}

	getLongitude() {
		return this.longitude;
	}
}

function openGeocaching(code) {
	document.location = "https://coord.info/".concat(code);
}

function openStreetView(latitude, longitude) {
	document.location = "http://maps.google.com/maps?layer=c&cbll=".concat(latitude, ",", longitude);
}
/* CHACE SUB CLASSES */

/*
	Can have their location changed    
*/
class PhysicalCache extends Cache {

	constructor(xml) {
		super(xml);
	}

	setNewPosition(longitude, latitude) {
		this.longitude = longitude;
		this.latitude = latitude;
	}

	getPopupContent() {
		let name = this.name;
		let latitude = this.latitude;
		let longitude = this.longitude;
		let owner = this.owner;
		let size = this.size;
		let difficulty = this.difficulty;
		let code = this.code;
		let form =
			`<FORM>
		<H3>I'm the marker of the cache ${name} </H3>
		<P>
		<b> Latitude: </b> ${latitude} <p>  
		<b> Longitude: </b> ${longitude} <p> 
		<b> Owner: </b>${owner} <p>  
		<b> Size: </b> ${size} <p> 
		<b> Difficulty: </b> ${difficulty} <p> 
		<P>
		<INPUT TYPE="button" VALUE="Geocaching" ONCLICK="openGeocaching('${code}');">
		<P>
		<INPUT TYPE="button" VALUE="Street view" ONCLICK="openStreetView('${latitude}', '${longitude}');">
	 </FORM>`

		return form;
	}

}

class Traditional extends PhysicalCache {

	constructor(xml) {
		super(xml);
	}
}

class CustomTraditional extends Traditional {
	constructor(xml) {
		super(xml);
	}

	getPopupContent(){
		let name = this.name;
		let latitude = this.latitude;
		let longitude = this.longitude;
		let owner = this.owner;
		let size = this.size;
		let difficulty = this.difficulty;
		let code = this.code;
		let form =
			`<FORM>
		<H3>I'm the marker of the cache ${name} </H3>
		<P>
		<b> Latitude: </b> ${latitude} <p>  
		<b> Longitude: </b> ${longitude} <p> 
		<b> Owner: </b>${owner} <p>  
		<b> Size: </b> ${size} <p> 
		<b> Difficulty: </b> ${difficulty} <p> 
		<P>
		<INPUT TYPE="button" VALUE="Geocaching" ONCLICK="openGeocaching('${code}');">
		<P>
		<INPUT TYPE="button" VALUE="Street view" ONCLICK="openStreetView('${latitude}', '${longitude}');">
		<P>
		<INPUT TYPE="button" VALUE="Delete Cache" ONCLICK="delTradCache('${latitude}', '${longitude}')">
		<P>
		<INPUT TYPE="button" VALUE="Change location" ONCLICK="changeLocation(${this});">
	 </FORM>`
	
		return form;
	}
}


class Multi extends PhysicalCache {
	constructor(xml) {
		super(xml);
	}

	getPopupContent(){
		let name = this.name;
		let latitude = this.latitude;
		let longitude = this.longitude;
		let owner = this.owner;
		let size = this.size;
		let difficulty = this.difficulty;
		let code = this.code;
		let cache = this;
		let form =
			`<FORM>
		<H3>I'm the marker of the cache ${name} </H3>
		<P>
		<b> Latitude: </b> ${latitude} <p>  
		<b> Longitude: </b> ${longitude} <p> 
		<b> Owner: </b>${owner} <p>  
		<b> Size: </b> ${size} <p> 
		<b> Difficulty: </b> ${difficulty} <p> 
		<P>
		<INPUT TYPE="button" VALUE="Geocaching" ONCLICK="openGeocaching('${code}');">
		<P>
		<INPUT TYPE="button" VALUE="Street view" ONCLICK="openStreetView('${latitude}', '${longitude}');">
		<P>
		<INPUT TYPE="text" ID="lat" PLACEHOLDER="Insert new Latitude"><p>
		<INPUT TYPE="text" ID="lon" PLACEHOLDER="Insert new Longitude"><p>
		<INPUT TYPE="button" VALUE="Change location" ONCLICK=' alert("ola");changeLocation();'>
	 </FORM>`

		return form;
	}
}

class Mystery extends PhysicalCache {

	constructor(xml) {
		super(xml);
	}
}


class Earthcache extends Cache {
	constructor(xml) {
		super(xml);
	}
}


class Event extends Cache {
	constructor(xml) {
		super(xml);
	}
}


class CITO extends Cache {
	constructor(xml) {
		super(xml);
	}
}


class Mega extends Cache {
	constructor(xml) {
		super(xml);
	}
}

class Letterbox extends PhysicalCache {
	constructor(xml) {
		super(xml);
	}
}

class Virtual extends Cache {
	constructor(xml) {
		super(xml);
	}
}

class Webcam extends Cache {
	constructor(xml) {
		super(xml);
	}
}

class Wherigo extends Cache {
	constructor(xml) {
		super(xml);
	}
}




class Place extends POI {
	constructor(name, pos) {
		super(null);
		this.name = name;
		this.latitude = pos[0];
		this.longitude = pos[1];
		this.installCircle(CACHE_RADIUS, 'black');
	}
}

/* Map CLASS */

class Map {
	constructor(center, zoom) {
		this.lmap = L.map(MAP_ID).setView(center, zoom);
		this.addBaseLayers(MAP_LAYERS);
		this.icons = this.loadIcons(RESOURCES_DIR);
		this.caches = [];
		this.addedCaches = [];
		this.addClickHandler(e =>
			L.popup()
				.setLatLng(e.latlng)
				.setContent(this.getContent(e.latlng))
		);
		this.minLat = Number.MAX_VALUE;
		this.minLng = Number.MAX_VALUE;
		this.maxLat = Number.MIN_VALUE;
		this.maxLng = Number.MIN_SAFE_INTEGER;
		this.maxedout = false;

	}

	validCloseLocations(lat, lng) {
		let allCaches = this.caches.concat(this.addedCaches);
		let ca;
		let lati;
		let lngo;
		let distance;
		for (let i = 0; i < allCaches.length; i++) {
			ca = allCaches[i];
			lati = ca.getLatitude();
			lngo = ca.getLongitude();
			distance = haversine(lat, lng, lati, lngo) * 1000;
			if (distance < CACHE_RADIUS) {
				return false;
			}
		}
		return true;
	}

	validFarLocations(lat, lng) {
		let allCaches = this.caches;
		let ca;
		let lati;
		let lngo;
		let distance;
		for (let i = 0; i < allCaches.length; i++) {
			ca = allCaches[i];
			lati = ca.getLatitude();
			lngo = ca.getLongitude();
			distance = haversine(lat, lng, lati, lngo) * 1000;
			if (distance < CACHE_MAX_RADIUS) {
				return true;
			}
		}
		return false;
	}

	addNewCache(name, lat, lng, color) {
		if (this.validCloseLocations(lat, lng) && this.validFarLocations(lat, lng)) {
			let txt =
				`<cache>
		  <code>UNKNOWN</code>
		  <name>${name}</name>
		  <owner>User</owner>
		  <latitude>${lat}</latitude>
		  <longitude>${lng}</longitude>
		  <altitude>-32768</altitude>
		  <kind>Traditional</kind>
		  <size>UNKNOWN</size>
		  <difficulty>1</difficulty>
		  <terrain>1</terrain>
		  <favorites>0</favorites>
		  <founds>0</founds>
		  <not_founds>0</not_founds>
		  <state>UNKNOWN</state>
		  <county>UNKNOWN</county>
		  <publish>2000/01/01</publish>
		  <status>E</status>
		  <last_log>2000/01/01</last_log>
		</cache>`;
			let xml = txt2xml(txt);
			let c = new CustomTraditional(xml);
			c.installCircle(CACHE_RADIUS, color);
			this.addedCaches.push(c); //!! NAO ESTA A FAZER PUSH
		}
		else {
			alert("Invalid location");
		}
	}

	deleteCache(lat, lng) {
		for (let i = 0; i < this.addedCaches.length; i++) {
			if (this.addedCaches[i].getLatitude() == lat && this.addedCaches[i].getLongitude() == lng) {
				this.remove(this.addedCaches[i].marker);
				this.remove(this.addedCaches[i].circle);
				this.addedCaches.splice(i, 1);
			}
			else {
				alert("Invalid location");
			}
		}
	}


	getContent(latlng) {
		let array = latlng.toString().slice(7, -2).split(', ');
		let latitude = array[0];
		let longitude = array[1];;
		let form = `<FORM>
        <b> Latitude: </b> ${latitude} <p>  
        <b> Longitude: </b> ${longitude} 
        <P>
        <INPUT TYPE="button" VALUE="Street view" ONCLICK="openStreetView('${latitude}', '${longitude}');">
        <P>
        <INPUT TYPE="text" ID="name" PLACEHOLDER="Insert name" >
        <P>
        <INPUT TYPE="button" VALUE="Create new Cache" ONCLICK="addManualCache(form.name.value, '${latitude}', '${longitude}');">
     	</FORM>`
		return form;
	}

	addAutoCache() {
		if(this.maxedout) 
			alert('No more space to place caches!');
		else {
			let value = false;
			let lat;
			let lng;
			let minLatN = parseFloat(this.minLat);
			let maxLatN = parseFloat(this.maxLat);
			let minLngN = parseFloat(this.minLng);
			let maxLngN = parseFloat(this.maxLng);
			while (!value) {
				lat = (Math.random() * (maxLatN - minLatN)) + minLatN;
				lng = (Math.random() * (maxLngN - minLngN)) + minLngN;
				if (this.validCloseLocations(lat, lng) && this.validFarLocations(lat, lng)) {
					this.addNewCache('Automatic',lat, lng, 'blue');
					value = true;
				}
			}
		}
	}

	populate() {
		this.caches = this.loadCaches(RESOURCES_DIR + CACHES_FILE_NAME);
	}

	showFCT() {
		this.fct = new Place("FCT/UNL", MAP_INITIAL_CENTRE);
	}

	getIcon(kind) {
		return this.icons[kind];
	}

	getCaches() {
		return this.caches;
	}

	makeMapLayer(name, spec) {
		let urlTemplate = MAP_URL;
		let attr = MAP_ATTRIBUTION;
		let errorTileUrl = MAP_ERROR;
		let layer =
			L.tileLayer(urlTemplate, {
				minZoom: 6,
				maxZoom: 19,
				errorTileUrl: errorTileUrl,
				id: spec,
				tileSize: 512,
				zoomOffset: -1,
				attribution: attr
			});
		return layer;
	}

	addBaseLayers(specs) {
		let baseMaps = [];
		for (let i in specs)
			baseMaps[capitalize(specs[i])] =
				this.makeMapLayer(specs[i], "mapbox/" + specs[i]);
		baseMaps[capitalize(specs[0])].addTo(this.lmap);
		L.control.scale({ maxWidth: 150, metric: true, imperial: false })
			.setPosition("topleft").addTo(this.lmap);
		L.control.layers(baseMaps, {}).setPosition("topleft").addTo(this.lmap);
		return baseMaps;
	}

	loadIcons(dir) {
		let icons = [];
		let iconOptions = {
			iconUrl: "??",
			shadowUrl: "??",
			iconSize: [16, 16],
			shadowSize: [16, 16],
			iconAnchor: [8, 8], // marker's location
			shadowAnchor: [8, 8],
			popupAnchor: [0, -6] // offset the determines where the popup should open
		};
		for (let i = 0; i < CACHE_KINDS.length; i++) {
			iconOptions.iconUrl = dir + CACHE_KINDS[i] + ".png";
			iconOptions.shadowUrl = dir + "Alive.png";
			icons[CACHE_KINDS[i]] = L.icon(iconOptions);
			iconOptions.shadowUrl = dir + "Archived.png";
			icons[CACHE_KINDS[i] + "_archived"] = L.icon(iconOptions);
		}
		return icons;
	}

	//FEITO 
	getLimits() {
		let lat = 0;
		let lng = 0;
		for (const element of this.caches) {
			lat = parseFloat(element.getLatitude());
			lng = parseFloat(element.getLongitude());
			if (lat < this.minLat) {
				this.minLat = lat;
			} else if (lat > this.maxLat) {
				this.maxLat = lat;
			}
			if (lng < this.minLng) {
				this.minLng = lng;
			} else if (lng > this.maxLng) {
				this.maxLng = lng;
			}
		}
	}

	loadCaches(filename) {
		let xmlDoc = loadXMLDoc(filename);
		let xs = getAllValuesByTagName(xmlDoc, "cache");
		let caches = [];
		let kind = '';
		let c;
		if (xs.length === 0)
			alert("Empty cache file");
		else {
			for (let i = 0; i < xs.length; i++) { // Ignore the disables caches
				if (getFirstValueByTagName(xs[i], "status") === STATUS_ENABLED) {
					kind = getFirstValueByTagName(xs[i], "kind");
					switch (kind) {
						case 'Traditional':
							c = new Traditional(xs[i]);
							c.installCircle(CACHE_RADIUS, 'red');
							caches.push(c);
							break;
						case 'Multi':
							c = new Multi(xs[i]);
							c.installCircle(CACHE_RADIUS, 'red');
							caches.push(c);
							break;
						case 'Mystery':
							c = new Mystery(xs[i]);
							c.installCircle(CACHE_RADIUS, 'red');
							caches.push(c);
							break;
						case 'Earthcache':
							caches.push(new Earthcache(xs[i]));
							break;
						case 'Event':
							caches.push(new Event(xs[i]));
							break;
						case 'CITO':
							caches.push(new CITO(xs[i]));
							break;
						case 'Virtual':
							caches.push(new Virtual(xs[i]));
							break;
						case 'Letterbox':
							c = new Letterbox(xs[i]);
							c.installCircle(CACHE_RADIUS, 'red');
							caches.push(c);
							break;
						case 'Mega':
							caches.push(new Mega(xs[i]));
							break;
						case 'Webcam':
							caches.push(new Webcam(xs[i]));
							break;
						case 'Wherigo':
							caches.push(new Wherigo(xs[i]));
							break;
						default:
							caches.push(new Cache(xs[i]));
					}
				}
			}
		}
		return caches;
	}

	add(marker) {
		marker.addTo(map.lmap);
	}

	remove(marker) {
		marker.remove();
	}

	addClickHandler(handler) {
		let m = this.lmap;
		function handler2(e) {
			return handler(e).openOn(m);
		}
		return this.lmap.on('click', handler2);
	}

	addAllAutoCaches() {
		let n = 0;
		 //- CACHE_MAX_RADIUS;
		let finishLat = this.maxLat;// + CACHE_MAX_RADIUS;
		let finishLng = this.maxLng;// + CACHE_MAX_RADIUS;

		alert('tou');
		for (let startingLat = this.minLat ;startingLat <= finishLat; startingLat += 0.00025) {
			for(let startingLng = this.minLng;  startingLng <= finishLng; startingLng += 0.00025) {
				if (this.validCloseLocations(startingLat,startingLng) && this.validFarLocations(startingLat,startingLng)) {
					this.addNewCache('Automatic',startingLat, startingLng, 'blue');
					n++;
				}
				
			}
		}
		this.maxedout = true;
		alert('acabou com ' + n + ' caches adicionadas')
	}

	moveCache(cache, lat, lng) {
		if (this.validCloseLocations(lat, lng) && this.validFarLocations(lat, lng)){
			cache.setNewPosition(lat, lng);
		} else {
			alert('Invalid Position');
		}
	}

	getNumAddedCaches(){
        return this.addedCaches.length;
    }

    getNumOriginalCaches() {
        return this.caches.length;
    }
}


/* Some FUNCTIONS are conveniently placed here to be directly called from HTML.
   These functions must invoke operations defined in the classes, because
   this program must be written using the object-oriented style.
*/


function onLoad() {
	map = new Map(MAP_INITIAL_CENTRE, MAP_INITIAL_ZOOM);
	map.showFCT();
	map.populate();
	map.getLimits();
}

function addAutoCache() {
	map.addAutoCache()
}


function addManualCache(nome, latitude, longitude) {
	map.addNewCache(nome, latitude, longitude, 'green');
}

function txt2xml(txt) {
	let parser = new DOMParser();
	return parser.parseFromString(txt, "text/xml");
}

function delTradCache(latitude, longitude) {
	map.deleteCache(latitude, longitude);
}

function addAllAutoCaches(){
	map.addAllAutoCaches();
}

function changeLocation(cache, lat, lng){
		alert("La padentro!");
		alert(cache.getLatitude());
		//map.moveCache(cache, lat, lng);
	
}

function getNumAddedCaches() {
    return map.getNumAddedCaches();
}

function getNumOriginalCaches() {
    return map.getNumOriginalCaches();
}

function getPercentageOriginalCaches(){
    return map.getPercentageOriginalCaches();
}