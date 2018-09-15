FROM node
RUN mkdir /usr/src/app
WORKDIR /usr/src/app
ADD package.json /usr/src/app
RUN npm install
ADD *.js /usr/src/app
CMD ["npm", "run", "start"]
