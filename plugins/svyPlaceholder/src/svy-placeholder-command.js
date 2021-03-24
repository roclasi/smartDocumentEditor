import Command from '@ckeditor/ckeditor5-core/src/command';

export default class SvyPlaceholderCommand extends Command {
    execute( { name, dataProvider, format } ) {
        const editor = this.editor;

        editor.model.change( writer => {
            // Create a <svy-placeholder> elment with the "name" and "dataprovider" attribute...
            const placeholder = writer.createElement( 'svy-placeholder', { name: name, dataprovider: dataProvider, format: format } );

            // ... and insert it into the document.
            editor.model.insertContent( placeholder );

            // Put the selection on the inserted element.
            writer.setSelection( placeholder, 'on' );
        } );
    }

    refresh() {
        const model = this.editor.model;
        const selection = model.document.selection;

        const isAllowed = model.schema.checkChild( selection.focus.parent, 'svy-placeholder' );

        this.isEnabled = isAllowed;
    }
}