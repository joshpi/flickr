$( document ).ready( function(){
	Helpers.detectBrowser();
	Main.init();
});

var Main = ( function(){

	var apiKey = "a5e95177da353f58113fd60296e1d250"; //"ac6ae04116ad3e3f2664b5429c5d511e"
	var apiSecret = "abaafa80dca58899";
	var userID = "132365033@N08";
	var page = 1;
	var data = [];
	var backupData = [];
	var numOfImagesToDisplay = 21;
	var numberOfColumns = 3;
	var calcImageSize = 0;
	var firstTime = false;

	//private functions
	function loadImages(){
		$.ajax( {
			type: "GET",
			dataType: "json",
			url: "https://api.flickr.com/services/rest/?method=flickr.people.getPublicPhotos&api_key=" + apiKey + "&user_id=" + userID + "&extras=title,tags,description,owner_name,icon_server,date_taken,views&page=" + page + "&format=json&nojsoncallback=1",
			complete: APIReturn
		} );
	}

	function APIReturn( returnData ){
		data = data.concat( returnData.responseJSON.photos.photo );
		if( parseFloat( returnData.responseJSON.photos.page ) + 1 <= returnData.responseJSON.photos.pages ){
			page++;
			loadImages();
		} else {
			//sort the data by most recent
			data = Helpers.sort( data, "mostrecent" );
			backupData = data;
			//enable advanced filters
			$( '.filterContainer select' ).change( dropdownChangeHandler );
			$( '.filterContainer input' ).bind( 'keyup click', searchHandler );
			$( '.filterContainer button' ).click( resetHandler );

			//add images to the page
			addImagesToPage();
		}
	}

	function addImagesToPage(){
		var i;
		//console.log( data );
		
		//figure out the proper size of the images and empty out the contents of the container
		if( !firstTime ) {
			calcImageSize = numberOfColumns * ( parseInt( $( '.container .flickr' ).css( 'border-left-width' ), 10 ) + parseInt( $( '.container .flickr' ).css( 'border-right-width' ), 10 ) );
			firstTime = true;
		}
		$( '.container' ).empty();

		//determine if we should show the load more button
		if( data.length > numOfImagesToDisplay ){
			$( '.load-more' ).removeClass( 'hide' );
			$( '.load-more a' ).click( loadMoreClickHandler );
		}

		for( i = 0; i < data.length; i++ ){
			var clonedObj = $( '.flickr', $( ".library" ) ).clone();
			var imageURL = 'https://farm' + data[i].farm + '.staticflickr.com/' + data[i].server + '/' + data[i].id + '_' + data[i].secret + '_b.jpg';
			$( '.user-img .imgContainer', clonedObj ).attr( 'style', 'background-image:url("' + imageURL + '"); width: ' + calculateImageSize() + 'px; height: ' + calculateImageSize() + 'px' );
			
			//add the meta information
			$( 'h2', clonedObj ).html( $.trim( data[i].title ) );
			$( '.user-icon', clonedObj ).attr( 'src', "http://c1.staticflickr.com/" + data[i].iconfarm + "/" + data[i].iconserver + "/buddyicons/"+ userID + "_l.jpg" )
			$( '.user-name', clonedObj ).html( $.trim( data[i].ownername ) );

			$( '.user-link', clonedObj ).attr( "href", "https://www.flickr.com/photos/" + userID );

			//add the click handler
			$( '.user-img', clonedObj ).click( imgClickHandler );

			//add the index value for the lightbox
			$( '.user-img', clonedObj ).attr( 'data-index', i );

			$( '.container' ).append( clonedObj );

			if( $( 'body' ).hasClass( 'tabletMobile' ) ){
				clonedObj.addClass( 'tabletMobile' );
			}

			if( i + 1 > numOfImagesToDisplay ){
				clonedObj.addClass( 'hide fadeOut' );
			}
		}
		$( '.container' ).append( $( '.library .clear' ).clone() );
		$( window ).trigger( 'load' ); //fire load so that it fixes the images on first time load
	}

	function loadMoreClickHandler() {
		var i = 0;
		while( i < numOfImagesToDisplay ){
			$( $( '.container .flickr.hide' )[0] ).removeClass( 'hide fadeOut' );
			i++;
		}

		if( $( '.container .flickr.hide' ).length == 0 ){
			$( '.load-more' ).addClass( 'hide' );
		}
		return false;
	}

	function imgClickHandler(){
		Helpers.createLightBox( onLightboxComplete( $( this ).attr( 'data-index' ) ) );
	}

	function onLightboxComplete( index ){
		$( '.mainLightboxImg' ).attr( "src", 'https://farm' + data[index].farm + '.staticflickr.com/' + data[index].server + '/' + data[index].id + '_' + data[index].secret + '_b.jpg' );
		$( 'h2', $( '.lightbox' ) ).html( $.trim( data[index].title ) );
		$( '.description', $( '.lightbox' ) ).html( $.trim( data[index].description._content ) );
		$( '.user-icon', $( '.lightbox' ) ).attr( 'src', "http://c1.staticflickr.com/" + data[index].iconfarm + "/" + data[index].iconserver + "/buddyicons/"+ userID + "_l.jpg" )
		$( '.user-name', $( '.lightbox' ) ).html( $.trim( data[index].ownername ) );
		$( '.user-link', $( '.lightbox' ) ).attr( "href", "https://www.flickr.com/photos/" + userID );
	}

	function calculateImageSize(){
		if( $( '.container .flickr' ).css( 'float' ) != "none" ){
			//width of the container + ( number of columns * image border size * 2 (for both sides) ) / number of columns
			return Math.floor( ( $( '.container' ).width() - calcImageSize ) / numberOfColumns );
		} else {
			return $( '.container' ).width();
		}
	}

	function hideImagesOnScreen( callback ){
		var i;
		for( i = 0; i < data.length; i++ ){
			$( $( '.container .flickr' )[i] ).bind( 'transitionend', function(){
				$( this ).remove();

				if( i + 1 >= data.length ){
					callback();
				}
			} ).addClass( 'fadeOut' );
		}
	}

	function searchHandler( evt ) {
		switch( evt.type ){
			case "click":
				if( $( this ).is( "input[type=button]" ) ){
					search( $( '.filterContainer input[type=text]' ).val() );
				}
				break;
			case "keyup" :
				if( evt.keyCode != 13 ){
					search( $( this ).val() );
				}
				break;
		}
	}

	function search( inputValue ){
		var tempData = [];
		var i;
		data = backupData;

		for( i = 0; i < data.length; i++ ){
			if( String( data[i].title ).indexOf( inputValue ) != -1 ){
				tempData.push( data[i] );
			}
		}
		
		data = tempData;
		hideImagesOnScreen( function(){
			addImagesToPage();
			data = backupData;
		});
		
	}

	function dropdownChangeHandler(){
		var dropdownValue = $( this ).val();
		hideImagesOnScreen( function(){
			data = Helpers.sort( data, dropdownValue );
			addImagesToPage();
		});
	}

	function resetHandler(){
		hideImagesOnScreen( function(){
			data = backupData;
			addImagesToPage();
		})
	}

	function resizeHandler(){
		$( '.container .user-img .imgContainer' ).css( {
			"width" : calculateImageSize(),
			"height" : calculateImageSize()
		} );

		if( $( '.nav-anchor' ).hasClass( 'opened' ) ){
			var calcHeight = $( '.advancedMenu' ).css( 'height', 'auto' ).outerHeight( true );
			$( '.advancedMenu' ).css( {
				'height' : 0, 
				'padding-bottom' : '10px' 
			} ).height( calcHeight );
		}
	}

	function backtoTopHandler(){
		$( 'body, html' ).animate( {
			scrollTop : 0
		}, 500 );
	}

	//public functions
	function init(){
		loadImages();
		$( window ).bind( 'resize orientationchange load', resizeHandler );
		$( '.nav-anchor' ).click( function(){
			if( $( this ).hasClass( 'closed' ) ){
				var calcHeight = $( '.advancedMenu' ).css( 'height', 'auto' ).outerHeight( true );
				$( '.advancedMenu' ).css( {
					'height' : 0, 
					'padding-bottom' : '10px' 
				} ).height( calcHeight );
				$( '.copy', $( this ) ).html( $( this ).attr( 'data-close' ) );
				$( '.close', $( this ) ).show();
				$( '.open', $( this ) ).hide();
				$( this ).removeClass( 'closed' ).addClass( 'opened' );
			} else if( $( this ).hasClass( 'opened' ) ){
				$( '.advancedMenu' ).attr( 'style', '' );
				$( '.copy', $( this ) ).html( $( this ).attr( 'data-open' ) );
				$( '.close', $( this ) ).hide();
				$( '.open', $( this ) ).show();
				$( this ).removeClass( 'opened' ).addClass( 'closed' );
			}
			return false;
		});

		$( '.back-to-top' ).click( backtoTopHandler )
	}

	return {
		init : init
	}

} )();

