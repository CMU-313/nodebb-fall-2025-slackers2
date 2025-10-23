<!-- IMPORT header.tpl -->

<div class="compose-container">
    <div class="compose-header mb-3">
        <h1 class="h3 mb-0">[[modules:composer.compose]]</h1>
    </div>

    <div class="compose-form">
        <form method="post" action="{config.relative_path}/compose" id="compose-form">
            <input type="hidden" name="_csrf" value="{config.csrf_token}" />
            
            <!-- Category Selection -->
            <div class="mb-3">
                <label for="category-select" class="form-label">[[category:category]]</label>
                <select class="form-select" id="category-select" name="cid" required>
                    <option value="">[[category:select-category]]</option>
                    {{{each categories}}}
                    <option value="{categories.cid}" {{{if categories.selected}}}selected{{{end}}}>{categories.name}</option>
                    {{{end}}}
                </select>
            </div>

            <!-- Title Field -->
            <div class="mb-3">
                <label for="title" class="form-label">[[topic:title]]</label>
                <input type="text" class="form-control" id="title" name="title" placeholder="[[topic:title]]" required>
            </div>

            <!-- Content Field -->
            <div class="mb-3">
                <label for="content" class="form-label">[[topic:content]]</label>
                <textarea class="form-control" id="content" name="content" rows="6" placeholder="[[modules:composer.textarea.placeholder]]" required></textarea>
            </div>


            <!-- Submit Button -->
            <div class="d-flex gap-2">
                <button type="submit" class="btn btn-primary">[[topic:post]]</button>
                <button type="button" class="btn btn-secondary" onclick="history.back()">[[global:cancel]]</button>
            </div>
        </form>
    </div>
</div>


<!-- IMPORT footer.tpl -->
