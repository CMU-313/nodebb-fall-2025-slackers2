<div class="lastpost border-start border-2 lh-sm h-100" style="border-color: {./bgColor}!important;">
	{{{ each ./posts }}}
	{{{ if @first }}}
	<div component="category/posts" class="ps-2 text-xs d-flex flex-column h-100 gap-1">
		<div class="text-nowrap text-truncate">
			{{{ if ./isAnonymous }}}
				<span class="d-inline-flex justify-content-center align-items-center rounded-circle bg-secondary-subtle text-secondary" style="width:18px;height:18px;">
					<i class="fa fa-user-secret" aria-hidden="true"></i>
					<span class="visually-hidden">Anonymous</span>
				</span>
			{{{ else }}}
				<a class="text-decoration-none avatar-tooltip" title="{./user.displayname}" href="{config.relative_path}/user/{./user.userslug}">{buildAvatar(posts.user, "18px", true)}</a>
			{{{ end }}}
			<a class="permalink text-muted timeago text-xs" href="{config.relative_path}/topic/{./topic.slug}{{{ if ./index }}}/{./index}{{{ end }}}" title="{./timestampISO}" aria-label="[[global:lastpost]]"></a>
		</div>
		<div class="post-content text-xs text-break line-clamp-sm-2 lh-sm position-relative flex-fill">
			<a class="stretched-link" tabindex="-1" href="{config.relative_path}/topic/{./topic.slug}{{{ if ./index }}}/{./index}{{{ end }}}" aria-label="[[global:lastpost]]"></a>
			{./content}
		</div>
	</div>
	{{{ end }}}
	{{{ end }}}

	{{{ if !./posts.length }}}
	<div component="category/posts" class="ps-2">
		<div class="post-content overflow-hidden text-xs">
			[[category:no-new-posts]]
		</div>
	</div>
	{{{ end }}}
</div>
