const ics = require('ics');
const axios = require('axios');
const express = require('express');

let app = express();

app.get('/flextime.ics', (req, res) => {
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Filename', 'flextime.ics');
    res.setHeader('Content-Disposition', 'attachment; filename="flextime.ics"')

    axios({
        method: 'POST',
        url: 'https://student.enrichingstudents.com/StudentViewScheduleApi/LoadData',
        headers: {
            'Cookie': 'jkfmasudfh=ksdfjlsnv=307178&wueiosdzm=139&qdjHDnmxadf=1vl3YMAY1gg3apBXmeRSpNZQJZt8aLVvM1ZhnQ__&kosljsdnc=1vl3YMAY1gh0vTy-1SE6BlUKi4i7dKp-mb1Sew__'
        }
    })
    .then((data) => {
        let events = [];
        data.data.ViewModel.AppointmentsGroupedByScheduleDate.forEach((appt) => {
            let details = appt.AppointmentDetails[0]
    
            let year = details.ScheduleDate.split('-')[0]
            let month = details.ScheduleDate.split('-')[1]
            let day = details.ScheduleDate.split('-')[2].split('T')[0]

            let event = {
                productId: '-//flextime calendar flextime-flextime.ics',
                start: [year, month, day, 9, 10],
                duration: { hours: 0, minutes: 40 },
                title: details.CourseName,
                description: (details.SchedulerComment != null) ? details.SchedulerComment : '',
                location: details.TaughtByHomeroom,
                status: 'CONFIRMED',
                organizer: { name: details.InstructorFirstName + ' ' + details.InstructorLastName }
            }
    
            events.push(event)
        })
    
        ics.createEvents(events, (error, calendar) => {
            if (error) {
                console.log(error);
            }
            
            res.send(calendar)
        })
    })
})

app.listen(process.env.PORT || 80)