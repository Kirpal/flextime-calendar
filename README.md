# Flextime Calendar

## Introduction

> A tool used to sync Enriching Students flextime schedules to Google Calendar. Used for students' convenience, with one less schedule to check every day

## How to Use:

1. Clone the repository: `git clone https://github.com/kirpal/flextime-calendar.git`
2. Change into the downloaded folder: `cd flextime-calendar`
3. Make a configuration directory: `mkdir config`
4. Go to [Google API Console](https://console.cloud.google.com/)
5. Create a new project
6. Download the configuration file, save as credentials.json in your configuration directory
7. Install dependencies: `npm install`
8. Run the project to generate a configuration file: `npm run start`
9. Build the docker image: `docker build . -t 'flextime-calendar'`
10. Now run the docker image to allow continuous updating of the calendar:
`docker run flextime-calendar -v ./config:/usr/app/config`