<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

NestJS Project to handle users and Documents with proper Authentication

## Prerequisite
* Node Version 22.6.0
* PostgreSQL

## Project setup

```bash
$ npm install
```
  ### Setup .env file
  You can copy .env.example variable and update with your original data
  ```bash
    # Database Configuration
      DB_HOST=localhost
      DB_PORT=5432
      DB_USERNAME=postgres
      DB_PASSWORD=your_password
      DB_NAME=document_management
      
      # JWT Configuration
      JWT_SECRET=your-jwt-secret-key
      JWT_EXPIRES_IN=24h
      
      # Application Configuration
      PORT=3000
      NODE_ENV=development
      
      # File Upload Configuration
      UPLOAD_DEST=./uploads
      MAX_FILE_SIZE=10485760
  ```
  
## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```


