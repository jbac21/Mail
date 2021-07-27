document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', sent_mail);

  // By default, load the inbox
  load_mailbox('inbox');  
});


// Form for sending an email
function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}


// Archive an email
function archive(email) {
  
  if (email.archived == true)
  {
    fetch(`/emails/${email.id}`, {
      method: 'PUT',
      body: JSON.stringify({
          archived: false
      })
    })
    .then(()=>load_mailbox('inbox'))
    
  } else {
    fetch(`/emails/${email.id}`, {
      method: 'PUT',
      body: JSON.stringify({
          archived: true
      })
    })
    .then(()=>load_mailbox('inbox'))
  }
}

function view_email(id, mailbox) {

  // Delete previous views
  document.querySelector('#email-view-from').innerHTML = "";
  document.querySelector('#email-view-to').innerHTML = "";
  document.querySelector('#email-view-subject').innerHTML = "";
  document.querySelector('#email-view-timestamp').innerHTML = "";
  document.querySelector('#email-view-body').innerHTML = "";
  document.querySelector('#btn-archive').remove();
  document.querySelector('#btn-reply').remove();

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Retrieve email data
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    
    // Adjust html of email-view
    document.querySelector('#email-view-from').append(email.sender);
    document.querySelector('#email-view-to').append(email.recipients);
    document.querySelector('#email-view-subject').append(email.subject);
    document.querySelector('#email-view-timestamp').append(email.timestamp);
    document.querySelector('#email-view-body').append(email.body);

    // Prepare Answer Button
    const btnReply = document.createElement('button');
    btnReply.id = `btn-reply`;
    btnReply.className = 'btn btn-sm btn-outline-primary reply';
    btnReply.innerHTML = 'Reply';
    document.querySelector('.mail-actions').append(btnReply);
    
    // Set event listener for buttons
    document.querySelector('#btn-reply').addEventListener('click', function() {
      reply(email)
    });

    // Only show Archive Button if mailbox is not sent
    if (mailbox != 'sent')
    {
      // Prepare Archive Button
      const btnArchive = document.createElement('button');
      btnArchive.id = `btn-archive`;
      btnArchive.className = 'btn btn-sm btn-outline-primary archive';
      document.querySelector('.mail-actions').append(btnArchive);
      if (email.archived === true)
      {
        document.querySelector('#btn-archive').innerHTML = "Unarchive";
      } else {
        document.querySelector('#btn-archive').innerHTML = "Archive";
      }
      
      // Set an event listener
      document.querySelector('#btn-archive').addEventListener('click', function() {
        archive(email)
      });
    }

    console.log("put")
    // Set mail read attribute to true (having been read)
    fetch(`/emails/${email.id}`, {
      method: 'PUT',
      body: JSON.stringify({
          read: true
      })
    })
    .catch(error => {
      console.log(error);
    })
  });
}


function load_mailbox(mailbox) {

  console.log("load");

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name & clear history
  document.querySelectorAll('.email').forEach(e => {
    e.remove();
    console.log(e);
  });    
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;


  // Retrieve mails
  fetch(`/emails/` + mailbox)
  .then(response => response.json())
  .then(emails => emails.forEach(function(element){ 
    // Create message abstract
    var body = String(element.body)
    if (body.indexOf(' ') >= 0)
    {
      body = body.split(' ').slice(0,30).join(" ");
    }

    // Get sender / receiver address
    var mailadress = ""
    if (mailbox != "sent") 
    {
      mailadress = `<span class="bold">From: ${element.sender}</span>`;
    } else {
      mailadress = `<span class="bold">To: ${element.recipients}</span>`;
    }

    // Define email entry
    const email = document.createElement('div');
    email.id = `${element.id}`;
    email.addEventListener('click', function(){
      view_email(element.id, mailbox);
    });
    console.log(element.read);
    // Check if mail has been read before
    if (element.read == true)
    {
      email.className = 'email read';
      console.log("email read");
    } else {
      email.className = 'email';
    }

    // Specify div information
    email.innerHTML = 
     `<span class="bold sm">${mailadress}</span>
      <span class="sm">| Subject: </span>
      <span class="sm">${element.subject}</span>
      <span class="sm timestamp">${element.timestamp}</span><br> 
      <span class="bold sm">Message: </span>
      <span class="sm">${body}...</span>`;

    // Add email to DOM
    document.querySelector('#emails-view').append(email);
  }))
  .catch(error => {
    console.log('Error:', error);
    document.querySelectorAll('.email').forEach(e => {
      e.remove();
      console.log(e);
    }); 
  });
}


function sent_mail(event) {

  // Prevent form from submitting
  event.preventDefault()

  // Use API to sent mail
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value
    })
  })
  .then(response => load_mailbox('sent'))
  .catch(error => {
    // Log error
    console.log('Error:', error);
  });

}


function reply(email) {

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
  
    // Clear out composition fields
    document.querySelector('#compose-recipients').value = email.sender;
    document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
    document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
}