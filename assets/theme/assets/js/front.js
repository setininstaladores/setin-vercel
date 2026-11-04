/**
 * SETIN – comportamiento del front.
 * 1. Sombra en la cabecera fija al hacer scroll.
 * 1b. Altura de la banda amarilla (para que la portada quepa en una pantalla).
 * 1c. Mapa del mundo interactivo.
 * 1d. Pestañas en las secciones con varias partes (Empresa), solo en ordenador.
 * 1e. Carruseles de servicios y proyectos, solo en ordenador.
 * 2. Barra amarilla del menú que se desliza entre categorías.
 */
( function () {
	'use strict';

	/* 1. Sombra de la cabecera ------------------------------------------- */

	var header = document.querySelector( '.setin-header' );

	if ( header && 'IntersectionObserver' in window ) {
		// Un centinela de 1px al principio de la página evita escuchar el evento scroll.
		var sentinel = document.createElement( 'div' );
		sentinel.setAttribute( 'aria-hidden', 'true' );
		sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:8px;pointer-events:none;';
		document.body.prepend( sentinel );

		new IntersectionObserver( function ( entries ) {
			header.classList.toggle( 'is-scrolled', ! entries[ 0 ].isIntersecting );
		} ).observe( sentinel );
	}

	/* 1b. Altura de la banda amarilla ------------------------------------
	 *
	 * En la portada, la cabecera con foto ocupa justo lo que queda de pantalla bajo el menú y
	 * la banda (theme.css). La banda cambia de alto según el ancho, así que se mide aquí.
	 */

	var cta = document.querySelector( '.setin-cta' );

	if ( cta && 'ResizeObserver' in window ) {
		new ResizeObserver( function () {
			document.documentElement.style.setProperty( '--setin-cta-h', cta.offsetHeight + 'px' );
		} ).observe( cta );
	}

	/* 1c. Mapa del mundo (patrón setin/mapa-mundi) --------------------------
	 *
	 * Vistas (data-views del mapa: [zoom, centro x %, centro y %]): mundo, américa, europa, áfrica
	 * y españa. Cada pin lleva en data-views las vistas en las que aparece. Los botones con
	 * data-setin-view cambian de vista; el resto de pines muestran su nombre al pulsarlos.
	 * Escape o un clic fuera cierran el nombre.
	 */

	Array.prototype.forEach.call( document.querySelectorAll( '.setin-worldmap' ), function ( map ) {
		var viewButtons = map.querySelectorAll( '[data-setin-view]' );
		var viewport = map.querySelector( '.setin-worldmap__viewport' );
		var layered = map.querySelectorAll( '.setin-worldmap__viewport > .setin-worldmap__stage > [data-views], .setin-worldmap__inset' );
		var views = {};
		// España es una parte de Europa: su pestaña sigue marcada.
		var tabFor = { espana: 'europa' };

		try {
			views = JSON.parse( map.getAttribute( 'data-views' ) ) || {};
		} catch ( e ) {}

		function closePins( except ) {
			Array.prototype.forEach.call( map.querySelectorAll( '.setin-worldmap__pin.is-open' ), function ( pin ) {
				if ( pin !== except ) {
					pin.classList.remove( 'is-open' );
					pin.setAttribute( 'aria-expanded', 'false' );
				}
			} );
		}

		function setView( view ) {
			var frame = views[ view ] || [ 1, 50, 50 ];
			var tab = tabFor[ view ] || view;

			map.setAttribute( 'data-view', view );
			closePins();
			viewport.style.setProperty( '--z', frame[ 0 ] );
			viewport.style.setProperty( '--cx', frame[ 1 ] + '%' );
			viewport.style.setProperty( '--cy', frame[ 2 ] + '%' );

			Array.prototype.forEach.call( layered, function ( el ) {
				var shown = ( ' ' + el.getAttribute( 'data-views' ) + ' ' ).indexOf( ' ' + view + ' ' ) !== -1;
				el.classList.toggle( 'is-hidden', ! shown );
				el.tabIndex = shown ? 0 : -1;
			} );

			Array.prototype.forEach.call( viewButtons, function ( button ) {
				if ( button.hasAttribute( 'aria-pressed' ) ) {
					button.setAttribute( 'aria-pressed', String( button.getAttribute( 'data-setin-view' ) === tab ) );
				}
			} );
		}

		setView( map.getAttribute( 'data-view' ) || 'mundo' );

		map.addEventListener( 'click', function ( event ) {
			var viewButton = event.target.closest( '[data-setin-view]' );
			var pin = event.target.closest( '.setin-worldmap__pin' );

			if ( viewButton ) {
				setView( viewButton.getAttribute( 'data-setin-view' ) );
				return;
			}
			if ( ! pin ) {
				closePins();
				return;
			}
			var open = ! pin.classList.contains( 'is-open' );
			closePins( pin );
			pin.classList.toggle( 'is-open', open );
			pin.setAttribute( 'aria-expanded', String( open ) );
		} );

		document.addEventListener( 'click', function ( event ) {
			if ( ! map.contains( event.target ) ) {
				closePins();
			}
		} );

		document.addEventListener( 'keydown', function ( event ) {
			if ( 'Escape' === event.key ) {
				closePins();
			}
		} );
	} );

	/* 1d. Pestañas en las secciones con varias partes (Empresa) -------------
	 *
	 * En ordenador cada sección del menú cabe en una pantalla (theme.css, sección 12). Si la página
	 * tiene varias partes con antetítulo, se muestran de una en una con pestañas que usan ese
	 * antetítulo como nombre. En móvil y tablet siguen todas seguidas.
	 */

	// Mismo criterio que la sección 12 de theme.css.
	var FIT_QUERY = '(min-width: 900px) and (min-height: 560px)';
	var fitContent = document.querySelector( 'body.setin-fit main > .entry-content' );
	var fitParts = fitContent ? Array.prototype.filter.call( fitContent.children, function ( el ) {
		return ! el.classList.contains( 'setin-page-hero' ) && el.querySelector( '.setin-eyebrow' );
	} ) : [];

	if ( fitParts.length > 1 && window.matchMedia ) {
		var desktop = window.matchMedia( FIT_QUERY );
		var tabWrap = document.createElement( 'div' );
		var tabList = document.createElement( 'div' );
		var currentTab = 0;

		tabWrap.className = 'setin-tabs';
		tabList.className = 'setin-tabs__list';
		tabList.setAttribute( 'role', 'tablist' );
		tabWrap.appendChild( tabList );
		fitContent.insertBefore( tabWrap, fitParts[ 0 ] );

		// Las partes van juntas en un contenedor: en ordenador se apilan en la misma celda y
		// ocupa lo que la más alta, así nada se mueve al cambiar de pestaña (theme.css, 12).
		var panelWrap = document.createElement( 'div' );
		panelWrap.className = 'setin-tabs__panels alignfull';
		fitContent.insertBefore( panelWrap, fitParts[ 0 ] );
		fitParts.forEach( function ( part ) {
			panelWrap.appendChild( part );
		} );

		var tabs = fitParts.map( function ( part, i ) {
			var tab = document.createElement( 'button' );
			tab.type = 'button';
			tab.className = 'setin-tabs__tab';
			tab.id = 'setin-tab-' + i;
			tab.textContent = part.querySelector( '.setin-eyebrow' ).textContent.trim();
			tab.setAttribute( 'role', 'tab' );
			part.id = part.id || 'setin-panel-' + i;
			part.classList.add( 'setin-tabs__panel' );
			tab.setAttribute( 'aria-controls', part.id );
			tabList.appendChild( tab );
			return tab;
		} );

		function applyTabs() {
			var on = desktop.matches;
			document.body.classList.toggle( 'has-setin-tabs', on );
			fitParts.forEach( function ( part, i ) {
				var selected = i === currentTab;
				tabs[ i ].setAttribute( 'aria-selected', String( selected ) );
				tabs[ i ].tabIndex = selected ? 0 : -1;
				if ( on ) {
					part.setAttribute( 'role', 'tabpanel' );
					part.setAttribute( 'aria-labelledby', tabs[ i ].id );
				} else {
					part.removeAttribute( 'role' );
					part.removeAttribute( 'aria-labelledby' );
				}
				// Oculta sin quitarle el sitio (no se lee ni se puede enfocar).
				part.classList.toggle( 'is-inactive', on && ! selected );
				part.inert = on && ! selected;
				part.setAttribute( 'aria-hidden', String( on && ! selected ) );
			} );
		}

		function selectTab( index, focus ) {
			currentTab = ( index + tabs.length ) % tabs.length;
			applyTabs();
			if ( focus ) {
				tabs[ currentTab ].focus();
			}
		}

		tabList.addEventListener( 'click', function ( event ) {
			var tab = event.target.closest( '.setin-tabs__tab' );
			if ( tab ) {
				selectTab( tabs.indexOf( tab ) );
			}
		} );

		// Flechas, Inicio y Fin, como en cualquier lista de pestañas.
		tabList.addEventListener( 'keydown', function ( event ) {
			var moves = { ArrowRight: currentTab + 1, ArrowLeft: currentTab - 1, Home: 0, End: tabs.length - 1 };
			if ( event.key in moves ) {
				event.preventDefault();
				selectTab( moves[ event.key ], true );
			}
		} );

		if ( desktop.addEventListener ) {
			desktop.addEventListener( 'change', applyTabs );
		}
		applyTabs();
	}

	/* 1e. Carruseles de servicios y proyectos --------------------------------
	 *
	 * En ese mismo modo de una pantalla, las tarjetas van en una fila (theme.css, sección 12) y
	 * estas flechas avanzan una "página" de tarjetas. Fuera de ese modo las flechas no se ven.
	 */

	var isEnglish = 0 === ( document.documentElement.lang || '' ).indexOf( 'en' );
	var chevron = function ( path ) {
		return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="' + path + '"/></svg>';
	};

	Array.prototype.forEach.call( document.querySelectorAll( 'body.setin-fit .setin-cards__grid, body.setin-fit .setin-projects__grid' ), function ( track ) {
		var frame = document.createElement( 'div' );
		var prev = document.createElement( 'button' );
		var next = document.createElement( 'button' );

		frame.className = 'setin-carousel';
		track.parentNode.insertBefore( frame, track );
		frame.appendChild( track );

		[ [ prev, 'prev', isEnglish ? 'Previous' : 'Anteriores', 'M15 18l-6-6 6-6' ], [ next, 'next', isEnglish ? 'Next' : 'Siguientes', 'M9 18l6-6-6-6' ] ].forEach( function ( b ) {
			b[ 0 ].type = 'button';
			b[ 0 ].className = 'setin-carousel__btn setin-carousel__btn--' + b[ 1 ];
			b[ 0 ].setAttribute( 'aria-label', b[ 2 ] );
			b[ 0 ].innerHTML = chevron( b[ 3 ] );
			frame.appendChild( b[ 0 ] );
		} );

		function update() {
			var max = track.scrollWidth - track.clientWidth - 2;
			prev.disabled = track.scrollLeft <= 2;
			next.disabled = track.scrollLeft >= max;
			frame.classList.toggle( 'is-static', max <= 2 );
		}

		prev.addEventListener( 'click', function () {
			track.scrollBy( { left: -track.clientWidth, behavior: 'smooth' } );
		} );
		next.addEventListener( 'click', function () {
			track.scrollBy( { left: track.clientWidth, behavior: 'smooth' } );
		} );
		track.addEventListener( 'scroll', update, { passive: true } );
		window.addEventListener( 'resize', update );

		// Al filtrar proyectos se ocultan tarjetas: el carrusel vuelve al principio.
		if ( 'MutationObserver' in window ) {
			new MutationObserver( function () {
				track.scrollLeft = 0;
				update();
			} ).observe( track, { attributes: true, subtree: true, attributeFilter: [ 'hidden' ] } );
		}

		update();
	} );

	/* 2. Barra del menú ---------------------------------------------------
	 *
	 * - La barra descansa bajo la sección actual (también en sus subpáginas:
	 *   /servicios/montaje-retail/ ilumina "Servicios").
	 * - Al pasar el ratón, una línea tenue ("fantasma") se adelanta a la categoría.
	 * - Al hacer clic, la barra viaja estirándose hacia la nueva categoría. Su posición
	 *   exacta se guarda al salir de la página y la página nueva continúa el movimiento
	 *   desde ahí, de modo que parece un único desplazamiento continuo.
	 */

	var list = document.querySelector( '.setin-header .wp-block-navigation__container' );

	if ( ! list ) {
		return;
	}

	var STORAGE_KEY = 'setin-nav-from';
	var links = Array.prototype.slice.call( list.querySelectorAll( ':scope > li > a' ) );
	var bar = document.createElement( 'span' );
	var ghost = document.createElement( 'span' );
	var leaving = false;

	bar.className = 'setin-nav-indicator';
	ghost.className = 'setin-nav-indicator setin-nav-indicator--ghost';
	bar.setAttribute( 'aria-hidden', 'true' );
	ghost.setAttribute( 'aria-hidden', 'true' );
	list.appendChild( ghost );
	list.appendChild( bar );
	list.classList.add( 'has-indicator' );

	/**
	 * Enlace de la sección actual (el prefijo de ruta más largo que coincida).
	 * "Inicio" (/ o /en/) es prefijo de todo, así que solo cuenta en la portada exacta.
	 */
	function currentLink() {
		var path = window.location.pathname;
		var best = null;
		var bestLength = 0;

		links.forEach( function ( link ) {
			var linkPath = new URL( link.href, window.location.href ).pathname;
			if ( link.parentNode.classList.contains( 'setin-nav-home' ) ) {
				if ( path === linkPath ) {
					best = link;
					bestLength = Infinity;
				}
				return;
			}
			if ( linkPath !== '/' && path.indexOf( linkPath ) === 0 && linkPath.length > bestLength ) {
				best = link;
				bestLength = linkPath.length;
			}
		} );

		return best;
	}

	/** Bordes izquierdo y derecho de un enlace, relativos a la lista. */
	function edges( link ) {
		var box = list.getBoundingClientRect();
		var rect = link.getBoundingClientRect();
		return { left: rect.left - box.left, right: box.right - rect.right };
	}

	/** Coloca un indicador. "instant" lo mueve sin transición. */
	function move( el, pos, instant ) {
		var previousLeft = parseFloat( el.style.left );

		// Dirección del viaje: el extremo que va delante se mueve primero (efecto "estirar").
		if ( ! isNaN( previousLeft ) ) {
			el.classList.toggle( 'is-going-right', pos.left > previousLeft );
			el.classList.toggle( 'is-going-left', pos.left < previousLeft );
		}

		if ( instant ) {
			el.classList.add( 'is-instant' );
		}
		el.style.left = pos.left + 'px';
		el.style.right = pos.right + 'px';
		if ( instant ) {
			void el.offsetWidth; // Aplica la posición antes de reactivar las transiciones.
			el.classList.remove( 'is-instant' );
		}
	}

	/** Hace aparecer un indicador "creciendo" desde el centro del enlace. */
	function growFrom( el, link ) {
		var pos = edges( link );
		var center = pos.left + ( list.clientWidth - pos.left - pos.right ) / 2;
		move( el, { left: center, right: list.clientWidth - center }, true );
		el.classList.add( 'is-shown' );
		window.requestAnimationFrame( function () {
			move( el, pos );
		} );
	}

	var current = currentLink();

	if ( current ) {
		current.setAttribute( 'aria-current', 'page' );
	}

	/* Posición inicial: continuar el viaje desde la página anterior, o crecer desde el centro. */
	var from = null;
	try {
		from = JSON.parse( window.sessionStorage.getItem( STORAGE_KEY ) || 'null' );
		window.sessionStorage.removeItem( STORAGE_KEY );
	} catch ( e ) {
		from = null;
	}

	function start() {
		if ( ! current ) {
			return;
		}
		if ( from && Math.abs( from.width - list.clientWidth ) < 2 ) {
			// Visible al instante (sin fundido): es la misma barra que venía de la página anterior.
			bar.classList.add( 'is-shown' );
			move( bar, from, true );
			// Dos frames: el navegador pinta la posición de origen y luego anima hasta el destino.
			window.requestAnimationFrame( function () {
				window.requestAnimationFrame( function () {
					move( bar, edges( current ) );
				} );
			} );
		} else {
			growFrom( bar, current );
		}
	}

	// Espera a las fuentes para medir los anchos reales de los textos.
	if ( document.fonts && document.fonts.ready ) {
		document.fonts.ready.then( start );
	} else {
		start();
	}

	/* Vista previa al pasar el ratón o al navegar con el teclado. */
	function preview( link ) {
		if ( leaving ) {
			return;
		}
		if ( link === current ) {
			ghost.classList.remove( 'is-shown' );
			return;
		}
		if ( ghost.classList.contains( 'is-shown' ) ) {
			move( ghost, edges( link ) );
		} else {
			growFrom( ghost, link );
		}
	}

	function endPreview() {
		ghost.classList.remove( 'is-shown' );
	}

	links.forEach( function ( link ) {
		link.addEventListener( 'mouseenter', function () { preview( link ); } );
		link.addEventListener( 'focus', function () { preview( link ); } );

		link.addEventListener( 'click', function ( event ) {
			// Abrir en otra pestaña o con modificadores: no animamos.
			if ( event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0 || link.target === '_blank' ) {
				return;
			}
			leaving = true;
			ghost.classList.remove( 'is-shown' );

			if ( bar.classList.contains( 'is-shown' ) ) {
				move( bar, edges( link ) );
			} else {
				growFrom( bar, link );
			}
		} );
	} );

	list.addEventListener( 'mouseleave', endPreview );
	list.addEventListener( 'focusout', function ( event ) {
		if ( ! list.contains( event.relatedTarget ) ) {
			endPreview();
		}
	} );

	/* Al salir, guarda la posición real de la barra (aunque esté a mitad de viaje). */
	window.addEventListener( 'pagehide', function () {
		if ( ! leaving || ! bar.classList.contains( 'is-shown' ) ) {
			return;
		}
		var box = list.getBoundingClientRect();
		var rect = bar.getBoundingClientRect();
		if ( ! rect.width ) {
			return; // Menú móvil cerrado u oculto.
		}
		try {
			window.sessionStorage.setItem(
				STORAGE_KEY,
				JSON.stringify( { left: rect.left - box.left, right: box.right - rect.right, width: list.clientWidth } )
			);
		} catch ( e ) {}
	} );

	// Si se vuelve con el botón "atrás" desde la caché, recoloca la barra en su sitio.
	window.addEventListener( 'pageshow', function ( event ) {
		if ( event.persisted ) {
			leaving = false;
			if ( current ) {
				move( bar, edges( current ), true );
			}
		}
	} );

	window.addEventListener( 'resize', function () {
		if ( current && bar.classList.contains( 'is-shown' ) ) {
			move( bar, edges( current ), true );
		}
		endPreview();
	} );
} )();
