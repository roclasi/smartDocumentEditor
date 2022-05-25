/**
 * (Re-)Creates the editor using the given config 
 * @example elements.%%elementName%%.create(config, onSuccess, onError);
 * @param {*} config 
 */
$scope.api.create = function(config) {
    //make sure toolbar items provided on the config end up on the model's toolbarItems property
    if (config.toolbar) {
        var toolbarItems = [];
        if (config.toolbar instanceof Array) {
            //simple array variant, e.g. toolbar: [ 'bold', 'italic', '|', 'undo', 'redo', myCustomSvyToolbarItem]
            config.toolbar.forEach(element => {
                if (element instanceof String) {
                    //simple identifier
                    toolbarItems.push({type: element})
                } else {
                    //toolbar item object
                    toolbarItems.push(element);
                }
            });
        } else {
            //object variant, e.g. toolbar: { items: [...], viewTopOffset: ... }
            if (config.toolbar.items) {
                config.toolbar.items.forEach(element => {
                    if (element instanceof String) {
                        //simple identifier
                        toolbarItems.push({type: element})
                    } else {
                        //toolbar item object
                        toolbarItems.push(element);
                    }
                });
            }
        }
        $scope.model.toolbarItems = toolbarItems;
    }

    $scope.model.config = config;
}

/**
 * Returns a toolbarItem that can be provided as one of the toolbar items on a toolbar property of an editor's config
 * @param {String} name the (unique) name of this toolbar item
 * @param {Function} onClick the callback method to fire when the item is clicked
 * @example elements.%%elementName%%.createToolbarItem(name, onClick);
 * @return {CustomType<smartdocumenteditor-smartdocumenteditor.toolbarItem>}
 */
$scope.api.createToolbarItem = function(name, onClick) {
    return {
        name: name,
        onClick: onClick,
        type: 'servoyToolbarItem',
        isEnabled: true,
        ignoreReadOnly: false
    };
}

/**
 * @param {Array<CustomType<smartdocumenteditor-smartdocumenteditor.mentionFeed>>} mentionFeeds
 * @public 
 */
$scope.api.setMentionFeeds = function(mentionFeeds) {
    $scope.model.mentionFeeds = mentionFeeds
}