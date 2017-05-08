# Introduction
**urlcheck** is a url monitoring service.
**urlcheck-database** is used to provision and setup Amazon PostgreSQL RDS to support the urlcheck-api project.

# Prerequisites
- Node v6.4.x with npm (https://nodejs.org/)
- AWS Command Line Interface (https://aws.amazon.com/cli/)
- AWS access credentials (http://docs.aws.amazon.com/cli/latest/reference/configure/)

# Installation
Apply AWS access credentials
```bash
aws configure
```
Clone the repository
```bash
git clone https://github.com/codeaim/urlcheck-database.git
```

Navigate into project directory
```bash
cd urlcheck-database
```

Install dependenices
```bash
npm install
```

Create deployment package
```bash
zip -r deploy.zip index.js node_modules
```

Create AWS S3 bucket
```bash
aws s3api create-bucket --bucket urlcheck-database --region eu-west-1 --create-bucket-configuration LocationConstraint=eu-west-1
```

Upload deployment package to AWS S3 bucket
```bash
aws s3 cp deploy.zip s3://urlcheck-database/deploy.zip
```

Upload AWS CloudFormation template to AWS S3 bucket
```bash
aws s3 cp template.yml s3://urlcheck-database/template.yml
```

Create database stack using AWS CloudFormation template
```bash
aws cloudformation create-stack --stack-name urlcheck-database --template-url https://s3.amazonaws.com/urlcheck-database/template.yml --capabilities CAPABILITY_IAM
```

Invoke create schema lambda function
```bash
aws lambda invoke --function-name urlcheck-database-create-schema /dev/null
```
