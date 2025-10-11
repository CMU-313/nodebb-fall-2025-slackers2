{{{ if poll }}}
<div component="topic/poll" class="poll-container card border rounded-1 mb-3 mt-2" data-poll-id="{poll.pollId}">
	<div class="card-body p-3">
		<div class="d-flex align-items-center justify-content-between mb-2">
			<div class="d-flex align-items-center gap-2">
				<i class="fa fa-poll text-primary"></i>
				<h5 class="mb-0 fw-semibold">{poll.title}</h5>
			</div>
			<button component="poll/toggle" class="btn btn-sm btn-ghost" title="[[polls:toggle-poll]]">
				<i class="fa fa-chevron-down"></i>
			</button>
		</div>

		<div component="poll/content" class="poll-content hidden">
			<div class="text-muted small mb-3">
				<span component="poll/vote-count">{poll.voteCount}</span> {{{ if (poll.voteCount == 1) }}}[[polls:vote]]{{{ else }}}[[polls:votes]]{{{ end }}}
			</div>

			<div component="poll/options" class="poll-options mb-3">
				{{{ each poll.options }}}
				<div component="poll/option" class="poll-option mb-2 p-2 border rounded-1 {{{ if (../poll.userVote && ../poll.userVote.optionId == ./optionId) }}}poll-option-selected{{{ end }}}" data-option-id="{./optionId}">
					<div class="d-flex align-items-center gap-2 mb-1">
						{{{ if ../poll.canVote }}}
						<input type="radio" name="poll-{../poll.pollId}" value="{./optionId}" id="poll-option-{./optionId}" class="form-check-input" {{{ if (../poll.userVote && ../poll.userVote.optionId == ./optionId) }}}checked{{{ end }}}>
						{{{ end }}}
						<label for="poll-option-{./optionId}" class="form-check-label flex-grow-1 mb-0 {{{ if !../poll.canVote }}}ms-0{{{ end }}}">
							{./text}
						</label>
						<span class="badge bg-secondary">{./votes}</span>
					</div>
					<div class="poll-option-bar-container">
						<div class="poll-option-bar" style="width: {{{ if ../poll.voteCount }}}{function.calculatePercentage, ./votes, ../poll.voteCount}{{{ else }}}0{{{ end }}}%"></div>
					</div>
					<div class="text-muted small text-end">
						{{{ if ../poll.voteCount }}}{function.calculatePercentage, ./votes, ../poll.voteCount}{{{ else }}}0{{{ end }}}%
					</div>
				</div>
				{{{ end }}}
			</div>

			{{{ if poll.canVote }}}
			<div class="d-flex gap-2">
				<button component="poll/vote" class="btn btn-primary btn-sm" {{{ if !poll.userVote }}}disabled{{{ end }}}>
					{{{ if poll.userVote }}}[[polls:change-vote]]{{{ else }}}[[polls:submit-vote]]{{{ end }}}
				</button>
				{{{ if poll.userVote }}}
				<button component="poll/unvote" class="btn btn-outline-secondary btn-sm">
					[[polls:remove-vote]]
				</button>
				{{{ end }}}
			</div>
			{{{ end }}}
		</div>
	</div>
</div>
{{{ end }}}
