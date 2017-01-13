var map;

// Initialize map
var initMap = function() {
  var styles = [
          {
            featureType: 'water',
            stylers: [
              { color: '#0D6B87' }
            ]
          },{
            featureType: 'administrative',
            elementType: 'labels.text.stroke',
            stylers: [
              { color: '#fffffh' },
              { weight: 6 }
            ]
          },{
            featureType: 'administrative',
            elementType: 'labels.text.fill',
            stylers: [
              { color: '#e85113' }
            ]
          },{
            featureType: 'road.highway',
            elementType: 'geometry.stroke',
            stylers: [
              { color: '#efe9e4' },
              { lightness: -40 }
            ]
          },{
            featureType: 'transit.station',
            stylers: [
              { weight: 9 },
              { hue: '#e85113' }
            ]
          },{
            featureType: 'road.highway',
            elementType: 'labels.icon',
            stylers: [
              { visibility: 'off' }
            ]
          },{
            featureType: 'water',
            elementType: 'labels.text.stroke',
            stylers: [
              { lightness: 100 }
            ]
          },{
            featureType: 'water',
            elementType: 'labels.text.fill',
            stylers: [
              { lightness: -100 }
            ]
          },{
            featureType: 'poi',
            elementType: 'geometry',
            stylers: [
              { visibility: 'on' },
              { color: '#f0e4d3' }
            ]
          },{
            featureType: 'road.highway',
            elementType: 'geometry.fill',
            stylers: [
              { color: '#A9A6A4' },
              { lightness: -25 }
            ]
          }
  ];
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: -36.848466, lng: 174.763332},
    zoom: 11,
    styles: styles
  });

  ko.applyBindings(new viewModel());
}

// Added error handling in case map is not loading
var googleError = function() {
    $('body').prepend('<h5 class="alert alert-danger">Google Maps did not load. Please try refreshing the page!</h5>');
}

var yelpData = function(brewery) {
  // Begin OAuth signature generation
  // This is based on a post by Mark Nguyen (Udacity Coach) - https://discussions.udacity.com/t/im-having-trouble-getting-started-using-apis/13597/2

  function nonce_generate() {
    return (Math.floor(Math.random() * 1e12).toString());
  }

  var yelp_url = 'https://api.yelp.com/v2/business/' + brewery.yelpID();
  var YELP_KEY = "HAyATmvkP3NpGE8B8Jwdsg";
  var YELP_TOKEN = "VZSv7WoPH6465r83mevwehzr1r65i5oN";
  var YELP_KEY_SECRET = "Arbj1AvTSrHzodlXGfvtNejwbiw";
  var YELP_TOKEN_SECRET = "grYVZwgHiF_WF7xG_2a2H1UmmVQ";

  var oauth_parameters = {
    oauth_consumer_key: YELP_KEY,
    oauth_token: YELP_TOKEN,
    oauth_nonce: nonce_generate(),
    oauth_timestamp: Math.floor(Date.now()/1000),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_version : '1.0',
    callback: 'cb' // This is crucial to include for jsonp implementation in AJAX or else the oauth-signature will be wrong.
  };

  var encodedSignature = oauthSignature.generate('GET',yelp_url, oauth_parameters, YELP_KEY_SECRET, YELP_TOKEN_SECRET);
  oauth_parameters.oauth_signature = encodedSignature;

  // End OAuth signature generation

  // Set Ajax request parameters
  var ajax_parameters = {
    url: yelp_url,
    data: oauth_parameters,
    cache: true, // Prevent jQuery from adding on a cache-buster parameter "_=23489489749837", thus invalidating the oauth-signature
    dataType: 'jsonp',
    success: function(response) {
      // Populate the info window with data from the Yelp API
      $('#' + brewery.yelpID() + '-img').attr('src', response.image_url).attr('alt', response.name);
      $('#' + brewery.yelpID() + '-heading').text(response.name);
      $('#' + brewery.yelpID() + '-address').text(response.location.address);
      $('#' + brewery.yelpID() + '-rating').attr('src', response.rating_img_url_small).attr('alt', 'Rating: ' + response.rating);
      $('#' + brewery.yelpID() + '-description').text(response.snippet_text);
      $('#' + brewery.yelpID() + '-link').attr('href', response.url).removeClass('hidden');
    },
    error: function() {
      // In case there is an error with the request to Yelp API, display this meesage
      $('#' + brewery.yelpID() + '-description').text('Failed to load Yelp data. Please try later.').addClass("alert-danger");
    }
  };

  // Send Ajax request
  $.ajax(ajax_parameters);
};

