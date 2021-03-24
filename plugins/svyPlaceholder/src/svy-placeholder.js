/**
 * @module SvyPlaceholder/SvyPlaceholder
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import SvyPlaceholderUi from './svy-placeholder-ui';
import SvyPlaceholderEditing from './svy-placeholder-editing';

/**
 * Servoy Placeholder plugin
 *
 * @extends module:core/plugin~Plugin
 */
export default class SvyPlaceholder extends Plugin {

    /**
     * @inheritDoc
     */
	static get requires() {
		return [SvyPlaceholderUi, SvyPlaceholderEditing];
	}

    /**
     * @inheritDoc
     */
	static get pluginName() {
		return 'svyPlaceholder';
	}

}
