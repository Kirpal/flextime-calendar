const prompt = require('prompt');
const {google} = require('googleapis');
const config = require('./config');

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

prompt.message = 'Setup'

module.exports = {
    getAccessToken: function(oAuth2Client, callback) {
        const authUrl = oAuth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: SCOPES,
        });

        console.log('Authorize this app by visiting this url:', authUrl);

        prompt.start();

        prompt.get([
            {
                name: 'code',
                description: 'Enter the code from that page here'
            }
        ], (err, result) => {
            oAuth2Client.getToken(result.code, (err, token) => {
              if (err) return console.error('Error retrieving access token', err);
              oAuth2Client.setCredentials(token);
              // Store the token to disk for later program executions
              config.set('oauthToken', token);
              callback(oAuth2Client);
            });
        });
    }, 
    getCalendarId: function(auth, callback) {
        const calendar = google.calendar({version: 'v3', auth});
      
        calendar.calendarList.list((err, res) => {
          if (err) return console.log('The API returned an error: ' + err);

          const items = res.data.items;
          if (items.length) {
            console.log('Your Calendars:');
            let calendars = items.map((item, i) => {
                return {'Name': item.summary, 'ID': item.id}
            });
            console.table(calendars);
      
            prompt.start();

            prompt.get([
                {
                    name: 'calendar',
                    description: 'Enter your calendar\'s index',
                    type: 'integer',
                    message: 'Index out of range',
                    conform: function(value) {
                        return (value >= 0 && value < (calendars.length - 1));
                    }
                }
            ], (err, result) => {
                config.set('calendarId', calendars[result.calendar].ID)
                callback(auth)
            })

          } else {
            config.set('calendarId', 'primary');
            console.log('No calendars found, primary calendar used.');
            callback(auth)
          }
        });

    },
    getLogin: function(auth, callback) {
        prompt.start();

        prompt.get([
            {
                name: 'email',
                description: 'Enriching Studetns Email Address',
                message: 'Invalid Email',
                required: true
            }, {
                name: 'password',
                description: 'Enriching Students Password',
                message: 'Invalid Password',
                hidden: true,
                required: true
            }
        ], (err, result) => {
            config.set('enrichingStudentsEmail', result.email);
            config.set('enrichingStudentsPassword', result.password);
            callback(auth);
        })
    }
}