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
	alert("Going to geocaching");
	document.location = "https://coord.info/".concat(code);
}

//funcional mas nao quer trabalhar
function openStreetView(latitude, longitude) {
	alert("Going to street view");
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
		<P>
		<INPUT TYPE="button" VALUE="Change location" ONCLICK="changeLocation(${this});">
	 </FORM>`

		return form;
	}

}
/*
	Geocache Tradicional
	Este é o tipo original de geocache e o mais simples. Estas geocaches serão um 
	recipiente nas coordenadas fornecidas. O tamanho pode variar, mas no mínimo 
	todas estas geocaches irão ter um livro de registos. Os recipientes maiores 
	podem conter itens para troca e trackables.

	TODO
	Tells directly the location
	Can be created -> changable location, temporary, deletable
	The loaded caches cannot be changed or deleted
	Physical known location 
	Must be in a 400 meters range whithin other loaded cache but not 161 meters or less
*/
class Traditional extends PhysicalCache {

	constructor(xml) {
		super(xml);
	}
}

/*
	TODO

	Multi-Cache
	Estas geocaches envolvem duas ou mais localizações, sendo a localização final um 
	recipiente físico com um livro de registos. Existem muitas variações, mas a maioria 
	das Multi-Caches têm uma pista para encontrar o segundo recipiente, a segunda tem uma pista 
	para o terceiro e por aí adiante.
*/
class Multi extends PhysicalCache {
	constructor(xml) {
		super(xml);
	}
}

/*
	TODO

Geocaches Mistério ou Puzzle
O tipo mais "geral" dos tipos de caches, esta forma de geocache pode envolver complicados puzzles 
que tem que ser resolvidos para determinar as coordenadas. As caches Mistério/Puzzle muitas vezes
 tornam-se o palco de novos tipos de geocache que não cabem em outras categorias.
*/
class Mystery extends PhysicalCache {

	constructor(xml) {
		super(xml);
	}
}

/*
	TODO

EarthCache
Uma Earthcache é um local especial que as pessoas podem visitar para aprender alguma característica
da geociência da nossa Terra. As páginas das EarthCaches incluem uma série de notas educacionais 
juntamente com as coordenadas do local. Os visitantes das EarthCaches podem ver como o nosso 
planeta se formou através de processos geológicos, como gerimos os seus recursos e como os 
cientistas recolhem dados para investigar a Terra. Tipicamente, para registar uma Earthcache, 
precisa de responder a algumas questões observando uma localização geológica. Para mais informações
acerca das Earthcaches visite http://www.earthcache.org/.
*/
class Earthcache extends Cache {
	constructor(xml) {
		super(xml);
	}
}

/*
	TODO

	Evento
Um Evento é uma reunião de geocachers locais ou de organizações de geocaching. A página do Evento 
especifica a hora do evento e fornece as coordenadas da sua localização. Depois do evento ter 
terminado, é arquivado.
*/
class Event extends Cache {
	constructor(xml) {
		super(xml);
	}
}

/*
	TODO

	Evento Cache In Trash Out (CITO)
O Cache In Trash Out é a iniciativa ambiental suportada pela comunidade do geocaching. O principal
objectivo deste programa é limpar e preservar as áreas naturais que apreciamos enquanto praticamos
geocaching. Estes eventos são encontros de geocachers que se focam na remoção de lixo, remoção de
espécies invasivas, plantação de árvores e vegetação e construção de trilhos.
*/
class CITO extends Cache {
	constructor(xml) {
		super(xml);
	}
}

/*
	TODO

	Mega-Evento
Um Mega-Evento é uma Geocache Evento em que participam mais de 500 pessoas. Muitos Mega-Eventos 
oferecem aos geocachers um dia de actividades planeadas. Existem muitas vezes vários dias de 
actividades adicionais à volta de um Mega-Evento. Estes grandes eventos atraem geocachers de todo
o mundo e normalmente realizam-se anualmente.
*/
class Mega extends Cache {
	constructor(xml) {
		super(xml);
	}
}

/*
	TODO

	Letterbox Híbrida
Uma "letterbox" é uma forma de caça ao tesouro, usando pistas em vez de coordenadas. Em alguns 
casos, porém, o autor criou também uma geocache e publicou as suas coordenadas no Geocaching.com,
criando uma "letterbox hybrid". Este tipo de caches tem no interior um carimbo que é suposto 
manter-se no interior do recipiente e que é utilizado apenas para que os praticantes possam 
registar a sua visita. Para saber mais sobre o letterboxing, visite Letterboxing na América do
Norte.
*/
class Letterbox extends PhysicalCache {
	constructor(xml) {
		super(xml);
	}
}

/*
	TODO

	Geocache Virtual
Uma Geocache Virtual é sobre descobrir uma localização em vez de descobrir um recipiente. 
Os requisitos para fazer um registo de uma Geocache Virtual variam - pode ser-lhe pedido que
responda a uma pergunta acerca de uma localização, tirar uma fotografia, completar uma tarefa,
etc... Em qualquer dos casos, deve visitar as coordenadas antes de poder fazer o seu registo.
Apesar de muitas localizações serem interessantes, uma Geocache Virtual deve ser invulgar o 
suficiente para garantir que se registe uma visita.

As Geocaches Virtuais são consideradas waymarks no Waymarking.com.
*/
class Virtual extends Cache {
	constructor(xml) {
		super(xml);
	}
}

/*
	TODO

	Geocache Webcam
Estas são geocaches que usam webcams existentes que podem monitorizar várias áreas como parques 
ou complexos de negócios. A ideia é que consiga ficar à frente da câmara e guardar uma captura 
de ecrã do site onde a imagem da câmara está a ser exibida de forma a poder registar que a 
encontrou. Novas geocaches webcam podem ser encontradas na Categoria Web Camera em Waymarking.com.
*/
class Webcam extends Cache {
	constructor(xml) {
		super(xml);
	}
}

/*
	TODO

	Geocaches Wherigo™
Wherigo é um conjunto de ferramentas para criar e jogar aventuras com GPS no mundo real. Ao 
integrar a experiência Wherigo (carregada a partir de um ficheiro denominado "cartucho") com a 
procura de uma cache, o geocaching torna-se uma actividade ainda mais interessante e rica, 
permitindo a interacção com elementos físicos e virtuais (objectos e personagens). Para jogar um 
cartucho Wherigo é necessário um receptor GPS compatível. Mais informações em Wherigo.com.
*/
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
		// "You clicked the map at " + e.latlng.toString() +
		//'<button OnClick= openStreetView()"">Street View</button>' + '&nbsp;&nbsp;&nbsp;&nbsp;'
		//+ '<button OnClick="createNewCache(e.latlng.toString())">Create New Cache</button>'

		// ! Fazer split de latlng para ter latitude e longitude, e introduzir nos argumentos
		// ! Fazer um form
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
			if (distance < CACHE_MAX_RADIUS) {
				return true;
			}
		}
		return false;
	}

	addNewCache(lat, lng, color) {
		if (this.validCloseLocations(lat, lng) && this.validFarLocations(lat, lng)) {
			let txt =
				`<cache>
		  <code>UNKNOWN</code>
		  <name>UNKNOWN</name>
		  <owner>UNKNOWN</owner>
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
			let c = new Traditional(xml);
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
        <INPUT TYPE="button" VALUE="Create new Cache" ONCLICK="addManualCache('${latitude}', '${longitude}');">
     	</FORM>`
		return form;
	}

	addAutoCache() {
		alert('antes let value');
		let value = false;
		alert('antes while');
		while (!value) {
			let lat = (Math.random() * (this.maxLat - this.minLat)) + this.minLat;
			let lng = (Math.random() * (this.maxLng - this.minLng)) + this.minLng;
			alert(lat);
			alert(lng);
			if (this.validCloseLocations(lat, lng) && this.validFarLocations(lat, lng)) {
				this.addNewCache(lat, lng, 'blue');
				value = true;
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

	getLimits() {
		let lat;
		let lng;
		this.minLat = Number.MAX_VALUE;
		this.minLng = Number.MAX_VALUE;
		this.maxLat = Number.MIN_VALUE;
		this.maxLng = Number.MIN_VALUE;
		for (let i = 0; i < this.caches.length; i++) {
			lat = this.caches[i].getLatitude();
			lng = this.caches[i].getLongitude();
			if (lat < minLat) {
				this.minLat = lat;
			}
			if (lng < minLng) {
				this.minLng = lng;
			}
			if (lat > maxLat) {
				this.maxLat = lat;
			}
			if (lng > maxLng) {
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
					//alert("KIND: " + kind);
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


function addManualCache(latitude, longitude) {
	map.addNewCache(latitude, longitude, 'green');
}

function txt2xml(txt) {
	let parser = new DOMParser();
	return parser.parseFromString(txt, "text/xml");
}

function delTradCache(latitude, longitude) {
	map.deleteCache(latitude, longitude);
}

