<!-- IMPORT partials/breadcrumbs-json-ld.tpl -->
{{{ if config.theme.enableBreadcrumbs }}}
<!-- IMPORT partials/breadcrumbs.tpl -->
{{{ end }}}

<div class="flex-fill">
	<div class="d-flex flex-column gap-3">
		<div class="d-flex gap-2 flex-wrap">
			<div class="d-flex flex-column gap-3 flex-grow-1 flex-1">
				<h1 component="poll/header" class="tracking-tight fw-semibold fs-3 mb-0 text-break {{{ if config.theme.centerHeaderElements }}}text-center{{{ end }}}">
					<span class="poll-title" component="poll/title">{poll.title}</span>
				</h1>

				<div class="poll-info d-flex gap-2 align-items-center flex-wrap {{{ if config.theme.centerHeaderElements }}}justify-content-center{{{ end }}}">
					{{{ if category }}}
					<a href="{config.relative_path}/category/{category.slug}" class="badge text-decoration-none">
						<i class="fa fa-folder"></i> {category.name}
					</a>
					{{{ end }}}
					<span class="text-muted small">
						<i class="fa fa-poll"></i> [[polls:poll]]
					</span>
				</div>
			</div>
		</div>

		<div class="row mb-4 mb-lg-0">
			<div class="poll col-lg-9 col-sm-12">
				<div class="poll-container card border rounded-1 mb-3" data-poll-id="{poll.pollId}">
					<div class="card-body p-4">
						<div class="text-muted small mb-4">
							<span component="poll/vote-count">{poll.voteCount}</span> {{{ if (poll.voteCount == 1) }}}[[polls:vote]]{{{ else }}}[[polls:votes]]{{{ end }}}
						</div>

						<div component="poll/options" class="poll-options mb-4">
							{{{ each poll.options }}}
							<div component="poll/option" class="poll-option mb-3 p-3 border rounded-1" data-option-id="{./optionId}">
								<div class="d-flex align-items-center gap-3 mb-2">
									<input type="radio" name="poll-{../poll.pollId}" value="{./optionId}" id="poll-option-{./optionId}" class="form-check-input">
									<label for="poll-option-{./optionId}" class="form-check-label flex-grow-1 mb-0">
										<h5 class="mb-0">{./text}</h5>
									</label>
									<div class="text-end">
										<span class="badge bg-primary fs-6 mb-1 d-block">{./votes}</span>
									<small class="text-muted">
										{{{ if ../poll.voteCount }}}
										{function.calculatePercentage, ./votes, ../poll.voteCount}%
										{{{ else }}}
										0%
										{{{ end }}}
									</small>
									</div>
								</div>
								<div class="poll-option-bar-container">
									{{{ if ../poll.voteCount }}}
									<div class="poll-option-bar" style="width: {function.calculatePercentage, ./votes, ../poll.voteCount}%"></div>
									{{{ else }}}
									<div class="poll-option-bar" style="width: 0%"></div>
									{{{ end }}}
								</div>
							</div>
							{{{ end }}}
						</div>

						<div class="d-flex gap-3 justify-content-center">
							<button component="poll/vote" class="btn btn-primary btn-lg" disabled>
								[[polls:submit-vote]]
							</button>
						</div>
					</div>
				</div>
			</div>
			<div data-widget-area="sidebar" class="col-lg-3 col-sm-12 {{{ if !widgets.sidebar.length }}}hidden{{{ end }}}">
			{{{each widgets.sidebar}}}
			{{widgets.sidebar.html}}
			{{{end}}}
			</div>
		</div>
	</div>
</div>

<div data-widget-area="footer">
{{{each widgets.footer}}}
{{widgets.footer.html}}
{{{end}}}
</div>
