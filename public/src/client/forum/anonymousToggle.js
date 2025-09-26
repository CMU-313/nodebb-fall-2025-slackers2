'use strict';

console.log('DEBUG: AnonymousToggle.js loaded');

$(document).ready(function () {
    console.log('DEBUG: AnonymousToggle.js document ready');
    
    // Simple checkbox detection
    $(document).on('change', '#anonymous-checkbox', function(e) {
        const isChecked = $(e.target).is(':checked');
        console.log('DEBUG: Anonymous checkbox changed - checked:', isChecked);
    });
    
    // Check if checkbox exists on page load
    console.log('DEBUG: Found anonymous checkbox:', $('#anonymous-checkbox').length);
});
