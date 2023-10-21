FROM ubuntu:latest
LABEL authors="persononomo"
# Install nodejs and npm
RUN apt-get update && apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs
# Confirm node and npm versions
RUN node -v && npm -v
# Set the working directory within the container
WORKDIR /app
# Compile the Typescript code
COPY src /app/src
COPY tsconfig.json /app/tsconfig.json
COPY package.json /app/package.json
RUN npm install
RUN npm run build
# Expose the port that the application will run on
EXPOSE 8000

ENTRYPOINT ["npm", "run", "serve"]