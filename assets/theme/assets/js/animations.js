/**
 * SETIN – animaciones al hacer scroll y contador de cifras.
 *
 * Reglas:
 * - Solo se ocultan (para animarlos) los elementos que están FUERA de pantalla al cargar.
 *   Lo visible de entrada no se toca: sin parpadeos y sin afectar al LCP.
 * - Con prefers-reduced-motion no se anima nada.
 */
( function () {
	'use strict';

	if ( ! ( 'IntersectionObserver' in window ) || window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches ) {
		return;
	}

	/*
	 * Qué se anima y cómo. Los grupos (tarjetas, pasos…) aparecen en cascada.
	 * [selector, variante, cascada]
	 */
	var targets = [
		[ 'main .setin-eyebrow', '', false ],
		[ 'main h2', '', false ],
		[ '.setin-cards__grid > li', '', true ],
		[ '.setin-stats > *', '', true ],
		[ '.setin-pillars > .wp-block-column', '', true ],
		[ '.setin-sectors > .setin-pillar', '', true ],
		[ '.setin-steps > .setin-step', '', true ],
		[ '.setin-projects__grid > li', '', true ],
		[ '.setin-quotes > .setin-quote', '', true ],
		[ '.setin-logos > li', 'fade', true ],
		[ '.setin-places > li', 'fade', true ],
		[ '.setin-checklist > li', '', true ],
		[ '.setin-gallery__grid > li', 'zoom', true ],
		[ '.setin-map', 'zoom', false ],
		[ '.setin-rounded', 'zoom', false ],
		[ '.setin-form-card', '', false ],
		[ '.setin-ficha-cta', '', false ],
		[ 'main .wp-block-columns > .wp-block-column > p', 'fade', false ],
		[ 'main .alignfull .wp-block-buttons', 'fade', false ],
	];

	var viewportBottom = window.innerHeight;
	var pending = [];

	targets.forEach( function ( target ) {
		document.querySelectorAll( target[ 0 ] ).forEach( function ( el ) {
			// Nunca dentro de cabeceras (tienen su propia animación) ni dos veces.
			if ( el.closest( '.wp-block-cover' ) || el.classList.contains( 'setin-reveal' ) ) {
				return;
			}
			// Lo que ya se ve al cargar se queda como está.
			if ( el.getBoundingClientRect().top < viewportBottom ) {
				return;
			}

			el.classList.add( 'setin-reveal' );
			if ( target[ 1 ] ) {
				el.classList.add( 'setin-reveal--' + target[ 1 ] );
			}
			if ( target[ 2 ] && el.parentElement ) {
				var index = Array.prototype.indexOf.call( el.parentElement.children, el );
				// Cascada por fila: se reinicia cada 6 elementos para no esperar de más.
				el.style.setProperty( '--setin-delay', ( index % 6 ) * 90 + 'ms' );
			}
			pending.push( el );
		} );
	} );

	var observer = new IntersectionObserver(
		function ( entries ) {
			entries.forEach( function ( entry ) {
				if ( ! entry.isIntersecting ) {
					return;
				}
				entry.target.classList.add( 'is-visible' );
				observer.unobserve( entry.target );

				// Tras la animación, se quita el retardo para no frenar el hover.
				entry.target.addEventListener( 'transitionend', function clear() {
					entry.target.style.removeProperty( '--setin-delay' );
					entry.target.removeEventListener( 'transitionend', clear );
				} );
			} );
		},
		{ rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
	);

	pending.forEach( function ( el ) {
		observer.observe( el );
	} );

	/* Contador de cifras: "1", "12", "5", "48 h"… */
	var counters = new IntersectionObserver(
		function ( entries ) {
			entries.forEach( function ( entry ) {
				if ( ! entry.isIntersecting ) {
					return;
				}
				counters.unobserve( entry.target );

				var el = entry.target;
				var match = el.textContent.match( /^(\D*)(\d+)(.*)$/ );
				if ( ! match ) {
					return;
				}

				var prefix = match[ 1 ];
				var total = parseInt( match[ 2 ], 10 );
				var suffix = match[ 3 ];
				var duration = 1400;
				var start = null;

				function frame( now ) {
					start = start || now;
					var progress = Math.min( ( now - start ) / duration, 1 );
					var eased = 1 - Math.pow( 1 - progress, 3 );
					el.textContent = prefix + Math.round( total * eased ) + suffix;
					if ( progress < 1 ) {
						window.requestAnimationFrame( frame );
					}
				}

				el.textContent = prefix + '0' + suffix;
				window.requestAnimationFrame( frame );
			} );
		},
		{ threshold: 0.6 }
	);

	document.querySelectorAll( '.setin-stat__value' ).forEach( function ( el ) {
		// Si ya está en pantalla al cargar, también cuenta (es un efecto, no oculta contenido).
		counters.observe( el );
	} );
} )();
