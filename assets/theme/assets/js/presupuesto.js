/**
 * Formulario de presupuesto: valida, envía a /api/presupuesto y muestra el resultado,
 * con los mismos mensajes y marcas visuales que tenía el formulario original.
 */
( function () {
	'use strict';

	var MAX_FILE = 4 * 1024 * 1024;
	var isEnglish = 0 === ( document.documentElement.lang || '' ).indexOf( 'en' );
	var TEXT = isEnglish ? {
		sent: 'Thank you for your message. It has been sent.',
		failed: 'There was an error trying to send your message. Please try again later.',
		invalid: 'One or more fields have an error. Please check and try again.',
		required: 'Please fill out this field.',
		accept: 'You must accept the terms and conditions before sending your message.',
		email: 'Please enter an email address.',
		tel: 'Please enter a telephone number.',
		tooLarge: 'The uploaded file is too large.',
		badType: 'You are not allowed to upload files of this type.'
	} : {
		sent: 'Gracias por tu mensaje. Ha sido enviado.',
		failed: 'Ha ocurrido un error al intentar enviar tu mensaje. Por favor, inténtalo de nuevo más tarde.',
		invalid: 'Uno o más campos tienen un error. Por favor, revísalos e inténtalo de nuevo.',
		required: 'Por favor, rellena este campo.',
		accept: 'Debes aceptar los términos y condiciones antes de enviar tu mensaje.',
		email: 'Por favor, introduce una dirección de correo electrónico.',
		tel: 'Por favor, introduce un número de teléfono.',
		tooLarge: 'El archivo subido es demasiado grande.',
		badType: 'No tienes permisos para subir archivos de este tipo.'
	};

	Array.prototype.forEach.call( document.querySelectorAll( '.wpcf7' ), function ( box ) {
		var form = box.querySelector( 'form' );
		var output = box.querySelector( '.wpcf7-response-output' );
		var status = box.querySelector( '.screen-reader-response [role="status"]' );
		var submit = form.querySelector( '[type="submit"]' );
		var spinner = document.createElement( 'span' );

		box.classList.remove( 'no-js' );
		box.classList.add( 'js' );
		spinner.className = 'wpcf7-spinner';
		submit.parentNode.insertBefore( spinner, submit.nextSibling );

		function setState( state, message ) {
			form.className = form.className.replace( /\b(init|invalid|sent|failed|submitting)\b/g, '' ).trim() + ' ' + state;
			form.setAttribute( 'data-status', state );
			output.textContent = message || '';
			output.setAttribute( 'aria-hidden', message ? 'false' : 'true' );
			status.textContent = message || '';
		}

		function clearTips() {
			Array.prototype.forEach.call( form.querySelectorAll( '.wpcf7-not-valid-tip' ), function ( tip ) {
				tip.remove();
			} );
			Array.prototype.forEach.call( form.querySelectorAll( '[aria-invalid="true"]' ), function ( field ) {
				field.setAttribute( 'aria-invalid', 'false' );
				field.classList.remove( 'wpcf7-not-valid' );
			} );
		}

		function markInvalid( name, message ) {
			var wrap = form.querySelector( '.wpcf7-form-control-wrap[data-name="' + name + '"]' );
			var field = form.elements[ name ];
			var tip = document.createElement( 'span' );

			if ( ! wrap || ! field || wrap.querySelector( '.wpcf7-not-valid-tip' ) ) {
				return;
			}
			field.setAttribute( 'aria-invalid', 'true' );
			field.classList.add( 'wpcf7-not-valid' );
			tip.className = 'wpcf7-not-valid-tip';
			tip.setAttribute( 'aria-hidden', 'true' );
			tip.textContent = message;
			wrap.appendChild( tip );
		}

		function validate() {
			var ok = true;
			var bad = function ( name, message ) {
				markInvalid( name, message );
				ok = false;
			};

			Array.prototype.forEach.call( form.querySelectorAll( '[aria-required="true"]' ), function ( field ) {
				if ( ! field.value.trim() ) {
					bad( field.name, TEXT.required );
				}
			} );
			if ( form.elements.email.value.trim() && ! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test( form.elements.email.value.trim() ) ) {
				bad( 'email', TEXT.email );
			}
			if ( form.elements.telefono.value.trim() && ! /^[+]?[0-9() .-]+$/.test( form.elements.telefono.value.trim() ) ) {
				bad( 'telefono', TEXT.tel );
			}
			if ( ! form.elements.rgpd.checked ) {
				bad( 'rgpd', TEXT.accept );
			}
			var file = form.elements.fotos.files[ 0 ];
			if ( file && file.size > MAX_FILE ) {
				bad( 'fotos', TEXT.tooLarge );
			}
			return ok;
		}

		form.addEventListener( 'submit', function ( event ) {
			event.preventDefault();
			clearTips();

			if ( ! validate() ) {
				setState( 'invalid', TEXT.invalid );
				return;
			}

			setState( 'submitting', '' );
			submit.disabled = true;

			fetch( form.action, { method: 'POST', body: new FormData( form ) } )
				.then( function ( response ) {
					return response.json().then( function ( data ) {
						return { ok: response.ok && data.ok, data: data };
					} );
				} )
				.then( function ( result ) {
					if ( result.ok ) {
						form.reset();
						setState( 'sent', TEXT.sent );
						return;
					}
					( result.data.fields || [] ).forEach( function ( name ) {
						var message = 'rgpd' === name ? TEXT.accept : TEXT.required;
						if ( 'too_large' === result.data.code ) {
							message = TEXT.tooLarge;
						} else if ( 'bad_type' === result.data.code ) {
							message = TEXT.badType;
						} else if ( 'email' === name ) {
							message = TEXT.email;
						}
						markInvalid( name, message );
					} );
					setState( result.data.fields ? 'invalid' : 'failed', result.data.fields ? TEXT.invalid : TEXT.failed );
				} )
				.catch( function () {
					setState( 'failed', TEXT.failed );
				} )
				.then( function () {
					submit.disabled = false;
				} );
		} );
	} );
} )();
