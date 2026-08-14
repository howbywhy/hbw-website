document.addEventListener('DOMContentLoaded', function() {
  var form = document.getElementById('email-input');
  if (!form) return;

  var formEl = form.closest('form');
  if (!formEl) return;

  formEl.addEventListener('submit', function(e) {
    e.preventDefault();
    e.stopPropagation();

    var email = document.getElementById('email-input').value;
    if (!email) return;

    fetch('https://a.klaviyo.com/client/subscriptions/?company_id=RUYTQB', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'revision': '2023-08-15'
      },
      body: JSON.stringify({
        data: {
          type: 'subscription',
          attributes: {
            custom_source: 'Webflow Popup Form',
            profile: {
              data: {
                type: 'profile',
                attributes: { email: email }
              }
            }
          },
          relationships: {
            list: {
              data: {
                type: 'list',
                id: 'ST8dTa'
              }
            }
          }
        }
      })
    })
    .then(function(response) {
      console.log('Klaviyo response status:', response.status);
      if (response.ok) {
        console.log('Success! Email sent to Klaviyo.');
        var done = formEl.parentElement.querySelector('.w-form-done');
        if (done) done.style.display = 'block';
        formEl.style.display = 'none';
      } else {
        response.text().then(function(t) { console.log('Klaviyo error:', t); });
        var fail = formEl.parentElement.querySelector('.w-form-fail');
        if (fail) fail.style.display = 'block';
      }
    })
    .catch(function(err) {
      console.log('Fetch error:', err);
    });
  });
});