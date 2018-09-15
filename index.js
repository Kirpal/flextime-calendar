const fs = require('fs');
const path = require('path');
const axios = require('axios');
const {google} = require('googleapis');
const CronJob = require('cron').CronJob;
const setup = require('./setup');
const config = require('./config');

// Load client secrets from a local file.
fs.readFile(path.join('/', 'config', 'credentials.json'), (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call calendar sync
  authorize(JSON.parse(content), sync);
});

const job = new CronJob('00 00 06 * * 1-5', function() {
  // Load client secrets from a local file.
  fs.readFile(path.join('config', 'credentials.json'), (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call calendar sync
    authorize(JSON.parse(content), sync);
  });
});
console.log('After job instantiation');
job.start();

// Create an OAuth2 client with the given credentials, and then execute the given callback function.
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  if (!config.get('oauthToken')) {
    setup.getAccessToken(oAuth2Client, callback);
  } else {
    oAuth2Client.setCredentials(config.get('oauthToken'));
    callback(oAuth2Client);
  }
}

// Authenticate the user with Enriching Students, and store the authenticated cookie for later use.
function getCookie(auth) {
  if (!config.get('enrichingStudentsEmail') || !config.get('enrichingStudentsPassword')) {
    return setup.getLogin(auth, getCookie)
  }

  // Send initial request to validate username/password
  axios({
    method: 'POST',
    url: 'https://app.enrichingstudents.com/LoginApi/Validate',
    data: {
        parameters : {
          EmailAddress: config.get('enrichingStudentsEmail'),
          Password: config.get('enrichingStudentsPassword')
        }
    }
  })
  .then((redirectData) => {
    if (!redirectData.data.IsAuthorized) {
      console.log("Incorrect Enriching Students login!")
      setup.getLogin(auth, getCookie);
    }

    // Get authenticated cookie
    axios({
      method: 'GET',
      url: redirectData.data.RedirectTo.replace('http://', 'https://'),
      headers: {
        'Cookie': redirectData.headers['set-cookie'][0]
      },
      maxRedirects: 0
    })
    .catch((data) => {

      // Store cookie to use later
      config.set('cookie', data.response.headers['set-cookie'][0])
      sync(auth);
    })
  })
}

function sync(auth) {
  const calendar = google.calendar({version: 'v3', auth});
  if (config.get('calendarId')) {
    if (config.get('cookie')) {
      axios({
          method: 'POST',
          url: 'https://student.enrichingstudents.com/StudentViewScheduleApi/LoadData',
          headers: {
              'Cookie': config.get('cookie')
          }
      })
      .then((data) => {
        if (data.data.IsAuthorized) {
          let events = {};

          calendar.events.list({
            auth: auth,
            calendarId: config.get('calendarId')
          }, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            
            res.data.items.forEach((event) => {
              if (event.source.title == 'Flextime Calendar') {
                events[event.start.dateTime.split('T')[0]] = event.id;
              }
            });



            data.data.ViewModel.AppointmentsGroupedByScheduleDate.forEach((appt) => {
              let details = appt.AppointmentDetails[0]
  
              let date = details.ScheduleDate.split('T')[0]
  
              let event = {
                summary: details.InstructorLastName + ' - ' + details.TaughtByHomeroom,
                location: details.TaughtByHomeroom,
                description: (details.SchedulerComment != null) ? details.SchedulerComment : '',
                start: {
                  dateTime: `${date}T09:10:00`,
                  timeZone: 'America/New_York'
                },
                end: {
                  dateTime: `${date}T09:50:00`,
                  timeZone: 'America/New_York'
                },
                source: {
                  title: 'Flextime Calendar',
                  url: 'https://student.enrichingstudents.com'
                }
              }
  
              if(Object.keys(events).indexOf(date) !== -1) {
                calendar.events.update({
                  auth: auth, 
                  calendarId: config.get('calendarId'),
                  eventId: events[date],
                  resource: event
                }, (err) => {
                  if (err) {
                    console.log('There was an error contacting the Calendar service: ' + err);
                    return;
                  }
                  console.log(`Event updated: ${event.summary}`);
                })
              } else {
                calendar.events.insert({
                  auth: auth,
                  calendarId: config.get('calendarId'),
                  resource: event,
                }, (err, event) => {
                  if (err) {
                    console.log('There was an error contacting the Calendar service: ' + err);
                    return;
                  }
                  console.log(`Event created: ${event.summary}`);
                });
              }
  
            })
          });
        } else {
          getCookie(auth);
        }
      })

    } else {
      getCookie(auth);
    }
          
  } else {
    setup.getCalendarId(auth, sync)
  }
}