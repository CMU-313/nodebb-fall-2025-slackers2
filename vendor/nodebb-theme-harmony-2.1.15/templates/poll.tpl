<!-- IMPORT header.tpl -->

<div class="poll-container">
    <div class="poll-header mb-3">
        <h1 class="h3 mb-0">[[poll:create-poll]]</h1>
        <p class="text-muted">[[poll:create-poll-description]]</p>
    </div>

    <div class="poll-form">
        <form method="post" action="{config.relative_path}/poll" id="poll-form">
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

            <!-- Poll Title -->
            <div class="mb-3">
                <label for="poll-title" class="form-label">[[poll:title]]</label>
                <input type="text" class="form-control" id="poll-title" name="title" placeholder="[[poll:title-placeholder]]" required>
                <div class="form-text">[[poll:title-help]]</div>
            </div>

            <!-- Poll Description -->
            <div class="mb-3">
                <label for="poll-description" class="form-label">[[poll:description]]</label>
                <textarea class="form-control" id="poll-description" name="description" rows="4" placeholder="[[poll:description-placeholder]]"></textarea>
                <div class="form-text">[[poll:description-help]]</div>
            </div>

            <!-- Poll Options -->
            <div class="mb-3">
                <label class="form-label">[[poll:options]]</label>
                <div id="poll-options-container">
                    <div class="poll-option mb-2">
                        <div class="input-group">
                            <input type="text" class="form-control" name="pollOptions[]" placeholder="[[poll:option-placeholder]]" required>
                            <button type="button" class="btn btn-outline-danger" onclick="this.parentElement.parentElement.remove()" style="display: none;">
                                <i class="fa fa-times"></i>
                            </button>
                        </div>
                    </div>
                    <div class="poll-option mb-2">
                        <div class="input-group">
                            <input type="text" class="form-control" name="pollOptions[]" placeholder="[[poll:option-placeholder]]" required>
                            <button type="button" class="btn btn-outline-danger" onclick="this.parentElement.parentElement.remove()" style="display: none;">
                                <i class="fa fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <button type="button" class="btn btn-sm btn-outline-primary" id="add-poll-option">
                    <i class="fa fa-plus"></i> [[poll:add-option]]
                </button>
                <div class="form-text">[[poll:options-help]]</div>
            </div>

            <!-- Poll Settings -->
            <div class="mb-4">
                <h5 class="mb-3">[[poll:settings]]</h5>
                
                <!-- Allow Revoting -->
                <div class="mb-3">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="allow-revote" name="allowRevote" value="1">
                        <label class="form-check-label" for="allow-revote">
                            [[poll:allow-revote]]
                        </label>
                    </div>
                    <div class="form-text">[[poll:allow-revote-help]]</div>
                </div>

                <!-- End Date -->
                <div class="mb-3">
                    <label for="poll-end-date" class="form-label">[[poll:end-date]]</label>
                    <input type="datetime-local" class="form-control" id="poll-end-date" name="endDate">
                    <div class="form-text">[[poll:end-date-help]]</div>
                </div>

                <!-- Anonymous Voting -->
                <div class="mb-3">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="anonymous-voting" name="anonymousVoting" value="1">
                        <label class="form-check-label" for="anonymous-voting">
                            [[poll:anonymous-voting]]
                        </label>
                    </div>
                    <div class="form-text">[[poll:anonymous-voting-help]]</div>
                </div>
            </div>

            <!-- Submit Buttons -->
            <div class="d-flex gap-2">
                <button type="submit" class="btn btn-primary">
                    <i class="fa fa-poll"></i> [[poll:create-poll]]
                </button>
                <button type="button" class="btn btn-secondary" onclick="history.back()">
                    <i class="fa fa-times"></i> [[global:cancel]]
                </button>
            </div>
        </form>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const pollOptionsContainer = document.getElementById('poll-options-container');
    const addPollOptionBtn = document.getElementById('add-poll-option');
    
    // Add new poll option
    addPollOptionBtn.addEventListener('click', function() {
        const newOption = document.createElement('div');
        newOption.className = 'poll-option mb-2';
        newOption.innerHTML = `
            <div class="input-group">
                <input type="text" class="form-control" name="pollOptions[]" placeholder="[[poll:option-placeholder]]" required>
                <button type="button" class="btn btn-outline-danger" onclick="this.parentElement.parentElement.remove()">
                    <i class="fa fa-times"></i>
                </button>
            </div>
        `;
        pollOptionsContainer.appendChild(newOption);
        updateRemoveButtons();
    });
    
    // Update remove buttons visibility
    function updateRemoveButtons() {
        const options = pollOptionsContainer.querySelectorAll('.poll-option');
        options.forEach((option, index) => {
            const removeBtn = option.querySelector('.btn-outline-danger');
            if (options.length > 2) {
                removeBtn.style.display = 'block';
            } else {
                removeBtn.style.display = 'none';
            }
        });
    }
    
    // Initial call to set up remove buttons
    updateRemoveButtons();
    
    // Form validation
    document.getElementById('poll-form').addEventListener('submit', function(e) {
        const pollInputs = document.querySelectorAll('input[name="pollOptions[]"]');
        let validOptions = 0;
        
        pollInputs.forEach(input => {
            if (input.value.trim()) {
                validOptions++;
            }
        });
        
        if (validOptions < 2) {
            e.preventDefault();
            alert('[[poll:min-options-error]]');
            return;
        }
        
        // Validate end date if provided
        const endDate = document.getElementById('poll-end-date').value;
        if (endDate) {
            const endDateTime = new Date(endDate);
            const now = new Date();
            if (endDateTime <= now) {
                e.preventDefault();
                alert('[[poll:end-date-future-error]]');
                return;
            }
        }
    });
    
    // Set minimum date for end date to today
    const endDateInput = document.getElementById('poll-end-date');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    endDateInput.min = tomorrow.toISOString().slice(0, 16);
});
</script>

<!-- IMPORT footer.tpl -->
