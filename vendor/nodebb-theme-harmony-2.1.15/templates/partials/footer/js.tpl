<script defer src="{relative_path}/assets/nodebb.min.js?{config.cache-buster}"></script>

{{{each scripts}}}
<script defer type="text/javascript" src="{scripts.src}"></script>
{{{end}}}

<script>
    console.log('DEBUG: Script tag executed immediately');
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', prepareFooter);
    } else {
        prepareFooter();
    }

    function prepareFooter() {
        console.log('DEBUG: prepareFooter function called');
        
        {{{ if useCustomJS }}}
        {{customJS}}
        {{{ end }}}

        $(document).ready(function () {
            console.log('DEBUG: jQuery document ready');
            app.coldLoad();
            
            // Simple test for anonymous checkbox
            console.log('DEBUG: Footer script loaded');
            console.log('DEBUG: Found anonymous checkbox:', $('#anonymous-checkbox').length);
            
            $(document).on('change', '#anonymous-checkbox', function(e) {
                const isChecked = $(e.target).is(':checked');
                console.log('DEBUG: Anonymous checkbox changed - checked:', isChecked);
            });
        });
    }
</script>
