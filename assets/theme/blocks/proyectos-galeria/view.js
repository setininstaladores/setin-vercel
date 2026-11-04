/**
 * Filtros instantáneos de "Proyectos realizados".
 *
 * Sin JS, cada filtro es un enlace a la página de su categoría. Con JS, filtra en la misma
 * página y actualiza la URL para que el filtro se pueda compartir y funcione el botón "atrás".
 */
( function () {
	'use strict';

	document.querySelectorAll( '.setin-projects' ).forEach( function ( root ) {
		var chips = root.querySelectorAll( '.setin-chip[data-filter]' );
		var items = root.querySelectorAll( '.setin-project' );

		if ( ! chips.length || ! items.length ) {
			return;
		}

		function apply( filter ) {
			items.forEach( function ( item ) {
				var cats = ( item.dataset.cats || '' ).split( ' ' );
				item.hidden = filter !== '*' && cats.indexOf( filter ) === -1;
			} );

			chips.forEach( function ( chip ) {
				if ( chip.dataset.filter === filter ) {
					chip.setAttribute( 'aria-current', 'true' );
				} else {
					chip.removeAttribute( 'aria-current' );
				}
			} );
		}

		chips.forEach( function ( chip ) {
			chip.addEventListener( 'click', function ( event ) {
				event.preventDefault();
				apply( chip.dataset.filter );
				history.pushState( { setinFilter: chip.dataset.filter }, '', chip.href );
			} );
		} );

		// Sin estado guardado (la página tal como cargó), vuelve al filtro inicial.
		var initial = root.querySelector( '.setin-chip[aria-current="true"]' );
		initial = initial ? initial.dataset.filter : chips[ 0 ].dataset.filter;

		window.addEventListener( 'popstate', function ( event ) {
			apply( ( event.state && event.state.setinFilter ) || initial );
		} );
	} );
} )();
