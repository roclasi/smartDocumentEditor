/**
 * @module SvyToolbarItem/SvyToolbarItemUi
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import { addListToDropdown, createDropdown } from '@ckeditor/ckeditor5-ui/src/dropdown/utils';
import Collection from '@ckeditor/ckeditor5-utils/src/collection';
import Model from '@ckeditor/ckeditor5-ui/src/model';

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
				if (button.ignoreReadOnly !== true) {
					button.isEnabled = !editor.isReadOnly;
				}
			});
		});
	}
	
	createSvyToolbarItem(itemConfig) {
		const editor = this.editor;

		if (itemConfig.valueList) {
			editor.ui.componentFactory.add( itemConfig.name, locale => {
                const dropdownView = createDropdown( locale );

                // Populate the list in the dropdown with items.
                addListToDropdown( dropdownView, this.getDropdownItemsDefinitions( itemConfig.valueList ) );

                dropdownView.buttonView.set( {
					label: itemConfig.label,
					withText: itemConfig.withText,
					tooltip: itemConfig.withTooltip,
					icon: itemConfig.icon
                } );

				dropdownView.set({
					ignoreReadOnly: itemConfig.ignoreReadOnly
				})

                dropdownView.isEnabled = itemConfig.isEnabled;

               // Change enabled state and execute the specific callback on click.
				if (itemConfig.onClick) {
					this.listenTo(dropdownView, 'execute', evt => {
						this.enableButton(dropdownView, false);
						Promise.resolve(itemConfig.onClick(dropdownView, evt.source.realValue)).then(() => this.enableButton(dropdownView, true)).catch(() => this.enableButton(dropdownView, true));
					});
				}
				
				//remember buttonView created to allow to sync disabled state of editor
				this.svyToolbarItems.push(dropdownView);

                return dropdownView;
            });
		} else {
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
	}

	getDropdownItemsDefinitions( valueList ) {
        const itemDefinitions = new Collection();

        if (valueList && valueList.length) {
            valueList.forEach(element => {
                const definition = {
                    type: 'button',
                    model: new Model( {
                        name: element.displayValue,
                        label: element.displayValue,
                        realValue: element.realValue || element.displayValue,
                        withText: true
                    } )
                };

                // Add the item definition to the collection.
                itemDefinitions.add( definition );
            });
        }

        return itemDefinitions;
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