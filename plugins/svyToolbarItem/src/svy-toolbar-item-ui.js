/**
 * @module SvyToolbarItem/SvyToolbarItemUi
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

export default class SvyToolbarItemUi extends Plugin {

    /**
     * @inheritDoc
     */
	init() {
        console.log( 'SvyToolbarItemUi#init() got called' );

        const editor = this.editor;
		const t = editor.t;
		const itemDefinitions = this.editor.config.get('svyToolbarItems') || [];

		this.svyToolbarItems = [];

		itemDefinitions.forEach(definition => 
			this.createSvyToolbarItem(definition)
		);

		//sync disabled state of editor and toolbar items
		editor.on('change:isReadOnly', () => {
			this.svyToolbarItems.forEach(button => {
                if(button.ignoreReadOnly !== true) {
                    button.isEnabled = !editor.isReadOnly;
                }
			});
		});
	}
	
	createSvyToolbarItem(itemConfig) {
		const editor = this.editor;

		editor.ui.componentFactory.add( itemConfig.name, locale => {
            // The state of the button will be bound to the widget command.
            //const command = editor.commands.get( 'insertSimpleBox' );

            // The button will be an instance of ButtonView.
			const buttonView = new ButtonView( locale );

            
            buttonView.set( {
                // The t() function helps localize the editor. All strings enclosed in t() can be
                // translated and change when the language of the editor changes.
                label: itemConfig.label,
                withText: itemConfig.withText,
				tooltip: itemConfig.withTooltip,
				icon: itemConfig.icon,
                ignoreReadOnly: itemConfig.ignoreReadOnly
			} );
			
			buttonView.isEnabled = itemConfig.isEnabled;

            // Bind the state of the button to the command.
            //buttonView.bind( 'isOn', 'isEnabled' ).to( command, 'value', 'isEnabled' );

            // Execute the command when the button is clicked (executed).
			//this.listenTo( buttonView, 'execute', () => editor.execute( 'insertSimpleBox' ) );

			// Change enabled state and execute the specific callback on click.
			if (itemConfig.onClick) {
				this.listenTo(buttonView, 'execute', () => {
					this.enableButton(buttonView, false);
					Promise.resolve(itemConfig.onClick(buttonView)).then(() => this.enableButton(buttonView, true)).catch(() => this.enableButton(buttonView, true));
				});
			}
			
			//remember buttonView created to allow to sync disabled state of editor
			this.svyToolbarItems.push(buttonView);

            return buttonView;
        } );
	}

	/**
     * Enables or disables the button according to the button config
	 * and the current readOnly-state of the editor.
     *
	 * @param button the buttonView
	 * @param value new enabled state
     * @private
     */
	enableButton(button, value) {
        if(button.ignoreReadOnly !== true) {
		    button.isEnabled = !this.editor.isReadOnly && value;
        }
	}
}