// This method animates the marker, shows the info window in Google maps and
// calls the Yelp API to populate the info window with data about the brewery
var infoWindowShow = function(brewery){
  brewery.infowindow().open(map, brewery.marker());
  brewery.marker().setAnimation(google.maps.Animation.BOUNCE);
  window.setTimeout(function() {
    brewery.marker().setAnimation(null);
  }, 2000);
  yelpData(brewery);
};

var Brewery = function(data) {
  // The brewery object where the data is loaded from brewerysDetails
  var self = this;
  self.name = ko.observable(data.name);
  self.yelpID = ko.observable(data.yelpID);
  self.lat = ko.observable(data.lat);
  self.lng = ko.observable(data.lng);
  // This boolean determines if the brewery is visible when we filter the list
  self.visible = ko.observable(true);

  // Initialize the map marker
  self.marker = ko.observable(
    new google.maps.Marker({
      position: {lat: self.lat(), lng: self.lng()},
      map: map,
      title: self.name(),
      animation: google.maps.Animation.DROP
    })
  );

  // Initialize the map infowindow that will display the Yelp data
  self.infowindow = ko.observable(
    new google.maps.InfoWindow({
      content:
        '<div class="media">' +
        '  <div class="media-left"><img id="' + self.yelpID() + '-img" class="media-object, image" src="" alt=""></div>' +
        '  <div class="media-body">' +
        '    <h4 id="' + self.yelpID() + '-heading" class="media-heading">' + self.name() + '</h4>' +
        '    <p id="' + self.yelpID() + '-address"></p>' +
        '    <img id="' + self.yelpID() + '-rating" src="" alt=""><br>' +
        '    <span id="' + self.yelpID() + '-description">Loading Yelp data ... please wait.</span><br>' +
        '    <a id="' + self.yelpID() + '-link" href="" class="hidden" target="_blank">Read more on <b>Yelp</b></a>' +
        '  </div>' +
        '</div>'
    })
  );
};

var viewModel = function() {
  var self = this;

  self.brewerys = ko.observableArray([]);
  self.selectedBrewery = ko.observable();
  self.filtertext = ko.observable("");
  // This tells filtertext to only nofify of a value change every 500ms so it
  // does not call the filterBrewerys method with every character input.
  self.filtertext.extend({
    rateLimit: {
      timeout: 500,
      method: "notifyWhenChangesStop"
    }
  });

  self.handleInfoWindow = function(breweryObj){
    if (self.selectedBrewery()){
      self.selectedBrewery().infowindow().close();
    }
    self.selectedBrewery(breweryObj);
    infoWindowShow(breweryObj);
  };

  // Populate the brewerys array with Brewery objects that use data from brewerysDetails.
  // Also sets a click event on the marker, so when it is clicked it behaves like the list button.
  brewerysDetails.sort(function(a, b) { return a.name > b.name;});
  brewerysDetails.forEach(function(item){
    var breweryObj = new Brewery(item);
    self.brewerys.push(breweryObj);

    breweryObj.marker().addListener('click', function() {
      self.handleInfoWindow(breweryObj);
    });
  });

  // If the button in the list is clicked then hide current infowindow (if any)
  // and show the selected brewery info window
  self.showItem = function(brewery){
    self.handleInfoWindow(brewery);
  };

  // This method looks for the user input in each of the brewerys name.
  // If found, it sets the list button visible and the marker on the map,
  // otherwise it hides the list button, the marker and info window (if any).
  self.filterBrewerys = function(){
    self.brewerys().forEach(function (item) {
      var name = item.name();
      var ft = self.filtertext();
      if ( name.toLowerCase().search(ft.toLowerCase()) == -1 ){
        item.visible(false);
        item.infowindow().close();
        item.marker().setVisible(false);
      } else {
        item.visible(true);
        item.marker().setVisible(true);
      }
    });
  };
  // This tells KO to call filterBrewerys each time filtertext is changed
  self.filtertext.subscribe(self.filterBrewerys);
};
