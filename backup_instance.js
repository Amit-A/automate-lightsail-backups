'use strict';

/*
  Make sure that you set the required environment variables:
    INSTANCE_NAME: the name of the lightsail instance you want this function to backup
    BACKUP_DAYS_MAX: keep the last BACKUP_DAYS_MAX daily backups
    BACKUP_WEEKS_MAX: keep at least BACKUP_WEEKS_MAX weekly backups
    BACKUP_MONTHS_MAX: keep at least BACKUP_MONTHS_MAX monthly backups
    LIGHTSAIL_REGION: the region where your lightsail instance is located (e.g. us-east-1)
  And any optional environment variables:
    PREFIX: prefix for snapshot names (prevents conflicts with other instance snapshots)
*/

exports.handler = (event, context, callback) => {
  
  /*
   * Load configuration from environment variables
   */

  console.log('Initializing...');

  if (!process.env.INSTANCE_NAME) { throw new Error('INSTANCE_NAME environment variable required!'); }
  const instanceName = process.env.INSTANCE_NAME;

  if (!process.env.BACKUP_DAYS_MAX) { throw new Error('BACKUP_DAYS_MAX environment variable required!'); }
  const backupDaysMax = process.env.BACKUP_DAYS_MAX;

  if (!process.env.BACKUP_WEEKS_MAX) { throw new Error('BACKUP_WEEKS_MAX environment variable required!'); }
  const backupWeeksMax = process.env.BACKUP_WEEKS_MAX;

  if (!process.env.BACKUP_MONTHS_MAX) { throw new Error('BACKUP_MONTHS_MAX environment variable required!'); }
  const backupMonthsMax = process.env.BACKUP_MONTHS_MAX;

  let prefix;
  if (!process.env.PREFIX) {
    console.warn('No PREFIX environment variable defined; defaulting to INSTANCE_NAME');
    prefix = instanceName;
  } else {
    prefix = process.env.PREFIX;
  }

  const AWS = require('aws-sdk');
  if (!process.env.LIGHTSAIL_REGION) { throw new Error('LIGHTSAIL_REGION environment variable required!'); }
  AWS.config.update({ region: process.env.LIGHTSAIL_REGION });
  const Lightsail = new AWS.Lightsail();

  /*
   * Create today's snapshot
   */

  const NOW = new Date();
  const currName = `${prefix}-auto-${NOW.getFullYear().toString()}-${NOW.getMonth().toString()}-${NOW.getDate().toString()}`;
  const oneDAY = 1000 * 60 * 60 * 24;

  Lightsail.getInstanceSnapshot({
    'instanceSnapshotName': currName
  }, function (err, data) {
    if (err) {
      console.log('Creating today\'s snapshot...');
      // no auto snapshot exists for today, so let's make it
      Lightsail.createInstanceSnapshot({
        instanceName: instanceName,
        'instanceSnapshotName': currName
      }, function (err, data) {
        if (err) {
          console.warn('Snapshot creation failed!');
          console.error(err);
        } else {
          console.log('Snapshot creation succeeded');
          console.log(data);
        }
      });
    } else {
      console.warn('Skipping snapshot creation because there is already an automatic backup for this instance for today.');
      console.log(data);
    }
  });

  /*
   * Delete old snapshots
   */

  // setup the recursive function
  function handleSnapshots(err, data) {
    if (err) {
      console.error(err);
    } else {
      console.log('Looking for old snapshots to delete/expire, if any...');
      // browse through snapshots...
      for (let i = 0; i < data.instanceSnapshots.length; i++) {
        const snapshotName = data.instanceSnapshots[i].name;
        const snapshotInstanceName = data.instanceSnapshots[i].fromInstanceName;
        if (
          (snapshotInstanceName === instanceName) && // match this instance
          (snapshotName.startsWith(`${prefix}-auto-`)) // only match automated snapshots
        ) {
          let keepSnapshot = false;
          const snapshotDate = new Date(data.instanceSnapshots[i].createdAt);
          const snapshotDaysAgo = Math.floor((NOW - snapshotDate) / oneDAY);
          const snapshotWeeksAgo = Math.floor((NOW - snapshotDate) / (oneDAY * 7));
          const snapshotMonthsAgo = Math.floor((NOW - snapshotDate) / (oneDAY * 30));
          if (snapshotDaysAgo <= backupDaysMax) {
            keepSnapshot = true;
          } else if (snapshotWeeksAgo <= backupWeeksMax && snapshotDate.getDay() === 0) {
            keepSnapshot = true;
          } else if (snapshotMonthsAgo <= backupMonthsMax && snapshotDate.getDate() === 0) {
            keepSnapshot = true;
          }
          if (keepSnapshot) {
            console.log(`Keeping ${snapshotName}`);
          } else {
            console.log(`Deleting ${snapshotName}`);
            Lightsail.deleteInstanceSnapshot({
              'instanceSnapshotName': snapshotName
            }, function (err2, data2) {
              if (err2) {
                console.error(err2);
              } else {
                console.log(`Deleted ${snapshotName}`);
                console.log(data2);
              }
            });
          }
        }
      }
      // pagenate and use recursion (for when we have lots of snapshots)
      if (typeof data.nextPageToken != 'undefined') {
        console.log('Recursing to next page (old snapshots)...');
        Lightsail.getInstanceSnapshots({
          pageToken: data.nextPageToken
        }, handleSnapshots);
      }
    }
  }
  // run the recursive function
  Lightsail.getInstanceSnapshots({}, handleSnapshots);
};
