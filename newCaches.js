/* New Caches

Aluno 1: 59837 Bárbara Correia
Aluno 2: 60044 Gonçalo Rodrigues 

Comment:

Das 6 'features' pedidas, 5 delas foram completamente implementadas:
	
	1.	Das caches criadas, as derivadas da tradução do xml sao criadas com um circulo de 
	cor vermelha;
	As caches criadas manualmente, usando o painel na esquerda do ecra ou 'clickando' num ponto sem 
	cache do mapa, sao criadas com um circulo de cor verde e as caches criadas com um processo 
	automatico, sendo só uma cache com coordenadas obtidas pseudo aleatoriamente ou sendo todas as
	caches possiveis, sao criadas com um circulo de cor verde. Todas as outras caches que nao tenham
	localização fisica ou que nao correspondam as caches dos tipos: Traditional, Multi, LetterBox ou 
	Mystery, sao criadas sem circulo colorido.

	2. 	Ao 'clickar' num icon de uma cache varias opçoes aparecem:

		0. 	Dados basicos sobre a cache como o nome, as coordenadas, o dono, o tamanho e a
		dificuldade.

		1.	É apresentado um botão que redireciona a pagina atual para a pagina geocaching da cache.

		2. 	É também apresentado um botão que redireciona a pagina atual para do google maps nas 
		coordenadas da cache, em modo street view.

		3. Este ponto não foi implementado na sua totalidade. O objetivo de permitir mudar a 
		localização de caches de tipo Multi, Mystery ou LetterBox e de caches Tradicionais criadas
		manual ou automaticamente não foi alcançado. O grupo somente conseguiu implementar a 
		funcionalidade de mudar a localização de caches criadas manual ou automaticamente,
		criando e eliminando a cache em questão em vez de simplesmente mudar a sua localização, 
		visto que para o grupo não é justificavel tal complexidade. O resto deste ponto não foi
		implementado devido à falta de tempo assim como à falta de soluções simples e/ou de bom
		codigo. Uma das opções que o grupo ponderou tomar, mas devido aos pontos acima referidos
		não chegou a faze-lo, foi na class PhysicalCache, que engloba as caches dos tipos 
		Multi, Mystery e LetterBox, modificar o metodo changePosition, visto que este necessita de
		criar uma cache nova com todas as informações que estas caches tem, o que se tornou bastante
		complexo. Outra teria sido não eliminar e adicionar as caches mas sim tentar move-las no 
		mapa sem termos de criar objetos de acordo com o xml base de tal cache.

		4. 	Nas caches criadas manualmente ou automaticamente, é apresentado um botão que 
		possibilita a remoção da cache.

	3. 	Ao 'clickar' numa posição sem cache atribuida, aparece um pop up com as coordenadas e com
	os seguintes botões: 

		1. 	É apresentado um botão que redireciona a pagina atual para a pagina do google maps nas
		respetivas coordenadas, em modo street view.

		2.	É apresentado uma caixa input de text que juntamente com um botão que se segue permite 
		adicionar uma cache nas respetivas coordenadas, caso não seja verificado nenhum impedimento

	4. 	No canto inferior da aba posicionada na parte esquerda do ecrã, é possivel observar alguns
	dados estatisticos interessantes (mediante a opinião do grupo), 
	que são atualizados em "tempo real".

	5. 	No mesmo painel referido no ponto 4, é apresentado um botão que permite gerar um ponto 
	aleatório no mapa, com recurso a numeros pseudo-aleatorios.
	
	6. 	Ainda no mesmo painel referido nos pontos 4 e 5, é apresentado um botão que gera todos as
	caches possiveis de criar no mapa, seguindo as regras de manter a distancia minima de 
	161 metros de qualquer cache e a distancia maxima de 400 metros de
	pelo menos uma cache original.
	   	Esta funcionalidade é realizada pelo seguintes passos:

			1. Ao ser criado o mapa, são calculados os limites maximos e minimos da latitude e 
			da longitude. (função getLimits())

			2. Ao 'clickar' no botão, é chamada a função addAllAutoCaches() e de seguida o metodo, 
			da classe map, addAllAutoCaches().

			3. Neste metodo são usados 2 for's que correm o mapa como se fosse uma grelha. Um 'for' 
			corresponde às latitudes possiveis e o outro às longitudes possiveis.

			4. Com isto em cada combinação de latitude-longitude possivel é verificado sem é 
			possivel adicionar uma cache e ,caso se verifique, uma cache é adicionada.





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

/* Esta variavel foi criada para fins estatisticos e de simplicidade de codigo */
let numTradC = 0;

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
		this.id = cacheID++;
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

	/* Metodos adicionados */
	getID() {
		return this.id;
	}

	getName() {
		return this.name;
	}

	getAltitude() {
		return this.altitude;
	}

	getFavorites() {
		return this.favorites;
	}
	
	getLatitude() {
		return this.latitude;
	}

	getLongitude() {
		return this.longitude;
		
	}
		/* Metodo criado para simplificar e melhorar a leitura do metodo installMarker 
		tal como melhorar a extensibilidade do codigo visto que este metodo é modificado
	pelas subclasses desta class e permite que o metodo installMarker permaneça inalterado */
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

		installMarker() {
			let pos = [this.latitude, this.longitude];
			this.marker = L.marker(pos, { icon: map.getIcon(this.kind) });
			this.marker.bindTooltip(this.name);
			this.marker.bindPopup(this.getPopupContent());
			map.add(this.marker);
		}
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
		<INPUT TYPE="text" ID="lat" PLACEHOLDER="Insert new Latitude"><p>
		<INPUT TYPE="text" ID="lon" PLACEHOLDER="Insert new Longitude"><p>
		<INPUT TYPE="button" VALUE="Change location" ONCLICK="changeLocation('${latitude}', '${longitude}', form.lat.value, form.lng.value);">
	 </FORM>`

		return form;
	}

}

class Traditional extends PhysicalCache {

	constructor(xml) {
		super(xml);
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
}

class CustomTraditional extends Traditional {
	constructor(xml) {
		super(xml);
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
		<INPUT TYPE="text" ID="lat" PLACEHOLDER="Insert new Latitude"><p>
		<INPUT TYPE="text" ID="lon" PLACEHOLDER="Insert new Longitude"><p>
		<INPUT TYPE="button" VALUE="Change location" 
			ONCLICK="changeCustomTradLocation('${name} ',' ${latitude} ',' ${longitude} ',
			 form.lat.value, form.lon.value);"> <p>
		<INPUT TYPE="button" VALUE="Delete Cache" ONCLICK="delTradCache('${latitude}', '${longitude}')">
        <P>
	 </FORM>`

		return form;
	}
}