var Helpers = ( function(){

	function detectBrowser(){
		//adds the browser class to the body
		var className = "";
		var userAgent = navigator.userAgent || navigator.vendor || window.opera;
		var browser = "";
		var browserArray = new Array(
		    { browser: "Firefox", ua: "Firefox", shortForm: "ff", uaIdentity: "Firefox" },
			{ browser: "Internet Explorer", ua: "MSIE", shortForm: "ie", uaIdentity: "MSIE" },
			{ browser: "Internet Explorer", ua: "rv:", shortForm: "ie", uaIdentity: "rv" },
			{ browser: "Blackberry", ua: "BlackBerry", shortForm: "bb", uaIdentity: "Version" },
			{ browser: "Blackberry", ua: "RIM", shortForm: "bb", uaIdentity: "Version" },
			{ browser: "Blackberry", ua: "BB", shortForm: "bb", uaIdentity: "." },
			{ browser: "Dolphin", ua: "Dolfin", shortForm: "Dolphin", uaIdentity: "Dolfin" },
			{ browser: "Opera", ua: "Opera", shortForm: "opera", uaIdentity: "Version" },
			{ browser: "iPhone", ua: 'iPhone OS', shortForm: "iPhone", uaIdentity: "iPhone OS" },
			{ browser: "Chrome", ua: "Chrome", shortForm: "chrome", uaIdentity: "Chrome" },
			{ browser: "Safari", ua: "Safari", shortForm: "safari", uaIdentity: "Version" }
		);

		var i;
		var j;
		var version;
		for( i = 0; i < browserArray.length; i++ ){
			if( userAgent.indexOf( browserArray[i].ua ) != -1 ){
				browser = browserArray[i];
				version = userAgent.indexOf( browserArray[i].uaIdentity );
				if( version == -1 ){
					version = 0; //cannot find version
				}
				className = browserArray[i].shortForm;
				if( !isNaN( parseFloat( userAgent.substring( version + browserArray[i].uaIdentity.length + 1 ) ) ) ){
					className += " " + browserArray[i].shortForm + parseFloat( userAgent.substring( version + browserArray[i].uaIdentity.length + 1 ) ).toFixed();
				}
				break;
			}
		}

		//detect if the use is on mobile and or tablet
		//regex check
		if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(userAgent)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(userAgent.substr(0,4))) {
			className += " tabletMobile";
		}

		if( typeof window.orientation !== 'undefined' ) {
			className += " tabletMobile";
		}
		$( "body" ).addClass( className );
	}

	function createLightBox( callback ){
		if( $( '.websiteContainer .lightbox' ).length != 0 ) return false;

		var lightbox = $( '.lightbox', $( '.library' ) ).clone();
		lightbox.addClass( 'fadeOut' );
		$( '.websiteContainer' ).append( lightbox );
		//throw a delay for the CSS animation
		setTimeout( function(){
			lightbox.removeClass( 'fadeOut' );
			$( '.lightboxBackground, .close-btn' ).click( destroyLightBox );
			callback;
		}, 100 );
	}

	function destroyLightBox(){
		$( '.websiteContainer .lightbox' ).addClass( 'fadeOut' );
		$( '.websiteContainer .lightbox' ).bind( 'transitionend', function(){
			$( '.websiteContainer .lightbox' ).remove();
		} );
	}

	function sort( array, type ){
		return array.sort( function( a, b ){
			switch( type ){
				case "mostrecent" :
					if( a.datetaken > b.datetaken ) { //if the first date is earlier than the second date, move down
						return -1; 
					} else if( a.datetaken < b.datetaken ) { //if the first date is later than the second date, move up
						return 1;
					} else { //same value
						return 0;
					}
					break;
				case "alphabetical" :
					if( a.title > b.title ) {
						return 1; 
					} else if( a.title < b.title ) {
						return -1;
					} else { //same value
						return 0;
					}
					break;
				case "oldest" :
					if( a.datetaken > b.datetaken ) { //if the first date is earlier than the second date, move down
						return 1; 
					} else if( a.datetaken < b.datetaken ) { //if the first date is later than the second date, move up
						return -1;
					} else { //same value
						return 0;
					}
					break;
			}
		});
	}

	return {
		detectBrowser : detectBrowser,
		createLightBox : createLightBox,
		destroyLightBox : destroyLightBox,
		sort : sort
	}
})();