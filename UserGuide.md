#Polls

The two main features added with polls so far are the backend for polls as well 
as poll creation and poll voting. For the backend for polls you can run the 
applicable tests with the `npm test test/polls.js` which will run all of the 
tests made for the polls backend. For running tests on the frontend, when you 
start your NodeBB instance and navigate to any category you should see a button 
to create a poll next to the button to create a topic. Clicking this button 
will take you to a simple form detailing all of the settings for polls. Once 
you have filled out the form and clicked submit you will be able to see the 
form pop up underneath listed with the topics under that category. Clicking on 
this field will take you to the poll voting system which is a simple list with 
radio buttons. Once you have clicked and submitted your answer you will see the 
vote count for that instance increase. 


#Anonymous Features

The main feature added for anonymous is being able to make posts where the user
profile and name is not displayed. 

For the backend testing, you can run the application tests with the 
`npm test test/posts/anonymous.js` and 
`test/upgrades/add-anonymous-field-to-posts.js`. These tests will run all the 
tests made for the anonymous backend including the database migration.

For running tests on the frontend, when you start your NodeBB instance, you 
first need to make/log into an account to have permission to make a new post. 
Once you log in, you can navigate to anywhere where you can make a new post. 
Once you click on the “New Post” button, you will see a tiny checkbox labeled 
“Anonymous” with an Incognito symbol to the right of the Submit button of the 
composer template that appears. If you check this and press post, User Details 
such as profile picture and name will be hidden on the post page, forum page, 
and the homepage preview of new posts. If you do not check this box when you 
make a new post, it will function as normal, with the user name and profile 
pic visible on these same pages.


 # Pinned Topic Content Previews

The main feature added for this is displaying and toggling content previews for 
pinned posts so that users can easily access important information in category 
boards. To view this added feature, navigate to any category board, and pin one 
or more topics if there are no pinned topics. The default setting for content 
previews is “shown” and it can be toggled by a “Show Content Preview” button in 
the Topic Tools dropdown menu. Upon selecting at least one pinned topic, the 
button will be available to click, and doing so will hide the selected topics’ 
content previews if they are previously shown, and will show the previews if 
they are previously hidden. For running tests for the content preview toggle on 
the backend, you can run the applicable tests using ‘npm test test/topics/topics-setShowPreview.js`. These tests verify that only admin users can toggle 
the content preview and that the current state of the toggle is properly 
reflected. 