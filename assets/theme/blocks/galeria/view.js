/**
 * Visor ampliado (lightbox) ligero para la galería de las fichas.
 * Usa <dialog> nativo: gestiona el foco, Esc y la capa de fondo sin dependencias.
 */
( function () {
	'use strict';

	var galleries = document.querySelectorAll( '.setin-gallery' );

	if ( ! galleries.length || typeof HTMLDialogElement !== 'function' ) {
		return; // Sin soporte: los enlaces abren la imagen directamente.
	}

	var dialog = document.createElement( 'dialog' );
	dialog.className = 'setin-lightbox';
	dialog.setAttribute( 'aria-label', 'Visor de fotos' );
	dialog.innerHTML =
		'<span class="setin-lightbox__count" aria-live="polite"></span>' +
		'<figure class="setin-lightbox__figure"><img class="setin-lightbox__img" alt=""></figure>' +
		'<button type="button" class="setin-lightbox__btn setin-lightbox__prev" aria-label="Foto anterior">&#8592;</button>' +
		'<button type="button" class="setin-lightbox__btn setin-lightbox__next" aria-label="Foto siguiente">&#8594;</button>' +
		'<button type="button" class="setin-lightbox__btn setin-lightbox__close" aria-label="Cerrar visor">&#10005;</button>';
	document.body.appendChild( dialog );

	var img = dialog.querySelector( 'img' );
	var count = dialog.querySelector( '.setin-lightbox__count' );
	var items = [];
	var current = 0;
	var touchX = null;

	function show( index ) {
		current = ( index + items.length ) % items.length;
		var link = items[ current ];
		var thumb = link.querySelector( 'img' );
		img.src = link.href;
		img.alt = thumb ? thumb.alt : '';
		count.textContent = ( current + 1 ) + ' / ' + items.length;
	}

	galleries.forEach( function ( gallery ) {
		var links = Array.prototype.slice.call( gallery.querySelectorAll( '.setin-gallery__item' ) );

		links.forEach( function ( link, index ) {
			link.addEventListener( 'click', function ( event ) {
				event.preventDefault();
				items = links;
				show( index );
				dialog.showModal();
			} );
		} );
	} );

	dialog.querySelector( '.setin-lightbox__prev' ).addEventListener( 'click', function () { show( current - 1 ); } );
	dialog.querySelector( '.setin-lightbox__next' ).addEventListener( 'click', function () { show( current + 1 ); } );
	dialog.querySelector( '.setin-lightbox__close' ).addEventListener( 'click', function () { dialog.close(); } );

	dialog.addEventListener( 'keydown', function ( event ) {
		if ( event.key === 'ArrowLeft' ) {
			show( current - 1 );
		} else if ( event.key === 'ArrowRight' ) {
			show( current + 1 );
		}
	} );

	// Cerrar al pulsar fuera de la foto.
	dialog.addEventListener( 'click', function ( event ) {
		if ( event.target === dialog || event.target.classList.contains( 'setin-lightbox__figure' ) ) {
			dialog.close();
		}
	} );

	// Deslizar en móvil.
	dialog.addEventListener( 'touchstart', function ( event ) { touchX = event.touches[ 0 ].clientX; }, { passive: true } );
	dialog.addEventListener( 'touchend', function ( event ) {
		if ( touchX === null ) {
			return;
		}
		var delta = event.changedTouches[ 0 ].clientX - touchX;
		if ( Math.abs( delta ) > 50 ) {
			show( delta < 0 ? current + 1 : current - 1 );
		}
		touchX = null;
	}, { passive: true } );
} )();
