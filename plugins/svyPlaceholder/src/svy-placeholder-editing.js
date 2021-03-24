/**
 * @module SvyPlaceholder/SvyPlaceholderEditing
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

import { toWidget, viewToModelPositionOutsideModelElement } from '@ckeditor/ckeditor5-widget/src/utils';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';

import SvyPlaceholderCommand from './svy-placeholder-command';

/**
 *
 * @extends module:core/plugin~Plugin
 */
export default class SvyPlaceholderUi extends Plugin {

    static get requires() {
        return [ Widget ];
    }

    init() {
        console.log( 'SvyPlaceholderUi#init() got called' );

        this._defineSchema();
        this._defineConverters();

        this.editor.commands.add( 'servoyPlaceholder', new SvyPlaceholderCommand( this.editor ) );

        this.editor.editing.mapper.on(
            'viewToModelPosition',
            viewToModelPositionOutsideModelElement( this.editor.model, viewElement => viewElement.hasClass( 'svy-placeholder' ) )
        );

        this.editor.model.schema.addAttributeCheck( context => {
            if ( context.endsWith( 'span' ) ) {
                return true;
            }
        } );
    }

    _defineSchema() {
        const schema = this.editor.model.schema;

        schema.register( 'svy-placeholder', {
            // Allow wherever text is allowed:
            allowWhere: '$text',

            // The placeholder will act as an inline node:
            isInline: true,

            // The inline widget is self-contained so it cannot be split by the caret and can be selected:
            isObject: true,

            allowAttributes: [ 'name', 'dataprovider', 'format' ]
        } );
    }

    _defineConverters() {
        const conversion = this.editor.conversion;

        conversion.for( 'upcast' ).elementToElement( {
            view: {
                name: 'span',
                classes: [ 'svy-placeholder' ]
            },
            model: ( viewElement, { writer: modelWriter } ) => {
                return modelWriter.createElement( 'svy-placeholder', viewElement.getAttributes() );
            }
        } );

        conversion.for( 'editingDowncast' ).elementToElement( {
            model: 'svy-placeholder',
            view: ( modelItem, { writer: viewWriter } ) => {
                const widgetElement = createPlaceholderView( modelItem, viewWriter );

                // Enable widget handling on a placeholder element inside the editing view.
                return toWidget( widgetElement, viewWriter );
            }
        } );

        conversion.for( 'dataDowncast' ).elementToElement( {
            model: 'svy-placeholder',
            view: ( modelItem, { writer: viewWriter } ) => createPlaceholderView( modelItem, viewWriter )
        } );

        // Helper method for both downcast converters.
        function createPlaceholderView( modelItem, viewWriter ) {
            const name = modelItem.getAttribute( 'name' );

            const placeholderView = viewWriter.createContainerElement( 'span', {
                class: 'svy-placeholder',
                name: name,
                dataprovider: modelItem.getAttribute( 'dataprovider' ),
                format: modelItem.getAttribute('format')
            } );

            // Insert the placeholder name (as a text).
            const innerText = viewWriter.createText( '{' + name + '}' );
            viewWriter.insert( viewWriter.createPositionAt( placeholderView, 0 ), innerText );

            return placeholderView;
        }
    }
}