# Introduction
**urlcheck** is a url monitoring service.
**urlcheck-database** is used to provision and setup Amazon PostgreSQL RDS to support the urlcheck-api project.

# Prerequisites
- Node v6.4.x with npm (https://nodejs.org/)
- AWS Command Line Interface (https://aws.amazon.com/cli/)
- AWS access credentials (http://docs.aws.amazon.com/cli/latest/reference/configure/)

# Setup
Apply AWS access credentials
```bash
aws configure
```

Create AWS S3 bucket
```bash
npm run setup
```

# Getting started
Clone the repository
```bash
git clone https://github.com/codeaim/urlcheck-database.git
```

Navigate into the project directory
```bash
cd urlcheck-database
```

Install dependencies
```bash
npm install
```

Set deployment configuration with valid values
```bash
npm config set urlcheck-database:database_username=<database_username>
npm config set urlcheck-database:database_password=<database_password>
```

Produce deployment package. Upload deployment package & AWS CloudFormation template to AWS S3 bucket. Create AWS CloudFormation stack, wait for completion and invoke Lambda to create database schema
```bash
npm run create
```