function changeCustomTradLocation(name, oldLat, oldLng, newLat, newLng) {
	map.changeCustomTradLocation(name, oldLat, oldLng, newLat, newLng);
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


	changeCustomTradLocation(name, oldLat, oldLng, newLat, newLng) {
		if(this.addNewCache(name, newLat, newLng, 'green') === 1) {
			this.deleteCache(parseFloat(oldLat), parseFloat(oldLng));
		}
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
			this.addedCaches.push(c); 
			document.getElementById('statistic2').textContent++;
			numTradC++;
			return 1;
		}
		else {
			alert("Invalid location");
			return 0;
		}
	}

	deleteCache(lat, lng) {
		for (let i = 0; i < this.addedCaches.length; i++) {
			if (this.addedCaches[i].getLatitude() == lat && this.addedCaches[i].getLongitude() == lng) {
				this.remove(this.addedCaches[i].marker);
				this.remove(this.addedCaches[i].circle);
				this.addedCaches.splice(i, 1);
				document.getElementById('statistic2').textContent--;
				numTradC--;
				return;
			}
			
		}
		alert('Invalid Location');
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
		if (this.maxedout)
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
					this.addNewCache('Automatic', lat, lng, 'blue');
					this.lmap.flyTo(new L.LatLng(lat, lng));
					value = true;
				}
			}
		}
	}

	populate() {
		this.caches = this.loadCaches(RESOURCES_DIR + CACHES_FILE_NAME);
		updateStats();
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

	/* Metodo criado para estabelecer os limites da longitude e latitude permitidos
	e para facilitar a leitura*/
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


	/* Este metodo foi modificado com a implementação de um switch para permitir a diferenciação 
	dos tipos de caches logo na sua criação e adição ao programa tal como a determinaçao de 
	algumas variaveis com fins estatisticos */
	loadCaches(filename) {
		let xmlDoc = loadXMLDoc(filename);
		let xs = getAllValuesByTagName(xmlDoc, "cache");
		let caches = [];
		let kind = '';
		let c;
		let highest = 0;
		let highName;
		let favName;
		let favs = 0;
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
							numTradC++;
							break;
						case 'Multi':
						case 'Mystery':
						case 'Letterbox':
							c = new PhysicalCache(xs[i]);
							c.installCircle(CACHE_RADIUS, 'red');
							caches.push(c);
							break;
						default:
							caches.push(new Cache(xs[i]));
					}
					document.getElementById('statistic1').textContent++;
					if(c.getAltitude() >highest) {
						highest = c.getAltitude();
						highName = c.getName();
					}
					if(c.getFavorites() > favs) {
						favs = c.getFavorites();
						favName = c.getName();
					}
				}
			} document.getElementById('statistic5').textContent = highName;
			document.getElementById('statistic6').textContent = favName;
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

	/* Metodo criao para gerar o maximo de caches criadas automaticamente possivel */
	addAllAutoCaches() {
		let n = 0;
		//- CACHE_MAX_RADIUS;
		let finishLat = this.maxLat;// + CACHE_MAX_RADIUS;
		let finishLng = this.maxLng;// + CACHE_MAX_RADIUS;

		alert('tou');
		for (let startingLat = this.minLat; startingLat <= finishLat; startingLat += 0.00025) {
			for (let startingLng = this.minLng; startingLng <= finishLng; startingLng += 0.00025) {
				if (this.validCloseLocations(startingLat, startingLng) && this.validFarLocations(startingLat, startingLng)) {
					this.addNewCache('Automatic', startingLat, startingLng, 'blue');
					n++;
				}

			}
		}
		this.maxedout = true;
		alert('acabou com ' + n + ' caches adicionadas')
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

/* Função que adiciona uma cache automaticamente e atualiza a estatistica */
function addAutoCache() {
	map.addAutoCache();
	updateStats();
}

/* Função que adiciona uma cache manualmente e atualiza a estatistica */
function addManualCache(nome, latitude, longitude) {
	map.addNewCache(nome, latitude, longitude, 'green');
	updateStats();
}

function txt2xml(txt) {
	let parser = new DOMParser();
	return parser.parseFromString(txt, "text/xml");
}

/* Função que elimina uma cache e atualiza a estatistica */
function delTradCache(latitude, longitude) {
	map.deleteCache(latitude, longitude);
	updateStats();
}


/* Função que adiciona o maximo de caches possiveis, automaticamente */
function addAllAutoCaches() {
	map.addAllAutoCaches();
	updateStats();
}

/* Função que atualiza a estatistica */
function updateStats() {
	let a = parseInt(document.getElementById('statistic1').textContent);
	let b = parseInt(document.getElementById('statistic2').textContent);
	document.getElementById('statistic3').textContent = ((a / (a+b))*100).toFixed(2);
	document.getElementById('statistic4').textContent = ((numTradC / (a+b))*100).toFixed(2);
}

/* Funçao que redireciona a pagina atual para uma pagina geocaching */
function openGeocaching(code) {
	document.location = "https://coord.info/".concat(code);
}

/* Função que redireciona a pagina atual para uma pagina do google maps, em modo street view*/
function openStreetView(latitude, longitude) {
	document.location = "http://maps.google.com/maps?layer=c&cbll=".concat(latitude, ",", longitude);
}