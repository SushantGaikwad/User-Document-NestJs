
# User Management and Document Management System

## Overiew
The User Management and Document Management System is a NestJS server application, to allow users to create account and upload documents. There are three roles
* **Admin** - Admin Can able to manage users, change roles, change permissions, etc
* **Editor** - Editor can edit its own documents
* **Viewer** - The Viewer can only view documents

## Features
* Create User - User can enroll in the system by themselves or an Admin can add new users
* Manage User - Admin can edit users' permissions and roles and if required remove user from system
* Upload Documents - The User can upload documents (jpg, pdf, doc) into the system

## Tech Stack
* Backend - NestJS + Typescript 
* Database - PostgreSQL
  

## Project setup

### Prerequisite
* Node Version 22.6.0
* PostgreSQL

## Steps to Setup Application Locally
1. **Clone Repository**
   ```bash
   git clone https://github.com/SushantGaikwad/User-Document-NestJs.git
   cd User-Document-NestJs
   ```
2. **Intall Dependecies**
```bash
$ npm install
```

3. Set up the PostgreSQL Database
   ```bash
   CREATE DATABASE document_management
   CREATE DATABASE test_db
   ```

4. Set up .env files <br/>
    a) **.env** - You can copy **.env.example** variable and update it with your original data
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
  b) **.env.test**
  ```bash
    TEST_DB_HOST=localhost
    TEST_DB_PORT=5432
    TEST_DB_USERNAME=postgres
    TEST_DB_PASSWORD=your_password
    TEST_DB_DATABASE=test_db
  ```
5. Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev
```

6. Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```


