# Automate AWS Lightsail Backups

Automate lightsail instance and database backups using these AWS Lambda functions:

- [backup_instance.js](https://github.com/Amit-A/automate-lightsail-backups/blob/master/backup_instance.js) for instance backups
- [backup_database.js](https://github.com/Amit-A/automate-lightsail-backups/blob/master/backup_database.js) for relational database backups

Make sure that you set the required environment variables:

- `INSTANCE_NAME` or `RELATIONAL_DATABASE_NAME`
- `BACKUP_DAYS_MAX`: keep the last `BACKUP_DAYS_MAX` daily backups
- `BACKUP_WEEKS_MAX`: keep at least `BACKUP_WEEKS_MAX` weekly backups
- `BACKUP_MONTHS_MAX`: keep at least `BACKUP_MONTHS_MAX` monthly backups
- `LIGHTSAIL_REGION`: the region where your lightsail resource is located (e.g. us-east-1)

## Setup

These are beginner-friendly instructions; if you know what you're doing feel free to skim :)

### Create new IAM policy: lightsail-snapshots

- Head over to the AWS [IAM console](https://console.aws.amazon.com/iam/)
- Find **Policies** in the sidebar and click on **Create Policy**
- Click on the **JSON** tab and paste this:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "lightsail:GetInstanceSnapshot",
                "lightsail:CreateRelationalDatabaseSnapshot",
                "lightsail:GetRelationalDatabaseSnapshot",
                "lightsail:DeleteInstanceSnapshot",
                "lightsail:GetRelationalDatabaseSnapshots",
                "lightsail:GetInstanceSnapshots",
                "lightsail:DeleteRelationalDatabaseSnapshot",
                "lightsail:CreateInstanceSnapshot"
            ],
            "Resource": "*"
        }
    ]
}
```

- Click **Review Policy**, and use the name **lightsail-snapshots**, and click **Create Policy**.

### Create IAM role: lightsail-snapshots-role

- In the [IAM console](https://console.aws.amazon.com/iam/), find **Roles** in the sidebar and click on **Create Role**
- Select **Lambda** in the services list and click **Next: Permissions**
- Use the search field to find and add **AWSLambdaBasicExecutionRole** and **lightsail-snapshots**
- Click **Next: Review**, use the name **lightsail-snapshots-role**, and click **Create Role**

### Create Lambda functions

We need to create a lambda function **for each instance and database** that we want to backup automatically:

- Head over to the [Lambda console](https://console.aws.amazon.com/lambda) and click **Create Function**
- Use the **Author from Scratch** option, give the function whatever name you want, use the Node.js 10.x runtime, select **Choose an existing role** > **lightsail-snapshots-role**, and click **Create Function**.
- In the designer section, click **Add trigger**, select **CloudWatch Events**, select **Create a new rule**, give the rule whatever name you want, enter **rate(1 day)** for the Schedule Expression, make sure Enable Trigger is selected, and click **Add**.
- In the function code section, open the index.js file, remove any existing code from this file, and paste the contents of [backup_instance.js](https://raw.githubusercontent.com/Amit-A/automate-lightsail-backups/master/backup_instance.js) to use this function for **instance backups** or [backup_database.js](https://raw.githubusercontent.com/Amit-A/automate-lightsail-backups/master/backup_database.js) for **database backups**.
- Add the required environment variables (see the comment at the top of backup_instance.js or backup_database.js)
- **Set the timeout** to 5 minutes, set reserve concurrency = 1, and click **Save**.

Tada! It's setup. Make sure that you test it.

## License

[Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0)

Copyright 2019 Amit-A
